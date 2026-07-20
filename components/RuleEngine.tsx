
import React, { useState } from 'react';
import { Rule, ShipmentStatus } from '../types';
import { useFirebase } from '../src/context/FirebaseContext';

interface RuleEngineProps {
  rules: Rule[];
  onDeploy: (activeRules: Rule[]) => void;
}

const RuleEngine: React.FC<RuleEngineProps> = ({ rules, onDeploy }) => {
  const { saveRuleInFirestore, toggleRuleInFirestore, deleteRuleInFirestore } = useFirebase();
  const [showEditor, setShowEditor] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentFeedback, setDeploymentFeedback] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Editor State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetStatus, setTargetStatus] = useState<ShipmentStatus>('Delayed');
  const [delayReason, setDelayReason] = useState('Labor Strike/Disruption');
  const [delayDays, setDelayDays] = useState('5 Days');
  const [originPort, setOriginPort] = useState('All');
  const [destinationPort, setDestinationPort] = useState('All');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const PRESET_ORIGINS = [
    'All',
    'Gdansk, Poland',
    'New Delhi, India',
    'Singapore, SG',
    'Shanghai, China',
    'New York, USA'
  ];

  const PRESET_DESTINATIONS = [
    'All',
    'Valencia, Spain',
    'Frankfurt, Germany',
    'Los Angeles, USA',
    'London, UK',
    'Tokyo, Japan'
  ];

  const handleAddRule = async () => {
    if (!name || !description || !targetStatus || !delayReason || !delayDays) return;

    let updatedRules: Rule[];
    const newRuleId = editingRuleId || `RULE-${Date.now()}`;
    
    const ruleData: Rule = {
      id: newRuleId,
      name,
      description,
      targetStatus,
      delayReason,
      delayDays,
      isActive: true,
      originPort,
      destinationPort,
      priority,
      deployedAt: Date.now(),
    };

    if (editingRuleId) {
      updatedRules = rules.map(r => r.id === editingRuleId ? { ...ruleData, deployedAt: r.deployedAt || Date.now() } : r);
    } else {
      updatedRules = [...rules, ruleData];
    }

    await saveRuleInFirestore(ruleData);
    
    // Immediate Deployment upon Save as requested
    setIsDeploying(true);
    setDeploymentFeedback(null);
    
    try {
      // Deploy the active rules to update affected Shipment IDs
      const activeRules = updatedRules.filter(r => r.isActive);
      await onDeploy(activeRules);
      
      setIsDeploying(false);
      setDeploymentFeedback(`Rule "${name}" has been saved, activated, and deployed successfully. Affected shipments have been updated.`);
      setTimeout(() => setDeploymentFeedback(null), 6000);
      resetEditor();
    } catch (error) {
      console.error("Deployment failed:", error);
      setIsDeploying(false);
      setDeploymentFeedback("Deployment failed. Rule was saved but shipment updates couldn't be processed.");
    }
  };

  const resetEditor = () => {
    setName('');
    setDescription('');
    setTargetStatus('Delayed');
    setDelayReason('Labor Strike/Disruption');
    setDelayDays('5 Days');
    setOriginPort('All');
    setDestinationPort('All');
    setPriority('Medium');
    setEditingRuleId(null);
    setShowEditor(false);
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRuleId(rule.id);
    setName(rule.name);
    setDescription(rule.description);
    setTargetStatus(rule.targetStatus);
    setDelayReason(rule.delayReason);
    setDelayDays(rule.delayDays);
    setOriginPort(rule.originPort || 'All');
    setDestinationPort(rule.destinationPort || 'All');
    setPriority(rule.priority || 'Medium');
    setShowEditor(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleRule = async (id: string) => {
    const updatedRules = rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    const ruleToToggle = rules.find(r => r.id === id);
    if (ruleToToggle) {
      await toggleRuleInFirestore(id, !ruleToToggle.isActive);
    }
    
    // Immediate Deployment upon Toggle to update affected shipments in real-time
    setIsDeploying(true);
    try {
      const activeRules = updatedRules.filter(r => r.isActive);
      await onDeploy(activeRules);
      setIsDeploying(false);
      setDeploymentFeedback(`Policy status updated & redeployed successfully.`);
      setTimeout(() => setDeploymentFeedback(null), 5000);
    } catch (e) {
      console.error(e);
      setIsDeploying(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    await deleteRuleInFirestore(id);
    if (editingRuleId === id) resetEditor();

    // Immediate Deployment upon Delete to update affected shipments in real-time
    setIsDeploying(true);
    try {
      const updatedRules = rules.filter(r => r.id !== id);
      const activeRules = updatedRules.filter(r => r.isActive);
      await onDeploy(activeRules);
      setIsDeploying(false);
      setDeploymentFeedback(`Policy deleted & redeployed successfully.`);
      setTimeout(() => setDeploymentFeedback(null), 5000);
    } catch (e) {
      console.error(e);
      setIsDeploying(false);
    }
  };

  const handleManualDeploy = async () => {
    const activeRules = rules.filter(r => r.isActive);
    if (activeRules.length === 0) return;

    setIsDeploying(true);
    setDeploymentFeedback(null);

    await onDeploy(activeRules);
    
    setIsDeploying(false);
    setDeploymentFeedback(`Manual deployment successful. ${activeRules.length} policies were applied to the current shipment database.`);
    setTimeout(() => setDeploymentFeedback(null), 5000);
  };

  const statuses: ShipmentStatus[] = [
    'Delayed', 'Exception', 'Pending', 'Loading', 'At Sea', 'Awaiting Customs', 'Customs Clearance', 'Out for Delivery', 'Delivered'
  ];

  const PRESET_REASONS = [
    'Labor Strike/Disruption',
    'Port Congestion',
    'Adverse Weather Conditions',
    'Technical Vessel Issue',
    'Customs Clearance Hold',
    'Route Optimization Change',
    'Terminal Equipment Failure',
    'Regulatory Compliance Inspection'
  ];

  const PRESET_DAYS = Array.from({ length: 10 }, (_, i) => `${i + 1} Day${i + 1 > 0 ? 's' : ''}`);

  const SelectIcon = () => (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#00243D] dark:text-white tracking-tight uppercase">Logistics Rule Engine</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Automate global shipment updates via natural language triggers.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {!showEditor && (
            <button 
              onClick={() => setShowEditor(true)}
              className="flex-1 md:flex-none px-6 py-3 bg-[#007DA3] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#005f7c] transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
              Create New Rule
            </button>
          )}
          <button 
            onClick={handleManualDeploy}
            disabled={rules.filter(r => r.isActive).length === 0 || isDeploying}
            className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
          >
            {isDeploying ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Deploy All Active
              </>
            )}
          </button>
        </div>
      </div>

      {deploymentFeedback && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-6 rounded-[32px] flex items-center gap-4 animate-fadeIn shadow-sm ring-1 ring-emerald-500/10">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/20">
            ✓
          </div>
          <p className="text-sm font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">{deploymentFeedback}</p>
        </div>
      )}

      {showEditor && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[48px] p-10 shadow-2xl animate-fadeIn relative">
          <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50 dark:border-slate-800/50">
            <h3 className="text-xl font-black text-[#00243D] dark:text-white uppercase tracking-tight flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-[#007DA3] text-white flex items-center justify-center text-sm shadow-lg shadow-blue-500/20">
                {editingRuleId ? '✎' : '+'}
              </span>
              {editingRuleId ? 'Edit Active Rule' : 'Design Dynamic Rule'}
            </h3>
            <button onClick={resetEditor} className="p-3 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-10">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-3">RULE HEADER (INTERNAL NAME)</label>
                <input 
                  type="text" 
                  placeholder="e.g., London Route congestion"
                  className="w-full px-6 py-5 rounded-[24px] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-4 focus:ring-[#007DA3]/10 shadow-sm placeholder:text-slate-300"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="p-10 bg-[#F5F9FF] dark:bg-[#00243D]/20 rounded-[40px] border border-[#E1EEFF] dark:border-[#003D66]/40">
                <p className="text-[11px] font-black uppercase text-[#007DA3] tracking-[0.2em] mb-8">IF CONDITION (THE TRIGGER)</p>
                <div className="space-y-6">
                  <textarea 
                    placeholder="Describe which shipments should trigger this rule (e.g., 'All the shipments coming from London or going to London will be delayed...')"
                    className="w-full h-32 px-7 py-6 rounded-[32px] border-0 bg-white dark:bg-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#007DA3]/10 resize-none shadow-sm text-slate-700 dark:text-slate-200 leading-relaxed"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Port of Origin</label>
                      <div className="relative">
                        <select 
                          className="w-full px-5 py-4 rounded-xl border-0 bg-white dark:bg-slate-900 text-xs font-bold appearance-none text-[#00243D] dark:text-white shadow-sm focus:ring-4 focus:ring-[#007DA3]/10"
                          value={originPort}
                          onChange={(e) => setOriginPort(e.target.value)}
                        >
                          {PRESET_ORIGINS.map(o => <option key={o} value={o}>{o === 'All' ? 'Any Origin Port' : o}</option>)}
                        </select>
                        <SelectIcon />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Port of Destination</label>
                      <div className="relative">
                        <select 
                          className="w-full px-5 py-4 rounded-xl border-0 bg-white dark:bg-slate-900 text-xs font-bold appearance-none text-[#00243D] dark:text-white shadow-sm focus:ring-4 focus:ring-[#007DA3]/10"
                          value={destinationPort}
                          onChange={(e) => setDestinationPort(e.target.value)}
                        >
                          {PRESET_DESTINATIONS.map(d => <option key={d} value={d}>{d === 'All' ? 'Any Destination Port' : d}</option>)}
                        </select>
                        <SelectIcon />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rule Priority</label>
                    <div className="relative">
                      <select 
                        className="w-full px-5 py-4 rounded-xl border-0 bg-white dark:bg-slate-900 text-xs font-bold appearance-none text-[#00243D] dark:text-white shadow-sm focus:ring-4 focus:ring-[#007DA3]/10"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                      >
                        <option value="High">🔴 High Priority (Applies first)</option>
                        <option value="Medium">🟡 Medium Priority</option>
                        <option value="Low">🟢 Low Priority</option>
                      </select>
                      <SelectIcon />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <p className="text-[10px] text-blue-600/60 dark:text-blue-400/60 font-black uppercase tracking-widest">
                      Routing Engine will process match rules deterministically
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="p-10 bg-[#F0FAF4] dark:bg-emerald-900/10 rounded-[40px] border border-[#DCF2E5] dark:border-emerald-900/30 h-full">
                <p className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-[0.2em] mb-10">THEN ACTION (THE RESULT)</p>
                <div className="space-y-10">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">UPDATE STATUS</label>
                    <div className="relative">
                      <select 
                        className="w-full px-6 py-5 rounded-[24px] border-0 bg-white dark:bg-slate-900 text-sm font-black appearance-none text-[#00243D] dark:text-white shadow-sm focus:ring-4 focus:ring-emerald-500/10"
                        value={targetStatus}
                        onChange={(e) => setTargetStatus(e.target.value as ShipmentStatus)}
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <SelectIcon />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">DELAY REASON</label>
                    <div className="relative">
                      <select 
                        className="w-full px-6 py-5 rounded-[24px] border-0 bg-white dark:bg-slate-900 text-sm font-black appearance-none text-[#00243D] dark:text-white shadow-sm focus:ring-4 focus:ring-emerald-500/10"
                        value={delayReason}
                        onChange={(e) => setDelayReason(e.target.value)}
                      >
                        <option value="" disabled>Select Reason...</option>
                        {PRESET_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <SelectIcon />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">DELAY DAYS</label>
                    <div className="relative">
                      <select 
                        className="w-full px-6 py-5 rounded-[24px] border-0 bg-white dark:bg-slate-900 text-sm font-black appearance-none text-[#00243D] dark:text-white shadow-sm focus:ring-4 focus:ring-emerald-500/10"
                        value={delayDays}
                        onChange={(e) => setDelayDays(e.target.value)}
                      >
                        <option value="" disabled>Select Duration...</option>
                        {PRESET_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <SelectIcon />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1 lg:col-span-2 flex gap-4 pt-4">
              <button 
                onClick={handleAddRule}
                disabled={isDeploying}
                className={`flex-1 py-6 font-black text-xs uppercase tracking-[0.3em] rounded-[24px] transition-all shadow-xl text-white flex items-center justify-center gap-3 ${editingRuleId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-[#00243D] dark:bg-black hover:bg-slate-800 shadow-blue-900/20'} disabled:opacity-50`}
              >
                {isDeploying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    {editingRuleId ? 'Update and Deploy Rule' : 'Save and Deploy Rule'}
                  </>
                )}
              </button>
              {editingRuleId && (
                <button 
                  onClick={resetEditor}
                  className="px-12 py-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-[0.2em] rounded-[24px] hover:bg-slate-200 transition-all"
                >
                  Discard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-xl font-black text-[#00243D] dark:text-white uppercase tracking-tight flex items-center gap-3">
            Deployed Policies
            <span className="text-[10px] font-black px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full tracking-widest">{rules.length} REGISTRY ITEMS</span>
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rules.map((rule) => (
            <div 
              key={rule.id}
              className={`group bg-white dark:bg-slate-900 border rounded-[40px] p-8 shadow-sm transition-all hover:shadow-2xl ${editingRuleId === rule.id ? 'ring-4 ring-amber-400 border-amber-400' : (rule.isActive ? 'border-slate-50 dark:border-slate-800 shadow-slate-200/50' : 'border-slate-200 dark:border-slate-800 opacity-50')}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-black text-[#00243D] dark:text-white truncate text-lg tracking-tight uppercase">{rule.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{rule.id}</p>
                </div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => handleToggleRule(rule.id)}
                     title={rule.isActive ? "Pause Policy" : "Resume Policy"}
                     className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${rule.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                   >
                     {rule.isActive ? '✓' : 'Ⅱ'}
                   </button>
                   <button 
                     onClick={() => handleEditRule(rule)}
                     className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                   >
                     <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                   </button>
                   <button 
                     onClick={() => handleDeleteRule(rule.id)}
                     className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                   >
                     <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                </div>
              </div>
              
              <div className="space-y-5 mb-8">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[24px] border border-slate-100 dark:border-slate-800 space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] block mb-2">TRIGGER LOGIC</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{rule.description}"
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                    <div>
                      <p className="uppercase text-slate-400">Origin Port:</p>
                      <p className="text-slate-700 dark:text-slate-300 truncate">{rule.originPort === 'All' || !rule.originPort ? 'Any Port' : rule.originPort}</p>
                    </div>
                    <div>
                      <p className="uppercase text-slate-400">Destination Port:</p>
                      <p className="text-slate-700 dark:text-slate-300 truncate">{rule.destinationPort === 'All' || !rule.destinationPort ? 'Any Port' : rule.destinationPort}</p>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-between items-center text-[10px] font-bold">
                    <span className="uppercase text-slate-400">Rule Priority:</span>
                    <span className={`px-2 py-0.5 rounded uppercase font-black tracking-wider ${
                      rule.priority === 'High' 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' 
                        : rule.priority === 'Low' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {rule.priority || 'Medium'}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[24px] border border-emerald-100 dark:border-emerald-800">
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] block mb-3">ACTION PARAMS</span>
                  <div className="space-y-3">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                      Target: <span className="text-emerald-600 font-black">{rule.targetStatus}</span>
                    </p>
                    <div className="flex flex-col gap-1.5 pl-4 border-l-2 border-emerald-200 dark:border-emerald-800">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">Reason: <span className="text-slate-700 dark:text-slate-300">{rule.delayReason}</span></p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">Duration: <span className="text-slate-700 dark:text-slate-300">{rule.delayDays}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Engine v2.7</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Heuristic Deployment</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">State</p>
                  <p className={`text-[10px] font-black px-3 py-1 rounded-lg tracking-widest ${rule.isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-200 text-slate-500'}`}>
                    {rule.isActive ? 'ACTIVE' : 'PAUSED'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {rules.length === 0 && !showEditor && (
            <div 
              onClick={() => setShowEditor(true)}
              className="col-span-full py-24 text-center bg-slate-50/50 dark:bg-maersk-dark/20 rounded-[56px] border-2 border-dashed border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all group shadow-inner"
            >
              <div className="w-20 h-20 rounded-[32px] bg-white dark:bg-slate-800 mx-auto flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                 <svg className="w-10 h-10 text-[#007DA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-black text-xl uppercase tracking-tight">No Active Automation Policies</p>
              <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest opacity-60">Deploy smart rules to handle port disruptions automatically.</p>
              <button className="mt-10 px-10 py-4 bg-[#007DA3] text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-blue-500/20 group-hover:bg-[#005f7c] transition-all">Launch Designer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RuleEngine;
