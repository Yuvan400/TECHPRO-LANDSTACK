import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, Building, Clock, ShieldCheck, Search } from 'lucide-react';
import api from '../services/api';

export const ServicesCatalog = () => {
  const [services, setServices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/services');
      setServices(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [selectedDept, setSelectedDept] = useState('All');

  const DEPARTMENTS = [
    'All',
    'Revenue',
    'Survey & Land Records',
    'Registration',
    'Town & Country Planning',
    'Local Body',
    'Building & Planning',
    'Highways',
    'Forest',
    'Electricity',
    'Water & Sewerage'
  ];

  useEffect(() => {
    let result = services;

    if (selectedDept !== 'All') {
      result = result.filter(s => s.departmentName?.toLowerCase().includes(selectedDept.toLowerCase()));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.serviceName.toLowerCase().includes(q) ||
        s.departmentName?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [search, selectedDept, services]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Government Services Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrated digital public infrastructure catalog for land, revenue, cadastral surveys, and municipal permissions.
          </p>
        </div>

        <div className="w-full sm:w-72 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search statutory services..."
            className="w-full text-xs bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* 10 Departments Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedDept === dept
                ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading statutory services catalog...
          </div>
        ) : (
          filtered.map((svc) => (
            <div
              key={svc.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {svc.serviceCode}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    SLA: {svc.processingDays} Days
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition">
                  {svc.serviceName}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {svc.description}
                </p>

                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 font-medium block mb-1">Prerequisite Documents:</span>
                  <p className="text-xs text-slate-700 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono text-[11px]">
                    {svc.requiredDocuments || 'Valid Identity Proof & Property Patta'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Fee (INR)</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {svc.feeInr > 0 ? `₹${svc.feeInr}` : 'Free / Nil'}
                  </span>
                </div>

                <Link
                  to={`/services/apply?serviceId=${svc.id}`}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-700/20 active:scale-95"
                >
                  Apply Online <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default ServicesCatalog;
