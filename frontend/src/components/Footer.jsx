import React from 'react';
import { useLocation } from 'react-router-dom';
import { Layers, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Footer = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Hide footer completely on login and auth pages to eliminate vertical scroll
  if (
    ['/login', '/staff/login', '/register'].includes(location.pathname) ||
    (location.pathname === '/' && !isAuthenticated)
  ) {
    return null;
  }

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold font-mono tracking-tight">
              Land<span className="text-blue-400">Stack</span>
            </span>
            <span className="text-slate-500 text-xs">• Smart Land Governance Platform</span>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500 space-y-0.5">
            <p>One Parcel. One Identifier. One Unified View.</p>
            <p className="flex items-center justify-center md:justify-end gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Integrated Cadastral Architecture aligned with Digital Public Infrastructure (DPI) Standards
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
