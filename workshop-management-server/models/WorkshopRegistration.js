const mongoose = require('mongoose');

const workshopRegistrationSchema = new mongoose.Schema({
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can only register for a workshop once
workshopRegistrationSchema.index({ workshop: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('WorkshopRegistration', workshopRegistrationSchema);
