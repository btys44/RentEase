import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api, { getErrorMessage } from '../../utils/api';
import Spinner from '../../components/Spinner';

interface ReportData {
  revenueByProperty: { propertyName: string; revenue: number }[];
  outstanding: { tenantName: string; unitNumber: string; propertyName: string; amountDue: number }[];
  occupancy: { total: number; occupied: number; vacant: number; rate: number };
  month: number;
  year: number;
}

const COLORS = ['#16a34a', '#e5e7eb'];

export default function LandlordReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/reports/summary');
      setData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function exportPdf() {
    setExporting(true);
    try {
      const res = await api.get('/reports/export');
      window.open(res.data.url, '_blank');
      toast.success('Report PDF generated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="h-8 w-8" />
      </div>
    );
  }

  const occupancyData = [
    { name: 'Occupied', value: data.occupancy.occupied },
    { name: 'Vacant', value: data.occupancy.vacant },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm">Revenue, outstanding balances and occupancy overview</p>
        </div>
        <button className="btn-primary" onClick={exportPdf} disabled={exporting}>
          {exporting ? 'Generating...' : '📄 Export PDF'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h2 className="font-semibold mb-4">Monthly Revenue by Property</h2>
          {data.revenueByProperty.length === 0 ? (
            <p className="text-sm text-gray-400">No properties yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.revenueByProperty}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis dataKey="propertyName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `KES ${v.toLocaleString('en-KE')}`} />
                <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">Occupancy Rate ({data.occupancy.rate}%)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={occupancyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {occupancyData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Outstanding Balances — {data.month}/{data.year}</h2>
        {data.outstanding.length === 0 ? (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">All tenants are up to date this month. 🎉</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Tenant</th>
                <th className="py-2 pr-4">Unit</th>
                <th className="py-2 pr-4">Property</th>
                <th className="py-2 pr-4">Amount Due</th>
              </tr>
            </thead>
            <tbody>
              {data.outstanding.map((o, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-medium">{o.tenantName}</td>
                  <td className="py-2 pr-4">{o.unitNumber}</td>
                  <td className="py-2 pr-4">{o.propertyName}</td>
                  <td className="py-2 pr-4 text-red-600 font-medium">KES {o.amountDue.toLocaleString('en-KE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
