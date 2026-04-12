-- Migration: add phone/notes/value to Contact + contactId FK to IssuedDocument
-- Run once via: psql $DATABASE_URL -f this_file.sql
-- All operations are idempotent — safe to re-run.

-- ── Contact ──────────────────────────────────────────────────
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "value" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "Contact_status_value_idx"  ON "Contact"("status", "value");
CREATE INDEX IF NOT EXISTS "Contact_createdAt_idx"     ON "Contact"("createdAt");

-- ── IssuedDocument ───────────────────────────────────────────
ALTER TABLE "IssuedDocument" ADD COLUMN IF NOT EXISTS "contactId" TEXT;

-- FK (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'IssuedDocument_contactId_fkey'
  ) THEN
    ALTER TABLE "IssuedDocument"
      ADD CONSTRAINT "IssuedDocument_contactId_fkey"
      FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IssuedDocument_contactId_idx" ON "IssuedDocument"("contactId");
