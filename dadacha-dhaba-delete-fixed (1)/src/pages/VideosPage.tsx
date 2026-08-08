import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomVideoPlayer } from '../components/CustomVideoPlayer';
import { Play, Instagram, Youtube, Filter, Eye, ExternalLink, X } from 'lucide-react';

export const VideosPage: React.FC = () => {
  const { language, videos } = useApp();
  const [filter, setFilter] = useState<'all' | 'instagram' | 'youtube' | 'recipes' | 'popular'>('all');
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  const filteredVideos = videos.filter((v) => {
    if (filter === 'all') return true;
    if (filter === 'instagram') return v.type === 'instagram';
    if (filter === 'youtube') return v.type === 'youtube';
    if (filter === 'recipes') return v.category === 'recipes';
    if (filter === 'popular') return v.isPopular;
    return true;
  });

  const selectedVideoObj = videos.find((v) => v.id === activeVideoModal);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title Header */}
      <div className="bg-gradient-to-r from-[#1A1600] via-[#261B00] to-[#121212] p-8 rounded-3xl border border-[#F4B400]/30 text-center space-y-3 shadow-xl">
        <span className="text-xs font-bold text-[#F4B400] bg-[#F4B400]/10 px-3.5 py-1 rounded-full uppercase">
          🎬 {language === 'mr' ? 'दादांचे व्हिडिओ दालन' : 'Dadacha Dhaba Video Hub'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-marathi">
          {language === 'mr' ? 'इंस्टाग्राम रिल्स व यूट्यूब पाककृती' : 'Instagram Reels & YouTube Recipe Channel'}
        </h1>
        <p className="text-xs text-zinc-300 max-w-xl mx-auto font-marathi">
          {language === 'mr' 
            ? 'मसाले भाजण्याची पारंपारिक पद्धत, काळ्या रश्शाचे गुपित आणि कलाकारी व्हिडिओ थेट वेबसाईटवर पहा.' 
            : 'Watch spice roasting, heirloom Maharashtrian recipes, and dhaba kitchen secrets directly inside the site.'}
        </p>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'all' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {language === 'mr' ? 'सर्व व्हिडिओ' : 'All Videos'} ({videos.length})
          </button>
          <button
            onClick={() => setFilter('instagram')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'instagram' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram Reels</span>
          </button>
          <button
            onClick={() => setFilter('youtube')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'youtube' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube Videos</span>
          </button>
          <button
            onClick={() => setFilter('recipes')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'recipes' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            🍳 {language === 'mr' ? 'पाककृती (Recipes)' : 'Recipes'}
          </button>
          <button
            onClick={() => setFilter('popular')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === 'popular' ? 'bg-[#F4B400] text-[#111111]' : 'bg-[#222222] text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            🔥 {language === 'mr' ? 'लोकप्रिय (Popular)' : 'Trending'}
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredVideos.map((vid) => (
          <div
            key={vid.id}
            onClick={() => setActiveVideoModal(vid.id)}
            className="group bg-[#161616] border border-zinc-800 hover:border-[#F4B400] rounded-2xl overflow-hidden cursor-pointer shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="relative aspect-[9/16] bg-black overflow-hidden">
              <img
                src={vid.thumbnailUrl}
                alt={vid.titleEn}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-14 h-14 bg-[#F4B400] text-[#111111] rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-[#111111] ml-1" />
                </div>
              </div>

              {/* Platform Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white">
                {vid.type === 'instagram' ? <Instagram className="w-3 h-3 text-pink-400" /> : <Youtube className="w-3 h-3 text-red-500" />}
                <span className="uppercase">{vid.type}</span>
              </div>

              {vid.views && (
                <span className="absolute bottom-3 right-3 bg-[#111111]/80 text-[#F4B400] text-[10px] font-bold px-2 py-0.5 rounded">
                  👁️ {vid.views}
                </span>
              )}
            </div>

            <div className="p-4 space-y-2">
              <h3 className="font-bold text-white text-sm line-clamp-2 font-marathi group-hover:text-[#F4B400] transition-colors">
                {language === 'mr' ? vid.titleMr : vid.titleEn}
              </h3>
              <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                <span>{vid.date}</span>
                <span className="text-[#F4B400] font-semibold flex items-center gap-0.5">
                  Play Video <Play className="w-2.5 h-2.5 fill-[#F4B400]" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Embedded Video Player Modal */}
      {selectedVideoObj && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#F4B400]/40 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 p-4">
            <div className="flex justify-between items-center text-white pb-2 border-b border-zinc-800">
              <h3 className="font-bold text-sm font-marathi">
                {language === 'mr' ? selectedVideoObj.titleMr : selectedVideoObj.titleEn}
              </h3>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="relative bg-black rounded-2xl overflow-hidden border border-zinc-800">
              <CustomVideoPlayer
                src={selectedVideoObj.originalUrl}
                poster={selectedVideoObj.thumbnailUrl}
                title={language === 'mr' ? selectedVideoObj.titleMr : selectedVideoObj.titleEn}
                type={selectedVideoObj.type}
                autoPlay={true}
              />
            </div>

            <div className="flex justify-between items-center pt-2 text-xs">
              <span className="text-zinc-400">
                Category: <strong className="text-white capitalize">{selectedVideoObj.category}</strong>
              </span>
              <a
                href={selectedVideoObj.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-[#222222] hover:bg-[#F4B400] hover:text-[#111111] text-white font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-1.5"
              >
                <span>{language === 'mr' ? 'मूळ अॅपवर पहा' : 'Open in App'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
