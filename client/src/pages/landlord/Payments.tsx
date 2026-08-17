import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import { RentPayment, Tenant, Property, MONTH_NAMES } from '../../utils/types';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

export default function LandlordPayments() {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [filters, setFilters] = useState({ month: '', year: '', propertyId: '', status: '' });

  const [form, setForm] = useState({
    tenantId: '',
    amount: '',
    mpesaRef: '',
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    status: '',
  });

  async function load() {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.propertyId) params.propertyId = filters.propertyId;
      if (filters.status) params.status = filters.status;
      const [paymentsRes, tenantsRes, propsRes] = await Promise.all([
        api.get('/payments', { params }),
        api.get('/tenants'),
        api.get('/properties'),
      ]);
      setPayments(paymentsRes.data);
      setTenants(tenantsRes.data);
      setProperties(propsRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.month, filters.year, filters.propertyId, filters.status]);

  function openForm() {
    setForm({ tenantId: '', amount: '', mpesaRef: '', month: String(now.getMonth() + 1), year: String(now.getFullYear()), status: '' });
    setShowForm(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.tenantId || !form.amount) {
      toast.error('Tenant and amount are required.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/payments', form);
      toast.success('Payment recorded and receipt generated.');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await api.put(`/payments/${id}/status`, { status });
      toast.success('Payment status updated.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 text-sm">Record and track rent payments</p>
        </div>
        <button className="btn-primary" onClick={openForm}>
          + Record Payment
        </button>
      </div>

      <div className="card flex flex-wrap gap-3">
        <select className="input-field w-auto" value={filters.propertyId} onChange={(e) => setFilters((f) => ({ ...f, propertyId: e.target.value }))}>
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select className="input-field w-auto" value={filters.month} onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}>
          <option value="">All Months</option>
          {MONTH_NAMES.map((m, idx) => (
            <option key={m} value={idx + 1}>{m}</option>
          ))}
        </select>
        <select className="input-field w-auto" value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}>
          <option value="">All Years</option>
          {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select className="input-field w-auto" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
          <option value="UNPAID">Unpaid</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="h-8 w-8" /></div>
        ) : payments.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No payments found for the selected filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Tenant</th>
                <th className="py-2 pr-4">Unit</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Month</th>
                <th className="py-2 pr-4">M-Pesa Ref</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-medium">{p.tenant?.user.name}</td>
                  <td className="py-2 pr-4">{p.unit?.unitNumber} ({p.unit?.property.name})</td>
                  <td className="py-2 pr-4">KES {p.amount.toLocaleString('en-KE')}</td>
                  <td className="py-2 pr-4">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                  <td className="py-2 pr-4">{p.mpesaRef || '—'}</td>
                  <td className="py-2 pr-4">
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                      value={p.status}
                      onChange={(e) => updateStatus(p.id, e.target.value)}
                    >
                      <option value="PAID">Paid</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="UNPAID">Unpaid</option>
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    {p.receiptUrl ? (
                      <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-brand-700 text-xs hover:underline">
                        Download
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-lg mb-4">Record Payment</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">Tenant</label>
                <select className="input-field" value={form.tenantId} onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}>
                  <option value="">Select tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name} — {t.unit.unitNumber} ({t.unit.property.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (KES)</label>
                  <input type="number" className="input-field" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">M-Pesa Reference</label>
                  <input className="input-field" value={form.mpesaRef} onChange={(e) => setForm((f) => ({ ...f, mpesaRef: e.target.value }))} placeholder="QK7X9Y2ABC" />
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
              <div>
                <label className="label">Status (optional — auto-calculated if left blank)</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="">Auto</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
