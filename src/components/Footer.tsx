import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DhabaLogo } from './DhabaLogo';
import { 
  Phone, Mail, MapPin, Instagram, Youtube, Facebook, 
  Send, Heart, ShieldCheck, Truck, Award 
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { language, navigateTo, showToast, contactConfig } = useApp();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const cleanPhone = (contactConfig?.phone || '').replace(/[^0-9+]/g, '');
  const cleanWa = (contactConfig?.whatsapp || '').replace(/[^0-9]/g, '');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast(language === 'mr' ? 'कृपया वैध ईमेल प्रविष्ट करा' : 'Please enter a valid email', 'error');
      return;
    }
    showToast(language === 'mr' ? 'न्यूजलेटर सदस्यता यशस्वी झाली! धन्यवाद ❤️' : 'Subscribed to Newsletter successfully! ❤️');
    setNewsletterEmail('');
  };

  return (
    <footer className="bg-[#0A0A0A] text-zinc-300 border-t border-[#F4B400]/20 pt-12 pb-8">
      {/* Guarantees / Service Benefits Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-[#141414] border border-[#F4B400]/20 rounded-2xl shadow-xl text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="p-3 bg-[#F4B400]/10 text-[#F4B400] rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                {language === 'mr' ? '१००% अस्सल गावरान' : '100% Authentic'}
              </h4>
              <p className="text-xs text-zinc-400">
                {language === 'mr' ? 'कोणतेही रसायन किंवा भेसळ नाही' : 'No chemicals or artificial colors'}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="p-3 bg-[#F4B400]/10 text-[#F4B400] rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                {language === 'mr' ? 'वेगवान होम डिलिव्हरी' : 'Express Home Delivery'}
              </h4>
              <p className="text-xs text-zinc-400">
                {language === 'mr' ? 'संपूर्ण भारतात ३-५ दिवसांत' : '3-5 days across India'}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="p-3 bg-[#F4B400]/10 text-[#F4B400] rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                {language === 'mr' ? 'सुरक्षित ऑनलाइन पेमेंट' : 'Secure Online Payment'}
              </h4>
              <p className="text-xs text-zinc-400">
                {language === 'mr' ? 'UPI, Razorpay व COD उपलब्ध' : 'UPI, PhonePe & COD Ready'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <DhabaLogo size="lg" />
          <p className="text-sm text-zinc-400 leading-relaxed font-marathi">
            {language === 'mr' 
              ? 'दादाचा ढाबा म्हणजे अस्सल महाराष्ट्रीयन चव, लाकडी घाण्याचे तेल, पारंपरिक पितळी भांडी आणि गावरान कांदा लसूण मसाल्याची समृद्ध परंपरा. स्वाद, सेवा आणि भरपूर प्रेम!'
              : 'Dadacha Dhaba represents authentic Maharashtrian culinary heritage—hand-roasted heirloom spices, traditional brass kalai cookware, and stone-pressed chutneys. Made with love & tradition.'}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <a 
              href={contactConfig.instagramUrl || "https://www.instagram.com/dadanchadhaba?igsh=MTIzajBqdG1pdHJ5aA=="} 
              target="_blank" 
              rel="noreferrer"
              className="p-2.5 bg-[#1F1F1F] hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white text-zinc-300 rounded-full transition-all shadow-md"
              title="Instagram - @dadanchadhaba"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href={contactConfig.youtubeUrl || "https://youtube.com/@dadanchadhaba?si=3KnepBsTXtH6-Opz"} 
              target="_blank" 
              rel="noreferrer"
              className="p-2.5 bg-[#1F1F1F] hover:bg-red-600 hover:text-white text-zinc-300 rounded-full transition-all shadow-md"
              title="YouTube - @dadanchadhaba"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a 
              href={contactConfig.facebookUrl || "https://www.facebook.com/share/199iUku8xx/"} 
              target="_blank" 
              rel="noreferrer"
              className="p-2.5 bg-[#1F1F1F] hover:bg-blue-600 hover:text-white text-zinc-300 rounded-full transition-all shadow-md"
              title="Facebook - Dadacha Dhaba"
            >
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-[#F4B400] font-bold text-base mb-4 uppercase tracking-wider">
            {language === 'mr' ? 'नेव्हिगेशन' : 'Quick Links'}
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button onClick={() => navigateTo('shop')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'सर्व उत्पादने' : 'All Products'}
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('categories')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'उत्पादन श्रेणी' : 'Categories'}
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('videos')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'रेसिपी व्हिडिओ' : 'Recipe Videos'}
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('gallery')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'फोटो गॅलरी' : 'Photo Gallery'}
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('recipes')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'पाककृती (ब्लॉग)' : 'Cooking Blog'}
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('track-order')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'ऑर्डर स्टेटस ट्रॅक करा' : 'Track Order Status'}
              </button>
            </li>
          </ul>
        </div>

        {/* Policies & Account */}
        <div>
          <h3 className="text-[#F4B400] font-bold text-base mb-4 uppercase tracking-wider">
            {language === 'mr' ? 'धोरण व मदत' : 'Policies & Support'}
          </h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button onClick={() => navigateTo('about')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'दादांबद्दल जाणून घ्या' : 'About Dada'}
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('contact')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'संपर्क साधा' : 'Contact Us'}
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('privacy')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'गोपनीयता धोरण' : 'Privacy Policy'}
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('terms')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'अटी व शर्ती' : 'Terms & Conditions'}
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('shipping-policy')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'शिपिंग धोरण' : 'Shipping Policy'}
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('refund-policy')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'परतावा धोरण' : 'Refund Policy'}
              </button>
            </li>
            <li>
              <button onClick={() => navigateTo('faqs')} className="hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? 'नेहमी विचारले जाणारे प्रश्न' : 'FAQs'}
              </button>
            </li>
          </ul>
        </div>

        {/* Contact Info & Newsletter */}
        <div>
          <h3 className="text-[#F4B400] font-bold text-base mb-4 uppercase tracking-wider">
            {language === 'mr' ? 'ग्राहक सेवा व संपर्क' : 'Customer Support'}
          </h3>
          <div className="space-y-2.5 text-xs text-zinc-300 mb-4">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#F4B400] shrink-0 mt-0.5" />
              <span>{contactConfig.address}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#F4B400] shrink-0" />
              <a href={`tel:${cleanPhone}`} className="hover:text-[#F4B400] transition-colors font-semibold">
                📞 {contactConfig.phone}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <a 
                href={`https://wa.me/${cleanWa}?text=${encodeURIComponent('Hello Dadacha Dhaba,\n\nI would like to know more about your products.')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-emerald-400 transition-colors font-semibold text-emerald-400"
              >
                💬 WhatsApp: {contactConfig.whatsapp}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#F4B400] shrink-0" />
              <a href={`mailto:${contactConfig.email}`} className="hover:text-[#F4B400] transition-colors">
                {contactConfig.email}
              </a>
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="space-y-2">
            <label className="text-xs text-zinc-300 font-semibold block">
              {language === 'mr' ? 'नवीन ऑफर्स व रेसिपीसाठी सबस्क्राईब करा:' : 'Subscribe for offers & recipes:'}
            </label>
            <div className="flex">
              <input
                type="email"
                placeholder="Email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="bg-[#1A1A1A] border border-zinc-800 text-xs text-white px-3 py-2 rounded-l-lg focus:outline-none focus:border-[#F4B400] w-full"
              />
              <button
                type="submit"
                className="bg-[#F4B400] text-[#111111] font-bold px-3 py-2 rounded-r-lg hover:bg-[#FF8C00] transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Payment methods & Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <p className="flex items-center gap-1">
          © 2026 {language === 'mr' ? 'दादाचा ढाबा (Dadacha Dhaba)' : 'Dadacha Dhaba'}. {language === 'mr' ? 'सर्व हक्क सुरक्षित' : 'All Rights Reserved'}. Made with{' '}
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> in Maharashtra.
        </p>

        {/* Payment Badges */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="bg-[#1C1C1C] border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 font-bold">
            Razorpay
          </span>
          <span className="bg-[#1C1C1C] border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 font-bold">
            BHIM UPI
          </span>
          <span className="bg-[#1C1C1C] border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 font-bold">
            PhonePe
          </span>
          <span className="bg-[#1C1C1C] border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 font-bold">
            Google Pay
          </span>
          <span className="bg-[#1C1C1C] border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 font-bold">
            Paytm
          </span>
          <span className="bg-[#1C1C1C] border border-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300 font-bold">
            COD Available
          </span>
        </div>
      </div>
    </footer>
  );
};
