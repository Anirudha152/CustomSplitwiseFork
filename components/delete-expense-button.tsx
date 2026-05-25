"use client";

import { useTransition } from "react";
import { deleteExpense } from "@/app/actions/expenses";
import { Trash2 } from "lucide-react";

export function DeleteExpenseButton({ expenseId, returnPath }: { expenseId: string; returnPath: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(() => deleteExpense(expenseId, returnPath))
      }
      disabled={isPending}
      className="text-zinc-300 hover:text-rose-500 transition-colors"
      title="Delete expense"
    >
      <Trash2 size={14} />
    </button>
  );
}
