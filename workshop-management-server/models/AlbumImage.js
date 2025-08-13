const mongoose = require('mongoose');

const AlbumImageSchema = new mongoose.Schema({
  image: {
    data: Buffer,
    contentType: String,
  },
  workshop: {
    type: String,
    required: true,
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

module.exports = mongoose.model('AlbumImage', AlbumImageSchema);
