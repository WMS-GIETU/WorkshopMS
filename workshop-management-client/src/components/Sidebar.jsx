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
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <Link to="/intro">
        <div className="user">
          <img src="/user_icon.jpg" alt="User" className="user-icon" />
          <span className="user-name">{getClubName(user?.clubCode) || 'Club'}</span>
        </div>
      </Link>
      <ul className="menu">
        {isAdmin() ? (
          <>
            <li><Link to="/new-workshop">📌 New Workshop</Link></li>
            <li><Link to="/workshop-requests">📝 Requests
              {isAdmin() && pendingRequestsCount > 0 && (
                <span className="pending-requests-badge">{pendingRequestsCount}</span>
              )}
            </Link></li>
          </>
        ) : (
          <li><Link to="/workshop-requests">📝 Request Workshop</Link></li>
        )}
        <li><Link to="/workshops">📚 Workshops</Link></li>
        <li><Link to="/manageteam">👥 {isAdmin() ? 'Manage' : 'Team'}</Link></li>
        <li><Link to="/attendance">📝 Attendance</Link></li>
        <li><Link to="/album">🖼️ Albums</Link></li>
      </ul>
      <div className="logout">
        <button onClick={handleLogout} className="logout-btn">
          <span className="logout-icon">🚪</span>
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;