import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './Workshops.css';

const Workshops = () => {
  const { user, isAdmin } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/workshops', {
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
      const response = await fetch(`http://localhost:5000/api/workshops/${workshopId}`, {
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
          {workshops.map((workshop) => (
            <div key={workshop._id} className="workshop-card">
              {workshop.image && (
                <img src={`http://localhost:5000/${workshop.image}`} alt={workshop.name} className="workshop-image" />
              )}
              <h3>{workshop.name}</h3>
              <p className="topic">{workshop.topic}</p>
              <p><strong>Date:</strong> {workshop.date}</p>
              <p><strong>Time:</strong> {workshop.time}</p>
              <p><strong>Location:</strong> {workshop.location}</p>
              {workshop.description && (
                <p><strong>Description:</strong> {workshop.description}</p>
              )}
              {workshop.maxParticipants > 0 && (
                <p><strong>Max Participants:</strong> {workshop.maxParticipants}</p>
              )}
              <p><strong>Club Code:</strong> {workshop.clubCode}</p>
              {isAdmin && (
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteWorkshop(workshop._id)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workshops;