import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseGetSiteSettings, supabaseSaveSiteSettings, supabaseUploadBrandingAsset } from '../lib/supabase';

export interface BrandingHistoryItem {
  id: string;
  logoUrl: string;
  faviconUrl?: string;
  changedAt: string;
  changedBy: string;
  label?: string;
}

export interface BrandingSettings {
  logoUrl: string;
  logoStoragePath?: string;
  faviconUrl: string;
  faviconStoragePath?: string;
  siteName: string;
  taglineMr: string;
  taglineEn: string;
  loginLogoUrl?: string;
  adminLogoUrl?: string;
  invoiceLogoUrl?: string;
  ogImageUrl?: string;
  useGlobalForFavicon: boolean;
  useGlobalForLogin: boolean;
  useGlobalForAdmin: boolean;
  useGlobalForInvoice: boolean;
  useGlobalForOg: boolean;
  history: BrandingHistoryItem[];
  updatedAt: string;
}

export const DEFAULT_BRANDING: BrandingSettings = {
  logoUrl: '/assets/dadacha-dhaba-logo.png',
  faviconUrl: '/assets/dadacha-dhaba-logo.png',
  siteName: 'Dadacha Dhaba',
  taglineMr: 'चव आमची ओळख तुमची ! ❤️',
  taglineEn: 'Taste, Service & Authentic Dhaba Love ❤️',
  loginLogoUrl: '',
  adminLogoUrl: '',
  invoiceLogoUrl: '',
  ogImageUrl: '',
  useGlobalForFavicon: true,
  useGlobalForLogin: true,
  useGlobalForAdmin: true,
  useGlobalForInvoice: true,
  useGlobalForOg: true,
  history: [
    {
      id: 'default-initial-v1',
      logoUrl: '/assets/dadacha-dhaba-logo.png',
      faviconUrl: '/assets/dadacha-dhaba-logo.png',
      changedAt: new Date().toISOString(),
      changedBy: 'System Default',
      label: 'Official Dadacha Dhaba Brand Emblem',
    },
  ],
  updatedAt: new Date().toISOString(),
};

interface BrandingContextType {
  branding: BrandingSettings;
  getEffectiveLogo: (purpose?: 'main' | 'login' | 'admin' | 'invoice' | 'footer' | 'header') => string;
  getEffectiveFavicon: () => string;
  applyBrandingEverywhere: (newConfig: Partial<BrandingSettings>, historyLabel?: string) => Promise<boolean>;
  uploadAssetFile: (file: File, folder?: string) => Promise<string>;
  resetToDefaultBranding: () => Promise<boolean>;
  restoreFromHistory: (item: BrandingHistoryItem) => Promise<boolean>;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'dadacha_dhaba_branding_v2';

/**
 * Dynamically updates document favicon links with cache buster query string
 */
function updateFaviconInDOM(faviconUrl: string) {
  if (typeof document === 'undefined') return;

  const timestampedUrl = faviconUrl.startsWith('data:') 
    ? faviconUrl 
    : `${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;

  let linkIcon = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
  if (!linkIcon) {
    linkIcon = document.createElement('link');
    linkIcon.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(linkIcon);
  }
  linkIcon.href = timestampedUrl;

  let linkApple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
  if (!linkApple) {
    linkApple = document.createElement('link');
    linkApple.rel = 'apple-touch-icon';
    document.getElementsByTagName('head')[0].appendChild(linkApple);
  }
  linkApple.href = timestampedUrl;
}

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...DEFAULT_BRANDING, ...parsed };
      }
    } catch (e) {
      console.warn('Failed reading cached branding from localStorage:', e);
    }
    return DEFAULT_BRANDING;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync favicon with DOM on mount and branding changes
  useEffect(() => {
    const effectiveFavicon = branding.useGlobalForFavicon || !branding.faviconUrl 
      ? branding.logoUrl 
      : branding.faviconUrl;
    updateFaviconInDOM(effectiveFavicon || '/assets/dadacha-dhaba-logo.png');
  }, [branding.logoUrl, branding.faviconUrl, branding.useGlobalForFavicon]);

  // Fetch remote settings from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadRemoteSettings() {
      try {
        const remoteData = await supabaseGetSiteSettings();
        if (remoteData && isMounted) {
          const merged: BrandingSettings = {
            logoUrl: remoteData.logo_url || DEFAULT_BRANDING.logoUrl,
            logoStoragePath: remoteData.logo_storage_path,
            faviconUrl: remoteData.favicon_url || remoteData.logo_url || DEFAULT_BRANDING.faviconUrl,
            faviconStoragePath: remoteData.favicon_storage_path,
            siteName: remoteData.site_name || DEFAULT_BRANDING.siteName,
            taglineMr: remoteData.tagline_mr || DEFAULT_BRANDING.taglineMr,
            taglineEn: remoteData.tagline_en || DEFAULT_BRANDING.taglineEn,
            loginLogoUrl: remoteData.login_logo_url || '',
            adminLogoUrl: remoteData.admin_logo_url || '',
            invoiceLogoUrl: remoteData.invoice_logo_url || '',
            ogImageUrl: remoteData.og_image_url || '',
            useGlobalForFavicon: remoteData.use_global_for_favicon ?? true,
            useGlobalForLogin: remoteData.use_global_for_login ?? true,
            useGlobalForAdmin: remoteData.use_global_for_admin ?? true,
            useGlobalForInvoice: remoteData.use_global_for_invoice ?? true,
            useGlobalForOg: remoteData.use_global_for_og ?? true,
            history: Array.isArray(remoteData.history) && remoteData.history.length > 0 
              ? remoteData.history 
              : DEFAULT_BRANDING.history,
            updatedAt: remoteData.updated_at || new Date().toISOString(),
          };

          setBranding(merged);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        }
      } catch (err) {
        console.warn('Error loading remote branding:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRemoteSettings();
    return () => { isMounted = false; };
  }, []);

  const getEffectiveLogo = (purpose?: 'main' | 'login' | 'admin' | 'invoice' | 'footer' | 'header'): string => {
    if (!purpose || purpose === 'main' || purpose === 'footer' || purpose === 'header') {
      return branding.logoUrl || DEFAULT_BRANDING.logoUrl;
    }
    if (purpose === 'login') {
      return branding.useGlobalForLogin || !branding.loginLogoUrl ? branding.logoUrl : branding.loginLogoUrl;
    }
    if (purpose === 'admin') {
      return branding.useGlobalForAdmin || !branding.adminLogoUrl ? branding.logoUrl : branding.adminLogoUrl;
    }
    if (purpose === 'invoice') {
      return branding.useGlobalForInvoice || !branding.invoiceLogoUrl ? branding.logoUrl : branding.invoiceLogoUrl;
    }
    return branding.logoUrl || DEFAULT_BRANDING.logoUrl;
  };

  const getEffectiveFavicon = (): string => {
    return (branding.useGlobalForFavicon || !branding.faviconUrl) ? branding.logoUrl : branding.faviconUrl;
  };

  const uploadAssetFile = async (file: File, folder: string = 'branding'): Promise<string> => {
    // Attempt Supabase Storage upload
    const uploadResult = await supabaseUploadBrandingAsset(file, folder);
    if (uploadResult?.publicUrl) {
      return uploadResult.publicUrl;
    }

    // Fallback to Data URL for instant guaranteed persistence
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed reading image file'));
        }
      };
      reader.onerror = () => reject(new Error('File reading error'));
      reader.readAsDataURL(file);
    });
  };

  const applyBrandingEverywhere = async (newConfig: Partial<BrandingSettings>, historyLabel?: string): Promise<boolean> => {
    try {
      const newLogoUrl = newConfig.logoUrl || branding.logoUrl;
      const newFaviconUrl = newConfig.faviconUrl || (newConfig.useGlobalForFavicon !== false ? newLogoUrl : branding.faviconUrl);

      // Create history entry
      const historyEntry: BrandingHistoryItem = {
        id: `hist-${Date.now()}`,
        logoUrl: newLogoUrl,
        faviconUrl: newFaviconUrl,
        changedAt: new Date().toISOString(),
        changedBy: 'Master Admin',
        label: historyLabel || 'Brand Asset Update',
      };

      const updatedHistory = [historyEntry, ...branding.history].slice(0, 15);

      const merged: BrandingSettings = {
        ...branding,
        ...newConfig,
        logoUrl: newLogoUrl,
        faviconUrl: newFaviconUrl,
        history: updatedHistory,
        updatedAt: new Date().toISOString(),
      };

      // 1. Update React Context State immediately
      setBranding(merged);

      // 2. Persist to LocalStorage Cache
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));

      // 3. Update DOM Favicon immediately
      updateFaviconInDOM(getEffectiveFavicon());

      // 4. Save to Supabase Database
      const dbPayload = {
        site_name: merged.siteName,
        tagline_mr: merged.taglineMr,
        tagline_en: merged.taglineEn,
        logo_url: merged.logoUrl,
        logo_storage_path: merged.logoStoragePath || null,
        favicon_url: merged.faviconUrl,
        favicon_storage_path: merged.faviconStoragePath || null,
        login_logo_url: merged.loginLogoUrl || null,
        admin_logo_url: merged.adminLogoUrl || null,
        invoice_logo_url: merged.invoiceLogoUrl || null,
        og_image_url: merged.ogImageUrl || null,
        use_global_for_favicon: merged.useGlobalForFavicon,
        use_global_for_login: merged.useGlobalForLogin,
        use_global_for_admin: merged.useGlobalForAdmin,
        use_global_for_invoice: merged.useGlobalForInvoice,
        use_global_for_og: merged.useGlobalForOg,
        history: merged.history,
      };

      await supabaseSaveSiteSettings(dbPayload);
      return true;
    } catch (err) {
      console.error('Failed applying branding everywhere:', err);
      return false;
    }
  };

  const resetToDefaultBranding = async (): Promise<boolean> => {
    return applyBrandingEverywhere({
      ...DEFAULT_BRANDING,
      history: branding.history,
    }, 'Restored Original Official Logo');
  };

  const restoreFromHistory = async (item: BrandingHistoryItem): Promise<boolean> => {
    return applyBrandingEverywhere({
      logoUrl: item.logoUrl,
      faviconUrl: item.faviconUrl || item.logoUrl,
    }, `Restored from history (${new Date(item.changedAt).toLocaleDateString()})`);
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        getEffectiveLogo,
        getEffectiveFavicon,
        applyBrandingEverywhere,
        uploadAssetFile,
        resetToDefaultBranding,
        restoreFromHistory,
        isLoading,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
