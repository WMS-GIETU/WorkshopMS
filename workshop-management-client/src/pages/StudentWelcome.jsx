import React from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './StudentWelcome.css';

const StudentWelcome = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <div className="welcome-section">
          <div className="welcome-header">
            <h1 className="user-name">Hello {user?.username || 'Student'}!</h1>
            
          </div>
          <p className="welcome-message">
            Dive into your personalized dashboard. Discover workshops, update your profile, and connect with your community!
          </p>
          <div className="welcome-features">
            <div className="feature-card">
              <i className="fas fa-calendar-alt feature-icon"></i>
              <h3>Explore Workshops</h3>
              <p>Find and join exciting workshops tailored to your interests.</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-user feature-icon"></i>
              <h3>Manage Profile</h3>
              <p>Update your details and personalize your experience.</p>
            </div>
            <div className="feature-card">
              <i className="fas fa-users feature-icon"></i>
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