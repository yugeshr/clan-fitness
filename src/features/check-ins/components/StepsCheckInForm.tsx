"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logStepsCheckIn } from "../actions";

export function StepsCheckInForm({ todaysCount }: { todaysCount?: number }) {
  const [state, action, pending] = useActionState(logStepsCheckIn, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <Input
        name="count"
        type="number"
        min={0}
        required
        defaultValue={todaysCount}
        placeholder="Steps today"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Saving..." : todaysCount !== undefined ? "Update steps" : "Log steps"}
      </Button>
    </form>
  );
}
