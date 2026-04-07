CREATE TABLE "pos_security_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"retailer_id" integer NOT NULL,
	"serial_number" text NOT NULL,
	"product_name" text,
	"alert_type" text NOT NULL,
	"details" text,
	"metadata" json,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retailer_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"retailer_id" integer NOT NULL,
	"ledger_entry_id" integer NOT NULL,
	"transaction_value" numeric NOT NULL,
	"commission_amount" numeric NOT NULL,
	"currency" text DEFAULT 'RWF' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"pawapay_payout_id" text,
	"payout_destination" text,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "retailer_customer_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"retailer_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"internal_notes" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ownership_ledger" ADD COLUMN "purchase_agreement" text;--> statement-breakpoint
ALTER TABLE "ownership_ledger" ADD COLUMN "legal_doc_url" text;--> statement-breakpoint
ALTER TABLE "retailers" ADD COLUMN "commission_rate" numeric DEFAULT '0.05' NOT NULL;--> statement-breakpoint
ALTER TABLE "retailers" ADD COLUMN "wallet_phone" text;--> statement-breakpoint
ALTER TABLE "pos_security_alerts" ADD CONSTRAINT "pos_security_alerts_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailer_commissions" ADD CONSTRAINT "retailer_commissions_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailer_commissions" ADD CONSTRAINT "retailer_commissions_ledger_entry_id_ownership_ledger_id_fk" FOREIGN KEY ("ledger_entry_id") REFERENCES "public"."ownership_ledger"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailer_customer_settings" ADD CONSTRAINT "retailer_customer_settings_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailer_customer_settings" ADD CONSTRAINT "retailer_customer_settings_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "security_alert_retailer_idx" ON "pos_security_alerts" USING btree ("retailer_id");--> statement-breakpoint
CREATE INDEX "security_alert_serial_idx" ON "pos_security_alerts" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "security_alert_timestamp_idx" ON "pos_security_alerts" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "commission_retailer_idx" ON "retailer_commissions" USING btree ("retailer_id");--> statement-breakpoint
CREATE INDEX "commission_ledger_idx" ON "retailer_commissions" USING btree ("ledger_entry_id");--> statement-breakpoint
CREATE INDEX "commission_status_idx" ON "retailer_commissions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "retailer_customer_unique_idx" ON "retailer_customer_settings" USING btree ("retailer_id","customer_id");--> statement-breakpoint
CREATE INDEX "rcs_retailer_idx" ON "retailer_customer_settings" USING btree ("retailer_id");--> statement-breakpoint
CREATE INDEX "rcs_customer_idx" ON "retailer_customer_settings" USING btree ("customer_id");