import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InvoiceModal } from '../components/InvoiceModal';
import { Search, Truck, CheckCircle, Clock, MapPin, Printer, ShieldCheck } from 'lucide-react';

export const TrackOrderPage: React.FC = () => {
  const { language, orders, selectedOrderId, contactConfig } = useApp();
  const [searchKey, setSearchKey] = useState(selectedOrderId || 'DD-2026-1001');

  const cleanPhone = contactConfig.phone.replace(/[^0-9+]/g, '');
  const cleanWa = contactConfig.whatsapp.replace(/[^0-9]/g, '');
  const [foundOrder, setFoundOrder] = useState<any>(
    orders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId) || orders[0]
  );
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchKey.trim().toLowerCase();
    const matched = orders.find(
      (o) =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.id.toLowerCase().includes(query) ||
        o.userPhone.includes(query)
    );

    if (matched) {
      setFoundOrder(matched);
    } else {
      setFoundOrder(null);
    }
  };

  const getStepStatus = (stepName: string) => {
    if (!foundOrder) return 'pending';
    const statusMap: Record<string, number> = {
      placed: 1,
      processing: 2,
      shipped: 3,
      out_for_delivery: 3,
      delivered: 4,
    };
    const currentLevel = statusMap[foundOrder.orderStatus] || 1;
    const stepLevelMap: Record<string, number> = {
      placed: 1,
      processing: 2,
      shipped: 3,
      delivered: 4,
    };
    const stepLevel = stepLevelMap[stepName];

    if (currentLevel > stepLevel) return 'completed';
    if (currentLevel === stepLevel) return 'current';
    return 'pending';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title Header */}
      <div className="bg-gradient-to-r from-[#1E1600] via-[#2A1E00] to-[#141414] p-8 rounded-3xl border border-[#F4B400]/30 text-center space-y-4 shadow-xl">
        <span className="text-xs font-bold text-[#F4B400] bg-[#F4B400]/10 px-3 py-1 rounded-full uppercase">
          🚚 {language === 'mr' ? 'ऑर्डर ट्रॅकिंग' : 'Live Order Tracking'}
        </span>
        <h1 className="text-3xl font-black text-white font-marathi">
          {language === 'mr' ? 'तुमच्या पार्सलची सद्यस्थिती ट्रॅक करा' : 'Track Your Order Status'}
        </h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2 pt-2">
          <input
            type="text"
            placeholder={language === 'mr' ? 'ऑर्डर नंबर किंवा मोबाइल नंबर प्रविष्ट करा...' : 'Enter Order Number (e.g. DD-2026-1001)'}
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            className="w-full bg-[#111111] text-white text-xs px-4 py-3 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
          />
          <button
            type="submit"
            className="bg-[#F4B400] text-[#111111] font-bold text-xs px-6 py-3 rounded-2xl hover:bg-[#FF8C00] shrink-0"
          >
            {language === 'mr' ? 'ट्रॅक करा' : 'Track'}
          </button>
        </form>
      </div>

      {/* Order Status Display */}
      {foundOrder ? (
        <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
          {/* Order Info Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-6">
            <div>
              <span className="text-xs text-zinc-400 font-semibold block">Order Number</span>
              <span className="text-2xl font-black text-[#F4B400]">{foundOrder.orderNumber}</span>
              <p className="text-xs text-zinc-500 mt-1">Placed on: {foundOrder.date}</p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-xs px-3 py-1 rounded-full uppercase">
                Status: {foundOrder.orderStatus.replace('_', ' ')}
              </span>
              <p className="text-xs text-zinc-300">
                Carrier: <strong>{foundOrder.carrier || 'Delhivery Express'}</strong>
              </p>
              <p className="text-xs text-zinc-400">
                AWB: <strong>{foundOrder.trackingNumber || 'DELHIVERY987654'}</strong>
              </p>
            </div>
          </div>

          {/* 4-Step Interactive Visual Tracker */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm uppercase text-zinc-400">Shipment Timeline:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
              {/* Step 1 */}
              <div className={`p-4 rounded-2xl border text-center space-y-2 ${
                getStepStatus('placed') === 'completed' || getStepStatus('placed') === 'current'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                  : 'bg-[#111111] border-zinc-800 text-zinc-500'
              }`}>
                <CheckCircle className="w-6 h-6 mx-auto text-emerald-400" />
                <h4 className="font-bold text-xs">1. Order Placed</h4>
                <p className={`text-[10px] text-zinc-400 ${language === 'mr' ? 'font-marathi' : ''}`}>
                  {language === 'mr' ? 'ऑर्डर स्वीकारली' : 'Order Accepted'}
                </p>
              </div>

              {/* Step 2 */}
              <div className={`p-4 rounded-2xl border text-center space-y-2 ${
                getStepStatus('processing') === 'completed' || getStepStatus('processing') === 'current'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                  : 'bg-[#111111] border-zinc-800 text-zinc-500'
              }`}>
                <Clock className="w-6 h-6 mx-auto text-[#F4B400]" />
                <h4 className="font-bold text-xs">2. Packing</h4>
                <p className={`text-[10px] text-zinc-400 ${language === 'mr' ? 'font-marathi' : ''}`}>
                  {language === 'mr' ? 'मसाले पॅक झाले' : 'Items Packed'}
                </p>
              </div>

              {/* Step 3 */}
              <div className={`p-4 rounded-2xl border text-center space-y-2 ${
                getStepStatus('shipped') === 'completed' || getStepStatus('shipped') === 'current'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                  : 'bg-[#111111] border-zinc-800 text-zinc-500'
              }`}>
                <Truck className="w-6 h-6 mx-auto text-[#F4B400]" />
                <h4 className="font-bold text-xs">3. In Transit</h4>
                <p className={`text-[10px] text-zinc-400 ${language === 'mr' ? 'font-marathi' : ''}`}>
                  {language === 'mr' ? 'मार्गावर आहे' : 'In Transit'}
                </p>
              </div>

              {/* Step 4 */}
              <div className={`p-4 rounded-2xl border text-center space-y-2 ${
                getStepStatus('delivered') === 'completed'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                  : 'bg-[#111111] border-zinc-800 text-zinc-500'
              }`}>
                <ShieldCheck className="w-6 h-6 mx-auto text-emerald-400" />
                <h4 className="font-bold text-xs">4. Delivered</h4>
                <p className={`text-[10px] text-zinc-400 ${language === 'mr' ? 'font-marathi' : ''}`}>
                  {language === 'mr' ? 'डिलिव्हरी झाली' : 'Delivered'}
                </p>
              </div>
            </div>
          </div>

          {/* Item details & Action */}
          <div className="pt-4 border-t border-zinc-800 flex justify-between items-center flex-wrap gap-4">
            <div className="text-xs text-zinc-300">
              <span>Estimated Delivery Date: </span>
              <strong className="text-[#F4B400]">{foundOrder.estimatedDeliveryDate || 'Within 2-3 Days'}</strong>
            </div>

            <button
              onClick={() => setShowInvoiceModal(true)}
              className="bg-[#222222] hover:bg-[#F4B400] hover:text-[#111111] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'mr' ? 'इनव्हॉईस पहा / प्रिंट करा' : 'View / Print Invoice'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-[#161616] rounded-3xl border border-zinc-800 space-y-2">
          <p className="text-3xl">🔍</p>
          <h3 className="text-lg font-bold text-white font-marathi">
            {language === 'mr' ? 'कोणतीही ऑर्डर सापडली नाही' : 'No order found'}
          </h3>
          <p className="text-xs text-zinc-500">
            {language === 'mr' ? 'कृपया बरोबर ऑर्डर नंबर प्रविष्ट करा' : 'Please check the order number and try again.'}
          </p>
        </div>
      )}

      {/* Need Assistance Section */}
      <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-3 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-extrabold text-white text-base font-marathi">
            {language === 'mr' ? 'मदत हवी आहे का?' : 'Need assistance with your order?'}
          </h3>
          <p className="text-xs text-zinc-400">
            {language === 'mr' ? 'आमचा सपोर्ट टीम तुम्हाला मदत करण्यासाठी तत्पर आहे.' : 'Our customer support team is happy to help you track or modify your shipment.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href={`tel:${cleanPhone}`}
            className="bg-[#F4B400] hover:bg-[#FF8C00] text-[#111111] font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            📞 Call Support
          </a>

          <a
            href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hello Dadacha Dhaba,\n\nI need assistance tracking my order ${foundOrder ? foundOrder.orderNumber : ''}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            💬 WhatsApp Support
          </a>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && foundOrder && (
        <InvoiceModal order={foundOrder} onClose={() => setShowInvoiceModal(false)} />
      )}
    </div>
  );
};
