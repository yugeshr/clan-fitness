ALTER TABLE "check_ins" DROP CONSTRAINT "check_ins_clan_id_clans_id_fk";
--> statement-breakpoint
DROP INDEX "check_ins_clan_created_at_idx";--> statement-breakpoint
CREATE INDEX "check_ins_created_at_idx" ON "check_ins" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "clan_memberships_clan_idx" ON "clan_memberships" USING btree ("clan_id");--> statement-breakpoint
ALTER TABLE "check_ins" DROP COLUMN "clan_id";