import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DhabaLogo } from './DhabaLogo';
import { 
  Search, ShoppingBag, Heart, User as UserIcon, Menu, X, 
  ChevronDown, PhoneCall, ShieldAlert, Sparkles, Truck, MapPin
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    language, setLanguage, currentPage, navigateTo, 
    cart, wishlist, currentUser, isAdminLoggedIn, 
    searchQuery, setSearchQuery, products, contactConfig 
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;

  // Auto suggestion results
  const searchResults = searchQuery.trim() 
    ? products.filter(p => 
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.nameMr.includes(searchQuery) || 
        p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-md border-b border-[#F4B400]/20 text-white shadow-xl">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-[#F4B400] via-[#FF8C00] to-[#F4B400] text-[#111111] px-4 py-1.5 text-xs font-bold flex justify-between items-center select-none overflow-hidden">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
            <span>
              {language === 'mr' 
                ? '🔥 खास ऑफर: ₹४९९ वरील सर्व खरेदीवर मोफत होम डिलिव्हरी!' 
                : '🔥 Special Offer: Free Express Delivery on orders above ₹499!'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[11px] font-semibold">
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" /> {language === 'mr' ? '३-५ दिवसांत होम डिलिव्हरी' : 'Fast 3-5 Days Shipping'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {language === 'mr' ? 'पुणे | कोल्हापूर | मुंबई' : 'Pune | Kolhapur | Mumbai'}
            </span>
            <a 
              href={`tel:${(contactConfig.phone || '').replace(/[^0-9+]/g, '')}`} 
              className="flex items-center gap-1 hover:text-white transition-colors"
              title="Call Dadacha Dhaba"
            >
              <PhoneCall className="w-3 h-3 text-zinc-900" />
              <span>📞 {contactConfig.phone || '+91 91370 50018'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Mobile menu trigger */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-zinc-300 hover:text-[#F4B400] p-1.5 rounded-lg border border-zinc-800"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <button 
          onClick={() => navigateTo('home')}
          className="text-left focus:outline-none transition-transform hover:scale-105"
        >
          <DhabaLogo size="md" />
        </button>

        {/* Search Bar with Auto Suggestions */}
        <div className="hidden md:block relative flex-1 max-w-md mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder={language === 'mr' ? 'मसाले, भांडी, चटणी शोधा...' : 'Search masale, brass handi, chutney...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full bg-[#1F1F1F] text-zinc-100 placeholder-zinc-500 text-sm rounded-full pl-10 pr-4 py-2 border border-zinc-800 focus:border-[#F4B400] focus:ring-1 focus:ring-[#F4B400] focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#1A1A1A] border border-[#F4B400]/30 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800">
              {searchResults.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    navigateTo('product-detail', { productId: prod.id });
                    setSearchQuery('');
                  }}
                  className="p-3 flex items-center gap-3 hover:bg-[#262626] cursor-pointer transition-colors"
                >
                  <img src={prod.images[0]} alt={prod.nameEn} className="w-10 h-10 object-cover rounded-lg border border-zinc-700" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {language === 'mr' ? prod.nameMr : prod.nameEn}
                    </p>
                    <p className="text-xs text-[#F4B400] font-semibold">
                      ₹{prod.price} <span className="text-zinc-500 line-through text-[11px] ml-1">₹{prod.originalPrice}</span>
                    </p>
                  </div>
                  <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">
                    {prod.weight}
                  </span>
                </div>
              ))}
              <div 
                onClick={() => {
                  navigateTo('shop');
                  setIsSearchFocused(false);
                }}
                className="p-2.5 text-center text-xs text-[#F4B400] font-semibold hover:underline bg-[#111111] cursor-pointer"
              >
                {language === 'mr' ? 'सर्व परिणाम पहा →' : 'View all products →'}
              </div>
            </div>
          )}
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-zinc-300">
          <button 
            onClick={() => navigateTo('home')}
            className={`hover:text-[#F4B400] transition-colors py-1 ${currentPage === 'home' ? 'text-[#F4B400] border-b-2 border-[#F4B400]' : ''}`}
          >
            {language === 'mr' ? 'मुख्य पृष्ठ' : 'Home'}
          </button>
          <button 
            onClick={() => navigateTo('shop')}
            className={`hover:text-[#F4B400] transition-colors py-1 ${currentPage === 'shop' ? 'text-[#F4B400] border-b-2 border-[#F4B400]' : ''}`}
          >
            {language === 'mr' ? 'शॉप' : 'Shop'}
          </button>
          <button 
            onClick={() => navigateTo('categories')}
            className={`hover:text-[#F4B400] transition-colors py-1 ${currentPage === 'categories' ? 'text-[#F4B400] border-b-2 border-[#F4B400]' : ''}`}
          >
            {language === 'mr' ? 'श्रेणी' : 'Categories'}
          </button>
          <button 
            onClick={() => navigateTo('videos')}
            className={`hover:text-[#F4B400] transition-colors py-1 ${currentPage === 'videos' ? 'text-[#F4B400] border-b-2 border-[#F4B400]' : ''}`}
          >
            {language === 'mr' ? 'व्हिडिओ' : 'Videos'}
          </button>
          <button 
            onClick={() => navigateTo('gallery')}
            className={`hover:text-[#F4B400] transition-colors py-1 ${currentPage === 'gallery' ? 'text-[#F4B400] border-b-2 border-[#F4B400]' : ''}`}
          >
            {language === 'mr' ? 'गॅलरी' : 'Gallery'}
          </button>
          <button 
            onClick={() => navigateTo('recipes')}
            className={`hover:text-[#F4B400] transition-colors py-1 ${currentPage === 'recipes' ? 'text-[#F4B400] border-b-2 border-[#F4B400]' : ''}`}
          >
            {language === 'mr' ? 'रेसिपी' : 'Recipes'}
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'mr' ? 'en' : 'mr')}
            className="flex items-center gap-1 bg-[#222222] border border-zinc-800 text-xs font-bold px-2.5 py-1.5 rounded-full hover:border-[#F4B400] transition-all text-[#F4B400]"
          >
            <span>{language === 'mr' ? 'EN' : 'मराठी'}</span>
          </button>

          {/* Wishlist Icon */}
          <button 
            onClick={() => navigateTo('wishlist')}
            className="relative p-2 text-zinc-300 hover:text-[#F4B400] transition-colors rounded-full hover:bg-zinc-800"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#FF8C00] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button 
            onClick={() => navigateTo('cart')}
            className="relative p-2 bg-[#F4B400] text-[#111111] font-bold rounded-full hover:bg-[#FF8C00] transition-all shadow-lg flex items-center justify-center"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#111111] text-[#F4B400] border border-[#F4B400] text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account Menu */}
          {currentUser ? (
            <button
              onClick={() => navigateTo('account')}
              className="hidden sm:flex items-center gap-2 bg-[#222222] border border-zinc-800 hover:border-[#F4B400] px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-200 transition-all"
            >
              <UserIcon className="w-4 h-4 text-[#F4B400]" />
              <span className="max-w-[100px] truncate">{currentUser.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => navigateTo('login')}
              className="hidden sm:flex items-center gap-1 text-xs font-bold bg-[#222222] hover:bg-[#F4B400] hover:text-[#111111] text-white px-3 py-1.5 rounded-full border border-zinc-700 transition-all"
            >
              <UserIcon className="w-4 h-4" />
              <span>{language === 'mr' ? 'लॉगिन' : 'Login'}</span>
            </button>
          )}

          {/* Admin Secret Link (Discreet) */}
          {isAdminLoggedIn ? (
            <button 
              onClick={() => navigateTo('admin-dashboard')}
              className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Admin</span>
            </button>
          ) : (
            <button 
              onClick={() => navigateTo('admin-login')}
              className="opacity-20 hover:opacity-100 text-zinc-500 hover:text-[#F4B400] p-1 transition-opacity text-[10px]"
              title="Admin Portal"
            >
              🔒
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#161616] border-b border-[#F4B400]/20 px-4 py-4 space-y-3">
          {/* Mobile Search Input */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder={language === 'mr' ? 'शोधा...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#222222] text-zinc-100 placeholder-zinc-500 text-sm rounded-lg pl-9 pr-3 py-2 border border-zinc-800"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
            <button 
              onClick={() => { navigateTo('home'); setIsMobileMenuOpen(false); }}
              className="text-left py-2 px-3 rounded bg-[#222222] text-zinc-200"
            >
              🏠 {language === 'mr' ? 'मुख्य पृष्ठ' : 'Home'}
            </button>
            <button 
              onClick={() => { navigateTo('shop'); setIsMobileMenuOpen(false); }}
              className="text-left py-2 px-3 rounded bg-[#222222] text-zinc-200"
            >
              🛍️ {language === 'mr' ? 'शॉप' : 'Shop'}
            </button>
            <button 
              onClick={() => { navigateTo('categories'); setIsMobileMenuOpen(false); }}
              className="text-left py-2 px-3 rounded bg-[#222222] text-zinc-200"
            >
              📂 {language === 'mr' ? 'श्रेणी' : 'Categories'}
            </button>
            <button 
              onClick={() => { navigateTo('videos'); setIsMobileMenuOpen(false); }}
              className="text-left py-2 px-3 rounded bg-[#222222] text-zinc-200"
            >
              🎬 {language === 'mr' ? 'व्हिडिओ' : 'Videos'}
            </button>
            <button 
              onClick={() => { navigateTo('gallery'); setIsMobileMenuOpen(false); }}
              className="text-left py-2 px-3 rounded bg-[#222222] text-zinc-200"
            >
              🖼️ {language === 'mr' ? 'गॅलरी' : 'Gallery'}
            </button>
            <button 
              onClick={() => { navigateTo('recipes'); setIsMobileMenuOpen(false); }}
              className="text-left py-2 px-3 rounded bg-[#222222] text-zinc-200"
            >
              📖 {language === 'mr' ? 'रेसिपी' : 'Recipes'}
            </button>
            <button 
              onClick={() => { navigateTo('track-order'); setIsMobileMenuOpen(false); }}
              className="text-left py-2 px-3 rounded bg-[#222222] text-zinc-200 col-span-2"
            >
              🚚 {language === 'mr' ? 'ऑर्डर ट्रॅक करा' : 'Track Order'}
            </button>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
            {currentUser ? (
              <button 
                onClick={() => { navigateTo('account'); setIsMobileMenuOpen(false); }}
                className="text-xs text-[#F4B400] font-bold flex items-center gap-1"
              >
                <UserIcon className="w-4 h-4" /> {currentUser.name}
              </button>
            ) : (
              <button 
                onClick={() => { navigateTo('login'); setIsMobileMenuOpen(false); }}
                className="text-xs bg-[#F4B400] text-[#111111] font-bold px-4 py-1.5 rounded-full"
              >
                {language === 'mr' ? 'लॉगिन करा' : 'Login'}
              </button>
            )}
            <button
              onClick={() => { navigateTo('contact'); setIsMobileMenuOpen(false); }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              {language === 'mr' ? 'संपर्क' : 'Contact'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
