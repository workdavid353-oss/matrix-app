# יוצאים מהמטריקס — Web App

## Stack
- **Next.js 14** (App Router)
- **Supabase** (Auth + PostgreSQL + RLS)
- **next-intl** (Hebrew + English, RTL support)
- **Tailwind CSS** (Dark mode via `class`)
- **TypeScript**

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
```
Fill in your Supabase URL and anon key from https://supabase.com/dashboard.

### 3. Run Supabase SQL
In your Supabase project → SQL Editor, run the full schema from the previous step:
- Create tables: `profiles`, `projects`, `tasks`, `task_notes`, `updates`
- Enable RLS on all tables
- Add RLS policies
- Add the `handle_new_user` trigger

### 4. Set first admin
After creating your first account (will be `pending`), run this SQL:
```sql
UPDATE profiles SET status = 'approved', role = 'admin' WHERE id = 'YOUR_USER_ID';
```

### 5. Run development server
```bash
npm run dev
```

Open http://localhost:3000 — it redirects to `/en` by default.

## Routes
| Path | Description |
|------|-------------|
| `/en` or `/he` | Home — task board |
| `/en/projects` | All projects |
| `/en/projects/[id]` | Single project + tasks |
| `/en/updates` | Group updates/news |
| `/en/history` | Activity log |
| `/en/dashboard` | Admin only — user management |
| `/en/auth/login` | Login |
| `/en/auth/register` | Register (goes to pending) |
| `/en/auth/pending` | Waiting for approval |

## Permissions matrix
| Action | Admin | Project Owner | Assigned Member |
|--------|-------|---------------|-----------------|
| See all tasks | ✓ | — | — |
| Edit any task | ✓ | ✓ | — |
| Edit own task | ✓ | ✓ | ✓ |
| Add note to task | ✓ | ✓ | ✓ |
| Create project | ✓ | ✓ | — |
| Publish updates | ✓ | — | — |
| Manage users | ✓ | — | — |

## Adding Task Notes
The `task_notes` table is ready. To add the notes UI to a task, create a `TaskNotesSection` component that:
1. Fetches `task_notes` by `task_id`
2. Shows existing notes with author + date
3. Has an input for adding new notes (insert with `author_id = user.id`)

## Dark Mode
Theme is stored in `localStorage` as `'dark'` or `'light'`.
A script in `<head>` applies the class before React hydrates (no flash).

## RTL
Set automatically when locale is `he`. The sidebar uses CSS class `.sidebar` 
which flips `left/right` positioning in `globals.css` for `[dir='rtl']`.

## Deploy to Vercel
```bash
vercel
```
Add environment variables in Vercel dashboard. Done.
