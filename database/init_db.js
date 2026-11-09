/**
 * Narayani Sarees - Database Initialization and Seeding Script
 * Tuljapur, Maharashtra - Grace In Every Drape
 */
const path = require('path');
const fs = require('fs');

const dotenv = (() => {
  try { return require('dotenv'); }
  catch(e) { return require(path.join(__dirname, '../backend/node_modules/dotenv')); }
})();
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const mysql = (() => {
  try { return require('mysql2/promise'); }
  catch(e) { return require(path.join(__dirname, '../backend/node_modules/mysql2/promise')); }
})();

const bcrypt = (() => {
  try { return require('bcryptjs'); }
  catch(e) { return require(path.join(__dirname, '../backend/node_modules/bcryptjs')); }
})();

const sampleCategories = [
  { id: 1, name: 'Paithani Sarees', slug: 'paithani-sarees', description: 'Royal Maharashtrian handwoven Paithani sarees with peacock motifs and pure zari borders.', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', is_featured: true, display_order: 1 },
  { id: 2, name: 'Banarasi Sarees', slug: 'banarasi-sarees', description: 'Opulent Varanasi silk sarees woven with intricate gold and silver brocade.', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', is_featured: true, display_order: 2 },
  { id: 3, name: 'Silk Sarees', slug: 'silk-sarees', description: 'Pure Kanjeevaram and Mysore silks radiating timeless elegance.', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', is_featured: true, display_order: 3 },
  { id: 4, name: 'Cotton Sarees', slug: 'cotton-sarees', description: 'Breathable Chanderi, Mulmul and Kota Doria cottons for daily grace and comfort.', image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80', is_featured: true, display_order: 4 },
  { id: 5, name: 'Wedding Sarees', slug: 'wedding-sarees', description: 'Grand bridal weaves designed for your most unforgettable wedding moments.', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80', is_featured: true, display_order: 5 },
  { id: 6, name: 'Party Wear', slug: 'party-wear', description: 'Contemporary organza, shimmer georgette and sequined drapes.', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80', is_featured: true, display_order: 6 },
  { id: 7, name: 'Daily Wear', slug: 'daily-wear', description: 'Soft, easy-to-drape everyday sarees with vibrant prints and lightweight fabric.', image: 'https://images.unsplash.com/photo-1610030469668-9359e9849202?auto=format&fit=crop&w=800&q=80', is_featured: false, display_order: 7 },
  { id: 8, name: 'Designer Sarees', slug: 'designer-sarees', description: 'Exclusive designer cutwork, thread embroidery and fusion styling.', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', is_featured: false, display_order: 8 }
];

const sampleProducts = [
  {
    id: 1,
    name: 'Royal Peshwai Maroon Pure Silk Paithani Saree',
    slug: 'royal-peshwai-maroon-pure-silk-paithani-saree',
    sku: 'NS-PTH-001',
    category_id: 1,
    fabric: 'Pure Silk',
    color: 'Maroon',
    occasion: 'Wedding',
    description: 'A masterpiece from Yeola artisans featuring traditional Mor-Bangadi (Peacock bangle) pallu woven in genuine zari with rich maroon base.',
    specifications: JSON.stringify({ 'Blouse Piece': 'Included (Unstitched)', 'Saree Length': '6.3 Meters with Blouse', 'Zari Type': 'Pure Tested Zari', 'Care': 'Dry Clean Only', 'Origin': 'Yeola, Maharashtra' }),
    price: 14999.00,
    original_price: 18999.00,
    discount: 21,
    stock_quantity: 12,
    rating: 4.9,
    total_reviews: 28,
    is_featured: true,
    is_bestseller: true,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 2,
    name: 'Emerald Green Maharashtrian Bridal Paithani Saree',
    slug: 'emerald-green-maharashtrian-bridal-paithani-saree',
    sku: 'NS-PTH-002',
    category_id: 1,
    fabric: 'Pure Silk',
    color: 'Green',
    occasion: 'Wedding',
    description: 'Lustrous emerald green silk Paithani with dazzling gold buttis and grand floral motif kath-padar borders.',
    specifications: JSON.stringify({ 'Blouse Piece': 'Included', 'Saree Length': '6.3 Meters', 'Zari Type': 'Gold Tested Zari', 'Care': 'Dry Clean Only', 'Origin': 'Paithan, Maharashtra' }),
    price: 16499.00,
    original_price: 21999.00,
    discount: 25,
    stock_quantity: 8,
    rating: 4.85,
    total_reviews: 19,
    is_featured: true,
    is_bestseller: true,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 3,
    name: 'Vibrant Mustard Yellow Festive Silk Paithani',
    slug: 'vibrant-mustard-yellow-festive-silk-paithani',
    sku: 'NS-PTH-003',
    category_id: 1,
    fabric: 'Art Silk',
    color: 'Yellow',
    occasion: 'Festival',
    description: 'Auspicious turmeric yellow Paithani saree with contrasting crimson border, ideal for Ganesh Utsav and Diwali pooja.',
    specifications: JSON.stringify({ 'Blouse Piece': 'Included', 'Saree Length': '6.3 Meters', 'Care': 'Dry Clean', 'Origin': 'Maharashtra' }),
    price: 6499.00,
    original_price: 8999.00,
    discount: 28,
    stock_quantity: 15,
    rating: 4.7,
    total_reviews: 14,
    is_featured: false,
    is_bestseller: true,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 4,
    name: 'Midnight Blue Katan Silk Banarasi Brocade Saree',
    slug: 'midnight-blue-katan-silk-banarasi-brocade-saree',
    sku: 'NS-BNR-001',
    category_id: 2,
    fabric: 'Katan Silk',
    color: 'Blue',
    occasion: 'Party Wear',
    description: 'Luxurious heavy Katan silk with all-over antique gold floral jaal and intricate temple border.',
    specifications: JSON.stringify({ 'Blouse Piece': 'Included (Running)', 'Length': '6.3m', 'Weave': 'Kadhwa Weave', 'Care': 'Dry Clean Only' }),
    price: 12999.00,
    original_price: 16999.00,
    discount: 24,
    stock_quantity: 9,
    rating: 4.9,
    total_reviews: 32,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 5,
    name: 'Ruby Red Pure Georgette Banarasi Khaddi Saree',
    slug: 'ruby-red-pure-georgette-banarasi-khaddi-saree',
    sku: 'NS-BNR-002',
    category_id: 2,
    fabric: 'Khaddi Georgette',
    color: 'Red',
    occasion: 'Wedding',
    description: 'Feather-light pure georgette Banarasi draped in silver-gold sona rupa zari jaal, flattering for reception and parties.',
    specifications: JSON.stringify({ 'Blouse': 'Included', 'Fabric': 'Pure Khaddi Georgette', 'Care': 'Dry Clean Only' }),
    price: 13499.00,
    original_price: 17500.00,
    discount: 23,
    stock_quantity: 6,
    rating: 4.95,
    total_reviews: 21,
    is_featured: true,
    is_bestseller: true,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 6,
    name: 'Rani Pink Temple Border Kanjeevaram Silk Saree',
    slug: 'rani-pink-temple-border-kanjeevaram-silk-saree',
    sku: 'NS-SLK-001',
    category_id: 3,
    fabric: 'Pure Mulberry Silk',
    color: 'Pink',
    occasion: 'Wedding',
    description: 'Grand royal wedding Kanchipuram drape with traditional korvai contrast border and pure zari rich pallu.',
    specifications: JSON.stringify({ 'Silk Mark': 'Certified Pure Silk', 'Length': '6.3 Meters', 'Care': 'Dry Clean Only' }),
    price: 18999.00,
    original_price: 24999.00,
    discount: 24,
    stock_quantity: 5,
    rating: 5.0,
    total_reviews: 40,
    is_featured: true,
    is_bestseller: true,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 7,
    name: 'Teal Green Soft Silk Kanjeevaram Weave Saree',
    slug: 'teal-green-soft-silk-kanjeevaram-weave-saree',
    sku: 'NS-SLK-002',
    category_id: 3,
    fabric: 'Soft Silk',
    color: 'Green',
    occasion: 'Party Wear',
    description: 'Contemporary soft silk drape with subtle zari motifs and contrasting copper zari pallu.',
    specifications: JSON.stringify({ 'Blouse': 'Contrasting Silk', 'Weight': '550 grams', 'Care': 'Dry Clean' }),
    price: 7999.00,
    original_price: 10500.00,
    discount: 24,
    stock_quantity: 14,
    rating: 4.6,
    total_reviews: 11,
    is_featured: false,
    is_bestseller: false,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 8,
    name: 'Handcrafted Chanderi Cotton Silk Floral Saree',
    slug: 'handcrafted-chanderi-cotton-silk-floral-saree',
    sku: 'NS-CTN-001',
    category_id: 4,
    fabric: 'Chanderi Cotton',
    color: 'Ivory',
    occasion: 'Daily Wear',
    description: 'Breathable and feather-light handcrafted Chanderi cotton with pastel handblock floral prints and delicate gold border.',
    specifications: JSON.stringify({ 'Blouse Piece': 'Included', 'Length': '6.3 Meters', 'Care': 'Hand Wash with Mild Detergent' }),
    price: 2499.00,
    original_price: 3499.00,
    discount: 29,
    stock_quantity: 20,
    rating: 4.75,
    total_reviews: 18,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1610030469668-9359e9849202?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 9,
    name: 'Mulmul Cotton Indigo Handblock Kalamkari Saree',
    slug: 'mulmul-cotton-indigo-handblock-kalamkari-saree',
    sku: 'NS-CTN-002',
    category_id: 4,
    fabric: 'Mulmul Cotton',
    color: 'Blue',
    occasion: 'Daily Wear',
    description: 'Super soft 100% natural vegetable dyed mulmul cotton saree with traditional Kalamkari peacock motifs.',
    specifications: JSON.stringify({ 'Blouse': 'Matching Indigo Cotton', 'Origin': 'Rajasthan', 'Care': 'Gentle Wash' }),
    price: 1899.00,
    original_price: 2499.00,
    discount: 24,
    stock_quantity: 25,
    rating: 4.8,
    total_reviews: 35,
    is_featured: false,
    is_bestseller: true,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1610030469668-9359e9849202?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 10,
    name: 'Crimson Red Bridal Shalu Wedding Saree',
    slug: 'crimson-red-bridal-shalu-wedding-saree',
    sku: 'NS-WED-001',
    category_id: 5,
    fabric: 'Silk Shalu',
    color: 'Red',
    occasion: 'Wedding',
    description: 'The quintessential Maharashtrian bridal Shalu saree woven with auspicious lotus motifs and rich gold embroidery.',
    specifications: JSON.stringify({ 'Blouse': 'Heavy Embroidered Unstitched', 'Length': '6.3 Meters', 'Care': 'Dry Clean Only' }),
    price: 21999.00,
    original_price: 28999.00,
    discount: 24,
    stock_quantity: 4,
    rating: 5.0,
    total_reviews: 48,
    is_featured: true,
    is_bestseller: true,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 11,
    name: 'Pastel Peach Embroidered Organza Silk Saree',
    slug: 'pastel-peach-embroidered-organza-silk-saree',
    sku: 'NS-PTY-001',
    category_id: 6,
    fabric: 'Organza Silk',
    color: 'Peach',
    occasion: 'Party Wear',
    description: 'Delicate translucent organza saree adorned with scalloped cutwork borders and fine resham thread work.',
    specifications: JSON.stringify({ 'Blouse': 'Satin Silk with Work', 'Length': '5.5m + 0.8m Blouse', 'Care': 'Dry Clean Only' }),
    price: 5499.00,
    original_price: 7499.00,
    discount: 27,
    stock_quantity: 11,
    rating: 4.65,
    total_reviews: 16,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 12,
    name: 'Glamorous Wine Sequin Georgette Party Saree',
    slug: 'glamorous-wine-sequin-georgette-party-saree',
    sku: 'NS-PTY-002',
    category_id: 6,
    fabric: 'Georgette',
    color: 'Maroon',
    occasion: 'Party Wear',
    description: 'Dazzling cocktail saree drenched in monochromatic micro-sequins on fluid wine-hued georgette.',
    specifications: JSON.stringify({ 'Blouse': 'Velvet Blouse Piece Included', 'Care': 'Dry Clean Only' }),
    price: 4999.00,
    original_price: 6999.00,
    discount: 29,
    stock_quantity: 10,
    rating: 4.85,
    total_reviews: 23,
    is_featured: false,
    is_bestseller: true,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 13,
    name: 'Olive Green Linen Jute Daily Comfort Saree',
    slug: 'olive-green-linen-jute-daily-comfort-saree',
    sku: 'NS-DLY-001',
    category_id: 7,
    fabric: 'Linen',
    color: 'Green',
    occasion: 'Daily Wear',
    description: 'Eco-friendly organic linen drape with silver selvedge, exceptionally cool and comfortable for everyday wear.',
    specifications: JSON.stringify({ 'Blouse': 'Linen Striped Blouse', 'Length': '6.3 Meters', 'Care': 'Hand Wash' }),
    price: 1999.00,
    original_price: 2799.00,
    discount: 29,
    stock_quantity: 18,
    rating: 4.6,
    total_reviews: 9,
    is_featured: false,
    is_bestseller: false,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1610030469668-9359e9849202?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 14,
    name: 'Traditional 9-Yards Nauvari Kashta Paithani Saree',
    slug: 'traditional-9-yards-nauvari-kashta-paithani-saree',
    sku: 'NS-DSG-001',
    category_id: 8,
    fabric: 'Pure Silk',
    color: 'Maroon',
    occasion: 'Festival',
    description: 'Authentic 9-yard (Nauvari) Paithani silk saree crafted specially for traditional Maharashtrian Kashta drape during festivals and weddings.',
    specifications: JSON.stringify({ 'Length': '9 Yards (8.2 Meters)', 'Zari': 'Tested Gold Zari', 'Care': 'Dry Clean Only', 'Origin': 'Yeola' }),
    price: 17999.00,
    original_price: 23999.00,
    discount: 25,
    stock_quantity: 7,
    rating: 4.95,
    total_reviews: 22,
    is_featured: true,
    is_bestseller: true,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 15,
    name: 'Handloom Tussar Silk Madhubani Painted Saree',
    slug: 'handloom-tussar-silk-madhubani-painted-saree',
    sku: 'NS-DSG-002',
    category_id: 8,
    fabric: 'Tussar Silk',
    color: 'Beige',
    occasion: 'Festival',
    description: 'Rich natural textured beige Tussar silk handpainted with iconic Madhubani tree of life and peacock stories.',
    specifications: JSON.stringify({ 'Craft': 'Handpainted Madhubani', 'Silk Mark': 'Certified', 'Care': 'Dry Clean Only' }),
    price: 8999.00,
    original_price: 11999.00,
    discount: 25,
    stock_quantity: 8,
    rating: 4.8,
    total_reviews: 15,
    is_featured: false,
    is_bestseller: false,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 16,
    name: 'Traditional Bandhani Georgette Gotta Patti Saree',
    slug: 'traditional-bandhani-georgette-gotta-patti-saree',
    sku: 'NS-DSG-003',
    category_id: 8,
    fabric: 'Georgette',
    color: 'Red',
    occasion: 'Wedding',
    description: 'Hand-tied Jaipuri Rai Bandhej on soft pure georgette with elaborate handcrafted Gotta Patti border work.',
    specifications: JSON.stringify({ 'Blouse': 'Heavy Embroidered Georgette', 'Care': 'Dry Clean Only', 'Length': '6.3 Meters' }),
    price: 6999.00,
    original_price: 9499.00,
    discount: 26,
    stock_quantity: 11,
    rating: 4.75,
    total_reviews: 17,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 17,
    name: 'Lavender Zari Weave Chiffon Designer Saree',
    slug: 'lavender-zari-weave-chiffon-designer-saree',
    sku: 'NS-PTY-003',
    category_id: 6,
    fabric: 'Chiffon',
    color: 'Lavender',
    occasion: 'Party Wear',
    description: 'Ultra graceful lavender pure chiffon with delicate silver zari borders and crystal scattered motifs.',
    specifications: JSON.stringify({ 'Blouse': 'Included with Lace border', 'Care': 'Dry Clean Only' }),
    price: 4299.00,
    original_price: 5999.00,
    discount: 28,
    stock_quantity: 13,
    rating: 4.7,
    total_reviews: 12,
    is_featured: false,
    is_bestseller: false,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 18,
    name: 'Regal Purple Brocade Pure Silk Paithani Saree',
    slug: 'regal-purple-brocade-pure-silk-paithani-saree',
    sku: 'NS-PTH-004',
    category_id: 1,
    fabric: 'Pure Silk',
    color: 'Purple',
    occasion: 'Wedding',
    description: 'Deep royal purple pure silk Paithani with muniya border and vibrant multi-colored peacock pallu.',
    specifications: JSON.stringify({ 'Silk Mark': 'Certified', 'Origin': 'Yeola, Nashik', 'Care': 'Dry Clean Only' }),
    price: 15999.00,
    original_price: 20999.00,
    discount: 24,
    stock_quantity: 6,
    rating: 4.9,
    total_reviews: 20,
    is_featured: true,
    is_bestseller: false,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 19,
    name: 'Classic Off-White Golden Kasavu Silk Festive Saree',
    slug: 'classic-off-white-golden-kasavu-silk-festive-saree',
    sku: 'NS-SLK-003',
    category_id: 3,
    fabric: 'Pure Silk',
    color: 'White',
    occasion: 'Festival',
    description: 'Pristine off-white woven silk adorned with broad gold zari temple borders and auspicious mango buttis.',
    specifications: JSON.stringify({ 'Blouse': 'Included', 'Care': 'Dry Clean Only', 'Length': '6.3 Meters' }),
    price: 8499.00,
    original_price: 11500.00,
    discount: 26,
    stock_quantity: 9,
    rating: 4.8,
    total_reviews: 14,
    is_featured: false,
    is_bestseller: false,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 20,
    name: 'Sunlit Orange Pure Chanderi Zari Butti Saree',
    slug: 'sunlit-orange-pure-chanderi-zari-butti-saree',
    sku: 'NS-CTN-003',
    category_id: 4,
    fabric: 'Chanderi Cotton',
    color: 'Orange',
    occasion: 'Daily Wear',
    description: 'Lightweight sunny orange Chanderi with ashrafi gold zari coin buttis and translucent golden border.',
    specifications: JSON.stringify({ 'Blouse': 'Included', 'Care': 'Gentle Dry Wash', 'Origin': 'Madhya Pradesh' }),
    price: 2899.00,
    original_price: 3999.00,
    discount: 27,
    stock_quantity: 16,
    rating: 4.7,
    total_reviews: 8,
    is_featured: false,
    is_bestseller: false,
    is_new_arrival: true,
    images: [
      'https://images.unsplash.com/photo-1610030469668-9359e9849202?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 21,
    name: 'Exclusive Gold Tissue Bridal Designer Saree (Sample Out-Of-Stock)',
    slug: 'exclusive-gold-tissue-bridal-designer-saree-sample',
    sku: 'NS-DSG-004',
    category_id: 8,
    fabric: 'Tissue Silk',
    color: 'Gold',
    occasion: 'Wedding',
    description: 'High-end gold metallic tissue silk bridal drape with hand-embellished zardozi borders (Sample product to verify out-of-stock behavior).',
    specifications: JSON.stringify({ 'Blouse': 'Heavy Zardozi Raw Silk', 'Care': 'Specialist Dry Clean' }),
    price: 24999.00,
    original_price: 32999.00,
    discount: 24,
    stock_quantity: 0, // OUT OF STOCK TEST CASE
    rating: 5.0,
    total_reviews: 31,
    is_featured: false,
    is_bestseller: false,
    is_new_arrival: false,
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=80'
    ]
  }
];

const sampleCoupons = [
  { code: 'WELCOME10', description: 'Flat 10% off for first-time shoppers', discount_type: 'percentage', discount_value: 10, min_order_amount: 1499, max_discount_amount: 1500, start_date: '2026-01-01', expiry_date: '2027-12-31', usage_limit: 5000, times_used: 42, is_active: true },
  { code: 'FESTIVAL500', description: 'Flat ₹500 discount on festival orders', discount_type: 'flat', discount_value: 500, min_order_amount: 4999, max_discount_amount: 500, start_date: '2026-01-01', expiry_date: '2027-12-31', usage_limit: 2000, times_used: 18, is_active: true },
  { code: 'FREESHIP', description: 'Free shipping on all saree orders', discount_type: 'percentage', discount_value: 0, min_order_amount: 999, max_discount_amount: 0, start_date: '2026-01-01', expiry_date: '2027-12-31', usage_limit: 1000, times_used: 5, is_active: true }
];

const sampleDeliveryZones = [
  { zone_name: 'Tuljapur & Marathwada (Local)', pincode_prefixes: '413,414,431', delivery_charge: 0.00, free_delivery_above: 999.00, estimated_days: '1-2 Days (Express)' },
  { zone_name: 'Maharashtra & Goa', pincode_prefixes: '400,401,402,403,410,411,412,415,416,421,422,423,424,425,440,441,442,443,444,445', delivery_charge: 49.00, free_delivery_above: 1499.00, estimated_days: '2-3 Days' },
  { zone_name: 'Rest of India', pincode_prefixes: '1,2,3,5,6,7,8,9', delivery_charge: 99.00, free_delivery_above: 1999.00, estimated_days: '4-6 Days' }
];

const sampleFestivalOffers = [
  { title: 'Diwali Mahotsav Collection', festival_name: 'Diwali', banner_image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80', link_url: '/pages/shop.html?occasion=Festival', discount_tag: 'Up to 30% OFF' },
  { title: 'Gudi Padwa Shubh Vivah Special', festival_name: 'Gudi Padwa', banner_image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=80', link_url: '/pages/shop.html?category=paithani-sarees', discount_tag: 'Flat ₹500 OFF' },
  { title: 'Ganesh Festival Royal Paithanis', festival_name: 'Ganesh Festival', banner_image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80', link_url: '/pages/shop.html?fabric=Pure Silk', discount_tag: 'Exclusive Weaves' },
  { title: 'Makar Sankranti Black & Silk Sarees', festival_name: 'Makar Sankranti', banner_image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80', link_url: '/pages/shop.html?color=Blue', discount_tag: 'Festive Special' },
  { title: 'Wedding Season Shalu & Kanjeevaram', festival_name: 'Wedding Season', banner_image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80', link_url: '/pages/shop.html?occasion=Wedding', discount_tag: 'Bridal Collection' }
];

async function initializeDatabase() {
  console.log('--- Initializing Narayani Sarees Database ---');
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server successfully.');

    // Execute saree_shop.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'saree_shop.sql'), 'utf8');
    await connection.query(schemaSql);
    console.log('Schema tables created successfully.');

    await connection.changeUser({ database: process.env.DB_NAME || 'saree_shop' });

    // Seed Roles
    await connection.query(`
      INSERT INTO roles (id, name, description, permissions) VALUES
      (1, 'Super Admin', 'Full unrestricted store access', '["*"]'),
      (2, 'Manager', 'Product, Inventory, and Order management', '["products.*", "orders.*", "inventory.*", "coupons.*", "reviews.*"]'),
      (3, 'Staff', 'Order processing and customer support', '["orders.read", "orders.update", "returns.read", "returns.update"]')
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);

    // Passwords hash
    const adminPass = await bcrypt.hash('Admin@123', 10);
    const managerPass = await bcrypt.hash('Manager@123', 10);
    const staffPass = await bcrypt.hash('Staff@123', 10);
    const customerPass = await bcrypt.hash('Customer@123', 10);

    // Seed Admins
    await connection.query(`
      INSERT INTO admins (id, name, email, password_hash, role_id, phone, status) VALUES
      (1, 'Nikhil Mohite (Super Admin)', 'admin@narayanisarees.com', ?, 1, '+919359594007', 'active'),
      (2, 'Store Manager', 'manager@narayanisarees.com', ?, 2, '+919359594008', 'active'),
      (3, 'Operations Staff', 'staff@narayanisarees.com', ?, 3, '+919359594009', 'active')
      ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash);
    `, [adminPass, managerPass, staffPass]);

    // Seed Customer User
    await connection.query(`
      INSERT INTO users (id, name, email, phone, password_hash, role, is_verified) VALUES
      (1, 'Pooja Patil', 'customer@gmail.com', '9876543210', ?, 'customer', TRUE)
      ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash);
    `, [customerPass]);

    // Seed Categories
    for (const cat of sampleCategories) {
      await connection.query(`
        INSERT INTO categories (id, name, slug, description, image, is_featured, is_active, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), description=VALUES(description), image=VALUES(image);
      `, [cat.id, cat.name, cat.slug, cat.description, cat.image, cat.is_featured, true, cat.display_order]);
    }

    // Seed Products & Images
    for (const p of sampleProducts) {
      await connection.query(`
        INSERT INTO products (id, name, slug, sku, category_id, fabric, color, occasion, description, specifications, price, original_price, discount, stock_quantity, rating, total_reviews, is_featured, is_bestseller, is_new_arrival, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), stock_quantity=VALUES(stock_quantity), rating=VALUES(rating);
      `, [p.id, p.name, p.slug, p.sku, p.category_id, p.fabric, p.color, p.occasion, p.description, p.specifications, p.price, p.original_price, p.discount, p.stock_quantity, p.rating, p.total_reviews, p.is_featured, p.is_bestseller, p.is_new_arrival, true]);

      // Seed product images
      await connection.query(`DELETE FROM product_images WHERE product_id = ?`, [p.id]);
      for (let i = 0; i < p.images.length; i++) {
        await connection.query(`
          INSERT INTO product_images (product_id, image_url, is_primary, display_order)
          VALUES (?, ?, ?, ?)
        `, [p.id, p.images[i], i === 0, i]);
      }
    }

    // Seed Coupons
    for (const c of sampleCoupons) {
      await connection.query(`
        INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, expiry_date, usage_limit, times_used, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE discount_value=VALUES(discount_value);
      `, [c.code, c.description, c.discount_type, c.discount_value, c.min_order_amount, c.max_discount_amount, c.start_date, c.expiry_date, c.usage_limit, c.times_used, c.is_active]);
    }

    // Seed Delivery Zones
    for (const z of sampleDeliveryZones) {
      await connection.query(`
        INSERT INTO delivery_zones (zone_name, pincode_prefixes, delivery_charge, free_delivery_above, estimated_days, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE delivery_charge=VALUES(delivery_charge);
      `, [z.zone_name, z.pincode_prefixes, z.delivery_charge, z.free_delivery_above, z.estimated_days, true]);
    }

    // Seed Festival Offers
    for (const f of sampleFestivalOffers) {
      await connection.query(`
        INSERT INTO festival_offers (title, festival_name, banner_image, link_url, discount_tag, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title=VALUES(title);
      `, [f.title, f.festival_name, f.banner_image, f.link_url, f.discount_tag, true]);
    }

    // Seed Sample Reviews
    await connection.query(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment, is_verified_purchase, status) VALUES
      (1, 1, 'Pooja Patil', 5, 'Magnificent Royal Paithani!', 'The mor-bangadi pallu work is breathtaking! Bought it for my brother\\'s wedding in Tuljapur. Received so many compliments!', TRUE, 'approved'),
      (2, 1, 'Pooja Patil', 5, 'Pure Silk & Authentic Weave', 'High quality silk, true to images. Excellent packaging and fast delivery to Solapur.', TRUE, 'approved'),
      (4, 1, 'Pooja Patil', 5, 'Stunning Banarasi Brocade', 'Very rich color and finish. Looks even more luxurious in person!', TRUE, 'approved')
      ON DUPLICATE KEY UPDATE rating=VALUES(rating);
    `);

    console.log('Seeding complete! 20+ Sarees, Categories, Admin & Customer accounts, Delivery Zones, and Coupons seeded.');
  } catch (err) {
    console.error('MySQL Init / Seed Notice:', err.message);
    console.log('Saving local seed datasets into database/seed_data.json for instant offline/standalone database engine mode.');
    // Save seed data to json fallback file so backend can use it seamlessly if MySQL is offline
    const seedData = {
      categories: sampleCategories,
      products: sampleProducts,
      coupons: sampleCoupons,
      deliveryZones: sampleDeliveryZones,
      festivalOffers: sampleFestivalOffers
    };
    fs.writeFileSync(path.join(__dirname, 'seed_data.json'), JSON.stringify(seedData, null, 2));
    console.log('Saved seed_data.json successfully.');
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  initializeDatabase,
  sampleCategories,
  sampleProducts,
  sampleCoupons,
  sampleDeliveryZones,
  sampleFestivalOffers
};
