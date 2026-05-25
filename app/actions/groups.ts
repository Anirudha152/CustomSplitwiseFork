"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function createGroup(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const parsed = createGroupSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) throw new Error("Invalid group name");

  const group = await db.group.create({
    data: {
      name: parsed.data.name,
      createdById: session.user.id,
      members: { create: { userId: session.user.id } },
    },
  });

  revalidatePath("/app");
  redirect(`/app/groups/${group.id}`);
}

export async function joinGroupByToken(token: string) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=/join/${token}`);

  const group = await db.group.findUnique({ where: { inviteToken: token } });
  if (!group) return { error: "Invalid invite link" };

  await db.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
    create: { groupId: group.id, userId: session.user.id },
    update: {},
  });

  revalidatePath("/app");
  redirect(`/app/groups/${group.id}`);
}

export async function regenerateInviteToken(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  await db.group.update({
    where: { id: groupId },
    data: { inviteToken: crypto.randomUUID() },
  });

  revalidatePath(`/app/groups/${groupId}`);
}
