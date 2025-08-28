const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FaceData = require('../models/FaceData');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const faceData = await FaceData.find().populate('user');
    res.json(faceData);
  } catch (error) {
    console.error('Error getting face data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/recognize', authMiddleware, async (req, res) => {
  const { descriptor } = req.body;

  try {
    const faceData = await FaceData.find();
    const faceMatcher = new faceapi.FaceMatcher(
      faceData.map((fd) => {
        const descriptions = fd.descriptions.map((desc) => new Float32Array(Object.values(desc)));
        return new faceapi.LabeledFaceDescriptors(fd.user.toString(), descriptions);
      })
    );

    const bestMatch = faceMatcher.findBestMatch(new Float32Array(Object.values(descriptor)));

    if (bestMatch.label === 'unknown') {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(bestMatch.label);
    res.json({ user });
  } catch (error) {
    console.error('Error recognizing face:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;