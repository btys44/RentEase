import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import { MaintenanceRequest } from '../../utils/types';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

export default function TenantMaintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!description.trim()) errs.description = 'Please describe the issue.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', description);
      if (photo) formData.append('photo', photo);
      await api.post('/maintenance', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Maintenance request submitted.');
      setDescription('');
      setPhoto(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
        <p className="text-gray-500 text-sm">Submit and track maintenance requests for your unit</p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Submit a New Request</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Describe the issue</label>
            <textarea
              className="input-field"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Leaking kitchen tap"
            />
            {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="label">Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="text-sm"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Your Requests</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="h-8 w-8" /></div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-400">You haven't submitted any maintenance requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-lg p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-800">{r.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Submitted {new Date(r.createdAt).toLocaleDateString('en-KE')}</p>
                  {r.caretaker && <p className="text-xs text-gray-400">Assigned to {r.caretaker.name}</p>}
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
