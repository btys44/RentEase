export interface UnitTenant {
  id: number;
  moveInDate: string;
  depositPaid: number;
  leaseEndDate: string | null;
  user: { id: number; name: string; email: string; phone: string };
  payments?: RentPayment[];
}

export interface Unit {
  id: number;
  unitNumber: string;
  type: string;
  rentAmount: number;
  propertyId: number;
  status: 'OCCUPIED' | 'VACANT';
  tenants?: UnitTenant[];
}

export interface Property {
  id: number;
  name: string;
  location: string;
  landlordId: number;
  caretakerId: number | null;
  caretaker?: { id: number; name: string; email: string } | null;
  units: Unit[];
  createdAt: string;
}

export interface Tenant {
  id: number;
  userId: number;
  unitId: number;
  moveInDate: string;
  depositPaid: number;
  leaseEndDate: string | null;
  user: { id: number; name: string; email: string; phone: string };
  unit: Unit & { property: Property };
  payments?: RentPayment[];
}

export interface RentPayment {
  id: number;
  tenantId: number;
  unitId: number;
  amount: number;
  mpesaRef: string | null;
  month: number;
  year: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  receiptUrl: string | null;
  createdAt: string;
  tenant?: { user: { name: string; email: string } };
  unit?: Unit & { property: Property };
}

export interface MaintenanceRequest {
  id: number;
  tenantId: number;
  unitId: number;
  description: string;
  photoUrl: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  caretakerId: number | null;
  caretaker?: { id: number; name: string; email: string } | null;
  createdAt: string;
  resolvedAt: string | null;
  tenant?: { user: { name: string; phone: string } };
  unit?: Unit & { property: Property };
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
