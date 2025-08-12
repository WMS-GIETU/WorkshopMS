const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// Login
router.post('/login', async (req, res) => {
  const { username, password, clubCode } = req.body;
  console.log('Login attempt:', { username, clubCode });
  try {
    // Normalize username and clubCode to lowercase
    const normalizedUsername = username.toLowerCase();
    const normalizedClubCode = clubCode.toLowerCase();

    // Find user by username and clubCode
    const user = await User.findOne({ 
      username: normalizedUsername, 
      clubCode: normalizedClubCode 
    });
    console.log('User found:', user ? user.username : 'No user');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ 
      userId: user._id, 
      username: user.username,
      roles: user.roles,
      clubCode: user.clubCode
    }, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log('Token generated for user:', user.username);
    
    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        clubCode: user.clubCode
      }
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


const authMiddleware = require('../middleware/authMiddleware');

// Get all users for the logged-in admin's club
router.get('/users', authMiddleware, async (req, res) => {
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
router.delete('/users/:userId', authMiddleware, async (req, res) => {
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
router.put('/users/:userId', authMiddleware, async (req, res) => {
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

module.exports = router;