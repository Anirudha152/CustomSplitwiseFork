"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const settleSchema = z.object({
  fromUserId: z.string().cuid(),
  toUserId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  groupId: z.string().cuid().nullable(),
  note: z.string().max(200).optional(),
});

export async function addSettlement(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const parsed = settleSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid settlement data");

  const { fromUserId, toUserId, amount, groupId, note } = parsed.data;

  await db.settlement.create({
    data: {
      fromUserId,
      toUserId,
      amount: toMinorUnits(amount),
      groupId: groupId ?? null,
      note: note ?? null,
      createdById: session.user.id,
    },
  });

  if (groupId) revalidatePath(`/app/groups/${groupId}`);
  revalidatePath("/app/activity");
  revalidatePath("/app");
}
