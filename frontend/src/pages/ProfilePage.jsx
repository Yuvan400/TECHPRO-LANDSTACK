import React from 'react';
import { User, ShieldCheck, Mail, Phone, Building, Key, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-black text-slate-900">User Profile & Account</h1>
        <p className="text-xs text-slate-500 mt-0.5">Authenticated credentials and role governance metadata.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-700/30">
            {user.fullName ? user.fullName[0] : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Role: {user.role.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block">Full Legal Name</span>
            <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block">Email Address</span>
            <p className="text-sm font-bold text-slate-900 font-mono">{user.email}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block">Designation</span>
            <p className="text-sm font-bold text-slate-900">{user.designation || 'Citizen'}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-slate-400 font-semibold block">Assigned Department</span>
            <p className="text-sm font-bold text-slate-900">{user.departmentName || 'Public Citizen Access'}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={logout}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-red-600/20"
          >
            <LogOut className="w-4 h-4" /> Sign Out of Session
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
