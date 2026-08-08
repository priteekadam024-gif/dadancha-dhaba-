import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { Search, Filter, SlidersHorizontal, Grid, List } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const { 
    language, products, categories, selectedCategoryId, 
    searchQuery, setSearchQuery 
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>(selectedCategoryId || 'all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(3000);

  // Filter products
  let filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = 
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.nameMr.includes(searchQuery) || 
      p.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = p.price <= maxPrice;
    return matchesCategory && matchesSearch && matchesPrice;
  });

  // Sort products
  if (sortBy === 'price-low') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filteredProducts.sort((a, b) => b.ratings - a.ratings);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1A1600] via-[#2A1E00] to-[#141414] p-8 rounded-3xl border border-[#F4B400]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-white font-marathi">
            {language === 'mr' ? 'दादाचे सर्व मसाले व उत्पादने' : 'All Spices & Cookware'}
          </h1>
          <p className="text-xs text-zinc-300 max-w-xl font-marathi">
            {language === 'mr' 
              ? 'अस्सल गावरान कांदा लसूण मसाला, मालवणी मसाला, गोडा मसाला व पारंपरिक कलई लावलेली पितळी भांडी.' 
              : 'Browse our complete catalog of hand-roasted heirloom spices, traditional brass handis, and roasted peanut chutneys.'}
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder={language === 'mr' ? 'शोधा...' : 'Search in shop...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] text-white text-sm rounded-full pl-9 pr-4 py-2 border border-zinc-700 focus:border-[#F4B400] focus:outline-none"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
            activeCategory === 'all'
              ? 'bg-[#F4B400] text-[#111111] shadow-md'
              : 'bg-[#1C1C1C] text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          {language === 'mr' ? 'सर्व उत्पादने' : 'All Products'} ({products.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all font-marathi ${
              activeCategory === cat.id
                ? 'bg-[#F4B400] text-[#111111] shadow-md'
                : 'bg-[#1C1C1C] text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            {language === 'mr' ? cat.nameMr : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Control Bar: Sort & Filter Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#141414] p-4 rounded-2xl border border-zinc-800 text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <SlidersHorizontal className="w-4 h-4 text-[#F4B400]" />
          <span>
            {language === 'mr' 
              ? `${filteredProducts.length} उत्पादने सापडली` 
              : `Showing ${filteredProducts.length} Products`}
          </span>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Price Range Filter */}
          <div className="flex items-center gap-2 text-zinc-400">
            <span>{language === 'mr' ? 'किंमत:' : 'Max Price:'}</span>
            <input
              type="range"
              min="100"
              max="3000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-[#F4B400] w-24"
            />
            <span className="font-bold text-[#F4B400]">₹{maxPrice}</span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">{language === 'mr' ? 'क्रमवारी:' : 'Sort By:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#1F1F1F] text-white border border-zinc-700 rounded-lg px-3 py-1.5 focus:outline-none text-xs font-semibold"
            >
              <option value="featured">{language === 'mr' ? 'लोकप्रिय' : 'Featured'}</option>
              <option value="price-low">{language === 'mr' ? 'किंमत: कमी ते जास्त' : 'Price: Low to High'}</option>
              <option value="price-high">{language === 'mr' ? 'किंमत: जास्त ते कमी' : 'Price: High to Low'}</option>
              <option value="rating">{language === 'mr' ? 'रेटिंग' : 'Highest Rated'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#141414] rounded-3xl border border-zinc-800 space-y-3">
          <p className="text-4xl">🍲</p>
          <h3 className="text-lg font-bold text-white font-marathi">
            {language === 'mr' ? 'कोणतेही उत्पादन सापडले नाही' : 'No products found'}
          </h3>
          <p className="text-xs text-zinc-500">
            {language === 'mr' ? 'कृपया शोध शब्द किंवा फिल्टर बदलून पहा' : 'Try resetting your search query or filters'}
          </p>
          <button
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
              setMaxPrice(3000);
            }}
            className="bg-[#F4B400] text-[#111111] text-xs font-bold px-4 py-2 rounded-full"
          >
            {language === 'mr' ? 'सर्व फिल्टर रीसेट करा' : 'Reset All Filters'}
          </button>
        </div>
      )}
    </div>
  );
};
