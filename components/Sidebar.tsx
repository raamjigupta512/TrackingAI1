
import React from 'react';
import { BusinessRole } from '../types';
import { useLanguage } from '../src/context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface SidebarProps {
  activeView: string;
  setView: (view: any) => void;
  onLogout: () => void;
  userName: string;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  role?: BusinessRole;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, onLogout, userName, isDarkMode, toggleDarkMode, role }) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t('overview', 'Overview'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    )},
    { id: 'shipments', label: t('bookings', 'Bookings'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    )},
    { id: 'assistant', label: t('maersk_ai', 'Maersk AI'), icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
    )},
  ];

  if (role === 'Agent') {
    navItems.push({
      id: 'rules', label: t('rule_engine', 'Rule Engine'), icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      )
    });
  }

  return (
    <aside className="w-64 bg-[#00243D] dark:bg-black text-white flex flex-col hidden md:flex border-r border-white/5">
      <div className="p-8 border-b border-white/10 bg-[#73C7E6]/5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <div className="bg-[#73C7E6] text-[#00243D] font-black px-2.5 py-1 text-xl rounded flex items-center gap-1.5 leading-none tracking-tight">
              <span className="text-sm">★</span>MAERSK
            </div>
          </div>
          <span className="text-[10px] font-black tracking-[0.2em] text-[#73C7E6]/60 uppercase">{t('global_hub', 'Global Hub')}</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
              activeView === item.id || (activeView === 'tracking' && item.id === 'shipments')
                ? 'bg-[#73C7E6] text-[#00243D] shadow-lg shadow-sky-500/20 font-black'
                : 'text-white/50 hover:text-[#73C7E6] hover:bg-white/5'
            }`}
          >
            {item.icon}
            <span className="text-sm uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Language Switcher Dropdown */}
        <LanguageSwitcher />

        <button 
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white/70 hover:text-white"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? '🌞' : '🌙'}
            <span className="text-xs font-bold uppercase tracking-wider">{isDarkMode ? t('light', 'Light') : t('dark', 'Dark')}</span>
          </div>
          <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-[#73C7E6]' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all transform ${isDarkMode ? 'translate-x-4.5 left-0' : 'translate-x-0.5 left-0'}`}></div>
          </div>
        </button>

        <div className="flex items-center gap-3 px-4 py-4 border-t border-white/5 pt-4">
          <div className="w-10 h-10 rounded-xl bg-[#73C7E6] overflow-hidden ring-2 ring-[#73C7E6]/20">
            <img src={`https://picsum.photos/seed/${userName}/40/40`} alt="avatar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black truncate uppercase tracking-tight">{userName}</p>
            <p className="text-[10px] text-[#73C7E6] font-black uppercase tracking-tighter italic">
              {role === 'Agent' ? t('agent', 'Agent') : t('customer', 'Customer')}
            </p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-white/40 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          {t('logout', 'Log Out')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
