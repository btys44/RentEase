import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import { Tenant, MONTH_NAMES } from '../../utils/types';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

export default function CaretakerDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [payFor, setPayFor] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({ amount: '', mpesaRef: '', month: String(now.getMonth() + 1), year: String(now.getFullYear()) });

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/tenants');
      setTenants(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openPayForm(tenant: Tenant) {
    setPayFor(tenant);
    setForm({ amount: String(tenant.unit.rentAmount), mpesaRef: '', month: String(now.getMonth() + 1), year: String(now.getFullYear()) });
  }

  async function submitPayment(e: FormEvent) {
    e.preventDefault();
    if (!payFor) return;
    setSaving(true);
    try {
      await api.post('/payments', { tenantId: payFor.id, ...form });
      toast.success('Payment recorded and receipt generated.');
      setPayFor(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Caretaker Dashboard</h1>
        <p className="text-gray-500 text-sm">Units and rent status for your assigned property</p>
      </div>

      <div className="card overflow-x-auto">
        {tenants.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No tenants found for your assigned property.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Tenant</th>
                <th className="py-2 pr-4">Unit</th>
                <th className="py-2 pr-4">This Month</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const thisMonthPayment = t.payments?.find((p) => p.month === currentMonth && p.year === currentYear);
                return (
                  <tr key={t.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium">{t.user.name}</td>
                    <td className="py-2 pr-4">{t.unit.unitNumber}</td>
                    <td className="py-2 pr-4">
                      {thisMonthPayment ? <StatusBadge status={thisMonthPayment.status} /> : <StatusBadge status="UNPAID" />}
                    </td>
                    <td className="py-2 pr-4">
                      <button className="text-brand-700 text-xs hover:underline" onClick={() => openPayForm(t)}>
                        Log Payment
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {payFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-lg mb-1">Log Payment</h2>
            <p className="text-sm text-gray-500 mb-4">{payFor.user.name} — {payFor.unit.unitNumber}</p>
            <form onSubmit={submitPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (KES)</label>
                  <input type="number" className="input-field" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">M-Pesa Reference</label>
                  <input className="input-field" value={form.mpesaRef} onChange={(e) => setForm((f) => ({ ...f, mpesaRef: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Month</label>
                  <select className="input-field" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}>
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <input type="number" className="input-field" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className="btn-secondary" onClick={() => setPayFor(null)}>Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
