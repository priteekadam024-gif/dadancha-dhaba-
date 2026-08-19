import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { 
  Star, Heart, ShoppingBag, ShieldCheck, Truck, RotateCcw, 
  MapPin, Share2, CheckCircle2, MessageSquare, Flame, ThumbsUp,
  Maximize2, X, ChevronLeft, ChevronRight, ZoomIn
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { 
    language, products, selectedProductId, navigateTo, 
    addToCart, wishlist, toggleWishlist, reviews, addReview, showToast, contactConfig,
    currentUser, orders
  } = useApp();

  const product = products.find((p) => p.id === selectedProductId) || products[0];

  // Available variants (fallback to default product weight & price if no variants)
  const variants = (product.variants && product.variants.length > 0)
    ? product.variants
    : [{ id: 'default', weight: product.weight || '250 g', size: product.weight || '250 g', price: product.price, originalPrice: product.originalPrice, stock: product.stock, isActive: true }];

  const [selectedVariant, setSelectedVariant] = useState(variants[0]);

  // Reset selected variant when product changes
  React.useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant({
        id: 'default',
        weight: product.weight || '250 g',
        size: product.weight || '250 g',
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        isActive: true
      });
    }
  }, [product.id, product.variants, product.weight, product.price, product.originalPrice, product.stock]);

  const activePrice = selectedVariant ? Number(selectedVariant.price) : product.price;
  const activeOriginalPrice = selectedVariant?.originalPrice 
    ? Number(selectedVariant.originalPrice) 
    : (product.originalPrice || Math.round(activePrice * 1.25));
  const activeWeight = selectedVariant ? (selectedVariant.weight || selectedVariant.size) : product.weight;
  const activeDiscountPercent = activeOriginalPrice > activePrice 
    ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100)
    : 0;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'ingredients' | 'reviews' | 'returns'>('details');
  const [pincode, setPincode] = useState('');
  const [deliveryEstimate, setDeliveryEstimate] = useState<string | null>(null);

  // New review state
  const [newReviewName, setNewReviewName] = useState(currentUser?.name || '');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  const isWishlisted = wishlist.includes(product.id);
  const productReviews = reviews.filter((r) => r.productId === product.id);

  // Check if current user has purchased this product in a non-cancelled order
  const hasPurchasedProduct = Boolean(
    currentUser &&
    orders.some((ord) => 
      ord.orderStatus !== 'cancelled' &&
      (ord.items || []).some((it) => it.productId === product.id)
    )
  );

  // Check if user already reviewed this product
  const existingUserReview = reviews.find(
    (r) => r.productId === product.id && currentUser && (r.userId === currentUser.id || r.userName === currentUser.name)
  );

  React.useEffect(() => {
    if (currentUser && (!newReviewName || newReviewName === '')) {
      setNewReviewName(currentUser.name);
    }
    if (existingUserReview) {
      setNewReviewComment(existingUserReview.comment);
      setNewReviewRating(existingUserReview.rating);
    }
  }, [currentUser, existingUserReview, product.id]);

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length !== 6 || isNaN(Number(pincode))) {
      showToast(language === 'mr' ? 'कृपया ६ अंकी पिनकोड प्रविष्ट करा' : 'Please enter valid 6-digit Pincode', 'error');
      return;
    }
    setDeliveryEstimate(
      language === 'mr' 
        ? `पिनकोड ${pincode} साठी २-३ दिवसांत मोफत एक्सप्रेस डिलिव्हरी!` 
        : `Express Delivery available to ${pincode} within 2-3 business days!`
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.nameEn,
        text: product.descriptionEn,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast(language === 'mr' ? 'लिंक कॉपी झाली!' : 'Product link copied!');
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast(language === 'mr' ? 'कृपया पुनरावलोकन देण्यासाठी लॉगिन करा' : 'Please log in to submit a review', 'error');
      return;
    }
    if (!hasPurchasedProduct) {
      showToast(language === 'mr' ? 'हे उत्पादन खरेदी केल्यानंतरच अभिप्राय देता येईल' : 'Only customers who purchased this product can leave a review', 'error');
      return;
    }
    if (!newReviewName || !newReviewComment) {
      showToast(language === 'mr' ? 'कृपया नाव आणि अभिप्राय प्रविष्ट करा' : 'Please enter name and review', 'error');
      return;
    }
    addReview({
      productId: product.id,
      userName: newReviewName,
      rating: newReviewRating,
      comment: newReviewComment,
      verifiedPurchase: true,
    });
  };

  // Related Products
  const relatedProducts = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Product Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Images Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div 
            className="relative aspect-square bg-[#121212] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl group cursor-zoom-in"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setMousePos({ x, y });
            }}
            onClick={() => setIsZoomModalOpen(true)}
          >
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.nameEn}
              className={`w-full h-full object-cover transition-transform duration-200 ${
                isHovered ? 'scale-150' : 'scale-100'
              }`}
              style={
                isHovered
                  ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` }
                  : undefined
              }
            />

            {/* Hover Zoom Hint */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-3.5 h-3.5 text-[#F4B400]" />
              <span>Hover to Zoom • Click for Fullscreen</span>
            </div>

            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-[#FF8C00] text-white font-black text-xs px-3 py-1 rounded-full shadow">
                {product.discountPercent}% OFF
              </span>
            )}

            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsZoomModalOpen(true);
                }}
                className="p-2.5 bg-black/60 text-white rounded-full hover:bg-[#F4B400] hover:text-[#111111] transition-colors"
                title="Fullscreen Preview"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="p-2.5 bg-black/60 text-white rounded-full hover:bg-[#F4B400] hover:text-[#111111] transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-[#F4B400] scale-105 shadow-lg' : 'border-zinc-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Info & Buying Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs bg-[#F4B400]/10 text-[#F4B400] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-[#F4B400]/30">
              {product.categoryName}
            </span>

            <h1 className="text-3xl sm:text-4xl font-black text-white font-marathi leading-tight">
              {language === 'mr' ? product.nameMr : product.nameEn}
            </h1>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1 text-[#F4B400]">
                <Star className="w-4 h-4 fill-[#F4B400]" />
                <span className="font-extrabold text-sm text-white">{product.ratings}</span>
              </div>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400 font-semibold">
                {product.reviewCount} {language === 'mr' ? 'ग्राहकांचे अभिप्राय' : 'Verified Reviews'}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-emerald-400 font-semibold">
                SKU: {product.sku}
              </span>
            </div>
          </div>

          {/* Dynamic Price Box */}
          <div className="p-4 sm:p-5 bg-[#161616] border border-zinc-800 rounded-2xl flex flex-wrap items-baseline gap-3 shadow-inner">
            <span className="text-3xl sm:text-4xl font-black text-[#F4B400]">₹{activePrice}</span>
            {activeOriginalPrice > activePrice && (
              <span className="text-base sm:text-lg text-zinc-500 line-through">₹{activeOriginalPrice}</span>
            )}
            {activeDiscountPercent > 0 && (
              <span className="text-xs bg-[#F4B400]/20 text-[#F4B400] font-black px-2.5 py-1 rounded-full border border-[#F4B400]/30">
                {activeDiscountPercent}% OFF
              </span>
            )}
            <span className="text-xs text-emerald-400 font-bold ml-auto bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
              {language === 'mr' ? 'कर समाविष्ट (All Taxes Incl.)' : 'Inclusive of all Taxes'}
            </span>
          </div>

          {/* Pack Sizes / Weight Options Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>{language === 'mr' ? 'उपलब्ध वजन / पॅक निवडा:' : 'Select Pack Size / Weight:'}</span>
              </label>
              {selectedVariant && (
                <span className="text-xs text-[#F4B400] font-bold">
                  {language === 'mr' ? 'निवडलेले:' : 'Selected:'} {activeWeight} (₹{activePrice})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {variants.map((v, idx) => {
                const isSelected = selectedVariant?.id === v.id || (!selectedVariant && idx === 0);
                const variantWeight = v.weight || v.size || '250 g';
                const variantPrice = Number(v.price) || product.price;
                const variantOriginalPrice = v.originalPrice || Math.round(variantPrice * 1.25);

                return (
                  <button
                    key={v.id || idx}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`relative p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#1F1700] border-[#F4B400] ring-1 ring-[#F4B400] text-white shadow-lg'
                        : 'bg-[#141414] border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-extrabold text-sm text-white">
                        {variantWeight}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-[#F4B400] shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className={`text-sm font-black ${isSelected ? 'text-[#F4B400]' : 'text-white'}`}>
                        ₹{variantPrice}
                      </span>
                      {variantOriginalPrice > variantPrice && (
                        <span className="text-[10px] text-zinc-500 line-through">
                          ₹{variantOriginalPrice}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-[#1F1F1F] border border-zinc-700 rounded-2xl p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 text-white font-bold hover:bg-zinc-800 rounded-xl flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-white text-base">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 text-white font-bold hover:bg-zinc-800 rounded-xl flex items-center justify-center"
                >
                  +
                </button>
              </div>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isWishlisted
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-[#1F1F1F] text-zinc-300 border-zinc-700 hover:border-[#F4B400]'
                }`}
                title="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-white' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => addToCart(product, quantity, selectedVariant)}
                className="w-full bg-[#1F1F1F] hover:bg-[#262626] text-white font-bold text-sm py-3.5 rounded-2xl border border-[#F4B400] transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.01]"
              >
                <ShoppingBag className="w-5 h-5 text-[#F4B400]" />
                <span>
                  {language === 'mr' ? 'कार्टमध्ये जोडा' : 'Add to Cart'} ({activeWeight})
                </span>
              </button>

              <button
                onClick={() => {
                  addToCart(product, quantity, selectedVariant);
                  navigateTo('checkout');
                }}
                className="w-full bg-gradient-to-r from-[#F4B400] to-[#FF8C00] text-[#111111] font-black text-sm py-3.5 rounded-2xl transition-all shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Flame className="w-5 h-5" />
                <span>{language === 'mr' ? 'थेट खरेदी करा' : 'Buy Now'}</span>
              </button>
            </div>

            {/* Ask about this Product Button */}
            <a
              href={`https://wa.me/${contactConfig.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hello Dadacha Dhaba,\n\nI would like to know more about this product:\n\nProduct Name: ${product.nameEn}\nPack Size: ${activeWeight}\nPrice: ₹${activePrice}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 font-bold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg mt-2"
            >
              <span>💬 Ask about this Product on WhatsApp</span>
            </a>
          </div>

          {/* Delivery Pincode Checker */}
          <div className="bg-[#141414] border border-zinc-800 p-4 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#F4B400]" />
              <span>{language === 'mr' ? 'डिलिव्हरी तपासा (पिनकोड प्रविष्ट करा):' : 'Check Delivery Availability:'}</span>
            </label>
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 411045"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="bg-[#1F1F1F] text-white text-xs px-3 py-2 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#F4B400] flex-1"
              />
              <button
                type="submit"
                className="bg-[#F4B400] text-[#111111] text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#FF8C00]"
              >
                {language === 'mr' ? 'तपासा' : 'Check'}
              </button>
            </form>
            {deliveryEstimate && (
              <p className="text-xs text-emerald-400 font-semibold pt-1">
                ✓ {deliveryEstimate}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section (Description, Ingredients, Reviews, Returns) */}
      <div className="bg-[#141414] border border-zinc-800 rounded-3xl p-6 space-y-6">
        <div className="flex border-b border-zinc-800 overflow-x-auto gap-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'details' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'mr' ? 'वर्णन व वैशिष्ट्ये' : 'Description'}
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`py-3 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'ingredients' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'mr' ? 'घटक व साहित्य' : 'Ingredients'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'reviews' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'mr' ? 'ग्राहकांचे अभिप्राय' : 'Customer Reviews'} ({productReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`py-3 px-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'returns' ? 'border-[#F4B400] text-[#F4B400]' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {language === 'mr' ? 'परतावा व हमी' : 'Return Policy'}
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'details' && (
          <div className="space-y-4 text-sm text-zinc-300 leading-relaxed font-marathi">
            <p>{language === 'mr' ? product.descriptionMr : product.descriptionEn}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              <div className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800">
                <h4 className="font-bold text-white text-xs uppercase mb-1 text-[#F4B400]">ब्रांड / Brand</h4>
                <p>{product.brand}</p>
              </div>
              <div className="bg-[#1A1A1A] p-4 rounded-xl border border-zinc-800">
                <h4 className="font-bold text-white text-xs uppercase mb-1 text-[#F4B400]">उत्पादन पद्धत / Process</h4>
                <p>100% Heirloom Iron Kadai Roasted</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className="space-y-3 text-sm text-zinc-300">
            <h4 className="font-bold text-white text-base">
              {language === 'mr' ? 'वापरलेले गावरान घटक:' : 'Pure Traditional Ingredients:'}
            </h4>
            <p className="bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-800 font-marathi">
              {language === 'mr' ? product.ingredientsMr : product.ingredientsEn}
            </p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            {/* Reviews List */}
            <div className="space-y-4">
              {productReviews.length > 0 ? (
                productReviews.map((rev) => (
                  <div key={rev.id} className="bg-[#1A1A1A] p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-2.5">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{rev.userName}</span>
                        {(rev.verifiedPurchase || rev.userId) && (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2.5 py-0.5 rounded-full font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            {language === 'mr' ? 'सत्यप्रत खरेदीदार' : 'Verified Purchase'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#F4B400]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#F4B400]" />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-300 font-marathi leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 italic">
                  {language === 'mr' ? 'या उत्पादनासाठी अद्याप कोणतीही पुनरावलोकन नाही.' : 'No reviews yet for this product.'}
                </p>
              )}
            </div>

            {/* Add Review Section Conditional Logic */}
            {!currentUser ? (
              <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-zinc-800 text-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-[#F4B400] mx-auto opacity-80" />
                <h4 className="text-white font-bold text-sm">
                  {language === 'mr' ? 'फक्त खरेदीदार पुनरावलोकन सबमिट करू शकतात' : 'Only Verified Buyers Can Review'}
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {language === 'mr' 
                    ? 'या उत्पादनाचा अभिप्राय नोंदवण्यासाठी कृपया लॉगिन करा आणि खरेदी करा.' 
                    : 'Please log in with an account that has purchased this product to submit a review.'}
                </p>
                <button
                  onClick={() => navigateTo('login')}
                  className="bg-[#F4B400] text-[#111111] text-xs font-bold px-5 py-2 rounded-xl hover:bg-[#FF8C00] transition-colors mt-2"
                >
                  {language === 'mr' ? 'लॉगिन करा' : 'Log In to Review'}
                </button>
              </div>
            ) : !hasPurchasedProduct ? (
              <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-zinc-800 text-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-zinc-500 mx-auto" />
                <h4 className="text-white font-bold text-sm">
                  {language === 'mr' ? 'खरेदीनंतरच पुनरावलोकन देण्याची सोय' : 'Verified Purchase Required'}
                </h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {language === 'mr'
                    ? `तुम्ही '${product.nameMr || product.nameEn}' हे उत्पादन ऑर्डर केले असल्यासच अभिप्राय देऊ शकता.`
                    : `You can only review '${product.nameEn}' if you have purchased it in an order.`}
                </p>
                <button
                  onClick={() => addToCart(product, 1)}
                  className="bg-[#F4B400] text-[#111111] text-xs font-bold px-5 py-2 rounded-xl hover:bg-[#FF8C00] transition-colors"
                >
                  {language === 'mr' ? 'ऑर्डर करा' : 'Buy Product to Review'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="bg-[#1A1A1A] p-6 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h4 className="font-bold text-white text-base font-marathi">
                    {existingUserReview 
                      ? (language === 'mr' ? 'तुमचा अभिप्राय अपडेट करा' : 'Update Your Verified Review')
                      : (language === 'mr' ? 'तुमचा अभिप्राय नोंदवा' : 'Write a Verified Review')}
                  </h4>
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-full font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === 'mr' ? 'सत्यप्रत खरेदीदार' : 'Verified Buyer'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={language === 'mr' ? 'तुमचे नाव' : 'Your Name'}
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    className="bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700"
                  />

                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5 Good)</option>
                    <option value={3}>⭐⭐⭐ (3/5 Average)</option>
                    <option value={2}>⭐⭐ (2/5 Below Average)</option>
                    <option value={1}>⭐ (1/5 Poor)</option>
                  </select>
                </div>

                <textarea
                  placeholder={language === 'mr' ? 'तुमची प्रतिक्रिया येथे लिहा...' : 'Your feedback on taste, packaging, delivery...'}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  rows={3}
                  className="w-full bg-[#111111] text-white text-xs p-3 rounded-xl border border-zinc-700"
                />

                <button
                  type="submit"
                  className="bg-[#F4B400] text-[#111111] font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-[#FF8C00] transition-colors"
                >
                  {existingUserReview
                    ? (language === 'mr' ? 'अभिप्राय अपडेट करा' : 'Update Review')
                    : (language === 'mr' ? 'अभिप्राय सबमिट करा' : 'Submit Review')}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-marathi">
            <p>• <strong>७ दिवसांची रिप्लेसमेंट हमी:</strong> जर पार्सल किंवा भांडी डॅमेज स्थितीत मिळाली तर ७ दिवसांच्या आत तात्काळ नवीन वस्तू पाठवली जाईल.</p>
            <p>• <strong>१००% फूड सेफ कलई:</strong> पितळी भांड्यांची कलई (Tin) अन्न-सुरक्षित असते.</p>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white font-marathi">
            {language === 'mr' ? 'संबंधित उत्पादने' : 'Related Products'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen HD Image Lightbox Modal */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-8">
          {/* Top Bar */}
          <div className="w-full max-w-6xl flex justify-between items-center text-white z-10">
            <div>
              <h3 className="font-bold text-lg font-marathi">{language === 'mr' ? product.nameMr : product.nameEn}</h3>
              <p className="text-xs text-zinc-400">Photo {activeImageIndex + 1} of {product.images.length}</p>
            </div>
            <button
              onClick={() => setIsZoomModalOpen(false)}
              className="p-3 bg-zinc-800/80 hover:bg-[#F4B400] hover:text-[#111111] text-white rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Large Image */}
          <div className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-4 overflow-hidden">
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.nameEn}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-zinc-800"
            />

            {/* Prev & Next Arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1))}
                  className="absolute left-2 sm:left-6 p-3 bg-black/70 text-white rounded-full hover:bg-[#F4B400] hover:text-[#111111] transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={() => setActiveImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 sm:right-6 p-3 bg-black/70 text-white rounded-full hover:bg-[#F4B400] hover:text-[#111111] transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto p-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-[#F4B400] scale-105 shadow-xl' : 'border-zinc-800 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Lightbox thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
