const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const authMiddleware = require('../middleware/authMiddleware');

// Mark attendance
router.post('/mark', authMiddleware, async (req, res) => {
  try {
    const { workshopId, presentUserIds } = req.body;

    // Create attendance records for each present user
    const attendanceRecords = presentUserIds.map(userId => ({
      workshop: workshopId,
      user: userId,
      status: 'present',
    }));

    // Use insertMany for efficiency
    await Attendance.insertMany(attendanceRecords, { ordered: false });

    res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    // Ignore duplicate key errors if a user's attendance is already marked
    if (error.code === 11000) {
      return res.status(201).json({ message: 'Attendance marked successfully (some were already marked)' });
    }
    res.status(500).json({ message: 'Failed to mark attendance' });
  }
});

module.exports = router;
