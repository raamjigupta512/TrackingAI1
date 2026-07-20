import React, { useState, useMemo, useEffect } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import ShipmentMap from './ShipmentMap';
import { VoyageProgressTracker } from './VoyageProgressTracker';
import { Clock, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { useLanguage } from '../src/context/LanguageContext';

interface TrackingDetailProps {
  shipment: Shipment;
  onUpdate: (shipment: Shipment) => void;
}

const TrackingDetail: React.FC<TrackingDetailProps> = ({ shipment, onUpdate }) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Notification Preference from localStorage
  const [isNotifyEnabled, setIsNotifyEnabled] = useState(() => {
    return localStorage.getItem(`maersk_notify_shipment_${shipment.id}`) === 'true';
  });

  // Sync state if selected shipment changes
  useEffect(() => {
    setIsNotifyEnabled(localStorage.getItem(`maersk_notify_shipment_${shipment.id}`) === 'true');
  }, [shipment.id]);

  const toggleNotification = () => {
    const newState = !isNotifyEnabled;
    setIsNotifyEnabled(newState);
    localStorage.setItem(`maersk_notify_shipment_${shipment.id}`, String(newState));
  };

  const milestones = useMemo(() => [
    { id: 0, label: 'Origin', statuses: ['Pending', 'Loading'], icon: '📦' },
    { id: 1, label: 'Transit', statuses: ['At Sea', 'Delayed', 'Exception'], icon: '🚢' },
    { id: 2, label: 'Hub', statuses: ['Awaiting Customs', 'Customs Clearance'], icon: '🏢' },
    { id: 3, label: 'Delivery', statuses: ['Out for Delivery'], icon: '🚚' },
    { id: 4, label: 'Delivered', statuses: ['Delivered'], icon: '🏁' }
  ], []);

  const currentStepIndex = useMemo(() => {
    return milestones.findIndex(m => m.statuses.includes(shipment.status));
  }, [shipment.status, milestones]);

  const estimatedDeliveryDate = useMemo(() => {
    const arrival = new Date(shipment.estimatedArrival);
    arrival.setDate(arrival.getDate() + 2);
    return arrival.toISOString().split('T')[0];
  }, [shipment.estimatedArrival]);

  const handleShareStatus = () => {
    const statusSummary = `
Maersk Global Tracking Update
Booking ID: ${shipment.id}
Shipment ID: MEAU${shipment.id}
Status: ${shipment.status}
Port of Loading: ${shipment.origin}
Port of Discharge: ${shipment.destination}
Est. Delivery: ${estimatedDeliveryDate}
    `.trim();
    navigator.clipboard.writeText(statusSummary).then(() => {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn relative">
      {/* Alert Banner / Notification */}
      {alertSuccess && (
        <div className="fixed top-6 right-6 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-fadeIn font-bold text-sm">
          <span>✅</span>
          <span>{t('records_updated_success', 'Shipment records updated successfully!')}</span>
        </div>
      )}

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800">
            <div 
              className="h-full bg-[#73C7E6] transition-all duration-1000 shadow-[0_0_15px_rgba(115,199,230,0.3)]"
              style={{ width: `${((currentStepIndex + 1) / milestones.length) * 100}%` }}
            ></div>
          </div>

          <div className="p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-[#73C7E6] rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-sky-500/10">
                  <span>📦</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md tracking-wider">
                      Booking No: <span className="font-bold text-[#00243D] dark:text-white font-mono">{shipment.id}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-1 bg-[#73C7E6]/10 text-[#00243D] dark:text-[#73C7E6] rounded-md tracking-wider">
                      Shipment No: <span className="font-bold font-mono">MEAU{shipment.id}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-[#73C7E6] animate-ping"></span>
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.25em]">{shipment.status}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleShareStatus}
                  className={`px-6 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${
                    shareSuccess ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  {shareSuccess ? t('copied', 'Copied') : t('share_status', 'Share Status')}
                </button>
              </div>
            </div>

            {/* MAERSK STEPPER */}
            <div className="mb-24 px-8">
              <div className="relative flex justify-between items-center w-full">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full"></div>
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-[#73C7E6] transition-all duration-1000 -translate-y-1/2 rounded-full"
                  style={{ width: `${Math.max(0, (currentStepIndex / (milestones.length - 1)) * 100)}%` }}
                ></div>

                {milestones.map((m, idx) => {
                  const isCompleted = idx < currentStepIndex;
                  const isActive = idx === currentStepIndex;
                  const markerColor = isCompleted ? 'bg-[#73C7E6] border-[#73C7E6] text-[#00243D]' : (isActive ? 'bg-[#00243D] border-[#00243D] text-white ring-8 ring-sky-500/10 scale-125' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-300');

                  return (
                    <div key={m.id} className="relative z-10 flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${markerColor} shadow-lg shadow-black/5`}>
                        <span className="text-lg">{m.icon}</span>
                      </div>
                      <div className="absolute top-full mt-4 text-center">
                        <p className={`text-[10px] font-black uppercase tracking-tighter whitespace-nowrap ${isActive ? 'text-[#00243D] dark:text-[#73C7E6] scale-110' : 'text-slate-400'}`}>
                          {m.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OFFICIAL MAERSK DOCUMENT MANIFEST */}
            <div className="mb-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] overflow-hidden shadow-md">
              <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xs font-black text-[#00243D] dark:text-[#73C7E6] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-[#73C7E6] rounded-full"></span>
                    {t('official_shipping_document', 'Official Shipping Reference Manifest')}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-tight">
                    {t('verified_by_maersk_blockchain', 'Verified Maersk Sea Waybill & Port Ledger')}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">PAYMENT REFERENCE</p>
                  <p className="text-xs font-mono font-black text-[#00243D] dark:text-white mt-0.5">{shipment.paymentReference || '7553319001 /10141358'}</p>
                  <p className="text-[9px] font-black text-emerald-500 uppercase mt-0.5 tracking-tighter">PLEASE PAY WITHOUT DEDUCTION</p>
                </div>
              </div>

              {/* Waybill Document Table Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 border-b border-slate-200 dark:border-slate-800">
                {/* Vessel/Voyage Direction Row spanning 3 cols */}
                <div className="md:col-span-3 p-4 border-r border-b md:border-b-0 border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vessel/Voyage Direction</p>
                  <p className="text-sm font-black text-[#00243D] dark:text-white uppercase tracking-tight font-mono">
                    {shipment.vesselName}{shipment.voyageDirection ? `/${shipment.voyageDirection}` : '/629S'}
                  </p>
                </div>
                {/* Reference Box spanning 1 col */}
                <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors bg-sky-500/5 dark:bg-[#73C7E6]/5">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Booking / Shipment No</p>
                  <p className="text-xs font-black text-[#00243D] dark:text-white font-mono tracking-wider">
                    {shipment.id} / MEAU{shipment.id}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-200 dark:border-slate-800">
                {/* Sailing Date */}
                <div className="p-4 border-r border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sailing Date</p>
                  <p className="text-xs font-black text-[#00243D] dark:text-white font-mono">
                    {shipment.departureDate ? new Date(shipment.departureDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 19, 2026'}
                  </p>
                </div>
                {/* Arrival Date */}
                <div className="p-4 md:border-r border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Arrival Date</p>
                  <p className="text-xs font-black text-[#00243D] dark:text-white font-mono">
                    {shipment.estimatedArrival ? new Date(shipment.estimatedArrival).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 17, 2026'}
                  </p>
                </div>
                {/* Place of Receipt */}
                <div className="p-4 border-r border-b md:border-b-0 border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors col-span-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Place of Receipt</p>
                  <p className="text-xs font-black text-[#00243D] dark:text-white font-mono truncate">
                    {shipment.placeOfReceipt || `${shipment.origin}, PL`}
                  </p>
                </div>
                {/* Port of Loading */}
                <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors col-span-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Port of Loading</p>
                  <p className="text-xs font-black text-[#00243D] dark:text-white font-mono truncate">
                    {shipment.portOfLoading || `${shipment.origin}, PL`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4">
                {/* Space holder left cols */}
                <div className="hidden md:block md:col-span-2 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10"></div>
                {/* Port of Discharge */}
                <div className="p-4 border-r border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Port of Discharge</p>
                  <p className="text-xs font-black text-[#00243D] dark:text-white font-mono truncate">
                    {shipment.portOfDischarge || `${shipment.destination}, ES`}
                  </p>
                </div>
                {/* Place of Delivery */}
                <div className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Place of Delivery</p>
                  <p className="text-xs font-black text-[#00243D] dark:text-white font-mono truncate">
                    {shipment.placeOfDelivery || `${shipment.destination}, ES`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Voyage Progress & Time-to-Delivery Tracker */}
        <VoyageProgressTracker shipment={shipment} />

        {/* Live Route Map & Telemetry HUD */}
        <ShipmentMap shipment={shipment} />
      </div>

      {/* Sidebar Info */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#73C7E6]/10 rounded-bl-[100px]"></div>
          <h3 className="text-sm font-black text-[#00243D] dark:text-white uppercase tracking-widest mb-10 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#73C7E6] rounded-full"></span>
            {t('manifest_details', 'Manifest Details')}
          </h3>
          
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('carrier', 'Carrier')}</p>
                <p className="font-black text-[#00243D] dark:text-white tracking-tight italic">Maersk Line</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('gross_weight', 'Gross Weight')}</p>
                <p className="font-black text-[#00243D] dark:text-white tracking-tight">{shipment.weight}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black text-[#73C7E6] uppercase tracking-widest mb-1">{t('est_delivery_date', 'Est. Delivery Date')}</p>
                <p className="text-2xl font-black text-[#00243D] dark:text-white tracking-tighter">{estimatedDeliveryDate}</p>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 dark:border-slate-800">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('service_level', 'Service Level')}</p>
               <div className="bg-[#73C7E6]/10 border border-[#73C7E6] p-4 rounded-2xl flex items-center gap-3">
                  <span className="text-xl">⚡</span>
                  <p className="text-xs font-black text-[#00243D] dark:text-white uppercase tracking-tighter">Maersk Ocean Express</p>
               </div>
            </div>

            {/* NOTIFY ME TOGGLE */}
            <div className="pt-8 border-t border-slate-50 dark:border-slate-800">
               <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                 <div className="flex items-center gap-3">
                   <span className="text-xl">🔔</span>
                   <div>
                     <p className="text-xs font-black text-[#00243D] dark:text-white uppercase tracking-tighter">{t('notify_me', 'Notify Me')}</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase">{t('notify_desc', 'Alert on Delay/Delivered')}</p>
                   </div>
                 </div>
                 <button 
                   onClick={toggleNotification}
                   className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 relative ${
                     isNotifyEnabled ? 'bg-[#73C7E6]' : 'bg-slate-300 dark:bg-slate-700'
                   }`}
                   id="notify-me-toggle"
                   type="button"
                 >
                   <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                     isNotifyEnabled ? 'translate-x-5' : 'translate-x-0'
                   }`} />
                 </button>
               </div>
            </div>

            <button onClick={() => setIsEditing(true)} className="w-full py-4 bg-[#00243D] dark:bg-[#73C7E6] text-white dark:text-[#00243D] font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-sky-500/10">
              {t('update_records', 'Update Records')}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Record Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-[#00243D]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-lg w-full p-8 border border-slate-100 dark:border-slate-800 shadow-2xl relative animate-fadeIn">
            <h3 className="text-xl font-black text-[#00243D] dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#73C7E6] rounded-full"></span>
              {t('update_shipment_records', 'Update Shipment Records')}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const status = formData.get('status') as ShipmentStatus;
              const contents = formData.get('contents') as string;
              const count = Number(formData.get('count'));
              const weight = formData.get('weight') as string;
              const paymentReference = formData.get('paymentReference') as string;
              const vesselName = formData.get('vesselName') as string;
              const voyageDirection = formData.get('voyageDirection') as string;
              const placeOfReceipt = formData.get('placeOfReceipt') as string;
              const portOfLoading = formData.get('portOfLoading') as string;
              const portOfDischarge = formData.get('portOfDischarge') as string;
              const placeOfDelivery = formData.get('placeOfDelivery') as string;
              
              const updatedHistory = [...(shipment.trackingHistory || [])];
              if (status !== shipment.status) {
                updatedHistory.unshift({
                  date: new Date().toISOString().split('T')[0],
                  location: status === 'Delivered' 
                    ? shipment.destination 
                    : (status === 'Loading' || status === 'Pending' ? shipment.origin : 'Global Hub Transit'),
                  description: `Voyage status updated to: ${status}`,
                  completed: true
                });
              }

              onUpdate({
                ...shipment,
                status,
                contents,
                containerCount: count,
                weight,
                paymentReference,
                vesselName,
                voyageDirection,
                placeOfReceipt,
                portOfLoading,
                portOfDischarge,
                placeOfDelivery,
                trackingHistory: updatedHistory
              });
              
              setIsEditing(false);
              setAlertSuccess(true);
              setTimeout(() => setAlertSuccess(false), 3000);
            }} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('shipment_status', 'Shipment Status')}</label>
                <select 
                  name="status"
                  defaultValue={shipment.status}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] font-bold text-xs"
                >
                  <option value="Pending">Pending</option>
                  <option value="Loading">Loading</option>
                  <option value="At Sea">At Sea</option>
                  <option value="Awaiting Customs">Awaiting Customs</option>
                  <option value="Customs Clearance">Customs Clearance</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Exception">Exception</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('contents_description', 'Contents / Load description')}</label>
                <input 
                  type="text"
                  name="contents"
                  defaultValue={shipment.contents}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('container_count', 'Container Count')}</label>
                  <input 
                    type="number"
                    name="count"
                    defaultValue={shipment.containerCount}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('gross_weight', 'Gross Weight')}</label>
                  <input 
                    type="text"
                    name="weight"
                    defaultValue={shipment.weight}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] font-bold text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                <h4 className="text-[10px] font-black text-[#73C7E6] uppercase tracking-widest">{t('waybill_document_details', 'Waybill Document Details')}</h4>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('payment_reference', 'Payment Reference')}</label>
                  <input 
                    type="text"
                    name="paymentReference"
                    defaultValue={shipment.paymentReference || '7553319001 /10141358'}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] font-bold text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('vessel_name', 'Vessel Name')}</label>
                    <input 
                      type="text"
                      name="vesselName"
                      defaultValue={shipment.vesselName}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('voyage_direction', 'Voyage Direction')}</label>
                    <input 
                      type="text"
                      name="voyageDirection"
                      defaultValue={shipment.voyageDirection || '629S'}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] font-bold text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('place_of_receipt', 'Place of Receipt')}</label>
                    <input 
                      type="text"
                      name="placeOfReceipt"
                      defaultValue={shipment.placeOfReceipt || `${shipment.origin}, PL`}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('port_of_loading', 'Port of Loading')}</label>
                    <input 
                      type="text"
                      name="portOfLoading"
                      defaultValue={shipment.portOfLoading || `${shipment.origin}, PL`}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('port_of_discharge', 'Port of Discharge')}</label>
                    <input 
                      type="text"
                      name="portOfDischarge"
                      defaultValue={shipment.portOfDischarge || `${shipment.destination}, ES`}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('place_of_delivery', 'Place of Delivery')}</label>
                    <input 
                      type="text"
                      name="placeOfDelivery"
                      defaultValue={shipment.placeOfDelivery || `${shipment.destination}, ES`}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#73C7E6] font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[#00243D] dark:bg-[#73C7E6] text-white dark:text-[#00243D] font-black rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg"
                >
                  {t('save_updates', 'Save Updates')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingDetail;
