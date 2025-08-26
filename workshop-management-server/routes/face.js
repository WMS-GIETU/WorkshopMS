const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FaceData = require('../models/FaceData');
const FaceUpdateRequest = require('../models/FaceUpdateRequest');
const { protect, authorize } = require('../middleware/authMiddleware'); // Assuming these exist
const { sendEmail } = require('../config/email');
const adminEmail = process.env.ADMIN_EMAIL;

// @desc    Upload or update user's face descriptor
// @route   POST /api/face/upload
// @access  Private (Student)
router.post('/upload', protect, async (req, res) => {
  try {
    const { faceDescriptor } = req.body;
    const userId = req.user.userId;

    if (!faceDescriptor) {
      return res.status(400).json({ message: 'Face descriptor is required' });
    }

    // Find existing face data or create new
    let faceData = await FaceData.findOne({ userId });

    if (faceData) {
      // Update existing face data
      faceData.faceDescriptor = faceDescriptor;
    } else {
      // Create new face data
      faceData = new FaceData({
        userId,
        faceDescriptor,
      });
    }

    await faceData.save();

    // After successful face data upload, check for and fulfill any approved update requests
    const approvedFaceUpdateRequest = await FaceUpdateRequest.findOne({ userId, status: 'approved' });
    if (approvedFaceUpdateRequest) {
      approvedFaceUpdateRequest.status = 'fulfilled';
      approvedFaceUpdateRequest.processedAt = Date.now();
      await approvedFaceUpdateRequest.save();
    }

    res.status(200).json({ message: 'Face data uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Request to update face data
// @route   POST /api/face/request-update
// @access  Private (Student)
router.post('/request-update', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reason } = req.body; // Get reason from request body
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Reason for update is required.' });
    }

    // Check if there's an existing pending request
    const existingRequest = await FaceUpdateRequest.findOne({ userId, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending face data update request.' });
    }

    const faceUpdateRequest = new FaceUpdateRequest({
      userId: userId,
      reason: reason, // Store the reason
      status: 'pending',
    });

    await faceUpdateRequest.save();

    // Send email to admin
    await sendEmail(adminEmail, 'faceUpdateRequest', { 
      username: user.name, 
      rollNo: user.rollNo, 
      email: user.email, 
      requestId: faceUpdateRequest._id, 
      reason: reason 
    });

    res.status(200).json({ message: 'Face data update request submitted successfully. An admin will review it.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Approve face data update request
// @route   PUT /api/face/approve-update/:requestId
// @access  Private (Admin)
router.put('/approve-update/:requestId', protect, authorize(['admin']), async (req, res) => {
  try {
    const { requestId } = req.params;

    const faceUpdateRequest = await FaceUpdateRequest.findById(requestId);

    if (!faceUpdateRequest) {
      return res.status(404).json({ message: 'Face update request not found' });
    }

    if (faceUpdateRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending and cannot be approved.' });
    }

    faceUpdateRequest.status = 'approved';
    faceUpdateRequest.processedAt = Date.now();
    await faceUpdateRequest.save();

    // Notify the student
    const user = await User.findById(faceUpdateRequest.userId);
    if (user) {
      await sendEmail(user.email, 'faceUpdateNotification', { username: user.name, status: 'approved' });
    }

    res.status(200).json({ message: 'Face data update request approved successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Reject face data update request
// @route   PUT /api/face/reject-update/:requestId
// @access  Private (Admin)
router.put('/reject-update/:requestId', protect, authorize(['admin']), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body; // Get rejection reason from request body

    const faceUpdateRequest = await FaceUpdateRequest.findById(requestId);

    if (!faceUpdateRequest) {
      return res.status(404).json({ message: 'Face update request not found' });
    }

    if (faceUpdateRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending and cannot be rejected.' });
    }

    faceUpdateRequest.status = 'rejected';
    faceUpdateRequest.processedAt = Date.now();
    faceUpdateRequest.rejectionReason = rejectionReason; // Store rejection reason
    await faceUpdateRequest.save();

    // Notify the student
    const user = await User.findById(faceUpdateRequest.userId);
    if (user) {
      await sendEmail(user.email, 'Face Data Update Request Rejected', `Dear ${user.name},

Your request to update your face data has been rejected.
Reason: ${rejectionReason || 'No reason provided.'}

Please contact the administration for more information or submit a new request.

Regards,
Workshop Management System`);
    }

    res.status(200).json({ message: 'Face data update request rejected successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @desc    Approve face data update request directly via email link
// @route   GET /api/face/approve-update-request/:requestId
// @access  Public (via email link - security concern: no authentication)
router.get('/approve-update-request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    const faceUpdateRequest = await FaceUpdateRequest.findById(requestId);

    if (!faceUpdateRequest) {
      return res.status(404).send('Face update request not found.');
    }

    if (faceUpdateRequest.status !== 'pending') {
      return res.status(400).send('Request is not pending or has already been processed.');
    }

    faceUpdateRequest.status = 'approved';
    faceUpdateRequest.processedAt = Date.now();
    await faceUpdateRequest.save();

    // Notify the student
    const user = await User.findById(faceUpdateRequest.userId);
    if (user) {
      await sendEmail(user.email, 'faceUpdateNotification', { username: user.name, status: 'approved' });
    }

    res.status(200).send('Face data update request approved successfully. You can close this window.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error during approval.');
  }
});

// @desc    Reject face data update request directly via email link
// @route   GET /api/face/reject-update-request/:requestId
// @access  Public (via email link - security concern: no authentication)
router.get('/reject-update-request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;

    const faceUpdateRequest = await FaceUpdateRequest.findById(requestId);

    if (!faceUpdateRequest) {
      return res.status(404).send('Face update request not found.');
    }

    if (faceUpdateRequest.status !== 'pending') {
      return res.status(400).send('Request is not pending or has already been processed.');
    }

    faceUpdateRequest.status = 'rejected';
    faceUpdateRequest.processedAt = Date.now();
    await faceUpdateRequest.save();

    // Notify the student
    const user = await User.findById(faceUpdateRequest.userId);
    if (user) {
      await sendEmail(user.email, 'faceUpdateNotification', { username: user.name, status: 'rejected' });
    }

    res.status(200).send('Face data update request rejected successfully. You can close this window.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error during rejection.');
  }
});

// @desc    Get user's face data status
// @route   GET /api/face/status
// @access  Private (Student)
router.get('/status', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Fetching face status for userId:', userId);

    const faceData = await FaceData.findOne({ userId });
    console.log('FaceData found:', faceData);

    const hasFaceData = !!faceData;

    const pendingRequest = await FaceUpdateRequest.findOne({ userId, status: 'pending' });
    const approvedRequest = await FaceUpdateRequest.findOne({ userId, status: 'approved' }); // Check for approved request that hasn't been acted upon
    const rejectedRequest = await FaceUpdateRequest.findOne({ userId, status: 'rejected' }); // Check for rejected request
    const fulfilledRequest = await FaceUpdateRequest.findOne({ userId, status: 'fulfilled' }); // Check for fulfilled request

    let updateRequestStatus = 'none';
    let rejectionReason = '';

    if (pendingRequest) {
      updateRequestStatus = 'pending';
    } else if (approvedRequest) {
      updateRequestStatus = 'approved'; // Means student can now upload
    } else if (rejectedRequest) {
      updateRequestStatus = 'rejected'; // Means student needs to request again
      rejectionReason = rejectedRequest.rejectionReason; // Get rejection reason
    } else if (fulfilledRequest) {
      updateRequestStatus = 'none'; // Request was fulfilled, so no active request
    }


    res.status(200).json({
      hasFaceData,
      updateRequestStatus,
      rejectionReason, // Include rejection reason
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;