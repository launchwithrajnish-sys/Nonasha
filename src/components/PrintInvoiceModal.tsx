import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, FileText, Tag, Check, HelpCircle, CornerDownRight } from 'lucide-react';

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
  preferredTimeSlot?: string;
}

interface PrintInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export default function PrintInvoiceModal({ isOpen, onClose, order }: PrintInvoiceModalProps) {
  const [activeTab, setActiveTab] = useState<'both' | 'invoice' | 'label'>('both');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getFormattedDate = () => {
    if (order.createdAt) {
      if (order.createdAt.toDate) {
        return order.createdAt.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const deliverySlot = order.preferredTimeSlot || (order.shippingAddress as any)?.preferredTimeSlot || 'Morning (9 AM - 12 PM)';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4 md:p-10 select-none">
      {/* Target Print Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all application wrapper elements */
          body * {
            visibility: hidden !important;
          }
          /* Show only the target section styled for print */
          .printable-card, .printable-card * {
            visibility: visible !important;
          }
          .printable-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          /* Ensure sensible page breaks if viewing both */
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-neutral-900 border border-white/10 w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-neutral-950">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Printer className="text-brand-leaf" size={20} /> Print Fulfillment Documents
            </h3>
            <p className="text-[10px] uppercase tracking-widest font-black text-white/40 mt-1">Order Ref: #{order.id.toUpperCase()}</p>
          </div>
          
          <div className="flex items-center gap-2 bg-neutral-900 border border-white/10 rounded-2xl p-1.5">
            <button 
              onClick={() => setActiveTab('both')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'both' ? 'bg-white text-brand-dark' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Print Both
            </button>
            <button 
              onClick={() => setActiveTab('invoice')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'invoice' ? 'bg-white text-brand-dark' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Invoice Only
            </button>
            <button 
              onClick={() => setActiveTab('label')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'label' ? 'bg-white text-brand-dark' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Label Only
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="bg-brand-leaf hover:bg-brand-leaf/90 text-white min-h-[44px] px-6 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] flex items-center gap-2 shadow-lg shadow-brand-leaf/10 active:translate-y-0.5 transition-all"
            >
              <Printer size={14} /> Send to Printer
            </button>
            <button 
              onClick={onClose}
              className="w-11 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Workspace area with preview */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-neutral-950/70 space-y-12">
          
          {/* Printable Container wrapper */}
          <div className="printable-card flex flex-col gap-10 max-w-3xl mx-auto">
            
            {/* INVOICE SECTION */}
            {(activeTab === 'both' || activeTab === 'invoice') && (
              <div className={`bg-white text-brand-dark p-8 md:p-12 rounded-[32px] border border-neutral-100 shadow-xl ${
                activeTab === 'both' ? 'page-break' : ''
              }`}>
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-neutral-100 pb-8 mb-8">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-neutral-900 font-serif italic">NONASHA Wellness</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-leaf mt-1">Pure Ayurvedic Vitality</p>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-4">
                      717, Barakhamba Road, Connaught Place,<br />
                      New Delhi, 110001, India<br />
                      support@nonasha.com | +91 98100 12345
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400 bg-neutral-50 px-3 py-1 rounded-full">TAX INVOICE</span>
                    <h3 className="text-xl font-bold tracking-tight mt-4">Invoice No: #{order.id.slice(0, 8).toUpperCase()}</h3>
                    <p className="text-xs font-semibold text-neutral-400 mt-1">Date: {getFormattedDate()}</p>
                  </div>
                </div>

                {/* Details Billing & Shipping information */}
                <div className="grid grid-cols-2 gap-8 mb-10 text-[11px] uppercase tracking-wide">
                  <div>
                    <p className="font-black text-neutral-400 text-[9px] uppercase tracking-[0.2em] mb-2">Billed To</p>
                    <p className="font-black text-sm text-neutral-800 tracking-tight">{order.shippingAddress?.fullName}</p>
                    <p className="font-bold text-neutral-500 mt-1">{order.customerEmail}</p>
                    <p className="font-bold text-neutral-500 mt-0.5">Phone: {order.shippingAddress?.phone}</p>
                  </div>
                  <div>
                    <p className="font-black text-neutral-400 text-[9px] uppercase tracking-[0.2em] mb-2">Payment Details</p>
                    <p className="font-black text-neutral-800">Mode: {order.paymentMethod === 'cod' ? 'CASH ON DELIVERY (COD)' : order.paymentMethod.toUpperCase()}</p>
                    <p className="font-bold text-neutral-500 mt-1">Status: <span className="text-brand-leaf font-black">{order.status}</span></p>
                    {/* Delivery Time Slot perfectly highlighted on the invoice document */}
                    <p className="font-bold text-neutral-500 mt-1">Slot Pref: <span className="text-neutral-800 font-black">{deliverySlot}</span></p>
                  </div>
                </div>

                {/* Delivery Address box */}
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 mb-10">
                  <p className="font-black text-neutral-400 text-[9px] uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-leaf"></span> Shipping Destination
                  </p>
                  <p className="font-black text-neutral-800 text-xs tracking-tight">{order.shippingAddress?.fullName}</p>
                  <p className="font-bold text-neutral-600 mt-1 leading-relaxed text-xs">
                    {order.shippingAddress?.address}<br />
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                  </p>
                </div>

                {/* Invoice Table list */}
                <div className="mb-10">
                  <table className="w-full text-left font-sans border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 text-[9px] font-black uppercase tracking-widest text-neutral-400 pb-3">
                        <th className="pb-3 text-left">Item Description</th>
                        <th className="pb-3 text-center w-24">Unit Price</th>
                        <th className="pb-3 text-center w-24">Quantity</th>
                        <th className="pb-3 text-right w-32">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {order.items.map((item, index) => (
                        <tr key={index} className="text-xs">
                          <td className="py-4 font-bold text-neutral-800">
                            {item.name}
                            <span className="block text-[9px] font-bold text-neutral-400 mt-0.5 uppercase tracking-wider">SKU: IND-{item.id.slice(0, 5)}</span>
                          </td>
                          <td className="py-4 text-center font-bold text-neutral-500">{item.price} Rs</td>
                          <td className="py-4 text-center font-bold text-neutral-800">{item.quantity}</td>
                          <td className="py-4 text-right font-black text-neutral-900">{item.price * item.quantity} Rs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer calculation blocks */}
                <div className="border-t border-neutral-100 pt-6 flex flex-col items-end">
                  <div className="w-full max-w-xs space-y-3 font-sans text-xs">
                    <div className="flex justify-between font-bold text-neutral-500">
                      <span>Subtotal Weight / Val</span>
                      <span>{order.total} Rs</span>
                    </div>
                    <div className="flex justify-between font-bold text-neutral-500">
                      <span>Shipping (Express COD)</span>
                      <span className="text-brand-leaf font-black">FREE</span>
                    </div>
                    <div className="flex justify-between font-bold text-neutral-500">
                      <span>GST (Included 12%)</span>
                      <span>{(order.total * 0.12).toFixed(2)} Rs</span>
                    </div>
                    <div className="border-t border-neutral-100 pt-3 flex justify-between text-base font-black text-neutral-900">
                      <span className="tracking-tight uppercase">Grand Total</span>
                      <span className="text-xl tracking-tighter">{order.total} Rs</span>
                    </div>
                  </div>
                </div>

                {/* Footer note signature */}
                <div className="border-t border-dashed border-neutral-100 mt-12 pt-8 text-center text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                  <p>Thank you for choosing wellness. Ayurveda guidelines suggest taking drops regularly twice daily.</p>
                  <p className="mt-1 text-[8px] font-bold text-neutral-300">This is a system-generated electronic invoice, signature not required.</p>
                </div>
              </div>
            )}

            {/* SHIPPING LABEL SECTION */}
            {(activeTab === 'both' || activeTab === 'label') && (
              <div className="bg-white text-brand-dark p-8 md:p-12 rounded-[32px] border-4 border-double border-neutral-900 shadow-xl max-w-2xl mx-auto w-full">
                {/* Shipping label top indicator */}
                <div className="flex items-center justify-between border-b-2 border-neutral-900 pb-5 mb-5">
                  <div>
                    <h2 className="text-lg font-black tracking-tighter text-neutral-900">NONASHA™ SHIPMENT</h2>
                    <p className="text-[8px] font-black uppercase tracking-widest text-neutral-500">Logistics & Delivery Desk</p>
                  </div>
                  <div className="bg-neutral-950 text-white px-4 py-2 rounded-xl text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest">Payment Mode</p>
                    <p className="font-black text-sm tracking-tight">{order.paymentMethod.toUpperCase()}</p>
                  </div>
                </div>

                {/* Address block layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Sender details */}
                  <div className="border-r-0 md:border-r border-neutral-200 pr-0 md:pr-4">
                    <p className="font-black text-neutral-400 text-[8px] uppercase tracking-[0.2em] mb-2">Shipped From</p>
                    <p className="font-bold text-xs text-neutral-800">NONASHA Wellness Dispatch</p>
                    <p className="text-[10px] font-medium text-neutral-500 leading-relaxed mt-1">
                      717, Barakhamba Road, Connaught Place,<br />
                      New Delhi, 110001, India<br />
                      Phone: +91 98100 12345
                    </p>
                  </div>

                  {/* Consignee Receiver Details */}
                  <div>
                    <p className="font-black text-neutral-400 text-[8px] uppercase tracking-[0.2em] mb-2">Deliver To</p>
                    <p className="font-black text-sm text-neutral-950 uppercase tracking-tight">{order.shippingAddress?.fullName}</p>
                    <p className="text-[11px] font-bold text-neutral-800 leading-relaxed mt-1">
                      {order.shippingAddress?.address}<br />
                      {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
                      <span className="font-black text-sm text-neutral-950 mt-1 block">PIN: {order.shippingAddress?.zipCode}</span>
                    </p>
                    <p className="text-[10px] font-black text-neutral-950 mt-2 flex items-center gap-1">
                      📞 TEL: {order.shippingAddress?.phone}
                    </p>
                  </div>
                </div>

                {/* Preferred time slot displayed beautifully in a high contrast callout block */}
                <div className="bg-neutral-100 border-2 border-dashed border-neutral-900 p-5 rounded-2xl flex flex-col justify-center items-center text-center my-6 select-text">
                  <div className="bg-neutral-950 text-white px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                    ⏰ PREFERRED DELIVERY TIME WINDOW
                  </div>
                  <h4 className="text-base font-black text-neutral-950 tracking-tight">
                    {deliverySlot}
                  </h4>
                  <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide mt-1.5 leading-tight">
                    Fulfillment agent: Please prioritize this range as specified by the customer during checkout.
                  </p>
                </div>

                {/* Layout QR Code / Barcode visualization stamp */}
                <div className="border-t-2 border-neutral-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  {/* Visual Fake Barcode generated perfectly with HTML components */}
                  <div className="w-full max-w-[280px]">
                    <div className="flex h-12 w-full items-end gap-0.5 justify-center bg-neutral-50 p-1 border border-neutral-200 rounded">
                      {Array.from({ length: 42 }).map((_, i) => {
                        const heights = ['h-full', 'h-5/6', 'h-4/5', 'h-full', 'h-3/4', 'h-5/6'];
                        const widths = i % 3 === 0 ? 'w-[3px]' : i % 5 === 0 ? 'w-[4px]' : 'w-[1.5px]';
                        const background = i % 7 === 1 || i % 6 === 2 ? 'bg-transparent' : 'bg-neutral-950';
                        return (
                          <div 
                            key={i} 
                            className={`${widths} ${heights[i % heights.length]} ${background} shrink-0`} 
                          />
                        );
                      })}
                    </div>
                    {/* Raw order code tracking below barcode */}
                    <p className="text-[9px] tracking-[0.35em] font-black text-center mt-1 text-neutral-900 uppercase">
                      *NNS-{order.id.slice(0, 8).toUpperCase()}-COD*
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[7px] font-black text-neutral-400 uppercase tracking-widest">Parcel Contents</p>
                    <p className="text-[10px] font-black text-neutral-800 uppercase mt-0.5">
                      {order.items.map(it => `${it.quantity}x ${it.name.split(' ')[0]}`).join(', ')}
                    </p>
                    <p className="text-[7.5px] font-bold text-neutral-400 uppercase mt-1">Weight: 0.150 KG | Box A</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-neutral-200 pt-3 flex justify-between items-center text-[7.5px] font-bold text-neutral-400 uppercase tracking-wider">
                  <span>Authorized Dispatch Stamp</span>
                  <span>Delhi Reg. Hub-4</span>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Action Controls Footer */}
        <div className="p-6 border-t border-white/10 shrink-0 bg-neutral-950 flex justify-between items-center text-xs text-white/40">
          <p className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[9px]">
            <span className="w-2 h-2 rounded-full bg-brand-leaf animate-pulse"></span> Pressing 'Send to Printer' auto-targets the formatted pages
          </p>
          <button 
            type="button" 
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
          >
            Cancel and Return
          </button>
        </div>
      </motion.div>
    </div>
  );
}
