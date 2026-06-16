# Empty Nesters Club — Punchlist

## High Priority — Core Functionality

- [x] **Frontend GraphQL client** — urql client + graphql-codegen for typed operations
- [x] **Frontend auth integration** — Supabase Auth SDK (sign up, sign in, sign out, session/token management)
- [x] **Supabase project provisioning** — Real project, JWT secret, env vars configured
- [x] **Route guards** — Redirect unauthenticated users from protected routes
- [x] **Local dev environment** — Docker Postgres + Redis, Prisma push, seed data
- [x] **Frontend forms and mutations — Profile create/edit**
- [x] **Nest CRUD** — Create with globally unique name, visibility (PUBLIC/PRIVATE), location (city/state/zip), admin approval for join requests
- [x] **Nest discovery** — Search public nests by name/location, request to join, nest profile page (member vs non-member views)
- [ ] **Supabase webhook** — Auto-create User record on signup (API endpoint hit by Supabase)
- [ ] **Frontend forms and mutations** — Partner groups (two-step verification), activity lifecycle
- [ ] **Real-time notifications** — WebSocket subscription delivery (server + client)
- [ ] **Database migrations** — Convert from `db push` to proper migration history for production

## Medium Priority — Completeness

- [ ] **Error handling** — GraphQL error parsing, client-side error boundaries, toast notifications
- [ ] **Pagination** — Cursor/offset pagination on list queries (activities, nests, notifications)
- [ ] **Input validation** — Wire up Pothos validation plugin for mutation inputs
- [ ] **File upload UI** — Avatar upload component using presigned URL flow
- [ ] **Admin panel UI** — Role-gated admin pages (activity approval, testimonial moderation, user management)
- [ ] **Testing** — Unit tests (Vitest), integration tests, E2E smoke tests (Playwright)

## Lower Priority — Polish & Production

- [ ] **Email sending** — Replace worker stub with Resend or SES integration
- [ ] **Rate limiting** — API rate limiting for public endpoints
- [ ] **Logging/observability** — Structured logging, health check endpoints
- [ ] **CSS/styling** — Replace inline styles with Tailwind CSS or similar
- [ ] **GitHub repo** — Push to remote, configure branch protection
- [ ] **Search** — Full-text search for activities and nests
- [ ] **Image optimization** — CDN thumbnails for avatars

## Out of Scope (Deferred)

- Native mobile apps
- Badge/gamification system
- Payment/subscription model
- AI-powered activity recommendations
- Internationalization (i18n)
