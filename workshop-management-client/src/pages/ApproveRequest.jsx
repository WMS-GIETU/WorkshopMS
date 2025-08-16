import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ApproveRequest.css';

const ApproveRequest = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

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

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/registration-requests/approve/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvedBy: request?.requestType === 'admin' ? 'systemAdmin' : 'clubAdmin'
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Registration request approved successfully! The user will receive an email notification.');
        navigate('/');
      } else {
        alert('❌ Failed to approve request: ' + data.message);
      }
    } catch (error) {
      alert('❌ Error approving request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    setProcessing(true);
    try {
      const response = await fetch(`/api/registration-requests/reject/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejectedBy: request?.requestType === 'admin' ? 'systemAdmin' : 'clubAdmin',
          rejectionReason: reason || 'No reason provided'
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
        <h1>Registration Request Approval</h1>
        
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
            <span className="value">{request.roles === 'admin' ? request.roles : request.roles}</span>
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

        <div className="action-buttons">
          <button 
            onClick={handleApprove} 
            disabled={processing}
            className="approve-btn"
          >
            {processing ? 'Processing...' : '✅ Approve Request'}
          </button>
          
          <button 
            onClick={handleReject} 
            disabled={processing}
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

export default ApproveRequest; 