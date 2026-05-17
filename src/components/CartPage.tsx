import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Minus, Plus, Trash2, ArrowLeft, Leaf, ShieldCheck, Truck, RefreshCcw, Clock, CreditCard, Smartphone, Building2, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, serverTimestamp } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size: string;
}

interface Address {
  id: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

interface CartPageProps {
  onBack: () => void;
  onSuccess: (orderId: string) => void;
  cartItems: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
}

export default function CartPage({ onBack, onSuccess, cartItems, updateQuantity, removeItem }: CartPageProps) {
  const { user, profile } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLoadingPincode, setIsLoadingPincode] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment'>('cart');
  const [errors, setErrors] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod'>('cod');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      fetchSavedAddresses();
    }
    // Set payment method to COD by default and keep it there
    setPaymentMethod('cod');
  }, [user]);

  const fetchSavedAddresses = async () => {
    if (!user) return;
    const path = `users/${user.uid}/addresses`;
    try {
      const q = collection(db, 'users', user.uid, 'addresses');
      const querySnapshot = await getDocs(q);
      const addresses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
      setSavedAddresses(addresses);
      if (addresses.length > 0) {
        const defaultAddr = addresses[0];
        setSelectedAddressId(defaultAddr.id);
        setShippingData({
          fullName: defaultAddr.fullName,
          address: defaultAddr.address,
          city: defaultAddr.city,
          state: defaultAddr.state,
          zipCode: defaultAddr.zipCode,
          phone: defaultAddr.phone
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  };

  const [shippingData, setShippingData] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal; // FREE Shipping included

  const handlePincodeChange = async (pincode: string) => {
    setShippingData(prev => ({ ...prev, zipCode: pincode }));
    if (errors.length > 0) setErrors([]);

    if (pincode.length === 6) {
      setIsLoadingPincode(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (data[0] && data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0];
          setShippingData(prev => ({
            ...prev,
            city: postOffice.District,
            state: postOffice.State
          }));
        }
      } catch (error) {
        console.error("Error fetching pincode details:", error);
      } finally {
        setIsLoadingPincode(false);
      }
    }
  };

  const validateStep = () => {
    const newErrors: string[] = [];
    if (checkoutStep === 'cart') {
      if (!email || !email.includes('@')) newErrors.push('Please enter a valid email address');
    } else if (checkoutStep === 'shipping') {
      if (!shippingData.fullName) newErrors.push('Full name is required');
      if (!shippingData.phone) newErrors.push('Phone number is required');
      if (!shippingData.address) newErrors.push('Complete address is required');
      if (!shippingData.city) newErrors.push('City is required');
      if (!shippingData.zipCode) newErrors.push('Pincode is required');
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateStep()) {
      if (checkoutStep === 'cart') {
        setCheckoutStep('shipping');
      } else if (checkoutStep === 'shipping') {
        setCheckoutStep('payment');
      }
      setErrors([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCheckingOut(true);
    setErrors([]);
    try {
      // For COD, we can directly save the order and show success
      // Save order to Firestore if user is logged in
      const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const orderPayload = {
        userId: user?.uid || 'GUEST',
        customerEmail: email,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total: total,
        status: 'Confirmed',
        shippingAddress: shippingData,
        paymentMethod: 'cod',
        createdAt: serverTimestamp()
      };

      if (user) {
        const orderPath = 'orders';
        try {
          await addDoc(collection(db, orderPath), orderPayload);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, orderPath);
        }
      } else {
        // For guest, still save order but flagged as guest
        const orderPath = 'orders';
        try {
          await addDoc(collection(db, orderPath), { ...orderPayload, isGuest: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, orderPath);
        }
      }

      onSuccess(orderId);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-brand-dark pt-32 pb-20 px-6 md:px-10 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Navigation / Progress */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <motion.button 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => {
              if (checkoutStep === 'payment') setCheckoutStep('shipping');
              else if (checkoutStep === 'shipping') setCheckoutStep('cart');
              else onBack();
            }}
            className="flex items-center gap-2 text-brand-dark/40 hover:text-brand-dark transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">
              {checkoutStep === 'cart' ? 'Return to Gallery' : 'Previous Step'}
            </span>
          </motion.button>

          <div className="flex items-center gap-4">
             {['Items', 'Shipping', 'Payment'].map((step, idx) => {
               const currentStepIdx = checkoutStep === 'cart' ? 0 : checkoutStep === 'shipping' ? 1 : 2;
               const isActive = idx === currentStepIdx;
               const isCompleted = idx < currentStepIdx;
               
               return (
                 <div key={step} className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                       isActive ? 'bg-brand-leaf text-white' : isCompleted ? 'bg-brand-leaf/20 text-brand-leaf' : 'bg-neutral-100 text-neutral-400'
                     }`}>
                       {isCompleted ? <ShieldCheck size={12} /> : idx + 1}
                     </span>
                     <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:inline ${
                       isActive ? 'text-brand-dark' : 'text-neutral-300'
                     }`}>
                       {step}
                     </span>
                   </div>
                   {idx < 2 && <div className="w-8 h-px bg-neutral-100" />}
                 </div>
               );
             })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 xl:gap-24">
          
          {/* Main Content */}
          <div className="xl:col-span-7">
            <AnimatePresence mode="wait">
              {checkoutStep === 'cart' && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <header className="mb-12">
                     <div className="flex items-center gap-3 mb-4">
                        <span className="bg-brand-leaf/10 text-brand-leaf text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">In Stock</span>
                        <span className="text-neutral-300 text-[10px] font-black uppercase tracking-widest">Premium Collection</span>
                     </div>
                     <h1 className="text-4xl md:text-6xl font-medium tracking-tighter mb-4 leading-none text-neutral-900 leading-tight">
                        Advanced <span className="italic text-brand-leaf">Recovery</span> Drops
                     </h1>
                     <p className="text-brand-dark/60 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
                        A concentrated Ayurvedic blend designed to help reduce common modern cravings and restore natural neurological balance.
                     </p>
                  </header>

                  {/* Cart Items List */}
                  <div className="space-y-6 mb-12">
                     {cartItems.map((item) => (
                        <div 
                          key={item.id}
                          className="flex flex-col md:flex-row items-center gap-8 md:gap-10 p-8 rounded-[40px] bg-white border border-neutral-100 shadow-xl shadow-black/5"
                        >
                          <div className="w-40 h-40 bg-neutral-50 rounded-3xl p-4 flex items-center justify-center shrink-0">
                             <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          
                          <div className="flex-1 text-center md:text-left">
                             <h3 className="text-2xl font-bold mb-2 tracking-tight">{item.name}</h3>
                             <p className="text-brand-dark/40 text-sm font-bold uppercase tracking-widest mb-6">{item.size}</p>
                             
                             <div className="flex items-center justify-center md:justify-start gap-6">
                                <div className="flex items-center gap-4 bg-neutral-50 px-4 py-2 rounded-full border border-neutral-100">
                                   <button 
                                     onClick={() => updateQuantity(item.id, -1)}
                                     className="text-brand-dark/30 hover:text-brand-dark transition-colors"
                                   >
                                     <Minus size={16} />
                                   </button>
                                   <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                                   <button 
                                     onClick={() => updateQuantity(item.id, 1)}
                                     className="text-brand-dark/30 hover:text-brand-dark transition-colors"
                                   >
                                     <Plus size={16} />
                                   </button>
                                </div>
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                >
                                   <Trash2 size={20} />
                                 </button>
                             </div>
                          </div>

                          <div className="text-right">
                             <div className="text-3xl font-black tracking-tighter">{item.price} Rs</div>
                             <p className="text-[10px] text-brand-leaf font-bold uppercase tracking-widest mt-2">Free Delivery</p>
                          </div>
                        </div>
                     ))}
                  </div>

                  <div className="mb-20">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-brand-dark/30">Contact Information</h4>
                     <input 
                       type="email" 
                       value={email}
                       onChange={(e) => {
                         setEmail(e.target.value);
                         if (errors.length > 0) setErrors([]);
                       }}
                       placeholder="your@email.com" 
                       className={`w-full bg-white border p-6 rounded-2xl font-bold text-lg focus:outline-none focus:border-brand-leaf/40 transition-all shadow-sm ${
                         errors.some(e => e.includes('email')) ? 'border-red-500 bg-red-50' : 'border-neutral-100'
                       }`}
                     />
                     <p className="mt-4 text-[10px] font-bold text-brand-dark/20 uppercase tracking-widest">Tracking details will be sent to this email address.</p>
                  </div>
                </motion.div>
              )}

              {checkoutStep === 'shipping' && (
                <motion.div 
                  key="shipping"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <header>
                     <div className="flex items-center gap-2 mb-4">
                        <Truck size={16} className="text-brand-leaf" />
                        <span className="text-brand-leaf text-[10px] font-black uppercase tracking-widest">Express Courier Delivery</span>
                     </div>
                     <h2 className="text-4xl md:text-5xl font-medium tracking-tighter mb-4 text-neutral-900 leading-tight">
                        Shipping <span className="italic text-brand-leaf">Details.</span>
                     </h2>
                     <p className="text-brand-dark/40 text-lg font-medium leading-relaxed max-w-xl">Where should we deliver your order? We ensure discreet packaging for your privacy.</p>
                  </header>

                  <div className="space-y-8">
                     {/* Saved Addresses Selector */}
                     {savedAddresses.length > 0 && (
                       <div className="bg-white p-8 md:p-10 rounded-[40px] border border-neutral-100 shadow-sm">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-leaf mb-8 flex items-center gap-2">
                             <MapPin size={14} /> 00 Select Saved Address
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {savedAddresses.map((addr) => (
                               <button 
                                 key={addr.id}
                                 onClick={() => {
                                   setSelectedAddressId(addr.id);
                                   setShippingData({
                                      fullName: addr.fullName,
                                      address: addr.address,
                                      city: addr.city,
                                      state: addr.state,
                                      zipCode: addr.zipCode,
                                      phone: addr.phone
                                   });
                                 }}
                                 className={`p-6 rounded-3xl border transition-all text-left group ${
                                   selectedAddressId === addr.id ? 'border-brand-leaf bg-brand-leaf/[0.02]' : 'border-neutral-100 hover:border-neutral-200'
                                 }`}
                               >
                                 <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-bold text-sm text-brand-dark uppercase tracking-tight">{addr.fullName}</h5>
                                    {selectedAddressId === addr.id && <CheckCircle2 size={14} className="text-brand-leaf" />}
                                 </div>
                                 <p className="text-[10px] text-brand-dark/40 font-medium uppercase tracking-widest leading-relaxed line-clamp-2">
                                   {addr.address}, {addr.city}
                                 </p>
                               </button>
                             ))}
                          </div>
                          <div className="mt-8 flex items-center gap-4">
                             <div className="flex-1 h-px bg-neutral-100" />
                             <button 
                               onClick={() => setSelectedAddressId(null)}
                               className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 hover:text-brand-leaf transition-colors"
                             >
                               Or Enter New Details
                             </button>
                             <div className="flex-1 h-px bg-neutral-100" />
                          </div>
                       </div>
                     )}

                     {/* Recipient Details */}
                     <div className="bg-white p-8 md:p-10 rounded-[40px] border border-neutral-100 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/20 mb-8 flex items-center gap-2">
                          <span className="w-4 h-px bg-neutral-100"></span> 01 Recipient Info
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/30 ml-1">Full Name</label>
                           <input 
                               type="text" 
                               value={shippingData.fullName}
                               onChange={(e) => {
                                 setShippingData({...shippingData, fullName: e.target.value});
                                 if (errors.length > 0) setErrors([]);
                               }}
                               placeholder="e.g. Rahul Sharma" 
                               className={`w-full bg-neutral-50/50 border p-6 rounded-2xl font-bold text-base focus:outline-none focus:border-brand-leaf/40 focus:bg-white transition-all shadow-sm placeholder:text-neutral-300 ${
                                 errors.some(e => e.toLowerCase().includes('name')) ? 'border-red-500 bg-red-50' : 'border-neutral-100'
                               }`}
                             />
                           </div>
                           <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/30 ml-1">Phone Number</label>
                           <input 
                               type="tel" 
                               value={shippingData.phone}
                               onChange={(e) => {
                                 setShippingData({...shippingData, phone: e.target.value});
                                 if (errors.length > 0) setErrors([]);
                               }}
                               placeholder="+91" 
                               className={`w-full bg-neutral-50/50 border p-6 rounded-2xl font-bold text-base focus:outline-none focus:border-brand-leaf/40 focus:bg-white transition-all shadow-sm placeholder:text-neutral-300 ${
                                 errors.some(e => e.toLowerCase().includes('phone')) ? 'border-red-500 bg-red-50' : 'border-neutral-100'
                               }`}
                             />
                           </div>
                        </div>
                     </div>

                     {/* Delivery Address */}
                     <div className="bg-white p-8 md:p-10 rounded-[40px] border border-neutral-100 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/20 mb-8 flex items-center gap-2">
                          <span className="w-4 h-px bg-neutral-100"></span> 02 Delivery Address
                        </h4>
                        <div className="space-y-8">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/30 ml-1">Complete Address</label>
                           <textarea 
                               rows={3}
                               value={shippingData.address}
                               onChange={(e) => {
                                 setShippingData({...shippingData, address: e.target.value});
                                 if (errors.length > 0) setErrors([]);
                               }}
                               placeholder="House No, Building, Street, Area..." 
                               className={`w-full bg-neutral-50/50 border p-6 rounded-2xl font-bold text-base focus:outline-none focus:border-brand-leaf/40 focus:bg-white transition-all shadow-sm resize-none placeholder:text-neutral-300 ${
                                 errors.some(e => e.toLowerCase().includes('address')) ? 'border-red-500 bg-red-50' : 'border-neutral-100'
                               }`}
                             />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/30 ml-1">City</label>
                               <input 
                                 type="text" 
                                 value={shippingData.city}
                                 onChange={(e) => setShippingData({...shippingData, city: e.target.value})}
                                 placeholder="e.g. Delhi" 
                                 className="w-full bg-neutral-50/50 border border-neutral-100 p-6 rounded-2xl font-bold text-base focus:outline-none focus:border-brand-leaf/40 focus:bg-white transition-all shadow-sm placeholder:text-neutral-300"
                               />
                             </div>
                             <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/30 ml-1">State</label>
                               <input 
                                 type="text" 
                                 value={shippingData.state}
                                 onChange={(e) => setShippingData({...shippingData, state: e.target.value})}
                                 placeholder="e.g. Maharashtra" 
                                 className="w-full bg-neutral-50/50 border border-neutral-100 p-6 rounded-2xl font-bold text-base focus:outline-none focus:border-brand-leaf/40 focus:bg-white transition-all shadow-sm placeholder:text-neutral-300"
                               />
                             </div>
                             <div className="space-y-3 relative">
                               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/30 ml-1">Pincode</label>
                               <div className="relative">
                                 <input 
                                   type="text" 
                                   maxLength={6}
                                   value={shippingData.zipCode}
                                   onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, ''))}
                                   placeholder="6 Digits" 
                                   className="w-full bg-neutral-50/50 border border-neutral-100 p-6 rounded-2xl font-bold text-base focus:outline-none focus:border-brand-leaf/40 focus:bg-white transition-all shadow-sm placeholder:text-neutral-300"
                                 />
                                 {isLoadingPincode && (
                                   <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                     <Loader2 size={20} className="animate-spin text-brand-leaf" />
                                   </div>
                                 )}
                               </div>
                             </div>
                          </div>
                        </div>
                     </div>

                     <div className="flex flex-col md:flex-row items-center gap-4 bg-brand-leaf/5 p-6 rounded-3xl border border-brand-leaf/10">
                        <div className="w-10 h-10 bg-brand-leaf text-white rounded-xl flex items-center justify-center shrink-0">
                           <ShieldCheck size={20} />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-leaf text-center md:text-left leading-relaxed">
                          Privacy notice: Your package will be delivered in plain, unbranded packaging to ensure maximum discretion.
                        </p>
                     </div>
                  </div>
                </motion.div>
              )}

              {checkoutStep === 'payment' && (
                <motion.div 
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  <header>
                     <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck size={16} className="text-brand-leaf" />
                        <span className="text-brand-leaf text-[10px] font-black uppercase tracking-widest">100% Secure Checkout</span>
                     </div>
                     <h2 className="text-4xl md:text-5xl font-medium tracking-tighter mb-4 text-neutral-900 leading-tight">
                        Payment <span className="italic text-brand-leaf">Method.</span>
                     </h2>
                     <p className="text-brand-dark/40 text-lg font-medium leading-relaxed max-w-xl">Select your preferred payment method. All transactions are encrypted and secure.</p>
                  </header>

                  <div className="grid grid-cols-1 gap-4">
                     {[
                        { id: 'cod', name: 'Cash on Delivery', desc: 'Pay when your package arrives', icon: Truck, highlight: 'Safe & Easy' },
                     ].map((method) => (
                        <div 
                          key={method.id}
                          className="group relative flex items-center gap-6 p-8 rounded-[40px] border border-brand-leaf bg-brand-leaf/[0.03] shadow-lg shadow-brand-leaf/5 transition-all text-left"
                        >
                          {method.highlight && (
                            <div className="absolute top-4 right-8 bg-brand-leaf text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                              {method.highlight}
                            </div>
                          )}
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-brand-leaf text-white">
                             <method.icon size={32} />
                          </div>
                          <div className="flex-1">
                             <h4 className="font-bold text-xl tracking-tight mb-1">{method.name}</h4>
                             <p className="text-sm font-medium text-brand-dark/40 uppercase tracking-widest text-[10px]">{method.desc}</p>
                          </div>
                          <div className="w-6 h-6 rounded-full border-2 border-brand-leaf bg-brand-leaf flex items-center justify-center">
                             <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          </div>
                        </div>
                     ))}
                  </div>

                  <div className="bg-neutral-900 p-8 rounded-[40px] text-white/90 border border-neutral-800 shadow-2xl">
                     <div className="flex items-start gap-6">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                           <Clock className="text-brand-leaf" size={24} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest mb-2 text-brand-leaf">Billing Information</h4>
                          <p className="text-xs font-medium text-white/40 leading-relaxed uppercase tracking-widest text-[10px]">
                            {paymentMethod === 'cod' 
                              ? 'You will pay the total amount directly to our courier executive at the time of delivery.' 
                              : 'Your statement will discreetly show "Recovery Care Service" instead of the brand name.'}
                            Total amount to be paid: <span className="text-white font-bold">{total} Rs</span>.
                          </p>
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Detailed Product Info (Only show on cart step) */}
            {checkoutStep === 'cart' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 mt-20">
                <div className="bg-white p-10 rounded-[40px] border border-neutral-100 shadow-lg shadow-black/[0.02]">
                    <div className="w-12 h-12 bg-brand-leaf/10 text-brand-leaf rounded-2xl flex items-center justify-center mb-8">
                      <Leaf size={24} />
                    </div>
                    <h4 className="text-xl font-bold mb-6 tracking-tight">Potent Ingredients</h4>
                    <ul className="space-y-4">
                      {[
                          { name: "Brahmi", role: "Neuro-Support" },
                          { name: "Giloy", role: "Detoxification" },
                          { name: "Amla", role: "Antioxidant" },
                          { name: "Arjuna", role: "Cardio Health" },
                          { name: "Kalmegh", role: "Liver Care" }
                      ].map((ing) => (
                          <li key={ing.name} className="flex items-center justify-between group">
                            <span className="text-sm font-bold text-brand-dark/80 group-hover:text-brand-leaf transition-colors">{ing.name}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/20">{ing.role}</span>
                          </li>
                      ))}
                    </ul>
                </div>

                <div className="bg-neutral-900 p-10 rounded-[40px] text-white shadow-xl">
                    <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-8">
                      <Clock size={24} />
                    </div>
                    <h4 className="text-xl font-bold mb-6 tracking-tight">Daily Protocol</h4>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                          <div className="text-brand-leaf font-black text-sm pt-0.5">01</div>
                          <p className="text-sm text-white/50 leading-relaxed font-medium">Add 2–3 drops to a glass of lukewarm water or as directed.</p>
                      </div>
                      <div className="flex gap-4">
                          <div className="text-brand-leaf font-black text-sm pt-0.5">02</div>
                          <p className="text-sm text-white/50 leading-relaxed font-medium">For maximum absorption, consume 3–4 times daily.</p>
                      </div>
                      <div className="flex gap-4">
                          <div className="text-brand-leaf font-black text-sm pt-0.5">03</div>
                          <p className="text-sm text-white/50 leading-relaxed font-medium">Maintain consistency for 90 days for internal restoration.</p>
                      </div>
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Order Summary & Checkout */}
          <div className="xl:col-span-5 relative">
            <div className="sticky top-32 space-y-8">
               {/* Summary Card */}
               <div className="bg-white rounded-[48px] p-10 md:p-12 border border-neutral-100 shadow-2xl shadow-black/5 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-leaf/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  
                  <h2 className="text-2xl font-black uppercase tracking-[0.2em] mb-10 text-brand-dark">
                    Order Summary
                  </h2>
                  
                  <div className="space-y-6 mb-10">
                     <div className="flex justify-between items-center group cursor-default">
                        <span className="text-sm font-bold text-brand-dark/30 uppercase tracking-widest">Order Subtotal</span>
                        <span className="text-lg font-bold">{subtotal} Rs</span>
                     </div>
                     <div className="flex justify-between items-center group cursor-default">
                        <span className="text-sm font-bold text-brand-dark/30 uppercase tracking-widest">Processing (GST)</span>
                        <span className="text-sm font-bold text-brand-leaf uppercase">Tax Included</span>
                     </div>
                     <div className="flex justify-between items-center group cursor-default">
                        <span className="text-sm font-bold text-brand-dark/30 uppercase tracking-widest">Express Shipping</span>
                        <span className="bg-brand-leaf/10 text-brand-leaf text-[10px] font-black px-2 py-1 rounded-md tracking-[0.2em]">FREE</span>
                     </div>
                  </div>

                  <div className="h-px bg-neutral-100 mb-10" />

                  <div className="space-y-12 mb-10">
                    {errors.length > 0 && (
                      <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
                        <ul className="list-disc list-inside space-y-1">
                          {errors.map((err, i) => (
                            <li key={i} className="text-[10px] font-black uppercase tracking-widest text-red-500">{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-between items-end mb-8">
                       <div>
                          <p className="text-[10px] font-black text-brand-dark/30 uppercase tracking-[0.3em] mb-2">Grand Total</p>
                          <span className="text-5xl font-black tracking-tighter text-brand-dark">{total} Rs</span>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] text-brand-leaf font-black uppercase tracking-widest flex items-center justify-end gap-1">
                             <ShieldCheck size={12} /> Secure
                          </p>
                       </div>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={(checkoutStep === 'cart' || checkoutStep === 'shipping') ? handleNextStep : handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full bg-brand-dark text-white py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-xs hover:bg-neutral-800 transition-all hover:scale-[1.01] active:translate-y-1 shadow-2xl shadow-black/10 disabled:opacity-50"
                  >
                    {isCheckingOut ? 'Processing Order...' : 
                     checkoutStep === 'cart' ? 'Process to Shipping' : 
                     checkoutStep === 'shipping' ? 'Process to Payment' : 
                     paymentMethod === 'cod' ? 'Confirm COD Order' : 'Confirm & Pay Now'}
                  </button>

                  <div className="mt-8 flex justify-center gap-4">
                     {['Visa', 'UPI', 'Mastercard'].map(m => (
                       <span key={m} className="text-[8px] font-black text-neutral-300 uppercase tracking-widest border border-neutral-100 px-2 py-1 rounded">{m}</span>
                     ))}
                  </div>
               </div>

               {/* Trust Badges */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-white rounded-3xl border border-neutral-100 flex items-center gap-4">
                     <Truck className="text-brand-leaf" size={24} />
                     <div>
                        <h5 className="text-xs font-black uppercase tracking-widest mb-0.5">Quick Ship</h5>
                        <p className="text-[10px] text-brand-dark/40 font-bold uppercase">2-4 Business Days</p>
                     </div>
                  </div>
                  <div className="p-6 bg-white rounded-3xl border border-neutral-100 flex items-center gap-4">
                     <RefreshCcw className="text-brand-leaf" size={24} />
                     <div>
                        <h5 className="text-xs font-black uppercase tracking-widest mb-0.5">Easy Returns</h5>
                        <p className="text-[10px] text-brand-dark/40 font-bold uppercase">Within 7 Days</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
