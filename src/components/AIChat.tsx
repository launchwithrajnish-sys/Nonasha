import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, X, Sparkles, Loader2, MinusCircle, MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your Nonasha Wellness Assistant. How can I help you on your recovery journey today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className="fixed bottom-8 right-8 z-[80] w-16 h-16 bg-brand-dark text-white rounded-full flex items-center justify-center shadow-2xl border border-white/10 hover:bg-neutral-800 transition-all group"
      >
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-leaf rounded-full animate-pulse shadow-lg shadow-brand-leaf/40" />
        <MessageSquare className="group-hover:scale-110 transition-transform" />
      </motion.button>

      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 right-8 z-[90] w-[400px] max-w-[calc(100vw-4rem)] h-[600px] max-h-[calc(100vh-10rem)] bg-white rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-neutral-100"
          >
            {/* Header */}
            <div className="bg-brand-dark p-8 flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-leaf/20 rounded-2xl flex items-center justify-center text-brand-leaf">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Wellness AI</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Always Active</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <MinusCircle size={20} className="text-white/40" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} className="text-white/40" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${m.role === 'assistant' ? 'bg-brand-leaf/10 text-brand-leaf' : 'bg-neutral-100 text-brand-dark'}`}>
                    {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={`max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed ${m.role === 'assistant' ? 'bg-neutral-50 text-brand-dark rounded-tl-none' : 'bg-brand-dark text-white rounded-tr-none'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-brand-leaf/10 text-brand-leaf flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                  <div className="bg-neutral-50 p-5 rounded-3xl rounded-tl-none">
                    <Loader2 size={16} className="animate-spin text-brand-leaf" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-6 border-t border-neutral-100 bg-neutral-50/50">
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about recovery, dosage..."
                  className="w-full bg-white border border-neutral-100 p-5 pr-16 rounded-2xl text-sm font-medium focus:outline-none focus:border-brand-leaf/40 transition-all shadow-sm"
                />
                <button 
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-dark text-white rounded-xl flex items-center justify-center hover:bg-neutral-800 transition-all disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-4 text-[9px] font-bold text-center text-neutral-300 uppercase tracking-widest flex items-center justify-center gap-1">
                <Sparkles size={10} /> Powered by Nonasha Intelligence
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
