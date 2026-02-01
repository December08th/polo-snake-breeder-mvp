# PyThrone MVP - Project Context

## Overview
- **Project:** Snake Breeder Management System for Polo
- **Live URL:** https://polo-snake-mvp.netlify.app
- **GitHub:** December08th/polo-snake-breeder-mvp
- **Netlify:** Connected to GitHub repo (auto-deploys on push)
- **Supabase Project:** guqxoychegqxreywfinv (PoloSnake)

---

## Completed Work (Session: 01 Feb 2026)

### Phase 1: Planning & Requirements
- [x] MVP feedback form with Phase 1, 2, 3 feature descriptions
- [x] Dark theme with green/gold accents
- [x] Form auto-save to localStorage
- [x] Navigation warning on unsaved changes
- [x] REQUIREMENTS.md created with full Phase 1 specs
- [x] Received and analyzed Polo's Google Sheet screenshots (3 images)

### Phase 2: Database & Backend
- [x] Chose tech stack: Supabase + React
- [x] Created SCHEMA.md with full database design (8 tables)
- [x] Created supabase-migration.sql
- [x] Set up Supabase project (free tier)
- [x] Ran database migration (all tables created)
- [x] Fixed RLS policies for anonymous access (MVP)

### Phase 3: React App
- [x] Scaffolded React + TypeScript app with Vite (`/app` folder)
- [x] Installed @supabase/supabase-js
- [x] Created Supabase client (`src/lib/supabase.ts`)
- [x] Created TypeScript types (`src/types/database.ts`)
- [x] Built Snake Collection view (grid layout, dark theme)
- [x] Built Add Snake form (modal, all fields)
- [x] **First snake added successfully!**

---

## Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Hosting:** Netlify (frontend), Supabase Cloud (backend)

## Database Tables
1. snakes - Core snake profiles
2. weight_logs - Weight tracking
3. feeding_logs - Feeding records (simplified)
4. pairings - Breeding pairs
5. pairing_males - Junction for dual-sired
6. follicle_checks - Ultrasound tracking
7. clutches - Egg/hatch tracking
8. morphs - Reference data (seeded)

---

## Polo's Feedback (Jan 2026)

### Snake Profiles
- Current plan is good
- **Add:** Price field for snakes marked "for sale"

### Collection View
- **Groups:** Male breeders, Female breeders, Holdbacks, For Sale
- **Sort:** Rank by weight within each group

### Feeding Log
- **LOW PRIORITY** - Polo finds detailed logging too time-consuming
- Only tracks refusals and "days since last meal"
- Consider simplified approach or making this optional

### Weight Log
- Records weight after each shed (~every 6 weeks)
- Basic growth trend chart needed

### Pairing Manager (ENHANCED - key feature)
- Track pairings, breeding attempts, and locks
- Goal: 1-2 locks per month per female
- **Follicle tracking is critical:**
  - Record follicle size in mm
  - Ultrasound schedule:
    - Monthly when follicles <20mm
    - Biweekly when >20mm
    - Weekly when >30mm until ovulation
  - Track ovulation date

### Clutch Tracker
- Egg count (fertile)
- Slug count (infertile eggs)
- Lay date + Hatch date with countdown
- **Polo will send Google Sheet screenshots** for reference

### Basic Genetics
- Three inheritance types: Dominant, Co-dominant, Recessive
- Need visual notation system

---

## Pending
- [x] Create REQUIREMENTS.md with structured specs
- [x] Received Polo's Google Sheet screenshots (Snake Room, Incubator, For Sale)
- [x] Link Netlify to GitHub repo (auto-deploy enabled)
- [x] Choose tech stack: Supabase + React
- [x] Create SCHEMA.md with database design
- [ ] Create Supabase project
- [ ] Set up React app scaffold
- [ ] Build Snake Profiles CRUD

---

## Google Sheet Screenshots (received 01 Feb 2026)

### 1. Snake Room
- Full collection inventory with ID, Name, Morph, Weight, Status, Price
- Organized by rack size (XL/L/S)
- Summary totals and rack occupancy

### 2. Incubator
- Clutch tracking with pairing, ovulation, PLS, lay, hatch dates
- Egg counts, kink tracking, remarks
- Key metrics calculated (Ovi→Lay, PLS→Lay averages)

### 3. For Sale
- Sales listing with bulk discount tiers
- 25% deposit system, sale readiness requirements
- NGU ART branding with contact info

### Key Addition from Polo
- **Pre-Lay Shed (PLS) date is important** - must be tracked in Pairing Manager
