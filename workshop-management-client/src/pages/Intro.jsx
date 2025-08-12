import React from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './Intro.css';

const Intro = () => {
  const auth = useAuth();
  const user = auth.user;
  
  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <div className="welcome-section">
          <div className="welcome-header">
            <h1 className="user-name">Hello {user?.username || 'User'}!</h1>
          </div>
          <p className="welcome-message">Welcome to the Workshop Management System</p>
          <div className="welcome-features">
            <div className="feature-card">
              <h3>📊 Dashboard</h3>
              <p>Manage your workshops and track attendance</p>
            </div>
            <div className="feature-card">
              <h3>👥 Team Management</h3>
              <p>Organize your team members and roles</p>
            </div>
            <div className="feature-card">
              <h3>📝 Attendance</h3>
              <p>Track workshop attendance and participation</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Intro;