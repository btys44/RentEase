import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import { MaintenanceRequest } from '../../utils/types';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

const FILTERS = ['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'] as const;

export default function CaretakerMaintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/maintenance');
      setRequests(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    try {
      await api.put(`/maintenance/${id}/status`, { status });
      toast.success('Status updated.');
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as any } : r)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
        <p className="text-gray-500 text-sm">Requests for units in your assigned property</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              filter === f ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="h-8 w-8" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No maintenance requests found.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-medium text-sm">{r.unit?.property.name} - {r.unit?.unitNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Tenant: {r.tenant?.user.name} ({r.tenant?.user.phone})</p>
                    <p className="text-sm text-gray-800 mt-2">{r.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Reported {new Date(r.createdAt).toLocaleDateString('en-KE')}</p>
                  </div>
                  {r.photoUrl && (
                    <img
                      src={r.photoUrl}
                      alt="Maintenance issue"
                      className="h-20 w-20 rounded-lg object-cover border border-gray-100"
                    />
                  )}
                  <StatusBadge status={r.status} />
                </div>

                <div className="flex gap-2 mt-3">
                  {(['PENDING', 'IN_PROGRESS', 'RESOLVED'] as const).map((s) => (
                    <button
                      key={s}
                      disabled={r.status === s || updatingId === r.id}
                      onClick={() => updateStatus(r.id, s)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        r.status === s
                          ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                          : 'bg-white text-brand-700 border-brand-200 hover:bg-brand-50'
                      }`}
                    >
                      {updatingId === r.id ? '...' : `Mark ${s.replace('_', ' ')}`}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
