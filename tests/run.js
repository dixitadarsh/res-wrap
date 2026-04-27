/**
 * Tests for res-handler
 * Run: node tests/run.js
 */

import { ok, created, notFound, paginated, validationError, badRequest, serverError } from '../src/index.js';

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \x1b[92m✓\x1b[0m  ${name}`);
    passed++;
  } catch(e) {
    console.log(`  \x1b[91m✗\x1b[0m  ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

console.log('\n\x1b[1m\x1b[96m  res-handler — Tests\x1b[0m\n');

test('ok() returns correct structure', () => {
  const res = ok({ id: 1 }, 'Fetched');
  assert(res.success === true);
  assert(res.statusCode === 200);
  assert(res.message === 'Fetched');
  assert(res.data.id === 1);
  assert(res.timestamp);
});

test('created() returns 201', () => {
  const res = created({ id: 1 });
  assert(res.statusCode === 201);
  assert(res.success === true);
});

test('notFound() returns correct error structure', () => {
  const res = notFound('User not found', { field: 'userId' });
  assert(res.success === false);
  assert(res.statusCode === 404);
  assert(res.error.code === 'NOT_FOUND');
  assert(res.error.field === 'userId');
  assert(!res.data);
});

test('paginated() returns correct meta', () => {
  const data = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
  const res  = paginated(data, { page: 2, limit: 10, total: 100 });
  assert(res.success === true);
  assert(res.meta.page === 2);
  assert(res.meta.total === 100);
  assert(res.meta.totalPages === 10);
  assert(res.meta.hasNext === true);
  assert(res.meta.hasPrev === true);
});

test('paginated() hasNext false on last page', () => {
  const res = paginated([], { page: 5, limit: 10, total: 50 });
  assert(res.meta.hasNext === false);
  assert(res.meta.hasPrev === true);
});

test('validationError() returns errors array', () => {
  const errors = [
    { field: 'email', message: 'Invalid email' },
    { field: 'phone', message: 'Required' },
  ];
  const res = validationError(errors);
  assert(res.statusCode === 422);
  assert(res.error.code === 'VALIDATION_ERROR');
  assert(res.error.errors.length === 2);
  assert(res.error.errors[0].field === 'email');
});

test('badRequest() returns 400', () => {
  const res = badRequest('Invalid input');
  assert(res.statusCode === 400);
  assert(res.success === false);
  assert(res.error.code === 'BAD_REQUEST');
});

test('serverError() returns 500', () => {
  const res = serverError();
  assert(res.statusCode === 500);
  assert(res.success === false);
});

test('ok() with meta', () => {
  const res = ok({ users: [] }, 'Users fetched', { cached: true });
  assert(res.meta.cached === true);
});

test('no data field in error response', () => {
  const res = notFound('Not found');
  assert(!('data' in res));
});

test('no error field in success response', () => {
  const res = ok({ id: 1 });
  assert(!('error' in res));
});

console.log('\n  ' + '─'.repeat(38));
console.log(`  \x1b[1mResults: ${passed}/${passed+failed} passed\x1b[0m`);
if (failed === 0) console.log('  \x1b[92m✓ All tests passed!\x1b[0m');
console.log('');

process.exit(failed > 0 ? 1 : 0);
