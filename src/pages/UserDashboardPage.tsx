import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InvoiceModal } from '../components/InvoiceModal';
import { OfficialLogo } from '../components/OfficialLogo';
import { 
  User as UserIcon, Package, MapPin, Heart, ShoppingBag, Settings, LogOut, 
  Printer, Plus, ShieldCheck, CheckCircle2, Edit3, Trash2, KeyRound, 
  Bell, Smartphone, Mail, Lock, Sparkles, ExternalLink, RefreshCw, X, ArrowRight,
  Eye, EyeOff
} from 'lucide-react';
import { Address } from '../types';

export const UserDashboardPage: React.FC = () => {
  const { 
    language, currentUser, logoutUser, orders, products, cart, wishlist,
    updateUserProfile, updateUserNotifications, addAddress, editAddress, 
    deleteAddress, setDefaultAddress, toggleWishlist, addToCart, removeFromCart, 
    updateCartQuantity, navigateTo, showToast, changeUserPassword, activeTab: contextTab, setActiveTab: setContextTab, contactConfig
  } = useApp();

  const cleanWa = contactConfig.whatsapp.replace(/[^0-9]/g, '');

  const activeTab = (contextTab as 'profile' | 'orders' | 'addresses' | 'wishlist' | 'cart' | 'settings') || 'profile';
  const setActiveTab = (tab: 'profile' | 'orders' | 'addresses' | 'wishlist' | 'cart' | 'settings') => {
    setContextTab(tab);
  };
  const [orderFilter, setOrderFilter] = useState<'all' | 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any | null>(null);

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatarUrl || '');

  // Add/Edit Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('Maharashtra');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrType, setAddrType] = useState<'home' | 'work' | 'other'>('home');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Change Password State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-[#F4B400]/10 border border-[#F4B400]/30 rounded-full flex items-center justify-center mx-auto text-3xl">
          🔒
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white font-marathi">
            {language === 'mr' ? 'कृपया आधी खात्यात लॉगिन करा' : 'Authentication Required'}
          </h2>
          <p className="text-xs text-zinc-400">
            {language === 'mr' ? 'तुमचा डॅशबोर्ड, ऑर्डर्स आणि पत्ते पाहण्यासाठी लॉगिन आवश्यक आहे.' : 'Please log in to view your dashboard, manage addresses, and track active orders.'}
          </p>
        </div>
        <button
          onClick={() => navigateTo('login')}
          className="w-full bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-extrabold text-xs py-3.5 rounded-2xl shadow-xl hover:scale-105 transition-all"
        >
          {language === 'mr' ? 'लॉगिन किंवा नोंदणी करा →' : 'Go to Login / Register →'}
        </button>
      </div>
    );
  }

  // Filter user orders
  const userOrders = orders.filter((o) => o.userEmail.toLowerCase() === currentUser.email.toLowerCase() || o.userName === currentUser.name);
  const filteredOrders = userOrders.filter((o) => orderFilter === 'all' || o.orderStatus === orderFilter);

  // Filter wishlist products
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: profileName,
      phone: profilePhone,
      avatarUrl: profileAvatar
    });
    setIsEditingProfile(false);
  };

  const handleOpenAddressModal = (addr?: Address) => {
    if (addr) {
      setEditingAddrId(addr.id);
      setAddrName(addr.name);
      setAddrPhone(addr.phone);
      setAddrStreet(addr.street);
      setAddrCity(addr.city);
      setAddrState(addr.state);
      setAddrPincode(addr.pincode);
      setAddrType(addr.type);
      setAddrIsDefault(addr.isDefault || false);
    } else {
      setEditingAddrId(null);
      setAddrName(currentUser.name);
      setAddrPhone(currentUser.phone);
      setAddrStreet('');
      setAddrCity('');
      setAddrState('Maharashtra');
      setAddrPincode('');
      setAddrType('home');
      setAddrIsDefault(currentUser.addresses.length === 0);
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddrId) {
      editAddress(editingAddrId, {
        name: addrName,
        phone: addrPhone,
        street: addrStreet,
        city: addrCity,
        state: addrState,
        pincode: addrPincode,
        type: addrType,
        isDefault: addrIsDefault
      });
    } else {
      addAddress({
        name: addrName,
        phone: addrPhone,
        street: addrStreet,
        city: addrCity,
        state: addrState,
        pincode: addrPincode,
        type: addrType,
        isDefault: addrIsDefault
      });
    }
    setIsAddressModalOpen(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast(language === 'mr' ? 'नवीन पासवर्ड जुळत नाहीत!' : 'New passwords do not match!', 'error');
      return;
    }
    setPasswordLoading(true);
    const res = await changeUserPassword(newPassword);
    setPasswordLoading(false);

    if (res.success) {
      showToast(language === 'mr' ? 'गुप्त पासवर्ड सुरक्षितपणे बदलला गेला!' : 'Password updated securely in Supabase!');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast(res.message || 'Failed to update password', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1A1200] via-[#2A1E00] to-[#121212] p-6 sm:p-8 rounded-3xl border border-[#F4B400]/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#F4B400]/5 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center md:text-left flex-col sm:flex-row">
            <div className="shrink-0 hidden lg:block">
              <OfficialLogo size="lg" variant="icon" />
            </div>
            <div className="relative">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt={currentUser.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#F4B400] shadow-xl"
              />
              <button
                onClick={() => {
                  setIsEditingProfile(true);
                  setActiveTab('profile');
                }}
                className="absolute -bottom-1 -right-1 bg-[#F4B400] text-[#111111] p-1.5 rounded-lg shadow hover:scale-110 transition-transform"
                title="Edit Avatar"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white font-marathi">
                  Welcome back, {currentUser.name} 👋
                </h1>
                {currentUser.emailVerified && (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Supabase User
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-400">
                {currentUser.email} • {currentUser.phone || 'No phone added'} • Member since {currentUser.createdAt || '2026'}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                <span className="bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/30 text-[11px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentUser.points} {language === 'mr' ? 'रिवॉर्ड पॉइंट्स' : 'Reward Points'}</span>
                </span>
                <span className="text-xs text-zinc-500 font-medium truncate max-w-xs">
                  ID: <code className="text-zinc-300 font-mono text-[11px]">{currentUser.id}</code>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={`https://wa.me/${cleanWa}?text=${encodeURIComponent('Hello Dadacha Dhaba,\n\nI need help regarding my account.')}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-emerald-400 flex items-center gap-2 transition-colors shadow-lg"
            >
              💬 Contact Support
            </a>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="bg-zinc-800/80 hover:bg-zinc-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-zinc-700 flex items-center gap-2 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-[#F4B400]" />
              <span>Change Password</span>
            </button>

            <button
              onClick={logoutUser}
              className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-rose-800 flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto gap-2 sm:gap-6 pb-0 scrollbar-none">
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>{language === 'mr' ? 'माझी प्रोफाइल' : 'My Profile'}</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'orders' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{language === 'mr' ? 'माझ्या ऑर्डर्स' : 'My Orders'} ({userOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'addresses' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>{language === 'mr' ? 'माझे पत्ते' : 'Saved Addresses'} ({currentUser.addresses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'wishlist' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>{language === 'mr' ? 'विशलिस्ट' : 'Wishlist'} ({wishlistProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cart')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'cart' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{language === 'mr' ? 'माझे कार्ट' : 'Active Cart'} ({cart.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{language === 'mr' ? 'खाते सेटिंग्ज' : 'Account Settings'}</span>
        </button>
      </div>

      {/* TAB 1: PROFILE DETAILS & EDIT */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-bold text-white font-marathi">
                {language === 'mr' ? 'वैयक्तिक माहिती' : 'Personal Information'}
              </h3>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs bg-[#F4B400]/10 text-[#F4B400] hover:bg-[#F4B400] hover:text-[#111111] px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Avatar Image URL</label>
                  <input
                    type="url"
                    value={profileAvatar}
                    onChange={(e) => setProfileAvatar(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white text-xs p-3 rounded-xl border border-zinc-700"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-[#F4B400] text-[#111111] font-bold text-xs px-5 py-2.5 rounded-xl"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="bg-zinc-800 text-zinc-300 font-bold text-xs px-5 py-2.5 rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1 bg-[#121212] p-4 rounded-2xl border border-zinc-800">
                  <span className="text-zinc-500 font-semibold block">Full Name</span>
                  <p className="text-white font-bold text-sm font-marathi">{currentUser.name}</p>
                </div>

                <div className="space-y-1 bg-[#121212] p-4 rounded-2xl border border-zinc-800">
                  <span className="text-zinc-500 font-semibold block">Email Address</span>
                  <p className="text-white font-bold text-sm">{currentUser.email}</p>
                </div>

                <div className="space-y-1 bg-[#121212] p-4 rounded-2xl border border-zinc-800">
                  <span className="text-zinc-500 font-semibold block">Mobile Number</span>
                  <p className="text-white font-bold text-sm">{currentUser.phone || 'Not provided'}</p>
                </div>

                <div className="space-y-1 bg-[#121212] p-4 rounded-2xl border border-zinc-800">
                  <span className="text-zinc-500 font-semibold block">Account Role</span>
                  <p className="text-[#F4B400] font-bold text-sm capitalize">{currentUser.role} Account</p>
                </div>
              </div>
            )}
          </div>

          {/* Loyalty & Stats Card */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1E1600] to-[#121212] border border-[#F4B400]/30 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4B400] text-[#111111] font-black flex items-center justify-center">
                  ★
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Dhaba Rewards Club</h4>
                  <p className="text-[11px] text-zinc-400">Earn points on every Maharashtrian spice purchase</p>
                </div>
              </div>

              <div className="bg-[#141414] p-4 rounded-2xl border border-zinc-800 text-center">
                <span className="text-3xl font-black text-[#F4B400] block">{currentUser.points}</span>
                <span className="text-xs text-zinc-400 font-semibold">Available Reward Balance</span>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                100 points = ₹10 discount code on your next authentic spice mix order!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS HISTORY & INVOICE */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Order Status Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
            {(['all', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setOrderFilter(st)}
                className={`px-3.5 py-1.5 rounded-full font-bold capitalize transition-all ${
                  orderFilter === st 
                    ? 'bg-[#F4B400] text-[#111111] shadow-lg' 
                    : 'bg-[#1A1A1A] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((ord) => (
                <div key={ord.id} className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl hover:border-zinc-700 transition-all">
                  <div className="flex justify-between items-start flex-wrap gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <span className="text-xs text-[#F4B400] font-bold block">{ord.orderNumber}</span>
                      <span className="text-[11px] text-zinc-500">Date: {ord.date} • Paid via {ord.paymentMethod.toUpperCase()}</span>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${
                        ord.orderStatus === 'delivered' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                        ord.orderStatus === 'shipped' ? 'bg-blue-950 text-blue-400 border-blue-800' :
                        'bg-amber-950 text-amber-400 border-amber-800'
                      }`}>
                        {ord.orderStatus}
                      </span>
                      <span className="text-sm font-black text-white block mt-1">₹{ord.totalAmount}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <img src={it.image} alt="p" className="w-12 h-12 object-cover rounded-xl border border-zinc-800" />
                        <div className="flex-1">
                          <p className="font-bold text-white font-marathi">
                            {language === 'mr' ? it.productNameMr : it.productNameEn}
                          </p>
                          <p className="text-zinc-500">{it.weight} • Qty: {it.quantity}</p>
                        </div>
                        <span className="font-bold text-[#F4B400]">₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                    <button
                      onClick={() => navigateTo('track-order', { orderId: ord.id })}
                      className="text-xs text-[#F4B400] font-bold hover:underline flex items-center gap-1"
                    >
                      <span>Track Order Progress</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setSelectedOrderForInvoice(ord)}
                      className="bg-[#222222] text-white hover:bg-[#F4B400] hover:text-[#111111] text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Download Tax Invoice</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#141414] rounded-3xl border border-zinc-800 space-y-3">
              <Package className="w-12 h-12 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-400">No orders found matching this filter.</p>
              <button
                onClick={() => navigateTo('shop')}
                className="bg-[#F4B400] text-[#111111] font-bold text-xs px-5 py-2 rounded-xl"
              >
                Explore Spices & Utensils Shop
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white font-marathi">
              {language === 'mr' ? 'माझे जतन केलेले पत्ते' : 'Saved Address Book'}
            </h3>
            <button
              onClick={() => handleOpenAddressModal()}
              className="bg-[#F4B400] text-[#111111] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentUser.addresses.map((addr) => (
              <div key={addr.id} className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-3 relative shadow-xl">
                <div className="flex justify-between items-start">
                  <span className="bg-zinc-800 text-zinc-300 font-bold text-[10px] px-2.5 py-0.5 rounded uppercase">
                    {addr.type}
                  </span>
                  {addr.isDefault ? (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Default Address
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefaultAddress(addr.id)}
                      className="text-[10px] text-zinc-400 hover:text-[#F4B400] underline"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">{addr.name}</h4>
                  <p className="text-xs text-zinc-400">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-xs text-zinc-500 mt-1">Phone: {addr.phone}</p>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex justify-end gap-3">
                  <button
                    onClick={() => handleOpenAddressModal(addr)}
                    className="text-xs text-zinc-400 hover:text-[#F4B400] flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => deleteAddress(addr.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WISHLIST PRODUCTS */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white font-marathi">
            {language === 'mr' ? 'माझी विशलिस्ट' : 'Saved Wishlist Items'}
          </h3>

          {wishlistProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {wishlistProducts.map((p) => (
                <div key={p.id} className="bg-[#161616] border border-zinc-800 rounded-3xl p-4 space-y-3 relative shadow-xl">
                  <img src={p.images[0]} alt={p.nameEn} className="w-full h-36 object-cover rounded-2xl" />
                  <div>
                    <h4 className="font-bold text-white text-xs font-marathi line-clamp-1">{language === 'mr' ? p.nameMr : p.nameEn}</h4>
                    <p className="text-xs text-[#F4B400] font-black">₹{p.price}</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        addToCart(p);
                        toggleWishlist(p.id);
                      }}
                      className="flex-1 bg-[#F4B400] text-[#111111] font-bold text-[11px] py-2 rounded-xl"
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(p.id)}
                      className="p-2 bg-zinc-800 text-rose-400 rounded-xl"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Your wishlist is empty.</p>
          )}
        </div>
      )}

      {/* TAB 5: ACTIVE CART SUMMARY */}
      {activeTab === 'cart' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white font-marathi">
              {language === 'mr' ? 'सक्रिय शॉपिंग कार्ट' : 'Your Shopping Cart'}
            </h3>
            {cart.length > 0 && (
              <button
                onClick={() => navigateTo('checkout')}
                className="bg-[#F4B400] text-[#111111] font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {cart.length > 0 ? (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="bg-[#161616] border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
                  <img src={item.product.images[0]} alt="p" className="w-14 h-14 object-cover rounded-xl" />
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-xs font-marathi">{language === 'mr' ? item.product.nameMr : item.product.nameEn}</h4>
                    <p className="text-xs text-[#F4B400] font-black">₹{item.product.price} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 bg-zinc-800 text-white rounded-lg font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-white px-2">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 bg-zinc-800 text-white rounded-lg font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Your cart is currently empty.</p>
          )}
        </div>
      )}

      {/* TAB 6: ACCOUNT SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h3 className="text-lg font-bold text-white font-marathi">
            {language === 'mr' ? 'खाते व सूचना प्राधान्ये' : 'Account & Notification Settings'}
          </h3>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Communication Preferences</h4>
            
            <label className="flex items-center justify-between p-3.5 bg-[#121212] rounded-2xl border border-zinc-800 cursor-pointer">
              <span className="text-xs text-white font-semibold">Email Promotional Discounts & Coupons</span>
              <input
                type="checkbox"
                checked={currentUser.notifications?.emailOffers ?? true}
                onChange={(e) => updateUserNotifications({
                  emailOffers: e.target.checked,
                  smsOrderUpdates: currentUser.notifications?.smsOrderUpdates ?? true,
                  whatsAppTracking: currentUser.notifications?.whatsAppTracking ?? true
                })}
                className="w-4 h-4 accent-[#F4B400]"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-[#121212] rounded-2xl border border-zinc-800 cursor-pointer">
              <span className="text-xs text-white font-semibold">SMS Order Status Alerts</span>
              <input
                type="checkbox"
                checked={currentUser.notifications?.smsOrderUpdates ?? true}
                onChange={(e) => updateUserNotifications({
                  emailOffers: currentUser.notifications?.emailOffers ?? true,
                  smsOrderUpdates: e.target.checked,
                  whatsAppTracking: currentUser.notifications?.whatsAppTracking ?? true
                })}
                className="w-4 h-4 accent-[#F4B400]"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-[#121212] rounded-2xl border border-zinc-800 cursor-pointer">
              <span className="text-xs text-white font-semibold">WhatsApp Live Tracking Updates</span>
              <input
                type="checkbox"
                checked={currentUser.notifications?.whatsAppTracking ?? true}
                onChange={(e) => updateUserNotifications({
                  emailOffers: currentUser.notifications?.emailOffers ?? true,
                  smsOrderUpdates: currentUser.notifications?.smsOrderUpdates ?? true,
                  whatsAppTracking: e.target.checked
                })}
                className="w-4 h-4 accent-[#F4B400]"
              />
            </label>
          </div>

          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full bg-zinc-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-[#F4B400]" />
              <span>Change Account Password</span>
            </button>

            <button
              onClick={logoutUser}
              className="w-full bg-rose-950/40 text-rose-300 border border-rose-900/60 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out from All Devices</span>
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedOrderForInvoice && (
        <InvoiceModal order={selectedOrderForInvoice} onClose={() => setSelectedOrderForInvoice(null)} />
      )}

      {/* Add / Edit Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingAddrId ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={addrName}
                  onChange={(e) => setAddrName(e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white p-2.5 rounded-xl border border-zinc-700"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white p-2.5 rounded-xl border border-zinc-700"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Street / Flat / House No.</label>
                <input
                  type="text"
                  required
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white p-2.5 rounded-xl border border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 block mb-1 font-semibold">City</label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white p-2.5 rounded-xl border border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 block mb-1 font-semibold">Pincode</label>
                  <input
                    type="text"
                    required
                    value={addrPincode}
                    onChange={(e) => setAddrPincode(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white p-2.5 rounded-xl border border-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Address Type</label>
                <div className="flex gap-2">
                  {(['home', 'work', 'other'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setAddrType(t)}
                      className={`flex-1 py-2 rounded-xl font-bold uppercase transition-all ${
                        addrType === t ? 'bg-[#F4B400] text-[#111111]' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-[#F4B400]"
                />
                <span className="text-xs text-zinc-300">Set as default shipping address</span>
              </label>

              <button
                type="submit"
                className="w-full bg-[#F4B400] text-[#111111] font-bold py-3 rounded-xl mt-2"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Change Account Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white p-2.5 pr-10 rounded-xl border border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                    aria-label={showNewPass ? 'Hide password' : 'Show password'}
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-semibold">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#1A1A1A] text-white p-2.5 pr-10 rounded-xl border border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                    aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-[#F4B400] text-[#111111] font-bold py-3 rounded-xl mt-2 disabled:opacity-50"
              >
                {passwordLoading ? 'Updating Password in Supabase...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
