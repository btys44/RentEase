import { buildMonthlyLedger, MONTH_NAMES } from '../utils/ledger';
import StatusBadge from './StatusBadge';

interface Props {
  moveInDate: string;
  rentAmount: number;
  payments: { month: number; year: number; amount: number }[];
}

export default function MonthlyLedger({ moveInDate, rentAmount, payments }: Props) {
  const ledger = buildMonthlyLedger(moveInDate, rentAmount, payments);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="py-2 pr-4">Month</th>
            <th className="py-2 pr-4">Due (KES)</th>
            <th className="py-2 pr-4">Paid (KES)</th>
            <th className="py-2 pr-4">Balance (KES)</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {ledger.map((row) => (
            <tr key={`${row.year}-${row.month}`} className="border-b border-gray-50">
              <td className="py-2 pr-4 font-medium">{MONTH_NAMES[row.month - 1]} {row.year}</td>
              <td className="py-2 pr-4">{row.due.toLocaleString('en-KE')}</td>
              <td className="py-2 pr-4">{row.paid.toLocaleString('en-KE')}</td>
              <td className="py-2 pr-4">{row.balance.toLocaleString('en-KE')}</td>
              <td className="py-2 pr-4"><StatusBadge status={row.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}