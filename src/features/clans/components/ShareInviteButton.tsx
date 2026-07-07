"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    };
  }, []);

  function buildInvite() {
    const url = `${window.location.origin}/join?code=${inviteCode}`;
    const text = `Join my clan "${clanName}" on Clan Fitness!`;
    return { url, text };
  }

  function fallbackCopy(text: string) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
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
    let succeeded = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        succeeded = true;
      } else {
        succeeded = fallbackCopy(url);
      }
    } catch (err) {
      console.error(err);
      succeeded = fallbackCopy(url);
    }

    if (!succeeded) return;

    if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    setCopied(true);
    copiedTimeout.current = setTimeout(() => setCopied(false), 2000);
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
