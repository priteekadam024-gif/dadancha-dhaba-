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

const SUPABASE_DEFAULT_LOGO = 'https://rkzmsyqxyjpaqiomiaxf.supabase.co/storage/v1/object/public/site-assets/dadanchadhabalogo.png';
const OFFICIAL_LOGO_FALLBACK = SUPABASE_DEFAULT_LOGO;

export const DEFAULT_BRANDING: BrandingSettings = {
  logoUrl: SUPABASE_DEFAULT_LOGO,
  faviconUrl: SUPABASE_DEFAULT_LOGO,
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
      logoUrl: SUPABASE_DEFAULT_LOGO,
      faviconUrl: SUPABASE_DEFAULT_LOGO,
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
  uploadAssetFile: (file: File, folder?: string) => Promise<{ publicUrl: string; storagePath: string } | null>;
  resetToDefaultBranding: () => Promise<boolean>;
  restoreFromHistory: (item: BrandingHistoryItem) => Promise<boolean>;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'dadacha_dhaba_branding_v2';

function isUsableLogoUrl(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeLogoUrl(value: unknown): string {
  return isUsableLogoUrl(value) ? value.trim() : SUPABASE_DEFAULT_LOGO;
}

function attachCacheBuster(url: string, updatedAt?: string): string {
  if (!url || url.startsWith('data:')) return url;
  const version = updatedAt ? encodeURIComponent(updatedAt) : Date.now().toString();
  return `${url}${url.includes('?') ? '&' : '?'}v=${version}`;
}

/**
 * Dynamically updates document favicon links with cache buster query string
 */
function updateFaviconInDOM(faviconUrl: string) {
  if (typeof document === 'undefined') return;

  const timestampedUrl = faviconUrl.startsWith('data:') 
    ? faviconUrl 
    : attachCacheBuster(faviconUrl, new Date().toISOString());

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
        return {
          ...DEFAULT_BRANDING,
          ...parsed,
          logoUrl: normalizeLogoUrl(parsed.logoUrl),
          faviconUrl: normalizeLogoUrl(parsed.faviconUrl || parsed.logoUrl),
        };
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
    updateFaviconInDOM(effectiveFavicon || SUPABASE_DEFAULT_LOGO);
  }, [branding.logoUrl, branding.faviconUrl, branding.useGlobalForFavicon, branding.updatedAt]);

  // Fetch remote settings from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadRemoteSettings() {
      try {
        const remoteData = await supabaseGetSiteSettings();
        if (remoteData && isMounted) {
          const merged: BrandingSettings = {
            logoUrl: normalizeLogoUrl(remoteData.logo_url),
            logoStoragePath: remoteData.logo_storage_path,
            faviconUrl: normalizeLogoUrl(remoteData.favicon_url || remoteData.logo_url),
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
    let rawUrl = branding.logoUrl;
    if (purpose === 'login' && !branding.useGlobalForLogin && branding.loginLogoUrl) {
      rawUrl = branding.loginLogoUrl;
    } else if (purpose === 'admin' && !branding.useGlobalForAdmin && branding.adminLogoUrl) {
      rawUrl = branding.adminLogoUrl;
    } else if (purpose === 'invoice' && !branding.useGlobalForInvoice && branding.invoiceLogoUrl) {
      rawUrl = branding.invoiceLogoUrl;
    }
    const normalized = normalizeLogoUrl(rawUrl);
    return attachCacheBuster(normalized, branding.updatedAt);
  };

  const getEffectiveFavicon = (): string => {
    const rawUrl = branding.useGlobalForFavicon || !branding.faviconUrl
      ? branding.logoUrl
      : branding.faviconUrl;
    const normalized = normalizeLogoUrl(rawUrl);
    return attachCacheBuster(normalized, branding.updatedAt);
  };

  const uploadAssetFile = async (file: File, folder: string = 'branding'): Promise<{ publicUrl: string; storagePath: string } | null> => {
    return await supabaseUploadBrandingAsset(file, folder);
  };

  const applyBrandingEverywhere = async (newConfig: Partial<BrandingSettings>, historyLabel?: string): Promise<boolean> => {
    try {
      const newLogoUrl = newConfig.logoUrl || branding.logoUrl;
      const newLogoPath = newConfig.logoStoragePath !== undefined ? newConfig.logoStoragePath : branding.logoStoragePath;
      const newFaviconUrl = newConfig.faviconUrl || (newConfig.useGlobalForFavicon !== false ? newLogoUrl : branding.faviconUrl);
      const newFaviconPath = newConfig.faviconStoragePath !== undefined ? newConfig.faviconStoragePath : branding.faviconStoragePath;

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
        logoStoragePath: newLogoPath,
        faviconUrl: newFaviconUrl,
        faviconStoragePath: newFaviconPath,
        history: updatedHistory,
        updatedAt: new Date().toISOString(),
      };

      // 1. Prepare exact DB payload matching existing columns in public.site_settings
      const dbPayload = {
        site_name: merged.siteName || 'Dadacha Dhaba',
        logo_url: merged.logoUrl,
        logo_storage_path: merged.logoStoragePath || null,
        favicon_url: merged.faviconUrl,
        favicon_storage_path: merged.faviconStoragePath || null,
        og_image_url: merged.ogImageUrl || null,
        og_image_storage_path: merged.ogImageUrl || null,
        use_global_logo_for_header: true,
        use_global_logo_for_footer: true,
        use_global_logo_for_login: merged.useGlobalForLogin ?? true,
        use_global_logo_for_admin: merged.useGlobalForAdmin ?? true,
        use_global_logo_for_invoice: merged.useGlobalForInvoice ?? true,
      };

      // 2. Save to Supabase Database FIRST
      const { error: saveError } = await supabaseSaveSiteSettings(dbPayload);
      if (saveError) {
        console.error('Failed saving site_settings to database:', saveError);
        return false;
      }

      // 3. Update React Context State ONLY if DB save succeeds
      setBranding(merged);

      // 4. Persist to LocalStorage Cache
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));

      // 5. Update DOM Favicon immediately
      updateFaviconInDOM(newFaviconUrl);

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
