const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');

process.env.DATABASE_URL ||= 'mongodb://localhost:27017/territory-tests';
process.env.JWT_SECRET ||= 'territory-test-secret';
process.env.JWT_ACCESS_SECRET ||= 'territory-test-access';
process.env.JWT_REFRESH_SECRET ||= 'territory-test-refresh';
const models = ['systemUser', 'doctor', 'doctorVisitLog', 'staff', 'client', 'order', 'deliveryCollection', 'wholesaler', 'mioZoneAllocation', 'territoryTarget'];
const unexpected = async () => { throw new Error('Unexpected database operation'); };
global.prisma = Object.fromEntries(['territory', ...models].map(model => [model, Object.fromEntries(
  ['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'count'].map(method => [method, unexpected])
)]));
global.prisma.$transaction = unexpected;
const prisma = require('../dist/utils/prisma').default;
const { territoryService } = require('../dist/services/territoryService');
const { auditLogService } = require('../dist/services/auditLogService');
const { createTerritorySchema, updateTerritorySchema, territoryIdParamSchema, queryTerritorySchema } = require('../dist/validations/territoryValidation');
const id = '000000000000000000000001';
const otherId = '000000000000000000000002';
const master = { id, name: 'Old Territory', division: 'Division A', status: 'Active' };
let saved;
let assignmentWrites;

beforeEach(() => {
  saved = { ...master };
  assignmentWrites = [];
  mock.method(prisma.territory, 'findUnique', async ({ where }) => where.id === id ? { ...saved } : null);
  mock.method(prisma.territory, 'findFirst', async () => null);
  mock.method(prisma.territory, 'findMany', async () => [{ ...saved }]);
  mock.method(prisma.territory, 'count', async () => 1);
  mock.method(prisma.territory, 'create', async ({ data }) => ({ id, ...data }));
  mock.method(prisma.territory, 'update', async ({ data }) => (saved = { ...saved, ...data }));
  mock.method(prisma.territory, 'delete', async () => { const row = saved; saved = null; return row; });
  for (const model of models) {
    mock.method(prisma[model], 'count', async () => 0);
    mock.method(prisma[model], 'updateMany', async args => { assignmentWrites.push({ model, ...args }); return { count: 1 }; });
  }
  mock.method(prisma.doctor, 'findMany', async () => [{ id: otherId, territoryAndMio: 'Old Territory / MIO: Officer' }]);
  mock.method(prisma.doctor, 'update', async args => { assignmentWrites.push({ model: 'doctor', ...args }); return args.data; });
  mock.method(auditLogService, 'recordAuditEvent', async () => undefined);
  mock.method(prisma, '$transaction', async callback => {
    const previous = structuredClone(saved);
    const writes = structuredClone(assignmentWrites);
    try { return await callback(prisma); }
    catch (error) { saved = previous; assignmentWrites = writes; throw error; }
  });
});
afterEach(() => mock.restoreAll());

test('create trims input, defaults blank division, and audits the saved master', async () => {
  const input = createTerritorySchema.parse({ body: { name: ' New Territory ', division: ' ' } }).body;
  const result = await territoryService.createTerritory(input);
  assert.equal(result.name, 'New Territory');
  assert.equal(result.division, 'General Division');
  assert.equal(result.status, 'Active');
  assert.equal(auditLogService.recordAuditEvent.mock.calls[0].arguments[0].actionType, 'Territory Created');
});

test('duplicate names are rejected on create and edit before any write', async () => {
  prisma.territory.findFirst.mock.mockImplementation(async () => ({ ...master, id: otherId }));
  await assert.rejects(territoryService.createTerritory({ name: 'OLD TERRITORY' }), /already exists/);
  await assert.rejects(territoryService.updateTerritory(id, { ...master, name: 'OLD TERRITORY' }), /already exists/);
  assert.equal(prisma.territory.create.mock.callCount(), 0);
  assert.equal(prisma.territory.update.mock.callCount(), 0);
});

test('rename updates all ten assignment collections and preserves the doctor MIO suffix', async () => {
  const result = await territoryService.updateTerritory(id, { name: 'New Territory', division: 'Division B', status: 'Active' });
  assert.equal(result.name, 'New Territory');
  assert.deepEqual(assignmentWrites.map(write => write.model).sort(), [...models].sort());
  for (const write of assignmentWrites) {
    assert.equal(write.data.territory, 'New Territory');
    assert.equal(write.data.territoryId, id);
  }
  assert.equal(assignmentWrites.find(write => write.model === 'doctor').data.territoryAndMio, 'New Territory / MIO: Officer');
  assert.equal(assignmentWrites.find(write => write.model === 'mioZoneAllocation').data.division, 'Division B');
  const legacyMatch = assignmentWrites.find(write => write.model === 'client').where.OR[1].AND;
  assert.deepEqual(legacyMatch[0].OR, [{ territoryId: null }, { territoryId: { isSet: false } }]);
  assert.equal(legacyMatch[1].territory.equals, master.name);
  const audit = auditLogService.recordAuditEvent.mock.calls[0].arguments[0];
  assert.equal(audit.priorPayload.name, master.name);
  assert.equal(audit.newPayload.name, 'New Territory');
});

test('assignment update failures roll back the rename and do not audit success', async () => {
  prisma.mioZoneAllocation.updateMany.mock.mockImplementation(async () => { throw new Error('Assignment failure'); });
  await assert.rejects(territoryService.updateTerritory(id, { name: 'New', division: 'B', status: 'Active' }), /Assignment failure/);
  assert.deepEqual(saved, master);
  assert.equal(assignmentWrites.length, 0);
  assert.equal(auditLogService.recordAuditEvent.mock.callCount(), 0);
});

test('status changes preserve assignments; division changes synchronize allocations', async () => {
  await territoryService.updateTerritory(id, { ...master, status: 'Inactive' });
  assert.equal(saved.status, 'Inactive');
  assert.equal(assignmentWrites.length, 0);
  await territoryService.updateTerritory(id, { ...master, division: 'Division B' });
  assert.equal(assignmentWrites.length, 1);
  assert.equal(assignmentWrites[0].model, 'mioZoneAllocation');
  assert.equal(assignmentWrites[0].data.division, 'Division B');
});

for (const model of models) {
  test(`deletion is blocked when ${model} references the territory`, async () => {
    prisma[model].count.mock.mockImplementation(async () => 1);
    await assert.rejects(territoryService.deleteTerritory(id), error => error.statusCode === 409 && /Inactive/.test(error.message));
    assert.equal(prisma.territory.delete.mock.callCount(), 0);
    assert.equal(auditLogService.recordAuditEvent.mock.callCount(), 0);
  });
}

test('unused territory deletion is audited and also checks legacy doctor combined labels', async () => {
  const result = await territoryService.deleteTerritory(id);
  assert.equal(result.id, id);
  assert.equal(saved, null);
  const where = prisma.doctor.count.mock.calls[0].arguments[0].where;
  assert.equal(where.OR[1].AND[2].OR[1].territoryAndMio.startsWith, 'Old Territory / ');
  assert.equal(auditLogService.recordAuditEvent.mock.calls[0].arguments[0].actionType, 'Territory Deleted');
});

test('missing masters return 404 on update and delete', async () => {
  await assert.rejects(territoryService.updateTerritory(otherId, master), error => error.statusCode === 404);
  await assert.rejects(territoryService.deleteTerritory(otherId), error => error.statusCode === 404);
});

test('lists filter, sort, and page on the backend and clamp an emptied last page', async () => {
  prisma.territory.count.mock.mockImplementation(async () => 11);
  const result = await territoryService.listTerritories({ page: 3, limit: 10, search: 'North', status: 'Inactive', sortBy: 'division', sortOrder: 'desc' });
  const query = prisma.territory.findMany.mock.calls[0].arguments[0];
  assert.equal(query.skip, 10);
  assert.equal(query.take, 10);
  assert.equal(query.where.status, 'Inactive');
  assert.equal(query.where.OR[0].name.contains, 'North');
  assert.deepEqual(query.orderBy, [{ division: 'desc' }, { id: 'asc' }]);
  assert.equal(result.meta.page, 2);
  assert.equal(result.meta.totalPage, 2);
  await territoryService.listTerritories();
  assert.equal(prisma.territory.findMany.mock.calls[1].arguments[0].take, undefined);
});

test('validation rejects malformed IDs, empty names, unsupported status, and unsafe query values', () => {
  for (const schema of [createTerritorySchema, updateTerritorySchema]) {
    for (const body of [{ name: ' ' }, { name: 'Valid', status: 'Deleted' }, { name: 'Valid', id }, { name: 'x'.repeat(201) }]) {
      assert.equal(schema.safeParse({ body }).success, false);
    }
  }
  assert.equal(territoryIdParamSchema.safeParse({ params: { id: 'bad-id' } }).success, false);
  for (const query of [{ page: '-1' }, { limit: '1000' }, { sortBy: 'passwordHash' }, { status: 'unknown' }]) {
    assert.equal(queryTerritorySchema.safeParse({ query }).success, false);
  }
  assert.equal(queryTerritorySchema.safeParse({ query: { page: '1', limit: '10' } }).success, true);
});

test('mutation routes authenticate and enforce action-specific permissions, preserving target creation', async () => {
  const router = require('../dist/routes/territoryRoutes').default;
  const run = (middleware, req) => new Promise(resolve => middleware(req, {}, resolve));
  for (const [method, action] of [['post', 'create'], ['put', 'edit'], ['delete', 'delete']]) {
    const route = router.stack.find(layer => layer.route?.methods[method]).route;
    assert.equal((await run(route.stack[0].handle, { headers: {}, cookies: {} })).statusCode, 401);
    const user = permission => ({ user: { role: { code: 'STAFF', permissions: [permission] } } });
    assert.equal((await run(route.stack[1].handle, user({ module: 'Territory Sales Breakdown', read: true }))).statusCode, 403);
    assert.equal(await run(route.stack[1].handle, user({ module: 'Territory Sales Breakdown', [action]: true })), undefined);
    const targets = await run(route.stack[1].handle, user({ module: 'Target Vs Achievement', [action]: true }));
    assert.equal(method === 'post' ? targets : targets.statusCode, method === 'post' ? undefined : 403);
  }
});
