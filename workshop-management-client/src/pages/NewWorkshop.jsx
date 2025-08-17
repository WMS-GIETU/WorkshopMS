import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './NewWorkshop.css';

const NewWorkshop = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { workshopId } = useParams(); // Get workshopId from URL parameters
  const request = location.state?.request;
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    topic: '',
    description: '',
    link: '',
    maxParticipants: '',
    clubCode: user?.clubCode || '',
    image: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper function to convert buffer to base64 URL
  const getImageSrc = (imageData) => {
    if (!imageData || !imageData.data || !imageData.contentType) return '';
    const buffer = imageData.data.data; // Access the actual buffer
    const b64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    return `data:${imageData.contentType};base64,${b64}`;
  };

  useEffect(() => {
    if (workshopId) {
      // Fetch workshop data for editing
      const fetchWorkshop = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/workshops/${workshopId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setFormData({
              name: data.name || '',
              date: data.date ? new Date(data.date).toISOString().split('T')[0] : '', // Format date for input
              time: data.time || '',
              location: data.location || '',
              topic: data.topic || '',
              description: data.description || '',
              link: data.link || '',
              maxParticipants: data.maxParticipants || '',
              clubCode: data.clubCode || user?.clubCode || '',
              image: null // Image file cannot be pre-filled, but existing image can be displayed
            });
          } else {
            alert('Failed to fetch workshop details.');
            navigate('/attendance'); // Redirect if workshop not found or error
          }
        } catch (error) {
          console.error('Error fetching workshop:', error);
          alert('An error occurred while fetching workshop details.');
          navigate('/attendance');
        } finally {
          setLoading(false);
        }
      };
      fetchWorkshop();
    } else {
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
      setLoading(false);
    }
  }, [workshopId, request, user, navigate]);

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

      const method = workshopId ? 'PUT' : 'POST';
      const url = workshopId ? `/api/workshops/${workshopId}` : '/api/workshops/create';

      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        alert(`Workshop ${workshopId ? 'updated' : 'created'} successfully!`);
        setFormData({
          name: '',
          date: '',
          time: '',
          location: '',
          topic: '',
          description: '',
          link: '',
          maxParticipants: '',
          clubCode: user?.clubCode || '',
          image: null
        });
        navigate('/workshops'); // Assuming a route to view workshops
      } else {
        const data = await response.json();
        alert(data.message || `Failed to ${workshopId ? 'update' : 'create'} workshop`);
      }
    } catch (error) {
      alert(`Failed to ${workshopId ? 'update' : 'create'} workshop. Please try again.`);
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

  if (loading) {
    return (
      <div className="container">
        <Sidebar />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <div className="workshop-form">
          <div className="form-header">
            <h2>{workshopId ? 'Edit Workshop' : (request ? 'Create Workshop from Request' : 'Create New Workshop')}</h2>
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

            <div className="form-group">
              <label>Link</label>
              <input 
                type="text" 
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="Enter workshop link"
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
                  <img src={getImageSrc(request.image)} alt="Existing workshop image" style={{maxWidth: '200px'}} />
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