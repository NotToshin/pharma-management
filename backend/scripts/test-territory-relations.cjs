const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');

// The services are tested against stubs; no database or secrets are required.
process.env.DATABASE_URL ||= 'mongodb://localhost:27017/territory-tests';
process.env.JWT_SECRET ||= 'territory-test-secret';
process.env.JWT_ACCESS_SECRET ||= 'territory-test-access';
process.env.JWT_REFRESH_SECRET ||= 'territory-test-refresh';
const unexpected = async () => { throw new Error('Unexpected database operation in test'); };
global.prisma = Object.fromEntries(['territory', 'systemUser', 'systemRole', 'staff', 'mioZoneAllocation', 'territoryTarget', 'doctor', 'client', 'order', 'deliveryCollection']
  .map(model => [model, Object.fromEntries(['findUnique', 'findUniqueOrThrow', 'findFirst', 'findMany', 'create', 'createMany', 'update', 'updateMany', 'count']
    .map(method => [method, unexpected]))]));
global.prisma.$transaction = unexpected;
const prisma = require('../dist/utils/prisma').default;
const { resolveTerritoryAssignment, doctorTerritoryInput } = require('../dist/services/territoryAssignment');
const { rbacService } = require('../dist/services/rbacService');
const { territoryService } = require('../dist/services/territoryService');
const { territoryTargetService } = require('../dist/services/territoryTargetService');
const { zoneAllocationService } = require('../dist/services/zoneAllocationService');
const { auditLogService } = require('../dist/services/auditLogService');
const { provisionUserSchema, updateUserSchema } = require('../dist/validations/rbacValidation');
const { clientService } = require('../dist/services/clientService');
const { doctorService } = require('../dist/services/doctorService');
const { bulkImportDoctorSchema } = require('../dist/validations/doctorValidation');
const { collectionService } = require('../dist/services/collectionService');
const master = { id: '000000000000000000000001', name: 'Test Territory', division: 'Test Division', status: 'Active' };
const otherId = '000000000000000000000002';
const role = { id: '000000000000000000000003', code: 'MIO_FIELD', name: 'Field Officer' };

test('collection invoice defaults follow the current pharmacy territory after reassignment', async () => {
  const oldTerritory = { id: otherId, name: 'Dhaka North' };
  const currentTerritory = { id: master.id, name: 'Dhaka South' };
  mock.method(prisma.order, 'findUnique', async () => ({ id: otherId, pharmacyName: 'Test Pharmacy', territoryId: oldTerritory.id, territory: oldTerritory.name, territoryRef: oldTerritory, assignedMio: 'Order Officer', status: 'Delivered & Invoiced' }));
  mock.method(prisma.client, 'findMany', async () => [{ clientCode: 'CLIENT-TEST', pharmacyName: 'Test Pharmacy', territoryId: currentTerritory.id, territory: currentTerritory.name, territoryRef: currentTerritory, assignedMio: 'Current Officer' }]);
  const result = await collectionService.getOrderContext(otherId);
  assert.equal(result.territoryId, currentTerritory.id);
  assert.equal(result.territory, 'Dhaka South');
  assert.equal(result.clientCode, 'CLIENT-TEST');
  assert.equal(result.salesRepName, 'Current Officer');
});

test('an unregistered pharmacy retains the order assignment as a fallback', async () => {
  mock.method(prisma.order, 'findUnique', async () => ({ id: otherId, pharmacyName: 'Unregistered Pharmacy', territoryId: master.id, territory: 'Old label', territoryRef: master, assignedMio: 'Officer', status: 'Delivered & Invoiced' }));
  mock.method(prisma.client, 'findMany', async () => []);
  const result = await collectionService.getOrderContext(otherId);
  assert.equal(result.clientCode, null);
  assert.equal(result.territory, master.name);
});

test('a registered client with no territory does not revive the old order territory', async () => {
  mock.method(prisma.order, 'findUnique', async () => ({ id: otherId, pharmacyName: 'Test Pharmacy', territoryId: master.id, territory: master.name, territoryRef: master, status: 'Delivered & Invoiced' }));
  mock.method(prisma.client, 'findMany', async () => [{ clientCode: 'CLIENT-TEST', pharmacyName: 'Test Pharmacy', territoryId: null, territory: null, territoryRef: null }]);
  const result = await collectionService.getOrderContext(otherId);
  assert.equal(result.territoryId, null);
  assert.equal(result.territory, '');
});

test('ambiguous pharmacy matches cannot silently supply an unrelated assignment', async () => {
  mock.method(prisma.order, 'findUnique', async () => ({ id: otherId, pharmacyName: 'Duplicate', status: 'Delivered & Invoiced' }));
  mock.method(prisma.client, 'findMany', async () => [{ clientCode: 'FIRST' }, { clientCode: 'SECOND' }]);
  await assert.rejects(collectionService.getOrderContext(otherId), error => error.statusCode === 409 || /Multiple pharmacy/.test(error.message));
});

test('missing or cancelled orders cannot provide collection context', async () => {
  mock.method(prisma.order, 'findUnique', async () => null);
  await assert.rejects(collectionService.getOrderContext(otherId), /not found/);
  prisma.order.findUnique.mock.mockImplementation(async () => ({ status: 'Cancelled' }));
  await assert.rejects(collectionService.getOrderContext(otherId), /cancelled/);
});

test('a saved collection uses the resolved client code for balance updates', async () => {
  mock.method(prisma.order, 'findUnique', async () => ({ id: otherId, orderValue: 100 }));
  mock.method(prisma.order, 'update', async () => ({}));
  mock.method(prisma.deliveryCollection, 'findMany', async () => []);
  mock.method(prisma.deliveryCollection, 'create', async ({ data }) => ({ ...data, id: otherId }));
  mock.method(prisma.client, 'findUnique', async () => ({ id: master.id, outstandingBalanceBDT: 100 }));
  mock.method(prisma.client, 'findFirst', unexpected);
  mock.method(prisma.client, 'update', async () => ({}));
  const result = await collectionService.createCollection({ receiptNo: 'TEST-RECEIPT', invoiceNo: 'TEST-INVOICE', orderId: otherId, clientCode: 'CLIENT-TEST', chemistName: 'Test Pharmacy', territoryId: master.id, territory: master.name, salesRepName: 'Officer', totalInvoiceAmount: 100, amountCollected: 50 });
  assert.equal(result.clientCode, 'CLIENT-TEST');
  assert.equal(result.territoryId, master.id);
  assert.deepEqual(prisma.client.findUnique.mock.calls[0].arguments[0].where, { clientCode: 'CLIENT-TEST' });
  assert.equal(prisma.client.findFirst.mock.callCount(), 0);
});

beforeEach(() => {
  mock.method(prisma.territory, 'findUnique', async ({ where }) => where.id === master.id ? master : null);
  mock.method(prisma.territory, 'findMany', async () => [master]);
  mock.method(prisma.territory, 'findUniqueOrThrow', async () => master);
  mock.method(auditLogService, 'recordAuditEvent', async () => undefined);
  mock.method(prisma, '$transaction', async callback => callback(prisma));
});
afterEach(() => mock.restoreAll());

test('an ID stores the canonical label even if the caller supplies a different label', async () => {
  assert.deepEqual(await resolveTerritoryAssignment({ territoryId: master.id, territory: 'Forged label' }), {
    territoryId: master.id, territory: master.name,
  });
});

test('legacy names are resolved case insensitively to the master ID', async () => {
  const result = await resolveTerritoryAssignment({ territory: ' test territory ' });
  assert.equal(result.territoryId, master.id);
  assert.equal(prisma.territory.findMany.mock.calls[0].arguments[0].where.name.mode, 'insensitive');
});

test('missing and malformed IDs do not fall back to an unrelated label', async () => {
  await assert.rejects(resolveTerritoryAssignment({ territoryId: otherId, territory: master.name }), /does not exist/);
  await assert.rejects(resolveTerritoryAssignment({ territoryId: 'bad-id' }), /Invalid territory ID/);
});

test('unknown and ambiguous names are rejected', async () => {
  prisma.territory.findMany.mock.mockImplementation(async () => []);
  await assert.rejects(resolveTerritoryAssignment({ territory: 'Unknown' }), /does not exist/);
  prisma.territory.findMany.mock.mockImplementation(async () => [master, { ...master, id: otherId }]);
  await assert.rejects(resolveTerritoryAssignment({ territory: master.name }), /ambiguous/);
});

test('inactive territories can be retained but cannot be newly assigned', async () => {
  prisma.territory.findUnique.mock.mockImplementation(async () => ({ ...master, status: 'Inactive' }));
  await assert.rejects(resolveTerritoryAssignment({ territoryId: master.id }), /inactive/);
  assert.equal((await resolveTerritoryAssignment({ territoryId: master.id }, { currentId: master.id })).territoryId, master.id);
});

test('optional assignments clear both fields, while required assignments reject a blank', async () => {
  assert.deepEqual(await resolveTerritoryAssignment({ territoryId: null, territory: '' }), { territoryId: null, territory: '' });
  await assert.rejects(resolveTerritoryAssignment({}, { required: true }), /Select a territory/);
});

test('combined doctor assignments preserve territory names that contain a slash', () => {
  assert.equal(doctorTerritoryInput({ territoryAndMio: 'Agrabad C/A / MIO: Officer' }).territory, 'Agrabad C/A');
  assert.equal(doctorTerritoryInput({ territoryAndMio: 'Unassigned' }).territory, '');
  assert.equal(doctorTerritoryInput({ territory: '', territoryAndMio: master.name }).territory, '');
});

test('provisioning requires a valid territory ID; updates may omit it', () => {
  const body = { name: 'Operator', email: 'operator@example.test', password: 'test-only-password', roleCode: role.code };
  assert.equal(provisionUserSchema.safeParse({ body }).success, false);
  assert.equal(provisionUserSchema.safeParse({ body: { ...body, territoryId: master.id } }).success, true);
  assert.equal(updateUserSchema.safeParse({ params: { id: otherId }, body: { name: 'Changed' } }).success, true);
});

test('provisioning persists the relation and returns its master data', async () => {
  mock.method(prisma.systemUser, 'findUnique', async () => null);
  mock.method(prisma.systemRole, 'findFirst', async () => role);
  mock.method(prisma.systemUser, 'create', async ({ data }) => ({ ...data, id: otherId, role, territoryRef: master }));
  const result = await rbacService.provisionUser({ name: 'Operator', email: 'operator@example.test', password: 'test-only-password', roleCode: role.code, territoryId: master.id });
  const saved = prisma.systemUser.create.mock.calls[0].arguments[0].data;
  assert.equal(saved.territoryId, master.id);
  assert.equal(saved.territory, master.name);
  assert.equal(result.territoryRef.division, master.division);
  assert.equal(result.passwordHash, undefined);
});

test('editing credentials without a territory preserves the existing assignment', async () => {
  const user = { id: otherId, email: 'operator@example.test', role, territoryId: master.id, territory: master.name };
  mock.method(prisma.systemUser, 'findUnique', async () => user);
  mock.method(prisma.systemUser, 'update', async ({ data }) => ({ ...user, ...data, territoryRef: master }));
  await rbacService.updateUser(otherId, { name: 'Changed' });
  const saved = prisma.systemUser.update.mock.calls[0].arguments[0].data;
  assert.equal(Object.hasOwn(saved, 'territoryId'), false);
  assert.equal(Object.hasOwn(saved, 'territory'), false);
});

test('editing a territory updates the relation and label together', async () => {
  const user = { id: otherId, email: 'operator@example.test', role, territoryId: null, territory: 'Legacy' };
  mock.method(prisma.systemUser, 'findUnique', async () => user);
  mock.method(prisma.systemUser, 'update', async ({ data }) => ({ ...user, ...data, territoryRef: master }));
  const result = await rbacService.updateUser(otherId, { territoryId: master.id });
  assert.equal(result.territoryId, master.id);
  assert.equal(result.territory, master.name);
});

test('invalid client import territory fails before any client rows are written', async () => {
  prisma.territory.findMany.mock.mockImplementation(async ({ where }) => where.name.equals === master.name ? [master] : []);
  mock.method(prisma.client, 'create', unexpected);
  await assert.rejects(clientService.bulkImportClients({ clients: [
    { pharmacyName: 'First', territory: master.name },
    { pharmacyName: 'Second', territory: 'Unknown' },
  ] }), /does not exist/);
  assert.equal(prisma.client.create.mock.callCount(), 0);
});

test('doctor imports retain legacy combined territory input and validate it before writes', async () => {
  const parsed = bulkImportDoctorSchema.parse({ body: { doctors: [
    { doctorName: 'First', bmdcRegNumber: 'TEST-1', territoryAndMio: `${master.name} / MIO: Officer` },
    { doctorName: 'Second', bmdcRegNumber: 'TEST-2', territoryAndMio: 'Unknown / MIO: Officer' },
  ] } }).body;
  prisma.territory.findMany.mock.mockImplementation(async ({ where }) => where.name.equals === master.name ? [master] : []);
  mock.method(prisma.doctor, 'create', unexpected);
  await assert.rejects(doctorService.bulkImportDoctors(parsed), /does not exist/);
  assert.equal(prisma.doctor.create.mock.callCount(), 0);
});

test('reading an empty master list does not seed hardcoded territories', async () => {
  prisma.territory.findMany.mock.mockImplementation(async () => []);
  mock.method(prisma.territory, 'createMany', async () => { throw new Error('Unexpected write'); });
  assert.deepEqual(await territoryService.getAllTerritories(), []);
  assert.equal(prisma.territory.createMany.mock.callCount(), 0);
});

test('an invalid target territory is rejected before a quota or master row is created', async () => {
  mock.method(prisma.territory, 'create', async () => { throw new Error('Unexpected write'); });
  mock.method(prisma.territoryTarget, 'create', async () => { throw new Error('Unexpected write'); });
  await assert.rejects(territoryTargetService.createTarget({ territoryId: otherId, territory: master.name, mioName: 'Officer', targetAmount: 100 }), /does not exist/);
  assert.equal(prisma.territoryTarget.create.mock.callCount(), 0);
  assert.equal(prisma.territory.create.mock.callCount(), 0);
});

test('zone allocations sync the same territory ID to staff inside a transaction', async () => {
  const staff = { id: otherId, fullName: 'Officer', empId: 'EMP-TEST', phone: 'required string' };
  mock.method(prisma.staff, 'findUnique', async () => staff);
  mock.method(prisma.staff, 'update', async ({ data }) => ({ ...staff, ...data }));
  mock.method(prisma.mioZoneAllocation, 'create', async ({ data }) => ({ ...data, id: otherId }));
  const result = await zoneAllocationService.createAllocation({ staffId: staff.id, mioName: staff.fullName, employeeId: staff.empId, phone: staff.phone, territoryId: master.id, territory: 'Caller label', division: 'Caller division', allocatedZone: 'Route' });
  assert.equal(result.territoryId, master.id);
  assert.equal(result.territory, master.name);
  assert.equal(result.division, master.division);
  assert.equal(prisma.staff.update.mock.calls[0].arguments[0].data.territoryId, master.id);
  assert.equal(prisma.$transaction.mock.callCount(), 1);
});
