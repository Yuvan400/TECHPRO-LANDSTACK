import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Layers, Bell, LogOut, User, Shield, CheckCircle2,
  Wifi, WifiOff, RefreshCw, ChevronDown, X, Check, ExternalLink, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import api from '../services/api';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isOnline, isSyncing, queuedCount, syncOfflineQueue } = useOnlineStatus();
  const { currentLang, currentLangObj, changeLanguage, t, languages } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, location.pathname]);

  const loadNotifications = async () => {
    try {
      const countRes = await api.get('/api/notifications/unread-count');
      setUnreadCount(countRes.data?.unreadCount || 0);
      const listRes = await api.get('/api/notifications');
      setNotifications(listRes.data || []);
    } catch {
      // Handled silently
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismissNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
    } catch {
      // Ignored
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => {
      const target = notifications.find(n => n.id === id);
      return target && !target.isRead ? Math.max(0, prev - 1) : prev;
    });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">{t('role_admin')}</span>;
      case 'DEPARTMENT_SUPERVISOR':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">{t('role_supervisor')}</span>;
      case 'FIELD_OFFICER':
        return <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">{t('role_field_officer')}</span>;
      case 'CITIZEN':
      default:
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">{t('role_citizen')}</span>;
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'DEPARTMENT_SUPERVISOR') return '/supervisor';
    if (user.role === 'FIELD_OFFICER') return '/field-officer/dashboard';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top National Tricolor Header Strip */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand Logo & Platform Title (No middle navigation here - all navigation is in the sidebar) */}
          <div className="flex items-center gap-3">
            <Link to={isAuthenticated ? getDashboardPath() : '/login'} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-900/20 group-hover:scale-105 transition">
                <Layers className="w-5 h-5 text-blue-200" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 font-mono">
                  Land<span className="text-blue-700">Stack</span>
                </span>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                  {t('brand_tagline')}
                </p>
              </div>
            </Link>
          </div>

          {/* Right Section: Network Status, Notification Bell Drawer, User Profile Menu */}
          <div className="flex items-center gap-3">

            {/* Connectivity Status Pill */}
            <div className="flex items-center">
              {isSyncing ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  {t('syncing')} ({queuedCount})
                </span>
              ) : isOnline ? (
                <button
                  onClick={syncOfflineQueue}
                  title="Network online. Click to sync any pending queue."
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="hidden sm:inline">{t('online')}</span>
                  {queuedCount > 0 && <span className="font-bold">({queuedCount} queued)</span>}
                </button>
              ) : (
                <span
                  title="Operating in offline mode. Changes saved locally to IndexedDB."
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                >
                  <WifiOff className="w-3 h-3 text-amber-600" />
                  <span className="hidden sm:inline">{t('offline')}</span>
                  {queuedCount > 0 && <span className="font-bold">({queuedCount} queued)</span>}
                </span>
              )}
            </div>

            {/* Indian Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLangMenu(!showLangMenu);
                  setShowNotifications(false);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                title="Change Language (Indian Languages)"
              >
                <Globe className="w-4 h-4 text-blue-700" />
                <span className="hidden sm:inline font-medium">{currentLangObj?.native || 'English'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>{t('select_language')}</span>
                    <span className="text-blue-600 font-normal">9 Languages</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition hover:bg-slate-50 ${
                          currentLang === lang.code ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <div>
                            <p className="font-semibold leading-tight">{lang.native}</p>
                            <p className="text-[10px] text-slate-400">{lang.name}</p>
                          </div>
                        </div>
                        {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-blue-700" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Bell Dropdown */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                    setShowLangMenu(false);
                  }}
                  className={`p-2 rounded-xl text-slate-600 hover:bg-slate-100 relative transition ${showNotifications ? 'bg-slate-100 text-blue-700' : ''}`}
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-700" />
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {t('notifications')} ({notifications.length})
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          {t('mark_all_read')}
                        </button>
                      )}
                    </div>

                    {/* Notification Messages List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                          {t('no_notifications')}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => !n.isRead && handleMarkOneRead(n.id)}
                            className={`p-3 text-xs transition relative group cursor-pointer ${
                              !n.isRead ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 pr-6">
                              <h4 className={`font-semibold text-xs leading-snug ${!n.isRead ? 'text-blue-900 font-bold' : 'text-slate-800'}`}>
                                {n.title}
                              </h4>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">{n.message}</p>
                            {n.createdAt && (
                              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                              </p>
                            )}

                            {/* Dismiss button */}
                            <button
                              onClick={(e) => handleDismissNotification(n.id, e)}
                              title="Dismiss this notification"
                              className="absolute top-2.5 right-2 text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition opacity-60 group-hover:opacity-100"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Bottom Action: See All Notifications */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/notifications');
                        }}
                        className="w-full py-2 px-3 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-slate-200 hover:border-blue-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        See All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Menu Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  className={`flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition ${showUserMenu ? 'bg-slate-100' : ''}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {user.fullName ? user.fullName[0] : 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{user.fullName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                      {user.departmentName && (
                        <p className="text-[10px] text-blue-700 font-medium mt-0.5">{user.departmentName}</p>
                      )}
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      {t('profile')}
                    </Link>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        navigate('/login');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 border-t border-slate-100 mt-1 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : null}

          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
