import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import { RentPayment, MONTH_NAMES } from '../../utils/types';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import MonthlyLedger from '../../components/MonthlyLedger';

export default function TenantPayments() {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [moveInDate, setMoveInDate] = useState<string | null>(null);
  const [rentAmount, setRentAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'history' | 'ledger'>('history');

  useEffect(() => {
    (async () => {
      try {
        const [paymentsRes, profileRes] = await Promise.all([
          api.get('/payments'),
          api.get('/tenants/me'),
        ]);
        setPayments(paymentsRes.data);
        setMoveInDate(profileRes.data.moveInDate);
        setRentAmount(profileRes.data.unit.rentAmount);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
        <p className="text-gray-500 text-sm">Your rent payments and downloadable receipts</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setView('history')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${view === 'history' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          Payment History
        </button>
        <button
          onClick={() => setView('ledger')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${view === 'ledger' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          Monthly Amount Due
        </button>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="h-8 w-8" /></div>
        ) : view === 'ledger' ? (
          moveInDate ? (
            <MonthlyLedger moveInDate={moveInDate} rentAmount={rentAmount} payments={payments} />
          ) : (
            <p className="text-center text-gray-500 py-10">No tenancy record found.</p>
          )
        ) : payments.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Month</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">M-Pesa Ref</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                  <td className="py-2 pr-4 font-medium">KES {p.amount.toLocaleString('en-KE')}</td>
                  <td className="py-2 pr-4">{p.mpesaRef || '—'}</td>
                  <td className="py-2 pr-4"><StatusBadge status={p.status} /></td>
                  <td className="py-2 pr-4">
                    {p.receiptUrl ? (
                      <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                        Download PDF
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}