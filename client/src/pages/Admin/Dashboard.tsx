import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import PasswordInput from '../../components/PasswordInput';

interface Overview {
  totalLandlords: number;
  totalTenants: number;
  totalCaretakers: number;
  totalProperties: number;
  totalUnits: number;
  totalPayments: number;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface PropertyRow {
  id: number;
  name: string;
  location: string;
  landlord: { id: number; name: string; email: string };
  caretaker: { id: number; name: string; email: string } | null;
  units: { id: number; status: 'OCCUPIED' | 'VACANT' }[];
}

const ROLE_SECTIONS: { role: string; label: string }[] = [
  { role: 'LANDLORD', label: 'Landlords' },
  { role: 'CARETAKER', label: 'Caretakers' },
  { role: 'TENANT', label: 'Tenants' },
  { role: 'ADMIN', label: 'Admins' },
];

export default function AdminDashboard() {
  const { user: me } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'properties'>('users');
  const [busyId, setBusyId] = useState<number | null>(null);

  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingReset, setSavingReset] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [overviewRes, usersRes, propsRes] = await Promise.all([
          api.get('/admin/overview'),
          api.get('/admin/users'),
          api.get('/admin/properties'),
        ]);
        setOverview(overviewRes.data);
        setUsers(usersRes.data);
        setProperties(propsRes.data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function toggleActive(u: UserRow) {
    const action = u.isActive ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} ${u.name}?`)) return;
    setBusyId(u.id);
    try {
      const res = await api.put(`/admin/users/${u.id}/active`, { isActive: !u.isActive });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: res.data.isActive } : x)));
      toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'reactivated'}.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function openReset(u: UserRow) {
    setResetTarget(u);
    setNewPassword('');
  }

  async function submitReset(e: FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setSavingReset(true);
    try {
      const res = await api.put(`/admin/users/${resetTarget.id}/password`, { newPassword });
      toast.success(res.data.message);
      setResetTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingReset(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="h-8 w-8" /></div>;
  }

  const cards = overview
    ? [
        { label: 'Landlords', value: overview.totalLandlords },
        { label: 'Tenants', value: overview.totalTenants },
        { label: 'Caretakers', value: overview.totalCaretakers },
        { label: 'Properties', value: overview.totalProperties },
        { label: 'Units', value: overview.totalUnits },
        { label: 'Payments Recorded', value: overview.totalPayments },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">Platform-wide overview of RentEase Kenya</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold text-brand-700 mt-2">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('users')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${tab === 'users' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          Users
        </button>
        <button
          onClick={() => setTab('properties')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${tab === 'properties' ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          All Properties
        </button>
      </div>

      {tab === 'users' &&
        ROLE_SECTIONS.map(({ role, label }) => {
          const roleUsers = users.filter((u) => u.role === role);
          return (
            <div key={role} className="card overflow-x-auto">
              <h2 className="font-semibold text-lg mb-4">{label} ({roleUsers.length})</h2>
              {roleUsers.length === 0 ? (
                <p className="text-sm text-gray-400">None registered yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Phone</th>
                      <th className="py-2 pr-4">Joined</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleUsers.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50">
                        <td className="py-2 pr-4 font-medium">{u.name}</td>
                        <td className="py-2 pr-4">{u.email}</td>
                        <td className="py-2 pr-4">{u.phone}</td>
                        <td className="py-2 pr-4">{new Date(u.createdAt).toLocaleDateString('en-KE')}</td>
                        <td className="py-2 pr-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          {u.id === me?.id ? (
                            <span className="text-xs text-gray-400">You</span>
                          ) : (
                            <div className="flex gap-3">
                              <button
                                className="text-brand-700 text-xs hover:underline"
                                onClick={() => openReset(u)}
                              >
                                Reset Password
                              </button>
                              <button
                                disabled={busyId === u.id}
                                className={`text-xs hover:underline ${u.isActive ? 'text-red-600' : 'text-green-700'}`}
                                onClick={() => toggleActive(u)}
                              >
                                {u.isActive ? 'Deactivate' : 'Reactivate'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}

      {tab === 'properties' && (
        <div className="card overflow-x-auto">
          <h2 className="font-semibold text-lg mb-4">All Properties ({properties.length})</h2>
          {properties.length === 0 ? (
            <p className="text-sm text-gray-400">No properties have been added yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">Property</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Landlord</th>
                  <th className="py-2 pr-4">Caretaker</th>
                  <th className="py-2 pr-4">Units</th>
                  <th className="py-2 pr-4">Occupied</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => {
                  const occupied = p.units.filter((u) => u.status === 'OCCUPIED').length;
                  return (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-2 pr-4 font-medium">{p.name}</td>
                      <td className="py-2 pr-4">{p.location}</td>
                      <td className="py-2 pr-4">
                        <p>{p.landlord.name}</p>
                        <p className="text-xs text-gray-400">{p.landlord.email}</p>
                      </td>
                      <td className="py-2 pr-4">{p.caretaker ? p.caretaker.name : '—'}</td>
                      <td className="py-2 pr-4">{p.units.length}</td>
                      <td className="py-2 pr-4">{occupied} / {p.units.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-lg mb-1">Reset Password</h2>
            <p className="text-sm text-gray-500 mb-4">
              Set a temporary password for {resetTarget.name}. Ask them to change it from Settings after logging in.
            </p>
            <form onSubmit={submitReset} className="space-y-4">
              <PasswordInput
                label="New temporary password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="At least 6 characters"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn-secondary" onClick={() => setResetTarget(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={savingReset} className="btn-primary">
                  {savingReset ? 'Saving...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}