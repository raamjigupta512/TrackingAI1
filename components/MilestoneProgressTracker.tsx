import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLanguage } from '../src/context/LanguageContext';
import { Shipment, ShipmentStatus } from '../types';
import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Area,
  ReferenceLine
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Ship, 
  Anchor, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Compass, 
  HelpCircle,
  Activity,
  ArrowRight
} from 'lucide-react';

interface MilestoneProgressTrackerProps {
  shipment: Shipment;
}

interface MilestoneData {
  index: number;
  name: string;
  milestoneKey: string;
  expectedDay: number;
  expectedDate: string;
  expectedDateLabel: string;
  actualDay?: number;
  actualDate?: string;
  actualDateLabel?: string;
  status: 'completed' | 'current' | 'pending' | 'delayed';
  phase: 'departure' | 'transit' | 'arrival';
  phaseLabel: string;
  description: string;
  coordinates: string;
}

const getDaysBetween = (d1: string, d2: string): number => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return isNaN(diffDays) ? 14 : diffDays === 0 ? 1 : diffDays;
};

const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const MilestoneProgressTracker: React.FC<MilestoneProgressTrackerProps> = ({ shipment }) => {
  const { language, t } = useLanguage();
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'all' | 'expected' | 'actual'>('all');

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 280 });

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: width || 500,
        height: height || 280
      });
    });
    resizeObserver.observe(chartContainerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const formatDateLabel = (dateStr: string): string => {
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

  const currentStatusIndex = useMemo(() => {
    const statusMap: Record<ShipmentStatus, number> = {
      'Pending': 0,
      'Loading': 1,
      'At Sea': 2,
      'Delayed': 2, 
      'Exception': 3, 
      'Awaiting Customs': 3,
      'Customs Clearance': 3,
      'Out for Delivery': 4,
      'Delivered': 5
    };
    return statusMap[shipment.status] !== undefined ? statusMap[shipment.status] : 2;
  }, [shipment.status]);

  // Set initial selected milestone on shipment change
  React.useEffect(() => {
    setSelectedIdx(currentStatusIndex);
  }, [currentStatusIndex, shipment.id]);

  const milestonesData = useMemo((): MilestoneData[] => {
    const totalDays = getDaysBetween(shipment.departureDate, shipment.estimatedArrival);
    
    const milestoneDefs = [
      { 
        key: 'booked', 
        label: t('milestone_booked', 'Order Booked'), 
        relTime: 0, 
        phase: 'departure' as const,
        phaseLabel: t('phase_departure', 'Departure Port Logistics'),
        desc: t('booked_desc', 'Maersk confirmed space allocation. Container set ready for empty pickup and yard staging.'),
        coords: '40.7128° N, 74.0060° W'
      },
      { 
        key: 'loaded', 
        label: t('milestone_loaded', 'Cargo Loaded'), 
        relTime: 0.1, 
        phase: 'departure' as const,
        phaseLabel: t('phase_departure', 'Departure Port Logistics'),
        desc: t('loaded_desc', 'Container successfully cleared local outbound gates and crane-lifted onto ocean vessel cargo hold.'),
        coords: '22.3964° N, 114.1095° E'
      },
      { 
        key: 'transit', 
        label: t('milestone_transit', 'In Transit'), 
        relTime: 0.45, 
        phase: 'transit' as const,
        phaseLabel: t('phase_transit', 'International Voyage'),
        desc: t('transit_desc', 'Active ocean cruising under scheduled GPS coordinates. Monitoring ocean currents and fuel payload metrics.'),
        coords: '35.6762° N, 139.6503° E'
      },
      { 
        key: 'customs', 
        label: t('milestone_customs', 'Customs Clearance'), 
        relTime: 0.8, 
        phase: 'transit' as const,
        phaseLabel: t('phase_transit', 'International Voyage'),
        desc: t('customs_desc', 'Import documentation transmitted to port control authority. Initiating clearance procedure and security checks.'),
        coords: '1.3521° N, 103.8198° E'
      },
      { 
        key: 'delivery', 
        label: t('milestone_delivery', 'Out for Delivery'), 
        relTime: 0.92, 
        phase: 'arrival' as const,
        phaseLabel: t('phase_arrival', 'Terminal & Inland Transport'),
        desc: t('delivery_desc', 'Cargo dispatched onto chassis truck. Final leg of overland route commenced toward consignee warehouses.'),
        coords: '50.1109° N, 8.6821° E'
      },
      { 
        key: 'delivered', 
        label: t('milestone_delivered', 'Delivered'), 
        relTime: 1.0, 
        phase: 'arrival' as const,
        phaseLabel: t('phase_arrival', 'Terminal & Inland Transport'),
        desc: t('delivered_desc', 'Vessel voyage concluded. Final container door sealing validated, and physical cargo handover signed off by recipient.'),
        coords: '52.5200° N, 13.4050° E'
      }
    ];

    return milestoneDefs.map((def, index) => {
      // Expected Day calculations
      let expectedDay = Math.round(totalDays * def.relTime);
      if (index === 0) expectedDay = 0;
      if (index === 5) expectedDay = totalDays;
      if (index > 0 && index < 5 && expectedDay === 0) expectedDay = index;

      const expectedDate = addDays(shipment.departureDate, expectedDay);

      // Status of the milestone
      let status: 'completed' | 'current' | 'pending' | 'delayed' = 'pending';
      if (shipment.status === 'Delayed' && index === currentStatusIndex) {
        status = 'delayed';
      } else if (shipment.status === 'Exception' && index === currentStatusIndex) {
        status = 'delayed';
      } else if (index < currentStatusIndex) {
        status = 'completed';
      } else if (index === currentStatusIndex) {
        status = 'current';
      }

      // Actual Day simulation based on actual status
      let actualDay: number | undefined = undefined;
      let actualDate: string | undefined = undefined;

      if (index <= currentStatusIndex) {
        if (index === 0) {
          actualDay = 0;
        } else if (index === currentStatusIndex) {
          if (shipment.status === 'Delayed') {
            actualDay = expectedDay + 2; 
          } else if (shipment.status === 'Exception') {
            actualDay = expectedDay + 4; 
          } else {
            actualDay = expectedDay;
          }
        } else {
          actualDay = expectedDay;
        }
        actualDate = addDays(shipment.departureDate, actualDay);
      }

      return {
        index,
        name: def.label,
        milestoneKey: def.key,
        expectedDay,
        expectedDate,
        expectedDateLabel: formatDateLabel(expectedDate),
        actualDay,
        actualDate,
        actualDateLabel: actualDate ? formatDateLabel(actualDate) : undefined,
        status,
        phase: def.phase,
        phaseLabel: def.phaseLabel,
        description: def.desc,
        coordinates: def.coords
      };
    });
  }, [shipment.departureDate, shipment.estimatedArrival, shipment.status, currentStatusIndex, language]);

  // Phase grouping metrics for summary
  const phases = useMemo(() => {
    const counts = { departure: 0, transit: 0, arrival: 0 };
    const completedCounts = { departure: 0, transit: 0, arrival: 0 };
    
    milestonesData.forEach((m) => {
      counts[m.phase]++;
      if (m.status === 'completed' || m.status === 'current' || m.status === 'delayed') {
        completedCounts[m.phase]++;
      }
    });

    return [
      { id: 'departure', label: t('phase_tab_departure', 'Departure'), progress: `${completedCounts.departure}/${counts.departure}` },
      { id: 'transit', label: t('phase_tab_transit', 'Voyage Transit'), progress: `${completedCounts.transit}/${counts.transit}` },
      { id: 'arrival', label: t('phase_tab_arrival', 'Final Arrival'), progress: `${completedCounts.arrival}/${counts.arrival}` }
    ];
  }, [milestonesData]);

  // Map data to Recharts format with filtered properties
  const chartData = useMemo(() => {
    return milestonesData.map((m) => {
      const dataObj: any = {
        name: m.name,
        index: m.index,
        status: m.status,
        expectedDate: m.expectedDateLabel,
        actualDate: m.actualDateLabel || '-'
      };
      if (filterMode === 'all' || filterMode === 'expected') {
        dataObj['Expected Days'] = m.expectedDay;
      }
      if (filterMode === 'all' || filterMode === 'actual') {
        dataObj['Actual Days'] = m.actualDay;
      }
      return dataObj;
    });
  }, [milestonesData, filterMode]);

  const selectedMilestone = milestonesData[selectedIdx] || milestonesData[0];

  // Completion score calculation
  const totalCompleted = milestonesData.filter(m => m.status === 'completed' || m.status === 'current' || m.status === 'delayed').length;
  const progressPercentage = Math.round((totalCompleted / milestonesData.length) * 100);

  // Handle graph node selection
  const handleChartClick = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      setSelectedIdx(state.activeTooltipIndex);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[40px] shadow-sm relative overflow-hidden" id="milestone-progress-tracker">
      <div className="absolute top-0 left-0 w-32 h-32 bg-sky-500/5 rounded-br-[120px] pointer-events-none"></div>
      
      {/* Upper Status HUD bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#73C7E6] rounded-full"></span>
            <h3 className="text-sm font-black text-[#00243D] dark:text-white uppercase tracking-widest flex items-center gap-2">
              {t('milestone_comparison', 'Milestone Schedule Comparison')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('milestone_desc', 'Interactive Recharts analysis comparing target schedule vs physical voyage execution')}
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('view_mode', 'Analysis View:')}</span>
          <div className="inline-flex bg-slate-50 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                filterMode === 'all'
                  ? 'bg-[#00243D] dark:bg-[#73C7E6] text-white dark:text-[#00243D] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {t('filter_all', 'Comparative')}
            </button>
            <button
              onClick={() => setFilterMode('expected')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                filterMode === 'expected'
                  ? 'bg-[#00243D] dark:bg-[#73C7E6] text-white dark:text-[#00243D] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {t('filter_expected', 'Planned Plan')}
            </button>
            <button
              onClick={() => setFilterMode('actual')}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                filterMode === 'actual'
                  ? 'bg-[#00243D] dark:bg-[#73C7E6] text-white dark:text-[#00243D] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {t('filter_actual', 'Real-Time')}
            </button>
          </div>
        </div>
      </div>

      {/* Segmented Phase Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {phases.map((phase) => {
          const isSelectedPhase = selectedMilestone.phase === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => {
                const firstMilestone = milestonesData.find(m => m.phase === phase.id);
                if (firstMilestone) setSelectedIdx(firstMilestone.index);
              }}
              className={`p-4 rounded-2xl border transition-all duration-300 text-left flex items-center justify-between ${
                isSelectedPhase
                  ? 'bg-gradient-to-r from-sky-50 to-white dark:from-slate-800/40 dark:to-slate-900 border-[#73C7E6] ring-2 ring-[#73C7E6]/10 scale-[1.01] shadow-sm'
                  : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800/50 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest block ${isSelectedPhase ? 'text-[#73C7E6]' : 'text-slate-400'}`}>
                  {phase.label}
                </span>
                <span className="text-xs font-black text-[#00243D] dark:text-white mt-1 block">
                  {phase.id === 'departure' && t('departure_phase_label', 'Origins & Staging')}
                  {phase.id === 'transit' && t('transit_phase_label', 'Ocean Voyage & Control')}
                  {phase.id === 'arrival' && t('arrival_phase_label', 'Customs & Port Terminal')}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 block shadow-sm text-slate-700 dark:text-slate-300">
                  {phase.progress}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Stepper Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
        {milestonesData.map((m, idx) => {
          const isCompleted = m.status === 'completed';
          const isCurrent = m.status === 'current';
          const isDelayed = m.status === 'delayed';
          const isSelected = selectedIdx === idx;

          let cardBg = 'bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/60 text-slate-400';
          let iconColor = 'text-slate-400';
          
          if (isCompleted) {
            cardBg = 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400';
            iconColor = 'text-emerald-500';
          } else if (isCurrent) {
            cardBg = 'bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/40 text-[#73C7E6]';
            iconColor = 'text-[#73C7E6]';
          } else if (isDelayed) {
            cardBg = 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-500';
            iconColor = 'text-amber-500';
          }

          return (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all duration-300 ${cardBg} ${
                isSelected 
                  ? 'ring-2 ring-sky-500 scale-[1.03] shadow-md border-transparent bg-white dark:bg-slate-800' 
                  : 'hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[9px] font-mono font-black uppercase opacity-60">Step {idx + 1}</span>
                <span className={iconColor}>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {isCurrent && <Ship className="w-3.5 h-3.5 animate-pulse" />}
                  {isDelayed && <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />}
                  {m.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                </span>
              </div>
              <div className="mt-2">
                <p className="text-[10px] font-black uppercase tracking-tight line-clamp-1">{m.name}</p>
                <p className="text-[9px] font-mono font-bold uppercase mt-0.5 opacity-80">
                  {isCompleted || isCurrent || isDelayed
                    ? m.actualDateLabel 
                    : m.expectedDateLabel
                  }
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Primary Graph & Detail HUD Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Recharts Milestone Comparison Plot */}
        <div className="lg:col-span-2 space-y-4">
          <div className="h-72 md:h-80 w-full bg-slate-50 dark:bg-slate-950/30 rounded-3xl p-4 md:p-6 border border-slate-100 dark:border-slate-800 relative">
            <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700 text-[9px] font-black uppercase tracking-wider text-slate-400 shadow-sm z-10 flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#73C7E6]" />
              {t('graph_clickable', 'Node-Clickable Plot')}
            </div>
            
            <div ref={chartContainerRef} className="w-full h-full min-h-[260px]">
              <ComposedChart
                width={dimensions.width}
                height={dimensions.height}
                data={chartData}
                margin={{ top: 15, right: 15, left: -25, bottom: 5 }}
                onClick={handleChartClick}
              >
                <defs>
                  <linearGradient id="expectedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.001}/>
                  </linearGradient>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#73C7E6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#73C7E6" stopOpacity={0.001}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ 
                    value: t('days_elapsed', 'Days Elapsed'), 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { fill: '#94A3B8', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' } 
                  }}
                />
                
                {/* Background Expected Area Chart */}
                {(filterMode === 'all' || filterMode === 'expected') && (
                  <Area 
                    type="monotone" 
                    dataKey="Expected Days" 
                    stroke="none" 
                    fill="url(#expectedGradient)"
                  />
                )}

                {/* Foreground Actual Area Chart */}
                {(filterMode === 'all' || filterMode === 'actual') && (
                  <Area 
                    type="monotone" 
                    dataKey="Actual Days" 
                    stroke="none" 
                    fill="url(#actualGradient)"
                    connectNulls={false}
                  />
                )}

                {/* Expected Path (dotted line) */}
                {(filterMode === 'all' || filterMode === 'expected') && (
                  <Line 
                    type="monotone" 
                    dataKey="Expected Days" 
                    stroke="#94A3B8" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={({ cx, cy, index }) => {
                      const isSelected = selectedIdx === index;
                      return (
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={isSelected ? 6 : 3.5} 
                          fill={isSelected ? '#64748B' : '#94A3B8'} 
                          stroke={isSelected ? '#F1F5F9' : 'none'}
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 6 }}
                  />
                )}

                {/* Actual Path (bold turquoise line) */}
                {(filterMode === 'all' || filterMode === 'actual') && (
                  <Line 
                    type="monotone" 
                    dataKey="Actual Days" 
                    stroke="#73C7E6" 
                    strokeWidth={3}
                    dot={({ cx, cy, payload, index }) => {
                      const isDelayed = payload.status === 'delayed';
                      const isSelected = selectedIdx === index;
                      return (
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={isSelected ? 7 : 5} 
                          fill={isDelayed ? '#F59E0B' : '#73C7E6'} 
                          stroke={isSelected ? (isDelayed ? '#FEF3C7' : '#E0F2FE') : 'none'} 
                          strokeWidth={isSelected ? 3 : 0} 
                        />
                      );
                    }}
                    activeDot={{ r: 7 }}
                    connectNulls={false}
                  />
                )}

                {/* Interactive Indicator pointer for selected index */}
                <ReferenceLine 
                  x={milestonesData[selectedIdx]?.name} 
                  stroke="#73C7E6" 
                  strokeWidth={1} 
                  strokeDasharray="3 3"
                />
              </ComposedChart>
            </div>
          </div>
          
          <div className="flex items-center justify-between px-2 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            <span>POL ({shipment.originCode})</span>
            <span>{t('ocean_route_transit', 'In-Transit Segment')}</span>
            <span>POD ({shipment.destinationCode})</span>
          </div>
        </div>

        {/* Selected Milestone Detail HUD Card */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 border border-slate-100 dark:border-slate-800/60 relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#73C7E6]/5 rounded-bl-[60px] pointer-events-none"></div>
          
          {/* Milestone Card Header */}
          <div className="mb-5">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#73C7E6] bg-sky-500/10 px-2.5 py-1 rounded-full">
              {selectedMilestone.phaseLabel}
            </span>
            <h4 className="text-lg font-black text-[#00243D] dark:text-white mt-3 uppercase tracking-tight">
              {selectedMilestone.name}
            </h4>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase mt-1">
              <Compass className="w-3.5 h-3.5" />
              <span>{selectedMilestone.coordinates}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            {selectedMilestone.description}
          </p>

          {/* Core Metrics */}
          <div className="space-y-4 pt-5 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{t('target_date', 'Target Date')}</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-[#00243D] dark:text-white">
                  {selectedMilestone.expectedDateLabel} (Day {selectedMilestone.expectedDay})
                </span>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{t('execution_date', 'Actual Execution')}</p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className={`w-3.5 h-3.5 ${selectedMilestone.actualDateLabel ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className="text-xs font-bold text-[#00243D] dark:text-white">
                  {selectedMilestone.actualDateLabel 
                    ? `${selectedMilestone.actualDateLabel} (Day ${selectedMilestone.actualDay})`
                    : t('upcoming_scheduled', 'Scheduled / Upcoming')
                  }
                </span>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{t('schedule_deviation', 'Schedule Variance')}</p>
              <div className="mt-1">
                {selectedMilestone.status === 'delayed' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    +2 {t('days_delayed', 'Days Deviation')}
                  </span>
                ) : selectedMilestone.status === 'completed' || selectedMilestone.status === 'current' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {t('on_schedule', 'On Schedule')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full">
                    - {t('variance_pending', 'Pending Arrival')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneProgressTracker;
