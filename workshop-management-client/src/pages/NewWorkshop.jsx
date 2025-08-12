import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './NewWorkshop.css';

const NewWorkshop = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const request = location.state?.request;
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    topic: '',
    description: '',
    maxParticipants: '',
    clubCode: user?.clubCode || '',
    image: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (request) {
      setFormData({
        name: request.workshopName || '',
        date: request.date || '',
        time: request.time || '',
        location: request.location || '',
        topic: request.topic || '',
        description: request.description || '',
        maxParticipants: request.maxParticipants || '',
        clubCode: request.clubCode || user?.clubCode || '',
        image: null // File cannot be pre-filled, but image URL can be handled separately if needed
      });
    }
  }, [request, user]);

  useEffect(() => {
    if (user && !request) {
      setFormData(prev => ({
        ...prev,
        clubCode: user.clubCode || ''
      }));
    }
  }, [user, request]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin()) {
      alert('Only admins can create workshops.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/workshops/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        alert('Workshop created successfully!');
        setFormData({
          name: '',
          date: '',
          time: '',
          location: '',
          topic: '',
          description: '',
          maxParticipants: '',
          clubCode: user?.clubCode || '',
          image: null
        });
        navigate('/workshops'); // Assuming a route to view workshops
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to create workshop');
      }
    } catch (error) {
      alert('Failed to create workshop. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="container">
        <Sidebar />
        <main className="main-content">
          <div className="workshop-form">
            <div className="form-header">
              <h2>Create New Workshop</h2>
              <div className="user-info">
                <span className='user-role'>
                  Logged in as: {user?.username} ({Array.isArray(user?.roles) && user.roles.includes('admin') ? 'Administrator' : 'Club Member'})
                </span>
              </div>
            </div>
            <div className='admin-only-message'>
              <p>Only administrators can create workshops directly.</p>
              <p>Club members can request workshops for admin approval.</p>
              <button 
                className="request-workshop-btn"
                onClick={() => navigate('/workshop-requests')}
              >
                📝 Request Workshop
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <div className="workshop-form">
          <div className="form-header">
            <h2>{request ? 'Create Workshop from Request' : 'Create New Workshop'}</h2>
            <div className="user-info">
              <span className='user-role'>
                Logged in as: {user?.username} ({Array.isArray(user?.roles) && user.roles.includes('admin') ? 'Administrator' : 'Club Member'})
              </span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Workshop Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter workshop name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input 
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Time *</label>
                <input 
                  type="time" 
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter venue/location"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Topic *</label>
              <input 
                type="text" 
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="Enter workshop topic"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter workshop description"
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Max Participants</label>
                <input 
                  type="number" 
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  placeholder="Enter max participants"
                  min="1"
                />
              </div>
              <div className="form-group">
                <label>Club Code</label>
                <input 
                  type="text" 
                  name="clubCode"
                  value={formData.clubCode}
                  onChange={handleChange}
                  placeholder="Enter club code"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Workshop Image</label>
              <input 
                type="file" 
                name="image"
                accept="image/*"
                onChange={handleChange}
              />
              {formData.image && (
                <p className="image-preview-name">
                  Selected: {formData.image.name}
                </p>
              )}
              {request && request.image && (
                <div>
                  <p>Existing Image:</p>
                  <img src={`http://localhost:5000/${request.image}`} alt="Existing workshop image" style={{maxWidth: '200px'}} />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Workshop...' : 'Create Workshop'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewWorkshop;