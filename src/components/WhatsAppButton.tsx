import React from 'react';
import { useApp } from '../context/AppContext';
import { MessageCircle, Phone } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
  const { contactConfig } = useApp();

  const cleanWaNumber = (contactConfig?.whatsapp || '').replace(/[^0-9]/g, '');
  const cleanPhone = (contactConfig?.phone || '').replace(/[^0-9+]/g, '');

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Hello Dadacha Dhaba,\n\nI would like to know more about your products.');
    window.open(`https://wa.me/${cleanWaNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      {/* Floating Call Button */}
      <a
        href={`tel:${cleanPhone}`}
        className="w-12 h-12 bg-zinc-900 border-2 border-[#F4B400] text-[#F4B400] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-[#F4B400] hover:text-[#111111] transition-all group relative"
        title="Call Dadacha Dhaba"
      >
        <Phone className="w-5 h-5" />
        <span className="absolute right-14 bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-700 pointer-events-none">
          Call Dadacha Dhaba ({contactConfig.phone})
        </span>
      </a>

      {/* Floating WhatsApp Button */}
      <button
        onClick={handleWhatsAppClick}
        className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-500 hover:scale-110 transition-all group relative border-2 border-emerald-400 animate-pulse"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 fill-white text-emerald-600" />
        <span className="absolute right-16 bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 border border-emerald-500 pointer-events-none">
          💬 Chat with us on WhatsApp
        </span>
      </button>
    </div>
  );
};

