import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSelector = ({ variant = 'light', align = 'right' }) => {
  const { currentLang, currentLangObj, changeLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer ${
          variant === 'light'
            ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
            : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
        }`}
        title="Select Language / भाषा चुनें (22 Indian Languages + English)"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-4 h-4 text-blue-700 shrink-0" />
        <span className="text-sm shrink-0">{currentLangObj?.flag || '🇮🇳'}</span>
        <span className="font-bold tracking-tight text-slate-800">
          {currentLangObj?.native || 'English'}
        </span>
        <span className="hidden md:inline text-[11px] text-slate-400 font-normal">
          ({currentLangObj?.name || 'English'})
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95`}
        >
          {/* Header */}
          <div className="px-3.5 pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
                Select Indian Language
              </p>
              <p className="text-[10px] text-slate-500">
                22 Eighth Schedule Languages + English
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {languages.length}
            </span>
          </div>

          {/* Quick Search */}
          <div className="px-2.5 pt-2 pb-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language (e.g. Hindi, தமிழ்)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 placeholder:text-slate-400"
                autoFocus
              />
            </div>
          </div>

          {/* Language List */}
          <div className="max-h-64 overflow-y-auto px-1 divide-y divide-slate-50">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      changeLanguage(lang.code);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-xl transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{lang.flag}</span>
                      <div>
                        <p className="font-bold leading-tight text-slate-900">
                          {lang.native}
                        </p>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {lang.name}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-700 stroke-[2.5]" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No language matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
