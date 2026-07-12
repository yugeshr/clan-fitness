"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionToast } from "@/lib/use-action-toast";
import { renameClan } from "../actions";

export function RenameClanForm({ clanId, currentName }: { clanId: string; currentName: string }) {
  const action = renameClan.bind(null, clanId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const markSubmitted = useActionToast(state, pending, "Clan renamed");

  return (
    <form
      action={(formData) => {
        markSubmitted();
        formAction(formData);
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor="name" className="text-sm font-medium text-foreground">
        Clan name
      </label>
      <Input id="name" name="name" required maxLength={60} defaultValue={currentName} />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Saving..." : "Rename clan"}
      </Button>
    </form>
  );
}
