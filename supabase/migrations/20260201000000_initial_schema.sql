-- PyThrone Database Migration
-- Initial schema for local Supabase development

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE snake_status AS ENUM (
  'F_BREEDER', 'M_BREEDER',
  'F_HOLDBACK', 'M_HOLDBACK',
  'F_AVAILABLE', 'M_AVAILABLE',
  'ON_HOLD'
);

CREATE TYPE rack_size AS ENUM ('XL', 'L', 'S');

CREATE TYPE pairing_status AS ENUM ('ACTIVE', 'OVULATED', 'LAID', 'COMPLETE');

CREATE TYPE inheritance_type AS ENUM ('DOMINANT', 'CO_DOMINANT', 'RECESSIVE');

-- ============================================
-- TABLES
-- ============================================

-- Clutches (created first for FK reference)
CREATE TABLE clutches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clutch_number TEXT NOT NULL UNIQUE, -- e.g., "C14-25"
  pairing_id UUID, -- FK added after pairings table exists
  lay_date DATE,
  egg_count INTEGER DEFAULT 0,
  fertile_count INTEGER DEFAULT 0,
  slug_count INTEGER DEFAULT 0,
  kink_count INTEGER DEFAULT 0,
  expected_hatch_date DATE,
  actual_hatch_date DATE,
  hatch_count INTEGER DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snakes (core table)
CREATE TABLE snakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snake_number SERIAL, -- Auto-increment for #1, #2, etc.
  name TEXT,
  sex CHAR(1) CHECK (sex IN ('M', 'F')),
  morph TEXT,
  genetics TEXT,
  date_of_birth DATE,
  year INTEGER,
  weight_grams INTEGER,
  status snake_status,
  rack_size rack_size,
  price INTEGER, -- THB, null if not for sale
  photo_url TEXT,
  notes TEXT,
  clutch_id UUID REFERENCES clutches(id), -- If this snake is a hatchling
  clutch_letter CHAR(1), -- A, B, C, etc.
  consecutive_meals INTEGER DEFAULT 0,
  last_meal_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for snakes
CREATE INDEX idx_snakes_status ON snakes(status);
CREATE INDEX idx_snakes_sex ON snakes(sex);
CREATE INDEX idx_snakes_year ON snakes(year);
CREATE INDEX idx_snakes_clutch ON snakes(clutch_id);

-- Weight logs
CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snake_id UUID NOT NULL REFERENCES snakes(id) ON DELETE CASCADE,
  weight_grams INTEGER NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weight_logs_snake ON weight_logs(snake_id);

-- Feeding logs (simplified)
CREATE TABLE feeding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snake_id UUID NOT NULL REFERENCES snakes(id) ON DELETE CASCADE,
  fed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  accepted BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feeding_logs_snake ON feeding_logs(snake_id);

-- Pairings
CREATE TABLE pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  female_id UUID NOT NULL REFERENCES snakes(id),
  pairing_start DATE,
  ovulation_date DATE,
  pre_lay_shed_date DATE, -- PLS - IMPORTANT
  status pairing_status DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pairings_female ON pairings(female_id);
CREATE INDEX idx_pairings_status ON pairings(status);

-- Add FK from clutches to pairings (now that pairings exists)
ALTER TABLE clutches
ADD CONSTRAINT fk_clutches_pairing
FOREIGN KEY (pairing_id) REFERENCES pairings(id);

-- Pairing males (junction table for dual-sired)
CREATE TABLE pairing_males (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id UUID NOT NULL REFERENCES pairings(id) ON DELETE CASCADE,
  male_id UUID NOT NULL REFERENCES snakes(id),
  lock_count INTEGER DEFAULT 0,
  last_lock_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pairing_id, male_id)
);

CREATE INDEX idx_pairing_males_pairing ON pairing_males(pairing_id);
CREATE INDEX idx_pairing_males_male ON pairing_males(male_id);

-- Follicle checks
CREATE TABLE follicle_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pairing_id UUID NOT NULL REFERENCES pairings(id) ON DELETE CASCADE,
  checked_at DATE NOT NULL DEFAULT CURRENT_DATE,
  follicle_size_mm INTEGER,
  notes TEXT,
  next_check_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_follicle_checks_pairing ON follicle_checks(pairing_id);

-- Morphs reference table (for future genetics calculator)
CREATE TABLE morphs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  inheritance inheritance_type,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER snakes_updated_at
  BEFORE UPDATE ON snakes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER clutches_updated_at
  BEFORE UPDATE ON clutches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pairings_updated_at
  BEFORE UPDATE ON pairings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate expected hatch date (57 days from lay)
CREATE OR REPLACE FUNCTION set_expected_hatch_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lay_date IS NOT NULL AND NEW.expected_hatch_date IS NULL THEN
    NEW.expected_hatch_date = NEW.lay_date + INTERVAL '57 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clutches_set_hatch_date
  BEFORE INSERT OR UPDATE ON clutches
  FOR EACH ROW EXECUTE FUNCTION set_expected_hatch_date();

-- Calculate next follicle check date based on size
CREATE OR REPLACE FUNCTION set_next_follicle_check()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.follicle_size_mm IS NOT NULL THEN
    IF NEW.follicle_size_mm < 20 THEN
      NEW.next_check_due = NEW.checked_at + INTERVAL '30 days';
    ELSIF NEW.follicle_size_mm <= 30 THEN
      NEW.next_check_due = NEW.checked_at + INTERVAL '14 days';
    ELSE
      NEW.next_check_due = NEW.checked_at + INTERVAL '7 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follicle_checks_set_next
  BEFORE INSERT OR UPDATE ON follicle_checks
  FOR EACH ROW EXECUTE FUNCTION set_next_follicle_check();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE snakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pairing_males ENABLE ROW LEVEL SECURITY;
ALTER TABLE follicle_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clutches ENABLE ROW LEVEL SECURITY;
ALTER TABLE morphs ENABLE ROW LEVEL SECURITY;

-- Morphs are global reference data - all authenticated users can read
CREATE POLICY "Authenticated users can read morphs" ON morphs
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- SEED DATA: Common morphs
-- ============================================

INSERT INTO morphs (name, inheritance) VALUES
  ('Clown', 'RECESSIVE'),
  ('Pied', 'RECESSIVE'),
  ('Albino', 'RECESSIVE'),
  ('Axanthic', 'RECESSIVE'),
  ('Ghost', 'RECESSIVE'),
  ('Pastel', 'CO_DOMINANT'),
  ('Enchi', 'CO_DOMINANT'),
  ('Yellow Belly', 'CO_DOMINANT'),
  ('Black Pastel', 'CO_DOMINANT'),
  ('Cinnamon', 'CO_DOMINANT'),
  ('Mojave', 'CO_DOMINANT'),
  ('Lesser', 'CO_DOMINANT'),
  ('Butter', 'CO_DOMINANT'),
  ('Fire', 'CO_DOMINANT'),
  ('Spotnose', 'CO_DOMINANT'),
  ('Crypton', 'CO_DOMINANT'),
  ('Desert Ghost', 'CO_DOMINANT'),
  ('Tri-Stripe', 'RECESSIVE'),
  ('Sandblast', 'CO_DOMINANT'),
  ('Killer', 'DOMINANT'),
  ('Spider', 'DOMINANT'),
  ('Pinstripe', 'DOMINANT');
