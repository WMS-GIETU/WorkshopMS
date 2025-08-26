const express = require('express');
const bcrypt = require('bcryptjs');
const RegistrationRequest = require('../models/RegistrationRequest');
const User = require('../models/User');
const { sendEmail } = require('../config/email');
const adminEmail = process.env.ADMIN_EMAIL;

const router = express.Router();

// Submit registration request
router.post('/submit-request', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { username, email, password, role, clubCode } = req.body;

    // Normalize username and clubCode to lowercase
    const normalizedUsername = username.toLowerCase();
    const normalizedClubCode = clubCode.toLowerCase();

    // Check if user already exists
    console.log('Checking for existing user...');
    let existingUser;
    
    if (role === 'admin') {
      // For admin: check if username or email exists globally
      existingUser = await User.findOne({ 
        $or: [
          { username: normalizedUsername },
          { email }
        ],
        roles: 'admin'
      });
      if (existingUser) {
        console.log('Existing admin user found:', existingUser.username);
        return res.status(400).json({ 
          message: 'Admin user with this username or email already exists.'
        });
      }
    } else {
      // For clubMember: check if username or email exists for this specific club
      existingUser = await User.findOne({ 
        $or: [
          { username: normalizedUsername, clubCode: normalizedClubCode },
          { email, clubCode: normalizedClubCode }
        ],
        roles: 'clubMember'
      });
      if (existingUser) {
        console.log('Existing club member found:', existingUser.username);
        return res.status(400).json({ 
          message: 'Club member with this username or email already exists for this club.'
        });
      }
    }
    console.log('No existing user found');

    // Check if request already exists
    console.log('Checking for existing request...');
    const existingRequest = await RegistrationRequest.findOne({ 
      $or: [
        { username: normalizedUsername, clubCode: normalizedClubCode },
        { email, clubCode: normalizedClubCode }
      ],
      status: 'pending'
    });
    if (existingRequest) {
      console.log('Existing request found:', existingRequest.username);
      return res.status(400).json({ 
        message: 'A registration request is already pending for this user in this club.'
      });
    }
    console.log('No existing request found');

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Determine request type and target email
    console.log('Determining request type and target email...');
    let requestType, targetEmail, requestArrayIndex;
    
    if (role === 'admin') {
      console.log('Processing admin request...');
      requestType = 'admin';
      targetEmail = adminEmail;
      requestArrayIndex = 0;
      
      // Check if admin already exists for this club
      const existingAdmin = await User.findOne({ 
        roles: 'admin', 
        clubCode: normalizedClubCode 
      });
      if (existingAdmin) {
        console.log('Admin already exists for club:', normalizedClubCode);
        return res.status(400).json({ 
          message: 'An admin already exists for this club. Only one admin is allowed per club.' 
        });
      }
      console.log('No among admin found for club:', normalizedClubCode);
    } else {
      console.log('Processing member request...');
      requestType = 'member';
      requestArrayIndex = 1;
      
      // Find club admin email
      const clubAdmin = await User.findOne({ 
        roles: 'admin', 
        clubCode: normalizedClubCode 
      });
      if (!clubAdmin) {
        console.log('No club admin found for club:', normalizedClubCode);
        return res.status(400).json({ 
          message: 'No admin found for this club. Please contact the system administrator.' 
        });
      }
      targetEmail = clubAdmin.email;
      console.log('Club admin found:', clubAdmin.email);
    }

    // Create registration request
    console.log('Creating registration request...');
    const registrationRequest = new RegistrationRequest({
      username: normalizedUsername,
      email,
      password: hashedPassword,
      roles: [role],
      clubCode: normalizedClubCode,
      requestType,
      requestArrayIndex,
      systemAdminEmail: role === 'admin' ? targetEmail : undefined,
      clubAdminEmail: role === 'clubMember' ? targetEmail : undefined
    });

    console.log('Saving registration request...');
    await registrationRequest.save();
    console.log('Registration request saved successfully');

    // Send email notification
    console.log('Preparing email data...');
    const emailData = {
      ...registrationRequest.toObject(),
      requestId: registrationRequest._id
    };

    console.log('Sending email to:', targetEmail);
    let emailResult;
    try {
      if (role === 'admin') {
        emailResult = await sendEmail(targetEmail, 'adminRequest', emailData);
      } else {
        emailResult = await sendEmail(targetEmail, 'memberRequest', emailData);
      }
      console.log('Email result:', emailResult);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      emailResult = { success: false, error: emailError.message };
    }

    // Update email sent status
    if (emailResult.success) {
      console.log('Email sent successfully, updating status...');
      registrationRequest.emailSent = true;
      registrationRequest.emailSentAt = new Date();
      await registrationRequest.save();
    } else {
      console.log('Email failed to send:', emailResult.error);
    }

    console.log('Registration request completed successfully');
    res.status(201).json({ 
      message: 'Registration request submitted successfully. You will receive an email notification once your request is approved.',
      requestId: registrationRequest._id
    });

  } catch (error) {
    console.error('Registration request error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get pending requests (for admin dashboard)
router.get('/pending-requests', async (req, res) => {
  try {
    const { userRole, clubCode } = req.query;
    const normalizedClubCode = clubCode.toLowerCase();
    
    let query = { status: 'pending' };
    
    // System admin can see all admin requests (array index 0)
    if (userRole === 'systemAdmin') {
      query.requestArrayIndex = 0;
    }
    // Club admin can see member requests for their club (array index 1)
    else if (userRole === 'admin') {
      query.requestArrayIndex = 1;
      query.clubCode = normalizedClubCode;
    }
    
    const requests = await RegistrationRequest.find(query)
      .sort({ createdAt: -1 })
      .select('-password'); // Don't send password
    
    res.json(requests);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve registration request
router.put('/approve/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approvedBy } = req.body;

    const request = await RegistrationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    if (approvedBy === 'systemAdmin' && request.requestArrayIndex !== 0) {
      return res.status(403).json({ message: 'System admin can only approve admin requests' });
    }

    if (approvedBy === 'clubAdmin' && request.requestArrayIndex !== 1) {
      return res.status(403).json({ message: 'Club admin can only approve member requests' });
    }

    // For admin role, re-check if an admin already exists for this club
    if (request.roles[0] === 'admin') {
      const existingAdmin = await User.findOne({ 
        roles: 'admin', 
        clubCode: request.clubCode 
      });
      if (existingAdmin) {
        console.log('Admin already exists for club:', request.clubCode);
        return res.status(400).json({ 
          message: 'An admin already exists for this club. Only one admin is allowed per club.' 
        });
      }
    }

    // Update request status
    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();
    await request.save();

    // Create or update user account
    let user;
    if (request.roles[0] === 'admin') {
      // For admin: ensure global uniqueness
      user = await User.findOne({ 
        $or: [
          { username: request.username },
          { email: request.email }
        ],
        roles: 'admin'
      });
    } else {
      // For clubMember: check per club
      user = await User.findOne({ 
        $or: [
          { username: request.username, clubCode: request.clubCode },
          { email: request.email, clubCode: request.clubCode }
        ],
        roles: 'clubMember'
      });
    }

    if (user) {
      // Add new roles if not present
      request.roles.forEach(r => {
        if (!user.roles.includes(r)) {
          user.roles.push(r);
        }
      });
      await user.save();
      console.log('User updated with new role:', user.username);
    } else {
      user = new User({
        username: request.username,
        email: request.email,
        password: request.password, // Already hashed
        roles: request.roles,
        clubCode: request.clubCode
      });
      await user.save();
      console.log('New user created:', user.username);
    }

    // Send approval notification email
    const emailData = {
      username: request.username,
      email: request.email,
      role: request.roles[0],
      clubCode: request.clubCode,
      approved: true // Add approved parameter
    };

    await sendEmail(request.email, 'approvalNotification', emailData);

    // Return user info with roles
    res.json({ 
      message: 'Registration request approved successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        clubCode: user.clubCode
      }
    });

  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Reject registration request
router.put('/reject/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectedBy, rejectionReason } = req.body;

    const request = await RegistrationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Update request status
    request.status = 'rejected';
    request.approvedBy = rejectedBy; // Reusing field for rejectedBy
    request.approvedAt = new Date(); // Reusing field for rejectedAt
    request.rejectionReason = rejectionReason;
    await request.save();

    // Send rejection notification email
    const emailData = {
      username: request.username,
      email: request.email,
      role: request.roles[0],
      clubCode: request.clubCode,
      rejectionReason,
      approved: false // Add approved parameter for consistency
    };

    await sendEmail(request.email, 'approvalNotification', emailData);

    res.json({ message: 'Registration request rejected successfully' });

  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get request status
router.get('/status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await RegistrationRequest.findById(requestId)
      .select('-password');
    
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Get request status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;