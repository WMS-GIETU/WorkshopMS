import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './Workshops.css';

const Workshops = () => {
  const { user, isAdmin } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredWorkshops, setRegisteredWorkshops] = useState(new Set());

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
    fetchWorkshops();
    if (user) {
      fetchRegisteredWorkshops();
    }
  }, [user]);

  const fetchWorkshops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/workshops', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkshops(data);
      }
    } catch (error) {
      console.error('Error fetching workshops:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredWorkshops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/workshop-registrations/user/${user.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRegisteredWorkshops(new Set(data.map(reg => reg.workshop._id)));
      }
    } catch (error) {
      console.error('Error fetching registered workshops:', error);
    }
  };

  const handleRegister = async (workshopId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/workshop-registrations/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ workshopId })
      });

      if (response.ok) {
        alert('Successfully registered for the workshop!');
        setRegisteredWorkshops(new Set([...registeredWorkshops, workshopId]));
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to register for the workshop.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('An error occurred during registration.');
    }
  };

  const handleDeleteWorkshop = async (workshopId) => {
    if (!isAdmin) {
      alert('Only admins can delete workshops');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this workshop?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/workshops/${workshopId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setWorkshops(workshops.filter(workshop => workshop._id !== workshopId));
        alert('Workshop deleted successfully');
      } else {
        alert('Failed to delete workshop');
      }
    } catch (error) {
      console.error('Delete workshop error:', error);
      alert('Failed to delete workshop');
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <Sidebar />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Sidebar />
      <div className="home-header">
        <h1>Workshops</h1>
        <div className="user-info">
          <span className='user-role'>
            Logged in as: {user?.username} ({Array.isArray(user?.roles) && user.roles.includes('admin') ? 'Administrator' : 'Club Member'})
          </span>
        </div>
      </div>

      {workshops.length === 0 ? (
        <div className="no-workshops">
          <p>No workshops found.</p>
        </div>
      ) : (
        <div className="workshop-cards">
          {workshops.map((workshop) => {
            const isRegistered = registeredWorkshops.has(workshop._id);
            const isPast = new Date(workshop.date) < new Date();

            return (
              <div key={workshop._id} className="workshop-card">
                {console.log('Workshop image data:', workshop.image)}
                {workshop.image && (
                  <img src={getImageSrc(workshop.image.image)} alt={workshop.name} className="workshop-image" />
                )}
                <h3>{workshop.name}</h3>
                <p className="topic">{workshop.topic}</p>
                <p><strong>Date:</strong> {new Date(workshop.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {workshop.time}</p>
                <p><strong>Location:</strong> {workshop.location}</p>
                {workshop.description && (
                  <p><strong>Description:</strong> {workshop.description}</p>
                )}
                {workshop.maxParticipants > 0 && (
                  <p><strong>Max Participants:</strong> {workshop.maxParticipants}</p>
                )}
                <p><strong>Club Code:</strong> {workshop.clubCode}</p>
                <div className="card-actions">
                  {isAdmin ? (
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteWorkshop(workshop._id)}
                    >
                      Delete
                    </button>
                  ) : (
                    <button 
                      className="register-btn"
                      onClick={() => handleRegister(workshop._id)}
                      disabled={isRegistered || isPast}
                    >
                      {isRegistered ? 'Registered' : (isPast ? 'Past' : 'Register')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Workshops;