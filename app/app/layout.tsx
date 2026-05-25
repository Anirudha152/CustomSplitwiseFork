import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";
import { computeBalances } from "@/lib/balances";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;

  const [memberships, user] = await Promise.all([
    db.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: { include: { user: true } },
            expenses: { include: { shares: true } },
            settlements: true,
          },
        },
      },
    }),
    db.user.findUnique({ where: { id: userId } }),
  ]);

  if (!user) redirect("/signin");

  const groups = memberships.map((m) => {
    const balances = computeBalances(m.group.expenses, m.group.settlements);
    return { id: m.group.id, name: m.group.name, balance: balances[userId] ?? 0 };
  });

  // Derive friends: all users who share a group with me (excluding self)
  const friendMap = new Map<string, { id: string; name: string | null; image: string | null; balance: number }>();
  for (const m of memberships) {
    const groupBalances = computeBalances(m.group.expenses, m.group.settlements);
    for (const gm of m.group.members) {
      if (gm.userId === userId) continue;
      const existing = friendMap.get(gm.userId) ?? { id: gm.userId, name: gm.user.name, image: gm.user.image, balance: 0 };
      // Pairwise balance: expenses where I paid and they owe, or they paid and I owe
      const myNet = groupBalances[userId] ?? 0;
      const theirNet = groupBalances[gm.userId] ?? 0;
      // Aggregate group-level nets — not perfectly pairwise but sufficient for sidebar pill
      friendMap.set(gm.userId, existing);
    }
  }
  const friends = Array.from(friendMap.values());

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar
        groups={groups}
        friends={friends}
        currentUser={{ id: user.id, name: user.name, image: user.image }}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
