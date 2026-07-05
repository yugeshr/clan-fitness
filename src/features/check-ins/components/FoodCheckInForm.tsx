"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logFoodCheckIn } from "../actions";
import type { FoodStatus } from "../types";

const STATUS_OPTIONS: { value: FoodStatus; label: string }[] = [
  { value: "yes", label: "Hit it" },
  { value: "no", label: "Missed it" },
  { value: "partial", label: "Partial" },
];

export function FoodCheckInForm({ currentStatus }: { currentStatus?: FoodStatus }) {
  const [state, action, pending] = useActionState(logFoodCheckIn, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <p className="text-sm font-medium">Did you hit your nutrition goal today?</p>
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="status"
              value={option.value}
              defaultChecked={currentStatus === option.value}
              required
            />
            {option.label}
          </label>
        ))}
      </div>
      <Input name="note" placeholder="Optional note (e.g. meal prepped)" maxLength={200} />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} variant="secondary">
        {pending ? "Saving..." : "Save"}
      </Button>
      <p className="text-xs text-neutral-500">Private by default — only visible to you.</p>
    </form>
  );
}
