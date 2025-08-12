const express = require('express');
const Workshop = require('../models/Workshop');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

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

router.post('/create', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, date, time, location, topic, description, maxParticipants, clubCode } = req.body;
    const { userId, roles, clubCode: userClubCode } = req.user;

    if (!roles.includes('admin')) {
      return res.status(403).json({ message: 'Only admins can create workshops' });
    }

    // Ensure clubCode matches the admin's clubCode
    if (clubCode !== userClubCode) {
      return res.status(403).json({ message: 'You can only create workshops for your own club' });
    }

    const workshop = new Workshop({
      name,
      date,
      time,
      location,
      topic,
      description,
      maxParticipants,
      clubCode,
      image: req.file ? req.file.path : '',
      createdBy: userId
    });

    await workshop.save();

    res.status(201).json({ message: 'Workshop created successfully', workshop });
  } catch (error) {
    console.error('Create workshop error:', error);
    res.status(500).json({ message: 'Failed to create workshop' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { clubCode } = req.user;
    const workshops = await Workshop.find({ clubCode });
    const modifiedWorkshops = workshops.map(workshop => {
      if (workshop.image) {
        workshop.image = workshop.image.replace(/\\/g, '/');
      }
      return workshop;
    });
    res.json(modifiedWorkshops);
  } catch (error) {
    console.error('Get workshops error:', error);
    res.status(500).json({ message: 'Failed to get workshops' });
  }
});

// Add public route for unauthenticated access (e.g., Home page)
router.get('/public', async (req, res) => {
  try {
    const workshops = await Workshop.find({});
    const modifiedWorkshops = workshops.map(workshop => {
      if (workshop.image) {
        workshop.image = workshop.image.replace(/\\/g, '/');
      }
      return workshop;
    });
    res.json(modifiedWorkshops);
  } catch (error) {
    console.error('Get public workshops error:', error);
    res.status(500).json({ message: 'Failed to get workshops' });
  }
});

router.delete('/:workshopId', authMiddleware, async (req, res) => {
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

    await Workshop.findByIdAndDelete(workshopId);

    res.json({ message: 'Workshop deleted successfully' });
  } catch (error) {
    console.error('Delete workshop error:', error);
    res.status(500).json({ message: 'Failed to delete workshop' });
  }
});

module.exports = router;