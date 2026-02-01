# PyThrone Database Schema

## Overview
PostgreSQL database hosted on Supabase. Designed to match Polo's existing Google Sheets structure.

---

## Tables

### 1. snakes
The core table. Every snake in the collection.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key (Supabase default) |
| snake_number | integer | Display ID (#9, #28, etc.) |
| name | text | Optional name (Penny, Hong Tong) |
| sex | text | 'M' or 'F' |
| morph | text | Visual morph description |
| genetics | text | Full genetic notation (het, poss het, etc.) |
| date_of_birth | date | |
| year | integer | Birth year (for quick filtering) |
| weight_grams | integer | Current weight |
| status | text | F_BREEDER, M_BREEDER, F_HOLDBACK, M_HOLDBACK, F_AVAILABLE, M_AVAILABLE, ON_HOLD |
| rack_size | text | XL, L, S (derived from weight, or manual) |
| price | integer | Sale price in THB (null if not for sale) |
| photo_url | text | Supabase storage URL |
| notes | text | Free-form notes |
| clutch_id | uuid | FK → clutches (if this snake is a hatchling) |
| clutch_letter | text | A, B, C, etc. (position in clutch) |
| consecutive_meals | integer | For sale readiness (need 4) |
| days_since_meal | integer | Calculated or last updated |
| last_meal_date | date | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:** status, sex, year, clutch_id

---

### 2. weight_logs
Weight recorded after each shed (~every 6 weeks).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| snake_id | uuid | FK → snakes |
| weight_grams | integer | |
| recorded_at | date | |
| notes | text | e.g., "post-shed" |
| created_at | timestamptz | |

---

### 3. feeding_logs
Simplified: only track refusals and meal confirmations.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| snake_id | uuid | FK → snakes |
| fed_at | date | |
| accepted | boolean | true = ate, false = refused |
| notes | text | |
| created_at | timestamptz | |

---

### 4. pairings
Breeding pair tracking. Supports dual-sired clutches.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| female_id | uuid | FK → snakes |
| pairing_start | date | When pairing began |
| ovulation_date | date | Ovi date |
| pre_lay_shed_date | date | PLS - IMPORTANT |
| days_pairing_to_ovi | integer | Calculated |
| days_pls_to_lay | integer | Calculated |
| status | text | ACTIVE, OVULATED, LAID, COMPLETE |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### 5. pairing_males
Junction table for dual-sired pairings.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| pairing_id | uuid | FK → pairings |
| male_id | uuid | FK → snakes |
| lock_count | integer | Number of locks observed |
| last_lock_date | date | |
| created_at | timestamptz | |

---

### 6. follicle_checks
Ultrasound tracking for follicle development.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| pairing_id | uuid | FK → pairings |
| checked_at | date | |
| follicle_size_mm | integer | Size in millimeters |
| notes | text | |
| next_check_due | date | Auto-calculated based on size |
| created_at | timestamptz | |

**Schedule logic:**
- < 20mm → next check in 30 days
- 20-30mm → next check in 14 days
- > 30mm → next check in 7 days

---

### 7. clutches
Egg/incubation tracking.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| clutch_number | text | e.g., "C14-25" (clutch 14 of 2025) |
| pairing_id | uuid | FK → pairings |
| lay_date | date | |
| egg_count | integer | Total eggs |
| fertile_count | integer | Viable eggs |
| slug_count | integer | Infertile |
| kink_count | integer | Eggs with issues |
| expected_hatch_date | date | lay_date + 57 days |
| actual_hatch_date | date | |
| hatch_count | integer | Successful hatches |
| remarks | text | Notes about issues, euthanized, etc. |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

### 8. morphs (optional, for Phase 2)
Reference table for known morphs and inheritance.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | e.g., "Clown", "Pied" |
| inheritance | text | DOMINANT, CO_DOMINANT, RECESSIVE |
| description | text | |

*For Phase 1, we'll store morphs as text on the snake record. This table enables genetics calculator later.*

---

## Relationships Diagram

```
snakes
  ├── weight_logs (1:many)
  ├── feeding_logs (1:many)
  ├── pairings (as female, 1:many)
  ├── pairing_males (as male, 1:many)
  └── clutches (as hatchling via clutch_id, many:1)

pairings
  ├── pairing_males (1:many)
  ├── follicle_checks (1:many)
  └── clutches (1:many)

clutches
  └── snakes (1:many, hatchlings)
```

---

## Polo's ID Convention Mapping

| Polo's Format | Database Storage |
|---------------|------------------|
| #28 | snakes.snake_number = 28 |
| C8-24 | clutches.clutch_number = "C8-24" |
| #28 C8-24-B | snake_number=28, clutch_id→C8-24, clutch_letter="B" |

Display format reconstructed: `#{snake_number} {clutch_number}-{clutch_letter}`

---

## Supabase Storage Buckets

| Bucket | Purpose |
|--------|---------|
| snake-photos | Snake profile images |
| documents | Receipts, vet records, etc. (future) |

---

## Row Level Security (RLS)

For MVP (single user), simple policy:
- All tables: authenticated users can CRUD all rows
- Future: Add breeder_id column for multi-tenant support

---

## Next Steps

1. Create Supabase project
2. Run SQL to create tables
3. Set up storage bucket for photos
4. Generate TypeScript types from schema
5. Build Snake Profiles CRUD
