
import React, { useState } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { Download } from 'lucide-react';
import { useLanguage } from '../src/context/LanguageContext';

interface ShipmentListProps {
  shipments: Shipment[];
  onTrack: (shipment: Shipment) => void;
}

const ShipmentList: React.FC<ShipmentListProps> = ({ shipments, onTrack }) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ShipmentStatus | 'All'>('All');

  const filtered = shipments.filter(s => {
    const matchesSearch = s.id.toLowerCase().includes(search.toLowerCase()) || 
                          s.vesselName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleExportCSV = () => {
    const headers = [
      'Shipment ID',
      'Vessel Name',
      'Voyage Direction',
      'Payment Reference',
      'Place of Receipt',
      'Port of Loading',
      'Port of Discharge',
      'Place of Delivery',
      'Origin',
      'Origin Code',
      'Destination',
      'Destination Code',
      'Status',
      'Departure Date',
      'Estimated Arrival',
      'Container Count',
      'Weight',
      'Contents',
      'Delay Reason',
      'Delay Time'
    ];

    const rows = filtered.map(s => [
      s.id,
      s.vesselName,
      s.voyageDirection || '629S',
      s.paymentReference || '7553319001 /10141358',
      s.placeOfReceipt || `${s.origin}, PL`,
      s.portOfLoading || `${s.origin}, PL`,
      s.portOfDischarge || `${s.destination}, ES`,
      s.placeOfDelivery || `${s.destination}, ES`,
      s.origin,
      s.originCode,
      s.destination,
      s.destinationCode,
      s.status,
      s.departureDate,
      s.estimatedArrival,
      s.containerCount,
      s.weight,
      s.contents || '',
      s.delayReason || '',
      s.delayTime || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Maersk_Shipments_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusStyle = (status: ShipmentStatus) => {
    switch (status) {
      case 'At Sea': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Exception': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'Delayed': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Out for Delivery': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'Loading': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
      case 'Customs Clearance': 
      case 'Awaiting Customs': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusDotColor = (status: ShipmentStatus) => {
    switch (status) {
      case 'At Sea': return 'bg-blue-500';
      case 'Delivered': return 'bg-emerald-500';
      case 'Exception': return 'bg-rose-500';
      case 'Delayed': return 'bg-amber-500';
      case 'Out for Delivery': return 'bg-indigo-500';
      case 'Loading': return 'bg-sky-500';
      case 'Customs Clearance': 
      case 'Awaiting Customs': return 'bg-orange-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <input 
            type="text" 
            placeholder={t('search_placeholder', 'Search by Shipment ID or Vessel Name...')}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007DA3] transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['All', 'At Sea', 'Delivered', 'Exception', 'Loading', 'Out for Delivery'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === status 
                  ? 'bg-[#00243D] dark:bg-maersk-light text-white shadow-md' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {status === 'All' ? t('status_all', 'All') : t('status_' + status.toLowerCase().replace(/ /g, '_'), status)}
            </button>
          ))}
        </div>

        <button
          onClick={handleExportCSV}
          className="group w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-[#007DA3] hover:text-white dark:bg-slate-800 dark:hover:bg-maersk-light dark:hover:text-[#00243D] text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap border border-slate-150 dark:border-slate-700/60 shadow-xs"
          id="export-csv-button"
          title="Export current list of shipments to CSV format"
        >
          <Download className="w-4 h-4 text-[#007DA3] dark:text-[#73C7E6] group-hover:text-white dark:group-hover:text-[#00243D] transition-colors" />
          {t('export_csv', 'Export CSV')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((shipment) => (
          <div 
            key={shipment.id}
            className={`relative bg-white dark:bg-slate-900 rounded-2xl border shadow-sm hover:shadow-lg transition-all group overflow-hidden ${shipment.isAffectedShipment ? 'border-amber-400/80 dark:border-amber-500/80 ring-2 ring-amber-400/20 shadow-lg shadow-amber-500/5' : 'border-slate-100 dark:border-slate-800'}`}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
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
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wide">{shipment.vesselName}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusStyle(shipment.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(shipment.status)}`}></span>
                  {t('status_' + shipment.status.toLowerCase().replace(/ /g, '_'), shipment.status)}
                </div>
              </div>

              <div className="flex items-center gap-8 mb-6">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">{t('origin', 'Place of Origin')}</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 tracking-tight">{shipment.originCode}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{shipment.origin}</p>
                </div>
                <div className="relative flex-1 flex flex-col items-center">
                   <div className="w-full h-px bg-slate-100 dark:bg-slate-800 absolute top-7"></div>
                   <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 z-10"></div>
                   <span className="text-xl mt-1 z-10 bg-white dark:bg-slate-900 px-2 transition-colors">🚢</span>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">{t('destination', 'Place of Destination')}</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 tracking-tight">{shipment.destinationCode}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{shipment.destination}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-4 border-t border-slate-50 dark:border-slate-800">
                <div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-tight mb-1">{t('est_date_of_departure', 'Est. Date of Departure')}</p>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">{shipment.departureDate}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-tight mb-1">{t('estimate_date_of_arrival', 'Estimate Date of Arrival')}</p>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">{shipment.estimatedArrival}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-tight mb-1">{t('cargo_weight', 'Load Weight')}</p>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">{shipment.weight}</p>
                </div>
              </div>

              {/* DISRUPTION STATUS BAR - ONLY FOR DELAYED/EXCEPTION OR AFFECTED */}
              {(shipment.status === 'Delayed' || shipment.status === 'Exception' || shipment.isAffectedShipment) && (
                <div className={`mt-4 p-4 rounded-xl flex flex-col gap-1 border ${
                  shipment.isAffectedShipment
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50'
                    : shipment.status === 'Exception' 
                      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50' 
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${
                      shipment.isAffectedShipment
                        ? 'text-amber-700 dark:text-amber-400'
                        : shipment.status === 'Exception' 
                          ? 'text-rose-700 dark:text-rose-400' 
                          : 'text-amber-700 dark:text-amber-400'
                    }`}>
                      {shipment.isAffectedShipment 
                        ? `${t('automation_policy', 'Automation Policy')}: ${shipment.appliedRuleId}` 
                        : t('disruption_alert', 'Disruption Alert')}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      shipment.isAffectedShipment
                        ? 'bg-amber-500 text-white shadow-sm'
                        : shipment.status === 'Exception' 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-amber-500 text-white'
                    }`}>
                      {t('impact_label', 'Impact')}: {shipment.delayTime || 'Calculating...'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t('reason_label', 'Reason')}: {shipment.delayReason}
                  </p>
                  {shipment.isAffectedShipment && shipment.ruleEvaluationTimestamp && (
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 italic mt-1 leading-none">
                      {t('evaluated_label', 'Evaluated')}: {new Date(shipment.ruleEvaluationTimestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => onTrack(shipment)}
              className={`w-full py-4 font-bold transition-all flex items-center justify-center gap-2 border-t border-slate-100 dark:border-slate-700 ${
                shipment.status === 'Exception' || shipment.status === 'Delayed'
                ? 'bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white'
                : 'bg-slate-50 dark:bg-slate-800 text-[#00243D] dark:text-white group-hover:bg-[#007DA3] group-hover:text-white'
              }`}
            >
              {t('track_shipment', 'Track Details')}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShipmentList;
