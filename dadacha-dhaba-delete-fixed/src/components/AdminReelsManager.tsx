import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { VideoItem } from '../types';
import { 
  UploadCloud, Film, Image as ImageIcon, Plus, Trash2, Edit3, Eye, 
  CheckCircle2, AlertCircle, RefreshCw, Sparkles, Sliders, Check, 
  Play, Volume2, ExternalLink, X, FileText, Globe, ShieldCheck, Lock
} from 'lucide-react';

export const AdminReelsManager: React.FC = () => {
  const { 
    isAdminLoggedIn, videos, latestVideosLimit, updateLatestVideosLimit, 
    addVideoRecord, toggleVideoPublished, updateVideoRecord, deleteVideoRecord, 
    showToast, navigateTo 
  } = useApp();

  // Mode: 'upload_file' vs 'external_link'
  const [uploadMode, setUploadMode] = useState<'upload_file' | 'external_link'>('upload_file');

  // File Upload Staging State
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileTitleEn, setFileTitleEn] = useState('');
  const [fileTitleMr, setFileTitleMr] = useState('');
  const [fileDescEn, setFileDescEn] = useState('');
  const [fileDescMr, setFileDescMr] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // External Link Form State
  const [extUrl, setExtUrl] = useState('');
  const [extTitleEn, setExtTitleEn] = useState('');
  const [extTitleMr, setExtTitleMr] = useState('');
  const [extDescEn, setExtDescEn] = useState('');
  const [extType, setExtType] = useState<'instagram' | 'youtube'>('instagram');

  // Edit Modal State
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editTitleMr, setEditTitleMr] = useState('');
  const [editDescEn, setEditDescEn] = useState('');
  const [editDescMr, setEditDescMr] = useState('');
  const [editIsPublished, setEditIsPublished] = useState(true);

  // Delete Confirmation ID
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Guard: Check Admin Session
  if (!isAdminLoggedIn) {
    return (
      <div className="bg-[#161616] border border-rose-800/80 rounded-3xl p-8 max-w-lg mx-auto text-center space-y-6 shadow-2xl my-12">
        <div className="w-16 h-16 bg-rose-950 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-800">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white font-marathi">प्रवेश नाकारला (Admin Access Only)</h2>
          <p className="text-xs text-zinc-400">
            Reels & Posts management is restricted strictly to administrators. Please login via Admin Secret Portal.
          </p>
        </div>
        <button
          onClick={() => navigateTo('admin-login')}
          className="bg-[#F4B400] hover:bg-[#FF8C00] text-[#111111] font-black text-xs px-6 py-3 rounded-xl shadow-lg transition-transform hover:scale-105"
        >
          Go to Admin Secret Login
        </button>
      </div>
    );
  }

  // Handle Drag & Drop Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      showToast('Please select a valid Video (MP4, WEBM, MOV) or Image file.', 'error');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreviewUrl(objectUrl);

    // Auto-fill title from filename if empty
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const cleanName = nameWithoutExt.replace(/[_-]/g, ' ');
    if (!fileTitleEn) setFileTitleEn(cleanName);
    if (!fileTitleMr) setFileTitleMr(cleanName);
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit File Upload to Supabase Storage & Database
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select or drag a video file to upload.', 'error');
      return;
    }

    if (!fileTitleEn) {
      showToast('Please enter a title for the video.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const isVid = selectedFile.type.startsWith('video/');
      const success = await addVideoRecord({
        titleEn: fileTitleEn,
        titleMr: fileTitleMr || fileTitleEn,
        descriptionEn: fileDescEn,
        descriptionMr: fileDescMr || fileDescEn,
        type: isVid ? 'video' : 'image',
        category: 'reels',
        isPublished: isPublished,
        file: selectedFile,
      });

      if (success) {
        handleRemoveSelectedFile();
        setFileTitleEn('');
        setFileTitleMr('');
        setFileDescEn('');
        setFileDescMr('');
      }
    } catch (err: any) {
      showToast(`Upload failed: ${err.message || 'Error uploading file'}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit External Reel Link
  const handleExternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extUrl) {
      showToast('Please enter the Instagram Reel or YouTube Video URL.', 'error');
      return;
    }

    if (!extTitleEn) {
      showToast('Please enter a video title.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const success = await addVideoRecord({
        titleEn: extTitleEn,
        titleMr: extTitleMr || extTitleEn,
        descriptionEn: extDescEn,
        descriptionMr: extDescEn,
        type: extType,
        originalUrl: extUrl,
        embedUrl: extUrl,
        thumbnailUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800',
        category: 'reels',
        isPublished: true,
      });

      if (success) {
        setExtUrl('');
        setExtTitleEn('');
        setExtTitleMr('');
        setExtDescEn('');
      }
    } catch (err) {
      showToast('Error saving reel link', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (video: VideoItem) => {
    setEditingVideo(video);
    setEditTitleEn(video.titleEn);
    setEditTitleMr(video.titleMr);
    setEditDescEn(video.descriptionEn || '');
    setEditDescMr(video.descriptionMr || '');
    setEditIsPublished(video.isPublished !== false);
  };

  // Save Edit Changes to Supabase
  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    await updateVideoRecord(editingVideo.id, {
      titleEn: editTitleEn,
      titleMr: editTitleMr,
      descriptionEn: editDescEn,
      descriptionMr: editDescMr,
      isPublished: editIsPublished,
    });
    setEditingVideo(null);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    await deleteVideoRecord(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-8">
      {/* HEADER BAR */}
      <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#F4B400]/10 border border-[#F4B400]/30 px-3 py-1 rounded-full text-xs font-bold text-[#F4B400] mb-2">
              <Film className="w-3.5 h-3.5" />
              <span>SUPABASE MEDIA & REELS ENGINE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-marathi">
              रिल्स आणि व्हिडिओ व्यवस्थापन (Reels & Posts Manager)
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Drag and drop media files from your computer to store them permanently in Supabase Storage and database.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#1A1A1A] p-2 rounded-2xl border border-zinc-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-zinc-300">Admin Security Active</span>
          </div>
        </div>

        {/* SETTING: LATEST VIDEOS TO DISPLAY ON HOMEPAGE */}
        <div className="bg-[#0E0E0E] border border-[#F4B400]/30 p-5 rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2 font-marathi">
                <Sliders className="w-4 h-4 text-[#F4B400]" />
                <span>मुख्यपृष्ठावर दाखवण्याची व्हिडिओ संख्या (Latest Videos to Display)</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Choose how many latest published videos appear below the homepage header. Saved permanently in Supabase.
              </p>
            </div>

            {/* OPTIONS: 1, 2, 3, 4, 5 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-bold mr-1">Count:</span>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => updateLatestVideosLimit(num)}
                  className={`w-9 h-9 rounded-xl font-black text-sm transition-all flex items-center justify-center border ${
                    latestVideosLimit === num
                      ? 'bg-[#F4B400] text-[#111111] border-[#F4B400] shadow-lg scale-105'
                      : 'bg-[#1C1C1C] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* UPLOADER CARD: DRAG AND DROP & FORM */}
      <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* TAB TOGGLE: File Upload vs External Reel Link */}
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setUploadMode('upload_file')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              uploadMode === 'upload_file'
                ? 'bg-[#F4B400] text-[#111111] shadow-lg'
                : 'bg-[#222222] text-zinc-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Drag & Drop File Upload</span>
          </button>

          <button
            onClick={() => setUploadMode('external_link')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              uploadMode === 'external_link'
                ? 'bg-[#F4B400] text-[#111111] shadow-lg'
                : 'bg-[#222222] text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Instagram / YouTube Reel Link</span>
          </button>
        </div>

        {/* MODE 1: FILE UPLOAD ZONE */}
        {uploadMode === 'upload_file' && (
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center space-y-4 cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#F4B400] bg-[#F4B400]/10 scale-[1.01]'
                    : 'border-zinc-700 bg-[#111111]/80 hover:border-[#F4B400]/60 hover:bg-[#1A1A1A]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-[#F4B400]/10 text-[#F4B400] flex items-center justify-center mx-auto border border-[#F4B400]/30 shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <p className="text-white font-extrabold text-base">
                    Drag and drop your Video or Image here
                  </p>
                  <p className="text-xs text-zinc-400">
                    Supports MP4, WEBM, MOV, JPG, PNG, WEBP (Direct upload to Supabase Storage)
                  </p>
                </div>

                <button
                  type="button"
                  className="bg-[#2A2A2A] hover:bg-[#333333] text-[#F4B400] border border-[#F4B400]/40 font-bold text-xs px-6 py-2.5 rounded-xl transition-all"
                >
                  Browse Device Files
                </button>
              </div>
            ) : (
              /* FILE STAGED PREVIEW BOX */
              <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {selectedFile.type.startsWith('video/') ? (
                    <video src={filePreviewUrl!} className="w-20 h-20 object-cover rounded-xl bg-black border border-zinc-800" />
                  ) : (
                    <img src={filePreviewUrl!} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-zinc-800" />
                  )}

                  <div className="space-y-1 overflow-hidden">
                    <p className="text-white font-bold text-sm truncate">{selectedFile.name}</p>
                    <p className="text-xs text-zinc-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                    </p>
                    <span className="inline-block bg-emerald-950 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-800">
                      Ready for Supabase Storage
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveSelectedFile}
                  className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs px-3 py-2 rounded-xl border border-rose-800 flex items-center gap-1.5 self-end sm:self-center"
                >
                  <X className="w-4 h-4" />
                  <span>Remove File</span>
                </button>
              </div>
            )}

            {/* METADATA FORM INPUTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">Title (English) *</label>
                <input
                  type="text"
                  value={fileTitleEn}
                  onChange={(e) => setFileTitleEn(e.target.value)}
                  placeholder="e.g. Heirloom Kala Masala Making Process"
                  className="w-full bg-[#111111] border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#F4B400] outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 font-marathi">शीर्षक (मराठी) *</label>
                <input
                  type="text"
                  value={fileTitleMr}
                  onChange={(e) => setFileTitleMr(e.target.value)}
                  placeholder="उदा. कोल्हापुरी कांदा लसूण मसाला कसा बनवावा"
                  className="w-full bg-[#111111] border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#F4B400] outline-none font-marathi"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">Caption / Description (English)</label>
                <textarea
                  value={fileDescEn}
                  onChange={(e) => setFileDescEn(e.target.value)}
                  placeholder="Short description or ingredients highlighted in this video..."
                  rows={2}
                  className="w-full bg-[#111111] border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#F4B400] outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 font-marathi">वर्णन (मराठी)</label>
                <textarea
                  value={fileDescMr}
                  onChange={(e) => setFileDescMr(e.target.value)}
                  placeholder="या व्हिडिओमध्ये दाखवलेल्या पदार्थाची थोडक्यात माहिती..."
                  rows={2}
                  className="w-full bg-[#111111] border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#F4B400] outline-none font-marathi"
                />
              </div>
            </div>

            {/* PUBLISH TOGGLE & SUBMIT BUTTON */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-zinc-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-5 h-5 accent-[#F4B400] rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Publish immediately on website</span>
                  <span className="text-[11px] text-zinc-400">If unchecked, video will stay as Draft in admin panel</span>
                </div>
              </label>

              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="w-full sm:w-auto bg-[#F4B400] hover:bg-[#FF8C00] text-[#111111] font-extrabold text-sm px-8 py-3.5 rounded-xl shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading to Supabase...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Save to Supabase</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: EXTERNAL REEL LINK FORM */}
        {uploadMode === 'external_link' && (
          <form onSubmit={handleExternalSubmit} className="space-y-4 max-w-2xl">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                <input
                  type="radio"
                  name="extType"
                  checked={extType === 'instagram'}
                  onChange={() => setExtType('instagram')}
                  className="accent-[#F4B400]"
                />
                <span>Instagram Reel Link</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                <input
                  type="radio"
                  name="extType"
                  checked={extType === 'youtube'}
                  onChange={() => setExtType('youtube')}
                  className="accent-[#F4B400]"
                />
                <span>YouTube Short / Video Link</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Reel / Video URL *</label>
              <input
                type="url"
                value={extUrl}
                onChange={(e) => setExtUrl(e.target.value)}
                placeholder={extType === 'instagram' ? 'https://www.instagram.com/reel/C3x9.../' : 'https://www.youtube.com/watch?v=...'}
                className="w-full bg-[#111111] border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#F4B400] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">Title (English) *</label>
                <input
                  type="text"
                  value={extTitleEn}
                  onChange={(e) => setExtTitleEn(e.target.value)}
                  placeholder="e.g. Solapuri Chutney Recipe"
                  className="w-full bg-[#111111] border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#F4B400] outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 font-marathi">शीर्षक (मराठी) *</label>
                <input
                  type="text"
                  value={extTitleMr}
                  onChange={(e) => setExtTitleMr(e.target.value)}
                  placeholder="उदा. सोलापुरी शेंगदाणा चटणी"
                  className="w-full bg-[#111111] border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-[#F4B400] outline-none font-marathi"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="bg-[#F4B400] hover:bg-[#FF8C00] text-[#111111] font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow"
            >
              {isUploading ? 'Saving...' : 'Save Reel Link'}
            </button>
          </form>
        )}
      </div>

      {/* ALL UPLOADED MEDIA MANAGEMENT LIST */}
      <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div>
            <h3 className="font-extrabold text-white text-lg font-marathi">
              सर्व अपलोड केलेले रिल्स आणि व्हिडिओ ({videos.length})
            </h3>
            <p className="text-xs text-zinc-400">
              Manage publication status, edit details, or permanently delete media from Supabase.
            </p>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-12 text-center space-y-2">
            <Film className="w-12 h-12 mx-auto text-zinc-600 opacity-40" />
            <p className="text-white font-bold text-base">No media uploaded yet</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Use the drag and drop box above to upload your first reel or recipe video into Supabase Storage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.map((vid) => (
              <div
                key={vid.id}
                className="bg-[#111111] border border-zinc-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-zinc-700 transition-all"
              >
                <div className="space-y-3">
                  {/* MEDIA PREVIEW */}
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800">
                    {vid.type === 'video' || vid.type === 'reels' ? (
                      <video src={vid.originalUrl} className="w-full h-full object-cover" />
                    ) : vid.type === 'image' ? (
                      <img src={vid.originalUrl} alt={vid.titleEn} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500 text-xs font-mono">
                        {vid.type.toUpperCase()} EMBED
                      </div>
                    )}

                    {/* PUBLISHED / DRAFT BADGE */}
                    <span
                      className={`absolute top-2 right-2 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-md ${
                        vid.isPublished !== false
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-amber-950 text-amber-400 border-amber-800'
                      }`}
                    >
                      {vid.isPublished !== false ? '🟢 Published' : '🟡 Draft'}
                    </span>
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm font-marathi line-clamp-1">{vid.titleMr}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-1">{vid.titleEn}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Uploaded: {vid.date}</p>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800/80">
                  {/* PUBLISH / UNPUBLISH TOGGLE */}
                  <button
                    onClick={() => toggleVideoPublished(vid.id, vid.isPublished === false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      vid.isPublished !== false
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                    }`}
                  >
                    {vid.isPublished !== false ? 'Unpublish' : 'Publish'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* EDIT BUTTON */}
                    <button
                      onClick={() => openEditModal(vid)}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                      title="Edit Metadata"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => setDeleteId(vid.id)}
                      className="p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg transition-colors border border-rose-800"
                      title="Delete from Supabase"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-white text-lg">Edit Reel Metadata</h3>
              <button onClick={() => setEditingVideo(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Title (English)</label>
                <input
                  type="text"
                  value={editTitleEn}
                  onChange={(e) => setEditTitleEn(e.target.value)}
                  className="w-full bg-[#111111] border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 font-marathi">शीर्षक (मराठी)</label>
                <input
                  type="text"
                  value={editTitleMr}
                  onChange={(e) => setEditTitleMr(e.target.value)}
                  className="w-full bg-[#111111] border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm font-marathi"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Caption (English)</label>
                <textarea
                  value={editDescEn}
                  onChange={(e) => setEditDescEn(e.target.value)}
                  rows={2}
                  className="w-full bg-[#111111] border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={editIsPublished}
                  onChange={(e) => setEditIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-[#F4B400]"
                />
                <span className="text-xs font-bold text-white">Published on Website</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
              <button
                onClick={() => setEditingVideo(null)}
                className="bg-[#222] hover:bg-[#333] text-zinc-300 text-xs px-5 py-2.5 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-[#F4B400] hover:bg-[#FF8C00] text-[#111111] text-xs px-6 py-2.5 rounded-xl font-extrabold shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-rose-800/80 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-rose-950 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-800">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-lg">Confirm Delete</h3>
              <p className="text-xs text-zinc-400">
                Are you sure you want to permanently delete this media file from Supabase Storage and database? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="bg-[#222] hover:bg-[#333] text-zinc-300 text-xs px-5 py-2.5 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-6 py-2.5 rounded-xl font-extrabold shadow"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
