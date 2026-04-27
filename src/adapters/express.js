import * as core from '../core.js';

/**
 * Express middleware — adds helper methods to res object
 *
 * @example
 * app.use(resHandler())
 *
 * // Then in routes:
 * res.ok(users, 'Users fetched')
 * res.created(user, 'User created')
 * res.notFound('User not found')
 * res.paginated(users, { page: 1, limit: 10, total: 245 })
 * res.validationError([{ field: 'email', message: 'Invalid' }])
 */
export function resHandler() {
  return (req, res, next) => {
    // Success
    res.ok = (data, message, meta) => {
      const body = core.ok(data, message, meta);
      return res.status(200).json(body);
    };

    res.created = (data, message) => {
      const body = core.created(data, message);
      return res.status(201).json(body);
    };

    res.accepted = (data, message) => {
      const body = core.accepted(data, message);
      return res.status(202).json(body);
    };

    res.noContent = () => {
      return res.status(204).send();
    };

    res.paginated = (data, options) => {
      const body = core.paginated(data, options);
      return res.status(200).json(body);
    };

    // Errors
    res.badRequest = (message, options) => {
      const body = core.badRequest(message, options);
      return res.status(400).json(body);
    };

    res.unauthorized = (message, options) => {
      const body = core.unauthorized(message, options);
      return res.status(401).json(body);
    };

    res.forbidden = (message, options) => {
      const body = core.forbidden(message, options);
      return res.status(403).json(body);
    };

    res.notFound = (message, options) => {
      const body = core.notFound(message, options);
      return res.status(404).json(body);
    };

    res.conflict = (message, options) => {
      const body = core.conflict(message, options);
      return res.status(409).json(body);
    };

    res.validationError = (errors, message) => {
      const body = core.validationError(errors, message);
      return res.status(422).json(body);
    };

    res.tooManyRequests = (message, options) => {
      const body = core.tooManyRequests(message, options);
      return res.status(429).json(body);
    };

    res.serverError = (message, options) => {
      const body = core.serverError(message, options);
      return res.status(500).json(body);
    };

    res.send$ = (statusCode, success, message, data, error, meta) => {
      const body = core.custom(statusCode, success, message, data, error, meta);
      return res.status(statusCode).json(body);
    };

    next();
  };
}

/**
 * Global error handler middleware
 * Place AFTER all routes
 *
 * @example
 * app.use(errorHandler())
 */
export function errorHandler() {
  return (err, req, res, next) => {
    const status  = err.status || err.statusCode || 500;
    const message = err.message || 'Internal server error';
    const code    = err.code || 'SERVER_ERROR';

    // Validation errors (e.g. from Joi, Zod, class-validator)
    if (err.name === 'ValidationError' || err.isJoi) {
      const body = core.validationError(
        err.details?.map(d => ({ field: d.path?.join('.'), message: d.message })) || [],
        'Validation failed'
      );
      return res.status(422).json(body);
    }

    const body = core.custom(status, false, message, null, { code });
    return res.status(status).json(body);
  };
}
