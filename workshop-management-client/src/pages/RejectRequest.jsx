import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ApproveRequest.css';

const RejectRequest = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      const response = await fetch(`/api/registration-requests/status/${requestId}`);
      const data = await response.json();
      
      if (response.ok) {
        setRequest(data);
      } else {
        setError(data.message || 'Failed to fetch request details');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/registration-requests/reject/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejectedBy: request?.requestType === 'admin' ? 'systemAdmin' : 'clubAdmin',
          rejectionReason: rejectionReason.trim()
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('❌ Registration request rejected. The user will receive an email notification.');
        navigate('/');
      } else {
        alert('❌ Failed to reject request: ' + data.message);
      }
    } catch (error) {
      alert('❌ Error rejecting request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="approve-container">
        <div className="approve-card">
          <div className="loading">Loading request details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="approve-container">
        <div className="approve-card">
          <div className="error">❌ {error}</div>
          <button onClick={() => navigate('/')} className="back-btn">Go Back</button>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="approve-container">
        <div className="approve-card">
          <div className="error">❌ Request not found</div>
          <button onClick={() => navigate('/')} className="back-btn">Go Back</button>
        </div>
      </div>
    );
  }

  if (request.status !== 'pending') {
    return (
      <div className="approve-container">
        <div className="approve-card">
          <div className="status-message">
            {request.status === 'approved' ? '✅' : '❌'} 
            This request has already been {request.status}
          </div>
          <button onClick={() => navigate('/')} className="back-btn">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="approve-container">
      <div className="approve-card">
        <h1>Reject Registration Request</h1>
        
        <div className="request-details">
          <h2>User Details</h2>
          <div className="detail-row">
            <span className="label">Username:</span>
            <span className="value">{request.username}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email:</span>
            <span className="value">{request.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">Role:</span>
            <span className="value">{request.role === 'admin' ? 'Administrator' : 'Club Member'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Club Code:</span>
            <span className="value">{request.clubCode}</span>
          </div>
          <div className="detail-row">
            <span className="label">Request Type:</span>
            <span className="value">{request.requestType === 'admin' ? 'Admin Registration' : 'Member Registration'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Request Date:</span>
            <span className="value">{new Date(request.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="rejection-reason">
          <h3>Rejection Reason</h3>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this registration request..."
            rows="4"
            required
          />
        </div>

        <div className="action-buttons">
          <button 
            onClick={handleReject} 
            disabled={processing || !rejectionReason.trim()}
            className="reject-btn"
          >
            {processing ? 'Processing...' : '❌ Reject Request'}
          </button>
        </div>

        <button onClick={() => navigate('/')} className="back-btn">
          ← Go Back
        </button>
      </div>
    </div>
  );
};

export default RejectRequest; 