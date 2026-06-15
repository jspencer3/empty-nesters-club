# Empty Nesters Club

A social platform for couples and partner groups whose children have left home. Users form "nests" (groups), discover and track shared activities, participate in threaded discussions, earn recognition, and rediscover their relationships through community engagement.

## Tech Stack

| Layer          | Technology                                       |
| -------------- | ------------------------------------------------ |
| Monorepo       | Turborepo + pnpm workspaces                      |
| Frontend       | React 19, Vite, React Router v7                  |
| API            | Node.js, GraphQL Yoga, Pothos (type-safe schema) |
| Auth           | Supabase Auth (email + JWT verification)         |
| ORM            | Prisma 6                                         |
| Database       | PostgreSQL 16                                    |
| Cache / Queues | Redis 7, BullMQ                                  |
| File Storage   | AWS S3                                           |
| Language       | TypeScript (strict mode throughout)              |

## Project Structure

```
empty-nesters-club/
├── apps/
│   ├── api/          # GraphQL API server (port 4000)
│   └── web/          # React SPA (port 3000)
├── packages/
│   ├── db/           # Prisma schema, client, migrations, seed
│   ├── worker/       # BullMQ background job workers
│   └── typescript-config/  # Shared tsconfig presets
├── infra/            # Production Docker Compose, infrastructure docs
├── .github/workflows/  # CI + deploy pipelines
├── docker-compose.yml  # Local dev services (Postgres + Redis)
└── turbo.json        # Turborepo task pipeline
```

## Prerequisites

- **Node.js** >= 22 (see `.nvmrc`)
- **pnpm** 11.6.0 (enabled via corepack)
- **Docker** and **Docker Compose** (for local Postgres + Redis)
- A **Supabase** project (for authentication)
- AWS credentials (optional — for S3 avatar uploads)

## Getting Started

### 1. Clone and install

```bash
git clone git@github.com:jspencer3/empty-nesters-club.git
cd empty-nesters-club
corepack enable
pnpm install
```

### 2. Start local services

```bash
docker compose up -d
```

This starts:

- PostgreSQL 16 on `localhost:5432` (user: `postgres`, password: `postgres`, db: `enc_dev`)
- Redis 7 on `localhost:6379`

### 3. Configure environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp apps/api/.env.example apps/api/.env
```

Required variables:

| Variable                | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string (default works with Docker) |
| `SUPABASE_URL`          | Your Supabase project URL                                |
| `SUPABASE_ANON_KEY`     | Supabase anonymous/public key                            |
| `SUPABASE_JWT_SECRET`   | Supabase JWT secret for token verification               |
| `AWS_REGION`            | AWS region for S3 (optional)                             |
| `AWS_ACCESS_KEY_ID`     | AWS access key (optional)                                |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key (optional)                                |
| `S3_BUCKET`             | S3 bucket name for uploads (optional)                    |

The root `.env` file is used by Prisma CLI commands:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/enc_dev
```

### 4. Set up the database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to local database (creates all tables)
pnpm db:push

# Seed with initial activity data
pnpm db:seed
```

### 5. Start development servers

```bash
pnpm dev
```

This runs all apps concurrently via Turborepo:

- **API** — `http://localhost:4000/graphql` (also serves GraphiQL IDE)
- **Web** — `http://localhost:3000`

The web dev server proxies `/graphql` requests to the API automatically.

## Available Scripts

All scripts run from the repo root via Turborepo:

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `pnpm dev`         | Start all apps in dev mode (hot reload)          |
| `pnpm build`       | Build all packages and apps                      |
| `pnpm typecheck`   | Run TypeScript type checking across all packages |
| `pnpm lint`        | Lint all packages                                |
| `pnpm test`        | Run tests across all packages                    |
| `pnpm clean`       | Remove build artifacts                           |
| `pnpm db:generate` | Regenerate Prisma client after schema changes    |
| `pnpm db:migrate`  | Create and apply a new Prisma migration          |
| `pnpm db:push`     | Push schema directly to database (dev only)      |
| `pnpm db:seed`     | Seed the database with initial activities        |

### Package-specific commands

```bash
# Run only the API
pnpm --filter @enc/api dev

# Run only the web app
pnpm --filter @enc/web dev

# Run background workers
pnpm --filter @enc/worker dev

# Open Prisma Studio (database GUI)
pnpm --filter @enc/db studio
```

## Architecture

### GraphQL API (`apps/api`)

The API uses GraphQL Yoga with Pothos for type-safe schema construction. Key modules:

| Module                              | Responsibility                                     |
| ----------------------------------- | -------------------------------------------------- |
| `src/schema/types/user.ts`          | User profiles, privacy controls                    |
| `src/schema/types/partner-group.ts` | Partner group CRUD, invite flow                    |
| `src/schema/types/nest.ts`          | Nests, membership, admin succession voting         |
| `src/schema/types/activity.ts`      | Activity catalog, instances, lifecycle, ratings    |
| `src/schema/types/discussion.ts`    | Threaded comments, reactions                       |
| `src/schema/types/testimonial.ts`   | Testimonials with visibility and approval          |
| `src/schema/types/notification.ts`  | In-app notifications, preferences                  |
| `src/schema/types/dashboard.ts`     | User, nest, partner-group dashboard queries        |
| `src/schema/types/admin.ts`         | Site admin: moderation, approvals, user management |
| `src/schema/types/upload.ts`        | S3 presigned URL flow for avatars                  |
| `src/lib/auth.ts`                   | JWT verification via jose                          |
| `src/lib/context.ts`                | GraphQL context (current user extraction)          |
| `src/lib/s3.ts`                     | S3 presigned upload generation                     |
| `src/lib/notifications.ts`          | Programmatic notification creation utility         |

Authentication uses Supabase-issued JWTs verified server-side. The `authScopes` plugin on Pothos gates queries/mutations by `authenticated` or `admin` scope.

### Web App (`apps/web`)

React 19 SPA with client-side routing:

| Route         | Page                         |
| ------------- | ---------------------------- |
| `/`           | Public landing page          |
| `/dashboard`  | Authenticated user dashboard |
| `/activities` | Activity catalog browser     |
| `/nests`      | User's nest list             |

### Database (`packages/db`)

Prisma schema with 17 models:

- **Identity**: User, PartnerGroup, PartnerGroupMember, PartnerGroupInvite
- **Groups**: Nest, NestMembership, NestInvite, AdminVote, AdminVoteBallot
- **Activities**: Activity, ActivityInstance, Rating, Bookmark
- **Social**: Discussion, Comment, Reaction
- **Content**: Testimonial
- **System**: Notification, NotificationPreference

### Background Workers (`packages/worker`)

BullMQ-based workers processing:

| Queue           | Purpose                                                    |
| --------------- | ---------------------------------------------------------- |
| `notifications` | Create in-app notifications respecting user preferences    |
| `emails`        | Email delivery (Resend/SES integration placeholder)        |
| `scheduled`     | Periodic tasks: admin idle detection, notification digests |

## Domain Concepts

- **Nest** — A group of up to 100 partner groups. Has an admin who can be replaced via community vote.
- **Partner Group** — Typically a couple, but accommodates complex family situations. Tracks activities together.
- **Activity** — A catalog item (e.g., "Wine Tasting Course"). System-defined or user-submitted (requires admin approval).
- **Activity Instance** — A specific nest or partner group doing an activity. Lifecycle: Planned -> In Progress -> Done/Abandoned.
- **Discussion** — Threaded comments attached to each activity instance. One level of nesting, with emoji reactions.
- **Testimonial** — User stories with visibility levels (private, family, nest, public) and approval workflows.
- **Admin Succession** — If a nest admin goes idle for 30 days, members can nominate a replacement via majority vote.

## Deployment

### Docker builds

```bash
# Build API image
docker build -f apps/api/Dockerfile -t enc-api .

# Build Web image
docker build -f apps/web/Dockerfile -t enc-web .
```

### Production infrastructure

See `infra/README.md` for details. The production setup targets:

- **AWS ECS/Fargate** for application containers
- **AWS RDS** (PostgreSQL) for database
- **AWS ElastiCache** (Redis) for caching and queues
- **AWS S3 + CloudFront** for static assets and uploads
- **GitHub Actions** for CI/CD (build, push to ECR, deploy to ECS)

### CI/CD

Two GitHub Actions workflows:

- **`.github/workflows/ci.yml`** — Runs on all PRs and pushes to main. Lints, typechecks, and tests with Postgres/Redis service containers.
- **`.github/workflows/deploy.yml`** — Triggers on push to main. Builds Docker images, pushes to ECR, and deploys to ECS.

## Development Workflow

1. Create a feature branch
2. Make changes (schema changes require `pnpm db:generate` to regenerate the Prisma client)
3. Run `pnpm typecheck` to verify
4. Open a PR — CI runs automatically
5. Merge to `main` — deploys automatically

## License

Private. Not licensed for external use.
