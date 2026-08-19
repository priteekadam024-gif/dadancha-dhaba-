import React from 'react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { DhabaLogo } from './DhabaLogo';
import { Printer, X, Download, CheckCircle } from 'lucide-react';

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const { language, contactConfig } = useApp();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white text-zinc-900 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-zinc-200 animate-scale-up my-8">
        {/* Modal Top Bar */}
        <div className="bg-[#111111] text-white p-4 flex items-center justify-between border-b border-[#F4B400]/40 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              {language === 'mr' ? 'ऑर्डर इनव्हॉईस बिल' : 'Tax Invoice & Bill'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#F4B400] text-[#111111] hover:bg-[#FF8C00] font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'mr' ? 'प्रिंट करा' : 'Print Invoice'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div className="p-8 space-y-6 text-sm font-sans" id="printable-invoice">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6">
            <div>
              <DhabaLogo size="lg" purpose="invoice" />
              <p className="text-xs text-zinc-600 mt-2">
                {contactConfig.address || 'Baner Road, Opposite Balewadi High Street, Pune - 411045'}<br />
                GSTIN: 27AABCD1234E1Z5 | FSSAI Lic: 11523009000123<br />
                Phone: {contactConfig.phone} | {contactConfig.email}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block bg-[#F4B400]/20 text-[#111111] text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                ORIGINAL TAX INVOICE
              </span>
              <p className="text-base font-bold text-zinc-900">{order.orderNumber}</p>
              <p className="text-xs text-zinc-500">Date: {order.date}</p>
              <p className="text-xs font-semibold text-emerald-700 capitalize mt-1">
                Payment Status: {order.paymentStatus} ({order.paymentMethod.toUpperCase()})
              </p>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs">
            <div>
              <h4 className="font-bold text-zinc-900 uppercase text-[11px] text-zinc-500 mb-1">Billed & Shipped To:</h4>
              <p className="font-bold text-sm text-zinc-900">{order.shippingAddress.name}</p>
              <p className="text-zinc-700">{order.shippingAddress.street}</p>
              <p className="text-zinc-700">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              <p className="text-zinc-700 font-semibold mt-1">Phone: {order.shippingAddress.phone}</p>
              <p className="text-zinc-700">Email: {order.userEmail}</p>
            </div>

            <div className="sm:border-l sm:pl-4 border-zinc-200">
              <h4 className="font-bold text-zinc-900 uppercase text-[11px] text-zinc-500 mb-1">Order Summary:</h4>
              <p><span className="text-zinc-500">Carrier:</span> {order.carrier || 'Delhivery Express'}</p>
              <p><span className="text-zinc-500">Tracking AWB:</span> {order.trackingNumber || 'Pending'}</p>
              <p><span className="text-zinc-500">Estimated Delivery:</span> {order.estimatedDeliveryDate}</p>
              {order.couponCode && (
                <p className="text-emerald-600 font-semibold mt-1">Applied Coupon: {order.couponCode}</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-800 bg-zinc-100 text-zinc-700 uppercase font-bold text-[11px]">
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">Weight</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 font-semibold text-zinc-900">
                      {language === 'mr' ? item.productNameMr : item.productNameEn}
                    </td>
                    <td className="py-3 px-3 text-zinc-600">{item.weight}</td>
                    <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">₹{item.price}</td>
                    <td className="py-3 px-3 text-right font-bold text-zinc-900">
                      ₹{item.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Calculation */}
          <div className="flex justify-end pt-4 border-t border-zinc-200">
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-900">₹{order.subtotal}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({order.couponCode}):</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600">
                <span>GST (5% Included):</span>
                <span>₹{order.gstAmount}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Shipping Charges:</span>
                <span>{order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-zinc-900 pt-2 border-t border-zinc-800">
                <span>Grand Total:</span>
                <span className="text-[#111111]">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Stamp & Footer Note */}
          <div className="border-t pt-4 text-center text-xs text-zinc-500 space-y-1">
            <p className="font-bold text-zinc-700">धन्यवाद! दादाचा ढाबा परिवारातर्फे हार्दिक आभार. ❤️</p>
            <p>This is a computer-generated invoice and requires no physical signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
