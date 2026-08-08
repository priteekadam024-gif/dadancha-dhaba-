import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DhabaLogo } from '../components/DhabaLogo';
import { Mail, KeyRound, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { language, navigateTo, resetUserPassword, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const res = await resetUserPassword(email);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(language === 'mr' ? 'पासवर्ड रिसेट करण्याची लिंक तुमच्या ईमेलवर पाठवली आहे!' : 'Password reset link sent to your registered email address!');
      showToast(language === 'mr' ? 'रिसेट ईमेल पाठवले' : 'Reset email sent successfully!');
    } else {
      setErrorMsg(res.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-[#141414] border border-[#F4B400]/30 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <DhabaLogo size="hero" className="mx-auto" />
          <h1 className="text-2xl font-black text-white font-marathi">
            {language === 'mr' ? 'पासवर्ड पुन्हा मिळवा' : 'Reset Password'}
          </h1>
          <p className="text-xs text-zinc-400">
            {language === 'mr' ? 'तुमचा नोंदणीकृत ईमेल पत्ता प्रविष्ट करा' : 'Enter your email to receive a password reset link from Supabase Auth'}
          </p>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              {language === 'mr' ? 'ईमेल पत्ता' : 'Registered Email Address'}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white text-xs pl-9 pr-3 py-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F4B400] text-[#111111] font-extrabold text-sm py-3.5 rounded-xl hover:bg-[#FF8C00] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>
              {loading 
                ? (language === 'mr' ? 'पाठवत आहे...' : 'Sending Reset Email...') 
                : (language === 'mr' ? 'रिसेट लिंक पाठवा' : 'Send Reset Link')}
            </span>
          </button>
        </form>

        <button
          onClick={() => navigateTo('login')}
          className="w-full text-center text-xs text-zinc-400 hover:text-white flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'mr' ? 'लॉगइन कडे परत जा' : 'Back to Login'}</span>
        </button>
      </div>
    </div>
  );
};
