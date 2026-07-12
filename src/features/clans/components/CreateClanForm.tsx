"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionToast } from "@/lib/use-action-toast";
import { createClan } from "../actions";

export function CreateClanForm() {
  const [state, action, pending] = useActionState(createClan, undefined);
  // No successMessage — createClan redirect()s on success, so the client never observes a
  // resolved non-error state; landing on the welcome page is the confirmation. Errors still toast.
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
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Clan name
        </label>
        <Input id="name" name="name" required maxLength={60} placeholder="Gym Rats" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Description (optional)
        </label>
        <Input id="description" name="description" placeholder="Accountability crew" />
      </div>
      <p className="text-xs text-foreground-tertiary">
        You&apos;ll get an invite link to share with your group right after this.
      </p>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create clan"}
      </Button>
    </form>
  );
}
