import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import Spinner from '../../components/Spinner';

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
  createdAt: string;
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [overviewRes, usersRes] = await Promise.all([
          api.get('/admin/overview'),
          api.get('/admin/users'),
        ]);
        setOverview(overviewRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

      <div className="card overflow-x-auto">
        <h2 className="font-semibold text-lg mb-4">All Registered Users</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50">
                <td className="py-2 pr-4 font-medium">{u.name}</td>
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4">{u.phone}</td>
                <td className="py-2 pr-4">{u.role}</td>
                <td className="py-2 pr-4">{new Date(u.createdAt).toLocaleDateString('en-KE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}