const express = require('express');
const router = express.Router();
const WorkshopAttendance = require('../models/WorkshopAttendance');
const { protect, authorize } = require('../middleware/authMiddleware');

console.log('--- attendance.js route file loaded ---');

router.post('/mark', protect, authorize(['admin', 'clubMember']), async (req, res) => {
  const { workshopId, presentUserIds } = req.body;
  const clubCode = req.user.clubCode;

  if (!clubCode) {
    return res.status(400).json({ message: 'User does not have a club code.' });
  }

  try {
    let attendance = await WorkshopAttendance.findOne({ workshop: workshopId });

    if (attendance) {
      // Add new attendees, avoiding duplicates
      presentUserIds.forEach(userId => {
        if (!attendance.attendees.some(attendee => attendee.user.toString() === userId)) {
          attendance.attendees.push({ user: userId });
        }
      });
    } else {
      // Create new attendance document
      attendance = new WorkshopAttendance({
        workshop: workshopId,
        clubCode: clubCode,
        attendees: presentUserIds.map(userId => ({ user: userId })),
      });
    }

    await attendance.save();

    res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get attendance for a workshop
router.get('/:workshopId', protect, async (req, res) => {
  try {
    const attendance = await WorkshopAttendance.findOne({ workshop: req.params.workshopId }).populate('attendees.user', 'username rollNo');
    if (attendance) {
      res.json(attendance.attendees);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove an attendee from a workshop's attendance
router.delete('/:workshopId/attendees/:userId', protect, authorize(['admin', 'clubMember']), async (req, res) => {
  console.log('DELETE /:workshopId/attendees/:userId route hit');
  const { workshopId, userId } = req.params;

  try {
    const attendance = await WorkshopAttendance.findOne({ workshop: workshopId });

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found for this workshop.' });
    }

    // Find the index of the attendee to remove
    const attendeeIndex = attendance.attendees.findIndex(attendee => attendee.user.toString() === userId);

    if (attendeeIndex > -1) {
      // Remove the attendee
      attendance.attendees.splice(attendeeIndex, 1);
      await attendance.save();
      res.json({ message: 'Attendee removed successfully.' });
    } else {
      res.status(404).json({ message: "Attendee not found in this workshop's attendance." });
    }
  } catch (error) {
    console.error('Error removing attendee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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
