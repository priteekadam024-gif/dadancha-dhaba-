import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DhabaLogo } from '../components/DhabaLogo';
import { Lock, ShieldAlert, Mail } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { language, adminLogin, loginAdmin, navigateTo } = useApp();
  const [email, setEmail] = useState('admin@dadachadhaba.com');
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const authFn = adminLogin || loginAdmin;
      const success = authFn(passcode || email);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-[#121212] border-2 border-[#F4B400] rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[#F4B400] text-[#111111] font-black text-[10px] px-4 py-1 rounded-bl-xl uppercase tracking-widest">
          RESTRICTED PORTAL
        </div>

        <div className="text-center space-y-3">
          <DhabaLogo size="hero" className="mx-auto" purpose="admin" />
          <h1 className="text-2xl font-black text-white font-marathi">
            {language === 'mr' ? 'अॅडमिन सीक्रेट पोर्टल' : 'Admin Secret Login'}
          </h1>
          <p className="text-xs text-zinc-400">
            {language === 'mr' ? 'फक्त अधिकृत व्यवस्थापकांसाठी प्रवेश' : 'Enter Admin Password or Credentials to access panel'}
          </p>
        </div>

        <form onSubmit={handleAdminAuth} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              {language === 'mr' ? 'अॅडमिन ईमेल' : 'Admin Email'}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white text-xs px-11 py-3 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              {language === 'mr' ? 'अॅडमिन पासवर्ड / पासकोड' : 'Admin Password / Passcode'}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white font-mono text-center text-lg tracking-widest py-3.5 rounded-2xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
              />
              <Lock className="w-5 h-5 text-[#F4B400] absolute left-4 top-4" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-black text-sm py-4 rounded-2xl hover:scale-[1.01] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>
              {isLoading
                ? (language === 'mr' ? 'प्रवेश करत आहे...' : 'Signing you in...')
                : (language === 'mr' ? 'पोर्टलमध्ये प्रवेश करा' : 'Authenticate & Unlock')}
            </span>
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={() => navigateTo('home')}
            className="text-xs text-zinc-500 hover:text-white"
          >
            ← Back to Storefront
          </button>
        </div>
      </div>
    </div>
  );
};
