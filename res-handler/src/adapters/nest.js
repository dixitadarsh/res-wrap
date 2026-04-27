import * as core from '../core.js';

/**
 * NestJS Response Interceptor
 * Wraps all controller return values in standard format
 *
 * @example
 * // main.ts
 * app.useGlobalInterceptors(new ResponseInterceptor())
 *
 * // Or per-controller / per-route:
 * @UseInterceptors(ResponseInterceptor)
 * @Controller('users')
 * export class UsersController {}
 */
export class ResponseInterceptor {
  intercept(context, next) {
    return next.handle().pipe(
      // Dynamically import rxjs to avoid hard dependency
      ...this._getOperators()
    );
  }

  _getOperators() {
    // Returns rxjs map operator — lazy import
    try {
      const { map } = require('rxjs/operators');
      return [map(data => {
        const ctx    = arguments[0]; // context from intercept
        const res    = ctx.switchToHttp().getResponse();
        const status = res.statusCode || 200;
        return core.custom(status, true, 'Success', data);
      })];
    } catch {
      return [];
    }
  }
}

/**
 * NestJS Exception Filter
 * Catches all exceptions and formats them consistently
 *
 * @example
 * app.useGlobalFilters(new HttpExceptionFilter())
 */
export class HttpExceptionFilter {
  catch(exception, host) {
    const ctx    = host.switchToHttp();
    const res    = ctx.getResponse();
    const status = exception.getStatus ? exception.getStatus() : 500;
    const message = exception.message || 'Internal server error';

    const body = core.custom(status, false, message, null, {
      code: exception.name || 'SERVER_ERROR',
    });

    res.status(status).json(body);
  }
}

/**
 * Direct response builders for NestJS services/controllers
 *
 * @example
 * import { R } from 'res-handler/nest';
 *
 * return R.ok(users, 'Users fetched');
 * return R.paginated(users, { page: 1, limit: 10, total: 100 });
 * throw new NotFoundException(R.notFound('User not found'));
 */
export const R = {
  ok:             core.ok,
  created:        core.created,
  accepted:       core.accepted,
  paginated:      core.paginated,
  badRequest:     core.badRequest,
  unauthorized:   core.unauthorized,
  forbidden:      core.forbidden,
  notFound:       core.notFound,
  conflict:       core.conflict,
  validationError: core.validationError,
  tooManyRequests: core.tooManyRequests,
  serverError:    core.serverError,
  custom:         core.custom,
};
