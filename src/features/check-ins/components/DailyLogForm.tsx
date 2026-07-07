"use client";

import Image from "next/image";
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

// Full-height pill wrapping the native input, not just the text, so the tappable area meets the
// ~44px touch-target minimum on mobile — a bare `<input>` + label text was too small to hit reliably.
const TOGGLE_LABEL_CLASS =
  "flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-surface-border px-4 text-sm font-medium text-foreground-secondary transition-colors has-[:checked]:border-accent has-[:checked]:text-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent";

export function DailyLogForm({
  alreadyWorkedOut,
  existingGymNote,
  todaysSteps,
  dailyStepsTarget,
  currentFoodStatus,
  existingFoodNote,
  existingFoodPhotoUrl,
  hasLoggedToday,
}: {
  alreadyWorkedOut: boolean;
  existingGymNote?: string;
  todaysSteps?: number;
  dailyStepsTarget?: number;
  currentFoodStatus?: FoodStatus;
  existingFoodNote?: string;
  existingFoodPhotoUrl?: string;
  hasLoggedToday: boolean;
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
            <label className={TOGGLE_LABEL_CLASS}>
              <input type="checkbox" name="workedOut" className="h-5 w-5 accent-accent" />
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
            Goal: {dailyStepsTarget.toLocaleString("en-US")} steps/day
          </p>
        )}
        <Input name="count" type="number" min={0} defaultValue={todaysSteps} placeholder="Steps today" />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-foreground">Nutrition</h2>
        {currentFoodStatus && (
          <p className="text-sm text-foreground-secondary">You already logged nutrition today.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((option) => (
            <label key={option.value} className={TOGGLE_LABEL_CLASS}>
              <input
                type="radio"
                name="status"
                value={option.value}
                defaultChecked={currentFoodStatus === option.value}
                className="h-5 w-5 accent-accent"
              />
              {option.label}
            </label>
          ))}
        </div>
        <Input
          name="foodNote"
          placeholder="Optional note (e.g. meal prepped)"
          maxLength={200}
          defaultValue={existingFoodNote}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-foreground">Photo</h2>
        <label htmlFor="photo" className="text-xs text-foreground-tertiary">
          {existingFoodPhotoUrl ? "Replace photo" : "Optional photo — saves on its own, no other answer needed"}
        </label>
        {existingFoodPhotoUrl && (
          <div className="flex items-center gap-2">
            <Image
              src={existingFoodPhotoUrl}
              alt="Current photo"
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg object-cover"
            />
            <p className="text-xs text-foreground-tertiary">
              Current photo — pick a new file below to replace it.
            </p>
          </div>
        )}
        <input
          id="photo"
          type="file"
          name="photo"
          accept="image/*"
          onChange={handlePhotoChange}
          className="text-sm text-foreground-secondary file:mr-3 file:rounded-none file:border file:border-surface-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground"
        />
        {compressing && <p className="text-xs text-foreground-muted">Compressing photo...</p>}
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending || compressing}>
        {pending ? "Saving..." : hasLoggedToday ? "Update today's log" : "Save today's log"}
      </Button>
    </form>
  );
}
