-- Migration: Add deleted_at column for 30-day soft delete / archive retention policy
-- Applied: 2026-08-20

ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);
