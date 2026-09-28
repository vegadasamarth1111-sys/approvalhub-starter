# ApprovalHub

A role-based Request & Approval Portal (React + TypeScript + Supabase + Netlify).

See **PLAN.md** for the complete setup, database, deployment and demo guide.

## Quick start
```bash
npm install
cp .env.example .env   # add your Supabase URL and anon key
npm run dev
```
Run `supabase/schema.sql` in the Supabase SQL Editor first.

## Demo accounts
(Add yours here after you create them)
- admin@test.com / Demo@1234
- manager@test.com / Demo@1234
- employee@test.com / Demo@1234

## Features
- Email authentication with three roles: employee, manager, admin
- Row Level Security enforced in PostgreSQL
- Dashboard with live stats, filters and search
- Approve or reject with comments; database trigger prevents self-approval and double decisions
