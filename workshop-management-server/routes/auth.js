const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendEmail } = require('../config/email');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password, role, clubCode } = req.body;
  try {
    console.log('Registration attempt:', { username, email, role, clubCode });

    // Normalize username and clubCode to lowercase
    const normalizedUsername = username.toLowerCase();
    const normalizedClubCode = clubCode.toLowerCase();

    // Check if user already exists with same username/email and clubCode
    let user = await User.findOne({ 
      $or: [
        { username: normalizedUsername, clubCode: normalizedClubCode },
        { email, clubCode: normalizedClubCode }
      ]
    });
    if (user) {
      // If role already present, reject
      if (user.roles.includes(role)) {
        console.log('User already has role:', role);
        return res.status(400).json({ 
          message: 'User with this role already exists for this club.'
        });
      }
      // Add new role to roles array
      user.roles.push(role);
      await user.save();
      console.log('Role added to user:', normalizedUsername);
      return res.status(200).json({ message: 'Role added to existing user for this club.' });
    }

    // If user is trying to register as admin, check if admin already exists for this club
    if (role === 'admin') {
      const existingAdmin = await User.findOne({ 
        roles: 'admin', 
        clubCode: normalizedClubCode 
      });
      if (existingAdmin) {
        console.log('Admin already exists for club:', normalizedClubCode);
        return res.status(400).json({ 
          message: 'An admin already exists for this club. Only one admin is allowed per club.' 
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed for user:', normalizedUsername);
    user = new User({ 
      username: normalizedUsername, 
      email, 
      password: hashedPassword, 
      roles: [role], 
      clubCode: normalizedClubCode 
    });
    await user.save();

    console.log('User registered:', normalizedUsername);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student Registration - Request OTP
router.post('/register-student', async (req, res) => {
  const { username, email, name, rollNo } = req.body; // Added name and rollNo

  try {
    // Basic validation
    if (!username || !email || !name || !rollNo) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@giet.edu$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid college email format.' });
    }

    // Check if user with this email or roll number already exists
    const existingUser = await User.findOne({ $or: [{ email }, { rollNo }] });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email or roll number already exists.' });
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });

    // Save OTP to database
    await Otp.findOneAndUpdate(
      { email },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send OTP via email
    await sendEmail(email, 'studentOtp', { username, otp, name, rollNo });

    res.status(200).json({ message: 'OTP sent to your college email.' });

  } catch (error) {
    console.error('Student registration request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// Unified Login for all roles
router.post('/login', async (req, res) => {
  const { username, password, clubCode, email } = req.body;
  console.log('Login attempt:', { username, clubCode, email });

  try {
    let user;

    if (email) {
      // Student login: Find user by email
      const normalizedEmail = email.toLowerCase();
      user = await User.findOne({ email: normalizedEmail });

      // If a user is found, ensure they have the 'student' role
      if (user && !user.roles.includes('student')) {
        return res.status(403).json({ message: 'This login is for students only.' });
      }
    } else if (username && clubCode) {
      // Admin/Club member login: Find user by username and clubCode
      const normalizedUsername = username.toLowerCase();
      const normalizedClubCode = clubCode.toLowerCase();
      user = await User.findOne({ 
        username: normalizedUsername, 
        clubCode: normalizedClubCode 
      });
    } else {
      // If neither email nor username/clubCode is provided
      return res.status(400).json({ message: 'Please provide email or username and club code.' });
    }

    if (!user) {
      console.log('No user found with provided credentials.');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', user.username || user.email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT payload
    const tokenPayload = { 
      userId: user._id, 
      username: user.username,
      roles: user.roles,
      clubCode: user.clubCode
    };

    // Create user payload for the response
    const userPayload = {
      id: user._id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      clubCode: user.clubCode
    };

    // Add student-specific fields if the user is a student
    if (user.roles.includes('student')) {
      tokenPayload.name = user.name;
      tokenPayload.rollNo = user.rollNo;
      userPayload.name = user.name;
      userPayload.rollNo = user.rollNo;
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    console.log('Token generated for user:', user.username || user.email);
    res.json({ 
      token,
      user: userPayload
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if admin exists for a club
router.get('/check-admin/:clubCode', async (req, res) => {
  try {
    const { clubCode } = req.params;
    console.log('Checking admin for club code:', clubCode);
    
    const normalizedClubCode = clubCode.toLowerCase();
    const existingAdmin = await User.findOne({ 
      roles: 'admin', 
      clubCode: normalizedClubCode 
    });
    
    console.log('Database query result:', existingAdmin);
    
    if (existingAdmin) {
      console.log('Admin found:', existingAdmin.username);
      res.json({ 
        exists: true, 
        admin: {
          username: existingAdmin.username,
          email: existingAdmin.email,
          clubCode: existingAdmin.clubCode
        },
        message: 'Admin already exists for this club'
      });
    } else {
      console.log('No admin found for club code:', normalizedClubCode);
      res.json({ 
        exists: false, 
        message: 'No admin found for this club' 
      });
    }
  } catch (err) {
    console.error('Check admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


const { protect } = require('../middleware/authMiddleware'); // Corrected import

// Get all users for the logged-in admin's club
router.get('/users', protect, async (req, res) => {
  try {
    console.log('Request to /api/auth/users received');
    console.log('req.user:', req.user);
    const { roles, clubCode } = req.user;

    // Allow both admin and clubMember to view team members
    if (!roles.includes('admin') && !roles.includes('clubMember')) {
      console.log('Access denied. User is neither admin nor club member.');
      return res.status(403).json({ message: 'Access denied. Only admins and club members can view team members.' });
    }

    // Find all users with the same clubCode
    const users = await User.find({ clubCode }).select('-password');
    console.log('Users found:', users);
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user
router.delete('/users/:userId', protect, async (req, res) => {
  try {
    const { roles, clubCode } = req.user;
    const { userId } = req.params;

    // Ensure the user is an admin
    if (!roles.includes('admin')) {
      return res.status(403).json({ message: 'Access denied. Only admins can delete users.' });
    }

    const userToDelete = await User.findById(userId);

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Ensure the admin is deleting a user from their own club
    if (userToDelete.clubCode !== clubCode) {
      return res.status(403).json({ message: 'Access denied. You can only delete users from your own club.' });
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a user
router.put('/users/:userId', protect, async (req, res) => {
  try {
    const { roles, clubCode } = req.user;
    const { userId } = req.params;
    const { username, email } = req.body; // Removed newRoles from destructuring

    // Ensure the user is an admin
    if (!roles.includes('admin')) {
      return res.status(403).json({ message: 'Access denied. Only admins can edit users.' });
    }

    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Ensure the admin is editing a user from their own club
    if (userToUpdate.clubCode !== clubCode) {
      return res.status(403).json({ message: 'Access denied. You can only edit users from your own club.' });
    }

    userToUpdate.username = username || userToUpdate.username;
    userToUpdate.email = email || userToUpdate.email;
    // userToUpdate.roles = newRoles || userToUpdate.roles; // Removed to prevent role updates

    await userToUpdate.save();

    res.json({ message: 'User updated successfully.', user: userToUpdate });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student Registration - Verify OTP
router.post('/verify-student', async (req, res) => {
  const { username, email, password, otp, name, rollNo } = req.body; // Added name and rollNo

  try {
    // Find the OTP for the given email
    const otpData = await Otp.findOne({ email });

    if (!otpData) {
      return res.status(400).json({ message: 'OTP not found or expired.' });
    }

    // Verify the OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Check if OTP is expired (e.g., within 10 minutes)
    const tenMinutes = 10 * 60 * 1000;
    if (new Date() - otpData.createdAt > tenMinutes) {
      return res.status(400).json({ message: 'OTP has expired.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      roles: ['student'],
      clubCode: 'student', 
      name, // Save the student's name
      rollNo, // Save the student's roll number
    });

    await newUser.save();

    // Delete the used OTP
    await Otp.deleteOne({ email });

    res.status(201).json({ message: 'Student registered successfully!' });

  } catch (error) {
    console.error('Student verification error:', error);
    // Handle duplicate key error for rollNo
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A user with this roll number already exists.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});




// Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    res.json({ user });
  } catch (err) {
    console.error('Get user by ID error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;