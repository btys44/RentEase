import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import { Property } from '../../utils/types';
import Spinner from '../../components/Spinner';

function paymentColor(status?: string) {
  if (status === 'PAID') return 'bg-green-500';
  if (status === 'PARTIAL') return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function LandlordDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/properties');
        setProperties(res.data);
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

  const allUnits = properties.flatMap((p) => p.units);
  const totalUnits = allUnits.length;
  const occupied = allUnits.filter((u) => u.status === 'OCCUPIED').length;
  const vacant = totalUnits - occupied;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let monthlyRevenue = 0;
  allUnits.forEach((u) => {
    (u.tenants || []).forEach((t) => {
      (t.payments || []).forEach((p) => {
        if (p.month === currentMonth && p.year === currentYear) {
          monthlyRevenue += p.amount;
        }
      });
    });
  });

  const cards = [
    { label: 'Total Units', value: totalUnits, color: 'text-brand-700' },
    { label: 'Occupied', value: occupied, color: 'text-green-600' },
    { label: 'Vacant', value: vacant, color: 'text-gray-500' },
    { label: 'Monthly Revenue', value: `KES ${monthlyRevenue.toLocaleString('en-KE')}`, color: 'text-brand-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Overview of all your properties</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className={`text-2xl font-bold mt-2 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Your Properties</h2>
          <Link to="/landlord/properties" className="text-sm text-brand-700 hover:underline">
            Manage properties →
          </Link>
        </div>

        {properties.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">
            No properties yet. <Link to="/landlord/properties" className="text-brand-700 underline">Add your first property</Link>.
          </p>
        ) : (
          <div className="space-y-5">
            {properties.map((property) => (
              <div key={property.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold">{property.name}</p>
                    <p className="text-xs text-gray-500">{property.location}</p>
                  </div>
                  <span className="text-xs text-gray-400">{property.units.length} unit(s)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {property.units.map((unit) => {
                    const tenant = unit.tenants?.[0];
                    const lastPayment = tenant?.payments?.[0];
                    const status = unit.status === 'VACANT' ? undefined : lastPayment?.status;
                    return (
                      <div
                        key={unit.id}
                        title={`${unit.unitNumber} - ${unit.status === 'VACANT' ? 'Vacant' : status || 'Unpaid'}`}
                        className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            unit.status === 'VACANT' ? 'bg-gray-300' : paymentColor(status)
                          }`}
                        />
                        <span className="font-medium">{unit.unitNumber}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
