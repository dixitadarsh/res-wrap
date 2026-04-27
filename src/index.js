// Core builders — framework agnostic
export {
  ok, created, accepted, noContent,
  badRequest, unauthorized, forbidden, notFound,
  conflict, unprocessable, tooManyRequests, serverError,
  paginated, validationError, custom,
} from './core.js';

// Express adapter
export { resHandler, errorHandler } from './adapters/express.js';

// NestJS adapter
export { ResponseInterceptor, HttpExceptionFilter, R } from './adapters/nest.js';

// Short alias
export { R as response } from './adapters/nest.js';
