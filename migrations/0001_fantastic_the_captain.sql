CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"metadata" json,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_type" text DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric NOT NULL,
	"min_purchase" numeric DEFAULT '0',
	"max_discount" numeric,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"applicable_type" text DEFAULT 'all' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "status" SET DEFAULT 'Pending_Payment';--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "appeal_status" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "appeal_reason" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "appeal_admin_notes" text;--> statement-breakpoint
ALTER TABLE "claims" ADD COLUMN "appeal_resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "provider_ref" text;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "document_public_id" text;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "selfie_public_id" text;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD COLUMN "liveness_code" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_code_idx" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupon_status_idx" ON "coupons" USING btree ("status");--> statement-breakpoint
CREATE INDEX "push_sub_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "flutterwave_ref";