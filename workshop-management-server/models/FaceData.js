const mongoose = require('mongoose');

const FaceDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  faceDescriptors: {
    type: [[Number]],
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FaceData', FaceDataSchema);