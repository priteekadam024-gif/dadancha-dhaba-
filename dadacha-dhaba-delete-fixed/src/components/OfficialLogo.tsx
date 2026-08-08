import React from 'react';
import { useApp } from '../context/AppContext';
import { useBranding } from '../context/BrandingContext';

export interface OfficialLogoProps {
  variant?: 'full' | 'icon' | 'banner';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  lang?: 'mr' | 'en';
  clickable?: boolean;
  showTagline?: boolean;
  purpose?: 'main' | 'login' | 'admin' | 'invoice' | 'footer' | 'header';
  customLogoUrl?: string;
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  lang,
  clickable = false,
  showTagline = true,
  purpose = 'main',
  customLogoUrl,
}) => {
  const { language: contextLang, navigateTo } = useApp();
  const { branding, getEffectiveLogo } = useBranding();

  const currentLang = lang || contextLang;

  // Global single source of truth logo asset path
  const OFFICIAL_LOGO_FALLBACK = '/assets/dadacha-dhaba-logo.png';
  const logoSrc = customLogoUrl || getEffectiveLogo(purpose) || OFFICIAL_LOGO_FALLBACK;

  const badgeSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    hero: 'w-28 h-28 md:w-36 md:h-36',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base md:text-lg',
    lg: 'text-lg md:text-xl',
    xl: 'text-2xl',
    hero: 'text-2xl md:text-3xl',
  };

  const badgeWrapper = (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-[#F4B400] via-[#FF8C00] to-[#E5A000] p-0.5 shadow-lg border-2 border-[#111111] overflow-hidden shrink-0 transition-transform duration-300 hover:scale-105 ${badgeSizes[size]}`}
    >
      <img
        src={logoSrc}
        alt={`${branding.siteName || 'Dadacha Dhaba'} Official Logo`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.dataset.fallbackApplied) {
            target.dataset.fallbackApplied = 'true';
            target.src = OFFICIAL_LOGO_FALLBACK;
          }
        }}
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );

  const content = (
    <div className={`inline-flex items-center gap-2.5 font-sans select-none ${className}`}>
      {badgeWrapper}

      {variant !== 'icon' && (
        <div className="flex flex-col justify-center text-left leading-tight">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`font-black tracking-tight text-[#F4B400] drop-shadow-sm ${textSizes[size]} ${
                currentLang === 'mr' ? 'font-marathi' : ''
              }`}
            >
              {currentLang === 'mr' ? (branding.siteName === 'Dadacha Dhaba' ? 'दादाचा ढाबा' : branding.siteName) : branding.siteName}
            </span>
            <span className="bg-[#F4B400] text-[#111111] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider text-[9px] md:text-[10px] shadow-sm">
              {currentLang === 'mr' ? 'अस्सल चव' : 'AUTHENTIC'}
            </span>
          </div>

          {showTagline && (
            <span className="text-[10px] md:text-xs text-zinc-300 tracking-wide font-medium font-marathi opacity-90 mt-0.5">
              {currentLang === 'mr' ? branding.taglineMr : branding.taglineEn}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (clickable) {
    return (
      <button
        onClick={() => navigateTo('home')}
        className="cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#F4B400] rounded-2xl transition-all"
        title={`${branding.siteName} - Go to Home`}
      >
        {content}
      </button>
    );
  }

  return content;
};
