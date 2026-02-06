# Lash Extension Academy

A modern online education platform for a professional lash extension certification course. Built with Next.js 15, TypeScript, TailwindCSS, and Prisma.

## Features

- **12 Gated Modules + Bonus Content** — Sequential unlocking via quiz-based progression
- **Quiz System** — 80% pass required (configurable), randomized retakes, answer reveal only after passing
- **Progress Tracking** — Visual progress bar, module states (locked/unlocked/completed), milestones
- **Certificate Generation** — PDF certificates with unique verification URLs
- **Bilingual (EN/ES)** — Full UI and content localization with language toggle
- **Live Q&A Sessions** — Scheduled sessions with RSVP, question submission, upvoting
- **Affiliate Program** — Referral tracking, commission calculation, payout management
- **Admin Dashboard** — Student management, content editing, analytics, affiliate management
- **Mobile-First Design** — Responsive blueprint-tile layout, clean typography

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** TailwindCSS + shadcn/ui components
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Auth.js (NextAuth v5) with email magic link
- **i18n:** next-intl
- **PDF Generation:** jsPDF
- **Payments:** Stripe (optional)
- **Realtime:** Pusher (optional, for live Q&A)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- SMTP email server (for magic link auth)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

**Required variables:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random secret for Auth.js (generate with `openssl rand -base64 32`) |
| `AUTH_URL` | App URL (e.g., `http://localhost:3000`) |
| `EMAIL_SERVER_HOST` | SMTP host |
| `EMAIL_SERVER_PORT` | SMTP port (usually 587) |
| `EMAIL_SERVER_USER` | SMTP username |
| `EMAIL_SERVER_PASSWORD` | SMTP password |
| `EMAIL_FROM` | Sender email address |

**Optional variables:**

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | For paid enrollment |
| `STRIPE_PUBLISHABLE_KEY` | Client-side Stripe key |
| `PUSHER_*` | For realtime live Q&A |
| `NEXT_PUBLIC_APP_URL` | Public app URL |

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with course content (12 modules, 150+ quiz questions)
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Create Admin User

The seed script creates an admin user:
- **Email:** admin@lashacademy.com

Sign in with this email to access the admin dashboard at `/admin`.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout with i18n + navbar
│   ├── auth/signin/page.tsx        # Sign in
│   ├── auth/verify/page.tsx        # Email verification
│   ├── enroll/page.tsx             # Course enrollment
│   ├── dashboard/page.tsx          # Student dashboard
│   ├── module/[moduleId]/page.tsx  # Module view with lessons
│   ├── quiz/[quizId]/page.tsx      # Quiz taking interface
│   ├── certificate/[id]/verify/    # Public certificate verification
│   ├── live/page.tsx               # Live Q&A sessions list
│   ├── live/[sessionId]/page.tsx   # Session detail + Q&A
│   ├── affiliate/page.tsx          # Affiliate program
│   ├── admin/page.tsx              # Admin dashboard
│   ├── admin/students/             # Student management
│   ├── admin/modules/              # Module CRUD
│   ├── admin/quizzes/              # Quiz/question management
│   ├── admin/live-sessions/        # Live session management
│   ├── admin/affiliates/           # Affiliate management
│   └── api/                        # API routes
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── navbar.tsx                  # Navigation bar
│   ├── language-toggle.tsx         # EN/ES switcher
│   ├── module-grid.tsx             # Blueprint-style module grid
│   ├── module-tile.tsx             # Individual module tile
│   ├── progress-bar.tsx            # Animated progress bar
│   ├── video-player.tsx            # Video embed player
│   ├── countdown.tsx               # Countdown timer
│   └── milestone-toast.tsx         # Milestone notification
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # NextAuth configuration
│   ├── utils.ts                    # Utilities (cn, localization, etc.)
│   ├── certificate.ts              # PDF certificate generation
│   └── actions/                    # Server actions
│       ├── progress.ts             # Progress tracking
│       ├── quiz.ts                 # Quiz submission + grading
│       ├── enrollment.ts           # Course enrollment
│       ├── certificate.ts          # Certificate generation
│       ├── live.ts                 # Live session actions
│       ├── affiliate.ts            # Affiliate tracking
│       ├── admin.ts                # Admin management
│       └── locale.ts               # Language switching
├── i18n/
│   ├── request.ts                  # next-intl config
│   └── messages/
│       ├── en.json                 # English translations
│       └── es.json                 # Spanish translations
└── middleware.ts                    # Locale + affiliate tracking
```

## Course Progression Logic

1. Student enrolls → Module 1 unlocked, all others locked
2. Student completes lessons → Can take module quiz
3. Quiz graded → Must score >= 80% (configurable)
4. Pass → Current module marked COMPLETED, next module UNLOCKED
5. Fail → Must retake (questions randomized), next module stays LOCKED
6. All modules completed → Certificate generated

## Key Design Decisions

- **Server Components by default** — Pages fetch data server-side, client components for interactivity
- **Server Actions** — Form submissions and mutations use Next.js server actions
- **Bilingual content** — Stored as dual columns (titleEn/titleEs) in the database
- **Quiz security** — Correct answers never sent to client until quiz is passed
- **Module gating** — Enforced both in UI and server-side (middleware + server actions)

## Deployment (Vercel)

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Vercel auto-detects Next.js and deploys

For the database, use [Neon](https://neon.tech), [Supabase](https://supabase.com), or any PostgreSQL provider.

## Admin Features

- View enrollment + completion analytics
- Edit module content (EN + ES)
- Manage quiz questions and passing scores
- Reset student progress
- Schedule live Q&A sessions
- Approve/reject affiliate applications
- Track commissions and process payouts

## License

Private — All rights reserved.
