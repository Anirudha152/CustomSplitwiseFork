import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { computeBalances } from "@/lib/balances";
import { simplifyDebts } from "@/lib/simplify";
import { formatMoney } from "@/lib/money";
import { AddExpenseSheet } from "@/components/add-expense-sheet";
import { SettleUpDialog } from "@/components/settle-up-dialog";
import { InviteLinkBox } from "@/components/invite-link-box";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const group = await db.group.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      expenses: {
        orderBy: { createdAt: "desc" },
        include: { shares: true, paidBy: true },
      },
      settlements: { orderBy: { createdAt: "desc" }, include: { from: true, to: true } },
    },
  });

  if (!group) notFound();

  const isMember = group.members.some((m) => m.userId === userId);
  if (!isMember) redirect("/app");

  const members = group.members.map((m) => m.user);
  const balances = computeBalances(group.expenses, group.settlements);
  const simplifiedDebts = simplifyDebts(balances);

  const activeExpenses = group.expenses.filter((e) => !e.deletedAt);
  const activeSettlements = group.settlements.filter((s) => !s.deletedAt);

  function getName(uid: string) {
    if (uid === userId) return "You";
    return members.find((m) => m.id === uid)?.name ?? "Unknown";
  }

  const host = process.env.NEXTAUTH_URL ?? "";
  const inviteUrl = `${host}/join/${group.inviteToken}`;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{group.name}</h1>
          <div className="flex items-center gap-1.5 mt-2">
            {members.map((m) => (
              <Avatar key={m.id} className="w-6 h-6 ring-2 ring-white">
                <AvatarImage src={m.image ?? ""} />
                <AvatarFallback className="text-[10px]">{m.name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
            ))}
            <span className="text-xs text-zinc-400 ml-1">{members.length} member{members.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <SettleUpDialog
            members={members}
            currentUserId={userId}
            groupId={group.id}
            suggestedDebts={simplifiedDebts}
          />
          <AddExpenseSheet
            members={members}
            currentUserId={userId}
            groupId={group.id}
            friendId={null}
          />
        </div>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="invite">Invite</TabsTrigger>
        </TabsList>

        {/* Expenses tab */}
        <TabsContent value="expenses" className="mt-4 space-y-2">
          {activeExpenses.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-3xl">🧾</p>
              <p className="text-zinc-500 text-sm">No expenses yet. Add the first one!</p>
            </div>
          ) : (
            activeExpenses.map((exp) => {
              const myShare = exp.shares.find((s) => s.userId === userId);
              const iPaid = exp.paidById === userId;
              const myNet = iPaid
                ? exp.amount - (myShare?.amount ?? 0)
                : -(myShare?.amount ?? 0);

              return (
                <div
                  key={exp.id}
                  className="bg-white rounded-xl border border-zinc-100 px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {exp.category && (
                          <span className="text-[11px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">
                            {exp.category}
                          </span>
                        )}
                        <p className="font-medium text-zinc-900 truncate">{exp.description}</p>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        {getName(exp.paidById)} paid {formatMoney(exp.amount)} ·{" "}
                        {formatDistanceToNow(exp.createdAt, { addSuffix: true })}
                      </p>
                      {exp.notes && <p className="text-xs text-zinc-400 mt-0.5 italic">{exp.notes}</p>}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p
                        className={
                          myNet > 0
                            ? "text-sm font-semibold text-emerald-600"
                            : myNet < 0
                            ? "text-sm font-semibold text-rose-600"
                            : "text-sm text-zinc-400"
                        }
                      >
                        {myNet > 0
                          ? `+${formatMoney(myNet)}`
                          : myNet < 0
                          ? formatMoney(myNet)
                          : "not involved"}
                      </p>
                      <DeleteExpenseButton expenseId={exp.id} returnPath={`/app/groups/${group.id}`} />
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Settlements in this context */}
          {activeSettlements.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">Settlements</p>
              {activeSettlements.map((s) => (
                <div key={s.id} className="bg-zinc-50 rounded-xl border border-zinc-100 px-5 py-3 text-sm text-zinc-600">
                  <span className="font-medium text-zinc-800">{getName(s.fromUserId)}</span>
                  {" paid "}
                  <span className="font-medium text-zinc-800">{getName(s.toUserId)}</span>
                  {" · "}
                  <span className="font-semibold text-emerald-600">{formatMoney(s.amount)}</span>
                  {s.note && <span className="text-zinc-400"> · {s.note}</span>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Balances tab */}
        <TabsContent value="balances" className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Net balances</p>
            {members.map((m) => {
              const net = balances[m.id] ?? 0;
              return (
                <div key={m.id} className="flex items-center justify-between bg-white rounded-xl border border-zinc-100 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={m.image ?? ""} />
                      <AvatarFallback className="text-xs">{m.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-zinc-800">{m.id === userId ? "You" : m.name}</span>
                  </div>
                  <span
                    className={
                      net > 0 ? "text-sm font-semibold text-emerald-600"
                      : net < 0 ? "text-sm font-semibold text-rose-600"
                      : "text-sm text-zinc-400"
                    }
                  >
                    {net === 0 ? "settled up" : net > 0 ? `owed ${formatMoney(net)}` : `owes ${formatMoney(-net)}`}
                  </span>
                </div>
              );
            })}
          </div>

          {simplifiedDebts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Suggested payments</p>
              {simplifiedDebts.map((d, i) => (
                <div key={i} className="bg-white rounded-xl border border-zinc-100 px-5 py-3 text-sm text-zinc-700">
                  <span className="font-medium">{getName(d.from)}</span>
                  {" → "}
                  <span className="font-medium">{getName(d.to)}</span>
                  {" · "}
                  <span className="font-semibold text-emerald-600">{formatMoney(d.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Invite tab */}
        <TabsContent value="invite" className="mt-4">
          <InviteLinkBox groupId={group.id} inviteUrl={inviteUrl} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
