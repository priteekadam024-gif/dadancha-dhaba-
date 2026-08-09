import React, { useState, useRef } from 'react';
import { useBranding, BrandingHistoryItem } from '../context/BrandingContext';
import { useApp } from '../context/AppContext';
import { OfficialLogo } from './OfficialLogo';
import { 
  UploadCloud, Sparkles, CheckCircle2, RotateCcw, 
  Trash2, ShieldCheck, RefreshCw, Layers, Monitor, 
  Smartphone, FileText, Lock, Globe, History, Check, AlertCircle
} from 'lucide-react';

export const BrandingManager: React.FC = () => {
  const { 
    branding, 
    getEffectiveLogo, 
    getEffectiveFavicon, 
    applyBrandingEverywhere, 
    uploadAssetFile, 
    resetToDefaultBranding, 
    restoreFromHistory 
  } = useBranding();

  const { language, showToast } = useApp();

  // Local candidate staging state before clicking "APPLY EVERYWHERE"
  const [candidateLogo, setCandidateLogo] = useState<string | null>(null);
  const [candidateLogoFile, setCandidateLogoFile] = useState<File | null>(null);
  const [candidateLogoMeta, setCandidateLogoMeta] = useState<{ name: string; size: string; dimensions?: string } | null>(null);

  const [candidateFavicon, setCandidateFavicon] = useState<string | null>(null);
  const [candidateFaviconFile, setCandidateFaviconFile] = useState<File | null>(null);

  const [candidateLoginLogo, setCandidateLoginLogo] = useState<string | null>(null);
  const [candidateAdminLogo, setCandidateAdminLogo] = useState<string | null>(null);
  const [candidateInvoiceLogo, setCandidateInvoiceLogo] = useState<string | null>(null);

  // Checkbox states
  const [useGlobalForFavicon, setUseGlobalForFavicon] = useState<boolean>(branding.useGlobalForFavicon);
  const [useGlobalForLogin, setUseGlobalForLogin] = useState<boolean>(branding.useGlobalForLogin);
  const [useGlobalForAdmin, setUseGlobalForAdmin] = useState<boolean>(branding.useGlobalForAdmin);
  const [useGlobalForInvoice, setUseGlobalForInvoice] = useState<boolean>(branding.useGlobalForInvoice);

  // Drag states
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingFavicon, setIsDraggingFavicon] = useState(false);

  // UI Processing states
  const [isApplying, setIsApplying] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'desktop' | 'mobile' | 'footer' | 'login' | 'admin' | 'favicon'>('desktop');

  const mainFileInputRef = useRef<HTMLInputElement>(null);
  const faviconFileInputRef = useRef<HTMLInputElement>(null);

  // File Validation Helper
  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      showToast(
        language === 'mr' 
          ? 'अवैध फाइल प्रकार! फक्त PNG, JPG, JPEG, WEBP, किंवा SVG अपलोड करा.' 
          : 'Please upload a valid logo image (PNG, JPG, JPEG, WEBP, or SVG).',
        'error'
      );
      return false;
    }

    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      showToast(
        language === 'mr' ? 'फाइलचा आकार खूप मोठा आहे (कमाल १० MB)' : 'File size exceeds 10 MB maximum limit.',
        'error'
      );
      return false;
    }

    return true;
  };

  // Main Logo Selection Handler
  const handleMainLogoSelect = (file: File) => {
    if (!validateImageFile(file)) return;

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        const resultUrl = e.target.result as string;
        setCandidateLogo(resultUrl);
        setCandidateLogoFile(file);

        // Read image dimensions
        const img = new Image();
        img.src = resultUrl;
        img.onload = () => {
          setCandidateLogoMeta({
            name: file.name,
            size: sizeFormatted,
            dimensions: `${img.width} × ${img.height} px`,
          });
        };

        showToast(
          language === 'mr' 
            ? 'नवीन लोगो निवडला! लागू करण्यासाठी "APPLY EVERYWHERE" वर क्लिक करा.' 
            : 'New logo staged! Click "APPLY EVERYWHERE" to publish across the website.'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Favicon Selection Handler
  const handleFaviconSelect = (file: File) => {
    if (!validateImageFile(file)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCandidateFavicon(e.target.result as string);
        setCandidateFaviconFile(file);
        setUseGlobalForFavicon(false);
        showToast(language === 'mr' ? 'नवीन फेव्हिकॉन लोड झाला!' : 'New favicon staged!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop Handlers for Main Logo
  const handleMainDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingMain(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleMainLogoSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFaviconDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFavicon(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFaviconSelect(e.dataTransfer.files[0]);
    }
  };

  // ONE-CLICK APPLY EVERYWHERE
  const handleApplyEverywhere = async () => {
    setIsApplying(true);

    try {
      let finalLogoUrl = branding.logoUrl;
      let finalLogoPath = branding.logoStoragePath || '';
      let finalFaviconUrl = branding.faviconUrl;
      let finalFaviconPath = branding.faviconStoragePath || '';

      // 1. Upload candidate main logo if selected
      if (candidateLogoFile) {
        const uploadRes = await uploadAssetFile(candidateLogoFile, 'branding/logo');
        if (uploadRes && uploadRes.publicUrl) {
          finalLogoUrl = uploadRes.publicUrl;
          finalLogoPath = uploadRes.storagePath;
        } else {
          showToast(
            language === 'mr'
              ? 'लोगो इमेज स्टोरेजमध्ये अपलोड करणे अयशस्वी झाले.'
              : 'Failed to upload logo image to Supabase Storage.',
            'error'
          );
          setIsApplying(false);
          return;
        }
      }

      // 2. Upload candidate favicon if selected
      if (useGlobalForFavicon) {
        finalFaviconUrl = finalLogoUrl;
        finalFaviconPath = finalLogoPath;
      } else if (candidateFaviconFile) {
        const uploadRes = await uploadAssetFile(candidateFaviconFile, 'branding/favicon');
        if (uploadRes && uploadRes.publicUrl) {
          finalFaviconUrl = uploadRes.publicUrl;
          finalFaviconPath = uploadRes.storagePath;
        } else {
          showToast(
            language === 'mr'
              ? 'फेव्हिकॉन इमेज स्टोरेजमध्ये अपलोड करणे अयशस्वी झाले.'
              : 'Failed to upload favicon image to Supabase Storage.',
            'error'
          );
          setIsApplying(false);
          return;
        }
      }

      // 3. Apply everywhere in global context & database
      const success = await applyBrandingEverywhere({
        logoUrl: finalLogoUrl,
        logoStoragePath: finalLogoPath,
        faviconUrl: finalFaviconUrl,
        faviconStoragePath: finalFaviconPath,
        useGlobalForFavicon,
        useGlobalForLogin,
        useGlobalForAdmin,
        useGlobalForInvoice,
      }, `Updated by Admin (${candidateLogoFile?.name || candidateFaviconFile?.name || 'Custom Asset'})`);

      if (success) {
        setCandidateLogoFile(null);
        setCandidateLogo(null);
        setCandidateLogoMeta(null);
        setCandidateFaviconFile(null);
        setCandidateFavicon(null);

        showToast(
          language === 'mr' 
            ? 'लोगो आणि ब्रँडिंग माहिती संपूर्ण वेबसाईटवर यशस्वीरित्या अपडेट झाली! 🎉' 
            : 'Branding updated successfully',
          'success'
        );
      } else {
        showToast(
          language === 'mr'
            ? 'डेटाबेसमध्ये ब्रँडिंग सेटिंग्स सेव्ह करणे अयशस्वी झाले.'
            : 'Failed to save branding settings to database.',
          'error'
        );
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating branding settings.', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  // Active Effective Previews
  const currentWorkingLogo = candidateLogo || branding.logoUrl;
  const currentWorkingFavicon = useGlobalForFavicon 
    ? currentWorkingLogo 
    : (candidateFavicon || branding.faviconUrl || currentWorkingLogo);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-[#161616] border border-[#F4B400]/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#F4B400]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-5 text-center sm:text-left flex-col sm:flex-row z-10">
          <div className="p-3 bg-[#222222] border-2 border-[#F4B400] rounded-2xl shadow-xl">
            <OfficialLogo size="lg" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] bg-[#F4B400] text-[#111111] font-black px-3 py-0.5 rounded-full uppercase tracking-widest">
                👑 BRAND IDENTITY SUITE
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Live Single Source of Truth
              </span>
            </div>
            <h1 className="text-3xl font-black text-white font-marathi tracking-tight">
              Branding Manager
            </h1>
            <p className="text-xs text-zinc-400">
              Manage your website identity from one place. Update logo, favicon, and brand assets everywhere instantly.
            </p>
          </div>
        </div>

        {/* Global Apply Button */}
        <div className="z-10 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full sm:w-auto text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-3 rounded-2xl border border-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-zinc-400" />
            <span>Reset Default</span>
          </button>

          <button
            onClick={handleApplyEverywhere}
            disabled={isApplying}
            className={`w-full sm:w-auto text-xs font-black px-6 py-3.5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2.5 ${
              isApplying 
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#F4B400] via-[#FF8C00] to-[#E5A000] text-[#111111] hover:scale-105 active:scale-95 shadow-[#F4B400]/20'
            }`}
          >
            {isApplying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#111111]" />
                <span>Applying Everywhere...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#111111]" />
                <span className="uppercase tracking-wider">APPLY EVERYWHERE</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload Controls & Asset Toggles */}
        <div className="lg:col-span-7 space-y-8">
          {/* SECTION 1: GLOBAL WEBSITE LOGO */}
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#F4B400]" />
                <h3 className="font-extrabold text-white text-base">GLOBAL WEBSITE LOGO</h3>
              </div>
              <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full font-mono">
                Primary Master Emblem
              </span>
            </div>

            {/* Current Active Logo Display */}
            <div className="bg-[#111111] border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#1C1C1C] border border-[#F4B400]/40 rounded-2xl shrink-0 shadow-inner">
                  <img
                    src={currentWorkingLogo}
                    alt="Active Logo"
                    className="w-14 h-14 object-contain rounded-xl"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Active Official Logo</span>
                  <span className="text-[11px] text-zinc-400 block max-w-xs truncate font-mono mt-0.5">
                    {branding.logoUrl}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Configured as Global Source of Truth
                  </span>
                </div>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 block">
                Upload or Replace Global Logo
              </label>

              <input
                type="file"
                ref={mainFileInputRef}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleMainLogoSelect(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingMain(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingMain(false); }}
                onDrop={handleMainDrop}
                onClick={() => mainFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden group ${
                  isDraggingMain
                    ? 'border-[#F4B400] bg-[#F4B400]/10 scale-[1.01]'
                    : 'border-zinc-700 hover:border-[#F4B400] bg-[#121212] hover:bg-[#181818]'
                }`}
              >
                <div className="p-4 bg-[#222222] text-[#F4B400] rounded-2xl border border-zinc-700 shadow-xl group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">
                    {isDraggingMain ? 'Drop logo image here' : 'Drag & Drop Logo Here'}
                  </p>
                  <p className="text-xs text-zinc-400 font-medium">or Browse From Device</p>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-wider pt-1">
                    PNG • JPG • JPEG • WEBP • SVG (Max 10 MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Staged Candidate Logo Metadata Card */}
            {candidateLogoMeta && (
              <div className="bg-[#1A1A1A] border border-[#F4B400]/50 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={candidateLogo!} alt="Staged" className="w-12 h-12 object-contain bg-[#111] p-1 rounded-xl border border-zinc-700" />
                  <div className="text-xs">
                    <span className="font-bold text-white block truncate max-w-[180px]">{candidateLogoMeta.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      Size: {candidateLogoMeta.size} • {candidateLogoMeta.dimensions}
                    </span>
                    <span className="text-[10px] text-[#F4B400] font-bold">Ready to Apply Everywhere</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => mainFileInputRef.current?.click()}
                    className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-700"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCandidateLogo(null);
                      setCandidateLogoFile(null);
                      setCandidateLogoMeta(null);
                    }}
                    className="text-[11px] bg-rose-950 hover:bg-rose-900 text-rose-300 p-1.5 rounded-lg border border-rose-800"
                    title="Remove candidate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: WEBSITE FAVICON */}
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#F4B400]" />
                <h3 className="font-extrabold text-white text-base">WEBSITE FAVICON</h3>
              </div>
              <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full font-mono">
                Browser Tab Icon
              </span>
            </div>

            {/* Current Favicon Preview */}
            <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1C1C1C] border border-[#F4B400]/40 rounded-xl p-2 flex items-center justify-center shrink-0">
                  <img src={currentWorkingFavicon} alt="Favicon" className="w-8 h-8 object-contain rounded-md" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Current Favicon Icon</span>
                  <p className="text-[11px] text-zinc-400">
                    {useGlobalForFavicon ? 'Inherits from Global Logo emblem' : 'Custom independent Favicon icon'}
                  </p>
                </div>
              </div>

              {/* Use Global Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer bg-[#1A1A1A] px-3 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 select-none">
                <input
                  type="checkbox"
                  checked={useGlobalForFavicon}
                  onChange={(e) => {
                    setUseGlobalForFavicon(e.target.checked);
                    if (e.target.checked) {
                      setCandidateFavicon(null);
                      setCandidateFaviconFile(null);
                    }
                  }}
                  className="w-4 h-4 accent-[#F4B400] rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-zinc-200">Use Global Logo</span>
              </label>
            </div>

            {/* Upload Favicon if not using global */}
            {!useGlobalForFavicon && (
              <div className="space-y-2">
                <input
                  type="file"
                  ref={faviconFileInputRef}
                  accept="image/png,image/x-icon,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFaviconSelect(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFavicon(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingFavicon(false); }}
                  onDrop={handleFaviconDrop}
                  onClick={() => faviconFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDraggingFavicon ? 'border-[#F4B400] bg-[#F4B400]/10' : 'border-zinc-700 bg-[#121212] hover:bg-[#181818]'
                  }`}
                >
                  <UploadCloud className="w-6 h-6 text-[#F4B400]" />
                  <p className="text-xs font-bold text-white">Drag & Drop Favicon Here or Browse</p>
                  <p className="text-[10px] text-zinc-500 font-mono">Recommended: 32x32, 48x48, 180x180, 512x512 PNG/ICO</p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: OPTIONAL BRAND ASSETS & TOGGLES */}
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F4B400]" />
                <h3 className="font-extrabold text-white text-base">SPECIALIZED BRAND ASSETS</h3>
              </div>
              <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full font-mono">
                "Use Global Logo" Toggles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Login Logo Card */}
              <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#F4B400]" /> Login Page
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useGlobalForLogin}
                    onChange={(e) => setUseGlobalForLogin(e.target.checked)}
                    className="w-4 h-4 accent-[#F4B400] rounded"
                  />
                  <span className="text-[11px] font-semibold text-zinc-300">Use Global Logo</span>
                </label>
              </div>

              {/* Admin Logo Card */}
              <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-[#F4B400]" /> Admin Panel
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useGlobalForAdmin}
                    onChange={(e) => setUseGlobalForAdmin(e.target.checked)}
                    className="w-4 h-4 accent-[#F4B400] rounded"
                  />
                  <span className="text-[11px] font-semibold text-zinc-300">Use Global Logo</span>
                </label>
              </div>

              {/* Invoice Logo Card */}
              <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#F4B400]" /> Invoice & Print
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useGlobalForInvoice}
                    onChange={(e) => setUseGlobalForInvoice(e.target.checked)}
                    className="w-4 h-4 accent-[#F4B400] rounded"
                  />
                  <span className="text-[11px] font-semibold text-zinc-300">Use Global Logo</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Live Previews & Branding History */}
        <div className="lg:col-span-5 space-y-8">
          {/* SECTION 4: REAL-TIME PREVIEW PANELS */}
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl sticky top-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[#F4B400]" />
                <span>REAL-TIME WEBSITE PREVIEW</span>
              </h3>
              <span className="text-[10px] bg-[#F4B400]/10 text-[#F4B400] border border-[#F4B400]/30 px-2 py-0.5 rounded-full font-bold">
                Live Render
              </span>
            </div>

            {/* Preview Navigation Tabs */}
            <div className="flex gap-1.5 overflow-x-auto bg-[#111111] p-1.5 rounded-2xl border border-zinc-800 text-[11px]">
              <button
                type="button"
                onClick={() => setActivePreviewTab('desktop')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activePreviewTab === 'desktop' ? 'bg-[#F4B400] text-[#111111]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('mobile')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activePreviewTab === 'mobile' ? 'bg-[#F4B400] text-[#111111]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mobile
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('footer')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activePreviewTab === 'footer' ? 'bg-[#F4B400] text-[#111111]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Footer
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('login')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activePreviewTab === 'login' ? 'bg-[#F4B400] text-[#111111]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('favicon')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  activePreviewTab === 'favicon' ? 'bg-[#F4B400] text-[#111111]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Favicon Tab
              </button>
            </div>

            {/* Mockup Preview Stage */}
            <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-4 overflow-hidden">
              {activePreviewTab === 'desktop' && (
                <div className="space-y-3">
                  <div className="bg-[#181818] border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                    <OfficialLogo size="md" customLogoUrl={currentWorkingLogo} />
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span>Home</span>
                      <span>Shop</span>
                      <span>Contact</span>
                      <span className="bg-[#F4B400] text-[#111] px-2 py-0.5 rounded-md font-bold text-[10px]">Cart (2)</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 text-center">Desktop Storefront Header Preview</p>
                </div>
              )}

              {activePreviewTab === 'mobile' && (
                <div className="max-w-[280px] mx-auto space-y-3">
                  <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-3 flex items-center justify-between">
                    <OfficialLogo size="sm" customLogoUrl={currentWorkingLogo} />
                    <div className="w-6 h-6 bg-zinc-800 rounded-md flex flex-col items-center justify-center gap-1">
                      <div className="w-3 h-0.5 bg-zinc-300" />
                      <div className="w-3 h-0.5 bg-zinc-300" />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 text-center">Mobile Navbar Header Preview</p>
                </div>
              )}

              {activePreviewTab === 'footer' && (
                <div className="space-y-3 bg-[#0A0A0A] p-4 rounded-xl border border-zinc-800">
                  <OfficialLogo size="lg" customLogoUrl={currentWorkingLogo} />
                  <p className="text-[11px] text-zinc-400 font-marathi">
                    अस्सल कोल्हापुरी व गावरान मसाल्यांचा राजा - दादाचा ढाबा.
                  </p>
                  <p className="text-[10px] text-zinc-600 border-t border-zinc-800 pt-2">© 2026 Dadacha Dhaba. All rights reserved.</p>
                </div>
              )}

              {activePreviewTab === 'login' && (
                <div className="max-w-xs mx-auto p-4 bg-[#141414] rounded-2xl border border-zinc-800 text-center space-y-3">
                  <OfficialLogo size="hero" className="mx-auto" customLogoUrl={useGlobalForLogin ? currentWorkingLogo : candidateLoginLogo || currentWorkingLogo} />
                  <h4 className="text-xs font-bold text-white font-marathi">ग्राहक लॉगिन कक्ष</h4>
                  <div className="space-y-2">
                    <div className="bg-[#222] h-7 rounded-lg border border-zinc-700" />
                    <div className="bg-[#222] h-7 rounded-lg border border-zinc-700" />
                    <div className="bg-[#F4B400] h-8 rounded-lg font-bold text-[#111] text-xs flex items-center justify-center">Sign In</div>
                  </div>
                </div>
              )}

              {activePreviewTab === 'favicon' && (
                <div className="space-y-3">
                  <div className="bg-zinc-800 p-2 rounded-t-xl flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="bg-[#111111] px-3 py-1 rounded-md flex items-center gap-2 text-xs text-zinc-200">
                      <img src={currentWorkingFavicon} alt="Favicon" className="w-4 h-4 object-contain rounded" />
                      <span className="font-medium truncate text-[11px]">Dadacha Dhaba | दादाचा ढाबा</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 text-center">Browser Tab Bar Favicon Preview</p>
                </div>
              )}
            </div>

            {/* SECTION 5: BRANDING HISTORY & ROLLBACK */}
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#F4B400]" /> Branding History
                </h4>
                <span className="text-[10px] text-zinc-500">{branding.history.length} snapshots stored</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {branding.history.map((item: BrandingHistoryItem) => (
                  <div key={item.id} className="bg-[#111111] border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={item.logoUrl} alt="History Logo" className="w-8 h-8 object-contain rounded-lg bg-[#181818] p-0.5 border border-zinc-700" />
                      <div>
                        <span className="font-bold text-white block text-[11px]">{item.label || 'Logo Update'}</span>
                        <span className="text-[10px] text-zinc-500 block">
                          {new Date(item.changedAt).toLocaleDateString()} • {item.changedBy}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        restoreFromHistory(item);
                        showToast('Restored branding from history!', 'success');
                      }}
                      className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold px-2.5 py-1 rounded-lg border border-zinc-700 transition-all shrink-0"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#F4B400]/40 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl text-center">
            <div className="w-12 h-12 bg-amber-950/80 text-[#F4B400] rounded-2xl flex items-center justify-center mx-auto border border-amber-800/80">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-marathi">
                मूळ लोगो पुनर्संचयित करायचा?
              </h3>
              <p className="text-xs text-zinc-400">
                Are you sure you want to restore the default Dadacha Dhaba logo across the entire website?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs py-3 rounded-xl border border-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowResetModal(false);
                  await resetToDefaultBranding();
                  showToast('Restored default official Dadacha Dhaba logo!', 'success');
                }}
                className="flex-1 bg-[#F4B400] hover:bg-[#FF8C00] text-[#111111] font-black text-xs py-3 rounded-xl shadow-lg"
              >
                Restore Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
