import React, { useMemo } from 'react';
import { useLanguage } from '../src/context/LanguageContext';
import { Shipment, ShipmentStatus } from '../types';
import { 
  Compass, 
  Clock, 
  Calendar, 
  Anchor, 
  Ship, 
  Truck, 
  CheckCircle2, 
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface VoyageProgressTrackerProps {
  shipment: Shipment;
}

const getDaysBetween = (d1: string, d2: string): number => {
  try {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 14;
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  } catch (e) {
    return 14;
  }
};

const addDays = (dateStr: string, days: number): string => {
  try {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return dateStr;
  }
};

export const VoyageProgressTracker: React.FC<VoyageProgressTrackerProps> = ({ shipment }) => {
  const { language, t } = useLanguage();

  // 1. Calculate overall duration
  const totalDays = useMemo(() => {
    return getDaysBetween(shipment.departureDate, shipment.estimatedArrival);
  }, [shipment.departureDate, shipment.estimatedArrival]);

  // 2. Map shipment status to progress percentage
  const progressPercent = useMemo(() => {
    const statusMap: Record<ShipmentStatus, number> = {
      'Pending': 5,
      'Loading': 15,
      'At Sea': 50,
      'Delayed': 50, 
      'Exception': 55, 
      'Awaiting Customs': 75,
      'Customs Clearance': 80,
      'Out for Delivery': 92,
      'Delivered': 100
    };
    return statusMap[shipment.status] !== undefined ? statusMap[shipment.status] : 50;
  }, [shipment.status]);

  // 3. Compute elapsed days & remaining days
  const elapsedDays = useMemo(() => {
    return Math.min(totalDays, Math.round(totalDays * (progressPercent / 100)));
  }, [totalDays, progressPercent]);

  const remainingDays = useMemo(() => {
    return Math.max(0, totalDays - elapsedDays);
  }, [totalDays, elapsedDays]);

  // 4. Formatted dates for displaying
  const formatFriendlyDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // 5. Dynamic location descriptor based on status
  const currentSector = useMemo(() => {
    switch (shipment.status) {
      case 'Pending':
        return t('sector_pending', 'Origin Terminal Gate - Yard Staging');
      case 'Loading':
        return t('sector_loading', 'Cargo Crane Operations - Berth #04');
      case 'At Sea':
        return t('sector_at_sea', 'Ocean Route Segment - International Waters');
      case 'Delayed':
        return t('sector_delayed', 'Ocean Crossing - Weather Mitigation Path');
      case 'Exception':
        return t('sector_exception', 'Destination Port Outer Anchor - Customs Hold');
      case 'Awaiting Customs':
        return t('sector_awaiting_customs', 'Import Terminal - Document Processing');
      case 'Customs Clearance':
        return t('sector_customs_clearance', 'Cargo Inspected & Approved for Release');
      case 'Out for Delivery':
        return t('sector_out_for_delivery', 'Inland Logistics Express - Highway Route');
      case 'Delivered':
        return t('sector_delivered', 'Consignee Warehouse - Ocean Voyage Completed');
      default:
        return t('sector_transit', 'Global Maritime Logistics Network');
    }
  }, [shipment.status, t]);

  // Icon type based on status (Ship vs Truck)
  const isOverland = shipment.status === 'Out for Delivery' || shipment.status === 'Delivered';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[40px] shadow-sm relative overflow-hidden" id="voyage-time-tracker">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-[#73C7E6]/5 rounded-bl-[140px] pointer-events-none"></div>

      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-sky-500 rounded-full"></span>
            <h3 className="text-sm font-black text-[#00243D] dark:text-white uppercase tracking-widest flex items-center gap-2">
              {t('voyage_time_tracker', 'Vessel Transit & Delivery Time-Tracker')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('voyage_time_tracker_desc', 'Live operational telemetry of voyage duration, elapsed days, and delivery schedules')}
          </p>
        </div>

        {/* Dynamic overall indicator badge */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-[#73C7E6] rounded-full text-[10px] font-black uppercase tracking-wider self-start md:self-auto shadow-sm">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>{progressPercent}% {t('voyage_completed_label', 'Completed')}</span>
        </div>
      </div>

      {/* Main Time-to-Delivery Progress Track */}
      <div className="relative py-12 px-2 md:px-6 bg-slate-50 dark:bg-slate-950/20 rounded-[32px] border border-slate-100 dark:border-slate-800/60 mb-8">
        <div className="relative w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-visible">
          {/* Active Gradient Track */}
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
              shipment.status === 'Delayed' 
                ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                : shipment.status === 'Exception'
                  ? 'bg-gradient-to-r from-red-400 to-red-500'
                  : 'bg-gradient-to-r from-[#73C7E6] to-[#0ea5e9]'
            }`}
            style={{ width: `${progressPercent}%` }}
          >
            {/* Pulsing glow at the leading edge */}
            <div className="absolute right-0 top-0 h-full w-4 bg-white/40 rounded-full blur-xs animate-ping"></div>
          </div>

          {/* Departure Node */}
          <div className="absolute left-0 -translate-x-1/2 -top-10 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-md">
              <Anchor className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <span className="text-[10px] font-black text-[#00243D] dark:text-white uppercase tracking-wider mt-1">{shipment.originCode}</span>
          </div>

          {/* Destination Node */}
          <div className="absolute right-0 translate-x-1/2 -top-10 flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 transition-all duration-500 ${
              shipment.status === 'Delivered' 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-[#00243D] dark:text-white uppercase tracking-wider mt-1">{shipment.destinationCode}</span>
          </div>

          {/* Active Sliding Vessel/Truck Indicator */}
          <div 
            className="absolute -top-14 -translate-x-1/2 transition-all duration-1000 flex flex-col items-center z-10"
            style={{ left: `${progressPercent}%` }}
          >
            {/* Status Bubble on top */}
            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap mb-2.5 flex items-center gap-1 border ${
              shipment.status === 'Delayed'
                ? 'bg-amber-500 border-amber-400 text-white'
                : shipment.status === 'Exception'
                  ? 'bg-red-500 border-red-400 text-white'
                  : 'bg-[#00243D] border-slate-700 text-[#73C7E6]'
            }`}>
              {isOverland ? <Truck className="w-3 h-3" /> : <Ship className="w-3 h-3" />}
              <span>{shipment.status}</span>
            </div>

            {/* Custom pin/marker dot */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-xl ring-4 ${
              shipment.status === 'Delayed'
                ? 'bg-amber-500 ring-amber-500/20'
                : shipment.status === 'Exception'
                  ? 'bg-red-500 ring-red-500/20'
                  : 'bg-[#0ea5e9] ring-sky-500/20'
            }`}>
              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Start/End details below track */}
        <div className="flex justify-between items-start mt-12 px-2 text-left">
          <div className="max-w-[150px]">
            <p className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">{t('departure', 'Departure')}</p>
            <p className="text-xs font-black text-[#00243D] dark:text-white tracking-tight mt-0.5 line-clamp-1">{shipment.origin}</p>
            <p className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">{formatFriendlyDate(shipment.departureDate)}</p>
          </div>

          {/* Midpoint helper status text */}
          <div className="hidden sm:block text-center self-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-1.5 rounded-full shadow-sm max-w-[280px]">
            <div className="flex items-center gap-1.5 justify-center">
              <Compass className="w-3.5 h-3.5 text-sky-500 animate-spin-slow" />
              <p className="text-[10px] font-black text-[#00243D] dark:text-white uppercase tracking-tight truncate">
                {currentSector}
              </p>
            </div>
          </div>

          <div className="max-w-[150px] text-right">
            <p className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">{t('arrival', 'Arrival')}</p>
            <p className="text-xs font-black text-[#00243D] dark:text-white tracking-tight mt-0.5 line-clamp-1">{shipment.destination}</p>
            <p className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">{formatFriendlyDate(shipment.estimatedArrival)}</p>
          </div>
        </div>
      </div>

      {/* Operational Grid Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Voyage Duration */}
        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {t('total_transit_days', 'Voyage Duration')}
          </span>
          <div className="mt-4">
            <span className="text-2xl font-black text-[#00243D] dark:text-white tracking-tight">
              {totalDays} {t('days_unit', 'Days')}
            </span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
              {t('total_voyage_span', 'Total estimated voyage span')}
            </p>
          </div>
        </div>

        {/* Metric 2: Completed Days */}
        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
            {t('elapsed_transit_days', 'Time Elapsed')}
          </span>
          <div className="mt-4">
            <span className="text-2xl font-black text-[#00243D] dark:text-white tracking-tight">
              {elapsedDays} {t('days_unit', 'Days')}
            </span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
              {t('days_since_departure', 'Days completed since departure')}
            </p>
          </div>
        </div>

        {/* Metric 3: Remaining Days */}
        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            {t('remaining_transit_days', 'Time Remaining')}
          </span>
          <div className="mt-4">
            <span className="text-2xl font-black text-[#00243D] dark:text-white tracking-tight">
              {shipment.status === 'Delivered' ? (
                <span className="text-emerald-500">{t('arrived', 'Arrived')}</span>
              ) : (
                `${remainingDays} ${t('days_unit', 'Days')}`
              )}
            </span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
              {shipment.status === 'Delivered' 
                ? t('voyage_closed', 'Voyage successfully completed')
                : t('estimated_time_to_pod', 'Estimated time to discharge port')
              }
            </p>
          </div>
        </div>

        {/* Metric 4: Delay Variance */}
        <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <AlertTriangle className={`w-3.5 h-3.5 ${shipment.status === 'Delayed' || shipment.status === 'Exception' ? 'text-amber-500 animate-bounce' : 'text-slate-400'}`} />
            {t('schedule_variance', 'Schedule Variance')}
          </span>
          <div className="mt-4">
            {shipment.status === 'Delayed' ? (
              <div>
                <span className="text-lg font-black text-amber-500 tracking-tight block uppercase">
                  {shipment.delayTime || '+2 Days'}
                </span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5 truncate">
                  {shipment.delayReason || 'Operational delay detected'}
                </p>
              </div>
            ) : shipment.status === 'Exception' ? (
              <div>
                <span className="text-lg font-black text-red-500 tracking-tight block uppercase">
                  {shipment.delayTime || '+3 Days'}
                </span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5 truncate">
                  {shipment.delayReason || 'Customs Clearance issue'}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-2xl font-black text-emerald-500 tracking-tight">
                  {t('on_schedule', 'On Schedule')}
                </span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                  {t('operational_window_ok', 'Within operational parameters')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
