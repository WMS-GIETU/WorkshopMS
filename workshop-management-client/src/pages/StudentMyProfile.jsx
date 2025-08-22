import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const StudentMyProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (user) {
      // In a real application, you would fetch more detailed profile data from your backend
      setProfileData({
        username: user.username,
        email: user.email,
        role: user.roles ? user.roles.join(', ') : 'N/A',
        // Add other profile fields as needed
      });
    }
  }, [user]);

  if (!profileData) {
    return <div style={{ padding: '20px' }}>Loading profile...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Profile</h1>
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '400px', margin: '20px 0' }}>
        <p><strong>Username:</strong> {profileData.username}</p>
        <p><strong>Email:</strong> {profileData.email}</p>
        <p><strong>Role:</strong> {profileData.role}</p>
        {/* Add more profile details here */}
      </div>
      <p>This page will allow you to view and potentially edit your profile information.</p>
    </div>
  );
};

export default StudentMyProfile;