"use client";

import { ChevronRight } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { nudgeMember } from "../actions";

// Only ever rendered when the target hasn't logged today (see ClanMembersSection's canNudge
// gate), so "Not logged yet" is always accurate here without needing a loggedToday prop.
export function NudgeSheet({
  clanId,
  memberUserId,
  memberName,
  memberAvatarUrl,
}: {
  clanId: string;
  memberUserId: string;
  memberName: string;
  memberAvatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(nudgeMember.bind(null, clanId, memberUserId), undefined);

  useEffect(() => {
    if (!state?.sent) return;
    const timeout = setTimeout(() => setOpen(false), 1200);
    return () => clearTimeout(timeout);
  }, [state?.sent]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full min-w-0 items-center gap-3 text-left"
      >
        <Avatar src={memberAvatarUrl} name={memberName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-foreground">{memberName}</p>
          <p className="text-xs text-danger">Not logged yet</p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-foreground-muted" />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Nudge">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Avatar src={memberAvatarUrl} name={memberName} size={48} />
            <span className="text-lg font-semibold text-foreground">{memberName}</span>
          </div>

          <form action={formAction}>
            <Button type="submit" variant="secondary" className="w-full" disabled={pending || state?.sent}>
              {state?.sent ? "Nudged! 👋" : pending ? "Sending..." : "Send nudge"}
            </Button>
          </form>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
        </div>
      </BottomSheet>
    </>
  );
}
