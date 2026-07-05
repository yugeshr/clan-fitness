"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClan } from "../actions";

export function CreateClanForm() {
  const [state, action, pending] = useActionState(createClan, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Clan name
        </label>
        <Input id="name" name="name" required maxLength={60} placeholder="Gym Rats" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description (optional)
        </label>
        <Input id="description" name="description" placeholder="Accountability crew" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create clan"}
      </Button>
    </form>
  );
}
