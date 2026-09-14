import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

interface NavItem {
  label: string;
  to: string;
  
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  LANDLORD: [
    { label: 'Dashboard', to: '/landlord'},
    { label: 'Properties', to: '/landlord/properties' },
    { label: 'Tenants', to: '/landlord/tenants' },
    { label: 'Payments', to: '/landlord/payments'},
    { label: 'Maintenance', to: '/landlord/maintenance'},
    { label: 'Reports', to: '/landlord/reports'},
    { label: 'Help Desk', to: '/help' },
  ],
  TENANT: [
    { label: 'Dashboard', to: '/tenant'},
    { label: 'Payments', to: '/tenant/payments'},
    { label: 'Maintenance', to: '/tenant/maintenance'},
    { label: 'Help Desk', to: '/help' },
  ],
  CARETAKER: [
    { label: 'Dashboard', to: '/caretaker'},
    { label: 'Maintenance', to: '/caretaker/maintenance'},
    { label: 'Help Desk', to: '/help' },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return <>{children}</>;

  const navItems = NAV_ITEMS[user.role] || [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 top-0 left-0 h-screen lg:h-auto w-64 bg-brand-800 text-white transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col overflow-hidden`}
      >
        <div className="px-5 py-5 border-b border-brand-700 flex items-center gap-2">
          <span className="text-2xl">🏡</span>
          <div>
            <p className="font-bold text-lg leading-tight">RentEase</p>
            <p className="text-xs text-brand-200 leading-tight">Kenya</p>
          </div>
        </div>

        <nav className="flex-1px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length <= 2}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-700 text-white' : 'text-brand-100 hover:bg-brand-700/60'
                }`
              }
            >
              
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-brand-700">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-brand-200 truncate">{user.role}</p>
        </div>
        <NavLink
          to="/change-password"
          onClick={() => setSidebarOpen(false)}
          className="block px-3 py-2 rounded-lg text-sm font-medium text-brand-100 hover:bg-brand-700/60 transition-colors"
        >
          Change Password
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-brand-100 hover:bg-brand-700/60 transition-colors"
        >
          Logout
        </button>
      </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button className="lg:hidden text-2xl" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <div className="hidden lg:block" />
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
