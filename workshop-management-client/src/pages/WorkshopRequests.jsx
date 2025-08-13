import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './WorkshopRequests.css';

const WorkshopRequests = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/workshop-requests/requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/workshop-requests/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApproveRequest = async (requestId) => {
    const adminResponse = prompt('Enter approval message (optional):');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/workshop-requests/approve/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminResponse })
      });

      if (response.ok) {
        alert('Request approved successfully! Workshop has been automatically created.');
        fetchRequests();
        fetchStats();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    const adminResponse = prompt('Enter rejection reason (optional):');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/workshop-requests/reject/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminResponse })
      });

      if (response.ok) {
        alert('Request rejected');
        fetchRequests();
        fetchStats();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '⏳ Pending';
      case 'approved': return '✅ Approved';
      case 'rejected': return '❌ Rejected';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <Sidebar />
        <div className="wr-main-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Sidebar />
      <div className="wr-main-content">
        <div className="header">
        <h2>{isAdmin() ? 'All Requests' : 'My Workshop Requests'}</h2>
          <div className="user-info">
            <span className="user-role">
              {user?.username} ({Array.isArray(user?.roles) && user.roles.includes('admin') ? 'Administrator' : 'Club Member'})
            </span>
          </div>
        </div>

        {/* Statistics */}
        <div className="stats-section">
          <div className="stat-card">
            <h3>Total Requests</h3>
            <span className="stat-number">{stats.total || 0}</span>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <span className="stat-number pending">{stats.pending || 0}</span>
          </div>
          <div className="stat-card">
            <h3>Approved</h3>
            <span className="stat-number approved">{stats.approved || 0}</span>
          </div>
          <div className="stat-card">
            <h3>Rejected</h3>
            <span className="stat-number rejected">{stats.rejected || 0}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="actions-section">
          {!isAdmin() && (
            <button 
              className="submit-request-btn"
              onClick={() => navigate('/request-workshop')}
            >
              📝 Request New Workshop
            </button>
          )}
        </div>

        {/* Requests List */}
        <div className="requests-section">
          
          {requests.length === 0 ? (
            <div className="no-requests">
              <p>No workshop requests found.</p>
            </div>
          ) : (
            <div className="requests-grid">
              {requests.map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-header">
                    <h3>{request.workshopName}</h3>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(request.status) }}
                    >
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  <div className="request-details">
                    <p><strong>Date:</strong> {request.date}</p>
                    <p><strong>Time:</strong> {request.time}</p>
                    <p><strong>Location:</strong> {request.location}</p>
                    <p><strong>Topic:</strong> {request.topic}</p>
                    {request.description && (
                      <p><strong>Description:</strong> {request.description}</p>
                    )}
                    {request.maxParticipants > 0 && (
                      <p><strong>Max Participants:</strong> {request.maxParticipants}</p>
                    )}
                    <p><strong>Requested by:</strong> {request.requesterName}</p>
                    <p><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                    {request.adminResponse && (
                      <p><strong>Admin Response:</strong> {request.adminResponse}</p>
                    )}
                    {request.status === 'approved' && request.workshopId && (
                      <p><strong>Workshop Created:</strong> ✅ Workshop has been automatically created</p>
                    )}
                  </div>
                  {isAdmin() && (
                    <div className="request-actions">
                      {request.status === 'pending' && (
                        <>
                          <button 
                            className="approve-btn"
                            onClick={() => handleApproveRequest(request._id)}
                          >
                            ✅ Approve & Create Workshop
                          </button>
                          <button 
                            className="reject-btn"
                            onClick={() => handleRejectRequest(request._id)}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkshopRequests;