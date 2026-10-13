import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import { Tenant, Property } from '../../utils/types';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import PasswordInput from '../../components/PasswordInput';
import MonthlyLedger from '../../components/MonthlyLedger';

export default function LandlordTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkMode, setLinkMode] = useState<'new' | 'existing'>('new');
  const [existingUsers, setExistingUsers] = useState<{ id: number; name: string; email: string }[]>([]);

  const [form, setForm] = useState({
    unitId: '',
    userId: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    moveInDate: '',
    depositPaid: '',
    leaseEndDate: '',
  });

  const [ledgerTenant, setLedgerTenant] = useState<Tenant | null>(null);
  const [ledgerPayments, setLedgerPayments] = useState<{ month: number; year: number; amount: number }[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState({ moveInDate: '', depositPaid: '', leaseEndDate: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  async function openLedger(tenant: Tenant) {
    setLedgerTenant(tenant);
    setLedgerLoading(true);
    try {
      const res = await api.get('/payments', { params: { tenantId: tenant.id } });
      setLedgerPayments(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLedgerLoading(false);
    }
  }

  function openEdit(tenant: Tenant) {
    setEditingTenant(tenant);
    setEditForm({
      moveInDate: tenant.moveInDate.slice(0, 10),
      depositPaid: String(tenant.depositPaid),
      leaseEndDate: tenant.leaseEndDate ? tenant.leaseEndDate.slice(0, 10) : '',
    });
  }

  async function submitEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingTenant) return;
    setSavingEdit(true);
    try {
      await api.put(`/tenants/${editingTenant.id}`, {
        moveInDate: editForm.moveInDate,
        depositPaid: editForm.depositPaid,
        leaseEndDate: editForm.leaseEndDate || null,
      });
      toast.success('Tenant details updated.');
      setEditingTenant(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  }

  async function load() {
    try {
      setLoading(true);
      const [tenantsRes, propsRes] = await Promise.all([api.get('/tenants'), api.get('/properties')]);
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
  }, []);

  async function loadExistingTenantUsers() {
    try {
      const res = await api.get('/users', { params: { role: 'TENANT', unassigned: 'true' } });
      setExistingUsers(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function openForm() {
    setForm({ unitId: '', userId: '', name: '', email: '', phone: '', password: '', moveInDate: '', depositPaid: '', leaseEndDate: '' });
    setLinkMode('new');
    loadExistingTenantUsers();
    setShowForm(true);
  }

  const vacantUnits = properties.flatMap((p) =>
    p.units.filter((u) => u.status === 'VACANT').map((u) => ({ ...u, propertyName: p.name }))
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.unitId) {
      toast.error('Please select a unit.');
      return;
    }
    if (!form.moveInDate) {
      toast.error('Please select a move-in date.');
      return;
    }
    if (!form.depositPaid || Number(form.depositPaid) <= 0) {
      toast.error('Deposit paid must be a positive number.');
      return;
    }
    if (linkMode === 'existing' && !form.userId) {
      toast.error('Select an existing tenant account.');
      return;
    }
    if (linkMode === 'new') {
      if (!form.name.trim()) {
        toast.error('Full name is required.');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        toast.error('Enter a valid email address.');
        return;
      }
      if (!/^\+?\d{9,15}$/.test(form.phone.replace(/\s/g, ''))) {
        toast.error('Enter a valid phone number (e.g. +254712345678).');
        return;
      }
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        unitId: form.unitId,
        moveInDate: form.moveInDate,
        depositPaid: form.depositPaid,
        leaseEndDate: form.leaseEndDate || undefined,
      };
      if (linkMode === 'existing') {
        payload.userId = form.userId;
      } else {
        payload.name = form.name;
        payload.email = form.email;
        payload.phone = form.phone;
        payload.password = form.password;
      }
      await api.post('/tenants', payload);
      toast.success('Tenant added.');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeTenant(id: number) {
    if (!confirm('Remove this tenant from their unit?')) return;
    try {
      await api.delete(`/tenants/${id}`);
      toast.success('Tenant removed.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 text-sm">Manage tenants across all your properties</p>
        </div>
        <button className="btn-primary" onClick={openForm}>
          + Add Tenant
        </button>
      </div>

      <div className="card overflow-x-auto">
        {tenants.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No tenants yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Unit</th>
                <th className="py-2 pr-4">Property</th>
                <th className="py-2 pr-4">Lease End</th>
                <th className="py-2 pr-4">Latest Payment</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-medium">{t.user.name}</td>
                  <td className="py-2 pr-4 text-gray-500">
                    <p>{t.user.email}</p>
                    <p>{t.user.phone}</p>
                  </td>
                  <td className="py-2 pr-4">{t.unit.unitNumber}</td>
                  <td className="py-2 pr-4">{t.unit.property.name}</td>
                  <td className="py-2 pr-4">{t.leaseEndDate ? new Date(t.leaseEndDate).toLocaleDateString('en-KE') : '—'}</td>
                  <td className="py-2 pr-4">{t.payments?.[0] ? <StatusBadge status={t.payments[0].status} /> : <StatusBadge status="UNPAID" />}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-3">
                      <button className="text-brand-700 text-xs hover:underline" onClick={() => openLedger(t)}>
                        View Ledger
                      </button>
                      <button className="text-brand-700 text-xs hover:underline" onClick={() => openEdit(t)}>
                        Edit
                      </button>
                      <button className="text-red-600 text-xs hover:underline" onClick={() => removeTenant(t.id)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="font-semibold text-lg mb-4">Add Tenant</h2>
              <form onSubmit={submit} className="space-y-4">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setLinkMode('new')} className={`flex-1 text-sm py-2 rounded-lg border ${linkMode === 'new' ? 'bg-brand-700 text-white border-brand-700' : 'border-gray-300 text-gray-600'}`}>
                    New tenant account
                  </button>
                  <button type="button" onClick={() => setLinkMode('existing')} className={`flex-1 text-sm py-2 rounded-lg border ${linkMode === 'existing' ? 'bg-brand-700 text-white border-brand-700' : 'border-gray-300 text-gray-600'}`}>
                    Link existing account
                  </button>
                </div>

                <div>
                  <label className="label">Assign to Unit</label>
                  <select className="input-field" value={form.unitId} onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}>
                    <option value="">Select a vacant unit</option>
                    {vacantUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.propertyName} — {u.unitNumber} ({u.type}, KES {u.rentAmount.toLocaleString('en-KE')})
                      </option>
                    ))}
                  </select>
                  {vacantUnits.length === 0 && <p className="text-xs text-gray-400 mt-1">No vacant units available. Add a property/unit first.</p>}
                </div>

                {linkMode === 'existing' ? (
                <div>
                  <label className="label">Existing Tenant Account</label>
                  <select className="input-field" value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}>
                    <option value="">Select tenant</option>
                    {existingUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Full Name</label>
                      <input className="input-field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input className="input-field" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+254712345678" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input-field" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <PasswordInput
                    label="Password (for tenant login)"
                    value={form.password}
                    onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                    placeholder="At least 6 characters"
                  />
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Move-in Date</label>
                  <input type="date" className="input-field" value={form.moveInDate} onChange={(e) => setForm((f) => ({ ...f, moveInDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Deposit Paid (KES)</label>
                  <input type="number" className="input-field" value={form.depositPaid} onChange={(e) => setForm((f) => ({ ...f, depositPaid: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Lease End Date (optional)</label>
                <input type="date" className="input-field" value={form.leaseEndDate} onChange={(e) => setForm((f) => ({ ...f, leaseEndDate: e.target.value }))} />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Add Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTenant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-lg mb-4">Edit Tenant — {editingTenant.user.name}</h2>
            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="label">Move-in Date</label>
                <input type="date" className="input-field" value={editForm.moveInDate} onChange={(e) => setEditForm((f) => ({ ...f, moveInDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">Deposit Paid (KES)</label>
                <input type="number" className="input-field" value={editForm.depositPaid} onChange={(e) => setEditForm((f) => ({ ...f, depositPaid: e.target.value }))} />
              </div>
              <div>
                <label className="label">Lease End Date (optional)</label>
                <input type="date" className="input-field" value={editForm.leaseEndDate} onChange={(e) => setEditForm((f) => ({ ...f, leaseEndDate: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" className="btn-secondary" onClick={() => setEditingTenant(null)}>Cancel</button>
                <button type="submit" disabled={savingEdit} className="btn-primary">{savingEdit ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ledgerTenant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 shrink-0">
              <h2 className="font-semibold text-lg">
                Monthly Ledger — {ledgerTenant.user.name} ({ledgerTenant.unit.unitNumber})
              </h2>
              <button className="text-gray-400 hover:text-gray-600 text-xl leading-none" onClick={() => setLedgerTenant(null)}>
                ✕
              </button>
            </div>
            <div className="p-6 pt-4 overflow-y-auto">
              {ledgerLoading ? (
                <div className="flex justify-center py-10"><Spinner size="h-8 w-8" /></div>
              ) : (
                <MonthlyLedger
                  moveInDate={ledgerTenant.moveInDate}
                  rentAmount={ledgerTenant.unit.rentAmount}
                  payments={ledgerPayments}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}