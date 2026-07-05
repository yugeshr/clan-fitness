"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinClanByInviteCode } from "../actions";

export function JoinClanForm() {
  const [state, action, pending] = useActionState(joinClanByInviteCode, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="inviteCode" className="text-sm font-medium">
          Invite code
        </label>
        <Input id="inviteCode" name="inviteCode" required placeholder="e.g. Xk9mQ2pR7T" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Joining..." : "Join clan"}
      </Button>
    </form>
  );
}
