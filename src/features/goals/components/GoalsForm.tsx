"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setGoals } from "../actions";

export function GoalsForm({
  gymTarget,
  stepsTarget,
  redirectOnSuccessTo,
}: {
  gymTarget?: number;
  stepsTarget?: number;
  redirectOnSuccessTo?: string;
}) {
  const [state, action, pending] = useActionState(setGoals, undefined);
  const router = useRouter();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error && redirectOnSuccessTo) {
      router.push(redirectOnSuccessTo);
    }
    wasPending.current = pending;
  }, [pending, state, redirectOnSuccessTo, router]);

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="daysPerWeek" className="text-sm font-medium text-foreground">
          Gym days per week
        </label>
        <Input
          id="daysPerWeek"
          name="daysPerWeek"
          type="number"
          min={1}
          max={7}
          required
          defaultValue={gymTarget ?? 4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="stepsPerDay" className="text-sm font-medium text-foreground">
          Steps per day
        </label>
        <Input
          id="stepsPerDay"
          name="stepsPerDay"
          type="number"
          min={1}
          required
          defaultValue={stepsTarget ?? 8000}
        />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save goals"}
      </Button>
    </form>
  );
}
