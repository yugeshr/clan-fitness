"use client";

import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/toast";

/**
 * Fires a toast the moment a useActionState-backed submission completes: an error toast if the
 * action returned one, else a success toast (then onSuccess()). These actions return undefined on
 * both the initial and success paths, so a ref — not state itself — is what marks "a submission
 * just completed" (same reasoning GoalsForm/BroadcastComposer each already used their own copy of).
 *
 * Returns markSubmitted(), to call from the form's action wrapper right before invoking the real
 * action:
 *
 *   const [state, action, pending] = useActionState(setGoals, undefined);
 *   const markSubmitted = useActionToast(state, pending, "Goals saved");
 *   <form action={(formData) => { markSubmitted(); action(formData); }}>
 *
 * Pass no successMessage for actions that redirect() on success (the client never observes a
 * resolved non-error state in that case, so the success branch never fires — only errors do).
 */
export function useActionToast(
  state: { error?: string } | undefined,
  pending: boolean,
  successMessage?: string,
  onSuccess?: () => void,
) {
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!submittedRef.current || pending) return;
    submittedRef.current = false;
    if (state?.error) {
      toast.error(state.error);
    } else if (successMessage) {
      toast.success(successMessage);
      onSuccess?.();
    }
  }, [pending, state, successMessage, onSuccess]);

  return () => {
    submittedRef.current = true;
  };
}
