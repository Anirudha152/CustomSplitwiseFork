import type { BalanceMap, Debt } from "./balances";

export function simplifyDebts(balances: BalanceMap): Debt[] {
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, amount] of Object.entries(balances)) {
    if (amount > 0) creditors.push({ userId, amount });
    else if (amount < 0) debtors.push({ userId, amount: -amount });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const result: Debt[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const transfer = Math.min(c.amount, d.amount);

    result.push({ from: d.userId, to: c.userId, amount: transfer });

    c.amount -= transfer;
    d.amount -= transfer;

    if (c.amount === 0) ci++;
    if (d.amount === 0) di++;
  }

  return result;
}
