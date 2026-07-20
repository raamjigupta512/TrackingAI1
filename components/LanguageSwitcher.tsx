import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, LANGUAGES, Language } from '../src/context/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef} id="language-switcher">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white/70 hover:text-white border border-white/10"
        title="Switch Language"
        type="button"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-[#73C7E6]" />
          <span className="text-xs font-black uppercase tracking-wider">
            {currentLang.flag} {currentLang.label}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#00243D] dark:bg-slate-900 border border-white/10 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
          <div className="p-1 max-h-48 overflow-y-auto scrollbar-thin">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left ${
                    isSelected
                      ? 'bg-[#73C7E6] text-[#00243D] font-black'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <span className="font-bold">{lang.label}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
