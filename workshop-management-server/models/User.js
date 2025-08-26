const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  roles: [{
    type: String,
    enum: ['admin', 'clubMember', 'student'],
    required: true,
  }],
  clubCode: {
    type: String,
    required: function() {
      return this.roles.includes('admin') || this.roles.includes('clubMember');
    },
    lowercase: true,
  },
  name: { // Added field for student's full name
    type: String,
    trim: true,
  },
  rollNo: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allows null/missing values to not violate uniqueness
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

// Index to improve query performance
UserSchema.index({ clubCode: 1, roles: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);