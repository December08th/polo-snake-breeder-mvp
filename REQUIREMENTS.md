# PyThrone Phase 1 Requirements

## Overview
This document captures the requirements for Phase 1 of PyThrone, based on Polo's feedback and Google Sheets screenshots.

---

## 1. Snake Profiles

Each snake profile includes:
- **ID** - Unique identifier (e.g., #9, #21 C6-23-A)
- **Name** - Snake's name (e.g., Penny, Hong Tong)
- **Photo** - Primary image with "view photo" link capability
- **Sex** - Male/Female
- **Morph** - Visual appearance (e.g., Clown Het Pied, Sandblast Killer Pied)
- **Genetics** - Genetic traits (see Section 7)
- **Year** - Birth year (for age tracking)
- **DOB** - Date of birth
- **Weight** - Current weight in grams
- **Status** - See Collection View groupings
- **Notes** - Free-form notes field
- **Price** - For snakes marked "For Sale" (in THB)

---

## 2. Collection View

### Groupings (Status Categories)
Based on Polo's actual categories:
1. **F BREEDER** - Female breeders
2. **M BREEDER** - Male breeders
3. **F HOLDBACK** - Female holdbacks
4. **M HOLDBACK** - Male holdbacks
5. **F AVAILABLE** - Females for sale
6. **M AVAILABLE** - Males for sale
7. **ON HOLD** - Reserved/pending sale

### Organization by Size
Snakes organized by rack/weight class:
- **XL RACKS** - 2000g+
- **L RACKS** - 500 to 2000g
- **S RACKS** - < 500g

### Sorting
- Rank by weight within each group (heaviest first)

### Summary Dashboard
Display totals for:
- Count by status category
- Total collection size
- For Sale count
- Total resale value
- Rack occupancy (occupied vs empty slots)

### Display Options
- List view
- Grid view
- Search by name/ID
- Filter by status/morph/genetics

---

## 3. Feeding Log

**Priority:** Low

Polo finds detailed per-feeding logging too time-consuming.

### Simplified Approach
- Track **refusals only** (not every successful feeding)
- Display **days since last meal** for each snake
- Track **consecutive meals eaten** (for sale readiness: 4 meals required)
- Skip detailed per-feeding records

---

## 4. Weight Log

- Record weight after each shed (~every 6 weeks)
- Display basic growth chart over time
- Weight determines rack placement (XL/L/S)

---

## 5. Pairing Manager (Enhanced)

### Core Tracking
- Track pairings between male and female
- Record breeding attempts
- Record locks (successful copulation)
- Support for **dual sired clutches** (multiple males)

### Goals
- Target: 1-2 locks per month per female

### Follicle Tracking
Record follicle size in millimeters with ultrasound schedule:

| Follicle Size | Ultrasound Frequency |
|---------------|---------------------|
| < 20mm        | Monthly             |
| > 20mm        | Biweekly            |
| > 30mm        | Weekly (until ovulation) |

### Key Dates to Track
- **Pairing start date**
- **Ovulation date** (Ovi)
- **Pre-Lay Shed date** (PLS) - **IMPORTANT per Polo**
- Days from pairing to ovulation
- Days from PLS to lay

### Reference Metrics (from Polo's data)
- Ovi→Lay: ~56 days average
- PLS→Lay: ~32 days average
- Pairing to ovulation: 2-7 months (avg 4 months)

---

## 6. Clutch Tracker

Based on Polo's Incubator sheet:

### Fields to Track
- **Clutch ID** - Unique identifier (e.g., C14-25)
- **Parent pairing** - Link to pairing record
- **Egg count** - Total eggs laid
- **Fertile count** - Viable eggs
- **Slug count** - Infertile eggs
- **Kink count** - Eggs with kinks
- **Lay date**
- **Expected hatch date** - Auto-calculated (~57 days from lay)
- **Actual hatch date**
- **Hatch count** - Successful hatches
- **Remarks** - Notes (e.g., "badly kinked/euthanized x1", "cut open on day 56")

### Hatchling Tracking
- Link hatchlings to clutch (ID format: #28 C8-24-B = snake #28 from clutch C8-24, snake B)
- Track which hatchlings survive to sale readiness

### Countdown Display
- Days until expected hatch
- Visual indicator as hatch approaches

---

## 7. Basic Genetics

### Inheritance Types
Three inheritance patterns to support:

1. **Dominant** - One copy produces the visual trait
2. **Co-dominant** - One copy produces a visual trait; two copies produce a "super" form
3. **Recessive** - Two copies required to produce the visual trait

### Common Morphs (from Polo's collection)
- Clown, Pied, Pastel, Enchi, Black Pastel
- Tri-Stripe, Albino, Desert Ghost, Killer
- Sandblast, Yellow Belly, Crypton, Spotnose
- Combinations (e.g., "Confusion Enchi Het Albino Poss Het Tri-Stripe")

### Display
- Visual notation showing each snake's genetic makeup
- Indicate het (heterozygous) status for recessive genes
- Show "poss het" for possible hets
- Support DH (double het) notation

---

## 8. For Sale / Marketplace (Phase 1 Lite)

Based on Polo's sales sheet:

### Listing Fields
- ID, Morph, Year, Price, Status, Photo link
- Status: AVAILABLE or ON HOLD

### Pricing Structure
- Individual snake prices
- **Bulk discounts:**
  - 2 snakes: 10% off
  - 3 snakes: 15% off
  - 4-5 snakes: 20% off
  - 6-10 snakes: 25% off
  - 10+ snakes: Custom quote

### Deposit System
- 25% non-refundable deposit to reserve
- Balance due before shipping/pickup
- Refund if snake unavailable due to health

### Sale Readiness
- Snake must have eaten 4 consecutive meals
- No health concerns

### Shipping
- Track shipping cost (200 THB per snake within Thailand)

---

---

## Development Approach

**Strategy:** Build with CRUD from the start using a lightweight backend (Supabase or Firebase).

### Build Order
1. **Snake Profiles + Collection View** — Core foundation
2. **Weight Log** — Simple addition to snake profiles
3. **Pairing Manager** — Links snakes, tracks breeding
4. **Clutch Tracker** — Links to pairings, tracks eggs → hatchlings
5. **For Sale View** — Filter/display layer on existing data
6. **Feeding Log** — Low priority, add last

### Tech Stack (Recommended)
- **Frontend:** React or Vue (or plain HTML/JS to start simple)
- **Backend:** Supabase (PostgreSQL + auth + API out of the box)
- **Hosting:** Netlify or Vercel (already using Netlify)

### Data Import
- Plan for CSV import from Polo's existing Google Sheets
- Match his ID conventions (e.g., #28 C8-24-B)

---

## Verification Checklist

- [ ] Review document with Polo for accuracy
- [ ] Ensure all feedback points are captured
- [ ] Confirm Pre-Lay Shed tracking is prominent
- [ ] Verify clutch ID naming convention matches Polo's system
- [ ] Confirm pricing/discount tiers are correct
- [ ] Confirm tech stack choice with Wes
