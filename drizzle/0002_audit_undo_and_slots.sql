ALTER TABLE "audit_log" ADD COLUMN "entity_id" text;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "before" jsonb;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "after" jsonb;--> statement-breakpoint
ALTER TABLE "people" ADD COLUMN "visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "membership_order" smallint;--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity","entity_id","at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "photos_membership_order_idx" ON "photos" USING btree ("membership_order");--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_membership_order_range" CHECK ("photos"."membership_order" between 1 and 3);