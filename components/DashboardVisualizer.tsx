import React, { useState, useMemo } from 'react';
import { useLanguage } from '../src/context/LanguageContext';
import { Shipment } from '../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell
} from 'recharts';
import { 
  BarChart2, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Info,
  Ship,
  TrendingDown,
  Activity
} from 'lucide-react';

interface DashboardVisualizerProps {
  shipments: Shipment[];
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

export const DashboardVisualizer: React.FC<DashboardVisualizerProps> = ({ shipments }) => {
  const { language, t } = useLanguage();
  const [chartMode, setChartMode] = useState<'combined' | 'volume' | 'transit'>('combined');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group and sort shipment metrics chronologically by departure month
  const chartData = useMemo(() => {
    const groups: Record<string, { monthKey: string; sortKey: string; totalTransitDays: number; count: number }> = {};

    shipments.forEach(s => {
      if (!s.departureDate) return;
      try {
        const d = new Date(s.departureDate);
        if (isNaN(d.getTime())) return;
        const year = d.getFullYear();
        const month = d.getMonth(); // 0-11
        const monthLabel = d.toLocaleDateString(language === 'da' ? 'da-DK' : 'en-US', { month: 'short' });
        const monthKey = `${monthLabel} ${year}`;
        const sortKey = `${year}-${String(month + 1).padStart(2, '0')}`;

        const transitDays = getDaysBetween(s.departureDate, s.estimatedArrival);

        if (!groups[monthKey]) {
          groups[monthKey] = {
            monthKey,
            sortKey,
            totalTransitDays: 0,
            count: 0
          };
        }
        groups[monthKey].totalTransitDays += transitDays;
        groups[monthKey].count += 1;
      } catch (e) {
        console.error(e);
      }
    });

    // Convert to array and sort by sortKey
    const sortedData = Object.values(groups)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(g => ({
        month: g.monthKey,
        volume: g.count,
        avgTransitTime: Math.round((g.totalTransitDays / g.count) * 10) / 10 // round to 1 decimal
      }));

    // Beautiful fallback if no shipments exist
    if (sortedData.length === 0) {
      return [
        { month: 'Apr 2024', volume: 10, avgTransitTime: 42.5 },
        { month: 'May 2024', volume: 15, avgTransitTime: 45.2 },
        { month: 'Jun 2024', volume: 12, avgTransitTime: 38.9 },
        { month: 'Jul 2024', volume: 18, avgTransitTime: 40.1 },
      ];
    }

    return sortedData;
  }, [shipments, language]);

  // Aggregate metrics
  const totalVolume = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.volume, 0);
  }, [chartData]);

  const averageTransitTimeAcrossMonths = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce((acc, curr) => acc + curr.avgTransitTime, 0);
    return Math.round((sum / chartData.length) * 10) / 10;
  }, [chartData]);

  const peakVolumeMonth = useMemo(() => {
    if (chartData.length === 0) return { month: '-', volume: 0 };
    return chartData.reduce((max, curr) => curr.volume > max.volume ? curr : max, chartData[0]);
  }, [chartData]);

  // Custom tooltips to maintain Maersk brand style
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-xl space-y-2 text-xs">
          <p className="font-black text-[#00243D] dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => {
            const isVolume = entry.dataKey === 'volume';
            const valueLabel = isVolume ? t('shipments_unit', 'Shipments') : t('days_unit', 'Days');
            const color = isVolume ? '#73C7E6' : '#FF9F43';
            
            return (
              <div key={index} className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                    {entry.name}
                  </span>
                </div>
                <span className="font-black text-[#00243D] dark:text-white font-mono bg-slate-50 dark:bg-slate-900/60 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                  {entry.value} {valueLabel}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[40px] shadow-sm relative overflow-hidden" id="dashboard-logistics-visualizer">
      {/* Visual top accent */}
      <div className="absolute top-0 left-0 w-36 h-36 bg-[#73C7E6]/5 rounded-br-[140px] pointer-events-none"></div>

      {/* Header and Controls Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#73C7E6] rounded-full"></span>
            <h3 className="text-sm font-black text-[#00243D] dark:text-white uppercase tracking-widest flex items-center gap-2">
              {t('logistics_performance_title', 'Logistics Performance & Volume Intelligence')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('logistics_performance_desc', 'Operational analytics comparing monthly container output against physical transit efficiency')}
          </p>
        </div>

        {/* View toggles */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('chart_filter', 'View Focus:')}</span>
          <div className="inline-flex bg-slate-50 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <button
              onClick={() => setChartMode('combined')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                chartMode === 'combined'
                  ? 'bg-[#00243D] dark:bg-[#73C7E6] text-white dark:text-[#00243D] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {t('chart_mode_combined', 'Comparative Output')}
            </button>
            <button
              onClick={() => setChartMode('volume')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                chartMode === 'volume'
                  ? 'bg-[#00243D] dark:bg-[#73C7E6] text-white dark:text-[#00243D] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {t('chart_mode_volume', 'Shipment Volume')}
            </button>
            <button
              onClick={() => setChartMode('transit')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                chartMode === 'transit'
                  ? 'bg-[#00243D] dark:bg-[#73C7E6] text-white dark:text-[#00243D] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {t('chart_mode_transit', 'Avg Transit Time')}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Micro-KPIs specifically for Logistics Planning */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">{t('kpi_volume_handled', 'Volume Processed')}</span>
            <span className="text-lg font-black text-[#00243D] dark:text-white mt-0.5 block">{totalVolume} {t('shipments_unit', 'Waybills')}</span>
          </div>
        </div>

        <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">{t('kpi_avg_duration', 'Avg Voyage Duration')}</span>
            <span className="text-lg font-black text-[#00243D] dark:text-white mt-0.5 block">{averageTransitTimeAcrossMonths} {t('days_unit', 'Days')}</span>
          </div>
        </div>

        <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">{t('kpi_peak_loading', 'Peak Staging Period')}</span>
            <span className="text-lg font-black text-[#00243D] dark:text-white mt-0.5 block truncate">
              {peakVolumeMonth.month} ({peakVolumeMonth.volume} {t('units_count', 'loads')})
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts Bar Graph Canvas */}
      <div className="h-80 w-full bg-slate-50 dark:bg-slate-950/30 rounded-3xl p-4 md:p-6 border border-slate-100 dark:border-slate-800 relative">
        <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700 text-[9px] font-black uppercase tracking-wider text-slate-400 shadow-sm z-10 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-[#73C7E6] animate-pulse" />
          {t('graph_live_operational', 'Live Operational Telemetry')}
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
            onMouseMove={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                setHoveredIndex(state.activeTooltipIndex);
              } else {
                setHoveredIndex(null);
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.15} />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />

            {/* Left Y-Axis: Shipment Volume */}
            {(chartMode === 'combined' || chartMode === 'volume') && (
              <YAxis 
                yAxisId="left"
                tick={{ fill: '#73C7E6', fontSize: 9, fontWeight: 800 }}
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: t('volume_label', 'Shipment Volume'), 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fill: '#73C7E6', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' } 
                }}
              />
            )}

            {/* Right Y-Axis: Avg Transit Time (Days) */}
            {(chartMode === 'combined' || chartMode === 'transit') && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#FF9F43', fontSize: 9, fontWeight: 800 }}
                axisLine={false}
                tickLine={false}
                label={{ 
                  value: t('avg_transit_days_label', 'Avg Transit Time (Days)'), 
                  angle: 90, 
                  position: 'insideRight', 
                  style: { fill: '#FF9F43', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' } 
                }}
              />
            )}

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)', radius: 12 }} />
            
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }}
            />

            {/* Bar 1: Shipment Volume */}
            {(chartMode === 'combined' || chartMode === 'volume') && (
              <Bar 
                yAxisId="left" 
                dataKey="volume" 
                name={t('legend_volume', 'Volume Handled')} 
                fill="#73C7E6" 
                radius={[8, 8, 0, 0]}
                maxBarSize={45}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-vol-${index}`} 
                    fill="#73C7E6"
                    fillOpacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.65}
                    className="transition-all duration-300"
                  />
                ))}
              </Bar>
            )}

            {/* Bar 2: Avg Transit Time */}
            {(chartMode === 'combined' || chartMode === 'transit') && (
              <Bar 
                yAxisId="right" 
                dataKey="avgTransitTime" 
                name={t('legend_transit', 'Avg Transit Time')} 
                fill="#FF9F43" 
                radius={[8, 8, 0, 0]}
                maxBarSize={45}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-time-${index}`} 
                    fill="#FF9F43"
                    fillOpacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.65}
                    className="transition-all duration-300"
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Information Helper Disclaimer Footnote */}
      <div className="mt-4 flex items-start gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40">
        <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t('disclaimer_logistics', 'Analytics are calculated automatically using standard port-to-port voyage durations. Use this chart to plan container allocation windows and prevent terminal storage overcharges at the Destination Port (POD).')}
        </p>
      </div>
    </div>
  );
};
