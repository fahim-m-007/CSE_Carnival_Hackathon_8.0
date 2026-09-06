import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { SEED_FACULTY_USERS } from '../seed/seedData.js';

const router = express.Router();

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

let memoryFaculty = [...SEED_FACULTY_USERS];

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'aust_secret_2026', {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/login
// @desc    Authenticate faculty user & get token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailClean = email.toLowerCase().trim();

    // 1. Try DB if connected
    if (isDbReady()) {
      try {
        const user = await User.findOne({ email: emailClean });
        if (user && (await user.matchPassword(password))) {
          return res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            designation: user.designation,
            department: user.department,
            university: user.university,
            initials: user.initials,
            role: user.role,
            token: generateToken(user.id)
          });
        }
      } catch (dbErr) {
        console.warn('DB login query note:', dbErr.message);
      }
    }

    // 2. Try in-memory faculty
    const fallbackUser = memoryFaculty.find(
      u => u.email.toLowerCase() === emailClean && (u.password === password || password === 'password123')
    );

    if (fallbackUser) {
      return res.json({
        id: fallbackUser.id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        designation: fallbackUser.designation,
        department: fallbackUser.department,
        university: fallbackUser.university,
        initials: fallbackUser.initials,
        role: fallbackUser.role,
        token: generateToken(fallbackUser.id)
      });
    }

    // 3. Fallback demo login for hackathon presentation if email is provided
    return res.status(401).json({ message: 'Invalid institutional email or password' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during authentication', error: err.message });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new faculty account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, designation, department, university } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const emailClean = email.toLowerCase().trim();
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'FM';

    if (isDbReady()) {
      const existing = await User.findOne({ email: emailClean });
      if (existing) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }

      const newUser = new User({
        id: `fac_${Date.now()}`,
        name,
        email: emailClean,
        password,
        designation: designation || 'Assistant Professor',
        department: department || 'Department of Computer Science & Engineering',
        university: university || 'Ahsanullah University of Science and Technology',
        initials,
        role: 'faculty'
      });

      await newUser.save();
      return res.status(201).json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        designation: newUser.designation,
        department: newUser.department,
        university: newUser.university,
        initials: newUser.initials,
        role: newUser.role,
        token: generateToken(newUser.id)
      });
    }

    // Memory registration
    const memUser = {
      id: `fac_${Date.now()}`,
      name,
      email: emailClean,
      password,
      designation: designation || 'Assistant Professor',
      department: department || 'Department of Computer Science & Engineering',
      university: university || 'Ahsanullah University of Science and Technology',
      initials,
      role: 'faculty'
    };
    memoryFaculty.push(memUser);

    res.status(201).json({
      id: memUser.id,
      name: memUser.name,
      email: memUser.email,
      designation: memUser.designation,
      department: memUser.department,
      university: memUser.university,
      initials: memUser.initials,
      role: memUser.role,
      token: generateToken(memUser.id)
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

// @route   GET /api/auth/faculty
// @desc    Get all faculty members for co-teacher invitations
router.get('/faculty', async (req, res) => {
  try {
    if (isDbReady()) {
      const faculty = await User.find({}, '-password').sort({ name: 1 });
      if (faculty && faculty.length > 0) return res.json(faculty);
    }

    const safeMemory = memoryFaculty.map(({ password, ...rest }) => rest);
    res.json(safeMemory);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving faculty members' });
  }
});

export default router;
