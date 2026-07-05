"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logGymCheckIn } from "../actions";

export function GymCheckInForm({ alreadyLoggedToday }: { alreadyLoggedToday: boolean }) {
  const [state, action, pending] = useActionState(logGymCheckIn, undefined);

  if (alreadyLoggedToday) {
    return <p className="text-sm text-neutral-600">You already logged a workout today. 🔥</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <Input name="note" placeholder="Optional note (e.g. leg day)" maxLength={200} />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Logging..." : "I worked out today 💪"}
      </Button>
    </form>
  );
}
