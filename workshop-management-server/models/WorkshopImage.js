const mongoose = require('mongoose');

const WorkshopImageSchema = new mongoose.Schema({
  image: {
    data: Buffer,
    contentType: String,
  },
  workshopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    required: false,
  },
  uploadedBy: {
    type: String,
    required: true,
  },
  clubCode: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WorkshopImage', WorkshopImageSchema);