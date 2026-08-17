import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';

import LandlordDashboard from './pages/landlord/Dashboard';
import LandlordProperties from './pages/landlord/Properties';
import LandlordTenants from './pages/landlord/Tenants';
import LandlordPayments from './pages/landlord/Payments';
import LandlordMaintenance from './pages/landlord/Maintenance';
import LandlordReports from './pages/landlord/Reports';

import TenantDashboard from './pages/tenant/Dashboard';
import TenantPayments from './pages/tenant/Payments';
import TenantMaintenance from './pages/tenant/Maintenance';

import CaretakerDashboard from './pages/caretaker/Dashboard';
import CaretakerMaintenance from './pages/caretaker/Maintenance';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Landlord */}
      <Route path="/landlord" element={<ProtectedRoute allowedRoles={['LANDLORD']}><Layout><LandlordDashboard /></Layout></ProtectedRoute>} />
      <Route path="/landlord/properties" element={<ProtectedRoute allowedRoles={['LANDLORD']}><Layout><LandlordProperties /></Layout></ProtectedRoute>} />
      <Route path="/landlord/tenants" element={<ProtectedRoute allowedRoles={['LANDLORD']}><Layout><LandlordTenants /></Layout></ProtectedRoute>} />
      <Route path="/landlord/payments" element={<ProtectedRoute allowedRoles={['LANDLORD']}><Layout><LandlordPayments /></Layout></ProtectedRoute>} />
      <Route path="/landlord/maintenance" element={<ProtectedRoute allowedRoles={['LANDLORD']}><Layout><LandlordMaintenance /></Layout></ProtectedRoute>} />
      <Route path="/landlord/reports" element={<ProtectedRoute allowedRoles={['LANDLORD']}><Layout><LandlordReports /></Layout></ProtectedRoute>} />

      {/* Tenant */}
      <Route path="/tenant" element={<ProtectedRoute allowedRoles={['TENANT']}><Layout><TenantDashboard /></Layout></ProtectedRoute>} />
      <Route path="/tenant/payments" element={<ProtectedRoute allowedRoles={['TENANT']}><Layout><TenantPayments /></Layout></ProtectedRoute>} />
      <Route path="/tenant/maintenance" element={<ProtectedRoute allowedRoles={['TENANT']}><Layout><TenantMaintenance /></Layout></ProtectedRoute>} />

      {/* Caretaker */}
      <Route path="/caretaker" element={<ProtectedRoute allowedRoles={['CARETAKER']}><Layout><CaretakerDashboard /></Layout></ProtectedRoute>} />
      <Route path="/caretaker/maintenance" element={<ProtectedRoute allowedRoles={['CARETAKER']}><Layout><CaretakerMaintenance /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
