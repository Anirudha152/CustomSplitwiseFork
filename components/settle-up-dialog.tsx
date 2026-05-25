"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addSettlement } from "@/app/actions/settlements";
import { fromMinorUnits } from "@/lib/money";

interface Member {
  id: string;
  name: string | null;
}

interface Debt {
  from: string;
  to: string;
  amount: number;
}

interface SettleUpDialogProps {
  members: Member[];
  currentUserId: string;
  groupId: string | null;
  suggestedDebts?: Debt[];
}

export function SettleUpDialog({ members, currentUserId, groupId, suggestedDebts }: SettleUpDialogProps) {
  const [open, setOpen] = useState(false);
  const [fromUserId, setFromUserId] = useState(currentUserId);
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function getName(id: string) {
    if (id === currentUserId) return "You";
    return members.find((m) => m.id === id)?.name ?? id;
  }

  function prefill(debt: Debt) {
    setFromUserId(debt.from);
    setToUserId(debt.to);
    setAmount(fromMinorUnits(debt.amount).toFixed(2));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!toUserId) { setError("Select who received the payment"); return; }
    if (fromUserId === toUserId) { setError("From and To can't be the same person"); return; }

    startTransition(async () => {
      try {
        await addSettlement({ fromUserId, toUserId, amount: parseFloat(amount), groupId, note: note || undefined });
        setOpen(false);
        setAmount(""); setNote("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline" }))}>
        Settle up
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
        </DialogHeader>

        {suggestedDebts && suggestedDebts.length > 0 && (
          <div className="space-y-1.5 pb-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Suggested payments</p>
            {suggestedDebts.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => prefill(d)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg border border-zinc-100 hover:bg-zinc-50 transition-colors"
              >
                <span className="font-medium">{getName(d.from)}</span>
                {" → "}
                <span className="font-medium">{getName(d.to)}</span>
                {" "}
                <span className="text-emerald-600 font-semibold">₹{fromMinorUnits(d.amount).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Who paid?</Label>
            <Select value={fromUserId} onValueChange={(v) => { if (v != null) setFromUserId(v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.id === currentUserId ? "You" : (m.name ?? m.id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Who received?</Label>
            <Select value={toUserId} onValueChange={(v) => { if (v != null) setToUserId(v); }}>
              <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
              <SelectContent>
                {members.filter((m) => m.id !== fromUserId).map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.id === currentUserId ? "You" : (m.name ?? m.id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount (₹)</Label>
            <Input
              type="number" min="0.01" step="0.01" placeholder="0.00"
              value={amount} onChange={(e) => setAmount(e.target.value)} required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Input placeholder="Cash, UPI…" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Recording…" : "Record payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
