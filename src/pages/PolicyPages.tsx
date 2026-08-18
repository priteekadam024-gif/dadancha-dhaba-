import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, FileText, Truck, RotateCcw } from 'lucide-react';

interface PolicyProps {
  type: 'privacy' | 'terms' | 'shipping' | 'returns' | 'faqs';
}

export const PolicyPages: React.FC<PolicyProps> = ({ type }) => {
  const { language } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {type === 'privacy' && (
        <div className={`bg-[#141414] border border-zinc-800 p-8 rounded-3xl space-y-6 text-zinc-300 text-xs leading-relaxed ${language === 'mr' ? 'font-marathi' : ''}`}>
          <div className="flex items-center gap-3 text-[#F4B400] border-b border-zinc-800 pb-4">
            <ShieldCheck className="w-8 h-8" />
            <h1 className="text-2xl font-black text-white">
              {language === 'mr' ? 'गोपनीयता धोरण' : 'Privacy Policy'}
            </h1>
          </div>
          <p>
            {language === 'mr'
              ? 'दादाचा ढाबा (Dadacha Dhaba) तुमच्या वैयक्तिक माहितीच्या सुरक्षिततेला सर्वोच्च प्राधान्य देते.'
              : 'Dadacha Dhaba treats the privacy and security of your personal data as our utmost priority.'}
          </p>
          <h3 className="text-sm font-bold text-white">
            {language === 'mr' ? '१. गोळा केलेली माहिती' : '1. Information We Collect'}
          </h3>
          <p>
            {language === 'mr'
              ? 'आम्ही तुमची ऑर्डर डिलिव्हरी करण्यासाठी तुमचे नाव, पत्ता, फोन नंबर आणि ईमेल गोळा करतो. आम्ही क्रेडिट/डेबिट कार्डचा गुप्त पिन कधीही सेव्ह करत नाही.'
              : 'We collect your name, shipping address, contact phone number, and email address strictly to process and deliver your orders. We never store credit or debit card CVV/PIN credentials.'}
          </p>
          <h3 className="text-sm font-bold text-white">
            {language === 'mr' ? '२. डेटा सुरक्षितता' : '2. Data Protection & Encryption'}
          </h3>
          <p>
            {language === 'mr'
              ? 'तुमचा डेटा २५६-बिट एनक्रिप्शनद्वारे पूर्णपणे सुरक्षित ठेवला जातो.'
              : 'Your transaction records and personal credentials are encrypted using bank-grade 256-bit SSL protocols.'}
          </p>
        </div>
      )}

      {type === 'terms' && (
        <div className={`bg-[#141414] border border-zinc-800 p-8 rounded-3xl space-y-6 text-zinc-300 text-xs leading-relaxed ${language === 'mr' ? 'font-marathi' : ''}`}>
          <div className="flex items-center gap-3 text-[#F4B400] border-b border-zinc-800 pb-4">
            <FileText className="w-8 h-8" />
            <h1 className="text-2xl font-black text-white">
              {language === 'mr' ? 'नियम व अटी' : 'Terms of Service'}
            </h1>
          </div>
          <p>
            {language === 'mr'
              ? 'दादाचा ढाबा वेबसाईट वापरताना खालील नियमांचे पालन करणे आवश्यक आहे.'
              : 'By using the Dadacha Dhaba website and placing orders, you agree to comply with our commercial terms.'}
          </p>
          <h3 className="text-sm font-bold text-white">
            {language === 'mr' ? '१. उत्पादनांची माहिती' : '1. Product Authenticity & Quality'}
          </h3>
          <p>
            {language === 'mr'
              ? 'सर्व मसाले व पितळी भांडी १००% अस्सल आणि गुणवत्ता तपासणी करून पाठवली जातात.'
              : 'All spice formulations, chutneys, and tin-coated brass cookware are 100% authentic, hand-inspected, and hygienically sealed prior to dispatch.'}
          </p>
        </div>
      )}

      {type === 'shipping' && (
        <div className={`bg-[#141414] border border-zinc-800 p-8 rounded-3xl space-y-6 text-zinc-300 text-xs leading-relaxed ${language === 'mr' ? 'font-marathi' : ''}`}>
          <div className="flex items-center gap-3 text-[#F4B400] border-b border-zinc-800 pb-4">
            <Truck className="w-8 h-8" />
            <h1 className="text-2xl font-black text-white">
              {language === 'mr' ? 'शिपिंग व डिलिव्हरी धोरण' : 'Shipping & Delivery Policy'}
            </h1>
          </div>
          <p>
            • <strong>{language === 'mr' ? 'डिलिव्हरी कालावधी:' : 'Delivery Timeframe:'}</strong>{' '}
            {language === 'mr'
              ? 'ऑर्डर दिल्यापासून २ ते ४ कार्यदिवसांत पार्सल तुमच्या घरी पोहोचते.'
              : 'Orders are dispatched within 24 hours and delivered across India in 2 to 4 business days.'}
          </p>
          <p>
            • <strong>{language === 'mr' ? 'मोफत शिपिंग:' : 'Free Shipping:'}</strong>{' '}
            {language === 'mr'
              ? '₹४९९ पेक्षा जास्त खरेदीवर संपूर्ण भारतात मोफत डिलिव्हरी उपलब्ध आहे.'
              : 'Enjoy complimentary express shipping across India on all orders above ₹499.'}
          </p>
        </div>
      )}

      {type === 'returns' && (
        <div className={`bg-[#141414] border border-zinc-800 p-8 rounded-3xl space-y-6 text-zinc-300 text-xs leading-relaxed ${language === 'mr' ? 'font-marathi' : ''}`}>
          <div className="flex items-center gap-3 text-[#F4B400] border-b border-zinc-800 pb-4">
            <RotateCcw className="w-8 h-8" />
            <h1 className="text-2xl font-black text-white">
              {language === 'mr' ? 'परतावा व रद्द धोरण' : 'Cancellation & Refund Policy'}
            </h1>
          </div>
          <p>
            •{' '}
            {language === 'mr'
              ? 'जर पार्सल किंवा भांडी डॅमेज स्थितीत मिळाली तर ७ दिवसांच्या आत रिप्लेसमेंट दिली जाईल.'
              : 'If you receive damaged goods or tampered packaging, we provide hassle-free replacements within 7 days.'}
          </p>
          <p>
            •{' '}
            {language === 'mr'
              ? 'पार्सल उघडतानाचा छोटा व्हिडिओ असल्यास रिप्लेसमेंट तात्काळ मंजूर केली जाते.'
              : 'Providing an unboxing video clip accelerates instant replacement approval from our customer desk.'}
          </p>
        </div>
      )}

      {type === 'faqs' && (
        <div className={`bg-[#141414] border border-zinc-800 p-8 rounded-3xl space-y-6 text-zinc-300 text-xs leading-relaxed ${language === 'mr' ? 'font-marathi' : ''}`}>
          <div className="flex items-center gap-3 text-[#F4B400] border-b border-zinc-800 pb-4">
            <FileText className="w-8 h-8" />
            <h1 className="text-2xl font-black text-white">
              {language === 'mr' ? 'सतत विचारले जाणारे प्रश्न (FAQs)' : 'Frequently Asked Questions'}
            </h1>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                {language === 'mr' ? 'प्र. मसाल्यांची टिकण्याची मुदत किती असते?' : 'Q. What is the shelf life of the spices?'}
              </h3>
              <p className="text-zinc-400">
                {language === 'mr' ? 'उत्तर: दादाचा ढाबा मसाले ६ महिन्यांपर्यंत ताजे आणि सुगंधी राहतात.' : 'Ans: Dadacha Dhaba spices remain fresh and aromatic for up to 6 months in airtight storage.'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                {language === 'mr' ? 'प्र. डिलिव्हरी किती दिवसांत मिळते?' : 'Q. How long does delivery take?'}
              </h3>
              <p className="text-zinc-400">
                {language === 'mr' ? 'उत्तर: संपूर्ण महाराष्ट्रात ३ ते ५ दिवसांत पार्सल पोहोचते.' : 'Ans: Delivery typically arrives within 3-5 business days across India.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
