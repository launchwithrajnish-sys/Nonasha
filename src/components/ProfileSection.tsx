import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Package, MapPin, CreditCard, ChevronRight, LogOut, 
  Trash2, Plus, Home, Briefcase, ShieldCheck, Clock, CheckCircle2,
  Camera, Loader2, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db, storage, serverTimestamp } from '../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

interface ProfileSectionProps {
  onLogout: () => void;
}

export default function ProfileSection({ onLogout }: ProfileSectionProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'payments'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [newPayment, setNewPayment] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Orders
      const orderPath = 'orders';
      try {
        const orderQuery = query(collection(db, orderPath), where('userId', '==', user?.uid));
        const orderDocs = await getDocs(orderQuery);
        setOrders(orderDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, orderPath);
      }

      // Fetch Addresses
      if (user) {
        const addressPath = `users/${user.uid}/addresses`;
        try {
          const addressQuery = collection(db, 'users', user.uid, 'addresses');
          const addressDocs = await getDocs(addressQuery);
          setAddresses(addressDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, addressPath);
        }

        // Fetch Payments
        const paymentPath = `users/${user.uid}/payments`;
        try {
          const paymentQuery = collection(db, 'users', user.uid, 'payments');
          const paymentDocs = await getDocs(paymentQuery);
          setPayments(paymentDocs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, paymentPath);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    onLogout();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = sRef(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update Auth Profile
      await updateProfile(user, { photoURL: downloadURL });

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: downloadURL
      });

      // Refresh page to show new image (or let context update)
      window.location.reload(); 
    } catch (error) {
      console.error("Error uploading image:", error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (window.confirm('Delete this address?')) {
      const path = `users/${user!.uid}/addresses/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user!.uid, 'addresses', id));
        setAddresses(prev => prev.filter(a => a.id !== id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (window.confirm('Remove this payment method?')) {
      const path = `users/${user!.uid}/payments/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user!.uid, 'payments', id));
        setPayments(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const path = `users/${user.uid}/payments`;
    try {
      const paymentData = {
        cardName: newPayment.cardName,
        last4: newPayment.cardNumber.slice(-4),
        expiry: newPayment.expiry,
        type: 'Visa', // Simulation
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'users', user.uid, 'payments'), paymentData);
      setPayments(prev => [...prev, { id: docRef.id, ...paymentData }]);
      setShowAddPayment(false);
      setNewPayment({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const path = `users/${user.uid}/addresses`;
    try {
      const addressData = {
        ...newAddress,
        userId: user.uid,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'users', user.uid, 'addresses'), addressData);
      setAddresses(prev => [...prev, { id: docRef.id, ...addressData }]);
      setShowAddAddress(false);
      setNewAddress({
        fullName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[56px] border border-neutral-100 shadow-xl shadow-black/[0.02]">
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="w-24 h-24 bg-brand-leaf/10 rounded-full flex items-center justify-center text-brand-leaf mb-6 overflow-hidden border-4 border-white shadow-xl relative mt-4">
                    {isUploading ? (
                      <Loader2 size={32} className="animate-spin" />
                    ) : profile?.photoURL ? (
                      <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-4 right-0 w-8 h-8 bg-brand-dark text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Camera size={14} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                  />
                </div>
                <h2 className="text-2xl font-black tracking-tighter text-brand-dark uppercase">{profile?.displayName || 'Guest User'}</h2>
                <p className="text-[10px] font-bold text-brand-dark/30 uppercase tracking-[0.2em] mt-2">{profile?.email}</p>
                
                <div className="mt-10 w-full pt-8 border-t border-neutral-50 flex flex-col gap-2">
                   {[
                     { id: 'orders', label: 'Your Orders', icon: Package },
                     { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
                     { id: 'payments', label: 'Payments', icon: CreditCard }
                   ].map(item => (
                     <button
                       key={item.id}
                       onClick={() => setActiveTab(item.id as any)}
                       className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all ${
                         activeTab === item.id ? 'bg-brand-dark text-white' : 'hover:bg-neutral-50 text-brand-dark/60'
                       }`}
                     >
                       <div className="flex items-center gap-4">
                         <item.icon size={18} />
                         <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                       </div>
                       <ChevronRight size={14} className={activeTab === item.id ? 'opacity-100' : 'opacity-20'} />
                     </button>
                   ))}
                   
                   <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 p-5 rounded-3xl text-red-500 hover:bg-red-50 transition-all mt-4"
                   >
                     <LogOut size={18} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Logout Account</span>
                   </button>
                </div>
              </div>
            </div>

            <div className="bg-brand-dark text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                 <ShieldCheck className="text-brand-leaf mb-6" size={32} />
                 <h4 className="text-lg font-black uppercase tracking-tighter mb-4">A-Class Security</h4>
                 <p className="text-white/40 text-[10px] leading-relaxed font-medium uppercase tracking-[0.2em]">Your recovery data and personal insights are encrypted with military-grade standards. Fully GDPR compliant.</p>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-leaf/10 blur-[60px] rounded-full -mr-16 -mt-16" />
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-8">
            <div className="bg-white min-h-[600px] p-10 md:p-16 rounded-[64px] border border-neutral-100 shadow-xl shadow-black/[0.02]">
              <AnimatePresence mode="wait">
                {activeTab === 'orders' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-brand-leaf text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">History</span>
                        <h3 className="text-3xl font-black tracking-tighter text-brand-dark uppercase">Your Orders</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-brand-dark/20 uppercase tracking-widest">{orders.length} Records Found</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {loading ? (
                        <div className="py-20 flex justify-center"><Clock className="animate-spin text-neutral-200" size={32} /></div>
                      ) : orders.length === 0 ? (
                        <div className="py-20 text-center space-y-6">
                          <Package className="mx-auto text-neutral-100" size={64} />
                          <p className="text-brand-dark/30 text-[10px] uppercase font-black tracking-widest">No orders placed yet</p>
                        </div>
                      ) : (
                        orders.map(order => (
                          <div key={order.id} className="group p-8 border border-neutral-50 rounded-[40px] hover:border-brand-leaf/20 transition-all hover:bg-neutral-50/50">
                             <div className="flex flex-wrap justify-between items-start gap-6">
                                <div className="space-y-4">
                                   <div className="flex items-center gap-3">
                                      <span className="bg-neutral-100 px-3 py-1 rounded-full text-[10px] font-black text-brand-dark/40 tracking-widest uppercase">#{order.id.slice(0,8)}</span>
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                                        order.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-brand-leaf/10 text-brand-leaf'
                                      }`}>
                                        {order.status}
                                      </span>
                                   </div>
                                   <h4 className="text-xl font-bold text-brand-dark">{order.items[0]?.name || 'Unknown Product'}</h4>
                                   <p className="text-[10px] text-brand-dark/40 font-black uppercase tracking-widest">Ordered on {new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-brand-dark/20 uppercase tracking-[0.2em] mb-1">Total Amount</p>
                                   <span className="text-3xl font-black text-brand-dark">{order.total} Rs</span>
                                   <div className="mt-4">
                                      <button className="text-[10px] font-black text-brand-leaf uppercase tracking-widest border-b border-brand-leaf/20 pb-1 hover:border-brand-leaf transition-all">Track Step-by-Step</button>
                                   </div>
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'addresses' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-brand-leaf text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Logistics</span>
                        <h3 className="text-3xl font-black tracking-tighter text-brand-dark uppercase">Shipping Vault</h3>
                      </div>
                      <button 
                        onClick={() => setShowAddAddress(true)}
                        className="bg-brand-dark text-white p-4 rounded-2xl hover:scale-105 transition-all active:scale-95"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                      {addresses.map((addr, idx) => (
                        <div key={idx} className="relative p-8 border border-neutral-100 rounded-[40px] hover:border-neutral-200 transition-all">
                           <div className="absolute top-8 right-8 flex gap-3">
                              <button onClick={() => handleDeleteAddress(addr.id)} className="text-neutral-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                           </div>
                           <div className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-brand-dark/40 mb-6">
                             {idx === 0 ? <Home size={20} /> : <Briefcase size={20} />}
                           </div>
                           <h4 className="text-lg font-black text-brand-dark uppercase mb-2">{addr.fullName}</h4>
                           <p className="text-xs text-brand-dark/50 leading-relaxed font-medium uppercase tracking-widest text-[10px] mb-6">
                             {addr.address}, {addr.city}, {addr.state} - {addr.zipCode}
                           </p>
                           <div className="flex items-center gap-2">
                             <CheckCircle2 size={12} className="text-brand-leaf" />
                             <span className="text-[10px] font-black text-brand-dark/30 uppercase tracking-widest">Verified Primary</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'payments' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >
                     <div className="flex justify-between items-end">
                      <div>
                        <span className="text-brand-leaf text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Finance</span>
                        <h3 className="text-3xl font-black tracking-tighter text-brand-dark uppercase">Saved Cards</h3>
                      </div>
                      <button 
                        onClick={() => setShowAddPayment(true)}
                        className="bg-brand-dark text-white p-4 rounded-2xl hover:scale-105 transition-all active:scale-95"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    {payments.length === 0 ? (
                      <div className="py-20 text-center space-y-6 bg-neutral-50/50 rounded-[48px] border border-dashed border-neutral-100">
                         <CreditCard className="mx-auto text-neutral-100" size={64} />
                         <div>
                            <p className="text-brand-dark/30 text-[10px] uppercase font-black tracking-widest mb-2">No active payment methods</p>
                            <p className="text-[9px] text-neutral-300 uppercase tracking-widest max-w-xs mx-auto">Card information is saved securely in your private vault.</p>
                         </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {payments.map((pay) => (
                          <div key={pay.id} className="relative p-8 bg-neutral-900 rounded-[40px] text-white overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                            <button 
                              onClick={() => handleDeletePayment(pay.id)}
                              className="absolute top-6 right-6 text-white/20 hover:text-red-400 transition-colors z-10"
                            >
                              <Trash2 size={16} />
                            </button>
                            <CreditCard size={24} className="text-brand-leaf mb-12" />
                            <p className="text-xl font-bold tracking-widest mb-6">•••• •••• •••• {pay.last4}</p>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1 flex items-center gap-1">
                                  <ShieldCheck size={8} /> Card Holder
                                </p>
                                <p className="text-xs font-bold uppercase">{pay.cardName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Expires</p>
                                <p className="text-xs font-bold">{pay.expiry}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddAddress && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddAddress(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[48px] overflow-hidden shadow-2xl"
            >
              <div className="p-10 md:p-14">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-brand-dark">New Address</h3>
                  <button onClick={() => setShowAddAddress(false)} className="text-neutral-300 hover:text-brand-dark transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddAddress} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">Full Name</label>
                      <input 
                        type="text" required
                        value={newAddress.fullName}
                        onChange={e => setNewAddress({...newAddress, fullName: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-100 p-5 rounded-2xl font-bold focus:outline-none focus:border-brand-leaf/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">Phone</label>
                      <input 
                        type="tel" required
                        value={newAddress.phone}
                        onChange={e => setNewAddress({...newAddress, phone: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-100 p-5 rounded-2xl font-bold focus:outline-none focus:border-brand-leaf/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">Detail Address</label>
                    <textarea 
                      required rows={3}
                      value={newAddress.address}
                      onChange={e => setNewAddress({...newAddress, address: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-100 p-5 rounded-2xl font-bold focus:outline-none focus:border-brand-leaf/40"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">City</label>
                      <input 
                        type="text" required
                        value={newAddress.city}
                        onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-100 p-5 rounded-2xl font-bold focus:outline-none focus:border-brand-leaf/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">State</label>
                      <input 
                        type="text" required
                        value={newAddress.state}
                        onChange={e => setNewAddress({...newAddress, state: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-100 p-5 rounded-2xl font-bold focus:outline-none focus:border-brand-leaf/40"
                      />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">Zip Code</label>
                      <input 
                        type="text" required
                        value={newAddress.zipCode}
                        onChange={e => setNewAddress({...newAddress, zipCode: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-100 p-5 rounded-2xl font-bold focus:outline-none focus:border-brand-leaf/40"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-dark text-white py-6 rounded-3xl font-black uppercase tracking-[0.4em] text-xs hover:bg-neutral-800 transition-all shadow-xl"
                  >
                    Save Address
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {showAddPayment && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddPayment(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[48px] overflow-hidden shadow-2xl"
            >
              <div className="p-10 md:p-14">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-brand-dark">New Payment</h3>
                  <button onClick={() => setShowAddPayment(false)} className="text-neutral-300 hover:text-brand-dark transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddPayment} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">Card Holder Name</label>
                    <input 
                      type="text" required
                      value={newPayment.cardName}
                      onChange={e => setNewPayment({...newPayment, cardName: e.target.value})}
                      placeholder="NAME ON CARD"
                      className="w-full bg-neutral-50 border border-neutral-100 p-5 rounded-2xl font-bold focus:outline-none focus:border-brand-leaf/40 uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">Card Number</label>
                    <input 
                      type="text" required
                      value={newPayment.cardNumber}
                      onChange={e => setNewPayment({...newPayment, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16)})}
                      placeholder="•••• •••• •••• ••••"
                      className="w-full bg-neutral-50 border border-neutral-100 p-5 rounded-2xl font-bold focus:outline-none focus:border-brand-leaf/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">Expiry</label>
                      <input 
                        type="text" required
                        value={newPayment.expiry}
                        onChange={e => setNewPayment({...newPayment, expiry: e.target.value})}
                        placeholder="MM/YY"
                        className="w-full bg-neutral-50 border border-neutral-100 p-5 rounded-2xl font-bold focus:outline-none focus:border-brand-leaf/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30 ml-2">CVV</label>
                      <input 
                        type="password" required
                        value={newPayment.cvv}
                        onChange={e => setNewPayment({...newPayment, cvv: e.target.value.replace(/\D/g, '').slice(0, 3)})}
                        placeholder="•••"
                        className="w-full bg-neutral-50 border border-neutral-100 p-5 rounded-2xl font-bold focus:outline-none focus:border-brand-leaf/40"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-dark text-white py-6 rounded-3xl font-black uppercase tracking-[0.4em] text-xs hover:bg-neutral-800 transition-all shadow-xl"
                  >
                    Save Payment Method
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
