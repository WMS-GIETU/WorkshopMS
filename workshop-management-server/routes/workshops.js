const express = require('express');
const Workshop = require('../models/Workshop');
const WorkshopImage = require('../models/WorkshopImage'); // Import the new model
const WorkshopRegistration = require('../models/WorkshopRegistration');
const WorkshopRequest = require('../models/WorkshopRequest');
const WorkshopAttendance = require('../models/WorkshopAttendance');
const { protect, authorize } = require('../middleware/authMiddleware'); // Corrected import
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Import fs to read the file

const router = express.Router();

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

router.post('/create', protect, authorize(['admin']), upload.single('image'), async (req, res) => {
  try {
    const { name, date, time, location, topic, description, maxParticipants, clubCode, link } = req.body;
    const { userId, roles, clubCode: userClubCode } = req.user;

    if (!roles.includes('admin')) {
      return res.status(403).json({ message: 'Only admins can create workshops' });
    }

    // Ensure clubCode matches the admin's clubCode
    if (clubCode !== userClubCode) {
      return res.status(403).json({ message: 'You can only create workshops for your own club' });
    }

    let workshopImageId = null;
    if (req.file) {
      const imagePath = req.file.path;
      const imageBuffer = fs.readFileSync(imagePath); // Read the image file into a buffer
      const contentType = req.file.mimetype;

      const newWorkshopImage = new WorkshopImage({
        image: {
          data: imageBuffer,
          contentType: contentType,
        },
        // workshopId will be set after workshop is saved
        uploadedBy: userId,
        clubCode: clubCode,
      });
      await newWorkshopImage.save();
      workshopImageId = newWorkshopImage._id;

      // Optionally, delete the file from the uploads folder after saving to DB
      fs.unlinkSync(imagePath);
    }

    const workshop = new Workshop({
      name,
      date,
      time,
      location,
      topic,
      description,
      link,
      maxParticipants,
      clubCode,
      image: workshopImageId, // Store the ID of the WorkshopImage
      createdBy: userId
    });

    await workshop.save();

    // Now that workshop is saved, update the workshopId in WorkshopImage
    if (workshopImageId) {
      await WorkshopImage.findByIdAndUpdate(workshopImageId, { workshopId: workshop._id });
    }

    res.status(201).json({ message: 'Workshop created successfully', workshop });
  } catch (error) {
    console.error('Create workshop error:', error);
    res.status(500).json({ message: 'Failed to create workshop' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const { clubCode } = req.user;
    const workshops = await Workshop.find({ clubCode }).populate('image'); // Populate the image field
    res.json(workshops); // No need for modifiedWorkshops map if image is populated correctly
  } catch (error) {
    console.error('Get workshops error:', error);
    res.status(500).json({ message: 'Failed to get workshops' });
  }
});

// Add public route for unauthenticated access (e.g., Home page)
router.get('/public', async (req, res) => {
  try {
    const workshops = await Workshop.find({}).populate('image'); // Populate the image field
    res.json(workshops); // No need for modifiedWorkshops map if image is populated correctly
  } catch (error) {
    console.error('Get public workshops error:', error);
    res.status(500).json({ message: 'Failed to get workshops' });
  }
});

// New route to get a single workshop by ID
router.get('/:workshopId', protect, async (req, res) => {
  try {
    const { workshopId } = req.params;
    const workshop = await Workshop.findById(workshopId).populate('image');
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    res.json(workshop);
  } catch (error) {
    console.error('Get single workshop error:', error);
    res.status(500).json({ message: 'Failed to get workshop' });
  }
});

router.put('/:workshopId', protect, authorize(['admin']), async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { name, date, time, location, topic, description, link, maxParticipants, clubCode } = req.body;
    const { roles, clubCode: userClubCode } = req.user;

    if (!roles.includes('admin')) {
      return res.status(403).json({ message: 'Only admins can update workshops' });
    }

    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Ensure the admin can only update workshops from their own club
    if (workshop.clubCode !== userClubCode) {
      return res.status(403).json({ message: 'You can only update workshops from your own club' });
    }

    // Update workshop fields
    workshop.name = name || workshop.name;
    workshop.date = date || workshop.date;
    workshop.time = time || workshop.time;
    workshop.location = location || workshop.location;
    workshop.topic = topic || workshop.topic;
    workshop.description = description || workshop.description;
    workshop.link = link || workshop.link;
    workshop.maxParticipants = maxParticipants !== undefined ? maxParticipants : workshop.maxParticipants;
    workshop.clubCode = clubCode || workshop.clubCode;

    await workshop.save();

    res.json({ message: 'Workshop updated successfully', workshop });
  } catch (error) {
    console.error('Update workshop error:', error);
    res.status(500).json({ message: 'Failed to update workshop' });
  }
});

router.delete('/:workshopId', protect, authorize(['admin']), async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { roles, clubCode } = req.user;

    if (!roles.includes('admin')) {
      return res.status(403).json({ message: 'Only admins can delete workshops' });
    }

    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    if (workshop.clubCode !== clubCode) {
      return res.status(403).json({ message: 'You can only delete workshops from your own club' });
    }

    // If there's an associated image, delete it from WorkshopImage collection
    if (workshop.image) {
      await WorkshopImage.findByIdAndDelete(workshop.image);
    }

    await Workshop.findByIdAndDelete(workshopId);

    res.json({ message: 'Workshop deleted successfully' });
  } catch (error) {
    console.error('Delete workshop error:', error);
    res.status(500).json({ message: 'Failed to delete workshop' });
  }
});

router.get('/stats', protect, authorize(['admin']), async (req, res) => {
  try {
    const { clubCode } = req.user;

    const totalWorkshops = await Workshop.countDocuments({ clubCode });
    const workshopIds = await Workshop.find({ clubCode }).select('_id');
    const totalParticipants = await WorkshopRegistration.countDocuments({ workshop: { $in: workshopIds } });
    const pendingRequests = await WorkshopRequest.countDocuments({ clubCode, status: 'pending' });

    res.json({ totalWorkshops, totalParticipants, pendingRequests });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
});

// New route to get workshop details and its registered participants
router.get('/:workshopId/participants', protect, async (req, res) => {
  try {
    const { workshopId } = req.params;
    const { clubCode, roles } = req.user;

    // Fetch workshop details
    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // Ensure the user has access to this workshop's participants
    // Admins can see all workshops in their club, club members can see their club's workshops
    if (!roles.includes('admin') && workshop.clubCode !== clubCode) {
      return res.status(403).json({ message: 'Access denied to this workshop' });
    }

    // Fetch participants for the workshop and populate user details
    const workshopAttendance = await WorkshopAttendance.findOne({ workshop: workshopId })
      .populate('attendees.user', 'name rollNo mobileNumber email'); // Populate user details within attendees

    const participants = workshopAttendance ? workshopAttendance.attendees.map(att => ({ user: att.user })) : [];

    res.json({ workshop, participants });
  } catch (error) {
    console.error('Error fetching workshop participants:', error);
    res.status(500).json({ message: 'Failed to get workshop participants' });
  }
});

module.exports = router;