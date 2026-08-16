import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Address, PaymentMethod } from '../types';
import { InvoiceModal } from '../components/InvoiceModal';
import { mapDbOrderToFrontend } from '../utils/mappers';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, CreditCard, Smartphone, Banknote, 
  MapPin, CheckCircle, Lock, ArrowLeft, Loader2
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { 
    language, cart, currentUser, createOrder, addOrUpdateOrder,
    appliedCoupon, navigateTo, showToast, contactConfig 
  } = useApp();

  const cleanPhone = contactConfig.phone.replace(/[^0-9+]/g, '');
  const cleanWa = contactConfig.whatsapp.replace(/[^0-9]/g, '');

  const [selectedAddress, setSelectedAddress] = useState<Address>(
    currentUser?.addresses[0] || {
      id: 'addr-new',
      name: currentUser?.name || 'Ramesh Patil',
      phone: currentUser?.phone || '+91 98220 12345',
      street: 'Flat 402, Shiv Shakti Height, Baner Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      isDefault: true,
      type: 'home',
    }
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Trusted client display calculation (matches backend exact calculation)
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
  const gstAmount = 0; // Included in price
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee + gstAmount);

  const getApiUrl = (endpoint: string) => {
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL;
    if (baseUrl && typeof baseUrl === 'string' && baseUrl.trim().length > 0) {
      const cleanBase = baseUrl.trim().replace(/\/+$/, '');
      const cleanEndpoint = endpoint.replace(/^\/+/, '');
      return `${cleanBase}/${cleanEndpoint}`;
    }
    return endpoint;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (!selectedAddress.name || !selectedAddress.phone || !selectedAddress.street) {
      showToast(language === 'mr' ? 'कृपया संपूर्ण पत्ता भरा' : 'Please complete shipping address', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }

    setIsProcessing(true);

    if (paymentMethod === 'razorpay' || paymentMethod === 'upi') {
      try {
        // 1. Initiate Razorpay Order from backend with server-verified prices
        const response = await fetch(getApiUrl('/api/payment/create-order'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.price,
              productNameEn: item.product.nameEn,
              productNameMr: item.product.nameMr,
              image: item.product.images[0],
              weight: item.product.weight,
            })),
            couponCode: appliedCoupon?.code,
            shippingAddress: selectedAddress,
            userId: currentUser?.id,
            userEmail: currentUser?.email || (selectedAddress as any).email || 'customer@example.com',
            userName: selectedAddress.name || currentUser?.name || 'Customer',
            userPhone: selectedAddress.phone || currentUser?.phone || '',
          }),
        });

        const orderData = await response.json();

        if (!response.ok || !orderData.success) {
          throw new Error(orderData.error || 'Failed to initiate Razorpay order on server.');
        }

        const { razorpayOrderId, orderId, orderNumber, amountInPaise, keyId, order: createdOrder } = orderData;

        // 2. Ensure Razorpay SDK is loaded
        if (!(window as any).Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Razorpay Checkout script'));
            document.body.appendChild(script);
          });
        }

        const activeKeyId = keyId || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '';
        if (!activeKeyId) {
          throw new Error('Razorpay Key ID is not configured on server or client. Please set RAZORPAY_KEY_ID in environment variables.');
        }

        if (!razorpayOrderId) {
          throw new Error('Razorpay Order ID was not generated by server.');
        }

        // 3. Configure Razorpay modal options
        const options = {
          key: activeKeyId,
          amount: amountInPaise,
          currency: 'INR',
          name: 'Dadacha Dhaba | दादाचा ढाबा',
          description: `Order ${orderNumber}`,
          image: 'https://rkzmsyqxyjpaqiomiaxf.supabase.co/storage/v1/object/public/site-assets/dadanchadhabalogo.png',
          order_id: razorpayOrderId,
          prefill: {
            name: selectedAddress.name,
            email: currentUser?.email || (selectedAddress as any).email || '',
            contact: selectedAddress.phone,
          },
          theme: {
            color: '#F4B400',
          },
          handler: async (paymentResponse: any) => {
            try {
              // 4. Verify payment on backend server
              const verifyRes = await fetch(getApiUrl('/api/payment/verify'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                  orderId: orderId,
                }),
              });

              const verifyData = await verifyRes.json();

              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || 'Payment signature verification failed');
              }

              const verifiedOrder = mapDbOrderToFrontend(verifyData.order || createdOrder);
              addOrUpdateOrder(verifiedOrder);
              setPlacedOrder(verifiedOrder);
              setShowInvoiceModal(true);

              try {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              } catch (e) {}

              showToast(
                language === 'mr'
                  ? 'पेमेंट यशस्वी! दादाचा ढाबा परिवारातर्फे मनःपूर्वक धन्यवाद ❤️'
                  : 'Payment verified & order placed successfully! Thank you for ordering ❤️',
                'success'
              );
            } catch (verifyErr: any) {
              console.error('Payment verification error:', verifyErr);
              showToast(verifyErr.message || 'Payment verification failed', 'error');
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              showToast(
                language === 'mr'
                  ? 'पेमेंट प्रक्रिया रद्द करण्यात आली. तुम्ही पुन्हा प्रयत्न करू शकता.'
                  : 'Payment process cancelled. You can retry payment anytime.',
                'info'
              );
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);

        rzp.on('payment.failed', function (failedRes: any) {
          setIsProcessing(false);
          showToast(
            failedRes.error?.description || 'Payment failed. Please try another card or UPI.',
            'error'
          );
        });

        rzp.open();
      } catch (err: any) {
        console.error('Razorpay payment flow error:', err);
        setIsProcessing(false);
        showToast(err.message || 'Could not initiate Razorpay payment', 'error');
      }
    } else {
      // Cash on Delivery Flow
      try {
        const orderObj = createOrder('cod', selectedAddress);
        setPlacedOrder(orderObj);
        setShowInvoiceModal(true);
        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}
        showToast(
          language === 'mr'
            ? 'ऑर्डर यशस्वी झाली! दादाचा ढाबा परिवारातर्फे मनःपूर्वक धन्यवाद ❤️'
            : 'COD Order placed successfully! Thank you for ordering from Dadacha Dhaba ❤️',
          'success'
        );
      } catch (err: any) {
        showToast('Error placing COD order: ' + err.message, 'error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (cart.length === 0 && !placedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-3xl">🛒</p>
        <h2 className="text-2xl font-bold text-white">
          {language === 'mr' ? 'कार्टमध्ये कोणतीही वस्तू नाही' : 'No items to checkout'}
        </h2>
        <button
          onClick={() => navigateTo('shop')}
          className="bg-[#F4B400] text-[#111111] font-bold text-xs px-6 py-2.5 rounded-full"
        >
          {language === 'mr' ? 'शॉप वर जा' : 'Go To Shop'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('cart')}
            className="p-2 bg-[#1A1A1A] hover:bg-zinc-800 text-white rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-marathi">
              {language === 'mr' ? 'सुरक्षित चेकआउट' : 'Secure Checkout'}
            </h1>
            <p className="text-xs text-zinc-400">
              {language === 'mr' ? '२५६-बिट एनक्रिप्टेड पेमेंट' : '256-Bit Encrypted Payment'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Address & Payment */}
        <div className="lg:col-span-8 space-y-6">
          {/* Shipping Address Section */}
          <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-white text-base font-marathi flex items-center gap-2 border-b border-zinc-800 pb-3">
              <MapPin className="w-5 h-5 text-[#F4B400]" />
              <span>{language === 'mr' ? '१. डिलिव्हरी पत्ता' : '1. Delivery Address'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  {language === 'mr' ? 'पूर्ण नाव *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={selectedAddress.name}
                  onChange={(e) => setSelectedAddress({ ...selectedAddress, name: e.target.value })}
                  className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  {language === 'mr' ? 'मोबाइल नंबर *' : 'Phone Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={selectedAddress.phone}
                  onChange={(e) => setSelectedAddress({ ...selectedAddress, phone: e.target.value })}
                  className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  {language === 'mr' ? 'घर / फ्लॅट नं. व रस्ता *' : 'Flat/House No, Street, Landmark *'}
                </label>
                <input
                  type="text"
                  required
                  value={selectedAddress.street}
                  onChange={(e) => setSelectedAddress({ ...selectedAddress, street: e.target.value })}
                  className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  {language === 'mr' ? 'शहर / जिल्हा *' : 'City *'}
                </label>
                <input
                  type="text"
                  required
                  value={selectedAddress.city}
                  onChange={(e) => setSelectedAddress({ ...selectedAddress, city: e.target.value })}
                  className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  {language === 'mr' ? 'पिनकोड *' : 'Pincode *'}
                </label>
                <input
                  type="text"
                  required
                  value={selectedAddress.pincode}
                  onChange={(e) => setSelectedAddress({ ...selectedAddress, pincode: e.target.value })}
                  className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-white text-base font-marathi flex items-center gap-2 border-b border-zinc-800 pb-3">
              <CreditCard className="w-5 h-5 text-[#F4B400]" />
              <span>{language === 'mr' ? '२. पेमेंट पर्याय निवडा' : '2. Select Payment Method'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* BHIM UPI */}
              <div
                onClick={() => setPaymentMethod('upi')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-[#1F1600] border-[#F4B400] text-white shadow-lg'
                    : 'bg-[#111111] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Smartphone className="w-6 h-6 text-[#F4B400]" />
                <div>
                  <h4 className="font-bold text-xs text-white">BHIM UPI / Google Pay / PhonePe</h4>
                  <p className="text-[10px] text-zinc-400">Instant 1-Click Payment</p>
                </div>
              </div>

              {/* Razorpay */}
              <div
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'bg-[#1F1600] border-[#F4B400] text-white shadow-lg'
                    : 'bg-[#111111] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <CreditCard className="w-6 h-6 text-[#F4B400]" />
                <div>
                  <h4 className="font-bold text-xs text-white">Razorpay (Cards / Netbanking)</h4>
                  <p className="text-[10px] text-zinc-400">All Indian Banks Supported</p>
                </div>
              </div>

              {/* Cash On Delivery */}
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                  paymentMethod === 'cod'
                    ? 'bg-[#1F1600] border-[#F4B400] text-white shadow-lg'
                    : 'bg-[#111111] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Banknote className="w-6 h-6 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-xs text-white">Cash on Delivery (COD)</h4>
                  <p className="text-[10px] text-zinc-400">Pay cash upon home delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Order Summary & Confirm */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-black text-white text-base border-b border-zinc-800 pb-3">
              {language === 'mr' ? 'ऑर्डर सारांश' : 'Order Summary'}
            </h3>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 text-xs">
                  <img src={item.product.images[0]} alt="p" className="w-10 h-10 object-cover rounded-lg border border-zinc-800" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate font-marathi">
                      {language === 'mr' ? item.product.nameMr : item.product.nameEn}
                    </p>
                    <p className="text-zinc-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-[#F4B400]">₹{item.product.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-3 space-y-2 text-xs text-zinc-300">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-white">₹{subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Coupon Discount:</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (5%):</span>
                <span>₹{gstAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="text-emerald-400 font-bold">{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between text-base font-black text-white">
                <span>Total Amount:</span>
                <span className="text-[#F4B400]">₹{grandTotal}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-black text-base py-4 rounded-2xl hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{language === 'mr' ? 'पेमेंट प्रक्रिया सुरू आहे...' : 'Processing Payment...'}</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {paymentMethod === 'razorpay' || paymentMethod === 'upi'
                      ? (language === 'mr' ? `Razorpay द्वारे ₹${grandTotal} द्या` : `Pay ₹${grandTotal} via Razorpay`)
                      : (language === 'mr' ? 'ऑर्डर निश्चित करा (COD)' : 'Confirm & Place COD Order')}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Support Help Card */}
          <div className="bg-[#161616] border border-zinc-800 p-5 rounded-3xl space-y-3 shadow-xl">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider text-zinc-300">
              Need help with your order?
            </h4>
            <div className="flex flex-col gap-2 text-xs">
              <a 
                href={`tel:${cleanPhone}`} 
                className="flex items-center gap-2 text-white font-bold hover:text-[#F4B400] transition-colors p-2 bg-[#111111] rounded-xl border border-zinc-800"
              >
                <span>📞 {contactConfig.phone}</span>
              </a>
              <a 
                href={`https://wa.me/${cleanWa}?text=${encodeURIComponent('Hello Dadacha Dhaba,\n\nI need help regarding my checkout order.')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-2 text-emerald-400 font-bold hover:underline p-2 bg-emerald-950/40 rounded-xl border border-emerald-800/60"
              >
                <span>💬 WhatsApp Support</span>
              </a>
            </div>
          </div>
        </div>
      </form>

      {/* Invoice Modal Trigger */}
      {showInvoiceModal && placedOrder && (
        <InvoiceModal
          order={placedOrder}
          onClose={() => {
            setShowInvoiceModal(false);
            navigateTo('orders');
          }}
        />
      )}
    </div>
  );
};
