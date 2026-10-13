export interface LedgerMonth {
  month: number;
  year: number;
  due: number;
  paid: number;
  balance: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Builds a month-by-month rent ledger from move-in date to the current month,
 * showing what was due, what was paid, and the resulting balance for each month.
 */
export function buildMonthlyLedger(
  moveInDate: string,
  rentAmount: number,
  payments: { month: number; year: number; amount: number }[]
): LedgerMonth[] {
  const start = new Date(moveInDate);
  const now = new Date();
  const months: LedgerMonth[] = [];

  let y = start.getFullYear();
  let m = start.getMonth() + 1;

  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    const paidForMonth = payments
      .filter((p) => p.month === m && p.year === y)
      .reduce((sum, p) => sum + p.amount, 0);

    const balance = Math.max(rentAmount - paidForMonth, 0);
    let status: LedgerMonth['status'] = 'UNPAID';
    if (paidForMonth >= rentAmount) status = 'PAID';
    else if (paidForMonth > 0) status = 'PARTIAL';

    months.push({ month: m, year: y, due: rentAmount, paid: paidForMonth, balance, status });

    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }

  return months.reverse(); // most recent month first
}