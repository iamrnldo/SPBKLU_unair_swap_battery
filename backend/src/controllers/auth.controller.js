const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const User = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Register mobile user
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 400);
    }

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return sendError(res, 'Email already registered', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User in database
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return sendSuccess(res, 'User registered successfully', {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      token
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * General Login (Admin & User)
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    // Find user in PostgreSQL
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    // Sign Token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return sendSuccess(res, 'Login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth Login & Registration (Real SDK Verification)
 */
const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return sendError(res, 'Google ID Token is required', 400);
    }

    // Get Web Client ID from environment variables
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '58586788358-f5b1ig0vnnmp34mudo6j6ftrcmr00n0k.apps.googleusercontent.com';

    let email;
    let name;

    try {
      // Initialize Google OAuth2Client
      const { OAuth2Client } = require('google-auth-library');
      const googleClient = new OAuth2Client(googleClientId);
      
      // Verify ID Token securely against Google's servers
      console.log('Verifying Google ID Token with Client ID:', googleClientId);
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: [
          googleClientId,
          '58586788358-e9evtelc8nh5b3lti4jq344d0ev9mvdo.apps.googleusercontent.com' // also accept the Android Client ID
        ]
      });
      
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      console.log('Google verification successful for email:', email);
    } catch (verifError) {
      console.error('Google token verification failed:', verifError.message);
      return sendError(res, 'Verifikasi Google Token gagal: ' + verifError.message, 401);
    }

    if (!email) {
      return sendError(res, 'Email not provided by Google OAuth', 400);
    }

    // Check if user already exists in PostgreSQL
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Auto-register new users with a random secure password
      const dummyPassword = await bcrypt.hash(`google_${Date.now()}`, 10);
      user = await User.create({
        name,
        email,
        password: dummyPassword,
        role: 'user'
      });
      console.log('New user created via Google login:', email);
    }

    // Sign JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return sendSuccess(res, 'Google login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Facebook OAuth Login & Registration
 */
const facebookLogin = async (req, res, next) => {
  try {
    const { accessToken, email: mockEmail, name: mockName } = req.body;

    let email = mockEmail || `facebook_${Date.now()}@facebook.com`;
    let name = mockName || 'Facebook User';

    // --- PRODUCTION GRAPH API VERIFICATION (Uncomment when you integrate Facebook Graph API) ---
    /*
    if (!accessToken) {
      return sendError(res, 'Facebook Access Token is required', 400);
    }
    const axios = require('axios');
    const fbRes = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
    email = fbRes.data.email || `fb_${fbRes.data.id}@facebook.com`;
    name = fbRes.data.name;
    */

    // Check if user already exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      const dummyPassword = await bcrypt.hash(`facebook_${Date.now()}`, 10);
      user = await User.create({
        name,
        email,
        password: dummyPassword,
        role: 'user'
      });
    }

    // Sign JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return sendSuccess(res, 'Facebook login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  login,
  googleLogin,
  facebookLogin
};
