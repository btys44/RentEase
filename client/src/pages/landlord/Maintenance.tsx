import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import { MaintenanceRequest } from '../../utils/types';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

interface CaretakerOption {
  id: number;
  name: string;
  email: string;
}

export default function LandlordMaintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [caretakers, setCaretakers] = useState<CaretakerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [photoModal, setPhotoModal] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const [reqRes, caretakerRes] = await Promise.all([
        api.get('/maintenance', { params }),
        api.get('/users', { params: { role: 'CARETAKER' } }),
      ]);
      setRequests(reqRes.data);
      setCaretakers(caretakerRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function assignCaretaker(id: number, caretakerId: string) {
    if (!caretakerId) return;
    try {
      await api.put(`/maintenance/${id}/assign`, { caretakerId });
      toast.success('Caretaker assigned.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await api.put(`/maintenance/${id}/status`, { status });
      toast.success('Status updated.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
        <p className="text-gray-500 text-sm">Track and assign maintenance across all properties</p>
      </div>

      <div className="card flex gap-2 flex-wrap">
        {['', 'PENDING', 'IN_PROGRESS', 'RESOLVED'].map((s) => (
          <button
            key={s || 'ALL'}
            onClick={() => setStatusFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-full border ${
              statusFilter === s ? 'bg-brand-700 text-white border-brand-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="h-8 w-8" /></div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No maintenance requests found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.unit?.unitNumber} — {r.unit?.property.name}</p>
                  <p className="text-xs text-gray-500">{r.tenant?.user.name} · {r.tenant?.user.phone}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-sm text-gray-700 mt-3">{r.description}</p>

              {r.photoUrl && (
                <button onClick={() => setPhotoModal(r.photoUrl)} className="mt-3">
                  <img src={r.photoUrl} alt="Maintenance issue" className="h-28 w-full object-cover rounded-lg border border-gray-100" />
                </button>
              )}

              <p className="text-xs text-gray-400 mt-3">
                Submitted {new Date(r.createdAt).toLocaleDateString('en-KE')}
                {r.caretaker && ` · Assigned to ${r.caretaker.name}`}
              </p>

              <div className="flex gap-2 mt-4 flex-wrap">
                <select
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                  defaultValue=""
                  onChange={(e) => assignCaretaker(r.id, e.target.value)}
                >
                  <option value="" disabled>Assign caretaker</option>
                  {caretakers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                  value={r.status}
                  onChange={(e) => updateStatus(r.id, e.target.value)}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {photoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setPhotoModal(null)}>
          <img src={photoModal} alt="Maintenance issue full size" className="max-h-[85vh] max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
