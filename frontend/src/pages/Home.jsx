import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers, Map, ShieldCheck, CheckCircle2, ArrowRight,
  Database, GitMerge, FileText, Search, Cpu, Globe2,
  Users, Building, Compass, Sparkles, Activity
} from 'lucide-react';

export const Home = ({ onOpenDemoGuide }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white pt-20 pb-28">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Smart India Hackathon 2026 Prototype
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            AI-Driven Integrated GIS-Based <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">
              Land Stack for Smart Governance
            </span>
          </h1>

          {/* Tagline */}
          <p className="mt-6 text-xl sm:text-2xl font-light text-slate-300 tracking-wide">
            One Parcel. One Identifier. One Unified View.
          </p>

          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminating fragmented silos across Land Records, Registration, Cadastral GIS, Tax, and Urban Planning using canonical <strong>ULPIN (Unique Land Parcel Identification Number)</strong>.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/map"
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition active:scale-95"
            >
              <Map className="w-4 h-4" />
              Explore Cadastral GIS Map
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm flex items-center gap-2 transition active:scale-95"
            >
              <Users className="w-4 h-4 text-blue-300" />
              Citizen Portal
            </Link>

            <Link
              to="/staff/login"
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center gap-2 transition active:scale-95"
            >
              <Building className="w-4 h-4 text-indigo-300" />
              Staff & Officer Portal
            </Link>

            {onOpenDemoGuide && (
              <button
                onClick={onOpenDemoGuide}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-md transition active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                SIH 2026 Live Demo Flow
              </button>
            )}
          </div>

          {/* Quick ULPIN Search Bar on Hero */}
          <div className="mt-12 max-w-xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = e.target.elements.ulpinQuery.value;
                if (q) window.location.href = `/map?search=${encodeURIComponent(q)}`;
              }}
              className="flex items-center p-2 bg-slate-900/90 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-md"
            >
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                name="ulpinQuery"
                defaultValue="33TNCHN0000123456"
                placeholder="Search ULPIN or Survey No (e.g. 33TNCHN0000123456)..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shrink-0 transition"
              >
                Inspect Parcel
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-600">The Core Bottleneck</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              India's Land Information is Severely Fragmented
            </p>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Citizens and authorities face costly bureaucratic friction because each department operates in its own isolated silo without a canonical spatial anchor.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Multiple Isolated Registries</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Revenue Patta, Registration Deeds, ULB Property Tax, and Master Plan Zoning maintain disparate records with no cross-verification.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Redundant Physical Verification</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Every service application requires repeating on-site field inspections, causing multi-week delays and administrative backlogs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Lack of Spatial Cadastre</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Paper surveys and text-only records lead to boundary overlaps, duplicate claims, encumbrance concealment, and endless litigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The LandStack Solution Section */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600">The LandStack Solution</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              One Unified Parcel-Centric Architecture
            </p>
            <p className="mt-3 text-sm text-slate-600">
              ULPIN serves as the universal digital peg, bringing together records, maps, and citizen services.
            </p>
          </div>

          <div className="mt-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center text-center">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <Database className="w-6 h-6 text-blue-700 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-900">Land Records</h4>
                <p className="text-[11px] text-slate-500 mt-1">Patta / Chitta / RoR</p>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <FileText className="w-6 h-6 text-indigo-700 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-900">Registration</h4>
                <p className="text-[11px] text-slate-500 mt-1">SRO Deeds & EC</p>
              </div>

              <div className="p-6 bg-gradient-to-tr from-blue-900 to-indigo-900 text-white rounded-3xl shadow-lg md:scale-105 border-2 border-blue-400">
                <Layers className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <h4 className="text-sm font-extrabold tracking-wide font-mono">ULPIN</h4>
                <p className="text-[10px] text-blue-200 mt-1">Universal Cadastral Anchor</p>
              </div>

              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                <Map className="w-6 h-6 text-teal-700 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-900">Cadastral GIS</h4>
                <p className="text-[11px] text-slate-500 mt-1">FMB GeoJSON Polygons</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-900">Unified Services</h4>
                <p className="text-[11px] text-slate-500 mt-1">10+ Statutory Services</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Flow */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">Workflow Cycle</h2>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              Identify → Integrate → Verify → Process → Govern
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-mono font-bold text-blue-600 mb-2">PHASE 01</div>
              <h3 className="font-bold text-slate-900 text-sm">Citizen Discovery</h3>
              <p className="text-xs text-slate-600 mt-1">
                Citizen searches parcel via ULPIN or cadastral map, reviewing 360° ownership and AI risk rating.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-mono font-bold text-indigo-600 mb-2">PHASE 02</div>
              <h3 className="font-bold text-slate-900 text-sm">Department Routing</h3>
              <p className="text-xs text-slate-600 mt-1">
                Service request automatically routes to relevant Department Supervisor with pre-verified land registry data.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-mono font-bold text-teal-600 mb-2">PHASE 03</div>
              <h3 className="font-bold text-slate-900 text-sm">Field DGPS Verification</h3>
              <p className="text-xs text-slate-600 mt-1">
                Field Officer physically visits the parcel, checks GPS coordinates, uploads geotagged photo, and records findings.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-mono font-bold text-emerald-600 mb-2">PHASE 04</div>
              <h3 className="font-bold text-slate-900 text-sm">Sanction & Tamper-Proof Log</h3>
              <p className="text-xs text-slate-600 mt-1">
                Supervisor approves application, statutory digital certificate is generated, and audit log records every transition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Realistic Prototype Impact Statistics */}
      <section className="py-14 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-300 font-mono">100%</p>
              <p className="text-xs text-slate-300 mt-1 font-medium">ULPIN Unified Coverage</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-300 font-mono">72%</p>
              <p className="text-xs text-slate-300 mt-1 font-medium">Reduction in Processing Time</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-300 font-mono">0%</p>
              <p className="text-xs text-slate-300 mt-1 font-medium">Redundant Document Submissions</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-purple-300 font-mono">IndexedDB</p>
              <p className="text-xs text-slate-300 mt-1 font-medium">Offline Remote Rural Ready</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
