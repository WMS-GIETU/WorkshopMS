const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FaceData = require('../models/FaceData');
const FaceUpdateRequest = require('../models/FaceUpdateRequest');
const { protect, authorize } = require('../middleware/authMiddleware');
const { sendEmail, emailTemplates } = require('../config/email');

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

    // Fetch user details for the email
    const user = await User.findById(userId);

    if (user && process.env.ADMIN_EMAIL) {
      await sendEmail(
        process.env.ADMIN_EMAIL,
        'faceUpdateRequest',
        {
          username: user.username,
          rollNo: user.rollNo,
          email: user.email,
          reason: reason,
          requestId: updateRequest._id,
        }
      );
    }

    res.status(201).json({ message: 'Face data update request submitted successfully', updateRequest });
  } catch (error) {
    console.error('Error submitting face data update request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to approve face data update request
router.get('/approve-update-request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const updateRequest = await FaceUpdateRequest.findById(requestId);

    if (!updateRequest) {
      return res.status(404).send('Face update request not found.');
    }

    if (updateRequest.status !== 'pending') {
      return res.status(400).send(`Request already ${updateRequest.status}.`);
    }

    updateRequest.status = 'approved';
    await updateRequest.save();

    // Optionally, delete existing face data for the user if they are updating
    await FaceData.deleteOne({ userId: updateRequest.userId });

    // Send email notification to the student
    const user = await User.findById(updateRequest.userId);
    if (user) {
      await sendEmail(
        user.email,
        'faceUpdateNotification',
        {
          username: user.username,
          status: 'approved',
        }
      );
    }

    res.status(200).send('Face data update request approved. Student notified.');
  } catch (error) {
    console.error('Error approving face data update request:', error);
    res.status(500).send('Internal server error during approval.');
  }
});

// Route to reject face data update request
router.get('/reject-update-request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const updateRequest = await FaceUpdateRequest.findById(requestId);

    if (!updateRequest) {
      return res.status(404).send('Face update request not found.');
    }

    if (updateRequest.status !== 'pending') {
      return res.status(400).send(`Request already ${updateRequest.status}.`);
    }

    updateRequest.status = 'rejected';
    await updateRequest.save();

    // Send email notification to the student
    const user = await User.findById(updateRequest.userId);
    if (user) {
      await sendEmail(
        user.email,
        'faceUpdateNotification',
        {
          username: user.username,
          status: 'rejected',
        }
      );
    }

    res.status(200).send('Face data update request rejected. Student notified.');
  } catch (error) {
    console.error('Error rejecting face data update request:', error);
    res.status(500).send('Internal server error during rejection.');
  }
});

module.exports = router;