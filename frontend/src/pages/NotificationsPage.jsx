import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, AlertTriangle, Shield, Check } from 'lucide-react';
import api from '../services/api';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
    } catch (err) {
      console.error(err);
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Notifications & Alerts</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time statutory updates regarding your submissions and inspections.</p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No notifications at present.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition ${
                !n.isRead ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                  {!n.isRead && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                      New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{n.message}</p>
                <p className="text-[11px] font-mono text-slate-400">
                  {new Date(n.createdAt).toLocaleString('en-IN')} {n.referenceId ? `• Ref: ${n.referenceId}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white transition"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(n.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition"
                  title="Dismiss notification"
                >
                  <span className="text-sm font-bold">✕</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default NotificationsPage;
