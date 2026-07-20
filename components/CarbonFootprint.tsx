import React, { useState, useMemo, useEffect } from 'react';
import { Shipment } from '../types';
import { Leaf, Globe, ShieldCheck, Info, TrendingDown, Ship, Plane, Truck } from 'lucide-react';
import { useLanguage } from '../src/context/LanguageContext';

interface CarbonFootprintProps {
  shipment: Shipment;
}

// Coordinate & distance calculation helpers
interface LocationCoords {
  lat: number;
  lng: number;
}

const CITY_COORDINATES: Record<string, LocationCoords> = {
  'DEL': { lat: 28.5562, lng: 77.1000 },
  'FRA': { lat: 50.0379, lng: 8.5622 },
  'SIN': { lat: 1.3521, lng: 103.8198 },
  'LAX': { lat: 33.9416, lng: -118.4085 },
  'PVG': { lat: 31.1443, lng: 121.8053 },
  'LHR': { lat: 51.4700, lng: -0.4543 },
  'JFK': { lat: 40.6413, lng: -73.7781 },
  'NRT': { lat: 35.7720, lng: 140.3929 },
};

const getCoords = (cityCode: string, cityName: string): LocationCoords => {
  const code = cityCode.toUpperCase().trim();
  if (CITY_COORDINATES[code]) {
    return CITY_COORDINATES[code];
  }
  
  // Fallback deterministic hashing
  let hash = 0;
  for (let i = 0; i < cityName.length; i++) {
    hash = cityName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const lat = (Math.abs(hash % 100) - 50);
  const lng = (Math.abs((hash >> 8) % 320) - 160);
  return { lat, lng };
};

const calculateDistanceKm = (c1: LocationCoords, c2: LocationCoords): number => {
  const R = 6371; // Earth radius in km
  const dLat = (c2.lat - c1.lat) * Math.PI / 180;
  const dLng = (c2.lng - c1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Standard logistics emission factors: kg CO2 per tonne-kilometer (t-km)
// Ref: GHG Protocol / GLEC Framework / Clean Cargo WG
const EMISSION_FACTORS = {
  ocean: 0.012, // Ocean container ship
  air: 0.550,   // Air freight
  rail: 0.022,  // Rail
  road: 0.080,  // Road truck
};

const CarbonFootprint: React.FC<CarbonFootprintProps> = ({ shipment }) => {
  const { t } = useLanguage();
  // Parse weight safely from string to metric tonnes
  const cargoWeightTonnes = useMemo(() => {
    const cleaned = shipment.weight.toLowerCase().replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 15.0; // fallback default
    if (cleaned.includes('kg')) {
      return num / 1000;
    }
    return num;
  }, [shipment.weight]);

  // Determine distance
  const distanceKm = useMemo(() => {
    const o = getCoords(shipment.originCode, shipment.origin);
    const d = getCoords(shipment.destinationCode, shipment.destination);
    return calculateDistanceKm(o, d);
  }, [shipment.originCode, shipment.origin, shipment.destinationCode, shipment.destination]);

  // Determine if it is air or ocean transit
  const isAirMode = useMemo(() => {
    const name = shipment.vesselName.toLowerCase();
    return name.includes('aero') || name.includes('express');
  }, [shipment.vesselName]);

  const activeMode = isAirMode ? 'air' : 'ocean';

  // Persistence of ECO delivery
  const [isEcoSelected, setIsEcoSelected] = useState<boolean>(() => {
    return localStorage.getItem(`maersk_eco_delivery_${shipment.id}`) === 'true';
  });

  // Keep state in sync if shipment changes
  useEffect(() => {
    setIsEcoSelected(localStorage.getItem(`maersk_eco_delivery_${shipment.id}`) === 'true');
  }, [shipment.id]);

  const handleEcoToggle = () => {
    const nextState = !isEcoSelected;
    setIsEcoSelected(nextState);
    localStorage.setItem(`maersk_eco_delivery_${shipment.id}`, String(nextState));
  };

  // Calculations
  const tkm = cargoWeightTonnes * distanceKm;
  
  // Baseline CO2 calculations (in kilograms)
  const baselineOceanCo2 = tkm * EMISSION_FACTORS.ocean;
  const baselineAirCo2 = tkm * EMISSION_FACTORS.air;
  const baselineRailCo2 = tkm * EMISSION_FACTORS.rail;
  const baselineRoadCo2 = tkm * EMISSION_FACTORS.road;

  const currentBaselineCo2 = activeMode === 'air' ? baselineAirCo2 : baselineOceanCo2;

  // ECO Delivery reduces emissions by 85% (uses sustainable biofuels)
  const co2ReductionRate = 0.85; 
  const currentActualCo2 = isEcoSelected 
    ? currentBaselineCo2 * (1 - co2ReductionRate) 
    : currentBaselineCo2;

  const co2Saved = isEcoSelected ? currentBaselineCo2 * co2ReductionRate : 0;

  // Format helper to display as kg or tonnes
  const formatCo2 = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(2)} mt`;
    }
    return `${Math.round(kg)} kg`;
  };

  return (
    <div id="carbon-footprint-card" className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 md:p-10 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-sm font-black text-[#00243D] dark:text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
            {t('decarbonization_analytics', 'Decarbonization & CO2 Analytics')}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {t('ghg_protocol_tracking', 'Standard GHG protocol emissions tracking for Maersk Line voyage')}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-xl">
          <Leaf className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {t('verified_climate_data', 'Verified Climate Data')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Core metrics panel */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-850 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{t('calculated_route', 'Calculated Route Distance')}</p>
                <p className="text-2xl font-black text-[#00243D] dark:text-white tracking-tight mt-0.5">
                  {Math.round(distanceKm).toLocaleString()} km
                </p>
              </div>
              <Globe className="w-5 h-5 text-slate-400" />
            </div>

            <div>
              <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{t('total_weight', 'Total Weight')}</p>
              <p className="text-2xl font-black text-[#00243D] dark:text-white tracking-tight mt-0.5">
                {cargoWeightTonnes.toFixed(1)} Tonnes
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{t('estimated_co2', 'Estimated CO₂ Emissions')}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-4xl font-black tracking-tight ${isEcoSelected ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                  {formatCo2(currentActualCo2)}
                </span>
                <span className="text-xs font-bold text-slate-400">CO2e</span>
              </div>
              {isEcoSelected && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {t('biofuel_active', 'Biofuel emission reduction active (-85%)')}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <p className="text-[9px] text-slate-500 leading-normal">
              {t('glec_info', 'Based on GLEC Framework. Actual emissions may vary with vessel size, payload, and fuel specification.')}
            </p>
          </div>
        </div>

        {/* Modal-like Compare View & Eco Delivery Option */}
        <div className="lg:col-span-7 space-y-6">
          {/* Eco Delivery Card Toggle */}
          <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden ${
            isEcoSelected 
              ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-300 dark:border-emerald-800' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
            
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isEcoSelected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#00243D] dark:text-white uppercase tracking-wider">
                    {t('maersk_eco_delivery', 'Maersk ECO Delivery')}
                  </h4>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black tracking-wider uppercase mt-0.5">
                    {t('biofuel_sub_header', 'Sustainable Second-Gen Biofuel')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEcoToggle}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative focus:outline-none ${
                  isEcoSelected ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                  isEcoSelected ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {t('biofuel_description', 'Switch this shipment to Maersk ECO Delivery to replace fossil fuel with certified green biofuel. Saves approximately 85% of standard carbon output.')}
            </p>

            {isEcoSelected ? (
              <div className="bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/40 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    {t('certificate_issued', 'CO2 Offset Certificate Issued')}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-mono font-bold text-slate-400 uppercase">{t('saved_carbon', 'Saved Carbon')}</p>
                  <p className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400">
                    -{formatCo2(co2Saved)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('select_biofuel_desc', 'Select biofuel to reduce environmental impact')}
                </span>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  -{formatCo2(currentBaselineCo2 * co2ReductionRate)} est.
                </span>
              </div>
            )}
          </div>

          {/* Logistics Comparison Chart */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t('voyage_mode_comparison', 'Voyage Mode Comparison (Total CO₂ Emission)')}
            </h4>

            <div className="space-y-3">
              {/* Ocean Option */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-[#00243D] dark:text-white">
                    <Ship className="w-3.5 h-3.5 text-slate-400" />
                    {t('ocean_voyage', 'Ocean (Maersk Voyage)')}
                  </span>
                  <span className="font-bold">
                    {formatCo2(baselineOceanCo2)}
                    {activeMode === 'ocean' && <span className="text-[9px] text-[#73C7E6] font-black uppercase ml-1.5">({t('current_mode', 'Current')})</span>}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    className={`h-full transition-all duration-1000 ${activeMode === 'ocean' ? (isEcoSelected ? 'bg-emerald-500' : 'bg-[#73C7E6]') : 'bg-slate-300 dark:bg-slate-700'}`}
                    style={{ width: `${Math.min(100, Math.max(2, (baselineOceanCo2 / baselineAirCo2) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Rail Option */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-[#00243D] dark:text-white">
                    <span className="text-slate-400">🚞</span>
                    {t('intermodal_rail', 'Intermodal Rail')}
                  </span>
                  <span className="font-bold">{formatCo2(baselineRailCo2)}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(2, (baselineRailCo2 / baselineAirCo2) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Road Option */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-[#00243D] dark:text-white">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    {t('overland_road', 'Overland Road')}
                  </span>
                  <span className="font-bold">{formatCo2(baselineRoadCo2)}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(2, (baselineRoadCo2 / baselineAirCo2) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Air Option */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-[#00243D] dark:text-white">
                    <Plane className="w-3.5 h-3.5 text-slate-400" />
                    {t('express_air', 'Express Air Freight')}
                  </span>
                  <span className="font-bold">
                    {formatCo2(baselineAirCo2)}
                    {activeMode === 'air' && <span className="text-[9px] text-[#73C7E6] font-black uppercase ml-1.5">({t('current_mode', 'Current')})</span>}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${activeMode === 'air' ? (isEcoSelected ? 'bg-emerald-500' : 'bg-[#73C7E6]') : 'bg-slate-400 dark:bg-slate-600'}`}
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonFootprint;
