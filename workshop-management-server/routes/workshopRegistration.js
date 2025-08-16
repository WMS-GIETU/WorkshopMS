const express = require('express');
const router = express.Router();
const WorkshopRegistration = require('../models/WorkshopRegistration');
const authMiddleware = require('../middleware/authMiddleware');

// Register for a workshop
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { workshopId } = req.body;
    const { userId } = req.user;

    // Check if already registered
    const existingRegistration = await WorkshopRegistration.findOne({ workshop: workshopId, user: userId });
    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this workshop' });
    }

    const newRegistration = new WorkshopRegistration({
      workshop: workshopId,
      user: userId,
    });

    await newRegistration.save();
    res.status(201).json({ message: 'Successfully registered for the workshop' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to register for the workshop' });
  }
});

// Get all users registered for a workshop
router.get('/workshop/:workshopId', authMiddleware, async (req, res) => {
  try {
    const { workshopId } = req.params;
    const registrations = await WorkshopRegistration.find({ workshop: workshopId }).populate('user', 'username email');
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch registrations' });
  }
});

// Get all workshops a user is registered for
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const registrations = await WorkshopRegistration.find({ user: userId }).populate('workshop');
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user registrations' });
  }
});

module.exports = router;
