-- Backfill: existing clutch-linked snakes with no status or ON_HOLD become HATCHLING
UPDATE snakes
SET status = 'HATCHLING'
WHERE clutch_id IS NOT NULL
  AND (status IS NULL OR status = 'ON_HOLD');
