const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');

// Isolated database stubs: these tests never connect to MongoDB.
process.env.DATABASE_URL = 'mongodb://localhost:27017/order-edit-tests';
process.env.JWT_SECRET = 'order-edit-test-secret';
process.env.JWT_ACCESS_SECRET = 'order-edit-test-access';
process.env.JWT_REFRESH_SECRET = 'order-edit-test-refresh';
global.prisma = { $transaction: async () => { throw new Error('Unexpected transaction'); } };
const prisma = require('../dist/utils/prisma').default;
const { orderService } = require('../dist/services/orderService');
const { auditLogService } = require('../dist/services/auditLogService');
const batches = require('../dist/services/productBatchService');
const { createOrderSchema, updateOrderSchema } = require('../dist/validations/orderValidation');
const id = '000000000000000000000001';
const territoryId = '000000000000000000000002';
let state;
let stockWrites;
const input = (overrides = {}) => ({
  pharmacyName: 'Test Pharmacy', territoryId, territory: 'Test Territory', assignedMio: 'Officer',
  contactNo: '01700 123456',
  itemsDetail: [{ description: 'Product A', quantity: 5, unitCost: 20, total: 100 }],
  discountPercent: 0, comments: 'Corrected', deliveryMethod: 'Sales Representative', ...overrides,
});

beforeEach(() => {
  stockWrites = 0;
  state = {
    order: { id, orderNumber: 'SO-TEST', invoiceNumber: 'INV-TEST', challanNumber: 'DC-TEST',
      orderDate: '2026-11-16', status: 'FEFO Allocated', pharmacyName: 'Test Pharmacy',
      territoryId, territory: 'Test Territory', assignedMio: 'Officer', paymentTerms: '30 days',
      itemsDetail: [{ no: 1, description: 'Product A', quantity: 5, unitCost: 20, total: 100 }],
      orderValue: 100, paidAmount: 0, discount: 0 },
    stock: [{ id: 'batch-a', brandName: 'Product A', availableUnits: 20, expiryDate: '2030-01-01', warehouseBin: 'A1' }],
    clients: [{ id: 'client-a', pharmacyName: 'Test Pharmacy', outstandingBalanceBDT: 100 }],
    collections: [],
  };
  mock.method(auditLogService, 'recordAuditEvent', async () => undefined);
  mock.method(batches, 'mirrorBatchQuantity', async () => undefined);
  mock.method(prisma, '$transaction', async callback => {
    const draft = structuredClone(state);
    const result = await callback({
      order: {
        findUnique: async () => draft.order,
        update: async ({ data }) => (draft.order = { ...draft.order, ...data }),
      },
      territory: { findUnique: async () => ({ id: territoryId, name: 'Test Territory', status: 'Active' }) },
      deliveryCollection: { findMany: async () => draft.collections },
      inventoryBatch: {
        findMany: async ({ where }) => draft.stock.filter(batch => batch.brandName.toLowerCase() === where.OR[0].brandName.equals),
        update: async ({ where, data }) => {
          stockWrites++;
          const batch = draft.stock.find(batch => batch.id === where.id);
          batch.availableUnits += (data.availableUnits.increment || 0) - (data.availableUnits.decrement || 0);
          return batch;
        },
      },
      client: {
        findMany: async ({ where }) => draft.clients.filter(client => client.pharmacyName.toLowerCase() === where.pharmacyName.equals.toLowerCase()),
        update: async ({ where, data }) => {
          const client = draft.clients.find(client => client.id === where.id);
          client.outstandingBalanceBDT += data.outstandingBalanceBDT.increment;
          return client;
        },
      },
    });
    state = draft;
    return result;
  });
});
afterEach(() => mock.restoreAll());

test('price and discount edits recalculate totals, adjust receivables and preserve invoice identity without allocating stock again', async () => {
  const saved = await orderService.updateOrder(id, input({
    itemsDetail: [{ description: 'Product A', quantity: 5, unitCost: 30, total: 1 }], discountPercent: 10,
  }));
  assert.equal(saved.itemsDetail[0].total, 150);
  assert.equal(saved.discount, 15);
  assert.equal(saved.orderValue, 135);
  assert.equal(saved.contactNo, '01700 123456');
  assert.equal(state.clients[0].outstandingBalanceBDT, 135);
  assert.equal(stockWrites, 0);
  for (const [field, value] of Object.entries({ orderNumber: 'SO-TEST', invoiceNumber: 'INV-TEST', challanNumber: 'DC-TEST', orderDate: '2026-11-16', paymentTerms: '30 days', status: 'FEFO Allocated' })) {
    assert.equal(saved[field], value);
  }
  assert.equal(auditLogService.recordAuditEvent.mock.callCount(), 1);
});

test('increased quantity consumes only the extra units across FEFO batches and mirrors their quantities', async () => {
  state.stock[0].availableUnits = 2;
  state.stock.push({ ...state.stock[0], id: 'batch-b', availableUnits: 10, expiryDate: '2031-01-01' });
  await orderService.updateOrder(id, input({ itemsDetail: [{ description: 'Product A', quantity: 9, unitCost: 20 }] }));
  assert.deepEqual(state.stock.map(batch => batch.availableUnits), [0, 8]);
  assert.equal(batches.mirrorBatchQuantity.mock.callCount(), 2);
  assert.equal(state.order.orderValue, 180);
});

test('reducing a quantity returns only the difference to a single unambiguous batch', async () => {
  await orderService.updateOrder(id, input({ itemsDetail: [{ description: 'Product A', quantity: 2, unitCost: 20 }] }));
  assert.equal(state.stock[0].availableUnits, 23);
  assert.equal(state.clients[0].outstandingBalanceBDT, 40);
});

test('split duplicate product rows do not allocate stock twice', async () => {
  await orderService.updateOrder(id, input({ itemsDetail: [
    { description: 'Product A', quantity: 2, unitCost: 20 },
    { description: 'Product A', quantity: 3, unitCost: 20 },
  ] }));
  assert.equal(stockWrites, 0);
  assert.equal(state.order.orderValue, 100);
});

test('insufficient stock rolls back earlier stock changes and leaves the order and balance intact', async () => {
  state.stock.push({ id: 'batch-b', brandName: 'Product B', availableUnits: 1, expiryDate: '2030-01-01', warehouseBin: 'A1' });
  const prior = structuredClone(state);
  await assert.rejects(orderService.updateOrder(id, input({ itemsDetail: [
    { description: 'Product A', quantity: 6, unitCost: 20 },
    { description: 'Product B', quantity: 2, unitCost: 20 },
  ] })), /Insufficient stock/);
  assert.ok(stockWrites > 0);
  assert.deepEqual(state, prior);
  assert.equal(auditLogService.recordAuditEvent.mock.callCount(), 0);
});

test('ambiguous historical batch returns are rejected without modifying stock', async () => {
  state.stock.push({ ...state.stock[0], id: 'batch-b' });
  await assert.rejects(orderService.updateOrder(id, input({ itemsDetail: [{ description: 'Product A', quantity: 2, unitCost: 20 }] })), /no batch allocation history/);
  assert.equal(stockWrites, 0);
});

test('expired and quarantined stock cannot supply extra order quantities', async () => {
  state.stock[0].expiryDate = '2000-01-01';
  state.stock.push({ ...state.stock[0], id: 'batch-b', expiryDate: '2030-01-01', warehouseBin: 'Q-1' });
  await assert.rejects(orderService.updateOrder(id, input({ itemsDetail: [{ description: 'Product A', quantity: 6, unitCost: 20 }] })), /Insufficient stock/);
  assert.equal(stockWrites, 0);
});

test('recorded collections prevent undercutting paid amounts or changing the pharmacy', async () => {
  state.collections = [{ amountCollected: 80 }];
  await assert.rejects(orderService.updateOrder(id, input({ discountPercent: 50 })), /less than the amount already collected/);
  await assert.rejects(orderService.updateOrder(id, input({ pharmacyName: 'Other Pharmacy' })), /cannot be moved/);
  const saved = await orderService.updateOrder(id, input());
  assert.equal(saved.paidAmount, 80);
  assert.equal(saved.paymentStatus, 'PARTIALLY_PAID');
});

test('moving an unpaid order transfers the receivable to the new pharmacy', async () => {
  state.clients.push({ id: 'client-b', pharmacyName: 'Other Pharmacy', outstandingBalanceBDT: 40 });
  await orderService.updateOrder(id, input({ pharmacyName: 'Other Pharmacy' }));
  assert.deepEqual(state.clients.map(client => client.outstandingBalanceBDT), [0, 140]);
});

test('missing and cancelled orders cannot be edited', async () => {
  state.order.status = 'Cancelled';
  await assert.rejects(orderService.updateOrder(id, input()), /Cancelled orders/);
  state.order = null;
  await assert.rejects(orderService.updateOrder(id, input()), /Order not found/);
});

test('validation rejects empty items, invalid quantities, negative prices, excessive discounts and identity/status overrides', () => {
  for (const overrides of [
    { itemsDetail: [] }, { itemsDetail: [{ description: 'Product A', quantity: 0, unitCost: 1 }] },
    { itemsDetail: [{ description: 'Product A', quantity: 1.5, unitCost: 1 }] },
    { itemsDetail: [{ description: 'Product A', quantity: 1, unitCost: -1 }] },
    { discountPercent: 101 }, { invoiceNumber: 'REPLACED' }, { status: 'Cancelled' }, { orderValue: 1 },
  ]) assert.equal(updateOrderSchema.safeParse({ params: { id }, body: input(overrides) }).success, false);
  assert.equal(updateOrderSchema.safeParse({ params: { id }, body: input() }).success, true);
});

test('the edit route requires authentication and Sales Orders edit permission before validation or writes', async () => {
  const router = require('../dist/routes/orderRoutes').default;
  const route = router.stack.find(layer => layer.route?.path === '/:id' && layer.route.methods.patch).route;
  const run = (middleware, req) => new Promise(resolve => middleware(req, {}, resolve));
  const missingAuth = await run(route.stack[0].handle, { headers: {}, cookies: {} });
  assert.equal(missingAuth.statusCode, 401);
  const forbidden = await run(route.stack[1].handle, { user: { role: { code: 'VIEWER', permissions: [{ module: 'Sales Orders', read: true, edit: false }] } } });
  assert.equal(forbidden.statusCode, 403);
  const allowed = await run(route.stack[1].handle, { user: { role: { code: 'EDITOR', permissions: [{ module: 'Sales Orders', edit: true }] } } });
  assert.equal(allowed, undefined);
});

test('create and edit require contact numbers as strings without imposing a phone pattern', () => {
  for (const schema of [createOrderSchema, updateOrderSchema]) {
    for (const contactNo of [undefined, '', '   ', 1700123456]) {
      assert.equal(schema.safeParse({ params: { id }, body: input({ contactNo }) }).success, false);
    }
    const parsed = schema.parse({ params: { id }, body: input({ contactNo: '  +880 1700-123456 ext 2  ' }) });
    assert.equal(parsed.body.contactNo, '+880 1700-123456 ext 2');
  }
});

test('creating an order persists its contact number independently of the client master', async () => {
  mock.method(prisma, '$transaction', async callback => callback({
    order: {
      findUnique: async () => null,
      create: async ({ data }) => ({ id, ...data }),
    },
    territory: { findUnique: async () => ({ id: territoryId, name: 'Test Territory', status: 'Active' }) },
    client: { findMany: async () => [], updateMany: async () => ({ count: 0 }) },
    mioZoneAllocation: { findMany: async () => [] },
    territoryTarget: { findMany: async () => [] },
  }));
  const created = await orderService.createOrder({ ...input(), orderNumber: 'SO-CONTACT', itemsDetail: [], contactNo: '  01700 123456  ' });
  assert.equal(created.contactNo, '01700 123456');
});
