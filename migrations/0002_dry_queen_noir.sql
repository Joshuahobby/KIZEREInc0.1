CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"image" text NOT NULL,
	"category" text NOT NULL,
	"author_id" integer,
	"author_name" text,
	"status" text DEFAULT 'published' NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"consent_type" text NOT NULL,
	"consent_given" boolean DEFAULT true NOT NULL,
	"consent_text" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ownership_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"from_user_id" integer,
	"to_user_id" integer NOT NULL,
	"registered_by" integer NOT NULL,
	"event" text DEFAULT 'sale' NOT NULL,
	"notes" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" text,
	"serial_number" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Other' NOT NULL,
	"retailer_id" integer NOT NULL,
	"current_owner_id" integer NOT NULL,
	"registration_date" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'registered' NOT NULL,
	"metadata" json,
	CONSTRAINT "pos_products_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "retailers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"api_key" text NOT NULL,
	"subscription_plan" text DEFAULT 'basic' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"user_id" integer NOT NULL,
	"logo_url" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "retailers_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp (6) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"channel" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "verification_status" SET DEFAULT 'unverified';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "two_factor_enabled" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "is_featured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "featured_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "national_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_method" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "processing_restricted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deletion_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_password_expires" timestamp;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_ledger" ADD CONSTRAINT "ownership_ledger_product_id_pos_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."pos_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_ledger" ADD CONSTRAINT "ownership_ledger_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_ledger" ADD CONSTRAINT "ownership_ledger_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_ledger" ADD CONSTRAINT "ownership_ledger_registered_by_retailers_id_fk" FOREIGN KEY ("registered_by") REFERENCES "public"."retailers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_products" ADD CONSTRAINT "pos_products_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_products" ADD CONSTRAINT "pos_products_current_owner_id_users_id_fk" FOREIGN KEY ("current_owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailers" ADD CONSTRAINT "retailers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_post_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_post_status_idx" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "consent_user_idx" ON "consent_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "consent_type_idx" ON "consent_records" USING btree ("consent_type");--> statement-breakpoint
CREATE INDEX "ledger_product_idx" ON "ownership_ledger" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "ledger_to_user_idx" ON "ownership_ledger" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "ledger_event_idx" ON "ownership_ledger" USING btree ("event");--> statement-breakpoint
CREATE INDEX "ledger_timestamp_idx" ON "ownership_ledger" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "pos_product_serial_idx" ON "pos_products" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "pos_product_sku_idx" ON "pos_products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "pos_product_retailer_idx" ON "pos_products" USING btree ("retailer_id");--> statement-breakpoint
CREATE INDEX "pos_product_owner_idx" ON "pos_products" USING btree ("current_owner_id");--> statement-breakpoint
CREATE INDEX "pos_product_status_idx" ON "pos_products" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "retailer_api_key_idx" ON "retailers" USING btree ("api_key");--> statement-breakpoint
CREATE INDEX "retailer_user_idx" ON "retailers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "retailer_status_idx" ON "retailers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "verification_code_user_idx" ON "verification_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_code_type_idx" ON "verification_codes" USING btree ("type");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_national_id_unique" UNIQUE("national_id");