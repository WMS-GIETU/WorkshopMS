const express = require('express');
const router = express.Router();
const WorkshopRegistration = require('../models/WorkshopRegistration');
const { protect } = require('../middleware/authMiddleware'); // Corrected import

// Register for a workshop
router.post('/register', protect, async (req, res) => {
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
router.get('/workshop/:workshopId', protect, async (req, res) => {
  try {
    const { workshopId } = req.params;
    const registrations = await WorkshopRegistration.find({ workshop: workshopId }).populate('user', 'username email');
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch registrations' });
  }
});

// Get all workshops a user is registered for
router.get('/my-workshops', protect, async (req, res) => {
  try {
    const registrations = await WorkshopRegistration.find({ user: req.user.userId }).populate('workshop');
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user registrations' });
  }
});

module.exports = router;
