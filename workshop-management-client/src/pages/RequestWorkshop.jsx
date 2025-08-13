import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RequestWorkshop.css';

const RequestWorkshop = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    workshopName: '',
    date: '',
    time: '',
    location: '',
    topic: '',
    description: '',
    maxParticipants: ''
  });
  const [imageFile, setImageFile] = useState(null); // New state for image file

  // Redirect if user is admin (admins create workshops directly)
  if (isAdmin()) {
    navigate('/new-workshop');
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, files } = e.target; // Destructure type and files
    if (type === 'file') {
      setImageFile(files[0]); // Set the selected file
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to submit a workshop request.');
      return;
    }

    setIsSubmitting(true);
    
    // Create FormData object to send both text and file data
    const formDataToSend = new FormData();
    for (const key in formData) {
      formDataToSend.append(key, formData[key]);
    }
    if (imageFile) {
      formDataToSend.append('image', imageFile); // Append the image file
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/workshop-requests/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'application/json', // Do NOT set Content-Type for FormData
        },
        body: formDataToSend // Send FormData object
      });

      if (response.ok) {
        alert('Workshop request submitted successfully! An admin will review and approve it.');
        setFormData({
          workshopName: '',
          date: '',
          time: '',
          location: '',
          topic: '',
          description: '',
          maxParticipants: ''
        });
        setImageFile(null); // Clear image file state
        navigate('/workshop-requests');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to submit workshop request');
      }
    } catch (error) {
      console.error('Submit request error:', error);
      alert('Failed to submit workshop request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="request-workshop-container">
      <div className="request-workshop-header">
        <h1>Request Workshop</h1>
        <p>Submit a workshop request for admin approval</p>
        <div className="user-info">
          <span className="user-role">
            Logged in as: {user?.username} (Club Member)
          </span>
          <span className="club-code">
            Club: {user?.clubCode}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="request-workshop-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="workshopName">Workshop Name *</label>
            <input
              type="text"
              id="workshopName"
              name="workshopName"
              value={formData.workshopName}
              onChange={handleChange}
              placeholder="Enter workshop name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="time">Time *</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter venue/location"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="topic">Topic *</label>
          <input
            type="text"
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            placeholder="Enter workshop topic"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter workshop description"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="maxParticipants">Maximum Participants</label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            value={formData.maxParticipants}
            onChange={handleChange}
            placeholder="Enter max participants"
            min="1"
          />
        </div>

        {/* New form group for image upload */}
        <div className="form-group">
          <label htmlFor="image">Workshop Image (Optional)</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/jpeg,image/png"
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate('/workshop-requests')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>

      <div className="info-section">
        <h3>How it works:</h3>
        <ol>
          <li>Fill out this form with your workshop details</li>
          <li>Submit the request for admin review</li>
          <li>Admin will approve or reject your request</li>
          <li>If approved, the workshop will be automatically created</li>
          <li>You can track your request status in the Workshop Requests section</li>
        </ol>
      </div>
    </div>
  );
};

export default RequestWorkshop;