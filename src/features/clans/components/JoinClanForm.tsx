"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionToast } from "@/lib/use-action-toast";
import { joinClanByInviteCode } from "../actions";

export function JoinClanForm({ defaultInviteCode }: { defaultInviteCode?: string }) {
  const [state, action, pending] = useActionState(joinClanByInviteCode, undefined);
  // No successMessage — joinClanByInviteCode redirect()s on success, so only errors ever toast.
  const markSubmitted = useActionToast(state, pending);

  return (
    <form
      action={(formData) => {
        markSubmitted();
        action(formData);
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="inviteCode" className="text-sm font-medium text-foreground">
          Invite code
        </label>
        <Input
          id="inviteCode"
          name="inviteCode"
          required
          placeholder="e.g. Xk9mQ2pR7T"
          defaultValue={defaultInviteCode}
        />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Joining..." : "Join clan"}
      </Button>
    </form>
  );
}
