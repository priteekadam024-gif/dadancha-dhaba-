// Curated database of high-resolution, royalty-free professional Unsplash product images
// tailored for Indian Spices (Masale), Whole Seeds, Powders, and Kitchen Utensils/Appliances.

export interface SpiceImageOption {
  title: string;
  category: 'masale' | 'spices' | 'appliances' | 'chutneys' | 'premixes' | 'combos';
  images: string[];
}

export const SPICE_IMAGE_LIBRARY: Record<string, SpiceImageOption> = {
  'garam masala': {
    title: 'Premium Garam Masala Powder',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'kitchen king masala': {
    title: 'Premium Kitchen King Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'pav bhaji masala': {
    title: 'Mumbai Street Pav Bhaji Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'biryani masala': {
    title: 'Shahi Biryani Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'veg maratha masala': {
    title: 'Dhaba Style Special Veg Maratha Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'kaju masala': {
    title: 'Special Kaju Curry Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'veg kolhapuri masala': {
    title: 'Veg Kolhapuri Special Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'sabji masala': {
    title: 'Dhaba Special Sabji Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'chole masala': {
    title: 'Amritsari Chole Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'paneer masala': {
    title: 'Shahi Paneer Butter Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'misal masala': {
    title: 'Authentic Maharashtrian Misal Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'kolhapuri masala': {
    title: 'Fiery Kolhapuri Lavangi Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'malvani masala': {
    title: 'Authentic Konkan Malvani Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'kala masala': {
    title: 'Authentic Maharashtrian Kala Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'goda masala': {
    title: 'Peshwai Shahi Goda Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'tandoori masala': {
    title: 'Smoky Tandoori Tikka Masala',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'curry powder': {
    title: 'Golden Indian Curry Powder',
    category: 'masale',
    images: [
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'turmeric powder': {
    title: 'Pure Sangli Organic Turmeric Powder (हळद)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'red chilli powder': {
    title: 'Kashmiri & Byadgi Red Chilli Powder (लाल तिखट)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'coriander powder': {
    title: 'Freshly Ground Coriander Powder (धणा पावडर)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'cumin powder': {
    title: 'Roasted Cumin Powder (जिरा पावडर)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'black pepper powder': {
    title: 'Malabar Black Pepper Powder (काळी मिरी पावडर)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'jeera': {
    title: 'Unpolished Whole Cumin Seeds (जिरे)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'mustard seeds': {
    title: 'Small Black Mustard Seeds (मोहरी)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'fennel seeds': {
    title: 'Lucknowi Green Fennel Seeds (बडीशेप)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'cardamom': {
    title: 'Idukki Whole Green Cardamom (वेलची)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'cinnamon': {
    title: 'Ceylon Cinnamon Rolls & Sticks (दालचिनी)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'cloves': {
    title: 'Whole Organic Cloves (लवंग)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'bay leaf': {
    title: 'Aromatic Tej Patta (तमालपत्र)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'star anise': {
    title: 'Whole Star Anise (चक्रीफूल)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'kasuri methi': {
    title: 'Nagauri Sun-Dried Kasuri Methi (कसुरी मेथी)',
    category: 'spices',
    images: [
      'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'mixer grinder': {
    title: '750W Heavy Duty Brass Motor Mixer Grinder',
    category: 'appliances',
    images: [
      'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'pressure cooker': {
    title: 'Hard Anodized Aluminum Pressure Cooker (5 Litre)',
    category: 'appliances',
    images: [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'gas stove': {
    title: 'Toughened Glass 3 Burner Auto-Ignition Gas Stove',
    category: 'appliances',
    images: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'tawa': {
    title: 'Heavy Cast Iron Dosa & Bhakri Tawa',
    category: 'appliances',
    images: [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'kadai': {
    title: 'Traditional Hammered Brass Kalai Kadai',
    category: 'appliances',
    images: [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'spice box': {
    title: 'Pure Brass Handmade Masala Dabba Box',
    category: 'appliances',
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=1200'
    ]
  },
  'brass handi': {
    title: 'Pure Brass Kalai Handi (2 Litre)',
    category: 'appliances',
    images: [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200'
    ]
  }
};

/**
 * Searches the image library for matching spice or appliance images based on input product name.
 */
export function findMatchingImages(searchTerm: string): string[] {
  if (!searchTerm || !searchTerm.trim()) {
    return [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200'
    ];
  }

  const query = searchTerm.toLowerCase().trim();

  for (const [key, value] of Object.entries(SPICE_IMAGE_LIBRARY)) {
    if (query.includes(key) || key.includes(query)) {
      return value.images;
    }
  }

  // Fallback high-res spice image if query not explicitly matched
  return [
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1509358271058-acd05cc93898?auto=format&fit=crop&q=80&w=1200'
  ];
}
