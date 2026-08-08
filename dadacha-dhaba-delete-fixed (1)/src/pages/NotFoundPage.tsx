import React from 'react';
import { useApp } from '../context/AppContext';
import { OfficialLogo } from '../components/OfficialLogo';

export const NotFoundPage: React.FC = () => {
  const { language, navigateTo } = useApp();

  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      <OfficialLogo size="hero" />
      
      <div className="space-y-2">
        <span className="text-xs bg-red-950/80 text-red-400 border border-red-800/80 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
          ERROR 404
        </span>
        <h1 className="text-3xl font-black text-white font-marathi">
          {language === 'mr' ? '४०४ - पान सापडले नाही' : '404 - Page Not Found'}
        </h1>
        <p className="text-xs text-zinc-400 font-marathi max-w-sm mx-auto">
          {language === 'mr' 
            ? 'तुम्ही शोधत असलेले पान उपलब्ध नाही किंवा ते हलवण्यात आले आहे.' 
            : 'The page you requested could not be found or has been moved.'}
        </p>
      </div>

      <button
        onClick={() => navigateTo('home')}
        className="bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-black text-xs px-8 py-3.5 rounded-2xl hover:scale-105 transition-all shadow-xl"
      >
        {language === 'mr' ? 'मुख्य पृष्ठावर परत जा' : 'Return to Home Storefront'}
      </button>
    </div>
  );
};
