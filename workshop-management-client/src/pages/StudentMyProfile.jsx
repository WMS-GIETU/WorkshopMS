import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './StudentMyProfile.css';

const StudentMyProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        rollNo: user.rollNo,
        email: user.email,
        role: user.roles ? user.roles.join(', ') : 'Student',
      });
    }
  }, [user]);

  const handleFaceScan = async () => {
    setIsScanning(true);
    setScanStatus('Scanning face...');
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setScanStatus('Face data successfully scanned and stored!');
    } catch (error) {
      setScanStatus('Error scanning face. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  if (!profileData) {
    return (
      <div className="student-profile-container-sw">
        <div className="loading-sw">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="student-profile-container-sw">
      <div className="profile-wrapper-sw">
        <h1 className="profile-title-sw">My Profile</h1>
        <div className="profile-card-sw">
          <div className="profile-details-sw">
            <p className="profile-field-sw"><span className="field-label-sw">Name:</span> {profileData.name}</p>
            <p className="profile-field-sw"><span className="field-label-sw">Roll No:</span> {profileData.rollNo}</p>
            <p className="profile-field-sw"><span className="field-label-sw">Email:</span> {profileData.email}</p>
            <p className="profile-field-sw"><span className="field-label-sw">Role:</span> {profileData.role}</p>
          </div>
          <div className="face-scan-section-sw">
            <h2 className="section-title-sw">Face Scan for Attendance</h2>
            <button
              onClick={handleFaceScan}
              disabled={isScanning}
              className={`face-scan-button-sw ${isScanning ? 'disabled-sw' : ''}`}
            >
              {isScanning ? 'Scanning...' : 'Scan Face'}
            </button>
            {scanStatus && (
              <p className={`scan-status-sw ${scanStatus.includes('Error') ? 'error-sw' : 'success-sw'}`}>
                {scanStatus}
              </p>
            )}
          </div>
        </div>
        <p className="profile-footer-sw">
          View and manage your profile information, including face scan for attendance.
        </p>
      </div>
    </div>
  );
};

export default StudentMyProfile;