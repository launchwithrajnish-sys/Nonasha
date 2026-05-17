import { motion } from 'motion/react';
import { Package, Truck, CheckCircle, Search, ArrowLeft, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function OrderTracking({ onBack }: { onBack: () => void }) {
  const [orderId, setOrderId] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: any) => {
    e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/track/${orderId.toUpperCase()}`);
      if (!response.ok) throw new Error('Order not found. Please check your ID.');
      const data = await response.json();
      setTrackingData(data);
    } catch (err: any) {
      setError(err.message);
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Confirmed', icon: <CheckCircle size={20} />, status: 'Confirmed' },
    { label: 'Processing', icon: <Clock size={20} />, status: 'Processing' },
    { label: 'Shipped', icon: <Package size={20} />, status: 'Shipped' },
    { label: 'Delivered', icon: <MapPin size={20} />, status: 'Delivered' }
  ];

  const getCurrentStepIndex = () => {
    if (!trackingData) return -1;
    const s = trackingData.status;
    if (s === 'Processing') return 1;
    if (s === 'Shipped') return 2;
    if (s === 'Out for Delivery') return 2;
    if (s === 'Delivered') return 3;
    return 0;
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pt-40 pb-20 px-6 md:px-10 lg:px-24">
      <div className="max-w-3xl mx-auto">
        <motion.button 
          onClick={onBack}
          className="flex items-center gap-2 text-brand-dark/40 hover:text-brand-dark mb-12 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Wellness</span>
        </motion.button>

        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-medium tracking-tighter mb-6 text-neutral-900 leading-tight">
            Track Your <span className="italic text-brand-leaf font-serif">Order</span>
          </h1>
          <p className="text-brand-dark/40 text-lg font-medium">Enter your Order ID to see the journey of your Nonasha drops.</p>
        </header>

        <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4 mb-20">
          <input 
            type="text" 
            placeholder="e.g. 7A3B2F1X"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="flex-1 bg-white border border-neutral-200 px-8 py-6 rounded-3xl text-lg font-bold tracking-widest placeholder:text-neutral-300 focus:outline-none focus:border-brand-leaf/40 transition-colors shadow-sm"
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-brand-dark text-white px-10 py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Searching...' : <>Track Order <Search size={18} /></>}
          </button>
        </form>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-500 p-8 rounded-3xl border border-red-100 mb-12 text-center font-bold">
            {error}
          </motion.div>
        )}

        {trackingData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 md:p-16 rounded-[64px] border border-neutral-100 shadow-2xl shadow-black/5"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 border-b border-neutral-100 pb-12">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 mb-2">Order ID</p>
                  <h3 className="text-2xl font-black tracking-tight text-neutral-900">#{trackingData.id}</h3>
               </div>
               <div className="text-right md:text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 mb-2">Status</p>
                  <span className="bg-brand-leaf/10 text-brand-leaf px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                    {trackingData.status}
                  </span>
               </div>
            </div>

            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-8 top-0 bottom-0 w-px bg-neutral-100 hidden md:block" />
              
              <div className="space-y-12">
                {steps.map((step, idx) => {
                  const isCompleted = idx <= getCurrentStepIndex();
                  const isCurrent = idx === getCurrentStepIndex();

                  return (
                    <div key={idx} className="flex items-start gap-8 relative group">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 shrink-0 ${
                        isCompleted ? 'bg-brand-leaf text-white shadow-xl shadow-brand-leaf/20' : 'bg-neutral-50 text-neutral-300'
                      } ${isCurrent ? 'scale-110' : ''}`}>
                        {step.icon}
                      </div>
                      <div>
                        <h4 className={`text-xl font-bold mb-1 tracking-tight ${isCompleted ? 'text-neutral-900' : 'text-neutral-300'}`}>
                          {step.label}
                        </h4>
                        <p className="text-sm font-medium text-brand-dark/30">
                          {isCompleted ? 'Completed at 10:24 AM' : 'Expected soon'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-16 pt-12 border-t border-neutral-100">
               <div className="flex items-center gap-4 p-8 bg-neutral-50 rounded-[40px]">
                  <Truck className="text-brand-leaf" size={24} />
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-widest mb-1 text-neutral-900">Estimated Delivery</h5>
                    <p className="text-sm font-bold text-brand-leaf uppercase tracking-widest">{trackingData.estimatedDelivery || 'In 3-5 Business Days'}</p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
