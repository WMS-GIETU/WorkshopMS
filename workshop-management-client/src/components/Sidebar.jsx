import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (isAdmin()) {
      fetchPendingRequestsCount();
    }
  }, [isAdmin]);

  const fetchPendingRequestsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/workshop-requests/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingRequestsCount(data.pending);
      }
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  };

  const getClubName = (clubCode) => {
    const clubNames = {
      'SARS123': 'SARS Club',
      'SARS': 'SARS Club',
      'CodeX': 'CodeX Club',
      'AIVision': 'AIVision Club',
      'DataSense': 'DataSense Club',
      'AppForge': 'AppForge Club',
      'CyberX': 'CyberX Club',
      'CircuitHub': 'CircuitHub Club',
      'DesignIQ': 'DesignIQ Club'
    };
    
    return clubNames[clubCode] || clubCode || 'Club';
  };

  const handleLogout = () => {
    logout();
    if (user?.role === 'student') {
      navigate('/student-login');
    } else {
      navigate('/');
    }
  };

  return (
    <aside className="sidebar">
      {user && (
        <Link to={user.clubCode === 'student' ? "/student-dashboard" : "/intro"} className="user-profile-link">
          <div className="user-profile">
            <div className="profile-pic">
              <span>{user.username.charAt(0).toUpperCase()}</span>
            </div>
            <div className="user-details">
              <span className="user-name">{user.username}</span>
              <span className="user-rollno">{user.email.split('.')[0]}</span>
            </div>
          </div>
        </Link>
      )}
      <nav className="menu">
        <ul>
          {user?.clubCode === 'student' ? (
            <>
              <li>
                <Link to="/student-dashboard/my-workshops">
                  <i className="fas fa-calendar-alt"></i> My Workshops
                </Link>
              </li>
              <li>
                <Link to="/student-dashboard/my-profile">
                  <i className="fas fa-user"></i> My Profile
                </Link>
              </li>
            </>
          ) : isAdmin() ? (
            <>
              <li>
                <Link to="/new-workshop">
                  <i className="fas fa-plus-circle"></i> New Workshop
                </Link>
              </li>
              <li>
                <Link to="/workshop-requests">
                  <i className="fas fa-file-alt"></i> Requests
                  {isAdmin() && pendingRequestsCount > 0 && (
                    <span className="pending-requests-badge">{pendingRequestsCount}</span>
                  )}
                </Link>
              </li>
              <li>
                <Link to="/workshops">
                  <i className="fas fa-book"></i> Workshops
                </Link>
              </li>
              <li>
                <Link to="/manageteam">
                  <i className="fas fa-users"></i> Manage Team
                </Link>
              </li>
              <li>
                <Link to="/attendance">
                  <i className="fas fa-camera"></i> Attendance
                </Link>
              </li>
              <li>
                <Link to="/album">
                  <i className="fas fa-images"></i> Albums
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/workshop-requests">
                  <i className="fas fa-file-alt"></i> Request Workshop
                </Link>
              </li>
              <li>
                <Link to="/workshops">
                  <i className="fas fa-book"></i> Workshops
                </Link>
              </li>
              <li>
                <Link to="/manageteam">
                  <i className="fas fa-users"></i> Team
                </Link>
              </li>
              <li>
                <Link to="/attendance">
                  <i className="fas fa-camera"></i> Attendance
                </Link>
              </li>
              <li>
                <Link to="/album">
                  <i className="fas fa-images"></i> Albums
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
      <div className="logout-container">
        <button onClick={handleLogout} className="logout-btn">
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;