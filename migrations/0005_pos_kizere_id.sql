-- Add kizere_id column to pos_products
-- This is a KIZERE-generated immutable trust anchor, independent of the retailer-supplied serialNumber.
-- Existing rows are backfilled with gen_random_uuid() so the NOT NULL constraint is satisfied immediately.

ALTER TABLE "pos_products"
  ADD COLUMN IF NOT EXISTS "kizere_id" text;

-- Backfill existing rows before applying NOT NULL + UNIQUE
UPDATE "pos_products"
  SET "kizere_id" = gen_random_uuid()::text
  WHERE "kizere_id" IS NULL;

ALTER TABLE "pos_products"
  ALTER COLUMN "kizere_id" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "pos_product_kizere_id_idx"
  ON "pos_products" ("kizere_id");
