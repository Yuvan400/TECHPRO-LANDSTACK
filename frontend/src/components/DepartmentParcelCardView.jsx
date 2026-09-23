import React, { useState } from 'react';
import {
  FileText, MapPin, Building2, Trees, Zap, Shield,
  Compass, Wrench, Landmark, Leaf, CheckCircle2, AlertCircle,
  Download, Printer, Share2, Eye, ChevronRight, X, ExternalLink,
  Layers, Map as MapIcon, ArrowUpRight, ArrowLeft, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getDepartmentDataForParcel } from '../utils/departmentDataGenerator';

export const DepartmentParcelCardView = ({ parcel, onClose, onOpenMap }) => {
  const { t, tParam } = useLanguage();
  // State for which department popup card is currently open (null = none, or 'revenue', 'survey', etc.)
  const [activeDeptModal, setActiveDeptModal] = useState(null);

  if (!parcel) return null;

  const data = getDepartmentDataForParcel(parcel);
  if (!data) return null;

  const departmentsList = [
    {
      id: 'revenue',
      number: '1',
      title: t('dept_1_title'),
      subtitle: t('dept_1_sub'),
      icon: Landmark,
      iconBg: 'bg-blue-600 text-white',
      cardBorder: 'hover:border-blue-500',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      dataKey: data.revenue
    },
    {
      id: 'survey',
      number: '2',
      title: t('dept_2_title'),
      subtitle: t('dept_2_sub'),
      icon: MapIcon,
      iconBg: 'bg-indigo-600 text-white',
      cardBorder: 'hover:border-indigo-500',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dataKey: data.survey
    },
    {
      id: 'registration',
      number: '3',
      title: t('dept_3_title'),
      subtitle: t('dept_3_sub'),
      icon: FileText,
      iconBg: 'bg-emerald-600 text-white',
      cardBorder: 'hover:border-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dataKey: data.registration
    },
    {
      id: 'localBodies',
      number: '4',
      title: t('dept_4_title'),
      subtitle: t('dept_4_sub'),
      icon: Building2,
      iconBg: 'bg-purple-600 text-white',
      cardBorder: 'hover:border-purple-500',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      dataKey: data.localBodies
    },
    {
      id: 'pwd',
      number: '5',
      title: t('dept_5_title'),
      subtitle: t('dept_5_sub'),
      icon: Wrench,
      iconBg: 'bg-amber-600 text-white',
      cardBorder: 'hover:border-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      dataKey: data.pwd
    },
    {
      id: 'municipal',
      number: '6',
      title: t('dept_6_title'),
      subtitle: t('dept_6_sub'),
      icon: Building2,
      iconBg: 'bg-teal-600 text-white',
      cardBorder: 'hover:border-teal-500',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
      dataKey: data.municipal
    },
    {
      id: 'agriForest',
      number: '7',
      title: t('dept_7_title'),
      subtitle: t('dept_7_sub'),
      icon: Trees,
      iconBg: 'bg-lime-700 text-white',
      cardBorder: 'hover:border-lime-500',
      badgeBg: 'bg-lime-50 text-lime-800 border-lime-200',
      dataKey: data.agriForest,
      isAgriForest: true
    },
    {
      id: 'electricity',
      number: '8',
      title: t('dept_8_title'),
      subtitle: t('dept_8_sub'),
      icon: Zap,
      iconBg: 'bg-amber-500 text-slate-950',
      cardBorder: 'hover:border-amber-400',
      badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      dataKey: data.electricity
    },
    {
      id: 'environment',
      number: '9',
      title: t('dept_9_title'),
      subtitle: t('dept_9_sub'),
      icon: Leaf,
      iconBg: 'bg-cyan-600 text-white',
      cardBorder: 'hover:border-cyan-500',
      badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      dataKey: data.environment
    },
    {
      id: 'planning',
      number: '10',
      title: t('dept_10_title'),
      subtitle: t('dept_10_sub'),
      icon: Compass,
      iconBg: 'bg-rose-600 text-white',
      cardBorder: 'hover:border-rose-500',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      dataKey: data.planning
    }
  ];

  const renderBadge = (badge, badgeColor) => {
    if (!badge) return null;
    let colors = 'bg-slate-100 text-slate-700 border-slate-200';
    if (badgeColor === 'green') colors = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (badgeColor === 'amber') colors = 'bg-amber-100 text-amber-800 border-amber-300';
    if (badgeColor === 'red') colors = 'bg-red-100 text-red-800 border-red-300';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${colors}`}>
        {badge}
      </span>
    );
  };

  const selectedDept = departmentsList.find(d => d.id === activeDeptModal);

  const navigateDept = (direction) => {
    const currentIndex = departmentsList.findIndex(d => d.id === activeDeptModal);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + direction + departmentsList.length) % departmentsList.length;
    setActiveDeptModal(departmentsList[nextIndex].id);
  };

  return (
    <div className="space-y-6">
      {/* Master Parcel Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-blue-600 text-white font-mono">
                {t('bhu_aadhaar_ulpin')}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {t('integrated_cadastre_subtitle')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-blue-300">
              {data.ulpin}
            </h1>
            <div className="text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">{t('owner_name')}</span>
                <span className="font-bold text-white truncate block">{data.ownerName}</span>
              </div>
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">{t('masked_aadhaar')}</span>
                <span className="font-bold text-white font-mono block">{data.ownerAadhaar}</span>
              </div>
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">{t('survey_subdiv')}</span>
                <span className="font-bold text-white font-mono block">{data.surveyNumber}/{data.subDivision}</span>
              </div>
              <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">{t('location')}</span>
                <span className="font-bold text-white truncate block">{data.village}, {data.district}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            {onOpenMap && (
              <button
                onClick={() => onOpenMap(parcel)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                <MapIcon className="w-4 h-4" />
                {t('inspect_map')}
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              {t('print_records')}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of 10 Department Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {t('statutory_records_title')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('statutory_records_desc')}
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {t('all_10_departments')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentsList.map((dept) => {
            const Icon = dept.icon;
            const paramCount = dept.isAgriForest
              ? (dept.dataKey.agriculture?.parameters?.length || 0) + (dept.dataKey.forest?.parameters?.length || 0)
              : (dept.dataKey?.parameters?.length || 0);

            return (
              <div
                key={dept.id}
                onClick={() => setActiveDeptModal(dept.id)}
                className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden ${dept.cardBorder}`}
              >
                {/* Accent Top Border Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${dept.iconBg} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {t('dept_prefix')} #{dept.number}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition leading-snug">
                    {dept.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                    {dept.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${dept.badgeBg}`}>
                    {paramCount} {t('parameters')}
                  </span>

                  <span className="text-xs font-bold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    {t('view_details')}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POPUP MODAL CARD FOR DEPARTMENT DETAILS (Triggered when any of the 10 cards is clicked) */}
      {activeDeptModal && selectedDept && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start pt-16 sm:pt-20 pb-8 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[82vh] flex flex-col my-0">

            {/* Modal Header with Close Cross Icon */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${selectedDept.iconBg}`}>
                  <selectedDept.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-300">
                      {t('dept_prefix')} #{selectedDept.number}
                    </span>
                    <h3 className="font-bold text-base text-white">
                      {selectedDept.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedDept.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDept(-1)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Previous Department"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigateDept(1)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Next Department"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveDeptModal(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition ml-1"
                  title="Close (✕)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Aligned Parameters Grid (NO KEY MENTION) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">

              {/* Parcel Context Bar inside Popup Card */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">{t('ulpin_label')}:</span>
                  <span className="font-mono font-bold text-blue-700">{data.ulpin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">{t('survey_label')}:</span>
                  <span className="font-mono font-bold text-slate-900">{data.surveyNumber}/{data.subDivision}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">{t('owner_label')}:</span>
                  <span className="font-semibold text-slate-900">{data.ownerName}</span>
                </div>
              </div>

              {/* Standard Department Parameters Grid */}
              {!selectedDept.isAgriForest && selectedDept.dataKey?.parameters && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedDept.dataKey.parameters.map((param, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 text-xs transition"
                      >
                        <span className="text-slate-500 font-medium pr-2">
                          {tParam(param.label)}
                        </span>
                        <div className="flex items-center gap-1.5 text-right font-semibold">
                          <span className={`break-all ${param.highlight ? 'font-mono font-bold text-blue-700' : 'text-slate-900'}`}>
                            {tParam(param.value)}
                          </span>
                          {renderBadge(tParam(param.badge), param.badgeColor)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agriculture & Forest Department (2 dedicated sub-cards) */}
              {selectedDept.isAgriForest && (
                <div className="space-y-4">
                  {/* Agriculture Sub-Section */}
                  <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 border-b border-emerald-100 pb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Leaf className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950">
                          {t('agriculture_section')}
                        </h4>
                        <p className="text-[11px] text-emerald-700">
                          {t('agriculture_section_sub')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {selectedDept.dataKey.agriculture.parameters.map((param, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/40 border border-emerald-100/60 text-xs"
                        >
                          <span className="text-slate-600 font-medium pr-2">
                            {tParam(param.label)}
                          </span>
                          <span className="font-semibold text-slate-900 text-right">
                            {tParam(param.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Forest Sub-Section */}
                  <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 border-b border-amber-100 pb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Trees className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950">
                          {t('forest_section')}
                        </h4>
                        <p className="text-[11px] text-amber-700">
                          {t('forest_section_sub')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {selectedDept.dataKey.forest.parameters.map((param, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-amber-50/40 border border-amber-100/60 text-xs"
                        >
                          <span className="text-slate-600 font-medium pr-2">
                            {tParam(param.label)}
                          </span>
                          <span className="font-semibold text-slate-900 text-right">
                            {tParam(param.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Slim Verification Footnote */}
            <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center text-[11px] text-slate-500 font-medium shrink-0">
              <span>{t('verified_footnote')}</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentParcelCardView;
