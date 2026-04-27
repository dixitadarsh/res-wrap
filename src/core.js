/**
 * res-handler — Core Response Builder
 *
 * Every API response follows this exact structure:
 *
 * SUCCESS:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Users fetched successfully",
 *   "data": { ... },
 *   "meta": { "page": 1, "total": 45, "limit": 10 },
 *   "timestamp": "2026-04-21T09:15:42.000Z"
 * }
 *
 * ERROR:
 * {
 *   "success": false,
 *   "statusCode": 404,
 *   "message": "User not found",
 *   "error": {
 *     "code": "USER_NOT_FOUND",
 *     "details": "No user exists with id: u_123",
 *     "field": "userId"
 *   },
 *   "timestamp": "2026-04-21T09:15:42.000Z"
 * }
 */

// ── Success Responses ─────────────────────────────────────────────────────────

export function ok(data = null, message = 'Success', meta = null) {
  return build(200, true, message, data, null, meta);
}

export function created(data = null, message = 'Created successfully') {
  return build(201, true, message, data);
}

export function accepted(data = null, message = 'Accepted') {
  return build(202, true, message, data);
}

export function noContent() {
  return build(204, true, 'No content', null);
}

// ── Error Responses ───────────────────────────────────────────────────────────

export function badRequest(message = 'Bad request', options = {}) {
  return buildError(400, message, 'BAD_REQUEST', options);
}

export function unauthorized(message = 'Unauthorized', options = {}) {
  return buildError(401, message, 'UNAUTHORIZED', options);
}

export function forbidden(message = 'Forbidden', options = {}) {
  return buildError(403, message, 'FORBIDDEN', options);
}

export function notFound(message = 'Not found', options = {}) {
  return buildError(404, message, 'NOT_FOUND', options);
}

export function conflict(message = 'Conflict', options = {}) {
  return buildError(409, message, 'CONFLICT', options);
}

export function unprocessable(message = 'Validation failed', options = {}) {
  return buildError(422, message, 'UNPROCESSABLE', options);
}

export function tooManyRequests(message = 'Too many requests', options = {}) {
  return buildError(429, message, 'RATE_LIMITED', options);
}

export function serverError(message = 'Internal server error', options = {}) {
  return buildError(500, message, 'SERVER_ERROR', options);
}

// ── Pagination Helper ─────────────────────────────────────────────────────────

/**
 * Paginated response with full meta
 *
 * @example
 * paginated(users, { page: 2, limit: 10, total: 245 })
 */
export function paginated(data, options = {}) {
  const page  = options.page  || 1;
  const limit = options.limit || 10;
  const total = options.total || (Array.isArray(data) ? data.length : 0);

  const meta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext:    page < Math.ceil(total / limit),
    hasPrev:    page > 1,
  };

  return build(200, true, options.message || 'Data fetched successfully', data, null, meta);
}

// ── Validation Error Helper ───────────────────────────────────────────────────

/**
 * Structured validation error response
 *
 * @example
 * validationError([
 *   { field: 'email', message: 'Invalid email format' },
 *   { field: 'phone', message: 'Phone is required' },
 * ])
 */
export function validationError(errors = [], message = 'Validation failed') {
  return {
    success:    false,
    statusCode: 422,
    message,
    error: {
      code:    'VALIDATION_ERROR',
      errors,   // array of { field, message, value? }
    },
    timestamp: new Date().toISOString(),
  };
}

// ── Custom Response ───────────────────────────────────────────────────────────

export function custom(statusCode, success, message, data = null, error = null, meta = null) {
  return build(statusCode, success, message, data, error, meta);
}

// ── Internal builders ─────────────────────────────────────────────────────────

function build(statusCode, success, message, data, error = null, meta = null) {
  const res = {
    success,
    statusCode,
    message,
    ...(data  !== undefined && data  !== null ? { data }  : {}),
    ...(error !== undefined && error !== null ? { error } : {}),
    ...(meta  !== undefined && meta  !== null ? { meta }  : {}),
    timestamp: new Date().toISOString(),
  };
  return res;
}

function buildError(statusCode, message, code, options = {}) {
  const error = {
    code,
    ...(options.details ? { details: options.details } : {}),
    ...(options.field   ? { field:   options.field   } : {}),
    ...(options.errors  ? { errors:  options.errors  } : {}),
  };
  return build(statusCode, false, message, null, error);
}
