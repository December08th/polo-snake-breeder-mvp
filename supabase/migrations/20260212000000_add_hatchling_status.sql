-- Add HATCHLING status to snake_status enum
ALTER TYPE snake_status ADD VALUE IF NOT EXISTS 'HATCHLING';
