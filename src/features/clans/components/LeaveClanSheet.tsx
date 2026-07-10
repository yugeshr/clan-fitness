"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { leaveClan } from "../actions";

// Shown only for the signed-in member's own row, and only when they aren't the clan's admin —
// admins can't leave (see leaveClan's guard), so their own row never renders this.
export function LeaveClanSheet({
  clanId,
  memberName,
  memberAvatarUrl,
  loggedToday,
}: {
  clanId: string;
  memberName: string;
  memberAvatarUrl?: string | null;
  loggedToday: boolean;
}) {
  const [open, setOpen] = useState(false);

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
          <p className={`text-xs ${loggedToday ? "text-foreground-tertiary" : "text-danger"}`}>
            {loggedToday ? "Logged today" : "Not logged yet"}
          </p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-foreground-muted" />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="You">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Avatar src={memberAvatarUrl} name={memberName} size={48} />
            <span className="text-lg font-semibold text-foreground">{memberName}</span>
          </div>

          <form
            action={leaveClan.bind(null, clanId)}
            onSubmit={(event) => {
              if (!confirm("Leave this clan? You'll need an invite to rejoin.")) {
                event.preventDefault();
              }
            }}
          >
            <Button type="submit" variant="danger" className="w-full">
              Leave clan
            </Button>
          </form>
        </div>
      </BottomSheet>
    </>
  );
}
