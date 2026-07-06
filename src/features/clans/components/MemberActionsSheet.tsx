"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/shared/Avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { makeAdmin, removeMember } from "../actions";

export function MemberActionsSheet({
  clanId,
  memberUserId,
  memberName,
  memberAvatarUrl,
  loggedToday,
}: {
  clanId: string;
  memberUserId: string;
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

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Member">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Avatar src={memberAvatarUrl} name={memberName} size={48} />
            <span className="text-lg font-semibold text-foreground">{memberName}</span>
          </div>

          <div className="flex flex-col gap-2">
            <form action={makeAdmin.bind(null, clanId, memberUserId)} onSubmit={() => setOpen(false)}>
              <Button type="submit" variant="secondary" className="w-full">
                Make admin
              </Button>
            </form>
            <form
              action={removeMember.bind(null, clanId, memberUserId)}
              onSubmit={(event) => {
                if (!confirm(`Remove ${memberName} from the clan?`)) {
                  event.preventDefault();
                  return;
                }
                setOpen(false);
              }}
            >
              <Button type="submit" variant="danger" className="w-full">
                Remove from clan
              </Button>
            </form>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
