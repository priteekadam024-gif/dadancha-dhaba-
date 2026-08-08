import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  supabaseGetMediaFiles,
  supabaseSaveMediaRecord,
  supabaseUploadMediaStorageAsset,
  MediaFileRecord
} from '../lib/supabase';
import { 
  UploadCloud, Image as ImageIcon, Video, Instagram, Youtube, 
  Trash2, Eye, Search, Filter, CheckCircle2, AlertCircle, 
  RefreshCw, Plus, Sparkles, Layers, FileText, Check, ExternalLink, Play
} from 'lucide-react';

export const AdminMediaManager: React.FC = () => {
  const { 
    isAdminLoggedIn, 
    products, 
    categories, 
    showToast, 
    updateProduct, 
    updateCategory,
    navigateTo,
    latestVideosLimit,
    updateLatestVideosLimit,
  } = useApp();

  const [mediaList, setMediaList] = useState<MediaFileRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<'library' | 'products' | 'categories' | 'banners' | 'videos' | 'instagram' | 'youtube'>('library');

  // Search & Filter state for Media Library
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaFileRecord | null>(null);

  // Edit Modal State
  const [editingMedia, setEditingMedia] = useState<MediaFileRecord | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublished, setEditIsPublished] = useState(true);

  // Upload Staging State for Product/Category/Banner/Video uploads
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Instagram / YouTube Form State
  const [instaUrl, setInstaUrl] = useState('');
  const [instaTitle, setInstaTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = (record: MediaFileRecord) => {
    setEditingMedia(record);
    setEditTitle(record.title || record.file_name || '');
    setEditDescription(record.description || '');
    const isPub = record.is_published !== undefined ? Boolean(record.is_published) : (record.is_active !== undefined ? Boolean(record.is_active) : true);
    setEditIsPublished(isPub);
  };

  const handleSaveEdit = async () => {
    if (!editingMedia) return;
    try {
      const updatedRecord: MediaFileRecord = {
        ...editingMedia,
        title: editTitle,
        description: editDescription,
        is_published: editIsPublished,
        is_active: editIsPublished,
      };
      await supabaseSaveMediaRecord(updatedRecord);
      showToast('Media details updated successfully!', 'success');
      setEditingMedia(null);
      fetchMediaFromSupabase();
    } catch (err) {
      showToast('Error updating media details', 'error');
    }
  };

  const handleTogglePublish = async (record: MediaFileRecord) => {
    try {
      const currentStatus = record.is_published !== undefined ? Boolean(record.is_published) : (record.is_active !== undefined ? Boolean(record.is_active) : true);
      const newStatus = !currentStatus;
      const updatedRecord: MediaFileRecord = {
        ...record,
        is_published: newStatus,
        is_active: newStatus,
      };
      await supabaseSaveMediaRecord(updatedRecord);
      showToast(newStatus ? 'Content published on website!' : 'Content unpublished (hidden from public).', 'info');
      fetchMediaFromSupabase();
    } catch (err) {
      showToast('Error toggling publish status', 'error');
    }
  };

  // Load media list from Supabase on mount
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    fetchMediaFromSupabase();
  }, [isAdminLoggedIn]);

  const fetchMediaFromSupabase = async () => {
    setIsLoading(true);
    try {
      const records = await supabaseGetMediaFiles();
      setMediaList(records);
    } catch (err) {
      console.warn('Error fetching media files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Guard: Admin Authentication Check
  if (!isAdminLoggedIn) {
    return (
      <div className="bg-[#161616] border border-rose-800/80 rounded-3xl p-8 max-w-lg mx-auto text-center space-y-6 shadow-2xl my-12">
        <div className="w-16 h-16 bg-rose-950 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-800">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white font-marathi">प्रवेश नाकारला (Access Denied)</h2>
          <p className="text-xs text-zinc-400">
            Media Manager is restricted exclusively to authenticated administrators. Please log in through the Admin Portal first.
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

  // Handle Drag and Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setUploadedFile(file);
    setFileTitle(file.name.replace(/\.[^/.]+$/, ''));
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    showToast('File staged for upload. Click Save to upload to Supabase.', 'info');
  };

  // Upload Product Image Handler
  const handleUploadProductImage = async () => {
    if (!uploadedFile || !selectedProductId) {
      showToast('Please select a product and an image file.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const targetProduct = products.find(p => p.id === selectedProductId);
      const folder = `products/${selectedProductId}`;
      
      const uploadResult = await supabaseUploadMediaStorageAsset(uploadedFile, 'website-images', folder);
      
      if (uploadResult?.publicUrl) {
        const newRecord: MediaFileRecord = {
          file_name: uploadedFile.name,
          storage_path: uploadResult.storagePath,
          public_url: uploadResult.publicUrl,
          media_type: 'image',
          mime_type: uploadedFile.type,
          file_size: uploadedFile.size,
          title: fileTitle || targetProduct?.nameEn || 'Product Image',
          description: fileDescription,
          product_id: selectedProductId,
          source_type: 'upload',
          uploaded_by: 'Admin',
          is_active: true,
        };

        await supabaseSaveMediaRecord(newRecord);

        // Update Product image array in state/database
        if (targetProduct) {
          const currentImages = Array.isArray(targetProduct.images) ? targetProduct.images : [targetProduct.images];
          const updatedImages = [uploadResult.publicUrl, ...currentImages.filter(img => img !== uploadResult.publicUrl)];
          await updateProduct(selectedProductId, {
            images: updatedImages,
          });
        }

        showToast(`Product image uploaded successfully for ${targetProduct?.nameEn || 'Product'}!`, 'success');
        setUploadedFile(null);
        setPreviewUrl(null);
        fetchMediaFromSupabase();
      } else {
        showToast('Upload failed. Please check network connection.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error uploading product image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload Category Image Handler
  const handleUploadCategoryImage = async () => {
    if (!uploadedFile || !selectedCategoryId) {
      showToast('Please select a category and an image file.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const targetCategory = categories.find(c => c.id === selectedCategoryId);
      const folder = `categories/${selectedCategoryId}`;

      const uploadResult = await supabaseUploadMediaStorageAsset(uploadedFile, 'website-images', folder);

      if (uploadResult?.publicUrl) {
        const newRecord: MediaFileRecord = {
          file_name: uploadedFile.name,
          storage_path: uploadResult.storagePath,
          public_url: uploadResult.publicUrl,
          media_type: 'image',
          mime_type: uploadedFile.type,
          file_size: uploadedFile.size,
          title: fileTitle || targetCategory?.nameEn || 'Category Image',
          category_id: selectedCategoryId,
          source_type: 'upload',
          uploaded_by: 'Admin',
          is_active: true,
        };

        await supabaseSaveMediaRecord(newRecord);

        if (targetCategory) {
          await updateCategory(selectedCategoryId, {
            imageUrl: uploadResult.publicUrl,
          });
        }

        showToast(`Category image updated for ${targetCategory?.nameEn}!`, 'success');
        setUploadedFile(null);
        setPreviewUrl(null);
        fetchMediaFromSupabase();
      }
    } catch (err) {
      console.error(err);
      showToast('Error uploading category image', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Upload Website Video Handler
  // IMPORTANT: Admin videos MUST go through the secure Render backend.
  // Do not upload directly from the browser to Supabase Storage or media_files.
  const handleUploadVideoFile = async () => {
    if (!uploadedFile) {
      showToast('Please select a video file (MP4, WEBM, MOV).', 'error');
      return;
    }

    if (!uploadedFile.type.startsWith('video/')) {
      showToast('Please select a valid video file.', 'error');
      return;
    }

    setIsUploading(true);

    try {
      const adminToken =
        sessionStorage.getItem('adminAuthToken') ||
        localStorage.getItem('adminAuthToken');

      if (!adminToken) {
        throw new Error('Admin session not found. Please log in again.');
      }

      // Vercel hosts the frontend; Render hosts the Express backend.
      const apiBaseUrl =
        (import.meta.env.VITE_API_BASE_URL ||
          'https://dadancha-dhaba-backend.onrender.com').replace(/\/$/, '');

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('titleEn', fileTitle || uploadedFile.name.replace(/\.[^/.]+$/, ''));
      formData.append('titleMr', '');
      formData.append('descriptionEn', fileDescription || '');
      formData.append('descriptionMr', '');
      formData.append('category', 'reels');
      formData.append('mediaType', 'video');

      const response = await fetch(
        `${apiBaseUrl}/api/admin/media/upload`,
        {
          method: 'POST',
          headers: {
            'x-admin-token': adminToken,
          },
          body: formData,
        }
      );

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok || !result?.success) {
        const message =
          result?.error ||
          result?.message ||
          `Upload failed with HTTP ${response.status}`;

        throw new Error(message);
      }

      // Success is shown ONLY after Render confirms that both
      // Supabase Storage upload and media_files INSERT succeeded.
      showToast(
        'Video uploaded and saved to Supabase successfully!',
        'success'
      );

      setUploadedFile(null);
      setFileTitle('');
      setFileDescription('');
      setPreviewUrl(null);

      await fetchMediaFromSupabase();
    } catch (err: any) {
      console.error('Admin video upload failed:', err);

      const message =
        err?.message ||
        'Error uploading video file';

      showToast(`Upload failed: ${message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Save Instagram Reel URL
  const handleAddInstagramVideo = async () => {
    if (!instaUrl.includes('instagram.com')) {
      showToast('Please enter a valid Instagram URL (e.g. https://www.instagram.com/reel/...)', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const newRecord: MediaFileRecord = {
        file_name: `Instagram Reel - ${instaTitle || 'Dadacha Dhaba'}`,
        public_url: instaUrl,
        external_url: instaUrl,
        media_type: 'instagram',
        source_type: 'external',
        title: instaTitle || 'Dadacha Dhaba Instagram Reel',
        uploaded_by: 'Admin',
        is_active: true,
      };

      await supabaseSaveMediaRecord(newRecord);
      showToast('Instagram video link saved to Supabase!', 'success');
      setInstaUrl('');
      setInstaTitle('');
      fetchMediaFromSupabase();
    } catch (err) {
      showToast('Error saving Instagram video link', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Save YouTube Video URL
  const handleAddYoutubeVideo = async () => {
    if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
      showToast('Please enter a valid YouTube video URL.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      // Parse embed link
      let embedUrl = youtubeUrl;
      if (youtubeUrl.includes('watch?v=')) {
        const videoId = youtubeUrl.split('watch?v=')[1]?.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (youtubeUrl.includes('youtu.be/')) {
        const videoId = youtubeUrl.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (youtubeUrl.includes('shorts/')) {
        const videoId = youtubeUrl.split('shorts/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }

      const newRecord: MediaFileRecord = {
        file_name: `YouTube - ${youtubeTitle || 'Dadacha Dhaba Special'}`,
        public_url: embedUrl,
        external_url: youtubeUrl,
        media_type: 'youtube',
        source_type: 'external',
        title: youtubeTitle || 'Dadacha Dhaba Special Recipe',
        uploaded_by: 'Admin',
        is_active: true,
      };

      await supabaseSaveMediaRecord(newRecord);
      showToast('YouTube video link added to website media!', 'success');
      setYoutubeUrl('');
      setYoutubeTitle('');
      fetchMediaFromSupabase();
    } catch (err) {
      showToast('Error adding YouTube video', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Media Item
  const handleDeleteMedia = async (
  record: MediaFileRecord
) => {
  if (!record.id) {
    showToast(
      'Cannot delete media: media ID is missing.',
      'error'
    );
    return;
  }

  const confirmed =
    window.confirm(
      `Are you sure you want to permanently delete "${record.title || record.file_name}"?\n\nThis will remove it from the website and Supabase.`
    );

  if (!confirmed) {
    return;
  }

  try {
    const adminToken =
      sessionStorage.getItem(
        'adminAuthToken'
      ) ||
      localStorage.getItem(
        'adminAuthToken'
      );

    if (!adminToken) {
      showToast(
        'Admin session expired. Please log in again.',
        'error'
      );
      return;
    }

    const apiBaseUrl =
      (
        import.meta.env
          .VITE_API_BASE_URL ||
        'https://dadancha-dhaba-backend.onrender.com'
      ).replace(/\/$/, '');

    /*
     * Delete through the secure backend.
     *
     * The backend deletes:
     * 1. Supabase Storage file
     * 2. media_files database row
     *
     * The backend only returns success when
     * the deletion has actually succeeded.
     */
    const response =
      await fetch(
        `${apiBaseUrl}/api/admin/media/${record.id}`,
        {
          method: 'DELETE',
          headers: {
            'x-admin-token':
              adminToken
          }
        }
      );

    let result: any =
      null;

    try {
      result =
        await response.json();
    } catch {
      result = null;
    }

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.error ||
          result?.message ||
          `Delete failed with HTTP ${response.status}`
      );
    }

    /*
     * Remove it immediately from the
     * visible frontend list.
     */
    setMediaList(
      (currentList) =>
        currentList.filter(
          (item) =>
            String(item.id) !==
            String(record.id)
        )
    );

    /*
     * Close preview if the deleted item
     * was currently open.
     */
    if (
      selectedMedia &&
      String(selectedMedia.id) ===
        String(record.id)
    ) {
      setSelectedMedia(null);
    }

    /*
     * Close edit modal if it was open.
     */
    if (
      editingMedia &&
      String(editingMedia.id) ===
        String(record.id)
    ) {
      setEditingMedia(null);
    }

    showToast(
      'Video deleted from the website and Supabase successfully.',
      'success'
    );

    /*
     * Reload from Supabase/backend to make
     * absolutely sure the deleted record
     * is no longer present.
     */
    await fetchMediaFromSupabase();
  } catch (err: any) {
    console.error(
      'Admin media deletion failed:',
      err
    );

    showToast(
      `Delete failed: ${
        err?.message ||
        'Unable to delete media.'
      }`,
      'error'
    );

    /*
     * If deletion failed, refresh the list
     * instead of pretending it was deleted.
     */
    await fetchMediaFromSupabase();
  }
};
  // Filtered Media List
  const filteredMedia = mediaList.filter(item => {
    const matchesSearch = item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'images') return matchesSearch && item.media_type === 'image';
    if (filterType === 'videos') return matchesSearch && (item.media_type === 'video' || item.media_type === 'instagram' || item.media_type === 'youtube');
    if (filterType === 'products') return matchesSearch && Boolean(item.product_id);
    if (filterType === 'categories') return matchesSearch && Boolean(item.category_id);
    return matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#161616] border border-[#F4B400]/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-5 text-center sm:text-left flex-col sm:flex-row z-10">
          <div className="p-4 bg-[#222] border-2 border-[#F4B400] rounded-2xl text-[#F4B400]">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-[10px] bg-[#F4B400] text-[#111] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                ADMIN MEDIA SUITE
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                Supabase Storage
              </span>
            </div>
            <h1 className="text-3xl font-black text-white font-marathi">Website Media Manager</h1>
            <p className="text-xs text-zinc-400">
              Upload, publish, unpublish, and configure latest video reels for the homepage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMediaFromSupabase}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs px-4 py-3 rounded-2xl border border-zinc-700 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* HOMEPAGE REELS DISPLAY LIMIT CONFIGURATION */}
      <div className="bg-[#1C180A] border border-[#F4B400]/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F4B400] bg-[#F4B400]/10 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HOMEPAGE DISPLAY SETTING</span>
          </div>
          <h3 className="text-sm font-extrabold text-white">Latest Videos to Display on Homepage</h3>
          <p className="text-xs text-zinc-400">
            Control how many published videos/reels appear in the top section below the header (Select 1 to 5).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => updateLatestVideosLimit(num)}
              className={`w-10 h-10 rounded-xl font-black text-xs transition-all border ${
                latestVideosLimit === num
                  ? 'bg-[#F4B400] text-[#111] border-[#F4B400] shadow-lg scale-105'
                  : 'bg-[#111] text-zinc-400 border-zinc-700 hover:text-white'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveSection('library')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'library' ? 'bg-[#F4B400] text-[#111]' : 'bg-[#161616] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Media Library ({mediaList.length})
        </button>
        <button
          onClick={() => setActiveSection('products')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'products' ? 'bg-[#F4B400] text-[#111]' : 'bg-[#161616] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Product Images
        </button>
        <button
          onClick={() => setActiveSection('categories')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'categories' ? 'bg-[#F4B400] text-[#111]' : 'bg-[#161616] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Category Images
        </button>
        <button
          onClick={() => setActiveSection('videos')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'videos' ? 'bg-[#F4B400] text-[#111]' : 'bg-[#161616] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Video className="w-4 h-4" /> Website Videos
        </button>
        <button
          onClick={() => setActiveSection('instagram')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'instagram' ? 'bg-[#F4B400] text-[#111]' : 'bg-[#161616] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Instagram className="w-4 h-4" /> Instagram Videos
        </button>
        <button
          onClick={() => setActiveSection('youtube')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'youtube' ? 'bg-[#F4B400] text-[#111]' : 'bg-[#161616] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Youtube className="w-4 h-4" /> YouTube Videos
        </button>
      </div>

      {/* SECTION 1: MEDIA LIBRARY */}
      {activeSection === 'library' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-[#161616] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search media by title or file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#F4B400]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold ${filterType === 'all' ? 'bg-[#F4B400] text-[#111]' : 'bg-[#111] text-zinc-400'}`}
              >
                All Media
              </button>
              <button
                onClick={() => setFilterType('images')}
                className={`px-3 py-1.5 rounded-lg font-bold ${filterType === 'images' ? 'bg-[#F4B400] text-[#111]' : 'bg-[#111] text-zinc-400'}`}
              >
                Images
              </button>
              <button
                onClick={() => setFilterType('videos')}
                className={`px-3 py-1.5 rounded-lg font-bold ${filterType === 'videos' ? 'bg-[#F4B400] text-[#111]' : 'bg-[#111] text-zinc-400'}`}
              >
                Videos & Reels
              </button>
              <button
                onClick={() => setFilterType('products')}
                className={`px-3 py-1.5 rounded-lg font-bold ${filterType === 'products' ? 'bg-[#F4B400] text-[#111]' : 'bg-[#111] text-zinc-400'}`}
              >
                Product Linked
              </button>
            </div>
          </div>

          {/* Media Grid */}
          {filteredMedia.length === 0 ? (
            <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
              <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-400">No media records found in database.</p>
              <p className="text-xs text-zinc-500">Upload product images, videos or Instagram reels from the tabs above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMedia.map((item) => {
                const isPublished = item.is_published !== undefined 
                  ? Boolean(item.is_published) 
                  : (item.is_active !== undefined ? Boolean(item.is_active) : true);

                return (
                  <div key={item.id} className="bg-[#161616] border border-zinc-800 rounded-2xl overflow-hidden group hover:border-[#F4B400]/50 transition-all flex flex-col justify-between">
                    <div>
                      <div className="relative aspect-square bg-[#111] flex items-center justify-center overflow-hidden">
                        {item.media_type === 'image' && (
                          <img src={item.public_url} alt={item.title || item.file_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        )}
                        {item.media_type === 'video' && (
                          <video src={item.public_url} className="w-full h-full object-cover" controls={false} />
                        )}
                        {item.media_type === 'instagram' && (
                          <div className="p-4 text-center space-y-2">
                            <Instagram className="w-8 h-8 text-pink-500 mx-auto" />
                            <span className="text-[10px] text-zinc-400 block font-bold">Instagram Reel</span>
                          </div>
                        )}
                        {item.media_type === 'youtube' && (
                          <div className="p-4 text-center space-y-2">
                            <Youtube className="w-8 h-8 text-red-500 mx-auto" />
                            <span className="text-[10px] text-zinc-400 block font-bold">YouTube Video</span>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 flex gap-1">
                          <button
                            onClick={() => handleTogglePublish(item)}
                            className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase shadow-md transition-transform hover:scale-105 ${
                              isPublished
                                ? 'bg-emerald-500 text-black'
                                : 'bg-rose-900/90 text-rose-200 border border-rose-700'
                            }`}
                            title="Click to toggle Publish/Unpublish status"
                          >
                            {isPublished ? '● PUBLISHED' : '○ HIDDEN'}
                          </button>
                        </div>

                        <div className="absolute top-2 right-2 flex gap-1">
                          <span className="bg-[#111]/90 text-[#F4B400] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border border-[#F4B400]/30">
                            {item.media_type}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        <span className="text-xs font-extrabold text-white block truncate">{item.title || item.file_name}</span>
                        {item.description && (
                          <p className="text-[10px] text-zinc-400 line-clamp-1">{item.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 pt-0 space-y-2">
                      <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-[11px]">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="text-[#F4B400] hover:underline font-bold flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Edit
                        </button>

                        <button
                          onClick={() => setSelectedMedia(item)}
                          className="text-zinc-400 hover:text-white font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>

                        <button
                          onClick={() => handleDeleteMedia(item)}
                          className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PRODUCT IMAGES */}
      {activeSection === 'products' && (
        <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-lg font-bold text-white font-marathi">Upload & Associate Product Image</h3>
            <span className="text-xs bg-[#F4B400]/10 text-[#F4B400] px-3 py-1 rounded-full font-bold">
              Supabase Storage (website-images/products/)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 block">Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-[#111] border border-zinc-700 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-[#F4B400]"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nameEn} ({p.nameMr || ''}) - ₹{p.price}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 block">Image Title</label>
                <input
                  type="text"
                  placeholder="e.g. Special Kolhapuri Masala Front View"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  className="w-full bg-[#111] border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F4B400]"
                />
              </div>

              {/* Drag & Drop Upload Zone */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging ? 'border-[#F4B400] bg-[#F4B400]/10' : 'border-zinc-700 bg-[#121212] hover:bg-[#181818]'
                }`}
              >
                <UploadCloud className="w-10 h-10 text-[#F4B400] animate-bounce" />
                <p className="text-xs font-bold text-white">Drag & Drop Product Image Here or Browse</p>
                <p className="text-[10px] text-zinc-500">PNG, JPG, WEBP, SVG up to 10MB</p>
              </div>

              <button
                onClick={handleUploadProductImage}
                disabled={isUploading || !uploadedFile}
                className="w-full bg-[#F4B400] hover:bg-[#FF8C00] disabled:bg-zinc-800 disabled:text-zinc-500 text-[#111] font-black py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2"
              >
                {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>UPLOAD PRODUCT IMAGE</span>
              </button>
            </div>

            {/* Preview Box */}
            <div className="bg-[#111] border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              {previewUrl ? (
                <div className="space-y-3 w-full">
                  <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-xl object-contain border border-zinc-700" />
                  <p className="text-xs font-bold text-emerald-400">Image staged ready for upload</p>
                </div>
              ) : (
                <div className="space-y-2 p-8">
                  <ImageIcon className="w-12 h-12 text-zinc-700 mx-auto" />
                  <p className="text-xs text-zinc-500">Select an image file to view preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CATEGORY IMAGES */}
      {activeSection === 'categories' && (
        <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-lg font-bold text-white font-marathi">Upload & Set Category Image</h3>
            <span className="text-xs bg-[#F4B400]/10 text-[#F4B400] px-3 py-1 rounded-full font-bold">
              Supabase Storage (website-images/categories/)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 block">Select Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-[#111] border border-zinc-700 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-[#F4B400]"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.nameEn} ({c.nameMr})</option>
                  ))}
                </select>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 bg-[#121212] hover:bg-[#181818] rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <UploadCloud className="w-10 h-10 text-[#F4B400]" />
                <p className="text-xs font-bold text-white">Click or Drag & Drop Category Image</p>
              </div>

              <button
                onClick={handleUploadCategoryImage}
                disabled={isUploading || !uploadedFile}
                className="w-full bg-[#F4B400] hover:bg-[#FF8C00] disabled:bg-zinc-800 disabled:text-zinc-500 text-[#111] font-black py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2"
              >
                {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                <span>UPDATE CATEGORY IMAGE</span>
              </button>
            </div>

            <div className="bg-[#111] border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-xl object-contain border border-zinc-700" />
              ) : (
                <p className="text-xs text-zinc-500">Category image preview will appear here</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: WEBSITE VIDEOS */}
      {activeSection === 'videos' && (
        <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-lg font-bold text-white font-marathi">Upload Website Video File</h3>
            <span className="text-xs bg-[#F4B400]/10 text-[#F4B400] px-3 py-1 rounded-full font-bold">
              Supabase Storage (website-videos/)
            </span>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 block">Video Title</label>
              <input
                type="text"
                placeholder="e.g. Authentic Dhaba Kitchen Preparation"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                className="w-full bg-[#111] border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F4B400]"
              />
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 bg-[#121212] hover:bg-[#181818] rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
            >
              <Video className="w-10 h-10 text-[#F4B400]" />
              <p className="text-xs font-bold text-white">Click to Select MP4, WEBM or MOV Video File</p>
            </div>

            <button
              onClick={handleUploadVideoFile}
              disabled={isUploading || !uploadedFile}
              className="w-full bg-[#F4B400] hover:bg-[#FF8C00] disabled:bg-zinc-800 disabled:text-zinc-500 text-[#111] font-black py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2"
            >
              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              <span>UPLOAD VIDEO FILE</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 5: INSTAGRAM REELS */}
      {activeSection === 'instagram' && (
        <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-lg font-bold text-white font-marathi">Add Instagram Reel / Video Link</h3>
            <span className="text-xs bg-pink-950 text-pink-400 border border-pink-800 px-3 py-1 rounded-full font-bold">
              Instagram Reel URL
            </span>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 block">Reel Title / Caption</label>
              <input
                type="text"
                placeholder="e.g. Making Special Mutton Curry Reel"
                value={instaTitle}
                onChange={(e) => setInstaTitle(e.target.value)}
                className="w-full bg-[#111] border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F4B400]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 block">Instagram Reel URL</label>
              <input
                type="url"
                placeholder="https://www.instagram.com/reel/CXXXXXXXXXX/"
                value={instaUrl}
                onChange={(e) => setInstaUrl(e.target.value)}
                className="w-full bg-[#111] border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F4B400]"
              />
            </div>

            <button
              onClick={handleAddInstagramVideo}
              disabled={isUploading || !instaUrl}
              className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white font-black py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2"
            >
              <Instagram className="w-4 h-4" />
              <span>ADD INSTAGRAM REEL TO WEBSITE</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 6: YOUTUBE VIDEOS */}
      {activeSection === 'youtube' && (
        <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="text-lg font-bold text-white font-marathi">Add YouTube Recipe / Review Video</h3>
            <span className="text-xs bg-red-950 text-red-400 border border-red-800 px-3 py-1 rounded-full font-bold">
              YouTube Embed
            </span>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 block">Video Title</label>
              <input
                type="text"
                placeholder="e.g. Dadacha Dhaba Special Thali Recipe"
                value={youtubeTitle}
                onChange={(e) => setYoutubeTitle(e.target.value)}
                className="w-full bg-[#111] border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F4B400]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300 block">YouTube Video / Shorts URL</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=XXXXXXXX or shorts"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full bg-[#111] border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F4B400]"
              />
            </div>

            <button
              onClick={handleAddYoutubeVideo}
              disabled={isUploading || !youtubeUrl}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2"
            >
              <Youtube className="w-4 h-4" />
              <span>ADD YOUTUBE VIDEO TO WEBSITE</span>
            </button>
          </div>
        </div>
      )}

      {/* EDIT MEDIA MODAL */}
      {editingMedia && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F4B400]" />
                <h4 className="font-extrabold text-white text-base">Edit Media Details</h4>
              </div>
              <button
                onClick={() => setEditingMedia(null)}
                className="text-zinc-400 hover:text-white text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 block">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter video or image title"
                  className="w-full bg-[#111] border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F4B400]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 block">Description / Caption</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter caption, ingredients, or recipe highlights"
                  className="w-full bg-[#111] border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F4B400]"
                />
              </div>

              <div className="flex items-center justify-between bg-[#111] border border-zinc-800 p-3 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white block">Publish Status</span>
                  <span className="text-[10px] text-zinc-400">
                    {editIsPublished ? 'Visible on website home & video list' : 'Hidden from public website'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIsPublished(!editIsPublished)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    editIsPublished
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {editIsPublished ? 'PUBLISHED' : 'HIDDEN'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingMedia(null)}
                className="w-1/2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs py-3 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="w-1/2 bg-[#F4B400] hover:bg-[#FF8C00] text-[#111] font-black text-xs py-3 rounded-xl shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal for Selected Item */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-white text-sm">{selectedMedia.title || selectedMedia.file_name}</h4>
              <button onClick={() => setSelectedMedia(null)} className="text-zinc-400 hover:text-white text-xs font-bold">Close</button>
            </div>

            <div className="bg-[#111] rounded-2xl p-2 flex items-center justify-center">
              {selectedMedia.media_type === 'image' && (
                <img src={selectedMedia.public_url} alt="Preview" className="max-h-80 rounded-xl object-contain" />
              )}
              {selectedMedia.media_type === 'video' && (
                <video src={selectedMedia.public_url} controls className="max-h-80 rounded-xl" />
              )}
              {selectedMedia.media_type === 'youtube' && (
                <iframe src={selectedMedia.public_url} className="w-full aspect-video rounded-xl" title="YouTube preview" />
              )}
            </div>

            <div className="text-xs text-zinc-400 space-y-1 font-mono break-all">
              <p>URL: {selectedMedia.public_url}</p>
              <p>Uploaded By: {selectedMedia.uploaded_by || 'Admin'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
