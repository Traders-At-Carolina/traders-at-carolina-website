CREATE TABLE "game_contacts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"player_id" uuid NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"email" text,
	"score_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_scores" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"game" text NOT NULL,
	"score" integer NOT NULL,
	"detail" jsonb NOT NULL,
	"player_id" uuid NOT NULL,
	"user_id" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_contacts" ADD CONSTRAINT "game_contacts_score_id_game_scores_id_fk" FOREIGN KEY ("score_id") REFERENCES "public"."game_scores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_contacts_player_idx" ON "game_contacts" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "game_scores_game_score_idx" ON "game_scores" USING btree ("game","score");--> statement-breakpoint
CREATE INDEX "game_scores_player_idx" ON "game_scores" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "game_scores_user_idx" ON "game_scores" USING btree ("user_id");