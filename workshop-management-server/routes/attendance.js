const express = require('express');
const router = express.Router();
const WorkshopAttendance = require('../models/WorkshopAttendance');
const { protect } = require('../middleware/authMiddleware');

// Get all workshops a user has attended
router.get('/my-attended-workshops', protect, async (req, res) => {
  try {
    const attendances = await WorkshopAttendance.find({ 'attendees.user': req.user.userId }).populate('workshop');
    const workshops = attendances.map(attendance => attendance.workshop);
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch attended workshops' });
  }
});

module.exports = router;
