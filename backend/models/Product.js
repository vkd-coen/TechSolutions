const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Product name is required'],
    trim: true, maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String, required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative']
  },
  category: {
    type: String, required: [true, 'Category is required'],
    enum: ['Laptop', 'Desktop', 'TV', 'Tablet', 'Phone', 'Accessory', 'Other']
  },
  condition: {
    type: String, required: [true, 'Condition is required'],
    enum: ['New', 'Used', 'Refurbished']
  },
  brand:          { type: String, trim: true },
  specifications: { type: Map, of: String },
  images:         [{ type: String, trim: true }],
  amazonUrl:      { type: String, trim: true },
  ebayUrl:        { type: String, trim: true },
  stock:          { type: Number, default: 1, min: 0 },
  sold:           { type: Number, default: 0 },
  featured:       { type: Boolean, default: false }
}, { timestamps: true });

// Full-text search index
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
