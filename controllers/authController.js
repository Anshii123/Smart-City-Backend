import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import User from '../models/User.js';

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      const error = new Error('User already exists');
      error.statusCode = 400;
      return next(error);
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('Please provide an email and password');
      error.statusCode = 400;
      return next(error);
    }

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      return next(error);
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      return next(error);
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
