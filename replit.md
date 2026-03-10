# BOSJOKO Staff Leave Dashboard

## Overview

This is a full-stack staff leave management dashboard called "Dashboard Operasional BOSJOKO." It allows managers and agents to track staff leave requests, clock-ins, and work shifts in real time. The system supports multiple user roles (admin/agent), IP-based access control, audit logging, analytics, and data backup/restore.

Key features:
- Real-time leave tracking with live countdown timers
- Staff management by jobdesk and shift (PAGI/SORE/MALAM)
- Per-user and global IP whitelist enforcement
- Role-based access control (admin vs agent)
- Analytics dashboard with charts
- Audit log for all admin actions
- Backup and restore of all data as JSON
- Configurable leave duration and max leaves per day
- Per-agent permissions for adding staff and allowed shifts/jobdesks

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: `wouter` (lightweight client-side routing)
- **State/Data Fetching**: TanStack React Query v5 — all server state is fetched and cached via custom hooks; most data queries use aggressive `refetchInterval` (1000ms for staff/leaves) to keep dashboards in sync across multiple agent PCs
- **Forms**: React Hook Form + Zod resolver
- **UI Components**: shadcn/ui (New York style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming; default is dark mode with an "Elegant Blue" palette; light mode toggle stored in localStorage
- **Charts**: Recharts for analytics charts
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via `tsx` in development
- **Session Management**: `express-session` with `connect-pg-simple` storing sessions in PostgreSQL
- **API Design**: REST endpoints defined in `shared/routes.ts` using Zod schemas for both input validation and response typing. The `api` object is shared between frontend and backend for type-safe route paths and schemas
- **Authentication**: Session-based auth; login checks username/password, then validates client IP against per-user `allowedIp` and a global whitelist stored in the `settings` table
- **Authorization**: Role checks (`admin` vs `agent`) enforced per route; `admin` role can access settings, backup, audit logs, user management, and permissions management

### Data Storage
- **Database**: PostgreSQL via `drizzle-orm/node-postgres`
- **ORM**: Drizzle ORM with schema defined in `shared/schema.ts`
- **Migrations**: Managed with `drizzle-kit` (`db:push` for schema sync)
- **Schema tables**:
  - `users` — system accounts with role, allowedIp, avatarUrl
  - `staff` — staff members with name, jobdesk, role, shift
  - `leaves` — leave records with staffId, startTime, clockInTime, date
  - `audit_logs` — action audit trail
  - `settings` — key/value configuration store (leave duration, max leaves, IP whitelist, jobdesk limits)
  - `staff_permissions` — per-user agent permission overrides

### Build & Deployment
- **Dev**: `tsx server/index.ts` runs Express which also serves Vite middleware for HMR
- **Production build**: `script/build.ts` runs Vite for the client and esbuild for the server, bundling selected server dependencies (allowlist in build script) into `dist/index.cjs`
- **Static serving**: In production, Express serves the Vite-built client from `dist/public`

### Route Protection
- `ProtectedRoute` — redirects to `/login` if not authenticated
- `AdminRoute` — redirects to `/` if not admin role
- Auth state is managed via `useAuth()` hook backed by `/api/auth/me`

## External Dependencies

### Database
- **PostgreSQL** — primary data store; connection string via `DATABASE_URL` env var
- **connect-pg-simple** — stores Express sessions in PostgreSQL

### UI & Frontend Libraries
- **Radix UI** — full suite of headless accessible UI primitives
- **shadcn/ui** — component library layered on Radix UI (New York style)
- **Tailwind CSS** — utility-first styling with PostCSS/autoprefixer
- **Recharts** — charting library for analytics page
- **date-fns** — date formatting and timer calculations
- **lucide-react** — icon set
- **wouter** — client-side routing
- **TanStack React Query v5** — server state management
- **React Hook Form** + **@hookform/resolvers** — form handling
- **Zod** — schema validation (shared between client and server)
- **cmdk** — command palette component
- **embla-carousel-react** — carousel component

### Backend Libraries
- **Express 5** — HTTP server
- **drizzle-orm** + **drizzle-zod** — ORM and Zod schema generation from DB schema
- **drizzle-kit** — DB migration tooling
- **pg** — PostgreSQL Node.js client
- **express-session** — session middleware
- **nanoid** — ID generation
- **class-variance-authority** + **clsx** + **tailwind-merge** — CSS utility helpers

### Replit-Specific Plugins (dev only)
- `@replit/vite-plugin-runtime-error-modal` — runtime error overlay
- `@replit/vite-plugin-cartographer` — Replit dev tooling
- `@replit/vite-plugin-dev-banner` — Replit dev banner

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (required at startup)
- `SESSION_SECRET` — Express session secret (falls back to `"dashboard-secret"` if not set)