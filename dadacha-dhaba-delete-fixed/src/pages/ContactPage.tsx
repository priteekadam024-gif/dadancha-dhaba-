import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OfficialLogo } from '../components/OfficialLogo';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, ShieldCheck, Instagram, Youtube, Facebook } from 'lucide-react';
import { supabaseSaveContactMessage } from '../lib/supabase';

export const ContactPage: React.FC = () => {
  const { language, showToast, contactConfig } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const cleanPhone = contactConfig.phone.replace(/[^0-9+]/g, '');
  const cleanWa = contactConfig.whatsapp.replace(/[^0-9]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) {
      showToast(language === 'mr' ? 'कृपया सर्व आवश्यक माहिती भरा' : 'Please fill all required fields', 'error');
      return;
    }

    // Save to Supabase
    await supabaseSaveContactMessage({ name, phone, email, message });

    setSubmitted(true);
    showToast(`Thank you for contacting Dadacha Dhaba. Our team will reach out to you shortly. You can also call or WhatsApp us at ${contactConfig.phone}.`, 'success');

    setName('');
    setPhone('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Title */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-[#F4B400] bg-[#F4B400]/10 px-3.5 py-1 rounded-full uppercase border border-[#F4B400]/30">
          📞 {language === 'mr' ? 'संपर्क साधा' : 'Get In Touch'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-marathi">
          {language === 'mr' ? 'दादांशी संपर्क साधा' : 'We Would Love To Hear From You'}
        </h1>
        <p className="text-xs text-zinc-400 font-marathi">
          {language === 'mr' 
            ? 'ऑर्डरबद्दल प्रश्न, मोठ्या खरेदीच्या ऑर्डर्स किंवा कोणत्याही चौकशीसाठी संपर्क करा.' 
            : 'For bulk orders, restaurant inquiries, or spice customizations, feel free to reach out.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-extrabold text-white text-lg font-marathi border-b border-zinc-800 pb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#F4B400]" />
              <span>{language === 'mr' ? 'मुख्य केंद्र व पत्ता' : 'Flagship Dhaba & Kitchen'}</span>
            </h3>

            <div className="space-y-3 text-xs text-zinc-300">
              <p>
                <strong className="text-white block">
                  {language === 'mr' ? 'पुणे ढाबा (Pune Branch):' : 'Pune Flagship Branch:'}
                </strong>
                {language === 'mr'
                  ? 'दादाचा ढाबा, प्लॉट नं ४२, बाणेर रोड, बालेवाडी हायस्ट्रीट समोर, पुणे - ४११०४५'
                  : 'Dadacha Dhaba, Plot No. 42, Baner Road, Opp. Balewadi High Street, Pune - 411045'}
              </p>
              <p>
                <strong className="text-white block">
                  {language === 'mr' ? 'कोल्हापूर केंद्र (Kolhapur Branch):' : 'Kolhapur Distribution Hub:'}
                </strong>
                {language === 'mr'
                  ? 'ताराबाई पार्क, स्टेशन रोड, कोल्हापूर - ४१६००३'
                  : 'Tarabai Park, Station Road, Kolhapur - 416003'}
              </p>
            </div>
          </div>

          <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-4">
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
              <h3 className="font-extrabold text-white text-lg font-marathi flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#F4B400]" />
                <span>{language === 'mr' ? 'संपर्क माहिती' : 'Official Contact Information'}</span>
              </h3>
              <OfficialLogo size="sm" variant="icon" />
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F4B400]" />
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Phone Number:</span>
                  <a href={`tel:${cleanPhone}`} className="font-bold text-white hover:text-[#F4B400] text-sm">
                    {contactConfig.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">WhatsApp Number:</span>
                  <a 
                    href={`https://wa.me/${cleanWa}?text=${encodeURIComponent('Hello Dadacha Dhaba,\n\nI would like to know more about your products.')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-bold text-emerald-400 hover:underline text-sm"
                  >
                    {contactConfig.whatsapp}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F4B400]" />
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Email Support:</span>
                  <a href={`mailto:${contactConfig.email}`} className="font-semibold text-white hover:text-[#F4B400]">
                    {contactConfig.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F4B400]" />
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Business Hours:</span>
                  <span className="text-white">{contactConfig.businessHours}</span>
                </div>
              </div>

              {/* Social Handles */}
              <div className="pt-2 border-t border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold mb-2">Follow Dadacha Dhaba:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={contactConfig.instagramUrl || "https://www.instagram.com/dadanchadhaba?igsh=MTIzajBqdG1pdHJ5aA=="}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-[#222222] hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white text-zinc-300 text-xs px-3 py-1.5 rounded-xl transition-all border border-zinc-700/60"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href={contactConfig.youtubeUrl || "https://youtube.com/@dadanchadhaba?si=3KnepBsTXtH6-Opz"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-[#222222] hover:bg-red-600 hover:text-white text-zinc-300 text-xs px-3 py-1.5 rounded-xl transition-all border border-zinc-700/60"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    <span>YouTube</span>
                  </a>
                  <a
                    href={contactConfig.facebookUrl || "https://www.facebook.com/share/199iUku8xx/"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-[#222222] hover:bg-blue-600 hover:text-white text-zinc-300 text-xs px-3 py-1.5 rounded-xl transition-all border border-zinc-700/60"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                    <span>Facebook</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`tel:${cleanPhone}`}
                className="bg-[#F4B400] hover:bg-[#FF8C00] text-[#111111] font-black text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Phone className="w-4 h-4" />
                <span>📞 Call Now</span>
              </a>

              <a
                href={`https://wa.me/${cleanWa}?text=${encodeURIComponent('Hello Dadacha Dhaba,\n\nI would like to know more about your products.')}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                <span>💬 Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-7 bg-[#161616] border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-6">
          <h3 className="font-black text-white text-xl font-marathi">
            {language === 'mr' ? 'आम्हाला मेसेज पाठवा' : 'Send Us a Message'}
          </h3>

          {submitted && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 p-4 rounded-2xl text-xs text-emerald-200 leading-relaxed font-semibold space-y-1 animate-fade-in">
              <p className="font-bold text-sm text-emerald-300">✅ Message Received!</p>
              <p>
                Thank you for contacting Dadacha Dhaba. Our team will reach out to you shortly. You can also call or WhatsApp us at <a href={`tel:${cleanPhone}`} className="underline font-bold text-white">{contactConfig.phone}</a>.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  {language === 'mr' ? 'तुमचे नाव *' : 'Your Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1">
                  {language === 'mr' ? 'मोबाइल नंबर *' : 'Phone Number *'}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98000 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">
                {language === 'mr' ? 'ईमेल (पर्यायी)' : 'Email Address (Optional)'}
              </label>
              <input
                type="email"
                placeholder="ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">
                {language === 'mr' ? 'तुमचा संदेश *' : 'Your Message *'}
              </label>
              <textarea
                required
                rows={4}
                placeholder={language === 'mr' ? 'तुमची विचारणा येथे प्रविष्ट करा...' : 'Write your inquiry or feedback here...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-extrabold text-sm py-3.5 rounded-2xl hover:scale-[1.01] transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{language === 'mr' ? 'संदेश पाठवा' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
