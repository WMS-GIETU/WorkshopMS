import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './Attendance.css';

const Attendance = () => {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [participants, setParticipants] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [presentUserIds, setPresentUserIds] = useState(new Set());
  const [modalMode, setModalMode] = useState('view'); // 'view' or 'mark'

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  
  const [editingWorkshopId, setEditingWorkshopId] = useState(null);

  useEffect(() => {
    if (user && user.clubCode) {
      fetchWorkshops();
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

  const handleEdit = async (workshopId) => {
    setEditingWorkshopId(workshopId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/workshops/${workshopId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEditingWorkshop(data);
        setIsEditModalOpen(true);
      } else {
        console.error(`Failed to fetch workshop details: ${response.status} ${response.statusText}`);
        alert('Failed to fetch workshop details for editing.');
      }
    } finally {
      setEditingWorkshopId(null);
    }
  };

  const handleDelete = async (workshopId) => {
    if (window.confirm('Are you sure you want to delete this workshop?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/workshops/${workshopId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          alert('Workshop deleted successfully!');
          fetchWorkshops(); // Re-fetch workshops to update the list
        } else {
          const data = await response.json();
          alert(data.message || 'Failed to delete workshop.');
        }
      } catch (error) {
        console.error('Error deleting workshop:', error);
        alert('An error occurred while deleting the workshop.');
      }
    }
  };

  const fetchParticipants = async (workshopId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/workshop-registrations/workshop/${workshopId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
        setIsModalOpen(true);
      } else {
  alert('Failed to fetch participants.');
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      alert('An error occurred while fetching participants.');
    }
  };

  const handleViewParticipants = (workshopId) => {
    setModalMode('view');
    fetchParticipants(workshopId);
  };

  const handleMarkAttendance = (workshopId) => {
    setModalMode('mark');
    setSelectedWorkshop(workshopId);
    fetchParticipants(workshopId);
  };

  const handleCheckboxChange = (userId) => {
    setPresentUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleAttendanceSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ workshopId: selectedWorkshop, presentUserIds: Array.from(presentUserIds) })
      });

      if (response.ok) {
        alert('Attendance submitted successfully!');
        closeModal();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to submit attendance.');
      }
    } catch (error) {
      console.error('Attendance submission error:', error);
      alert('An error occurred during attendance submission.');
    }
  };

  const handleUpdateWorkshop = async () => {
    try {
      const token = localStorage.getItem('token');

      // Create a copy of editingWorkshop to modify before sending
      const workshopDataToSend = { ...editingWorkshop };

      // If the image data is present (meaning it was populated from backend), remove it
      // We only need to send the image ID if the image itself is not being updated
      if (workshopDataToSend.image && workshopDataToSend.image.image && workshopDataToSend.image.image.data) {
        workshopDataToSend.image = workshopDataToSend.image._id; // Send only the image ID
      } else if (workshopDataToSend.image && workshopDataToSend.image._id) {
        // If it's just the ID, keep it as is
        workshopDataToSend.image = workshopDataToSend.image._id;
      } else {
        // If no image or image data, set to null
        workshopDataToSend.image = null;
      }

      const response = await fetch(`/api/workshops/${workshopDataToSend._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(workshopDataToSend) // Send the modified data
      });

      if (response.ok) {
        alert('Workshop updated successfully!');
        setIsEditModalOpen(false);
        setEditingWorkshop(null);
        fetchWorkshops(); // Re-fetch workshops to update the list
      } else {
        console.error(`Failed to update workshop: ${response.status} ${response.statusText}`);
        const data = await response.json();
        alert(data.message || 'Failed to update workshop.');
      }
    } catch (error) {
      console.error('Error updating workshop:', error);
      alert('An error occurred while updating the workshop.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setParticipants([]);
    setSelectedWorkshop(null);
    setPresentUserIds(new Set());
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingWorkshop(null);
  };

  if (loading) {
    return (
      <div className="container">
        <Sidebar />
        <div className="loading">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Sidebar />
      
      <div className="att-main-content">
        <div className="header">
          <h1>Workshop Attendance</h1>
          <div className='user-info'>
            <span className='user-role'>
              Logged in as: {user?.username} ({Array.isArray(user?.roles) && user.roles.includes('admin') ? 'Administrator' : 'Club Member'})
            </span>
          </div>
        </div>
        <div className="table-content">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workshops.map((workshop) => {
                const isPast = new Date(workshop.date) < new Date();
                return (
                  <tr key={workshop._id}>
                    <td>{workshop.name}</td>
                    <td>{new Date(workshop.date).toLocaleDateString()}</td>
                    <td>{workshop.time}</td>
                    <td>{workshop.location}</td>
                    <td className="actions-cell">
                      {user && user.roles && user.roles.includes('admin') && (
                        <>
                          <button className="icon-button" onClick={() => handleEdit(workshop._id)} title="Edit">
                            {editingWorkshopId === workshop._id ? <div className="loading-spinner-small"></div> : '\u270E'}
                          </button>
                          <button className="icon-button" onClick={() => handleDelete(workshop._id)} title="Delete">&#128465;</button>
                        </>
                      )}
                      <button className="icon-button" onClick={() => handleViewParticipants(workshop._id)} title="Participants">&#128100;</button>
                      <button className="icon-button" onClick={() => handleMarkAttendance(workshop._id)} disabled={isPast} title={isPast ? 'Attendance Closed' : 'Mark Attendance'}>
                        {isPast ? '❌' : '✅'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalMode === 'view' ? 'Workshop Participants' : 'Mark Attendance'}</h2>
            {participants.length > 0 ? (
              <div>
                <ul>
                  {participants.map(reg => (
                    <li key={reg._id}>
                      {modalMode === 'mark' && (
                        <input 
                          type="checkbox" 
                          checked={presentUserIds.has(reg.user._id)}
                          onChange={() => handleCheckboxChange(reg.user._id)}
                        />
                      )}
                      {reg.user.username} ({reg.user.email})
                    </li>
                  ))}
                </ul>
                {modalMode === 'mark' && (
                  <button onClick={handleAttendanceSubmit}>Submit Attendance</button>
                )}
              </div>
            ) : (
              <p>No participants registered for this workshop yet.</p>
            )}
          </div>
        </div>
      )}

      {isEditModalOpen && editingWorkshop && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Workshop</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateWorkshop(); }}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editingWorkshop.name}
                  onChange={(e) => setEditingWorkshop({ ...editingWorkshop, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Topic:</label>
                <input
                  type="text"
                  value={editingWorkshop.topic}
                  onChange={(e) => setEditingWorkshop({ ...editingWorkshop, topic: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  value={editingWorkshop.date ? new Date(editingWorkshop.date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingWorkshop({ ...editingWorkshop, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time:</label>
                <input
                  type="time"
                  value={editingWorkshop.time}
                  onChange={(e) => setEditingWorkshop({ ...editingWorkshop, time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location:</label>
                <input
                  type="text"
                  value={editingWorkshop.location}
                  onChange={(e) => setEditingWorkshop({ ...editingWorkshop, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={editingWorkshop.description || ''}
                  onChange={(e) => setEditingWorkshop({ ...editingWorkshop, description: e.target.value })}
                ></textarea>
              </div>
              <div className="form-group">
                <label>Max Participants:</label>
                <input
                  type="number"
                  value={editingWorkshop.maxParticipants || ''}
                  onChange={(e) => setEditingWorkshop({ ...editingWorkshop, maxParticipants: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Club Code:</label>
                <input
                  type="text"
                  value={editingWorkshop.clubCode || ''}
                  readOnly // Make the field non-editable
                />
              </div>
              <button type="submit">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;