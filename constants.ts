import { Shipment, ShipmentStatus } from './types';

export const COLORS = {
  maerskBlue: '#73C7E6',
  maerskDark: '#00243D',
  maerskGrey: '#5A6B7C',
};

const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// High-fidelity routes for global supply chain representation
const ROUTES = [
  { origin: 'New Delhi, India', originCode: 'DEL', destination: 'Frankfurt, Germany', destinationCode: 'FRA' },
  { origin: 'Singapore, SG', originCode: 'SIN', destination: 'Los Angeles, USA', destinationCode: 'LAX' },
  { origin: 'Shanghai, China', originCode: 'PVG', destination: 'London, UK', destinationCode: 'LHR' },
  { origin: 'New York, USA', originCode: 'JFK', destination: 'Tokyo, Japan', destinationCode: 'NRT' },
  { origin: 'Rotterdam, Netherlands', originCode: 'RTM', destination: 'Hamburg, Germany', destinationCode: 'HAM' },
  { origin: 'Mumbai, India', originCode: 'BOM', destination: 'Genoa, Italy', destinationCode: 'GOA' },
  { origin: 'Busan, South Korea', originCode: 'BUS', destination: 'Seattle, USA', destinationCode: 'SEA' },
  { origin: 'Sydney, Australia', originCode: 'SYD', destination: 'San Francisco, USA', destinationCode: 'SFO' },
  { origin: 'Dublin, Ireland', originCode: 'DUB', destination: 'Dubai, UAE', destinationCode: 'DXB' },
  { origin: 'Antwerp, Belgium', originCode: 'ANR', destination: 'Singapore, SG', destinationCode: 'SIN' },
  { origin: 'Santos, Brazil', originCode: 'SSZ', destination: 'Rotterdam, Netherlands', destinationCode: 'RTM' },
  { origin: 'Cape Town, South Africa', originCode: 'CPT', destination: 'Lisbon, Portugal', destinationCode: 'LIS' },
  { origin: 'Yokohama, Japan', originCode: 'YOK', destination: 'Vancouver, Canada', destinationCode: 'YVR' },
  { origin: 'Barcelona, Spain', originCode: 'BCN', destination: 'Miami, USA', destinationCode: 'MIA' }
];

const VESSELS = [
  'Maersk Mc-Kinney Moller', 'Maersk Edmonton', 'Maersk McKinney', 
  'Maersk Oceanic Pride', 'Maersk Rhine Explorer', 'Maersk Magellan', 
  'Maersk Altair', 'Maersk Hamburg', 'Maersk Seville', 
  'Maersk Gibraltar', 'Maersk Columbus', 'Maersk Transporter'
];

const STATUSES: ShipmentStatus[] = [
  'Pending', 'Loading', 'At Sea', 'Customs Clearance', 'Out for Delivery', 'Delivered', 'Delayed', 'Exception'
];

const CONTENTS_POOL = [
  'Industrial Machinery Parts', 'Automotive Electronics', 'High-Tech Semiconductors',
  'Solar Modules & Inverters', 'Electric Vehicle Batteries', 'Biopharmaceutical Staging',
  'Aerospace Components', 'Wind Turbine Bearings', 'Precision Lab Instrumentation',
  'Advanced Medical Imaging Equipment', 'Premium Textiles & Apparel', 'Telecommunication Relays'
];

const generateDiverseShipments = (count: number): Shipment[] => {
  return Array.from({ length: count }).map((_, i) => {
    const route = ROUTES[i % ROUTES.length];
    const vesselName = VESSELS[i % VESSELS.length];
    
    // Distribute statuses realistically
    let status: ShipmentStatus = STATUSES[i % STATUSES.length];
    // Slightly tweak specific status distributions to feel natural
    if (i % 15 === 0) status = 'Delayed';
    else if (i % 19 === 0) status = 'Exception';

    const departureDate = randomDate(new Date(2026, 3, 1), new Date(2026, 6, 15));
    const estimatedArrival = addDays(departureDate, Math.floor(Math.random() * 15) + 12);
    
    const voyageDirection = `${Math.floor(Math.random() * 800 + 100)}${['N', 'S', 'E', 'W'][i % 4]}`;
    const paymentReference = `${Math.floor(Math.random() * 9000000000 + 1000000000)} /${Math.floor(Math.random() * 90000000 + 10000000)}`;
    const containerCount = Math.floor(Math.random() * 24) + 1;
    const weight = `${(Math.random() * 120000 + 3000).toLocaleString(undefined, { maximumFractionDigits: 0 })} kg`;
    const contents = CONTENTS_POOL[i % CONTENTS_POOL.length];

    // Build rich, coherent tracking history corresponding to the status
    const trackingHistory = [
      { date: departureDate, location: route.origin, description: 'Booking received & supply chain coordination completed.', completed: true }
    ];

    if (status !== 'Pending') {
      trackingHistory.push({
        date: addDays(departureDate, 2),
        location: route.origin,
        description: 'Empty container dispatched to shipper and stuffed successfully.',
        completed: true
      });
    }
    if (['Loading', 'At Sea', 'Customs Clearance', 'Out for Delivery', 'Delivered', 'Delayed', 'Exception'].includes(status)) {
      trackingHistory.push({
        date: addDays(departureDate, 4),
        location: route.origin,
        description: 'Vessel loading completed. Container secured on board.',
        completed: true
      });
    }
    if (['At Sea', 'Customs Clearance', 'Out for Delivery', 'Delivered', 'Delayed', 'Exception'].includes(status)) {
      trackingHistory.push({
        date: addDays(departureDate, 6),
        location: 'Mid-Atlantic Transit',
        description: 'Vessel en route. Ocean conditions favorable. Telemetry synced.',
        completed: true
      });
    }
    if (['Customs Clearance', 'Out for Delivery', 'Delivered'].includes(status)) {
      trackingHistory.push({
        date: addDays(estimatedArrival, -3),
        location: route.destination,
        description: 'Vessel arrived at destination port. Discharge operations completed.',
        completed: true
      });
      trackingHistory.push({
        date: addDays(estimatedArrival, -2),
        location: route.destination,
        description: 'Customs inspections cleared. Import duty processed.',
        completed: true
      });
    }
    if (status === 'Out for Delivery' || status === 'Delivered') {
      trackingHistory.push({
        date: addDays(estimatedArrival, -1),
        location: route.destination,
        description: 'Cargo picked up by last-mile carrier. Final delivery scheduled.',
        completed: true
      });
    }
    if (status === 'Delivered') {
      trackingHistory.push({
        date: estimatedArrival,
        location: route.destination,
        description: 'Delivered to consignee warehouse. Cargo inspection signed off.',
        completed: true
      });
    }

    const shipment: Shipment = {
      id: String(6500000000 + 102000 + i),
      vesselName,
      voyageDirection,
      paymentReference,
      placeOfReceipt: route.origin,
      portOfLoading: route.origin,
      portOfDischarge: route.destination,
      placeOfDelivery: route.destination,
      origin: route.origin,
      originCode: route.originCode,
      destination: route.destination,
      destinationCode: route.destinationCode,
      status,
      departureDate,
      estimatedArrival,
      containerCount,
      weight,
      contents,
      trackingHistory
    };

    if (status === 'Delayed') {
      shipment.delayReason = 'Severe Port Terminal Congestion at Discharge Hub';
      shipment.delayTime = '48 Hours';
    } else if (status === 'Exception') {
      shipment.delayReason = 'International Customs Regulatory Hold';
      shipment.delayTime = '4 Days';
    }

    return shipment;
  });
};

export const SPECIAL_SHIPMENT_MAERSK: Shipment = {
  id: '2601373963',
  vesselName: 'MAERSK VIRGINIA(HK)',
  voyageDirection: '629S',
  paymentReference: '7553319001 /10141358',
  placeOfReceipt: 'Gdansk, PL',
  portOfLoading: 'Gdansk, PL',
  portOfDischarge: 'Valencia, ES',
  placeOfDelivery: 'Valencia, ES',
  origin: 'Gdansk, Poland',
  originCode: 'GDN',
  destination: 'Valencia, Spain',
  destinationCode: 'VLC',
  status: 'Loading',
  departureDate: '2026-07-19',
  estimatedArrival: '2026-08-17',
  containerCount: 12,
  weight: '24,500 kg',
  contents: 'Industrial Machinery Parts',
  trackingHistory: [
    { date: '2026-07-14', location: 'Gdansk, PL', description: 'Customs inspections cleared & container staging completed', completed: true },
    { date: '2026-07-12', location: 'Gdansk, PL', description: 'Booking received and empty containers dispatched to shipper', completed: true }
  ]
};

export const MOCK_SHIPMENTS: Shipment[] = [
  SPECIAL_SHIPMENT_MAERSK,
  ...generateDiverseShipments(99)
];
