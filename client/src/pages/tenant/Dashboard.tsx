import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import { Tenant } from '../../utils/types';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

export default function TenantDashboard() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/tenants/me');
        setTenant(res.data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="h-8 w-8" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="card text-center py-12 text-gray-500">
        No tenant profile is linked to your account yet. Please contact your landlord.
      </div>
    );
  }

  const lastPayment = tenant.payments?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {tenant.user.name.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 text-sm">Here's an overview of your tenancy</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Current Unit</p>
          <p className="text-xl font-bold mt-1">{tenant.unit.unitNumber}</p>
          <p className="text-xs text-gray-400">{tenant.unit.property.name}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Monthly Rent</p>
          <p className="text-xl font-bold mt-1">KES {tenant.unit.rentAmount.toLocaleString('en-KE')}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Lease End Date</p>
          <p className="text-xl font-bold mt-1">{tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString('en-KE') : '—'}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Latest Payment</h2>
          <Link to="/tenant/payments" className="text-sm text-brand-700 hover:underline">View all →</Link>
        </div>
        {lastPayment ? (
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">KES {lastPayment.amount.toLocaleString('en-KE')}</p>
              <p className="text-gray-400 text-xs">{new Date(lastPayment.createdAt).toLocaleDateString('en-KE')}</p>
            </div>
            <StatusBadge status={lastPayment.status} />
          </div>
        ) : (
          <p className="text-sm text-gray-400">No payments recorded yet.</p>
        )}
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Have a maintenance issue?</h2>
          <p className="text-sm text-gray-500">Submit a request and track its status.</p>
        </div>
        <Link to="/tenant/maintenance" className="btn-primary">Submit Request</Link>
      </div>
    </div>
  );
}
