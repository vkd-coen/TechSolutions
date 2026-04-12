require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose  = require('mongoose');
const connectDB = require('./db');
const Product   = require('../models/Product');

const products = [
  {
    name: 'Dell XPS 15 Laptop',
    description: 'High-performance laptop with Intel Core i7-11800H, 16 GB DDR4, 512 GB NVMe SSD, and a 15.6" OLED display. Ideal for professionals and creative work. Thoroughly tested and cleaned.',
    price: 649.99, category: 'Laptop', condition: 'Refurbished', brand: 'Dell',
    specifications: { Processor: 'Intel Core i7-11800H', RAM: '16 GB DDR4', Storage: '512 GB NVMe SSD', Display: '15.6" OLED 3.5K', OS: 'Windows 11 Pro' },
    stock: 3, featured: true,
    amazonUrl: 'https://www.amazon.ca', ebayUrl: 'https://www.ebay.ca'
  },
  {
    name: 'HP Pavilion Desktop PC',
    description: 'Reliable family desktop with Intel Core i5-10400, 8 GB RAM, and a 1 TB HDD. Runs Windows 11 smoothly. Ideal for everyday home and office use.',
    price: 349.99, category: 'Desktop', condition: 'Used', brand: 'HP',
    specifications: { Processor: 'Intel Core i5-10400', RAM: '8 GB DDR4', Storage: '1 TB HDD', OS: 'Windows 11 Home' },
    stock: 2, featured: false,
    amazonUrl: 'https://www.amazon.ca', ebayUrl: 'https://www.ebay.ca'
  },
  {
    name: 'Samsung 55" 4K Smart TV',
    description: 'Immersive 55-inch 4K Crystal UHD display with HDR10+ and the Samsung Tizen Smart TV platform. Includes original remote. Perfect centrepiece for any living room.',
    price: 499.99, category: 'TV', condition: 'Refurbished', brand: 'Samsung',
    specifications: { 'Screen Size': '55 inches', Resolution: '4K UHD (3840×2160)', HDR: 'HDR10+', Platform: 'Tizen OS', 'HDMI Ports': '3' },
    stock: 1, featured: true,
    amazonUrl: 'https://www.amazon.ca', ebayUrl: 'https://www.ebay.ca'
  },
  {
    name: 'Apple iPad (8th Gen)',
    description: 'Apple iPad with 10.2" Retina display, A12 Bionic chip, 32 GB storage. Great for browsing, streaming, and light productivity. Includes charging cable.',
    price: 279.99, category: 'Tablet', condition: 'Used', brand: 'Apple',
    specifications: { Display: '10.2" Retina', Chip: 'A12 Bionic', Storage: '32 GB', Connectivity: 'Wi-Fi', OS: 'iPadOS 16' },
    stock: 4, featured: false,
    amazonUrl: 'https://www.amazon.ca', ebayUrl: 'https://www.ebay.ca'
  },
  {
    name: 'Lenovo ThinkPad T480',
    description: 'Business-grade powerhouse renowned for its outstanding keyboard and military-spec durability. Intel Core i5-8250U, 8 GB RAM, 256 GB SSD. Dual battery delivers up to 24 hours of use.',
    price: 419.99, category: 'Laptop', condition: 'Refurbished', brand: 'Lenovo',
    specifications: { Processor: 'Intel Core i5-8250U', RAM: '8 GB DDR4', Storage: '256 GB SSD', Display: '14" FHD IPS', Battery: 'Dual — up to 24 h' },
    stock: 5, featured: true,
    amazonUrl: 'https://www.amazon.ca', ebayUrl: 'https://www.ebay.ca'
  },
  {
    name: 'Custom Gaming PC',
    description: 'Custom-built gaming powerhouse with AMD Ryzen 5 5600X, NVIDIA RTX 3060 12 GB, 16 GB RGB RAM, 1 TB NVMe SSD. Assembled, tested, and ready to play straight out of the box.',
    price: 1299.99, category: 'Desktop', condition: 'New', brand: 'Custom Build',
    specifications: { Processor: 'AMD Ryzen 5 5600X', GPU: 'NVIDIA RTX 3060 12 GB', RAM: '16 GB DDR4 3200 MHz', Storage: '1 TB NVMe SSD', Case: 'NZXT H510 Black', OS: 'Windows 11 Home' },
    stock: 2, featured: true,
    amazonUrl: 'https://www.amazon.ca', ebayUrl: 'https://www.ebay.ca'
  },
  {
    name: 'LG 43" 4K Smart TV',
    description: 'LG 43-inch 4K UHD Smart TV with ThinQ AI voice control, webOS platform, and Alexa/Google Assistant built in. Perfect for smaller rooms or a bedroom setup.',
    price: 319.99, category: 'TV', condition: 'Used', brand: 'LG',
    specifications: { 'Screen Size': '43 inches', Resolution: '4K UHD', Platform: 'webOS', HDR: 'HDR10 Pro', 'Voice Assistant': 'ThinQ AI, Alexa, Google' },
    stock: 2, featured: false,
    amazonUrl: 'https://www.amazon.ca', ebayUrl: 'https://www.ebay.ca'
  },
  {
    name: 'Microsoft Surface Pro 7',
    description: 'Versatile 2-in-1 laptop/tablet with Intel Core i5, 8 GB RAM, 256 GB SSD and a stunning 12.3" PixelSense display. Includes Surface Type Cover keyboard.',
    price: 449.99, category: 'Tablet', condition: 'Used', brand: 'Microsoft',
    specifications: { Processor: 'Intel Core i5-1035G4', RAM: '8 GB', Storage: '256 GB SSD', Display: '12.3" PixelSense', OS: 'Windows 11 Pro' },
    stock: 2, featured: false,
    amazonUrl: 'https://www.amazon.ca', ebayUrl: 'https://www.ebay.ca'
  },
  {
    name: 'ASUS ROG Gaming Laptop',
    description: 'Serious gaming laptop with AMD Ryzen 7 5800H, RTX 3070, 16 GB RAM, and a 144 Hz IPS display. Handles all current titles at high settings. Well maintained with original charger.',
    price: 779.99, category: 'Laptop', condition: 'Used', brand: 'ASUS',
    specifications: { Processor: 'AMD Ryzen 7 5800H', GPU: 'NVIDIA RTX 3070 8 GB', RAM: '16 GB DDR4', Storage: '512 GB NVMe SSD', Display: '15.6" FHD 144 Hz' },
    stock: 1, featured: true,
    amazonUrl: 'https://www.amazon.ca', ebayUrl: 'https://www.ebay.ca'
  },
  {
    name: 'Netgear Nighthawk Wi-Fi 6 Router',
    description: 'Next-generation Wi-Fi 6 (AX3000) dual-band router. Achieve faster speeds and better coverage across your home or small office. Brand new in box.',
    price: 89.99, category: 'Accessory', condition: 'New', brand: 'Netgear',
    specifications: { Standard: 'Wi-Fi 6 (802.11ax)', Speed: 'AX3000 (3 Gbps)', Bands: 'Dual Band', Ports: '1 WAN + 4 GbE LAN', Coverage: 'Up to 140 m²' },
    stock: 8, featured: false,
    amazonUrl: 'https://www.amazon.ca', ebayUrl: 'https://www.ebay.ca'
  }
];

(async () => {
  try {
    await connectDB();
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`✓  Seeded ${products.length} products`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
})();
