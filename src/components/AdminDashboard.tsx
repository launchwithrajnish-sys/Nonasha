import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Package, User, Calendar, MapPin, Phone, Mail, 
  ChevronRight, Search, Filter, Loader2, ArrowLeft,
  CheckCircle, Clock, XCircle, Trash2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentMethod: string;
  createdAt: any;
  isGuest?: boolean;
}

export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-blue-100 text-blue-700';
      case 'Processing': return 'bg-amber-100 text-amber-700';
      case 'Shipped': return 'bg-purple-100 text-purple-700';
      case 'Delivered': return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-leaf animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] pt-32 pb-20 px-6 md:px-10">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div>
            <button 
              onClick={onBack}
              className="group flex items-center gap-2 text-brand-dark/40 hover:text-brand-dark transition-colors mb-4"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Back to Front</span>
            </button>
            <h1 className="text-4xl font-black tracking-tighter text-neutral-900 flex items-center gap-4">
              Order <span className="italic text-brand-leaf">Master</span> Panel
              <span className="text-sm bg-brand-leaf/10 text-brand-leaf px-4 py-1 rounded-full">{orders.length} TOTAL</span>
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input 
                type="text"
                placeholder="Search email, name, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 bg-white border border-neutral-100 rounded-2xl w-full sm:w-[320px] font-medium text-sm focus:outline-none focus:border-brand-leaf transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-neutral-100 rounded-2xl px-4 py-2 shadow-sm">
              <Filter size={16} className="text-neutral-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-black text-[10px] uppercase tracking-widest focus:outline-none"
              >
                {['All', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* Order List */}
          <div className="xl:col-span-8 space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white p-20 rounded-[40px] border border-neutral-100 text-center">
                <Package className="w-12 h-12 text-neutral-200 mx-auto mb-6" />
                <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">No orders found matching your criteria.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <motion.div 
                  key={order.id}
                  layoutId={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`group bg-white p-6 md:p-8 rounded-[32px] border transition-all cursor-pointer hover:shadow-xl hover:shadow-black/5 ${
                    selectedOrder?.id === order.id ? 'border-brand-leaf' : 'border-neutral-100 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center shrink-0">
                        <Package size={24} className="text-neutral-400 group-hover:text-brand-leaf transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30">Order #{order.id.slice(0, 8)}</span>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          {order.isGuest && (
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-neutral-900 text-white">GUEST</span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-neutral-800 mb-1">{order.shippingAddress?.fullName}</h3>
                        <p className="text-xs font-medium text-brand-dark/40 uppercase tracking-widest flex items-center gap-2">
                          <Mail size={12} /> {order.customerEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-6 md:pt-0">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-brand-dark/30 uppercase tracking-[0.2em] mb-1">Grand Total</p>
                        <span className="text-2xl font-black tracking-tighter">{order.total} Rs</span>
                      </div>
                      <ChevronRight size={20} className="text-neutral-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Details Sidebar */}
          <div className="xl:col-span-4 h-fit">
            {selectedOrder ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[40px] border border-neutral-100 shadow-2xl overflow-hidden sticky top-32"
              >
                <div className="p-8 md:p-10">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <span className="text-[10px] font-black text-brand-leaf uppercase tracking-widest mb-2 block font-serif italic">Management</span>
                      <h2 className="text-2xl font-bold tracking-tight">Order Details</h2>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-neutral-50 rounded-full transition-colors text-neutral-400"><XCircle size={24} /></button>
                  </div>

                  <div className="space-y-10">
                    {/* Items */}
                    <div>
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-dark/20 mb-6 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-brand-leaf" /> Itemized List
                       </h4>
                       <div className="space-y-4">
                          {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-neutral-50 p-4 rounded-2xl">
                               <div>
                                 <p className="font-bold text-sm">{item.name}</p>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/30">Qty: {item.quantity}</p>
                               </div>
                               <span className="font-black text-sm">{item.price * item.quantity} Rs</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    {/* Customer & Shipping */}
                    <div>
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-dark/20 mb-6 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-brand-leaf" /> Fulfillment Data
                       </h4>
                       <div className="space-y-6">
                          <div className="flex items-start gap-4">
                             <User size={16} className="text-brand-leaf mt-1" />
                             <div>
                               <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Customer</p>
                               <p className="text-sm font-bold">{selectedOrder.shippingAddress?.fullName}</p>
                             </div>
                          </div>
                          <div className="flex items-start gap-4">
                             <Phone size={16} className="text-brand-leaf mt-1" />
                             <div>
                               <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Contact</p>
                               <p className="text-sm font-bold">{selectedOrder.shippingAddress?.phone}</p>
                             </div>
                          </div>
                          <div className="flex items-start gap-4">
                             <MapPin size={16} className="text-brand-leaf mt-1" />
                             <div>
                               <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Destination</p>
                               <p className="text-sm font-bold leading-relaxed">
                                 {selectedOrder.shippingAddress?.address}<br />
                                 {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}<br />
                                 {selectedOrder.shippingAddress?.zipCode}
                               </p>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-8 border-t border-neutral-100 flex flex-wrap gap-3">
                       {['Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                         <button 
                           key={status}
                           onClick={() => updateOrderStatus(selectedOrder.id, status)}
                           className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                             selectedOrder.status === status ? 'bg-brand-dark text-white' : 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100'
                           }`}
                         >
                           {status}
                         </button>
                       ))}
                       <button 
                         onClick={() => deleteOrder(selectedOrder.id)}
                         className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center gap-2"
                       >
                         <Trash2 size={12} /> Delete
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-neutral-50 h-[600px] rounded-[40px] border border-dashed border-neutral-200 flex items-center justify-center p-12 text-center sticky top-32">
                <div>
                   <Package className="w-12 h-12 text-neutral-200 mx-auto mb-6" />
                   <h3 className="text-xl font-bold mb-4 tracking-tight">Select an order</h3>
                   <p className="text-neutral-400 text-sm font-medium leading-relaxed">Click on any order from the list to view complete fulfillment details and manage its status.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
