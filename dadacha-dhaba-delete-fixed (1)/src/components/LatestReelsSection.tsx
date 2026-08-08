import React from 'react';
import { useApp } from '../context/AppContext';
import { CustomVideoPlayer } from './CustomVideoPlayer';
import { Video, Sparkles, Flame, Play, Clock, ChevronRight, Eye } from 'lucide-react';

export const LatestReelsSection: React.FC = () => {
  const { videos, latestVideosLimit, language, navigateTo } = useApp();

  // Filter ONLY published videos and sort by created_at DESC (newest uploaded first)
  const publishedVideos = videos
    .filter((v) => v.isPublished !== false)
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

  // Limit display count to admin setting (latestVideosLimit: 1-5, default 2)
  const displayLimit = Math.min(Math.max(latestVideosLimit || 2, 1), 5);
  const displayedVideos = publishedVideos.slice(0, displayLimit);

  return (
    <section className="relative w-full bg-gradient-to-b from-[#0E0E0E] via-[#141414] to-[#0E0E0E] py-8 border-y border-[#F4B400]/20 overflow-hidden">
      {/* Background Dhaba Glow Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F4B400]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
        {/* SECTION HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-[#F4B400]/10 border border-[#F4B400]/30 px-3 py-1 rounded-full text-xs font-bold text-[#F4B400]">
              <Flame className="w-3.5 h-3.5 text-red-500 animate-bounce" />
              <span className="uppercase tracking-wider">
                {language === 'mr' ? 'नवीन रिल्स आणि व्हिडिओ' : 'Latest Reels & Cookware Videos'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white font-marathi tracking-tight">
              {language === 'mr' ? 'अस्सल कोल्हापुरी चव — व्हिडिओ कट्टा' : 'Authentic Taste in Action — Latest Reels'}
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              {language === 'mr'
                ? 'मातीचे भांडे, तांब्याची भांडी आणि लोखंडी कढईत बनवलेल्या अस्सल पाककृतींचे ताजे व्हिडिओ.'
                : 'Watch step-by-step Maharashtrian recipes cooked in iron kadais and brass cookware directly from our kitchen.'}
            </p>
          </div>

          {publishedVideos.length > 0 && (
            <button
              onClick={() => navigateTo('videos')}
              className="inline-flex items-center gap-2 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-[#F4B400] font-bold text-xs px-4 py-2.5 rounded-xl border border-[#F4B400]/30 hover:border-[#F4B400] transition-all self-start sm:self-auto"
            >
              <span>{language === 'mr' ? 'सर्व व्हिडिओ पहा' : 'View All Reels'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* EMPTY STATE — NO PUBLISHED VIDEOS */}
        {displayedVideos.length === 0 ? (
          <div className="bg-[#161616]/90 border border-zinc-800/80 rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-2xl my-4 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#F4B400]/10 border border-[#F4B400]/30 text-[#F4B400] flex items-center justify-center mx-auto shadow-inner">
              <Video className="w-8 h-8 opacity-70" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-lg font-marathi">
                {language === 'mr' ? 'अद्याप कोणतेही रिल्स उपलब्ध नाहीत' : 'No Reels Available Yet'}
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                {language === 'mr'
                  ? 'आमचे मालक नवीन रेसिपी आणि स्पेशल व्हिडिओ लवकरच अपलोड करत आहेत. कृपया थोड्या वेळाने पुन्हा तपासा!'
                  : 'Admin is cooking up fresh recipes and behind-the-scenes reels. Once published, they will automatically appear here in real time.'}
              </p>
            </div>
          </div>
        ) : (
          /* VIDEO GRID — DYNAMICALLY DISPLAYING 1 TO 5 LATEST VIDEOS */
          <div
            className={`grid gap-6 ${
              displayLimit === 1
                ? 'grid-cols-1 max-w-3xl mx-auto'
                : displayLimit === 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto'
                : displayLimit === 3
                ? 'grid-cols-1 md:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {displayedVideos.map((video, idx) => (
              <div
                key={video.id}
                className="bg-[#161616] border border-zinc-800 rounded-3xl p-4 space-y-3 hover:border-[#F4B400]/50 transition-all shadow-xl group flex flex-col justify-between"
              >
                {/* VIDEO CONTAINER */}
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800">
                    <CustomVideoPlayer
                      src={video.originalUrl}
                      poster={video.thumbnailUrl}
                      title={language === 'mr' ? video.titleMr : video.titleEn}
                      type={video.type}
                      autoPlay={idx === 0} // Autoplay first video muted
                    />

                    {/* NEWEST BADGE FOR LATEST VIDEO */}
                    {idx === 0 && (
                      <span className="absolute top-3 left-3 bg-[#F4B400] text-[#111111] font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{language === 'mr' ? 'ताजे रील' : 'NEWEST REEL'}</span>
                      </span>
                    )}
                  </div>

                  {/* VIDEO TITLE & CAPTION */}
                  <div className="space-y-1">
                    <h3 className={`font-extrabold text-white text-base line-clamp-2 ${language === 'mr' ? 'font-marathi' : ''}`}>
                      {language === 'mr' ? video.titleMr : video.titleEn}
                    </h3>
                    {(video.descriptionMr || video.descriptionEn) && (
                      <p className={`text-xs text-zinc-400 line-clamp-2 ${language === 'mr' ? 'font-marathi' : ''}`}>
                        {language === 'mr' ? video.descriptionMr || video.descriptionEn : video.descriptionEn || video.descriptionMr}
                      </p>
                    )}
                  </div>
                </div>

                {/* CARD FOOTER INFO */}
                <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/80">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Clock className="w-3 h-3 text-[#F4B400]" />
                    <span>{video.date}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 bg-[#222] px-2.5 py-0.5 rounded-full text-zinc-300 font-medium">
                    <Eye className="w-3 h-3 text-[#F4B400]" />
                    <span>{video.views || '1.2k'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
