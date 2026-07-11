"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendBroadcast } from "../actions";
import type { getAllClansForAdmin } from "../queries";

type ClanOption = Awaited<ReturnType<typeof getAllClansForAdmin>>[number];

export function BroadcastComposer({ clans }: { clans: ClanOption[] }) {
  const [state, formAction, pending] = useActionState(sendBroadcast, undefined);
  const submittedRef = useRef(false);
  const [step, setStep] = useState<"compose" | "confirm">("compose");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [justSentCount, setJustSentCount] = useState<number | null>(null);

  // Reconciles useActionState's external result into local state (reset the form, show a success
  // line) once a send actually completes — distinguishes "just sent successfully" from the
  // initial (also error-free, also sentCount-less) state via submittedRef, same reasoning as
  // GoalsForm's ref. Can't be derived during render since it depends on a prior submission.
  useEffect(() => {
    if (!submittedRef.current || pending) return;
    submittedRef.current = false;
    if (state?.sentCount !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJustSentCount(state.sentCount);
      setTitle("");
      setBody("");
      setSelected(new Set());
      setStep("compose");
    }
  }, [pending, state]);

  const reachEstimate = useMemo(
    () => clans.filter((clan) => selected.has(clan.id)).reduce((sum, clan) => sum + clan.memberCount, 0),
    [clans, selected],
  );
  const selectedClans = clans.filter((clan) => selected.has(clan.id));

  function toggleClan(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleReview(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim() || selected.size === 0) return;
    setJustSentCount(null);
    setStep("confirm");
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-surface-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">Broadcast a message</h2>

      {justSentCount !== null && (
        <p className="text-sm text-success">
          Sent to {justSentCount} {justSentCount === 1 ? "person" : "people"}.
        </p>
      )}

      {step === "compose" ? (
        <form onSubmit={handleReview} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="broadcast-title" className="text-sm font-medium text-foreground">
              Title
            </label>
            <Input
              id="broadcast-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              placeholder="Heads up!"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="broadcast-body" className="text-sm font-medium text-foreground">
              Message
            </label>
            <textarea
              id="broadcast-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What's new..."
              className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-base text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Send to</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(new Set(clans.map((clan) => clan.id)))}
                  className="text-xs font-semibold text-accent"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-foreground-tertiary"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-surface-border p-2">
              {clans.length === 0 && <p className="text-sm text-foreground-tertiary">No clans yet.</p>}
              {clans.map((clan) => (
                <label
                  key={clan.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-background"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(clan.id)}
                    onChange={() => toggleClan(clan.id)}
                    className="h-4 w-4 accent-accent"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground-secondary">{clan.name}</span>
                  <span className="shrink-0 text-xs text-foreground-muted">{clan.memberCount}</span>
                </label>
              ))}
            </div>
            {selected.size > 0 && (
              <p className="text-xs text-foreground-tertiary">
                Up to ~{reachEstimate} {reachEstimate === 1 ? "person" : "people"} across {selected.size}{" "}
                {selected.size === 1 ? "clan" : "clans"} (fewer if some are in more than one selected clan).
              </p>
            )}
          </div>

          <Button type="submit" disabled={!title.trim() || !body.trim() || selected.size === 0}>
            Review
          </Button>
        </form>
      ) : (
        <form
          action={(formData) => {
            submittedRef.current = true;
            formAction(formData);
          }}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="title" value={title} />
          <input type="hidden" name="body" value={body} />
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="clanIds" value={id} />
          ))}

          <div className="flex flex-col gap-2 rounded-lg border border-surface-border p-3">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="whitespace-pre-wrap text-sm text-foreground-secondary">{body}</p>
            <p className="text-xs text-foreground-tertiary">
              To {selectedClans.map((clan) => clan.name).join(", ")} — up to ~{reachEstimate}{" "}
              {reachEstimate === 1 ? "person" : "people"}.
            </p>
          </div>

          {state?.error && <p className="text-sm text-danger">{state.error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Sending..." : "Send"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep("compose")}
              disabled={pending}
            >
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
