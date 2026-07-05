"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compressImage } from "@/lib/compress-image";
import { logDailyCheckIn } from "../actions";
import type { FoodStatus } from "../types";

const STATUS_OPTIONS: { value: FoodStatus; label: string }[] = [
  { value: "yes", label: "Hit it" },
  { value: "no", label: "Missed it" },
  { value: "partial", label: "Partial" },
];

export function DailyLogForm({
  alreadyWorkedOut,
  existingGymNote,
  todaysSteps,
  dailyStepsTarget,
  currentFoodStatus,
}: {
  alreadyWorkedOut: boolean;
  existingGymNote?: string;
  todaysSteps?: number;
  dailyStepsTarget?: number;
  currentFoodStatus?: FoodStatus;
}) {
  const [state, action, pending] = useActionState(logDailyCheckIn, undefined);
  const [compressing, setCompressing] = useState(false);

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressed);
      input.files = dataTransfer.files;
    } finally {
      setCompressing(false);
    }
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-foreground">Gym</h2>
        {alreadyWorkedOut ? (
          <>
            <p className="text-sm text-foreground-secondary">You already logged a workout today. 🔥</p>
            <Input
              name="gymNote"
              placeholder="Update note (e.g. leg day)"
              maxLength={200}
              defaultValue={existingGymNote}
            />
          </>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm text-foreground-secondary">
              <input type="checkbox" name="workedOut" className="accent-accent" />
              I worked out today 💪
            </label>
            <Input name="gymNote" placeholder="Optional note (e.g. leg day)" maxLength={200} />
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-foreground">Steps</h2>
        {dailyStepsTarget !== undefined && (
          <p className="text-xs text-foreground-tertiary">
            Goal: {dailyStepsTarget.toLocaleString()} steps/day
          </p>
        )}
        <Input name="count" type="number" min={0} defaultValue={todaysSteps} placeholder="Steps today" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-foreground">Nutrition</h2>
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-1 text-sm text-foreground-secondary"
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                defaultChecked={currentFoodStatus === option.value}
                className="accent-accent"
              />
              {option.label}
            </label>
          ))}
        </div>
        <Input name="foodNote" placeholder="Optional note (e.g. meal prepped)" maxLength={200} />
        <div className="flex flex-col gap-1">
          <label htmlFor="foodPhoto" className="text-xs text-foreground-tertiary">
            Optional photo
          </label>
          <input
            id="foodPhoto"
            type="file"
            name="foodPhoto"
            accept="image/*"
            onChange={handlePhotoChange}
            className="text-sm text-foreground-secondary file:mr-3 file:rounded-none file:border file:border-surface-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground"
          />
          {compressing && <p className="text-xs text-foreground-muted">Compressing photo...</p>}
        </div>
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending || compressing}>
        {pending ? "Saving..." : "Save today's log"}
      </Button>
    </form>
  );
}
