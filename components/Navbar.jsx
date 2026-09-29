'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="font-bold text-lg text-gray-900">
          Shyne Detailing
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm hover:text-brand-600">Services</Link>
          {user && user.role === 'customer' && (
            <Link href="/dashboard" className="text-sm hover:text-brand-600">My Bookings</Link>
          )}
          {user && user.role === 'trader' && (
            <Link href="/trader/dashboard" className="text-sm hover:text-brand-600">Trader Dashboard</Link>
          )}
          {user ? (
            <>
              <span className="text-sm text-gray-500">Hi, {user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className="text-sm px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm hover:text-brand-600">Log in</Link>
              <Link href="/signup" className="text-sm px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t bg-white px-4 py-3 flex flex-col gap-3">
          <Link href="/" onClick={() => setOpen(false)} className="text-sm">Services</Link>
          {user && user.role === 'customer' && (
            <Link href="/dashboard" onClick={() => setOpen(false)} className="text-sm">My Bookings</Link>
          )}
          {user && user.role === 'trader' && (
            <Link href="/trader/dashboard" onClick={() => setOpen(false)} className="text-sm">Trader Dashboard</Link>
          )}
          {user ? (
            <button onClick={() => { setOpen(false); handleLogout(); }} className="text-sm text-left">
              Log out ({user.name.split(' ')[0]})
            </button>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="text-sm">Log in</Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="text-sm">Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
