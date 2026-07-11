ALTER TYPE "public"."notification_type" ADD VALUE 'broadcast';--> statement-breakpoint
CREATE TABLE "broadcast_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"clan_names" jsonb NOT NULL,
	"recipient_count" integer NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "broadcast_messages_sent_at_idx" ON "broadcast_messages" USING btree ("sent_at");