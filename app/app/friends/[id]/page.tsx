import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { computeBalances } from "@/lib/balances";
import { formatMoney } from "@/lib/money";
import { AddExpenseSheet } from "@/components/add-expense-sheet";
import { SettleUpDialog } from "@/components/settle-up-dialog";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export default async function FriendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: friendId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const [friend, nonGroupExpenses, nonGroupSettlements, sharedMemberships] = await Promise.all([
    db.user.findUnique({ where: { id: friendId } }),
    db.expense.findMany({
      where: {
        groupId: null,
        deletedAt: null,
        shares: { some: { userId: { in: [userId, friendId] } } },
        paidById: { in: [userId, friendId] },
      },
      include: { shares: true, paidBy: true },
      orderBy: { createdAt: "desc" },
    }),
    db.settlement.findMany({
      where: {
        groupId: null,
        deletedAt: null,
        fromUserId: { in: [userId, friendId] },
        toUserId: { in: [userId, friendId] },
      },
      include: { from: true, to: true },
      orderBy: { createdAt: "desc" },
    }),
    db.groupMember.findMany({
      where: { userId },
      include: { group: { include: { members: true } } },
    }),
  ]);

  if (!friend) notFound();

  const sharedGroups = sharedMemberships
    .filter((m) => m.group.members.some((gm) => gm.userId === friendId))
    .map((m) => m.group);

  const members = [
    { id: userId, name: session.user.name ?? null, image: session.user.image ?? null },
    { id: friend.id, name: friend.name, image: friend.image },
  ];

  const balances = computeBalances(
    nonGroupExpenses.map((e) => ({ ...e, deletedAt: null })),
    nonGroupSettlements.map((s) => ({ ...s, deletedAt: null }))
  );
  const myNet = balances[userId] ?? 0;

  function getName(uid: string) {
    if (uid === userId) return "You";
    return friend!.name ?? uid;
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={friend.image ?? ""} />
            <AvatarFallback>{friend.name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">{friend.name}</h1>
            <p
              className={
                myNet > 0 ? "text-sm text-emerald-600 font-medium"
                : myNet < 0 ? "text-sm text-rose-600 font-medium"
                : "text-sm text-zinc-400"
              }
            >
              {myNet === 0
                ? "All settled up"
                : myNet > 0
                ? `Owes you ${formatMoney(myNet)}`
                : `You owe ${formatMoney(-myNet)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <SettleUpDialog members={members} currentUserId={userId} groupId={null} />
          <AddExpenseSheet members={members} currentUserId={userId} groupId={null} friendId={friendId} />
        </div>
      </div>

      {/* Non-group expenses */}
      {nonGroupExpenses.length === 0 && nonGroupSettlements.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-3xl">💸</p>
          <p className="text-zinc-500 text-sm">No direct expenses yet. Add one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Direct expenses</p>
          {nonGroupExpenses.map((exp) => {
            const myShare = exp.shares.find((s) => s.userId === userId);
            const iPaid = exp.paidById === userId;
            const myNet = iPaid ? exp.amount - (myShare?.amount ?? 0) : -(myShare?.amount ?? 0);
            return (
              <div key={exp.id} className="bg-white rounded-xl border border-zinc-100 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{exp.description}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {getName(exp.paidById)} paid {formatMoney(exp.amount)} ·{" "}
                    {formatDistanceToNow(exp.createdAt, { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className={myNet > 0 ? "text-sm font-semibold text-emerald-600" : myNet < 0 ? "text-sm font-semibold text-rose-600" : "text-sm text-zinc-400"}>
                    {myNet > 0 ? `+${formatMoney(myNet)}` : myNet < 0 ? formatMoney(myNet) : "—"}
                  </p>
                  <DeleteExpenseButton expenseId={exp.id} returnPath={`/app/friends/${friendId}`} />
                </div>
              </div>
            );
          })}
          {nonGroupSettlements.map((s) => (
            <div key={s.id} className="bg-zinc-50 rounded-xl border border-zinc-100 px-5 py-3 text-sm text-zinc-600">
              <span className="font-medium">{getName(s.fromUserId)}</span> paid{" "}
              <span className="font-medium">{getName(s.toUserId)}</span> ·{" "}
              <span className="font-semibold text-emerald-600">{formatMoney(s.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Shared groups */}
      {sharedGroups.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Shared groups</p>
          {sharedGroups.map((g) => (
            <a
              key={g.id}
              href={`/app/groups/${g.id}`}
              className="block bg-white rounded-xl border border-zinc-100 px-5 py-3 text-sm font-medium text-zinc-700 hover:border-zinc-200 transition-colors"
            >
              {g.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
