const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Payment methods store only tokenized data — NEVER raw card numbers.
// Actual card processing must go through Stripe or an equivalent PCI-compliant provider.
const paymentMethodSchema = new mongoose.Schema({
  last4:                 { type: String, required: true },
  brand:                 { type: String, required: true }, // visa, mastercard, amex…
  expMonth:              { type: Number, required: true },
  expYear:               { type: Number, required: true },
  stripePaymentMethodId: { type: String },                 // Stripe PM token
  isDefault:             { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
  firstName: {
    type: String, required: [true, 'First name is required'],
    trim: true, maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String, required: [true, 'Last name is required'],
    trim: true, maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String, required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false   // never returned in queries unless explicitly requested
  },
  phone: { type: String, trim: true },
  address: {
    street:     String,
    city:       String,
    province:   String,
    postalCode: String,
    country:    { type: String, default: 'Canada' }
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  paymentMethods:  [paymentMethodSchema],
  stripeCustomerId: String
}, { timestamps: true });

// Hash password before every save that touches it
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Constant-time comparison to prevent timing attacks
userSchema.methods.comparePassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
