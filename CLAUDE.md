# PyThrone MVP - Project Context

## Overview
- **Project:** Snake Breeder Management System for Polo
- **Live URL:** https://polo-snake-mvp.netlify.app
- **GitHub:** December08th/polo-snake-breeder-mvp
- **Netlify:** Connected to GitHub repo (auto-deploys on push)
- **Supabase Project:** guqxoychegqxreywfinv (PoloSnake)

---

## Tech Stack
- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Hosting:** Netlify (frontend), Supabase Cloud (backend)

---

## Current State (as of 01 Feb 2026)

### What's Working
- User authentication (email/password signup & login)
- Email confirmation flow for new signups
- Per-user data isolation via RLS policies
- Snake collection view (grid layout, dark theme)
- Add Snake form with all fields
- Live deployment at https://polo-snake-mvp.netlify.app

### Database Schema
All tables have `user_id` column for multi-tenancy:
1. **snakes** - Core snake profiles (name, sex, morph, weight, status, price, etc.)
2. **weight_logs** - Weight tracking history
3. **feeding_logs** - Feeding records
4. **pairings** - Breeding pairs (female + status + dates)
5. **pairing_males** - Junction table for dual-sired pairings
6. **follicle_checks** - Ultrasound tracking
7. **clutches** - Egg/hatch tracking
8. **morphs** - Reference data (global, seeded with common morphs)

### Key Files
- `app/src/App.tsx` - Main app with auth gate
- `app/src/contexts/AuthContext.tsx` - Session management
- `app/src/components/Auth.tsx` - Login/signup form
- `app/src/components/AddSnakeForm.tsx` - Snake creation form
- `app/src/types/database.ts` - TypeScript interfaces
- `supabase/migrations/` - Database migrations

---

## Completed Work

### Session 1 (01 Feb 2026 - Morning)
- [x] MVP feedback form
- [x] REQUIREMENTS.md with Phase 1 specs
- [x] SCHEMA.md with database design
- [x] Supabase project setup
- [x] Initial database migration
- [x] React app scaffold
- [x] Snake collection view + Add Snake form

### Session 2 (01 Feb 2026 - Afternoon)
- [x] **Multi-tenancy & Auth implementation**
  - Added `user_id` columns to 7 tables
  - Created RLS policies for data isolation
  - Built custom Auth component (login/signup)
  - Added AuthContext for session management
  - Updated all forms to include `user_id`
- [x] Supabase CLI setup for migrations
- [x] Pushed migrations to cloud Supabase
- [x] Netlify environment variables configured
- [x] Production deployment working

---

## Next Steps (Priority Order)

### 1. Collection View Enhancements
- Group snakes by status (Male Breeders, Female Breeders, Holdbacks, For Sale)
- Sort by weight within groups
- Add edit/delete functionality for snakes

### 2. Weight Logging
- Add weight log form (per snake)
- Display weight history
- Basic growth trend chart

### 3. Feeding Log (Low Priority)
- Simple "fed today" button
- Track refusals
- Show "days since last meal"

### 4. Pairing Manager (Key Feature)
- Create pairing (female + male(s))
- Track lock dates and counts
- Follicle check logging with size in mm
- Auto-calculate next check date based on follicle size
- Track ovulation date and Pre-Lay Shed (PLS)

### 5. Clutch Tracker
- Link clutch to pairing
- Track lay date, egg counts (fertile/slug/kink)
- Hatch countdown (57 days from lay)

---

## Environment Setup

### Local Development
```bash
cd C:\dev\polo-snake-breeder-mvp\app
npm install
npm run dev
```

### Environment Variables
Already configured in:
- `app/.env` - Local development (points to cloud Supabase)
- Netlify dashboard - Production deployment

### Supabase CLI (for migrations)
```bash
# Login (run in your terminal, not through Claude)
npx supabase login

# Link to project
npx supabase link --project-ref guqxoychegqxreywfinv

# Push new migrations
npx supabase db push
```

Note: Docker Desktop required for local Supabase (`supabase start`), but virtualization must be enabled in BIOS. Cloud-based development works without Docker.

---

## Polo's Requirements Summary

### Snake Profiles
- Name, sex, morph, genetics, DOB, weight, status, rack size, price, notes
- Photo support (future)

### Collection View Groups
- Male Breeders, Female Breeders, Holdbacks, For Sale
- Sorted by weight within groups

### Pairing Manager (Critical)
- Follicle tracking with ultrasound schedule:
  - Monthly when <20mm
  - Biweekly when >20mm
  - Weekly when >30mm until ovulation
- Track Pre-Lay Shed (PLS) date

### Clutch Tracker
- Egg counts, hatch countdown, link offspring to clutch

---

## Credentials & Access

### Supabase
- Project: guqxoychegqxreywfinv
- Dashboard: https://supabase.com/dashboard/project/guqxoychegqxreywfinv
- API URL: https://guqxoychegqxreywfinv.supabase.co

### Netlify
- Site: polo-snake-mvp
- Dashboard: https://app.netlify.com/sites/polo-snake-mvp

### GitHub
- Repo: December08th/polo-snake-breeder-mvp
