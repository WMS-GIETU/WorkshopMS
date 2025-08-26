const nodemailer = require('nodemailer');

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'workshopmanagementsystem.giet@gmail.com',
    pass: 'xgbc gzyn uolu lwbi' // App password from Gmail
  }
});

// Email templates
const emailTemplates = {
  // Admin registration request to system admin
  adminRequest: (userData) => ({
    subject: 'New Admin Registration Request - Workshop Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3f51b5;">New Admin Registration Request</h2>
        <p>A new user has requested to register as an admin for the Workshop Management System.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>User Details:</h3>
          <p><strong>Username:</strong> ${userData.username}</p>
          <p><strong>Email:</strong> ${userData.email}</p>
          <p><strong>Club Code:</strong> ${userData.clubCode}</p>
          <p><strong>Request Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/approve-request/${userData.requestId}" 
             style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
            ✅ Approve Request
          </a>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reject-request/${userData.requestId}" 
             style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            ❌ Reject Request
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This is an automated message from the Workshop Management System.
        </p>
      </div>
    `
  }),

  // Club member registration request to club admin
  memberRequest: (userData) => ({
    subject: 'New Club Member Registration Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3f51b5;">New Club Member Registration Request</h2>
        <p>A new user has requested to join your club as a member.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>User Details:</h3>
          <p><strong>Username:</strong> ${userData.username}</p>
          <p><strong>Email:</strong> ${userData.email}</p>
          <p><strong>Club Code:</strong> ${userData.clubCode}</p>
          <p><strong>Request Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/approve-request/${userData.requestId}" 
             style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
            ✅ Approve Request
          </a>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reject-request/${userData.requestId}" 
             style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            ❌ Reject Request
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This is an automated message from the Workshop Management System.
        </p>
      </div>
    `
  }),

  // Approval/rejection notification
    approvalNotification: (userData) => ({
    subject: `Registration Request ${userData.approved ? 'Approved' : 'Rejected'} - Workshop Management System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${userData.approved ? '#4caf50' : '#f44336'};">
          Registration Request ${userData.approved ? 'Approved' : 'Rejected'}
        </h2>
        
        <p>Dear ${userData.username},</p>
        
        <p>Your registration request for the Workshop Management System has been 
        <strong>${userData.approved ? 'approved' : 'rejected'}</strong>.</p>
        
        ${userData.approved ? `
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>✅ Your account has been created successfully!</h3>
            <p>You can now log in to the system using your credentials:</p>
            <p><strong>Username:</strong> ${userData.username}</p>
            <p><strong>Role:</strong> ${userData.role === 'admin' ? 'Administrator' : 'Club Member'}</p>
            <p><strong>Club Code:</strong> ${userData.clubCode}</p>
          </div>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin-login" 
               style="background-color: #3f51b5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              🚀 Login to System
            </a>
          </div>
        ` : `
          <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>❌ Your registration request was not approved</h3>
            <p>Reason: ${userData.rejectionReason || 'No reason provided'}</p>
            <p>If you believe this was an error, please contact the system administrator.</p>
          </div>
        `}
        
        <p style="color: #666; font-size: 14px;">
          This is an automated message from the Workshop Management System.
        </p>
      </div>
    `
  }),

  studentOtp: (userData) => ({
    subject: 'Your OTP for Student Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3f51b5;">Student Registration OTP</h2>
        <p>Hello ${userData.username},</p>
        <p>Your OTP for registering as a student is:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="font-size: 24px; letter-spacing: 2px;">${userData.otp}</h3>
        </div>
        <p>This OTP is valid for 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">
          This is an automated message from the Workshop Management System.
        </p>
      </div>
    `
  }),

    faceUpdateRequest: (data) => ({
    subject: 'Face Data Update Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3f51b5;">Face Data Update Request</h2>
        <p>Student ${data.username} (Roll No: ${data.rollNo}, Email: ${data.email}) has requested to update their face data.</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        <p>Request ID: ${data.requestId}</p>
        
        <div style="margin: 30px 0;">
          <a href="${process.env.BACKEND_URL || 'http://localhost:5000'}/api/face/approve-update-request/${data.requestId}" 
             style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
            ✅ Approve Request
          </a>
          <a href="${process.env.BACKEND_URL || 'http://localhost:5000'}/api/face/reject-update-request/${data.requestId}" 
             style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            ❌ Reject Request
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This is an automated message from the Workshop Management System.
        </p>
      </div>
    `
  }),

  faceUpdateNotification: (data) => ({
    subject: `Your Face Data Update Request Has Been ${data.status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${data.status === 'approved' ? '#4caf50' : '#f44336'};">Face Data Update Request ${data.status}</h2>
        <p>Dear ${data.username},</p>
        <p>Your request to update your face data has been ${data.status}.</p>
        ${data.status === 'approved' ? `<p>You can now proceed to the StudentMyProfile page to scan and upload your new face data.</p>` : `<p>Please contact the administration for more details if needed.</p>`}
        <p style="color: #666; font-size: 14px;">
          This is an automated message from the Workshop Management System.
        </p>
      </div>
    `
  })
};


// Send email function
const sendEmail = async (to, template, data) => {
  try {
    console.log('Template received:', template);
    console.log('emailTemplates[template]:', emailTemplates[template]);
    const emailContent = emailTemplates[template](data);
    
    const mailOptions = {
      from: 'workshopmanagementsystem.giet@gmail.com',
      to: to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail, emailTemplates };