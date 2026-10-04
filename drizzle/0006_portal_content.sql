CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"audience" text DEFAULT 'signed_in' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"show_from" timestamp with time zone,
	"show_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_dates_order" CHECK ("announcements"."show_from" is null or "announcements"."show_until" is null or "announcements"."show_until" >= "announcements"."show_from")
);
--> statement-breakpoint
CREATE TABLE "portal_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"audience" text DEFAULT 'members' NOT NULL,
	"sort_order" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"kind" text NOT NULL,
	"section" text NOT NULL,
	"tracks" text[] DEFAULT '{}'::text[] NOT NULL,
	"description" text,
	"file" jsonb,
	"url" text,
	"audience" text DEFAULT 'members' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resources_one_source" CHECK (("resources"."file" is null) <> ("resources"."url" is null))
);
--> statement-breakpoint
CREATE INDEX "portal_links_order_idx" ON "portal_links" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "resources_section_order_idx" ON "resources" USING btree ("section","sort_order");