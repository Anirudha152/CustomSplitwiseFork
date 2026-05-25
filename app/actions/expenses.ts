"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { splitEqual, splitExact } from "@/lib/splits";
import { toMinorUnits } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const addExpenseSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.coerce.number().positive(),
  paidById: z.string().cuid(),
  splitMode: z.enum(["equal", "exact"]),
  groupId: z.string().cuid().nullable(),
  friendId: z.string().cuid().nullable(),
  category: z.string().optional(),
  notes: z.string().max(500).optional(),
  memberIds: z.array(z.string().cuid()),
  exactAmounts: z.record(z.string(), z.coerce.number()).optional(),
});

export async function addExpense(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const parsed = addExpenseSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid expense data");

  const {
    description,
    amount,
    paidById,
    splitMode,
    groupId,
    friendId,
    category,
    notes,
    memberIds,
    exactAmounts,
  } = parsed.data;

  const totalMinor = toMinorUnits(amount);
  let shares;

  if (splitMode === "equal") {
    shares = splitEqual(totalMinor, memberIds);
  } else {
    const entries = memberIds.map((uid) => ({
      userId: uid,
      amount: toMinorUnits(exactAmounts?.[uid] ?? 0),
    }));
    shares = splitExact(totalMinor, entries);
  }

  await db.expense.create({
    data: {
      description,
      amount: totalMinor,
      paidById,
      createdById: session.user.id,
      groupId: groupId ?? null,
      category: category ?? null,
      notes: notes ?? null,
      shares: { create: shares },
    },
  });

  if (groupId) {
    revalidatePath(`/app/groups/${groupId}`);
    revalidatePath("/app/activity");
  } else if (friendId) {
    revalidatePath(`/app/friends/${friendId}`);
    revalidatePath("/app/activity");
  }
}

export async function deleteExpense(expenseId: string, returnPath: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  await db.expense.update({
    where: { id: expenseId },
    data: { deletedAt: new Date() },
  });

  revalidatePath(returnPath);
  revalidatePath("/app/activity");
}
