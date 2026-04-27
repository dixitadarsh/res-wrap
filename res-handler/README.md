# res-wrap 📦

> Unified API response handler for **Express**, **NestJS** and **Fastify**.
> One consistent response format across your entire app. Zero dependencies.

[![npm version](https://img.shields.io/npm/v/res-wrap?color=39d0d8&labelColor=0d1117&style=flat-square)](https://www.npmjs.com/package/res-wrap)
[![Zero deps](https://img.shields.io/badge/dependencies-0-c678dd?labelColor=0d1117&style=flat-square)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-f0c429?labelColor=0d1117&style=flat-square)](LICENSE)

---

## Why?

Every project ends up with inconsistent API responses:

```js
// Different formats across the same codebase 😤
res.json({ data: users })
res.json({ success: true, result: users })
res.json({ users: users, status: 'ok' })
res.json({ error: 'not found' })
res.json({ message: 'User not found', code: 404 })
```

**res-wrap** enforces one format everywhere — always:

```json
// ✅ Every success response
{
  "success": true,
  "statusCode": 200,
  "message": "Users fetched successfully",
  "data": [...],
  "meta": { "page": 1, "total": 45, "totalPages": 5 },
  "timestamp": "2026-04-21T09:15:42.000Z"
}

// ✅ Every error response
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "error": {
    "code": "NOT_FOUND",
    "field": "userId"
  },
  "timestamp": "2026-04-21T09:15:42.000Z"
}
```

---

## Install

```bash
npm install res-wrap
```

---

## Express

### Setup

```js
import express from 'express';
import { resHandler, errorHandler } from 'res-wrap/express';

const app = express();
app.use(express.json());
app.use(resHandler());   // ← adds helpers to res object

// Routes here...

app.use(errorHandler()); // ← global error handler (put LAST)
```

### Usage in routes

```js
app.get('/users', async (req, res) => {
  const users = await User.findAll();
  res.ok(users, 'Users fetched successfully');
});

app.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.notFound('User not found', { field: 'id' });
  res.ok(user);
});

app.post('/users', async (req, res) => {
  const user = await User.create(req.body);
  res.created(user, 'User created successfully');
});

app.delete('/users/:id', async (req, res) => {
  await User.delete(req.params.id);
  res.noContent();
});
```

### All Express methods

```js
// ── Success ───────────────────────────────────────────────
res.ok(data, message?, meta?)        // 200
res.created(data, message?)          // 201
res.accepted(data, message?)         // 202
res.noContent()                      // 204

// ── Pagination ────────────────────────────────────────────
res.paginated(data, {
  page: 1,
  limit: 10,
  total: 245,
  message: 'Users fetched'   // optional
})

// ── Errors ────────────────────────────────────────────────
res.badRequest(message?, options?)       // 400
res.unauthorized(message?, options?)     // 401
res.forbidden(message?, options?)        // 403
res.notFound(message?, options?)         // 404
res.conflict(message?, options?)         // 409
res.validationError(errors, message?)    // 422
res.tooManyRequests(message?, options?)  // 429
res.serverError(message?, options?)      // 500
```

---

## NestJS

### Setup

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from 'res-wrap/nest';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter()); // format all errors
  await app.listen(3000);
}
```

### Usage in controllers/services

```ts
import { R } from 'res-wrap/nest';

@Controller('users')
export class UsersController {

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return R.ok(users, 'Users fetched');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException(R.notFound('User not found'));
    return R.ok(user);
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return R.created(user, 'User created');
  }

  @Get('list')
  async paginate(@Query() query: PaginateDto) {
    const { data, total } = await this.usersService.paginate(query);
    return R.paginated(data, {
      page: query.page,
      limit: query.limit,
      total,
    });
  }
}
```

---

## Framework-agnostic (core functions)

Works with any framework — just returns plain objects:

```js
import {
  ok, created, notFound, paginated,
  validationError, serverError, badRequest
} from 'res-wrap';

// Use directly — returns plain JS object
const response = ok(users, 'Fetched');
const error    = notFound('User not found', { field: 'userId' });
const page     = paginated(users, { page: 1, limit: 10, total: 100 });
```

---

## Pagination

```js
// Express
res.paginated(users, {
  page:  2,
  limit: 10,
  total: 245,
})

// Response:
{
  "success": true,
  "statusCode": 200,
  "message": "Data fetched successfully",
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 10,
    "total": 245,
    "totalPages": 25,
    "hasNext": true,
    "hasPrev": true
  },
  "timestamp": "..."
}
```

---

## Validation Errors

```js
// Express
res.validationError([
  { field: 'email', message: 'Invalid email format' },
  { field: 'phone', message: 'Phone number is required' },
  { field: 'age',   message: 'Must be at least 18' },
])

// Response:
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "errors": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "phone", "message": "Phone number is required" },
      { "field": "age",   "message": "Must be at least 18" }
    ]
  },
  "timestamp": "..."
}
```

---

## Error Options

```js
// Add field hint
res.notFound('User not found', { field: 'userId' })

// Add extra details
res.badRequest('Invalid token', {
  details: 'Token has expired. Please request a new one.',
})

// Add multiple errors
res.badRequest('Multiple issues', {
  errors: [
    { field: 'name', message: 'Required' },
  ]
})
```

---

## All Response Methods

| Method | Status | When to use |
|---|---|---|
| `ok(data, msg?, meta?)` | 200 | GET requests, updates |
| `created(data, msg?)` | 201 | POST — resource created |
| `accepted(data, msg?)` | 202 | Async jobs queued |
| `noContent()` | 204 | DELETE, no body needed |
| `paginated(data, opts)` | 200 | List endpoints |
| `badRequest(msg?, opts?)` | 400 | Invalid input |
| `unauthorized(msg?, opts?)` | 401 | Not logged in |
| `forbidden(msg?, opts?)` | 403 | No permission |
| `notFound(msg?, opts?)` | 404 | Resource missing |
| `conflict(msg?, opts?)` | 409 | Duplicate resource |
| `validationError(errors, msg?)` | 422 | Validation failed |
| `tooManyRequests(msg?, opts?)` | 429 | Rate limited |
| `serverError(msg?, opts?)` | 500 | Unexpected error |
| `custom(status, success, msg, data?, error?, meta?)` | any | Custom responses |

---

## Frontend Integration

Your frontend always knows what to expect:

```js
// React / any frontend
async function fetchUsers() {
  const res  = await fetch('/api/users');
  const json = await res.json();

  if (!json.success) {
    console.error(json.message);         // "User not found"
    console.error(json.error.code);      // "NOT_FOUND"
    return;
  }

  const users    = json.data;
  const { total, page, totalPages } = json.meta;
}
```

---

## TypeScript Support

```ts
import { ok, paginated, notFound } from 'res-wrap';

interface User { id: string; name: string; }

const response = ok<User[]>(users, 'Fetched');
// response.data is typed as User[]
```

---

## License

MIT © [Adarsh](https://github.com/dixitadarsh)

---

## Contributing

Issues, bugs, ideas — all welcome!

- 🐛 [Report a bug](https://github.com/dixitadarsh/res-wrap/issues)
- 💡 [Request a feature](https://github.com/dixitadarsh/res-wrap/issues)
- 🔀 [Submit a PR](https://github.com/dixitadarsh/res-wrap/pulls)
