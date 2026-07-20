
export type ShipmentStatus = 
  | 'Pending' 
  | 'Loading' 
  | 'At Sea' 
  | 'Awaiting Customs' 
  | 'Customs Clearance' 
  | 'Out for Delivery' 
  | 'Delivered' 
  | 'Delayed' 
  | 'Exception';

export type BusinessRole = 'Customer' | 'Agent';

export interface ShipmentEvent {
  date: string;
  location: string;
  description: string;
  completed: boolean;
}

export interface Shipment {
  id: string;
  vesselName: string;
  voyageDirection?: string;
  paymentReference?: string;
  placeOfReceipt?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  placeOfDelivery?: string;
  origin: string;
  destination: string;
  originCode: string;
  destinationCode: string;
  status: ShipmentStatus;
  delayReason?: string;
  delayTime?: string; 
  estimatedArrival: string;
  departureDate: string;
  containerCount: number;
  weight: string; 
  contents: string;
  trackingHistory: ShipmentEvent[];
  etaAlertsEnabled?: boolean;
  isAffectedShipment?: boolean;
  appliedRuleId?: string;
  ruleEvaluationTimestamp?: string;
  delayDaysCalculated?: number;
  originalEstimatedArrival?: string;
}

export interface User {
  email: string;
  name: string;
  company: string;
  role: BusinessRole;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  targetStatus: ShipmentStatus;
  delayReason: string;
  delayDays: string;
  isActive: boolean;
  originPort?: string;
  destinationPort?: string;
  priority?: 'High' | 'Medium' | 'Low';
  deployedAt?: number;
}
