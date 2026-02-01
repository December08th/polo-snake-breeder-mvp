-- Add breeder_id column to snakes table
-- This stores the original snake IDs from Polo's system (e.g., "#9", "C5-23-A")

ALTER TABLE snakes ADD COLUMN breeder_id TEXT;

-- Add a comment explaining the field
COMMENT ON COLUMN snakes.breeder_id IS 'Original breeder ID from Polo''s system. Formats include simple numbers (#9) and clutch references (C5-23-A = Clutch 5, 2023, snake A)';
