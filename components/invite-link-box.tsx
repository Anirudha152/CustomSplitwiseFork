"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { regenerateInviteToken } from "@/app/actions/groups";

export function InviteLinkBox({ groupId, inviteUrl }: { groupId: string; inviteUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-4">
      <div>
        <h3 className="font-medium text-zinc-900">Invite members</h3>
        <p className="text-xs text-zinc-500 mt-0.5">
          Share this link with friends. Anyone with the link can join.
        </p>
      </div>
      <div className="flex gap-2">
        <Input value={inviteUrl} readOnly className="text-xs" />
        <Button variant="outline" size="sm" onClick={copy} className="shrink-0 gap-1.5">
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <form action={regenerateInviteToken.bind(null, groupId)}>
        <button type="submit" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors underline underline-offset-2">
          Generate new link (revokes old one)
        </button>
      </form>
    </div>
  );
}
