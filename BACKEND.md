# Automation Project - Backend System

Complete backend system for the Visual Node Automation Studio with persistent storage, authentication, and async task execution.

## Architecture

**Decision: Next.js API Routes (Route Handlers)**

Using Next.js Route Handlers instead of a separate Express backend because:
- Single codebase, simpler deployment
- Shared types between frontend and backend
- Built-in edge runtime support
- Can scale to microservices later if needed

**Layered Architecture:**
```
API Routes (Controllers) → Services → Data Access (Prisma)
```

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Framework   | Next.js 16              |
| Database    | MySQL 8.0+              |
| ORM         | Prisma 7                |
| Adapter     | @prisma/adapter-mariadb |
| Validation  | Zod 4                   |
| Auth        | JWT + bcrypt            |
| Queue       | BullMQ + Redis (optional) |
| Language    | TypeScript              |

## Folder Structure

```
src/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts    # POST /api/auth/register
│       │   ├── login/route.ts       # POST /api/auth/login
│       │   └── me/route.ts          # GET  /api/auth/me
│       ├── tasks/
│       │   ├── route.ts             # GET/POST /api/tasks
│       │   └── [id]/
│       │       ├── route.ts         # GET/PUT/DELETE /api/tasks/:id
│       │       └── execute/route.ts # POST /api/tasks/:id/execute
│       ├── executions/
│       │   ├── route.ts             # GET /api/executions
│       │   └── [id]/
│       │       ├── route.ts         # GET /api/executions/:id
│       │       └── logs/route.ts    # GET /api/executions/:id/logs
│       └── health/route.ts          # GET /api/health
├── lib/
│   ├── prisma.ts                    # Prisma client singleton
│   ├── auth.ts                      # JWT & bcrypt utilities
│   ├── queue.ts                     # BullMQ queue setup
│   └── logger.ts                    # Execution logging
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   └── auth.service.ts
│   ├── tasks/
│   │   ├── task.controller.ts
│   │   ├── task.service.ts
│   │   └── task.schema.ts           # Zod schemas
│   └── executions/
│       ├── execution.controller.ts
│       └── execution.service.ts
├── middleware/
│   └── auth.middleware.ts           # JWT auth wrapper
└── types/
    └── index.ts                     # Shared TypeScript types
prisma/
└── schema.prisma                    # Database schema
```

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### 2. Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (dev only)
npm run db:push

# Seed demo data
npm run db:seed
```

### 3. Start Development Server

```bash
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint              | Auth | Description          |
|--------|-----------------------|------|----------------------|
| POST   | `/api/auth/register`  | No   | Register new user    |
| POST   | `/api/auth/login`     | No   | Login & get JWT      |
| GET    | `/api/auth/me`        | Yes  | Get current user     |

### Tasks

| Method | Endpoint              | Auth | Description          |
|--------|-----------------------|------|----------------------|
| GET    | `/api/tasks`          | Yes  | List user's tasks    |
| POST   | `/api/tasks`          | Yes  | Create new task      |
| GET    | `/api/tasks/:id`      | Yes  | Get task by ID       |
| PUT    | `/api/tasks/:id`      | Yes  | Update task          |
| DELETE | `/api/tasks/:id`      | Yes  | Delete task          |

### Executions

| Method | Endpoint                      | Auth | Description              |
|--------|-------------------------------|------|--------------------------|
| POST   | `/api/tasks/:id/execute`      | Yes  | Execute a task           |
| GET    | `/api/executions`             | Yes  | List executions          |
| GET    | `/api/executions/:id`         | Yes  | Get execution details    |
| GET    | `/api/executions/:id/logs`    | Yes  | Get execution logs       |

### Health

| Method | Endpoint        | Auth | Description          |
|--------|-----------------|------|----------------------|
| GET    | `/api/health`   | No   | Health check         |

## API Examples

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure123", "name": "John"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure123"}'
```

### Create Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "My Workflow",
    "nodes": [
      {
        "id": "node-1",
        "type": "log",
        "position": { "x": 100, "y": 100 },
        "data": { "message": "Hello World" }
      }
    ],
    "edges": []
  }'
```

### Execute Task

```bash
curl -X POST http://localhost:3000/api/tasks/<task-id>/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"input": {"key": "value"}}'
```

### List Executions

```bash
curl "http://localhost:3000/api/executions?status=SUCCESS&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

## Execution Flow

1. **Task Creation**: User creates a task with nodes (ReactFlow format) and edges
2. **Execution Request**: POST to `/api/tasks/:id/execute` creates an execution record
3. **Queue**: If Redis is configured, task is queued via BullMQ with retry logic
4. **Execution Engine**: Processes nodes in topological order (BFS from root nodes)
5. **Node Handlers**: Each node type has a specific handler (log, http, transform, etc.)
6. **Logging**: Every step is logged to both console and database
7. **Completion**: Status updated to SUCCESS/FAILED with output/error

## Supported Node Types

| Type       | Description                    | Data Fields              |
|------------|--------------------------------|--------------------------|
| `log`      | Log a message                  | `message`                |
| `color`    | Set a color value              | `color`                  |
| `http`     | Make HTTP request              | `url`, `method`, `body`  |
| `transform`| Transform data                 | `expression`             |
| `delay`    | Wait for duration              | `duration` (ms)          |
| `condition`| Evaluate condition             | `condition`              |

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `202` - Accepted (queued)
- `400` - Validation error
- `401` - Unauthorized
- `404` - Not found
- `500` - Server error
- `503` - Service unavailable

## Database: MySQL Migration Notes

This project was migrated from PostgreSQL to MySQL. Key changes:

### Schema Changes

| Feature | PostgreSQL | MySQL |
|---------|-----------|-------|
| Provider | `postgresql` | `mysql` |
| UUID default | `@default(uuid())` | `@default(uuid())` (app-level) |
| JSON | `Json` (JSONB) | `Json` (native JSON) |
| Long text | `String` (TEXT) | `String @db.Text` |
| Boolean | `Boolean` | `Boolean` (TINYINT(1)) |
| DateTime | `DateTime` | `DateTime` (DATETIME(3)) |
| Enums | Native enum | MySQL ENUM type |
| Cascade delete | `onDelete: Cascade` | Supported |

### Fields Using `@db.Text`

These fields were annotated with `@db.Text` to avoid MySQL's default `VARCHAR(191)` limit:
- `Task.description`
- `TaskExecution.error`
- `ExecutionLog.message`

### DATABASE_URL Format

```
# MySQL
mysql://root:password@localhost:3306/automation_db

# PostgreSQL (old)
postgresql://postgres:postgres@localhost:5432/automation_db?schema=public
```

### Migration Commands

```bash
# 1. Update schema provider to "mysql"
# 2. Regenerate client
npx prisma generate

# 3. Create and apply migration
npx prisma migrate dev --name switch-to-mysql

# 4. (Optional) Push schema directly for dev
npx prisma db push

# 5. Seed data
npm run db:seed
```

### Data Migration (from existing PostgreSQL)

If migrating existing data:
1. Export PostgreSQL data: `pg_dump -d automation_db > backup.sql`
2. Convert schema/types as needed
3. Import to MySQL: `mysql -u root -p automation_db < converted.sql`
4. Run `npx prisma migrate resolve --applied <migration_name>` to sync migration history
