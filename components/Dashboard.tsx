
import React, { useState } from 'react';
import { Shipment, ShipmentStatus, BusinessRole } from '../types';
import { DashboardVisualizer } from './DashboardVisualizer';
import { useLanguage } from '../src/context/LanguageContext';

interface DashboardProps {
  shipments: Shipment[];
  onTrack: (shipment: Shipment) => void;
  userRole: BusinessRole;
  onRoleChange: (role: BusinessRole) => void;
  onNavigateToRules?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ shipments, onTrack, userRole, onRoleChange, onNavigateToRules }) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ShipmentStatus | 'All' | 'Affected'>('All');

  const affectedCount = shipments.filter(s => s.isAffectedShipment).length;

  const stats = [
    { label: t('global_bookings', 'Global Bookings'), value: shipments.length.toString(), color: 'yellow', icon: '📦' },
    { label: t('air_sea_transit', 'Air & Sea Transit'), value: shipments.filter(s => ['At Sea', 'Loading', 'Out for Delivery'].includes(s.status)).length.toString(), color: 'red', icon: '✈️' },
    { label: t('completed', 'Completed'), value: shipments.filter(s => s.status === 'Delivered').length.toString(), color: 'emerald', icon: '🏁' },
    { label: t('alerts', 'Alerts'), value: shipments.filter(s => ['Delayed', 'Exception'].includes(s.status)).length.toString(), color: 'rose', icon: '⚡' },
  ];

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = s.id.toLowerCase().includes(search.toLowerCase()) || s.vesselName.toLowerCase().includes(search.toLowerCase());
    let matchesFilter = false;
    if (filter === 'All') {
      matchesFilter = true;
    } else if (filter === 'Affected') {
      matchesFilter = !!s.isAffectedShipment;
    } else {
      matchesFilter = s.status === filter;
    }
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status: ShipmentStatus) => {
    switch (status) {
      case 'At Sea': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Exception': return 'bg-red-600 text-white';
      case 'Delayed': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Role Switcher */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#73C7E6] flex items-center justify-center text-2xl shadow-lg shadow-sky-500/10">
            {userRole === 'Agent' ? '🕵️' : '👤'}
          </div>
          <div>
            <h3 className="text-lg font-black text-[#00243D] dark:text-white leading-tight uppercase tracking-tight">{t('access_level', 'Access Level')}</h3>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t('active_system_permissions', 'Active System Permissions')}</p>
          </div>
        </div>
        
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full md:w-auto">
          {(['Customer', 'Agent'] as BusinessRole[]).map((role) => (
            <button 
              key={role}
              onClick={() => onRoleChange(role)}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                userRole === role 
                  ? 'bg-[#73C7E6] text-[#00243D] shadow-lg' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-[#73C7E6]'
              }`}
            >
              {role === 'Agent' ? t('agent', 'Agent') : t('customer', 'Customer')}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#73C7E6]"></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black text-[#00243D] dark:text-white tracking-tighter">{stat.value}</h3>
            </div>
            <div className="text-3xl opacity-20 group-hover:opacity-100 transition-all group-hover:scale-125">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Monthly Shipment Volume & Average Transit Times Recharts Visualization */}
      <DashboardVisualizer shipments={shipments} />

      {/* Affected Shipments Status Indicator Banner */}
      {affectedCount > 0 && (
        <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 p-6 rounded-[32px] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-2xl text-white shadow-lg shadow-amber-500/20">
              ⚠️
            </div>
            <div>
              <h4 className="text-sm font-black text-[#00243D] dark:text-white uppercase tracking-wider">
                {t('automated_routing_rules_applied', 'Automated Routing Rules Applied')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5 leading-relaxed">
                {t('maersk_routing_engine_detected_part1', 'The Maersk Routing Engine has detected')}{' '}
                <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                  {affectedCount} {affectedCount === 1 ? t('maersk_routing_engine_detected_part2_singular', 'shipment currently delayed or rerouted due to active logistics policy triggers.') : t('maersk_routing_engine_detected_part2_plural', 'shipments currently delayed or rerouted due to active logistics policy triggers.')}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilter('Affected')}
            className={`whitespace-nowrap px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              filter === 'Affected'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30 hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-sm'
            }`}
          >
            {filter === 'Affected' ? t('viewing_affected_only', 'Viewing Affected Only') : t('filter_affected_shipments', 'Filter Affected Shipments')}
          </button>
        </div>
      )}

      {/* Main List */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <h3 className="text-2xl font-black text-[#00243D] dark:text-white uppercase tracking-tighter italic">{t('live_shipments', 'Live Shipments')}</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {(['All', 'At Sea', 'Delivered', 'Delayed', 'Affected'] as const).map((status) => {
              const isAffectedTab = status === 'Affected';
              const isSelected = filter === status;
              const count = isAffectedTab 
                ? shipments.filter(s => s.isAffectedShipment).length 
                : status === 'All' 
                  ? shipments.length 
                  : shipments.filter(s => s.status === status).length;
              
              if (isAffectedTab && count === 0) return null; // Hide Affected tab if there are none affected
              
              const label = isAffectedTab
                ? t('status_affected', 'Affected')
                : status === 'All'
                  ? t('status_all', 'All')
                  : status === 'At Sea'
                    ? t('status_at_sea', 'At Sea')
                    : status === 'Delivered'
                      ? t('status_delivered', 'Delivered')
                      : t('status_delayed', 'Delayed');
              
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected 
                      ? isAffectedTab
                        ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/25'
                        : 'bg-[#73C7E6] border-[#73C7E6] text-[#00243D] shadow-lg' 
                      : isAffectedTab
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:border-amber-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-[#73C7E6]'
                  }`}
                >
                  {label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    isSelected 
                      ? 'bg-white/20 text-current' 
                      : isAffectedTab
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredShipments.map((shipment) => (
            <div key={shipment.id} className={`bg-white dark:bg-slate-900 rounded-[32px] border shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative ${shipment.isAffectedShipment ? 'border-amber-400/80 dark:border-amber-500/80 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/5' : 'border-slate-100 dark:border-slate-800'}`}>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md tracking-wider">
                        {t('booking_no_label', 'Booking No')}: <span className="font-bold text-[#00243D] dark:text-white font-mono">{shipment.id}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 bg-[#73C7E6]/10 text-[#00243D] dark:text-[#73C7E6] rounded-md tracking-wider">
                        {t('shipment_no_label', 'Shipment No')}: <span className="font-bold font-mono">MEAU{shipment.id}</span>
                      </span>
                      {shipment.isAffectedShipment && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 bg-amber-500 text-white rounded-md tracking-wider animate-pulse">
                          ⚠️ {t('affected_shipment', 'Affected Shipment')}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{shipment.vesselName}</p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${getStatusStyle(shipment.status)}`}>
                    {t('status_' + shipment.status.toLowerCase().replace(/ /g, '_'), shipment.status)}
                  </div>
                </div>

                <div className="flex items-center gap-10 mb-8 px-4">
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-[#73C7E6] uppercase tracking-widest mb-1">{t('origin', 'Place of Origin')}</p>
                    <p className="text-xl font-black text-[#00243D] dark:text-white tracking-tighter">{shipment.originCode}</p>
                    <p className="text-[10px] text-slate-500 truncate font-bold uppercase">{shipment.origin}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl animate-pulse">🚢</span>
                    <div className="w-16 h-0.5 bg-slate-100 dark:bg-slate-800 mt-2"></div>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[9px] font-black text-[#73C7E6] uppercase tracking-widest mb-1">{t('destination', 'Place of Destination')}</p>
                    <p className="text-xl font-black text-[#00243D] dark:text-white tracking-tighter">{shipment.destinationCode}</p>
                    <p className="text-[10px] text-slate-500 truncate font-bold uppercase">{shipment.destination}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6">
                   <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('est_date_of_departure', 'Est. Date of Departure')}</p>
                     <p className="text-xs font-black text-[#00243D] dark:text-white font-mono">{shipment.departureDate}</p>
                   </div>
                   <div className="border-l border-slate-200 dark:border-slate-700 pl-2">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('estimate_date_of_arrival', 'Estimate Date of Arrival')}</p>
                     <p className="text-xs font-black text-[#00243D] dark:text-white font-mono">{shipment.estimatedArrival}</p>
                   </div>
                   <div className="border-l border-slate-200 dark:border-slate-700 pl-2">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('cargo_weight', 'Load Weight')}</p>
                     <p className="text-xs font-black text-[#00243D] dark:text-white font-mono">{shipment.weight}</p>
                   </div>
                </div>

                {shipment.isAffectedShipment && (
                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 rounded-2xl flex flex-col gap-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        {t('affected_by_routing_rule', 'Affected by Routing Rule')}
                      </p>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-500 text-white rounded-full">
                        {shipment.appliedRuleId}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t('reason_label', 'Reason')}: {shipment.delayReason}
                    </p>
                    {shipment.delayDaysCalculated !== undefined && (
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">
                        {t('delay_factor', 'Delay Factor')}: +{shipment.delayDaysCalculated} {shipment.delayDaysCalculated === 1 ? 'Day' : 'Days'}
                      </p>
                    )}
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 italic">
                      {t('evaluated_label', 'Evaluated')}: {shipment.ruleEvaluationTimestamp ? new Date(shipment.ruleEvaluationTimestamp).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                )}
                
                <button 
                   onClick={() => onTrack(shipment)}
                   className="w-full py-5 bg-[#73C7E6] text-[#00243D] font-black text-xs uppercase tracking-[0.25em] rounded-2xl shadow-xl shadow-sky-500/10 hover:bg-[#00243D] hover:text-white transition-all transform hover:scale-[1.02]"
                >
                   {t('track_shipment', 'Track Shipment')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
