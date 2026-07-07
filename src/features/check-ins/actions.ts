"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { checkIns } from "@/db/schema";
import { getClanMembersForClanIds, getUserClans } from "@/features/clans/queries";
import { notifyUser } from "@/features/notifications/send";
import { getOrSyncCurrentUser } from "@/lib/current-user";
import { getTodaysCheckIn } from "./queries";
import type { CheckInType, FoodCheckInValue, FoodStatus } from "./types";

/**
 * Notifies every member across every clan the actor is currently in, deduped so someone sharing
 * 2+ clans with the actor isn't notified twice. `anchorCheckInId` lets the notification deep-link
 * straight to that day's card instead of just the clan feed — it must be the *last*-inserted
 * check-in of this submission, since the feed groups a user's same-day check-ins into one card
 * keyed by its newest entry (see groupByUserAndDay), and that's the id ReactionBar/CommentSheet
 * are bound to.
 */
async function notifyClansOfCheckIn(
  actorId: string,
  actorName: string,
  types: CheckInType[],
  anchorCheckInId?: string,
) {
  if (types.length === 0) return;

  const actorClans = await getUserClans(actorId);
  const clanIds = actorClans.map((c) => c.clan.id);
  if (clanIds.length === 0) return;

  const members = await getClanMembersForClanIds(clanIds);
  const recipientIds = new Set(members.map((m) => m.user.id).filter((id) => id !== actorId));

  const label = types.join(", ");
  const url = `/clans/${clanIds[0]}`;
  await Promise.all(
    [...recipientIds].map((userId) =>
      notifyUser(userId, {
        type: "check_in",
        title: `${actorName} checked in`,
        body: `Logged: ${label}`,
        url,
        checkInId: anchorCheckInId,
      }),
    ),
  );
}

export type CheckInActionState = { error?: string } | undefined;

// Photos are uploaded client-direct to Vercel Blob (see src/app/api/check-ins/upload/route.ts) —
// this Server Action only ever receives the resulting URLs, never raw file bytes. This check
// isn't a security boundary (next/image's own remotePatterns allowlist already refuses to render
// an unlisted host, so a forged value would at worst show a broken image), just a cheap sanity
// filter against a hand-crafted form submission.
const BLOB_URL_PATTERN = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

export async function logDailyCheckIn(
  _prevState: CheckInActionState,
  formData: FormData,
): Promise<CheckInActionState> {
  const user = await getOrSyncCurrentUser();
  if (!user) return { error: "Not signed in." };

  const stepsRaw = String(formData.get("count") ?? "").trim();
  const count = stepsRaw ? Number(stepsRaw) : undefined;
  if (count !== undefined && (!Number.isFinite(count) || count < 0)) {
    return { error: "Enter a valid step count." };
  }

  const status = String(formData.get("status") ?? "") as FoodStatus;
  const hasFoodStatus = ["yes", "no", "partial"].includes(status);
  const photoUrls = formData
    .getAll("photoUrls")
    .filter((v): v is string => typeof v === "string" && BLOB_URL_PATTERN.test(v))
    .slice(0, 3);
  const hasPhoto = photoUrls.length > 0;

  const workedOut = formData.get("workedOut") === "on";
  const newlyLoggedTypes: CheckInType[] = [];
  let anchorCheckInId: string | undefined;

  const existingGym = await getTodaysCheckIn(user.id, "gym");
  if (workedOut || existingGym) {
    const gymNote = String(formData.get("gymNote") ?? "").trim() || undefined;
    if (existingGym) {
      await db.update(checkIns).set({ value: { note: gymNote } }).where(eq(checkIns.id, existingGym.id));
    } else {
      const [row] = await db
        .insert(checkIns)
        .values({
          userId: user.id,
          type: "gym",
          value: { note: gymNote },
          visibility: "public_to_clan",
        })
        .returning({ id: checkIns.id });
      newlyLoggedTypes.push("gym");
      anchorCheckInId = row.id;
    }
  }

  if (count !== undefined) {
    const existingSteps = await getTodaysCheckIn(user.id, "steps");
    if (existingSteps) {
      await db.update(checkIns).set({ value: { count } }).where(eq(checkIns.id, existingSteps.id));
    } else {
      const [row] = await db
        .insert(checkIns)
        .values({
          userId: user.id,
          type: "steps",
          value: { count },
          visibility: "public_to_clan",
        })
        .returning({ id: checkIns.id });
      newlyLoggedTypes.push("steps");
      anchorCheckInId = row.id;
    }
  }

  // A photo can be logged on its own — it no longer requires also answering the nutrition
  // question, so this block runs whenever either is present, not just on hasFoodStatus.
  if (hasFoodStatus || hasPhoto) {
    const foodNote = String(formData.get("foodNote") ?? "").trim() || undefined;

    const existingFood = await getTodaysCheckIn(user.id, "food");
    if (existingFood) {
      const existingValue = existingFood.value as FoodCheckInValue;
      // No merge with the previous value's photos needed: the client always sends the complete
      // desired set (existing photos it kept, minus any it removed, plus any newly uploaded), so
      // this can just overwrite — which also means removing every photo now genuinely works.
      await db
        .update(checkIns)
        .set({ value: { status: hasFoodStatus ? status : existingValue.status, note: foodNote, photoUrls } })
        .where(eq(checkIns.id, existingFood.id));
    } else {
      const [row] = await db
        .insert(checkIns)
        .values({
          userId: user.id,
          type: "food",
          value: { status: hasFoodStatus ? status : undefined, note: foodNote, photoUrls },
          visibility: "public_to_clan",
        })
        .returning({ id: checkIns.id });
      newlyLoggedTypes.push("food");
      anchorCheckInId = row.id;
    }
  }

  after(() => notifyClansOfCheckIn(user.id, user.name, newlyLoggedTypes, anchorCheckInId));

  revalidatePath("/logs");
}
