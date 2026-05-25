"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addExpense } from "@/app/actions/expenses";
import { toMinorUnits } from "@/lib/money";

const CATEGORIES = ["Food", "Transport", "Accommodation", "Entertainment", "Shopping", "Utilities", "Other"];

interface Member {
  id: string;
  name: string | null;
  image: string | null;
}

interface ExpenseFormProps {
  members: Member[];
  currentUserId: string;
  groupId: string | null;
  friendId: string | null;
  onSuccess: () => void;
}

export function ExpenseForm({ members, currentUserId, groupId, friendId, onSuccess }: ExpenseFormProps) {
  const [splitMode, setSplitMode] = useState<"equal" | "exact">("equal");
  const [amount, setAmount] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map((m) => m.id));
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [paidById, setPaidById] = useState(currentUserId);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const totalMinor = toMinorUnits(parseFloat(amount) || 0);
  const exactSum = Object.values(exactAmounts).reduce((acc, v) => acc + toMinorUnits(parseFloat(v) || 0), 0);
  const exactDiff = totalMinor - exactSum;

  function toggleMember(id: string) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    if (splitMode === "exact" && exactDiff !== 0) {
      setError(`Amounts don't add up. Difference: ₹${(exactDiff / 100).toFixed(2)}`);
      return;
    }

    if (selectedMembers.length === 0) {
      setError("Select at least one member to split with.");
      return;
    }

    startTransition(async () => {
      try {
        await addExpense({
          description: fd.get("description") as string,
          amount: parseFloat(amount),
          paidById,
          splitMode,
          groupId,
          friendId,
          category: fd.get("category") as string || undefined,
          notes: fd.get("notes") as string || undefined,
          memberIds: selectedMembers,
          exactAmounts:
            splitMode === "exact"
              ? Object.fromEntries(
                  Object.entries(exactAmounts).map(([k, v]) => [k, parseFloat(v) || 0])
                )
              : undefined,
        });
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Description + Amount */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" placeholder="Dinner, Uber…" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Paid by */}
      <div className="space-y-1.5">
        <Label>Paid by</Label>
        <Select value={paidById} onValueChange={(v) => { if (v != null) setPaidById(v); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id === currentUserId ? "You" : (m.name ?? m.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Split mode */}
      <div className="space-y-3">
        <Label>Split</Label>
        <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as "equal" | "exact")}>
          <TabsList className="w-full">
            <TabsTrigger value="equal" className="flex-1">Equally</TabsTrigger>
            <TabsTrigger value="exact" className="flex-1">Exact amounts</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Member checkboxes */}
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={selectedMembers.includes(m.id)}
                  onChange={() => toggleMember(m.id)}
                />
                <span>{m.id === currentUserId ? "You" : (m.name ?? m.id)}</span>
              </label>
              {splitMode === "exact" && selectedMembers.includes(m.id) && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-24 h-7 text-sm"
                  value={exactAmounts[m.id] ?? ""}
                  onChange={(e) =>
                    setExactAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}
        </div>

        {splitMode === "exact" && totalMinor > 0 && (
          <p className={exactDiff === 0 ? "text-xs text-emerald-600" : "text-xs text-rose-600"}>
            {exactDiff === 0
              ? "✓ Amounts match"
              : `Remaining: ₹${(exactDiff / 100).toFixed(2)}`}
          </p>
        )}
      </div>

      {/* Category + Notes */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select name="category">
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Note (optional)</Label>
          <Input id="notes" name="notes" placeholder="Any details…" />
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Add expense"}
      </Button>
    </form>
  );
}
