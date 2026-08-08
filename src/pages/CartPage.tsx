import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, ShoppingBag, ArrowRight, Tag, ShieldCheck, Check, Truck } from 'lucide-react';

export const CartPage: React.FC = () => {
  const { 
    language, cart, removeFromCart, updateCartQuantity, 
    clearCart, navigateTo, appliedCoupon, applyCoupon, 
    removeCoupon, showToast, contactConfig 
  } = useApp();

  const [couponInput, setCouponInput] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else {
      discountAmount = appliedCoupon.value;
    }
  }

  const shippingFee = subtotal > 499 || cart.length === 0 ? 0 : 50;
  const gstAmount = Math.round(((subtotal - discountAmount) * 0.05));
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee + gstAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    if (res.success) setCouponInput('');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-24 h-24 bg-[#1C1C1C] border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xl">
          🍲
        </div>
        <h2 className="text-2xl font-black text-white font-marathi">
          {language === 'mr' ? 'तुमची कार्ट रिकामी आहे' : 'Your Shopping Cart is Empty'}
        </h2>
        <p className="text-xs text-zinc-400 font-marathi max-w-sm mx-auto">
          {language === 'mr' 
            ? 'दादांच्या अस्सल कांदा लसूण मसाल्यांचा सुवास अनुभवण्यासाठी आताच खरेदी करा!' 
            : 'Add authentic Maharashtrian masale and traditional brass handi to your cart.'}
        </p>
        <button
          onClick={() => navigateTo('shop')}
          className="bg-[#F4B400] text-[#111111] font-bold text-xs px-8 py-3.5 rounded-2xl hover:bg-[#FF8C00] transition-all inline-flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{language === 'mr' ? 'शॉपिंग सुरू करा' : 'Start Shopping Now'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="border-b border-zinc-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white font-marathi">
            {language === 'mr' ? 'तुमची खरेदी कार्ट' : 'Shopping Cart'}
          </h1>
          <p className="text-xs text-zinc-400">
            {cart.length} {language === 'mr' ? 'उत्पादने समाविष्ट आहेत' : 'items in cart'}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
        >
          {language === 'mr' ? 'कार्ट खाली करा' : 'Clear Cart'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="bg-[#161616] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-lg"
            >
              <img
                src={item.product.images[0]}
                alt={item.product.nameEn}
                className="w-20 h-20 object-cover rounded-xl border border-zinc-700 shrink-0"
              />

              <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                <span className="text-[10px] bg-zinc-800 text-zinc-300 font-semibold px-2 py-0.5 rounded">
                  {item.product.weight}
                </span>
                <h3 className="font-bold text-white text-base font-marathi truncate">
                  {language === 'mr' ? item.product.nameMr : item.product.nameEn}
                </h3>
                <p className="text-xs text-[#F4B400] font-bold">
                  ₹{item.product.price} <span className="text-zinc-500 line-through text-[11px] ml-1">₹{item.product.originalPrice}</span>
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#1F1F1F] border border-zinc-700 rounded-xl p-1">
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 text-white font-bold hover:bg-zinc-800 rounded flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-white text-xs">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 text-white font-bold hover:bg-zinc-800 rounded flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Coupon Card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coupon Box */}
          <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#F4B400]" />
              <span>{language === 'mr' ? 'कूपन कोड वापरा' : 'Apply Promo Code'}</span>
            </h3>

            {appliedCoupon ? (
              <div className="bg-emerald-950/60 border border-emerald-700 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-emerald-400 text-xs block">{appliedCoupon.code}</span>
                  <span className="text-[10px] text-zinc-300">
                    {language === 'mr' ? appliedCoupon.descriptionMr : appliedCoupon.descriptionEn}
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-rose-400 font-bold hover:underline"
                >
                  {language === 'mr' ? 'काढा' : 'Remove'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. DADA10 or SWAD200"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="w-full bg-[#111111] text-white text-xs uppercase px-3 py-2 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                />
                <button
                  type="submit"
                  className="bg-[#F4B400] text-[#111111] font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#FF8C00]"
                >
                  {language === 'mr' ? 'लागू करा' : 'Apply'}
                </button>
              </form>
            )}

            <p className="text-[10px] text-zinc-500 italic">
              Try: <strong>DADA10</strong> (10% off) or <strong>SWAD200</strong> (₹200 off above ₹1499)
            </p>
          </div>

          {/* Price Breakdown */}
          <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-black text-white text-base border-b border-zinc-800 pb-3">
              {language === 'mr' ? 'बिल सारांश' : 'Bill Summary'}
            </h3>

            <div className="space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span>{language === 'mr' ? 'उप-एकूण (Subtotal):' : 'Item Subtotal:'}</span>
                <span className="font-semibold text-white">₹{subtotal}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>{language === 'mr' ? 'कूपन सूट:' : 'Coupon Discount:'}</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>{language === 'mr' ? 'जीएसटी (5% included):' : 'GST (5% Included):'}</span>
                <span>₹{gstAmount}</span>
              </div>

              <div className="flex justify-between">
                <span>{language === 'mr' ? 'डिलिव्हरी शुल्क:' : 'Shipping Charges:'}</span>
                <span className={shippingFee === 0 ? 'text-emerald-400 font-bold' : 'text-white'}>
                  {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                </span>
              </div>

              <div className="border-t border-zinc-800 pt-3 flex justify-between text-base font-black text-white">
                <span>{language === 'mr' ? 'एकूण रक्कम:' : 'Grand Total:'}</span>
                <span className="text-[#F4B400]">₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={() => navigateTo('checkout')}
              className="w-full bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-extrabold text-sm py-4 rounded-2xl hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <span>{language === 'mr' ? 'चेकआउट कडे चला' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Need help placing your order? Box */}
          <div className="bg-[#161616] border border-zinc-800 p-5 rounded-3xl space-y-3 shadow-xl">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider text-zinc-300">
              Need help placing your order?
            </h4>
            <p className="text-[11px] text-zinc-400">
              Order directly via WhatsApp or speak with our customer care representative.
            </p>
            <a
              href={`https://wa.me/${contactConfig.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hello Dadacha Dhaba,\n\nI need help placing my order.\n\nMy Cart Items:\n${cart.map((i) => `- ${i.product.nameEn} (x${i.quantity}) - ₹${i.product.price * i.quantity}`).join('\n')}\n\nGrand Total: ₹${grandTotal}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>💬 Order / Help on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
