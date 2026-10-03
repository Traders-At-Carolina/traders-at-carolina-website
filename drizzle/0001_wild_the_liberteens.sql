CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text NOT NULL,
	"actor_email" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_label" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"group" text NOT NULL,
	"track" text,
	"sort_order" smallint NOT NULL,
	"class_year" smallint,
	"major" text,
	"headshot" jsonb,
	"alt" text,
	"placement_note" text,
	"company_id" uuid,
	"linkedin" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "people_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image" jsonb NOT NULL,
	"alt" text NOT NULL,
	"caption" text NOT NULL,
	"ratio" text NOT NULL,
	"home_order" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "photos_home_order_range" CHECK ("photos"."home_order" between 1 and 3)
);
--> statement-breakpoint
CREATE TABLE "placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm" text NOT NULL,
	"logo" jsonb,
	"logo_on_dark" jsonb,
	"show_on_wall" boolean DEFAULT false NOT NULL,
	"wall_order" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"relationship" text,
	"url" text,
	"logo" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" text PRIMARY KEY NOT NULL,
	"role_label" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"good_fit" text,
	"sample_problem" text,
	"recommended_background" text[] NOT NULL,
	"lead_slug" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_company_id_placements_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."placements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_lead_slug_people_slug_fk" FOREIGN KEY ("lead_slug") REFERENCES "public"."people"("slug") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "audit_log_at_idx" ON "audit_log" USING btree ("at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "people_group_order_idx" ON "people" USING btree ("group","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "photos_home_order_idx" ON "photos" USING btree ("home_order");--> statement-breakpoint
CREATE UNIQUE INDEX "placements_firm_ci_idx" ON "placements" USING btree (lower("firm"));--> statement-breakpoint
CREATE UNIQUE INDEX "sponsors_name_ci_idx" ON "sponsors" USING btree (lower("name"));