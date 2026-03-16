# Omiyages.com — CLAUDE.md

## Project Overview

**Omiyages.com** is an interview preparation platform built for job seekers targeting roles in Japan and the broader tech industry. It provides interview question banks, course tracking, company/role directories, a Kanban progress board, and AI-powered coaching notes.

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + Shadcn UI
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Hosting:** Vercel
- **Repo:** GitHub

---

## Enabling Claude Code to Push to GitHub & Edit Supabase

There are two layers: **CLI credentials** (required) and **MCP servers** (optional but powerful).

### GitHub — Push Access

Claude Code runs `git` commands in your shell, so it uses whatever git credentials are already configured on your machine.

**Option A — SSH (recommended)**
```bash
# Generate an SSH key if you don't have one
ssh-keygen -t ed25519 -C "your@email.com"

# Copy the public key
cat ~/.ssh/id_ed25519.pub
```
Paste it into **GitHub → Settings → SSH and GPG keys → New SSH key**.

Then set the remote to SSH:
```bash
cd /Users/namtae/source-edge-interview-prep
git remote set-url origin git@github.com:<your-username>/<repo-name>.git
git push  # test it
```

**Option B — Personal Access Token (HTTPS)**
1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Grant it `Contents: Read & Write` on your repo
3. Run once in terminal:
```bash
git config --global credential.helper osxkeychain
git push  # macOS will prompt for username + token, then cache it
```

---

### Supabase — Database Edit Access

**Step 1 — Authenticate the Supabase CLI**
```bash
supabase login
# Opens browser, authenticates via Supabase dashboard
```

**Step 2 — Link your project**
```bash
cd /Users/namtae/source-edge-interview-prep
supabase link --project-ref satshobhbkjptsbmfsia
# It will ask for your database password (from Supabase dashboard → Settings → Database)
```

**Step 3 — Add the service role key locally (for Edge Functions / admin ops)**

In your `.env.local` (never committed):
```env
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_from_dashboard>
SUPABASE_DB_URL=postgresql://postgres:<db-password>@db.satshobhbkjptsbmfsia.supabase.co:5432/postgres
```

Get these from: **Supabase Dashboard → Project → Settings → API** and **Settings → Database**.

Now Claude Code can:
- Run `supabase db push` to apply migrations
- Run `supabase migration new <name>` to scaffold new migrations
- Run SQL directly: `supabase db execute --sql "SELECT * FROM users LIMIT 5;"`

---

### MCP Servers (Optional — Richest Integration)

MCP servers give Claude Code native, structured access to GitHub and Supabase — beyond what raw CLI can do (e.g. read PRs, query tables interactively).

**GitHub MCP**
```bash
# Install the GitHub MCP server
claude mcp add github -- npx -y @modelcontextprotocol/server-github
```
Then set your token:
```bash
# In your shell profile (~/.zshrc or ~/.bashrc)
export GITHUB_PERSONAL_ACCESS_TOKEN=<your-pat>
```

**Supabase MCP**
```bash
# Add the Supabase MCP server
claude mcp add supabase -- npx -y @supabase/mcp-server-supabase \
  --supabase-url https://satshobhbkjptsbmfsia.supabase.co \
  --supabase-key <service_role_key>
```

After adding both, restart Claude Code. You'll see GitHub and Supabase listed as available tools.

> Verify installed MCP servers: `claude mcp list`

---

## Getting Started

### 1. Prerequisites

- Node.js 18+ (or Bun)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Vercel CLI](https://vercel.com/docs/cli) (optional, for local preview)
- A Supabase project (see [supabase.com](https://supabase.com))
- A Cloudflare Turnstile site key (CAPTCHA)

### 2. Clone & Install

```bash
git clone <your-github-repo-url>
cd source-edge-interview-prep
npm install
# or: bun install
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-public-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
VITE_TURNSTILE_SITE_KEY=<cloudflare-turnstile-site-key>
```

**NEVER commit `.env` or `.env.local`. Never expose `service_role` keys to the frontend.**

### 4. Run the Dev Server

```bash
npm run dev
# Runs on http://localhost:8080
```

### 5. Apply Database Migrations

```bash
supabase login
supabase link --project-ref <project-id>
supabase db push
```

Or apply migrations manually from `supabase/migrations/`.

---

## Key Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 8080) |
| `npm run dev:clean` | Clean cache then start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run security:audit` | Run npm security audit |
| `npm run secrets:scan` | Scan for hardcoded secrets in source |

---

## Project Structure

```
src/
├── App.tsx              # Root routing & SEO
├── main.tsx             # Entry point
├── components/          # Shared UI & feature components
│   └── ui/              # 62 shadcn-based primitives
├── pages/               # Page-level route components
├── services/            # Supabase CRUD service functions
├── hooks/               # 31 custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Security, formatters, slugify helpers
├── lib/
│   ├── supabase.ts      # Supabase client initialization
│   └── queryClient.ts   # React Query config
├── config/
│   └── environment.ts   # Env var validation
└── integrations/supabase/

supabase/
├── config.toml          # Local Supabase project config
├── migrations/          # 103 SQL migration files
└── functions/           # 9 Edge Functions (AI coaching, email, etc.)

public/                  # Static assets (favicon, sitemap, robots.txt)
```

---

## Architecture Notes

### Frontend
- Single-page app (SPA) with React Router; all routes fall back to `/` via Vercel rewrite.
- Data fetching via **React Query** (`@tanstack/react-query`). Prefer custom hooks in `src/hooks/` for data access.
- UI built from composable **shadcn** primitives in `src/components/ui/`. Do not edit these files unless updating the design system.
- Use `@/` path alias (resolves to `src/`).

### Database (Supabase)
- PostgreSQL via Supabase. All schema changes go through migration files in `supabase/migrations/`.
- **Never apply schema changes directly to production** — always write a new migration file.
- Row-Level Security (RLS) is active. Validate that new tables have appropriate RLS policies.
- Realtime subscriptions are enabled for live board updates.

### Edge Functions
Located in `supabase/functions/`. All require a valid JWT. Key functions:
- `generate-prep-notes` — AI coaching notes
- `generate-question-coaching` — Per-question AI feedback
- `generate-role-summary` — AI role descriptions
- `send-email` — Transactional email
- `admin-user-management` — Admin-only user ops

Deploy functions with:
```bash
supabase functions deploy <function-name>
```

### Auth
- Email/password + OAuth (via Supabase Auth).
- Protected routes use `src/components/ProtectedRoute.tsx`.
- Admin-only areas check for the admin role via `src/hooks/useAuth.tsx`.

---

## Deployment

### Vercel (Production)

The project auto-deploys from the main GitHub branch via Vercel. To deploy manually:

```bash
vercel --prod
```

Environment variables must be set in the Vercel project dashboard (not committed to the repo).

Security headers, CSP, CORS, and HTTPS enforcement are configured in `vercel.json`. Do not remove or weaken these headers.

### GitHub Workflow

CI/CD runs via `.github/workflows/`. PRs against `main` trigger automated checks. Merge to `main` triggers a production deploy on Vercel.

---

## Security Guidelines

- All user input passes through sanitizers in `src/utils/` (XSS protection via DOMPurify, `htmlSanitizer.ts`).
- Never bypass `ProtectedRoute` guards or disable JWT verification in Edge Functions.
- Use `src/config/environment.ts` to access env vars — never access `import.meta.env` directly in components.
- Run `npm run secrets:scan` before every PR to catch accidental secret leaks.
- Cloudflare Turnstile CAPTCHA is required on public-facing auth forms.

---

## Timezone

All timestamps use **Japan Standard Time (JST, UTC+9)**. See `src/config/timezone.ts` for utilities. Do not assume UTC for user-facing date displays.

---

## Common Tasks

### Add a new page
1. Create `src/pages/MyPage.tsx`
2. Add route in `src/App.tsx`
3. Add to `public/sitemap.xml` if public-facing

### Add a database table
1. Write `supabase/migrations/<timestamp>_description.sql`
2. Add RLS policies in the same migration
3. Run `supabase db push` locally to verify
4. Create/update TypeScript types in `src/types/`
5. Add service functions in `src/services/`

### Add a Supabase Edge Function
1. Create `supabase/functions/<name>/index.ts`
2. Test locally: `supabase functions serve <name>`
3. Deploy: `supabase functions deploy <name>`

---

## Useful References

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Vite Docs](https://vitejs.dev)
- [Shadcn UI](https://ui.shadcn.com)
- [React Query Docs](https://tanstack.com/query/latest)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- `docs/` and `deployment/` folders for project-specific guides
