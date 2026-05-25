import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { computeBalances } from "@/lib/balances";
import { formatMoney } from "@/lib/money";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const memberships = await db.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          expenses: { where: { deletedAt: null }, include: { shares: true } },
          settlements: { where: { deletedAt: null } },
        },
      },
    },
  });

  let totalOwed = 0;
  let totalOwe = 0;

  const groupSummaries = memberships.map((m) => {
    const balances = computeBalances(m.group.expenses, m.group.settlements);
    const net = balances[userId] ?? 0;
    if (net > 0) totalOwed += net;
    if (net < 0) totalOwe += -net;
    return { id: m.group.id, name: m.group.name, net };
  });

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Your overall balance across all groups</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">You are owed</p>
          <p className="text-2xl font-semibold text-emerald-600">{formatMoney(totalOwed)}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-5 space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">You owe</p>
          <p className="text-2xl font-semibold text-rose-600">{formatMoney(totalOwe)}</p>
        </div>
      </div>

      {/* Group list */}
      {groupSummaries.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🧾</p>
          <p className="text-zinc-600 font-medium">No groups yet</p>
          <p className="text-zinc-400 text-sm">Create a group and invite your friends to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Groups</h2>
          {groupSummaries.map((g) => (
            <Link
              key={g.id}
              href={`/app/groups/${g.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-zinc-100 px-5 py-4 hover:border-zinc-200 transition-colors"
            >
              <span className="font-medium text-zinc-900">{g.name}</span>
              <span
                className={
                  g.net === 0
                    ? "text-sm text-zinc-400"
                    : g.net > 0
                    ? "text-sm font-semibold text-emerald-600"
                    : "text-sm font-semibold text-rose-600"
                }
              >
                {g.net === 0
                  ? "settled up"
                  : g.net > 0
                  ? `you are owed ${formatMoney(g.net)}`
                  : `you owe ${formatMoney(-g.net)}`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
