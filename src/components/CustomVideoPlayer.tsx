import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, RotateCcw, Maximize, 
  Sparkles, ExternalLink, Film 
} from 'lucide-react';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  type?: 'video' | 'youtube' | 'instagram' | 'image' | 'reels' | 'post' | string;
  autoPlay?: boolean;
  className?: string;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  src,
  poster,
  title = 'Dadacha Dhaba Reel',
  type = 'video',
  autoPlay = false,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isEnded, setIsEnded] = useState(false);

  // If source is a YouTube or Instagram URL, handle embed player
  const isYoutube = type === 'youtube' || src.includes('youtube.com') || src.includes('youtu.be');
  const isInstagram = type === 'instagram' || src.includes('instagram.com');

  useEffect(() => {
    if (autoPlay && videoRef.current && !isYoutube && !isInstagram) {
      videoRef.current.muted = true;
      setIsMuted(true);
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log('Autoplay blocked:', err));
    }
  }, [src, autoPlay, isYoutube, isInstagram]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (isEnded) {
        videoRef.current.currentTime = 0;
        setIsEnded(false);
      }
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log('Play error:', err));
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) {
      setVolume(0.8);
      videoRef.current.volume = 0.8;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(current);
    setDuration(dur);
    if (dur > 0) {
      setProgress((current / dur) * 100);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const targetProgress = parseFloat(e.target.value);
    const dur = videoRef.current.duration || 0;
    const targetTime = (targetProgress / 100) * dur;
    videoRef.current.currentTime = targetTime;
    setProgress(targetProgress);
    setCurrentTime(targetTime);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.log('Fullscreen error:', err));
    } else {
      document.exitFullscreen().catch((err) => console.log('Exit fullscreen error:', err));
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Helper for YouTube Embed URL
  const getYoutubeEmbedUrl = (url: string) => {
    if (url.includes('embed/')) return url;
    if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
    }
    if (url.includes('shorts/')) {
      const id = url.split('shorts/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
    }
    return url;
  };

  // YouTube Embed rendering
  if (isYoutube) {
    const embedUrl = getYoutubeEmbedUrl(src);
    return (
      <div className={`relative bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-xl ${className}`}>
        <div className="relative aspect-video w-full">
          <iframe
            src={embedUrl}
            title={title}
            loading="lazy"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // Instagram Embed rendering
  if (isInstagram) {
    const cleanInstaUrl = src.endsWith('/') ? `${src}embed` : `${src}/embed`;
    return (
      <div className={`relative bg-[#161616] rounded-2xl p-3 border border-zinc-800 shadow-xl space-y-2 ${className}`}>
        <div className="relative aspect-[9/16] max-h-[500px] w-full mx-auto overflow-hidden rounded-xl bg-black border border-zinc-800">
          <iframe
            src={cleanInstaUrl}
            title={title}
            loading="lazy"
            className="w-full h-full border-0"
            allowTransparency
          />
        </div>
        <div className="flex justify-between items-center text-xs text-zinc-400 px-2 pt-1">
          <span className="font-bold text-white line-clamp-1">{title}</span>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="text-[#F4B400] hover:underline flex items-center gap-1 font-semibold whitespace-nowrap"
          >
            <span>Open Reel</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  // Native HTML5 Video Player for uploaded MP4/WEBM
  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative group bg-black rounded-2xl overflow-hidden border border-zinc-800/90 shadow-2xl transition-all ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        onClick={togglePlay}
        playsInline
        className="w-full h-full object-contain cursor-pointer max-h-[520px] bg-black"
      />

      {/* CENTER PLAY / PAUSE OVERLAY BUTTON */}
      {(!isPlaying || showControls) && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center cursor-pointer transition-opacity duration-300"
        >
          <button
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#F4B400] text-[#111111] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-white/50"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isEnded ? (
              <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 ml-0.5" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8 sm:w-10 sm:h-10" />
            ) : (
              <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1.5 fill-current" />
            )}
          </button>
        </div>
      )}

      {/* TOP BADGE OVERLAY */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-center pointer-events-none z-10">
        <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-lg">
          <Film className="w-3.5 h-3.5 text-[#F4B400]" />
          <span className="line-clamp-1 max-w-[180px]">{title}</span>
        </div>

        {isMuted && isPlaying && (
          <button
            onClick={toggleMute}
            className="pointer-events-auto bg-amber-500/90 hover:bg-amber-500 text-black px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-lg animate-pulse"
          >
            <VolumeX className="w-3 h-3" />
            <span>Tap to Unmute</span>
          </button>
        )}
      </div>

      {/* BOTTOM CONTROL BAR OVERLAY */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 sm:p-4 space-y-2 transition-opacity duration-300 z-20 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* SEEK PROGRESS TIMELINE */}
        <div className="relative flex items-center group/seek">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-[#F4B400] hover:h-2.5 transition-all"
          />
        </div>

        {/* CONTROLS ROW */}
        <div className="flex items-center justify-between text-white text-xs gap-2 pt-1">
          {/* LEFT CONTROLS: Play/Pause, Replay, Mute, Volume */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-[#F4B400] transition-colors p-1"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isEnded ? (
                <RotateCcw className="w-4 h-4 text-[#F4B400]" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>

            {/* MUTE / UNMUTE BUTTON */}
            <button
              onClick={toggleMute}
              className="text-white hover:text-[#F4B400] transition-colors p-1"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#F4B400]" />
              )}
            </button>

            {/* VOLUME SLIDER */}
            <div className="hidden sm:flex items-center gap-1.5 w-20">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#F4B400]"
                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              />
            </div>

            {/* TIMESTAMP */}
            <span className="text-[11px] text-zinc-300 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* RIGHT CONTROLS: Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="text-zinc-300 hover:text-[#F4B400] transition-colors p-1"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
