const mongoose = require('mongoose');

const FaceUpdateRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('FaceUpdateRequest', FaceUpdateRequestSchema);
