import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDistanceToNow } from "date-fns";

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const groupIds = (
    await db.groupMember.findMany({ where: { userId }, select: { groupId: true } })
  ).map((m) => m.groupId);

  const [expenses, settlements] = await Promise.all([
    db.expense.findMany({
      where: { groupId: { in: groupIds } },
      include: { paidBy: true, group: true, shares: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.settlement.findMany({
      where: { groupId: { in: groupIds } },
      include: { from: true, to: true, group: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  type ActivityItem =
    | { type: "expense"; data: (typeof expenses)[0]; date: Date }
    | { type: "settlement"; data: (typeof settlements)[0]; date: Date };

  const items: ActivityItem[] = [
    ...expenses.map((e) => ({ type: "expense" as const, data: e, date: e.createdAt })),
    ...settlements.map((s) => ({ type: "settlement" as const, data: s, date: s.createdAt })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 80);

  function getName(id: string, name: string | null) {
    return id === userId ? "You" : (name ?? id);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Activity</h1>
        <p className="text-zinc-500 text-sm mt-1">Recent expenses and payments across all groups</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-3xl">📋</p>
          <p className="text-zinc-500 text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            if (item.type === "expense") {
              const e = item.data;
              const myShare = e.shares.find((s) => s.userId === userId);
              const iPaid = e.paidById === userId;
              const myNet = iPaid ? e.amount - (myShare?.amount ?? 0) : -(myShare?.amount ?? 0);
              const deleted = !!e.deletedAt;
              return (
                <div
                  key={`e-${e.id}`}
                  className={`bg-white rounded-xl border border-zinc-100 px-5 py-4 ${deleted ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {deleted && <span className="text-[11px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full">deleted</span>}
                        {e.category && <span className="text-[11px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">{e.category}</span>}
                        <p className="font-medium text-zinc-900 truncate">{e.description}</p>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        {getName(e.paidById, e.paidBy.name)} paid {formatMoney(e.amount)}
                        {e.group ? ` in ${e.group.name}` : ""}
                        {" · "}{formatDistanceToNow(e.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    {!deleted && myNet !== 0 && (
                      <span className={myNet > 0 ? "text-sm font-semibold text-emerald-600 shrink-0" : "text-sm font-semibold text-rose-600 shrink-0"}>
                        {myNet > 0 ? `+${formatMoney(myNet)}` : formatMoney(myNet)}
                      </span>
                    )}
                  </div>
                </div>
              );
            } else {
              const s = item.data;
              const deleted = !!s.deletedAt;
              return (
                <div
                  key={`s-${s.id}`}
                  className={`bg-zinc-50 rounded-xl border border-zinc-100 px-5 py-3 text-sm text-zinc-600 ${deleted ? "opacity-50" : ""}`}
                >
                  {deleted && <span className="text-[11px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full mr-2">deleted</span>}
                  <span className="font-medium">{getName(s.fromUserId, s.from.name)}</span>
                  {" paid "}
                  <span className="font-medium">{getName(s.toUserId, s.to.name)}</span>
                  {" · "}
                  <span className="font-semibold text-emerald-600">{formatMoney(s.amount)}</span>
                  {s.group ? <span className="text-zinc-400"> in {s.group.name}</span> : null}
                  {" · "}
                  <span className="text-zinc-400">{formatDistanceToNow(s.createdAt, { addSuffix: true })}</span>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
