const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/mark', authMiddleware, async (req, res) => {
  const { workshopId, presentUserIds } = req.body;

  try {
    const attendanceRecords = presentUserIds.map((userId) => ({
      workshop: workshopId,
      user: userId,
    }));

    await Attendance.insertMany(attendanceRecords);

    res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;