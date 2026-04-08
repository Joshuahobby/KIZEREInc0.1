CREATE TABLE IF NOT EXISTS "public_verify_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"source" text NOT NULL,
	"item_status" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"looked_up_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pvl_identifier_idx" ON "public_verify_logs" USING btree ("identifier");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pvl_looked_up_at_idx" ON "public_verify_logs" USING btree ("looked_up_at");
