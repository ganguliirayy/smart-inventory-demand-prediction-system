const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rxflow_secret_key_2024';

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
};

// Helper function to log activity
const logActivity = async (userId, type, message, icon, color) => {
  try {
    await Activity.create({ user: userId, type, message, icon, color });
  } catch (err) {
    console.error('Activity log error:', err);
  }
};

// ==========================================
// POST /api/auth/signup - Register new user
// ==========================================
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered. Please login instead.' 
      });
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: emailLower,
      password: password, // Will be hashed by mongoose pre-save
      phone: phone || '',
      role: 'customer',
      isAdmin: false,
    });

    // Generate token
    const token = generateToken(user._id);

    // Log activity
    await logActivity(user._id, 'signup', `New account created: ${user.name}`, '🎉', '#10b981');

    console.log(`✅ New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin: user.isAdmin,
        displayRole: '🟢 Customer',
      },
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during signup. Please try again.' 
    });
  }
});

// ==========================================
// POST /api/auth/login - Login user
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Login attempt for: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const emailLower = email.toLowerCase().trim();

    // ADMIN LOGIN - Hardcoded check first
    if (emailLower === 'admin@gmail.com' && password === 'admin123') {
      // Check if admin user exists in DB, if not create it
      let adminUser = await User.findOne({ email: emailLower });
      
      if (!adminUser) {
        console.log('🔧 Creating admin user...');
        adminUser = await User.create({
          name: 'Admin',
          email: emailLower,
          password: 'admin123',
          role: 'admin',
          isAdmin: true,
        });
      }

      const token = generateToken(adminUser._id);
      await logActivity(adminUser._id, 'login', 'Admin logged in', '🔐', '#6366f1');

      console.log('✅ Admin login successful');

      return res.json({
        success: true,
        message: 'Admin login successful',
        token,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: 'admin',
          isAdmin: true,
          displayRole: '🔴 Admin',
        },
      });
    }

    // CUSTOMER LOGIN - Check from database
    const user = await User.findOne({ email: emailLower });

    if (!user) {
      console.log(`❌ User not found: ${emailLower}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password using bcrypt compare
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log(`❌ Invalid password for: ${emailLower}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log activity
    await logActivity(user._id, 'login', `${user.name} logged in`, '🔐', '#10b981');

    console.log(`✅ Login successful: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        isAdmin: user.isAdmin,
        displayRole: user.isAdmin ? '🔴 Admin' : '🟢 Customer',
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login. Please try again.' 
    });
  }
});

// ==========================================
// POST /api/auth/logout
// ==========================================
router.post('/logout', async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// GET /api/auth/me - Get current user
// ==========================================
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin: user.isAdmin,
        displayRole: user.isAdmin ? '🔴 Admin' : '🟢 Customer',
      },
    });
  } catch (error) {
    console.error('Auth/me error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

module.exports = router;