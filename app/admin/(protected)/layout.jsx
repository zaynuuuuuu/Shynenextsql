'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import AdminRoute from '../../../components/AdminRoute';

function NavItem({ href, children }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-lg text-sm ${active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {children}
    </Link>
  );
}

function AdminLayoutInner({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r p-4 flex flex-col">
        <div className="font-bold mb-6 px-2">Shine Detailing</div>
        <nav className="flex flex-col gap-1 flex-1">
          <NavItem href="/admin/bookings">Bookings</NavItem>
          <NavItem href="/admin/new-booking">New Booking</NavItem>
          <NavItem href="/admin/services">Services</NavItem>
          <NavItem href="/admin/traders">Traders</NavItem>
          <NavItem href="/admin/trader-bookings">Trader Bookings</NavItem>
        </nav>
        <div className="border-t pt-3 mt-3">
          <p className="text-xs text-gray-400 px-2 mb-2">{user?.name}</p>
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

export default function ProtectedAdminLayout({ children }) {
  return (
    <AdminRoute>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminRoute>
  );
}
