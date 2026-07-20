import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Shipment, ShipmentStatus } from '../types';

interface ShipmentMapProps {
  shipment: Shipment;
}

interface LocationCoords {
  lat: number;
  lng: number;
}

// Coordinates dictionary for major hubs
const CITY_COORDINATES: Record<string, LocationCoords> = {
  'DEL': { lat: 28.5562, lng: 77.1000 },     // New Delhi
  'FRA': { lat: 50.0379, lng: 8.5622 },      // Frankfurt
  'SIN': { lat: 1.3521, lng: 103.8198 },     // Singapore
  'LAX': { lat: 33.9416, lng: -118.4085 },   // Los Angeles
  'PVG': { lat: 31.1443, lng: 121.8053 },    // Shanghai
  'LHR': { lat: 51.4700, lng: -0.4543 },     // London
  'JFK': { lat: 40.6413, lng: -73.7781 },    // New York
  'NRT': { lat: 35.7720, lng: 140.3929 },    // Tokyo
};

// Weather anomalies
interface WeatherCell {
  id: string;
  lat: number;
  lng: number;
  intensity: 'low' | 'medium' | 'high';
  type: 'storm' | 'swell' | 'clear';
  name: string;
}

const WEATHER_CELLS: WeatherCell[] = [
  { id: 'cell-1', lat: 35.0, lng: -145.0, intensity: 'high', type: 'storm', name: 'Pacific Cyclone Epsilon' },
  { id: 'cell-2', lat: 42.0, lng: -45.0, intensity: 'medium', type: 'swell', name: 'Atlantic Swell Alpha' },
  { id: 'cell-3', lat: 15.0, lng: 60.0, intensity: 'high', type: 'storm', name: 'Arabian Sea Gale' },
  { id: 'cell-4', lat: -10.0, lng: 115.0, intensity: 'low', type: 'swell', name: 'Java Trench Suture' }
];

export const getCityCoordinates = (cityCode: string, cityName: string): LocationCoords => {
  const code = cityCode.toUpperCase().trim();
  if (CITY_COORDINATES[code]) {
    return CITY_COORDINATES[code];
  }
  
  // Deterministic hashing fallback
  let hash = 0;
  for (let i = 0; i < cityName.length; i++) {
    hash = cityName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const lat = (Math.abs(hash % 100) - 50); // -50 to +50
  const lng = (Math.abs((hash >> 8) % 320) - 160); // -160 to +160
  return { lat, lng };
};

// Progress value mapping for statuses
const STATUS_PROGRESS: Record<ShipmentStatus, number> = {
  'Pending': 0,
  'Loading': 5,
  'At Sea': 45,
  'Awaiting Customs': 80,
  'Customs Clearance': 85,
  'Out for Delivery': 95,
  'Delivered': 100,
  'Delayed': 55,
  'Exception': 35
};

const ShipmentMap: React.FC<ShipmentMapProps> = ({ shipment }) => {
  // Determine if air shipment
  const isAirMode = useMemo(() => {
    const name = shipment.vesselName.toLowerCase();
    return name.includes('aero') || name.includes('express');
  }, [shipment.vesselName]);

  // Initial progress based on status
  const defaultProgress = useMemo(() => {
    return STATUS_PROGRESS[shipment.status] ?? 45;
  }, [shipment.status]);

  const [progress, setProgress] = useState<number>(defaultProgress);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showWeather, setShowWeather] = useState<boolean>(true);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  
  // Get origin & destination coordinates
  const originCoords = useMemo(() => {
    return getCityCoordinates(shipment.originCode, shipment.origin);
  }, [shipment.originCode, shipment.origin]);

  const destCoords = useMemo(() => {
    return getCityCoordinates(shipment.destinationCode, shipment.destination);
  }, [shipment.destinationCode, shipment.destination]);

  // Handle simulation playback
  useEffect(() => {
    setProgress(defaultProgress);
    addTelemetryLog(`Transponder established. Target: ${shipment.id}. Mode: ${isAirMode ? 'Air Freight' : 'Ocean Vessel'}.`);
  }, [shipment.id, defaultProgress, isAirMode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setIsPlaying(false);
            addTelemetryLog(`Vessel reached destination: ${shipment.destinationCode}. Telemetry complete.`);
            return 100;
          }
          const next = p + 1;
          if (next % 10 === 0) {
            addTelemetryLog(`Telemetry Ping: Progress ${next}% | Transponder strength 100%`);
          }
          return next;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [telemetryLogs]);

  const addTelemetryLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTelemetryLogs(prev => [...prev, `[${timestamp}] ${msg}`].slice(-15));
  };

  // SVG coordinate projections (bounds: 800 width, 400 height)
  const width = 800;
  const height = 400;

  const project = (coords: LocationCoords) => {
    // Equirectangular projection
    const x = ((coords.lng + 180) / 360) * width;
    const y = ((90 - coords.lat) / 180) * height;
    return { x, y };
  };

  const p0 = useMemo(() => project(originCoords), [originCoords]);
  const p2 = useMemo(() => project(destCoords), [destCoords]);

  // Control point for a beautiful arc (Quadratic Bézier curve)
  const p1 = useMemo(() => {
    const mx = (p0.x + p2.x) / 2;
    const my = (p0.y + p2.y) / 2;
    
    // Perpendicular vector offset to form a nice curve upwards
    const dx = p2.x - p0.x;
    const dy = p2.y - p0.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Higher curve for longer distances
    const offsetScale = Math.min(0.25, 80 / dist);
    const ox = -dy * offsetScale;
    const oy = dx * offsetScale;
    
    // Ensure the arc goes slightly upwards/northbound
    return {
      x: mx + ox,
      y: my - Math.abs(oy) - 20
    };
  }, [p0, p2]);

  // Calculate current point on Bézier curve
  const currentPos = useMemo(() => {
    const t = progress / 100;
    // B(t) = (1-t)^2 * P0 + 2*(1-t)*t * P1 + t^2 * P2
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    return { x, y };
  }, [progress, p0, p1, p2]);

  // Calculate tangent for heading rotation
  const headingAngle = useMemo(() => {
    const t = progress / 100;
    // B'(t) = 2*(1-t)*(P1 - P0) + 2*t*(P2 - P1)
    const tx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const ty = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    const angleRad = Math.atan2(ty, tx);
    return (angleRad * 180) / Math.PI;
  }, [progress, p0, p1, p2]);

  // Current calculated geographical Lat/Lng
  const currentGeographicCoords = useMemo(() => {
    const t = progress / 100;
    const lat = originCoords.lat + t * (destCoords.lat - originCoords.lat);
    const lng = originCoords.lng + t * (destCoords.lng - originCoords.lng);
    return { lat, lng };
  }, [progress, originCoords, destCoords]);

  // Path data string
  const bezierPathData = `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`;

  // Handle manual progress slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setProgress(val);
    if (val === 0) {
      addTelemetryLog(`Manual recalibration: Reset to departure port (${shipment.originCode})`);
    } else if (val === 100) {
      addTelemetryLog(`Manual recalibration: Reset to destination port (${shipment.destinationCode})`);
    } else {
      addTelemetryLog(`Manual recalibration: Segment location modified to ${val}% in transit`);
    }
  };

  return (
    <div id="shipment-map-card" className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6 md:p-10 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-black text-[#00243D] dark:text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#73C7E6] rounded-full"></span>
            Route Tracking & Telemetry
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Real-time geospatial plotting from {shipment.origin} ({shipment.originCode}) to {shipment.destination} ({shipment.destinationCode})
          </p>
        </div>
        
        {/* Pulsing state */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 px-3 rounded-full border border-emerald-100 dark:border-emerald-900/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Transponder Live
            </span>
          </div>
          {isAirMode ? (
            <span className="bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 p-1 px-2.5 rounded-full font-bold text-[10px] uppercase">
              ✈️ Air Freight
            </span>
          ) : (
            <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 p-1 px-2.5 rounded-full font-bold text-[10px] uppercase">
              🚢 Ocean Cargo
            </span>
          )}
        </div>
      </div>

      {/* Map stage wrapper */}
      <div className="relative w-full aspect-[2/1] bg-slate-950 rounded-3xl overflow-hidden shadow-inner border border-slate-800">
        
        {/* Underlay Map Image: Equirectangular Projection */}
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/1/15/World_map_blank_without_borders.svg" 
          alt="World Map Grid"
          className="absolute inset-0 w-full h-full object-fill opacity-20 pointer-events-none select-none filter invert contrast-[1.4] brightness-[0.7]"
          referrerPolicy="no-referrer"
        />

        {/* Latitude / Longitude lines */}
        {showGrid && (
          <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
            {/* Horizontal Lat lines */}
            <line x1="0" y1="100" x2="800" y2="100" stroke="#FFFFFF" strokeDasharray="4 4" strokeWidth="1" />
            <line x1="0" y1="200" x2="800" y2="200" stroke="#FFFFFF" strokeDasharray="4 4" strokeWidth="1" />
            <line x1="0" y1="300" x2="800" y2="300" stroke="#FFFFFF" strokeDasharray="4 4" strokeWidth="1" />
            
            {/* Vertical Lng lines */}
            <line x1="200" y1="0" x2="200" y2="400" stroke="#FFFFFF" strokeDasharray="4 4" strokeWidth="1" />
            <line x1="400" y1="0" x2="400" y2="400" stroke="#FFFFFF" strokeDasharray="4 4" strokeWidth="1" />
            <line x1="600" y1="0" x2="600" y2="400" stroke="#FFFFFF" strokeDasharray="4 4" strokeWidth="1" />

            {/* Labels */}
            <text x="5" y="112" fill="#FFFFFF" className="text-[8px] font-mono select-none">30°N</text>
            <text x="5" y="212" fill="#FFFFFF" className="text-[8px] font-mono select-none">0° EQ</text>
            <text x="5" y="312" fill="#FFFFFF" className="text-[8px] font-mono select-none">30°S</text>
            <text x="185" y="392" fill="#FFFFFF" className="text-[8px] font-mono select-none">90°W</text>
            <text x="385" y="392" fill="#FFFFFF" className="text-[8px] font-mono select-none">0° MER</text>
            <text x="585" y="392" fill="#FFFFFF" className="text-[8px] font-mono select-none">90°E</text>
          </svg>
        )}

        {/* Active Weather anomalies */}
        {showWeather && (
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            {WEATHER_CELLS.map((cell) => {
              const { x, y } = project(cell);
              return (
                <div 
                  key={cell.id} 
                  style={{ left: `${(x / width) * 100}%`, top: `${(y / height) * 100}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group pointer-events-auto cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center animate-spin ${
                    cell.intensity === 'high' 
                      ? 'border-red-500/30 bg-red-500/5 ring-4 ring-red-500/10' 
                      : 'border-yellow-500/30 bg-yellow-500/5 ring-4 ring-yellow-500/10'
                  }`} style={{ animationDuration: '6s' }}>
                    <span className="text-xs">🌀</span>
                  </div>
                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block bg-slate-900 border border-slate-700 p-2 rounded-xl text-[9px] font-mono text-white shadow-xl z-50 whitespace-nowrap">
                    <p className="font-bold text-[#73C7E6]">{cell.name}</p>
                    <p className="text-slate-300">Severity: {cell.intensity.toUpperCase()}</p>
                    <p className="text-slate-400">Lat: {cell.lat.toFixed(1)}° Lng: {cell.lng.toFixed(1)}°</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Mapping SVG Overlay */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Geodesic Track line background */}
          <path 
            d={bezierPathData} 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
          />

          {/* Glowing Track line active */}
          <path 
            id="shipping-track-active"
            d={bezierPathData} 
            fill="none" 
            stroke={isAirMode ? "#38bdf8" : "#fbbf24"} 
            strokeWidth="2.5" 
            strokeLinecap="round"
            className="opacity-70"
          />

          {/* Flow indicator animation */}
          <path 
            d={bezierPathData} 
            fill="none" 
            stroke={isAirMode ? "#bae6fd" : "#fef08a"} 
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeDasharray="10 20"
            className="opacity-90"
            style={{
              strokeDashoffset: isPlaying ? '150' : '0',
              animation: 'trackFlow 4s linear infinite'
            }}
          />

          {/* Origin Hub Marker */}
          <g transform={`translate(${p0.x}, ${p0.y})`}>
            <circle r="9" fill="#0d0d0d" stroke="#73C7E6" strokeWidth="2.5" />
            <circle r="4" fill="#00243D" />
            <text y="-14" textAnchor="middle" fill="#FFFFFF" className="text-[10px] font-mono font-black tracking-wider shadow-sm select-none">
              {shipment.originCode}
            </text>
          </g>

          {/* Destination Hub Marker */}
          <g transform={`translate(${p2.x}, ${p2.y})`}>
            <circle r="9" fill="#0d0d0d" stroke="#10b981" strokeWidth="2.5" />
            <circle r="4" fill="#34d399" />
            <text y="-14" textAnchor="middle" fill="#FFFFFF" className="text-[10px] font-mono font-black tracking-wider shadow-sm select-none">
              {shipment.destinationCode}
            </text>
          </g>

          {/* Cruising Vessel Avatar (glowing dot + rotational indicator icon) */}
          <g transform={`translate(${currentPos.x}, ${currentPos.y}) rotate(${headingAngle})`}>
            {/* Outer Glow */}
            <circle r="18" fill={isAirMode ? "rgba(56,189,248,0.2)" : "rgba(251,191,36,0.2)"} className="animate-ping" style={{ animationDuration: '2.5s' }} />
            <circle r="12" fill="#1a1a1a" stroke={isAirMode ? "#38bdf8" : "#fbbf24"} strokeWidth="2.5" className="shadow-lg" />
            
            {/* Vector Directional vessel arrow/plane */}
            {isAirMode ? (
              // Plane Vector
              <path 
                d="M-4,-1 L-1,-1 L-1,-6 L1,-6 L1,-1 L4,-1 L4,1 L1,1 L1,4 L2.5,5 L2.5,6 L0,5 L-2.5,6 L-2.5,5 L-1,4 L-1,1 L-4,1 Z" 
                fill="#ffffff" 
                transform="scale(1.2)" 
              />
            ) : (
              // Cargo Ship Vector
              <path 
                d="M-5,-1.5 L0,-6 L5,-1.5 L5,5 L-5,5 Z" 
                fill="#ffffff" 
                transform="rotate(90) scale(1.1)" 
              />
            )}
          </g>
        </svg>

        {/* Position coordinates HUD overlay */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl font-mono text-[9px] text-slate-300 shadow-xl space-y-1 select-none pointer-events-none">
          <p className="font-bold text-[10px] text-[#73C7E6] uppercase tracking-wider mb-1">🛰️ Active GPS</p>
          <div className="flex justify-between gap-6">
            <span>LATITUDE</span>
            <span className="text-white font-black">{Math.abs(currentGeographicCoords.lat).toFixed(4)}° {currentGeographicCoords.lat >= 0 ? 'N' : 'S'}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span>LONGITUDE</span>
            <span className="text-white font-black">{Math.abs(currentGeographicCoords.lng).toFixed(4)}° {currentGeographicCoords.lng >= 0 ? 'E' : 'W'}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span>HEADING</span>
            <span className="text-white font-black">{Math.round(headingAngle < 0 ? 360 + headingAngle : headingAngle)}° {headingAngle >= -45 && headingAngle < 45 ? 'ENE' : headingAngle >= 45 && headingAngle < 135 ? 'SSE' : headingAngle >= 135 || headingAngle < -135 ? 'WSW' : 'NNW'}</span>
          </div>
        </div>

        {/* Distance summary HUD overlay */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl font-mono text-[9px] text-slate-300 shadow-xl space-y-1 select-none pointer-events-none text-right">
          <p className="font-bold text-[10px] text-[#73C7E6] uppercase tracking-wider mb-1">📦 Logistical Progress</p>
          <p>PROGRESS: <span className="text-white font-black">{progress}%</span></p>
          <p>MODE: <span className="text-white font-black">{isAirMode ? 'EXPEDITE AIR' : 'SEA TRANSIT'}</span></p>
          <p>CRUISE: <span className="text-white font-black">{isAirMode ? '510 MPH' : '22.5 KTS'}</span></p>
        </div>
      </div>

      {/* Embedded Animations */}
      <style>{`
        @keyframes trackFlow {
          0% {
            stroke-dashoffset: 60;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      {/* Control panel & Live Telemetry log stream */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        
        {/* Controls block */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Simulation Speed Controller</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isPlaying 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20' 
                      : 'bg-[#73C7E6] hover:bg-[#5bb2cf] text-[#00243D] shadow-md shadow-sky-500/20'
                  }`}
                >
                  {isPlaying ? '⏸️ Pause Sim' : '▶️ Play Sim'}
                </button>
                <button 
                  onClick={() => {
                    setProgress(defaultProgress);
                    setIsPlaying(false);
                    addTelemetryLog('Recalibrated transponder coordinates back to actual carrier data.');
                  }}
                  className="px-4 py-2 rounded-xl text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  🔄 Reset Coordinates
                </button>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                <span>PORT OF LOADING ({shipment.originCode})</span>
                <span className="text-[#73C7E6] font-black">{progress}% TRANSIT</span>
                <span>PORT OF DISCHARGE ({shipment.destinationCode})</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress} 
                onChange={handleSliderChange}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#73C7E6]"
              />
            </div>

            {/* Interactive toggles */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => setShowWeather(!showWeather)}
                className={`p-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                  showWeather 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                🌀 Weather Overlay: {showWeather ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                  showGrid 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                🌐 Navigation Grid: {showGrid ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Log feed */}
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col h-[180px] md:h-auto min-h-[160px]">
          <span className="text-[10px] font-mono font-black text-[#73C7E6] uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#73C7E6] animate-ping"></span>
            Transponder Telemetry Feed
          </span>
          <div 
            ref={logsContainerRef}
            className="flex-1 overflow-y-auto font-mono text-[9px] text-slate-400 space-y-1.5 pr-2 scrolling-touch"
          >
            {telemetryLogs.length === 0 ? (
              <p className="italic text-slate-600">Initializing transponder connection...</p>
            ) : (
              telemetryLogs.map((log, index) => (
                <p key={index} className="leading-tight animate-fadeIn">
                  {log}
                </p>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShipmentMap;
