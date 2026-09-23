import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layers, User, Lock, ArrowRight, AlertCircle, Shield,
  CheckCircle2, MapPin, Sparkles, Globe, Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export const Login = ({ initialMode = 'citizen' }) => {
  const { loginCitizen, loginStaff, user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode state: 'citizen' or 'staff'
  const [mode, setMode] = useState(() => {
    if (location.pathname.includes('staff')) return 'staff';
    return initialMode;
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync mode with pathname if navigated
  useEffect(() => {
    if (location.pathname.includes('staff')) {
      setMode('staff');
    } else if (location.pathname === '/login') {
      setMode('citizen');
    }
  }, [location.pathname]);

  // If already authenticated, redirect to respective dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (user.role === 'DEPARTMENT_SUPERVISOR') navigate('/supervisor', { replace: true });
      else if (user.role === 'FIELD_OFFICER') navigate('/field', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSwitchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setError('');
    setEmail('');
    setPassword('');
    if (newMode === 'staff') {
      window.history.replaceState(null, '', '/staff/login');
    } else {
      window.history.replaceState(null, '', '/login');
    }
  };

  const handleQuickFill = (fillEmail, fillPass = 'Demo@123') => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError(
        mode === 'citizen'
          ? 'Please enter both email and password.'
          : 'Please enter your official email and security credentials.'
      );
      return;
    }

    setLoading(true);
    try {
      let authUser;
      if (mode === 'citizen') {
        authUser = await loginCitizen(email.trim(), password);
      } else {
        authUser = await loginStaff(email.trim(), password);
      }

      const from = location.state?.from?.pathname;
      if (from && from !== '/' && !from.includes('/login') && !from.includes('/staff')) {
        navigate(from, { replace: true });
      } else {
        if (authUser.role === 'FIELD_OFFICER') {
          navigate('/field-officer/dashboard', { replace: true });
        } else if (authUser.role === 'DEPARTMENT_SUPERVISOR') {
          navigate('/supervisor/dashboard', { replace: true });
        } else if (authUser.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (mode === 'citizen'
            ? 'Authentication failed. Please verify your credentials.'
            : 'Official authentication failed. Access restricted to authorized personnel.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-slate-50 flex flex-col justify-between select-none">
      {/* Top Bar: Brand Headline + Top-Right Indian Language Selector */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-900 flex items-center justify-center text-white shadow-md shadow-blue-700/20">
              <Layers className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight font-mono leading-none">
                Land<span className="text-blue-700">Stack</span>
              </span>
              <p className="text-[10px] font-semibold text-slate-500 hidden sm:block">
                {t('brand_tagline') || 'Integrated GIS-Based Smart Land Governance Platform'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Link to 2nd Page: India Map */}
            <Link
              to="/india-map"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
            >
              <Compass className="w-3.5 h-3.5 text-blue-700" />
              <span className="hidden sm:inline">Explore India Map</span>
            </Link>

            {/* Top-Right Language Selector (22 Indian Languages + English) */}
            <LanguageSelector align="right" />
          </div>

        </div>
      </div>

      {/* Main Centered Login Section (1st Page) */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        
        {/* Brand Header */}
        <div className="text-center mb-5 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>National Smart Land Governance Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono leading-none">
            One Parcel. One Identifier. One Unified View.
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Seamless Bhu-Aadhaar digital peg connecting 28 States and 8 Union Territories
          </p>
        </div>

        {/* Unified Login Card with Two-Slider Switcher */}
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden shrink-0">
          
          {/* Dual Slider Switcher */}
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <div className="relative bg-slate-200/80 p-1 rounded-2xl flex items-center border border-slate-200 shadow-inner">
              {/* Smooth Animated Sliding Indicator */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-sm transition-all duration-300 ease-out border border-slate-200/80 ${
                  mode === 'citizen' ? 'left-1' : 'left-[calc(50%+3px)]'
                }`}
              />

              {/* Citizen Option */}
              <button
                type="button"
                onClick={() => handleSwitchMode('citizen')}
                className={`relative z-10 w-1/2 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer ${
                  mode === 'citizen' ? 'text-blue-700 font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{t('tab_citizen') || 'Citizen Portal'}</span>
              </button>

              {/* Staff Option */}
              <button
                type="button"
                onClick={() => handleSwitchMode('staff')}
                className={`relative z-10 w-1/2 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer ${
                  mode === 'staff' ? 'text-indigo-700 font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t('tab_staff') || 'Government Staff'}</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            
            {/* Form Context Header */}
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">
                {mode === 'citizen' 
                  ? (t('title_citizen') || 'Sign In to Your Account')
                  : (t('title_staff') || 'Sign In to Government Desk')}
              </h2>
              <p className="text-[11px] text-slate-500 leading-snug">
                {mode === 'citizen'
                  ? (t('desc_citizen') || 'Access your cadastral records, verified digital Patta, and track services.')
                  : (t('desc_staff') || 'For Department Supervisors, Cadastral Field Officers, and Administrators.')}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-[11px] text-red-700 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {mode === 'citizen' 
                    ? (t('label_email_citizen') || 'Citizen Email Address')
                    : (t('label_email_staff') || 'Official Department Email')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400"
                  placeholder={mode === 'citizen' ? 'citizen@landstack.demo' : 'official@landstack.demo'}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {mode === 'citizen' 
                    ? (t('label_password') || 'Password')
                    : (t('label_password_staff') || 'Security Password')}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-slate-400"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              {mode === 'citizen' ? (
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>{t('remember_device') || 'Remember device'}</span>
                  </label>
                  <Link to="/register" className="font-semibold text-blue-700 hover:underline">
                    {t('new_registration') || 'New registration'}
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    {t('rbac_enforced') || 'RBAC Enforced'}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">
                    {t('gov_standards') || 'Gov DPI Standards'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer ${
                  mode === 'citizen'
                    ? 'bg-blue-700 hover:bg-blue-800 shadow-blue-700/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>
                      {mode === 'citizen' 
                        ? (t('btn_citizen') || 'Sign In to Citizen Portal')
                        : (t('btn_staff') || 'Authenticate Official Session')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Autofill */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                {t('quick_autofill') || 'Quick Autofill (Password: Demo@123)'}
              </p>
              {mode === 'citizen' ? (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('citizen@landstack.demo')}
                    className="px-3 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs rounded-lg font-mono border border-slate-200 transition cursor-pointer"
                  >
                    citizen@landstack.demo
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('supervisor@landstack.demo')}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold rounded-lg border border-purple-200 transition cursor-pointer"
                    >
                      🛡️ Supervisor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('admin@landstack.demo')}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-bold rounded-lg border border-rose-200 transition cursor-pointer"
                    >
                      🔑 Admin
                    </button>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-1.5">
                      Select Department Officer to Test:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleQuickFill('officer.survey@landstack.demo')}
                        className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold rounded-md border border-teal-200 text-left transition cursor-pointer"
                        title="Cadastral DGPS, Pegging & ULPIN Search"
                      >
                        🧭 Land & Survey
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('officer.registration@landstack.demo')}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-md border border-blue-200 text-left transition cursor-pointer"
                        title="Deed & 30-Yr Encumbrance Desk Audit"
                      >
                        📜 Registration
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('officer.revenue@landstack.demo')}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-md border border-amber-200 text-left transition cursor-pointer"
                        title="Patta & Jamabandi Possession"
                      >
                        🌾 Revenue Dept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('officer.planning@landstack.demo')}
                        className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold rounded-md border border-purple-200 text-left transition cursor-pointer"
                        title="Master Plan Zoning & Road Width"
                      >
                        🏙️ Town Planning
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('officer.highways@landstack.demo')}
                        className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-900 font-bold rounded-md border border-orange-200 text-left transition cursor-pointer"
                        title="Right-of-Way & Highway Setback"
                      >
                        🛣️ Highways/PWD
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('officer.forest@landstack.demo')}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-md border border-emerald-200 text-left transition cursor-pointer"
                        title="Eco-Sensitive 1km Buffer"
                      >
                        🌲 Forest / ESZ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('officer.electricity@landstack.demo')}
                        className="p-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-900 font-bold rounded-md border border-yellow-200 text-left transition cursor-pointer"
                        title="High-Tension Corridor Clearance"
                      >
                        ⚡ Electricity
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('officer.localbody@landstack.demo')}
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold rounded-md border border-indigo-200 text-left transition cursor-pointer"
                        title="Municipal Khata & Tax"
                      >
                        🏢 Local Body
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill('officer.environment@landstack.demo')}
                        className="p-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 font-bold rounded-md border border-cyan-200 text-left transition cursor-pointer"
                        title="CRZ & Wetland Buffer"
                      >
                        🌊 Environment
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Banner linking to 2nd page */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Step 2: Interactive State Cadastre Map
            </span>
            <Link
              to="/india-map"
              className="font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="py-3 px-4 text-center border-t border-slate-200 bg-white text-[11px] text-slate-400 font-mono">
        LandStack Smart Land Governance Platform • SIH 2026 • 28 States & 8 Union Territories
      </footer>
    </div>
  );
};

export default Login;
