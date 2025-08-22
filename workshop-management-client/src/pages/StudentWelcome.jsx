import React from 'react';

const StudentWelcome = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome, Student!</h1>
      <p>This is your personalized dashboard. Use the navigation to explore workshops and manage your profile.</p>
      <img src="/user_icon.jpg" alt="Welcome" style={{ maxWidth: '100%', height: 'auto', marginTop: '20px' }} />
    </div>
  );
};

export default StudentWelcome;