export interface BalanceMap {
  [userId: string]: number; // positive = is owed, negative = owes
}

export interface Debt {
  from: string;
  to: string;
  amount: number;
}

interface ExpenseWithShares {
  paidById: string;
  deletedAt: Date | null;
  shares: { userId: string; amount: number }[];
}

interface SettlementRecord {
  fromUserId: string;
  toUserId: string;
  amount: number;
  deletedAt: Date | null;
}

export function computeBalances(
  expenses: ExpenseWithShares[],
  settlements: SettlementRecord[]
): BalanceMap {
  const balances: BalanceMap = {};

  function add(userId: string, delta: number) {
    balances[userId] = (balances[userId] ?? 0) + delta;
  }

  for (const expense of expenses) {
    if (expense.deletedAt) continue;
    for (const share of expense.shares) {
      if (share.userId === expense.paidById) continue;
      add(expense.paidById, share.amount);
      add(share.userId, -share.amount);
    }
  }

  for (const s of settlements) {
    if (s.deletedAt) continue;
    add(s.toUserId, s.amount);
    add(s.fromUserId, -s.amount);
  }

  return balances;
}

export function pairwiseBalance(
  balances: BalanceMap,
  userA: string,
  userB: string
): number {
  // positive means A is owed by B, negative means A owes B
  // This is an approximation from net balances; not suitable when >2 members
  return (balances[userA] ?? 0);
}
