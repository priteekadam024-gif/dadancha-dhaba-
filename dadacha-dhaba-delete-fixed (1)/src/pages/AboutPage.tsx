import React from 'react';
import { useApp } from '../context/AppContext';
import { DhabaLogo } from '../components/DhabaLogo';
import { Flame, ShieldCheck, Heart, Sparkles, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { language } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#1C1400] via-[#2A1E00] to-[#121212] p-8 sm:p-12 rounded-3xl border border-[#F4B400]/40 text-center space-y-4 shadow-2xl">
        <DhabaLogo size="hero" className="mx-auto" />
        <h1 className="text-3xl sm:text-5xl font-black text-white font-marathi leading-tight">
          {language === 'mr' ? 'दादाचा ढाबा - परंपरा, स्वाद आणि भरपूर प्रेम ❤️' : 'The Legacy of Dadacha Dhaba'}
        </h1>
        <p className="text-sm text-zinc-300 max-w-2xl mx-auto font-marathi leading-relaxed">
          {language === 'mr' 
            ? '१९९५ पासून महाराष्ट्राच्या कानाकोपऱ्यात गावरान चवीची ओळख निर्माण करणारे ‘दादाचा ढाबा’ आज खवय्यांसाठी घरपोच अस्सल मसाले व कलईची पितळी भांडी घेऊन आले आहे.' 
            : 'Since 1995, Dadacha Dhaba has been preserving the soul of heirloom Maharashtrian cooking. Our hand-roasted iron-kadai spices and food-safe tin-coated brassware bring traditional flavors straight to your kitchen.'}
        </p>
      </div>

      {/* Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 bg-[#F4B400]/10 text-[#F4B400] rounded-2xl flex items-center justify-center border border-[#F4B400]/30">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-marathi">
            {language === 'mr' ? 'चुलीवर भाजलेले मसाले' : 'Iron Kadai Hand-Roasted'}
          </h3>
          <p className="text-xs text-zinc-400 font-marathi leading-relaxed">
            {language === 'mr' 
              ? 'कोणत्याही केमिकल किंवा कृत्रिम रंगाशिवाय, पारंपरिक पद्धतीने लाकडाच्या शेगांवर लोखंडी कढईत मंद आचेवर भाजलेले कांदा लसूण मसाले.' 
              : 'Our spices are roasted slowly over woodfire and ground to preserve natural essential oils and rich aroma.'}
          </p>
        </div>

        <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 bg-[#F4B400]/10 text-[#F4B400] rounded-2xl flex items-center justify-center border border-[#F4B400]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-marathi">
            {language === 'mr' ? '१००% अस्सल व शुद्ध कलई' : 'Food Safe Kalai Brassware'}
          </h3>
          <p className="text-xs text-zinc-400 font-marathi leading-relaxed">
            {language === 'mr' 
              ? 'आमची पितळी भांडी (Brass Handi) शुद्ध कथिलाची (Tin) कलई लावून बनवली जातात, ज्यामुळे जेवण अत्यंत चविष्ट व आरोग्यदायी बनते.' 
              : 'Handcrafted by hereditary coppersmiths using food-grade tin lining for healthy, mineral-rich authentic cooking.'}
          </p>
        </div>

        <div className="bg-[#161616] border border-zinc-800 p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 bg-[#F4B400]/10 text-[#F4B400] rounded-2xl flex items-center justify-center border border-[#F4B400]/30">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white font-marathi">
            {language === 'mr' ? 'लाखो खवय्यांचे प्रेम' : 'Trusted by 50,000+ Homes'}
          </h3>
          <p className="text-xs text-zinc-400 font-marathi leading-relaxed">
            {language === 'mr' 
              ? 'पुणे, कोल्हापूर, मुंबई ते अगदी परदेशातील अमराठी खवय्यांच्या घरापर्यंत आमचा मसाला पोहोचला आहे.' 
              : 'Shipped to homes across India and internationally with 100% satisfaction guarantee.'}
          </p>
        </div>
      </div>
    </div>
  );
};
