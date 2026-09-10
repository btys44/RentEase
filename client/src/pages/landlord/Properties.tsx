import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import { Property, Unit } from '../../utils/types';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

interface CaretakerOption {
  id: number;
  name: string;
  email: string;
}

export default function LandlordProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [caretakers, setCaretakers] = useState<CaretakerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyForm, setPropertyForm] = useState({ name: '', location: '', caretakerId: '' });
  const [saving, setSaving] = useState(false);

  const [unitFormFor, setUnitFormFor] = useState<number | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitForm, setUnitForm] = useState({ unitNumber: '', type: '', rentAmount: '' });
  const [savingUnit, setSavingUnit] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [propsRes, caretakersRes] = await Promise.all([
        api.get('/properties'),
        api.get('/users', { params: { role: 'CARETAKER' } }),
      ]);
      setProperties(propsRes.data);
      setCaretakers(caretakersRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNewProperty() {
    setEditingProperty(null);
    setPropertyForm({ name: '', location: '', caretakerId: '' });
    setShowPropertyForm(true);
  }

  function openEditProperty(p: Property) {
    setEditingProperty(p);
    setPropertyForm({ name: p.name, location: p.location, caretakerId: p.caretakerId ? String(p.caretakerId) : '' });
    setShowPropertyForm(true);
  }

  async function submitProperty(e: FormEvent) {
    e.preventDefault();
    if (!propertyForm.name.trim() || !propertyForm.location.trim()) {
      toast.error('Property name and location are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: propertyForm.name,
        location: propertyForm.location,
        caretakerId: propertyForm.caretakerId || null,
      };
      if (editingProperty) {
        await api.put(`/properties/${editingProperty.id}`, payload);
        toast.success('Property updated.');
      } else {
        await api.post('/properties', payload);
        toast.success('Property added.');
      }
      setShowPropertyForm(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteProperty(id: number) {
    if (!confirm('Delete this property and all its units? This cannot be undone.')) return;
    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function openNewUnit(propertyId: number) {
    setEditingUnit(null);
    setUnitForm({ unitNumber: '', type: '', rentAmount: '' });
    setUnitFormFor(propertyId);
  }

  function openEditUnit(propertyId: number, unit: Unit) {
    setEditingUnit(unit);
    setUnitForm({ unitNumber: unit.unitNumber, type: unit.type, rentAmount: String(unit.rentAmount) });
    setUnitFormFor(propertyId);
  }

  async function submitUnit(e: FormEvent) {
    e.preventDefault();
    if (!unitForm.unitNumber.trim() || !unitForm.type.trim() || !unitForm.rentAmount) {
      toast.error('Unit number, type and rent amount are required.');
      return;
    }
    setSavingUnit(true);
    try {
      if (editingUnit) {
        await api.put(`/units/${editingUnit.id}`, unitForm);
        toast.success('Unit updated.');
      } else {
        await api.post('/units', { ...unitForm, propertyId: unitFormFor });
        toast.success('Unit added.');
      }
      setUnitFormFor(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingUnit(false);
    }
  }

  async function deleteUnit(id: number) {
    if (!confirm('Delete this unit?')) return;
    try {
      await api.delete(`/units/${id}`);
      toast.success('Unit deleted.');
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
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 text-sm">Manage your properties and units</p>
        </div>
        <button className="btn-primary" onClick={openNewProperty}>
          + Add Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No properties yet. Add your first one above.</div>
      ) : (
        <div className="space-y-5">
          {properties.map((property) => (
            <div key={property.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-lg">{property.name}</p>
                  <p className="text-sm text-gray-500">{property.location}</p>
                  {property.caretaker && (
                    <p className="text-xs text-gray-400 mt-1">Caretaker: {property.caretaker.name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs" onClick={() => openEditProperty(property)}>
                    Edit
                  </button>
                  <button className="btn-danger text-xs" onClick={() => deleteProperty(property.id)}>
                    Delete
                  </button>
                  <button className="btn-primary text-xs" onClick={() => openNewUnit(property.id)}>
                    + Unit
                  </button>
                </div>
              </div>

              {unitFormFor === property.id && (
                <form onSubmit={submitUnit} className="bg-brand-50 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="label">Unit Number</label>
                    <input className="input-field" value={unitForm.unitNumber} onChange={(e) => setUnitForm((f) => ({ ...f, unitNumber: e.target.value }))} placeholder="A1" />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <input className="input-field" value={unitForm.type} onChange={(e) => setUnitForm((f) => ({ ...f, type: e.target.value }))} placeholder="1 Bedroom" />
                  </div>
                  <div>
                    <label className="label">Rent (KES)</label>
                    <input type="number" className="input-field" value={unitForm.rentAmount} onChange={(e) => setUnitForm((f) => ({ ...f, rentAmount: e.target.value }))} placeholder="12000" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={savingUnit} className="btn-primary flex-1">
                      {savingUnit ? 'Saving...' : editingUnit ? 'Update' : 'Add'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setUnitFormFor(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {property.units.length === 0 ? (
                <p className="text-sm text-gray-400">No units added yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-2 pr-4">Unit</th>
                        <th className="py-2 pr-4">Type</th>
                        <th className="py-2 pr-4">Rent</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Tenant</th>
                        <th className="py-2 pr-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {property.units.map((unit) => (
                        <tr key={unit.id} className="border-b border-gray-50">
                          <td className="py-2 pr-4 font-medium">{unit.unitNumber}</td>
                          <td className="py-2 pr-4">{unit.type}</td>
                          <td className="py-2 pr-4">KES {unit.rentAmount.toLocaleString('en-KE')}</td>
                          <td className="py-2 pr-4"><StatusBadge status={unit.status} /></td>
                          <td className="py-2 pr-4">{unit.tenants?.[0]?.user.name || '—'}</td>
                          <td className="py-2 pr-4">
                            <div className="flex gap-2">
                              <button className="text-brand-700 text-xs hover:underline" onClick={() => openEditUnit(property.id, unit)}>
                                Edit
                              </button>
                              <button className="text-red-600 text-xs hover:underline" onClick={() => deleteUnit(unit.id)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showPropertyForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-lg mb-4">{editingProperty ? 'Edit Property' : 'Add Property'}</h2>
            <form onSubmit={submitProperty} className="space-y-4">
              <div>
                <label className="label">Property Name</label>
                <input className="input-field" value={propertyForm.name} onChange={(e) => setPropertyForm((f) => ({ ...f, name: e.target.value }))} placeholder="Greenview Apartments" />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input-field" value={propertyForm.location} onChange={(e) => setPropertyForm((f) => ({ ...f, location: e.target.value }))} placeholder="Kikuyu, Kiambu County" />
              </div>
              <div>
                <label className="label">Assign Caretaker (optional)</label>
                <select className="input-field" value={propertyForm.caretakerId} onChange={(e) => setPropertyForm((f) => ({ ...f, caretakerId: e.target.value }))}>
                  <option value="">No caretaker assigned</option>
                  {caretakers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
                {caretakers.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No caretaker accounts exist yet — ask a caretaker to register first.</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn-secondary" onClick={() => setShowPropertyForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : editingProperty ? 'Update' : 'Add Property'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}