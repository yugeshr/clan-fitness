"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

function subscribe() {
  return () => {};
}

function getCanShareSnapshot() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

function getServerSnapshot() {
  return false;
}

export function ShareInviteButton({ inviteCode, clanName }: { inviteCode: string; clanName: string }) {
  const canShare = useSyncExternalStore(subscribe, getCanShareSnapshot, getServerSnapshot);
  const [copied, setCopied] = useState(false);

  function buildInvite() {
    const url = `${window.location.origin}/join?code=${inviteCode}`;
    const text = `Join my clan "${clanName}" on Clan Fitness!`;
    return { url, text };
  }

  async function handleShare() {
    const { url, text } = buildInvite();
    try {
      await navigator.share({ title: "Clan Fitness invite", text, url });
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        console.error(err);
      }
    }
  }

  async function handleCopy() {
    const { url } = buildInvite();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    const { url, text } = buildInvite();
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank");
  }

  function handleSms() {
    const { url, text } = buildInvite();
    window.location.href = `sms:?&body=${encodeURIComponent(`${text} ${url}`)}`;
  }

  if (canShare) {
    return (
      <Button type="button" variant="secondary" onClick={handleShare}>
        Share invite
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy link"}
      </Button>
      <Button type="button" variant="secondary" onClick={handleWhatsApp}>
        WhatsApp
      </Button>
      <Button type="button" variant="secondary" onClick={handleSms}>
        SMS
      </Button>
    </div>
  );
}
