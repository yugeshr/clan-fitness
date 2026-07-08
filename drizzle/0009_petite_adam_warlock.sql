DROP INDEX "comments_check_in_id_idx";--> statement-breakpoint
DROP INDEX "reactions_check_in_user_emoji_idx";--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "clan_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reactions" ALTER COLUMN "clan_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "comments_check_in_id_clan_id_idx" ON "comments" USING btree ("check_in_id","clan_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reactions_check_in_clan_user_emoji_idx" ON "reactions" USING btree ("check_in_id","clan_id","user_id","emoji");