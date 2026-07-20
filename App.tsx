
import React, { useState, useEffect, useRef } from 'react';
import { User, Shipment, BusinessRole, Rule, ShipmentStatus } from './types';
import { MOCK_SHIPMENTS } from './constants';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ShipmentList from './components/ShipmentList';
import TrackingDetail from './components/TrackingDetail';
import LogisticsAssistant from './components/LogisticsAssistant';
import RuleEngine from './components/RuleEngine';
import { applyRulesToShipments } from './services/geminiService';
import { useLanguage } from './src/context/LanguageContext';
import { useFirebase } from './src/context/FirebaseContext';
import { auth, db } from './services/firebase';
import { doc, setDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const { t } = useLanguage();
  const {
    user,
    shipments,
    rules,
    loading,
    logout,
    updateShipmentInFirestore,
    batchUpdateShipments,
    localLoginFallback,
    seedDatabase
  } = useFirebase();

  const [view, setView] = useState<'dashboard' | 'shipments' | 'tracking' | 'assistant' | 'rules'>('dashboard');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('maersk_theme') === 'dark';
  });
  const [activeNotifications, setActiveNotifications] = useState<{
    id: string;
    shipmentId: string;
    vesselName: string;
    status: ShipmentStatus;
    timestamp: Date;
  }[]>([]);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedSuccess, setSeedSuccess] = useState<boolean>(false);

  const prevShipmentsRef = useRef<Shipment[]>([]);

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId) || null;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('maersk_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('maersk_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (shipments && shipments.length > 0) {
      if (prevShipmentsRef.current.length > 0) {
        shipments.forEach(currentShipment => {
          const prevShipment = prevShipmentsRef.current.find(s => s.id === currentShipment.id);
          if (prevShipment && prevShipment.status !== currentShipment.status) {
            // Status changed!
            const isNotifyEnabled = localStorage.getItem(`maersk_notify_shipment_${currentShipment.id}`) === 'true';
            if (isNotifyEnabled && (currentShipment.status === 'Delivered' || currentShipment.status === 'Delayed')) {
              // Trigger visual banner!
              const newNotification = {
                id: Math.random().toString(36).substring(2, 9),
                shipmentId: currentShipment.id,
                vesselName: currentShipment.vesselName,
                status: currentShipment.status,
                timestamp: new Date()
              };
              setActiveNotifications(prev => [newNotification, ...prev]);

              // Auto-dismiss after 8 seconds
              setTimeout(() => {
                setActiveNotifications(prev => prev.filter(n => n.id !== newNotification.id));
              }, 8000);
            }
          }
        });
      }
      prevShipmentsRef.current = shipments;
    }
  }, [shipments]);

  const handleLogin = (email: string) => {
    const role = email === 'manav.imt01@gmail.com' ? 'Agent' : 'Customer';
    localLoginFallback(email, role);
  };

  const handleLogout = () => {
    logout();
  };

  const handleRoleChange = async (role: BusinessRole) => {
    if (user) {
      const updatedUser = { ...user, role };
      if (auth.currentUser) {
        try {
          await setDoc(doc(db, 'users', auth.currentUser.uid), updatedUser);
        } catch (err) {
          console.error("Failed to update user role in Firestore:", err);
        }
      } else {
        localLoginFallback(user.email, role);
      }
      if (role === 'Customer' && view === 'rules') {
        setView('dashboard');
      }
    }
  };

  const navigateToTracking = (shipment: Shipment) => {
    setSelectedShipmentId(shipment.id);
    setView('tracking');
  };

  const handleUpdateShipment = (updatedShipment: Shipment) => {
    updateShipmentInFirestore(updatedShipment);
  };

  const handleDeployRules = async (activeRules: Rule[]) => {
    // Call the deterministic and transactional routing engine to process rules
    const updatedShipments = await applyRulesToShipments(shipments, activeRules);
    await batchUpdateShipments(updatedShipments);
  };

  const handleSeedData = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    setSeedSuccess(false);
    try {
      await seedDatabase();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err) {
      console.error("Seeding failed: ", err);
    } finally {
      setIsSeeding(false);
    }
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-maersk-dark flex flex-col items-center justify-center transition-colors duration-500">
        <div className="w-12 h-12 border-4 border-[#73C7E6] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Connecting to Port Ledger...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-maersk-dark transition-colors duration-300 relative">
      {/* Floating Notification Banners */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-4 max-w-sm w-full pointer-events-none">
        {activeNotifications.map(notification => {
          const isDelivered = notification.status === 'Delivered';
          const icon = isDelivered ? '🎉' : '⚠️';
          const stripeColor = isDelivered ? 'bg-emerald-500' : 'bg-amber-500';
          const textColor = isDelivered ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400';

          return (
            <div 
              key={notification.id} 
              className="pointer-events-auto w-full border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex animate-fadeIn transition-all"
              id={`notification-banner-${notification.shipmentId}`}
            >
              <div className={`w-2.5 ${stripeColor}`}></div>
              <div className="p-6 flex-1 flex gap-4 items-start">
                <span className="text-2xl mt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>
                    {isDelivered ? 'Shipment Delivered' : 'Shipment Delayed'}
                  </p>
                  <p className="text-base font-black text-[#00243D] dark:text-white mt-1">
                    {notification.shipmentId}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Vessel <span className="font-bold">{notification.vesselName}</span> status is now <span className="font-black uppercase">{notification.status}</span>.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setActiveNotifications(prev => prev.filter(n => n.id !== notification.id));
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Sidebar 
        activeView={view} 
        setView={setView} 
        onLogout={handleLogout} 
        userName={user.name}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        role={user.role}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#00243D] dark:text-white">
              {view === 'dashboard' && `${t('welcome_back', 'Welcome back')}, ${user.name}`}
              {view === 'shipments' && t('all_shipments_title', 'All Shipments')}
              {view === 'tracking' && t('shipment_tracking_title', 'Shipment Tracking')}
              {view === 'assistant' && t('maersk_ai', 'Maersk AI')}
              {view === 'rules' && t('rule_engine', 'Rule Engine')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {view === 'dashboard' && `${t('dashboard_desc', 'Your logistics overview for today as a')} ${user.role === 'Agent' ? t('agent', 'Agent') : t('customer', 'Customer')}.`}
              {view === 'shipments' && t('shipments_desc', 'Manage and monitor your ongoing bookings.')}
              {view === 'tracking' && `${t('tracking_desc', 'Detailed status for')} ${selectedShipment?.id}`}
              {view === 'assistant' && t('assistant_desc', 'AI-powered support for your supply chain.')}
              {view === 'rules' && t('rules_desc', 'Design and deploy automated logistics rules.')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Elegant, Non-blocking Seeding Mechanism */}
            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border shadow-xs cursor-pointer ${
                seedSuccess
                  ? 'bg-emerald-500 border-emerald-500 text-white animate-scaleUp'
                  : isSeeding
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[#00243D] dark:text-[#73C7E6] hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
              title="Ensure exactly 100 high-fidelity shipments are loaded into the ledger"
              id="seed-registry-button"
            >
              {isSeeding ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                  <span>{t('seeding', 'Processing Ledger...')}</span>
                </>
              ) : seedSuccess ? (
                <>
                  <span>✨</span>
                  <span>{t('seeded', '100 Bookings Ready')}</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>{t('seed_100', 'Seed 100 Shipments')}</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 px-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                {t('active_profile', 'Active Profile')}
              </span>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                user.role === 'Agent' 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {user.role === 'Agent' ? t('agent', 'Agent') : t('customer', 'Customer')}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {view === 'dashboard' && (
            <Dashboard 
              shipments={shipments} 
              onTrack={navigateToTracking} 
              userRole={user.role}
              onRoleChange={handleRoleChange}
              onNavigateToRules={() => setView('rules')}
            />
          )}
          {view === 'shipments' && <ShipmentList shipments={shipments} onTrack={navigateToTracking} />}
          {view === 'tracking' && selectedShipment && (
            <TrackingDetail 
              shipment={selectedShipment} 
              onUpdate={handleUpdateShipment}
            />
          )}
          {view === 'assistant' && <LogisticsAssistant shipments={shipments} user={user} />}
          {view === 'rules' && user.role === 'Agent' && (
            <RuleEngine 
              rules={rules} 
              onDeploy={handleDeployRules} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
