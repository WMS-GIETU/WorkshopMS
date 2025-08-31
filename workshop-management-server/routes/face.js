const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FaceData = require('../models/FaceData');
const FaceUpdateRequest = require('../models/FaceUpdateRequest');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize(['admin', 'clubMember']), async (req, res) => {
  try {
    const faceData = await FaceData.find().populate('userId');
    res.json(faceData);
  } catch (error) {
    console.error('Error getting face data:', error.message, error.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/status', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const faceData = await FaceData.findOne({ userId });
    const updateRequest = await FaceUpdateRequest.findOne({ userId }).sort({ createdAt: -1 });

    res.json({
      hasFaceData: !!faceData,
      updateRequestStatus: updateRequest ? updateRequest.status : 'none',
    });
  } catch (error) {
    console.error('Error getting face status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/save', protect, authorize(['student']), async (req, res) => {
  const { descriptors } = req.body;
  const userId = req.user.userId;

  if (!descriptors || !Array.isArray(descriptors) || descriptors.length === 0) {
    return res.status(400).json({ message: 'Invalid descriptors format' });
  }

  try {
    let faceData = await FaceData.findOne({ userId });

    if (faceData) {
      faceData.faceDescriptors = descriptors;
      await faceData.save();
    } else {
      faceData = await FaceData.create({ userId, faceDescriptors: descriptors });
    }

    res.status(201).json({ message: 'Face data saved successfully' });
  } catch (error) {
    console.error('Error saving face data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/request-update', protect, authorize(['student']), async (req, res) => {
  const { reason } = req.body;
  const userId = req.user.userId;

  try {
    const updateRequest = await FaceUpdateRequest.create({ userId, reason });
    res.status(201).json({ message: 'Face data update request submitted successfully', updateRequest });
  } catch (error) {
    console.error('Error submitting face data update request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;