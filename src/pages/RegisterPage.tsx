import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DhabaLogo } from '../components/DhabaLogo';
import { User, Mail, Lock, Phone, UserPlus, Database, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export const RegisterPage: React.FC = () => {
  const { language, registerUser, navigateTo, showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMessage('');

    if (!email || !name || !password) {
      setErrorMessage(language === 'mr' ? 'कृपया सर्व आवश्यक माहिती प्रविष्ट करा.' : 'Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage(language === 'mr' ? 'पासवर्ड किमान ६ अक्षरांचा असणे आवश्यक आहे.' : 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(language === 'mr' ? 'पासवर्ड जुळत नाहीत!' : 'Passwords do not match!');
      return;
    }

    setLoading(true);
    const result = await registerUser(name, email, phone, password);
    setLoading(false);

    if (!result.success && result.message) {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="bg-[#141414] border border-[#F4B400]/30 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <DhabaLogo size="hero" className="mx-auto" />
          <h1 className={`text-2xl font-black text-white ${language === 'mr' ? 'font-marathi' : ''}`}>
            {language === 'mr' ? 'नवीन खाते नोंदणी' : 'Create an Account'}
          </h1>
          <p className="text-xs text-zinc-400">
            {language === 'mr' ? 'दादाचा ढाबा परिवारात सामील व्हा' : 'Join Dadacha Dhaba for special offers & rewards'}
          </p>

          {/* Supabase status badge */}
          <div className="pt-1">
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {language === 'mr' ? 'Supabase डेटाबेस कनेक्टेड आहे' : 'Supabase Account Sync Active'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Database className="w-3.5 h-3.5" />
                {language === 'mr' ? 'सुपाबेस प्रोफाइल संचयन तयार' : 'Supabase Cloud Sync Ready'}
              </span>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              {language === 'mr' ? 'पूर्ण नाव *' : 'Full Name *'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ramesh Patil"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white text-xs pl-9 pr-3 py-3 rounded-xl border border-zinc-700"
              />
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              {language === 'mr' ? 'ईमेल पत्ता *' : 'Email Address *'}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white text-xs pl-9 pr-3 py-3 rounded-xl border border-zinc-700"
              />
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              {language === 'mr' ? 'मोबाइल नंबर *' : 'Phone Number *'}
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="+91 98220 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white text-xs pl-9 pr-3 py-3 rounded-xl border border-zinc-700"
              />
              <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              {language === 'mr' ? 'गुप्त पासवर्ड *' : 'Password *'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white text-xs pl-9 pr-10 py-3 rounded-xl border border-zinc-700"
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-1 text-zinc-400 hover:text-white transition-colors focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              {language === 'mr' ? 'पासवर्डची पुष्टी करा *' : 'Confirm Password *'}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white text-xs pl-9 pr-10 py-3 rounded-xl border border-zinc-700"
              />
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 p-1 text-zinc-400 hover:text-white transition-colors focus:outline-none"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-extrabold text-sm py-3.5 rounded-xl hover:scale-[1.01] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {loading 
                ? (language === 'mr' ? 'नोंदणी करत आहे...' : 'Creating Account...') 
                : (language === 'mr' ? 'खाते तयार करा' : 'Create Account')}
            </span>
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-[10px] text-zinc-500 font-bold uppercase">Or Register With</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        <button
          type="button"
          onClick={() => {
            registerUser('Google User', 'user@gmail.com', '+91 98000 11223');
            showToast(language === 'mr' ? 'Google द्वारे यशस्वीरित्या साइन-इन झाले!' : 'Signed in with Google!');
          }}
          className="w-full bg-[#1A1A1A] hover:bg-zinc-800 text-white font-bold text-xs py-3 rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/>
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-xs text-zinc-400">
          {language === 'mr' ? 'आधीच खाते आहे?' : 'Already have an account?'}{' '}
          <button onClick={() => navigateTo('login')} className="text-[#F4B400] font-bold hover:underline">
            {language === 'mr' ? 'लॉगिन करा' : 'Login Here'}
          </button>
        </p>
      </div>
    </div>
  );
};

