# ApprovalHub: Complete Build, Database, UI and Deploy Plan

Stack: React + TypeScript (Vite) | Supabase (PostgreSQL, Auth, RLS) | GitHub | Netlify
Goal: a live, role-based Request & Approval Portal you can demo in 2 minutes.
The full source code is already in this folder. Your job tonight is to set it up, deploy it, and understand it.

---

## 1. What you are building

| Role | Can do |
|---|---|
| Employee | Sign up, log in, create requests, see only their own requests and decisions |
| Manager | See all requests, approve or reject with a comment (never their own request) |
| Admin | Everything a manager can do, plus change user roles |

Screens: Login/Signup, Dashboard (stats, status bars, recent activity), Requests (form, filters, search, table, decision modal), Team & roles (admin only).

## 2. Architecture (one paragraph you can say out loud)

The React frontend talks directly to Supabase. Supabase Auth issues a JWT on login. Every database query carries that JWT, and PostgreSQL Row Level Security policies decide which rows the user may read or change. So security lives in the database, not only in the UI. The frontend is built by Vite and hosted on Netlify, which redeploys automatically on every push to GitHub.

```
Browser (React + TS) --JWT--> Supabase (Auth + Postgres + RLS)
        ^
        | static files, auto-deploy on git push
     Netlify  <---  GitHub repo
```

## 3. Timeline (about 2 hours)

| Time | Task |
|---|---|
| 0:00 - 0:20 | Create Supabase project, run `supabase/schema.sql`, configure auth |
| 0:20 - 0:35 | Run the project locally with your keys |
| 0:35 - 0:50 | Create 3 test users, promote roles, test every role |
| 0:50 - 1:10 | Push to GitHub |
| 1:10 - 1:30 | Deploy on Netlify, set env vars, test the live URL |
| 1:30 - 2:00 | Add one feature with Claude Code, review it, redeploy |

## 4. Database

### 4.1 Setup
1. supabase.com > New project (any region near you, save the database password).
2. Open SQL Editor > New query > paste all of `supabase/schema.sql` > Run.
3. Authentication settings > Email provider > turn OFF "Confirm email" (so test accounts work instantly).
4. Project Settings > API: copy the Project URL and the `anon` public key.

### 4.2 Schema

```
auth.users (managed by Supabase)
    | 1:1  (trigger creates the row on signup)
profiles(id PK/FK, full_name, role, created_at)
    | 1:N  (requester_id FK)
requests(id PK, requester_id FK, title, description, amount,
         status, decided_by FK, decision_comment, decided_at, created_at)
```

Design choices to mention:
- `role` and `status` are ENUM types, so invalid values are impossible.
- CHECK constraints: title length 3-120, amount >= 0.
- Indexes on `requester_id` and `status`, because they are used in filters and policies.
- A signup trigger auto-creates the profile, so the app never forgets to.

### 4.3 Security (Row Level Security)

| Table | Operation | Rule |
|---|---|---|
| profiles | select | own row, or manager/admin see all |
| profiles | update | admin only (so nobody can promote themselves) |
| requests | select | own rows, or manager/admin see all |
| requests | insert | only for yourself, and status must be `pending` |
| requests | update | manager/admin only, never on their own request |

A `BEFORE UPDATE` trigger adds business rules: only decision fields can change, a request can be decided only once, and `decided_by` and `decided_at` are stamped by the database (not trusted from the client).

The helper `get_my_role()` is `SECURITY DEFINER`, which avoids infinite recursion when a policy on `profiles` needs to read `profiles`.

### 4.4 Create your 3 demo users
1. Run the app, sign up: `admin@test.com`, `manager@test.com`, `employee@test.com` (password e.g. `Demo@1234`).
2. In SQL Editor run:
```sql
update public.profiles set role = 'admin'
  where id = (select id from auth.users where email = 'admin@test.com');
update public.profiles set role = 'manager'
  where id = (select id from auth.users where email = 'manager@test.com');
```
3. Log out and back in for the new role to show.

## 5. Run locally

```bash
npm install
cp .env.example .env      # then paste your Supabase URL and anon key
npm run dev               # opens http://localhost:5173
```

## 6. Code map (know this for the interview)

| File | What it does |
|---|---|
| `src/lib/supabase.ts` | Creates the Supabase client from env variables |
| `src/AuthContext.tsx` | Session and profile (role) state, signIn/signUp/signOut |
| `src/App.tsx` | Loading and auth guards, sidebar navigation by role, loads requests |
| `src/pages/AuthPage.tsx` | Login and signup form |
| `src/pages/Dashboard.tsx` | Stat cards, status bars, recent activity, "review now" callout |
| `src/pages/Requests.tsx` | Create form, filter tabs, search, table, approve/reject |
| `src/pages/Users.tsx` | Admin-only role management |
| `src/components/*` | StatusBadge, DecisionModal, Toasts |
| `src/index.css` | Design tokens and all styling |
| `supabase/schema.sql` | Tables, enums, trigger, RLS policies |

Key concepts inside the code:
- Auth flow: `getSession()` on load, then `onAuthStateChange` for login/logout, then the profile is fetched to get the role.
- Data loading: one query with a join, `select('*, requester:profiles!requester_id(full_name)')`. RLS filters rows automatically.
- Role-based UI: the sidebar and buttons change by role, but the real enforcement is RLS.
- Errors from the database (like a blocked self-approval) show up as toasts.

## 7. UI and UX design system

| Element | Choice |
|---|---|
| Font | Inter (Google Fonts) with system fallback |
| Primary | Indigo `#4F46E5` |
| Sidebar | Navy `#0F172A` |
| Background | Soft grey `#F5F6FA` with white cards |
| Status colours | Pending amber, Approved green, Rejected red (badges, stat borders, bars) |
| Shape | 14px card radius, soft shadows, 10px controls |

UX details already included: loading spinner, empty states, toast notifications, confirmation modal with comment, disabled buttons while saving, filter tabs plus search, responsive layout (sidebar becomes a top bar on mobile), split-screen login page.

Polish ideas if you have time: dark mode via CSS variables, a favicon and page title, skeleton loaders.

## 8. Deploy

### 8.1 GitHub
```bash
git init
git add .
git commit -m "Initial commit: ApprovalHub"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/approvalhub.git
git push -u origin main
```
`.env` is listed in `.gitignore`. Before pushing, run `git status` and confirm `.env` is not listed.

### 8.2 Netlify
1. Netlify > Add new site > Import an existing project > GitHub > pick the repo.
2. Build settings are read from `netlify.toml` (command `npm run build`, publish `dist`).
3. Site configuration > Environment variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Every `git push` now redeploys automatically.
5. Supabase > Authentication > URL Configuration: set Site URL to your Netlify URL.

The `_redirects` file and `netlify.toml` redirect make sure refreshing the page never gives a 404.

## 9. Test checklist (do all before sleeping)

- [ ] Employee signs up, creates a request, sees only their own
- [ ] Manager sees every request and can approve and reject with a comment
- [ ] Manager cannot decide their own request (button hidden, and the database blocks it)
- [ ] A decided request cannot be decided again
- [ ] Admin sees the Team page and can change a role; employees and managers do not see it
- [ ] Refreshing on the live URL works, and you stay logged in
- [ ] Layout works on your phone

## 10. Add a feature with Claude Code (for the "AI-assisted development" point)

Pick one and give Claude Code this kind of prompt. Always read the diff and test it.

1. CSV export: "In src/pages/Requests.tsx add an Export CSV button that downloads the currently filtered requests as a CSV file. Keep the existing style and TypeScript types."
2. Realtime updates: "Use Supabase realtime to reload the requests list when the requests table changes. Clean up the subscription on unmount."
3. Pagination: "Add server-side pagination (10 per page) to the requests query using .range()."

What to say about it: "I used Claude Code to generate the first version, then reviewed the diff, tested it with all three roles, and adjusted [something you changed]."

## 11. Troubleshooting

| Problem | Fix |
|---|---|
| "Setup needed" screen | Env vars missing. Check `.env` locally or Netlify variables, then redeploy |
| "Profile not found" | You signed up before running the schema. Run `schema.sql`, then create a new user |
| Login says "Email not confirmed" | Turn off Confirm email in Supabase auth settings |
| Requests list is empty for a manager | Role is still `employee`. Run the update SQL, then log out and in |
| Works locally, fails on Netlify | Env variables, or the site was built before you added them. Trigger a new deploy |
| Approve gives an error | Read the toast: it is the database rule talking (own request or already decided) |

## 12. Your 2-minute demo script

1. "This is ApprovalHub, built with React, TypeScript and Supabase, deployed on Netlify." (show the URL)
2. Log in as employee: create a request, show it as Pending.
3. Log in as manager: show the dashboard callout, open the request, approve with a comment.
4. Back as employee: show the Approved status and the comment.
5. Log in as admin: show the Team page and change a role.
6. "Security is enforced by Row Level Security in the database, so even if someone bypasses the UI they cannot see or change other people's data. A trigger blocks self-approval and double decisions."
7. "I used Claude Code for [feature] and reviewed everything before merging."

## 13. Questions you may get about this project

- Why Supabase? It gives Postgres, auth, and a ready API, so I can go from idea to live product quickly, and it is still plain SQL underneath.
- Is the anon key a security risk in the frontend? No, it is public by design. RLS is what protects the data. The service_role key must never be in the frontend.
- What happens if someone edits the UI to show the Approve button? The database policy and trigger reject the update.
- What would you improve next? Audit history table, email or WhatsApp notifications through a webhook, multi-level approval by amount, pagination, automated tests.
- Why no React Router? To keep the demo small. I would add it for deep links (`/requests/123`); the `_redirects` file is already set up for that.
