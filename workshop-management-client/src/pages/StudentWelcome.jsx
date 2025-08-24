import React from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './StudentWelcome.css';

const StudentWelcome = () => {
  const { user } = useAuth();

  return (
    <div className="student-welcome-container">
      <Sidebar />
      <main className="student-welcome-main-content">
        <div className="student-welcome-section">
          <div className="student-welcome-header">
            <h1 className="student-welcome-user-name">Hello {user?.username || 'Student'}!</h1>
          </div>
          <p className="student-welcome-message">
            Dive into your personalized dashboard. Discover workshops, update your profile, and connect with your community!
          </p>
          <div className="student-welcome-features">
            <div className="student-welcome-feature-card">
              <i className="fas fa-calendar-alt student-welcome-feature-icon"></i>
              <h3>Explore Workshops</h3>
              <p>Find and join exciting workshops tailored to your interests.</p>
            </div>
            <div className="student-welcome-feature-card">
              <i className="fas fa-user student-welcome-feature-icon"></i>
              <h3>Manage Profile</h3>
              <p>Update your details and personalize your experience.</p>
            </div>
            <div className="student-welcome-feature-card">
              <i className="fas fa-users student-welcome-feature-icon"></i>
              <h3>Join Community</h3>
              <p>Connect with peers and collaborate on projects.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentWelcome;