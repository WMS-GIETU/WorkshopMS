const express = require('express');
const WorkshopRequest = require('../models/WorkshopRequest');
const Workshop = require('../models/Workshop');
const User = require('../models/User');
const WorkshopImage = require('../models/WorkshopImage'); // Import the new model
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import fs to read the file

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb('Error: Images only (jpeg, jpg, png)!');
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = express.Router();

// Submit workshop request (Club members only)
router.post('/submit', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { workshopName, date, time, location, topic, description, maxParticipants } = req.body;
    const { userId, username, roles, clubCode } = req.user;

    // Check if user is a club member
    if (!roles.includes('clubMember')) {
      return res.status(403).json({ message: 'Only club members can submit workshop requests' });
    }

    const workshopRequest = new WorkshopRequest({
      requesterId: userId,
      requesterName: username,
      requesterRole: 'clubMember',
      clubCode,
      workshopName,
      date,
      time,
      location,
      topic,
      description,
      maxParticipants,
      image: req.file ? req.file.path : '' // Save image path
    });

    await workshopRequest.save();

    res.status(201).json({ 
      message: 'Workshop request submitted successfully',
      requestId: workshopRequest._id
    });
  } catch (error) {
    console.error('Submit request error:', error);
    res.status(500).json({ message: 'Failed to submit workshop request' });
  }
});

// Get workshop requests (Admin can see all, Club members see their own)
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const { userId, roles, clubCode } = req.user;
    let requests;

    if (roles.includes('admin')) {
      // Admin can see all requests from their club
      requests = await WorkshopRequest.find({ clubCode }).sort({ createdAt: -1 });
    } else {
      // Club members can only see their own requests
      requests = await WorkshopRequest.find({ requesterId: userId }).sort({ createdAt: -1 });
    }

    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Failed to fetch workshop requests' });
  }
});

// Approve workshop request (Admin only) - This will create the workshop
router.put('/approve/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId, username, roles, clubCode } = req.user;
    const { adminResponse } = req.body;

    // Check if user is admin
    if (!roles.includes('admin')) {
      return res.status(403).json({ message: 'Only admins can approve workshop requests' });
    }

    const request = await WorkshopRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Workshop request not found' });
    }

    // Check if admin belongs to the same club
    if (request.clubCode !== clubCode) {
      return res.status(403).json({ message: 'You can only approve requests from your club' });
    }

    // Check if request is already processed
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    let workshopImageId = null;
    if (request.image) { // If an image was submitted with the request
      const imagePath = path.join(__dirname, '..', request.image); // Construct full path
      const imageBuffer = fs.readFileSync(imagePath); // Read the image file into a buffer
      const contentType = path.extname(request.image).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'; // Determine content type

      const newWorkshopImage = new WorkshopImage({
        image: {
          data: imageBuffer,
          contentType: contentType,
        },
        // workshopId will be set after workshop is saved
        uploadedBy: userId, // Admin approving the request
        clubCode: clubCode,
      });
      await newWorkshopImage.save();
      workshopImageId = newWorkshopImage._id;

      // Optionally, delete the file from the uploads folder after saving to DB
      fs.unlinkSync(imagePath);
    }

    // Create the workshop from the approved request
    const workshop = new Workshop({
      name: request.workshopName,
      date: request.date,
      time: request.time,
      location: request.location,
      topic: request.topic,
      description: request.description,
      maxParticipants: request.maxParticipants,
      clubCode: request.clubCode,
      image: workshopImageId, // Use the ID of the WorkshopImage
      createdBy: userId
    });

    await workshop.save();

    // Now that workshop is saved, update the workshopId in WorkshopImage if an image was processed
    if (workshopImageId) {
      await WorkshopImage.findByIdAndUpdate(workshopImageId, { workshopId: workshop._id });
    }

    // Update request status
    request.status = 'approved';
    request.adminId = userId;
    request.adminName = username;
    request.adminResponse = adminResponse || 'Request approved and workshop created';
    request.workshopId = workshop._id; // Link to created workshop
    request.updatedAt = new Date();

    await request.save();

    res.json({ 
      message: 'Workshop request approved and workshop created successfully',
      request: request,
      workshop: workshop
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Failed to approve workshop request' });
  }
});

// Reject workshop request (Admin only)
router.put('/reject/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId, username, roles, clubCode } = req.user;
    const { adminResponse } = req.body;

    // Check if user is admin
    if (!roles.includes('admin')) {
      return res.status(403).json({ message: 'Only admins can reject workshop requests' });
    }

    const request = await WorkshopRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Workshop request not found' });
    }

    // Check if admin belongs to the same club
    if (request.clubCode !== clubCode) {
      return res.status(403).json({ message: 'You can only reject requests from your club' });
    }

    // Check if request is already processed
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    request.status = 'rejected';
    request.adminId = userId;
    request.adminName = username;
    request.adminResponse = adminResponse || 'Request rejected';
    request.updatedAt = new Date();

    await request.save();

    res.json({ 
      message: 'Workshop request rejected',
      request: request
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Failed to reject workshop request' });
  }
});

// Get request statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { userId, roles, clubCode } = req.user;
    let stats;

    if (roles.includes('admin')) {
      // Admin stats for their club
      const totalRequests = await WorkshopRequest.countDocuments({ clubCode });
      const pendingRequests = await WorkshopRequest.countDocuments({ clubCode, status: 'pending' });
      const approvedRequests = await WorkshopRequest.countDocuments({ clubCode, status: 'approved' });
      const rejectedRequests = await WorkshopRequest.countDocuments({ clubCode, status: 'rejected' });

      stats = {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests
      };
    } else {
      // Club member stats for their own requests
      const totalRequests = await WorkshopRequest.countDocuments({ requesterId: userId });
      const pendingRequests = await WorkshopRequest.countDocuments({ requesterId: userId, status: 'pending' });
      const approvedRequests = await WorkshopRequest.countDocuments({ requesterId: userId, status: 'approved' });
      const rejectedRequests = await WorkshopRequest.countDocuments({ requesterId: userId, status: 'rejected' });

      stats = {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch request statistics' });
  }
});

module.exports = router;