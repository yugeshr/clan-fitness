"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updateNotificationPreferences } from "../actions";

export function NotificationPreferencesForm({
  notifyOnComments,
  notifyOnMentions,
  notifyOnReactions,
  notifyOnCheckIns,
}: {
  notifyOnComments: boolean;
  notifyOnMentions: boolean;
  notifyOnReactions: boolean;
  notifyOnCheckIns: boolean;
}) {
  const [state, action, pending] = useActionState(updateNotificationPreferences, undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <Switch id="notifyOnComments" name="notifyOnComments" label="Comments" defaultChecked={notifyOnComments} />
      <Switch id="notifyOnMentions" name="notifyOnMentions" label="Mentions" defaultChecked={notifyOnMentions} />
      <Switch id="notifyOnReactions" name="notifyOnReactions" label="Reactions" defaultChecked={notifyOnReactions} />
      <Switch id="notifyOnCheckIns" name="notifyOnCheckIns" label="Check-ins" defaultChecked={notifyOnCheckIns} />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}
