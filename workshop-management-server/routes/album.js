const express = require('express');
const router = express.Router();
const multer = require('multer');
const AlbumImage = require('../models/AlbumImage');
const Workshop = require('../models/Workshop');
const authMiddleware = require('../middleware/authMiddleware');

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// @route   POST /api/album/upload
// @desc    Upload an image to the album
// @access  Private
router.post('/upload', [authMiddleware, upload.single('image')], async (req, res) => {
  try {
    const { workshop } = req.body;
    console.log('Uploading image by user:', req.user.username, 'with ID:', req.user.userId);
    const newImage = new AlbumImage({
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
      workshop,
      uploadedBy: req.user.username,
      clubCode: req.user.clubCode,
    });

    await newImage.save();
    res.status(201).json({ msg: 'Image uploaded successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/album
// @desc    Get all album images
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = { clubCode: req.user.clubCode };
    if (req.query.workshop) {
      filter.workshop = req.query.workshop;
    }
    const images = await AlbumImage.find(filter).sort({ createdAt: -1 });
    res.json(images);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/album/public
// @desc    Get all album images for public view
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const images = await AlbumImage.find().sort({ createdAt: -1 });
    const workshops = await Workshop.find();

    const imagesWithWorkshopDetails = images.map(image => {
      const workshop = workshops.find(w => w.name === image.workshop);
      return {
        _id: image._id,
        image: image.image,
        caption: image.caption,
        workshopDetails: workshop ? {
          name: workshop.name,
          clubCode: workshop.clubCode,
          date: workshop.date,
        } : null,
      };
    });

    res.json(imagesWithWorkshopDetails);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/album/:id
// @desc    Delete an image from the album
// @access  Private (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    // Check for admin role
    if (!req.user.roles.includes('admin')) {
        return res.status(403).json({ msg: 'Forbidden: Admins only' });
    }

    try {
        const image = await AlbumImage.findById(req.params.id);

        if (!image) {
            return res.status(404).json({ msg: 'Image not found' });
        }

        await image.deleteOne();

        res.json({ msg: 'Image removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Image not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
