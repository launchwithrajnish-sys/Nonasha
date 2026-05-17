import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, Package, ShieldCheck, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OrderSuccess({ onHome, onTrack }: { onHome: () => void, onTrack: (id: string) => void }) {
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('order_id');
    if (id) setOrderId(id);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 md:p-10">
      <div className="max-w-xl w-full text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-brand-leaf/10 text-brand-leaf rounded-full flex items-center justify-center mx-auto mb-12"
        >
          <CheckCircle2 size={64} className="animate-pulse" />
        </motion.div>

        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-6xl font-medium tracking-tighter mb-6 text-neutral-900 leading-tight">
            Order <span className="italic text-brand-leaf font-serif italic">Confirmed.</span>
          </h1>
          <p className="text-brand-dark/40 text-lg font-medium mb-12">
            Your journey towards recovery has officially begun. We've sent a confirmation email with all the details.
          </p>

          <div className="bg-white p-8 md:p-10 rounded-[48px] border border-neutral-100 shadow-2xl shadow-black/5 mb-12 text-left">
            <div className="space-y-6">
              <div className="flex items-center justify-between group">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30">Order Reference</span>
                <span className="text-sm font-black tracking-widest uppercase">#{orderId || 'S7B2X9F'}</span>
              </div>
              <div className="h-px bg-neutral-100 w-full" />
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-neutral-50 rounded-xl text-brand-leaf">
                   <Mail size={18} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/50">Tracking details sent to your email</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-neutral-50 rounded-xl text-brand-leaf">
                   <ShieldCheck size={18} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/50">Secure packaging & discreet delivery</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
             <button 
               onClick={() => onTrack(orderId)}
               className="flex-1 bg-brand-dark text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all hover:scale-[1.02] shadow-xl"
             >
               Track Package <Package size={18} />
             </button>
             <button 
               onClick={onHome}
               className="flex-1 bg-neutral-100 text-brand-dark py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all"
             >
               Return Home <ArrowRight size={18} />
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
