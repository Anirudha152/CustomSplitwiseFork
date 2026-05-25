export interface ShareEntry {
  userId: string;
  amount: number; // minor units
}

export function splitEqual(total: number, userIds: string[]): ShareEntry[] {
  if (userIds.length === 0) return [];
  const sorted = [...userIds].sort();
  const base = Math.floor(total / sorted.length);
  const remainder = total - base * sorted.length;
  return sorted.map((userId, i) => ({
    userId,
    amount: base + (i < remainder ? 1 : 0),
  }));
}

export function splitExact(
  total: number,
  entries: ShareEntry[]
): ShareEntry[] {
  const sum = entries.reduce((acc, e) => acc + e.amount, 0);
  if (sum !== total) {
    throw new Error(`Share amounts (${sum}) don't match total (${total})`);
  }
  return entries;
}
