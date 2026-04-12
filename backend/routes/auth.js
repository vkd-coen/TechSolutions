const express  = require('express');
const router    = express.Router();
const { body, validationResult } = require('express-validator');
const jwt       = require('jsonwebtoken');
const User      = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ── Helpers ───────────────────────────────────────────────────────────────────

// Password rules applied both here (backend) and in auth.js (frontend).
// Backend validation is the authoritative check — frontend is just UX.
const passwordRules = body('password')
  .isLength({ min: 8 }).withMessage('At least 8 characters')
  .matches(/[A-Z]/).withMessage('At least one uppercase letter')
  .matches(/[a-z]/).withMessage('At least one lowercase letter')
  .matches(/[0-9]/).withMessage('At least one number')
  .matches(/[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/)
  .withMessage('At least one special character');

const sendToken = (user, statusCode, res, message) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

  res.status(statusCode)
    .cookie('jwt', token, {
      httpOnly: true,                                    // JS cannot read this cookie
      sameSite: 'strict',                                // CSRF protection
      secure: process.env.NODE_ENV === 'production',     // HTTPS only in prod
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    .json({
      success: true,
      message,
      data: {
        user: {
          id:        user._id,
          firstName: user.firstName,
          lastName:  user.lastName,
          email:     user.email,
          role:      user.role
        }
      }
    });
};

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
    return false;
  }
  return true;
};

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  passwordRules
], async (req, res) => {
  if (!validate(req, res)) return;

  const { firstName, lastName, email, password } = req.body;
  try {
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }
    const user = await User.create({ firstName, lastName, email, password });
    sendToken(user, 201, res, 'Account created successfully');
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  if (!validate(req, res)) return;

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');

    // Generic error — never reveal whether the email exists
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    sendToken(user, 200, res, 'Login successful');
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.cookie('jwt', '', { httpOnly: true, sameSite: 'strict', expires: new Date(0) })
     .json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me  — returns current user (no password field)
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    data: {
      user: {
        id:             user._id,
        firstName:      user.firstName,
        lastName:       user.lastName,
        email:          user.email,
        phone:          user.phone,
        address:        user.address,
        role:           user.role,
        paymentMethods: user.paymentMethods,
        createdAt:      user.createdAt
      }
    }
  });
});

// PUT /api/auth/profile
router.put('/profile', protect, [
  body('firstName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('lastName').optional().trim().notEmpty().isLength({ max: 50 }),
  body('phone').optional().trim(),
  body('address').optional().isObject()
], async (req, res) => {
  if (!validate(req, res)) return;

  const allowed  = ['firstName', 'lastName', 'phone', 'address'];
  const updates  = Object.fromEntries(allowed.filter(f => req.body[f] !== undefined).map(f => [f, req.body[f]]));

  try {
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated', data: { user } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/auth/password
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword', 'newPassword').isLength({ min: 8 }).withMessage('At least 8 characters')
    .matches(/[A-Z]/).withMessage('At least one uppercase letter')
    .matches(/[a-z]/).withMessage('At least one lowercase letter')
    .matches(/[0-9]/).withMessage('At least one number')
    .matches(/[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/).withMessage('At least one special character')
], async (req, res) => {
  if (!validate(req, res)) return;

  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
