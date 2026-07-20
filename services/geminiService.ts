
import { GoogleGenAI, Type } from "@google/genai";
import { Shipment, Rule } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getLogisticsAssistantResponse = async (
  query: string, 
  shipments: Shipment[],
  history: { role: 'user' | 'assistant', content: string }[]
) => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are the Maersk Global Logistics Assistant. Your job is to help customers track their Maersk container bookings and vessel locations.
    - Be professional, high-energy, and logistics-focused.
    - Reference Maersk-specific terms (Bookings, TEUs, Containerships, Terminal Operations, Bill of Lading).
    - If asked about a shipment, reference its Maersk Shipment ID, current status, and ETA.
    - Offer proactive optimization advice for supply chain disruptions.
    - Format responses with bold Maersk-themed Markdown.
    
    MAERSK SHIPMENT CONTEXT:
    ${JSON.stringify(shipments, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: query }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Our systems are temporarily busy. Please contact Maersk Global Support.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The Maersk AI engine is optimizing. Please try again or visit maersk.com.";
  }
};

const parseDelayDays = (delayDaysStr: string): number => {
  const match = delayDaysStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

const addDaysToDate = (dateStr: string, daysToAdd: number): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return dateStr;
  }
};

const getPriorityWeight = (p?: 'High' | 'Medium' | 'Low'): number => {
  switch (p) {
    case 'High': return 3;
    case 'Low': return 1;
    case 'Medium':
    default: return 2;
  }
};

const isRuleMatch = (shipment: Shipment, rule: Rule): boolean => {
  const matchOrigin = !rule.originPort || rule.originPort === 'All' || rule.originPort.toLowerCase() === shipment.origin.toLowerCase();
  const matchDestination = !rule.destinationPort || rule.destinationPort === 'All' || rule.destinationPort.toLowerCase() === shipment.destination.toLowerCase();
  
  if (rule.originPort && rule.originPort !== 'All' && rule.destinationPort && rule.destinationPort !== 'All') {
    return matchOrigin && matchDestination;
  }
  
  if (rule.originPort && rule.originPort !== 'All') {
    return matchOrigin;
  }
  
  if (rule.destinationPort && rule.destinationPort !== 'All') {
    return matchDestination;
  }
  
  // Secondary fallback: check if description mentions origin/destination names or codes
  const desc = rule.description.toLowerCase();
  const mentionsOrigin = desc.includes(shipment.origin.toLowerCase()) || 
                         (shipment.originCode && desc.includes(shipment.originCode.toLowerCase()));
  const mentionsDestination = desc.includes(shipment.destination.toLowerCase()) || 
                              (shipment.destinationCode && desc.includes(shipment.destinationCode.toLowerCase()));
  
  return mentionsOrigin || mentionsDestination;
};

export const applyRulesToShipments = async (shipments: Shipment[], activeRules: Rule[]): Promise<Shipment[]> => {
  console.log(`[RULE ENGINE] Deploying rule engine on ${shipments.length} shipments with ${activeRules.length} active rules.`);
  
  return shipments.map(shipment => {
    // We only evaluate shipments that are active (i.e. not Delivered)
    if (shipment.status === 'Delivered') {
      return shipment;
    }

    let evaluatedShipment = { ...shipment };

    // Set baseline state variables for idempotency if they don't exist yet
    if (!evaluatedShipment.originalEstimatedArrival) {
      evaluatedShipment.originalEstimatedArrival = shipment.estimatedArrival;
    }
    if (!(evaluatedShipment as any).originalStatus) {
      (evaluatedShipment as any).originalStatus = shipment.status;
    }
    if (shipment.delayReason && !(evaluatedShipment as any).originalDelayReason) {
      (evaluatedShipment as any).originalDelayReason = shipment.delayReason;
    }
    if (shipment.delayTime && !(evaluatedShipment as any).originalDelayTime) {
      (evaluatedShipment as any).originalDelayTime = shipment.delayTime;
    }

    // Filter all matching active rules
    const matchingRules = activeRules.filter(rule => isRuleMatch(evaluatedShipment, rule));

    if (matchingRules.length > 0) {
      // Find the highest-priority rule, breaking ties with deployment timestamp
      const bestRule = [...matchingRules].sort((a, b) => {
        const weightA = getPriorityWeight(a.priority);
        const weightB = getPriorityWeight(b.priority);
        
        if (weightA !== weightB) {
          return weightB - weightA; // Descending order of priority
        }
        
        const timeA = a.deployedAt || 0;
        const timeB = b.deployedAt || 0;
        return timeB - timeA; // Descending order of deployment timestamp (most recent first)
      })[0];

      const days = parseDelayDays(bestRule.delayDays);
      const originalEta = evaluatedShipment.originalEstimatedArrival || evaluatedShipment.estimatedArrival;
      const newEta = addDaysToDate(originalEta, days);

      evaluatedShipment.status = bestRule.targetStatus;
      evaluatedShipment.delayReason = bestRule.delayReason;
      evaluatedShipment.delayTime = bestRule.delayDays;
      evaluatedShipment.delayDaysCalculated = days;
      evaluatedShipment.estimatedArrival = newEta;
      evaluatedShipment.isAffectedShipment = true;
      evaluatedShipment.appliedRuleId = bestRule.id;
      evaluatedShipment.ruleEvaluationTimestamp = new Date().toISOString();

      // Clean tracking history of prior automation entries to avoid duplication
      evaluatedShipment.trackingHistory = (evaluatedShipment.trackingHistory || []).filter(
        event => !event.description.startsWith('[AUTOMATION ENG]')
      );

      // Log event into tracking history
      evaluatedShipment.trackingHistory.push({
        date: new Date().toISOString().split('T')[0],
        location: evaluatedShipment.originCode || 'Transit',
        description: `[AUTOMATION ENG] Policy "${bestRule.name}" (${bestRule.id}) triggered. Recalculated ETA: ${newEta} (+${days} delay days). Reason: ${bestRule.delayReason}.`,
        completed: true
      });
    } else {
      // Revert to original baseline if previously affected but no longer matching any active rules
      if (evaluatedShipment.isAffectedShipment) {
        evaluatedShipment.estimatedArrival = evaluatedShipment.originalEstimatedArrival || evaluatedShipment.estimatedArrival;
        evaluatedShipment.status = (evaluatedShipment as any).originalStatus || evaluatedShipment.status;
        evaluatedShipment.delayReason = (evaluatedShipment as any).originalDelayReason || undefined;
        evaluatedShipment.delayTime = (evaluatedShipment as any).originalDelayTime || undefined;
        evaluatedShipment.isAffectedShipment = false;
        evaluatedShipment.appliedRuleId = undefined;
        evaluatedShipment.ruleEvaluationTimestamp = undefined;
        evaluatedShipment.delayDaysCalculated = undefined;

        // Filter out old automation entries
        evaluatedShipment.trackingHistory = (evaluatedShipment.trackingHistory || []).filter(
          event => !event.description.startsWith('[AUTOMATION ENG]')
        );
      }
    }

    return evaluatedShipment;
  });
};
