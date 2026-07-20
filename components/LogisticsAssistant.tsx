
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Shipment, Message, User } from '../types';
import { getLogisticsAssistantResponse } from '../services/geminiService';

interface LogisticsAssistantProps {
  shipments: Shipment[];
  user: User;
}

const LogisticsAssistant: React.FC<LogisticsAssistantProps> = ({ shipments, user }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Welcome to the Maersk Global Assistant. How can I help you optimize your supply chain or track your container bookings today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend: string, e?: React.FormEvent) => {
    e?.preventDefault();
    const finalInput = textToSend.trim();
    if (!finalInput || isTyping) return;

    setMessages(prev => [...prev, { role: 'user', content: finalInput, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const responseText = await getLogisticsAssistantResponse(finalInput, shipments, history);

    setMessages(prev => [...prev, { role: 'assistant', content: responseText, timestamp: new Date() }]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="p-8 bg-[#00243D] dark:bg-black text-white flex items-center justify-between border-b-4 border-[#73C7E6]">
        <div className="flex items-center gap-4">
          <div className="bg-[#73C7E6] text-[#00243D] font-black px-2.5 py-1 text-base rounded flex items-center gap-1 leading-none tracking-tight">
            <span className="text-sm">★</span>MAERSK
          </div>
          <div>
            <h3 className="font-black uppercase tracking-widest text-sm">Global Assistant</h3>
            <p className="text-[10px] text-[#73C7E6] font-bold italic">Powered by Maersk AI Engine</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 dark:bg-black/20">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm ${
              m.role === 'user' 
                ? 'bg-[#00243D] text-white dark:bg-[#73C7E6] dark:text-[#00243D] rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
            }`}>
              <p className="text-sm font-medium leading-relaxed">{m.content}</p>
              <p className="text-[9px] mt-2 font-black opacity-50 uppercase tracking-widest">
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#73C7E6]/20 rounded-2xl p-4 flex gap-1">
              <div className="w-1.5 h-1.5 bg-[#73C7E6] rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-[#73C7E6] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-[#73C7E6] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={(e) => handleSend(input, e)} className="relative flex items-center">
          <input 
            type="text"
            className="w-full pl-6 pr-16 py-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-[#73C7E6]/20 font-bold"
            placeholder="Search waybills or ask about logistics..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="absolute right-3 p-4 bg-[#73C7E6] text-[#00243D] rounded-xl hover:bg-[#5bb2cf] shadow-lg shadow-sky-500/10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogisticsAssistant;
