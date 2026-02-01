-- Add multi-tenancy support with user_id columns and RLS policies
-- This migration adds data isolation per user

-- ============================================
-- DROP OLD RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Authenticated users full access" ON snakes;
DROP POLICY IF EXISTS "Authenticated users full access" ON weight_logs;
DROP POLICY IF EXISTS "Authenticated users full access" ON feeding_logs;
DROP POLICY IF EXISTS "Authenticated users full access" ON pairings;
DROP POLICY IF EXISTS "Authenticated users full access" ON pairing_males;
DROP POLICY IF EXISTS "Authenticated users full access" ON follicle_checks;
DROP POLICY IF EXISTS "Authenticated users full access" ON clutches;

-- ============================================
-- DELETE EXISTING DATA (clean slate for multi-tenancy)
-- ============================================

DELETE FROM follicle_checks;
DELETE FROM pairing_males;
DELETE FROM pairings;
DELETE FROM feeding_logs;
DELETE FROM weight_logs;
DELETE FROM snakes;
DELETE FROM clutches;

-- ============================================
-- ADD USER_ID COLUMNS
-- ============================================

ALTER TABLE snakes ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE weight_logs ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE feeding_logs ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pairings ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE pairing_males ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE follicle_checks ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clutches ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================
-- INDEXES FOR USER_ID
-- ============================================

CREATE INDEX idx_snakes_user ON snakes(user_id);
CREATE INDEX idx_weight_logs_user ON weight_logs(user_id);
CREATE INDEX idx_feeding_logs_user ON feeding_logs(user_id);
CREATE INDEX idx_pairings_user ON pairings(user_id);
CREATE INDEX idx_pairing_males_user ON pairing_males(user_id);
CREATE INDEX idx_follicle_checks_user ON follicle_checks(user_id);
CREATE INDEX idx_clutches_user ON clutches(user_id);

-- ============================================
-- RLS POLICIES - SNAKES
-- ============================================

CREATE POLICY "Users can view own snakes" ON snakes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snakes" ON snakes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snakes" ON snakes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snakes" ON snakes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - WEIGHT_LOGS
-- ============================================

CREATE POLICY "Users can view own weight_logs" ON weight_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight_logs" ON weight_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight_logs" ON weight_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight_logs" ON weight_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - FEEDING_LOGS
-- ============================================

CREATE POLICY "Users can view own feeding_logs" ON feeding_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feeding_logs" ON feeding_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feeding_logs" ON feeding_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feeding_logs" ON feeding_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - PAIRINGS
-- ============================================

CREATE POLICY "Users can view own pairings" ON pairings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pairings" ON pairings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pairings" ON pairings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pairings" ON pairings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - PAIRING_MALES
-- ============================================

CREATE POLICY "Users can view own pairing_males" ON pairing_males
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pairing_males" ON pairing_males
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pairing_males" ON pairing_males
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pairing_males" ON pairing_males
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - FOLLICLE_CHECKS
-- ============================================

CREATE POLICY "Users can view own follicle_checks" ON follicle_checks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own follicle_checks" ON follicle_checks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own follicle_checks" ON follicle_checks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own follicle_checks" ON follicle_checks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES - CLUTCHES
-- ============================================

CREATE POLICY "Users can view own clutches" ON clutches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clutches" ON clutches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clutches" ON clutches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clutches" ON clutches
  FOR DELETE USING (auth.uid() = user_id);
