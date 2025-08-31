import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import * as faceapi from 'face-api.js';
import { useAuth } from '../context/AuthContext';
import './Attendance.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Attendance = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [videoReady, setVideoReady] = useState(false);

  const { user } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [participants, setParticipants] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [selectedWorkshopDetails, setSelectedWorkshopDetails] = useState(null);
  
  const [modalMode, setModalMode] = useState('view');
  const [scanFace, setScanFace] = useState(false);
  const [scannedUser, setScannedUser] = useState(null);
  const [scanStatus, setScanStatus] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  
  const [editingWorkshopId, setEditingWorkshopId] = useState(null);
  const intervalRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  useEffect(() => {
    const fetchFaceData = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/face', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const faceData = await response.json();
      if (Array.isArray(faceData) && faceData.length > 0) {
        const labeledFaceDescriptors = faceData
          .filter(fd => fd.userId && fd.userId._id && Array.isArray(fd.faceDescriptors) && fd.faceDescriptors.length > 0)
          .map(fd =>
            new faceapi.LabeledFaceDescriptors(
              String(fd.userId._id),
              fd.faceDescriptors.map(d => new Float32Array(d))
            )
          );

        if (labeledFaceDescriptors.length > 0) {
          setFaceMatcher(new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5));
        } else {
          console.warn("No valid face descriptors found after filtering.");
          setFaceMatcher(null);
        }
      } else {
        console.warn("No face data received or face data is not an array.");
        setFaceMatcher(null);
      }
    };
    if (modelsLoaded) {
      fetchFaceData();
    }
  }, [modelsLoaded]);

  useEffect(() => {
    if (scanFace && modelsLoaded && faceMatcher && videoRef.current) {
      startVideo();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setVideoReady(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [scanFace, modelsLoaded, faceMatcher]);

  useEffect(() => {
    if (videoReady && scanFace) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const displaySize = { width: video.clientWidth, height: video.clientHeight };
      faceapi.matchDimensions(canvas, displaySize);

      intervalRef.current = setInterval(async () => {
        if (faceMatcher) {
          setScanStatus('Scanning...');
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

          if (detections.length > 0) {
            const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);
            if (bestMatch.label !== 'unknown') {
              setScanStatus(`Face recognized: ${bestMatch.label}`);
              handleFaceScan(bestMatch.label);
            } else {
              setScanStatus('Face not recognized. Please try again.');
            }
          } else {
            setScanStatus('No face detected. Please position your face in the center.');
          }
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [videoReady, scanFace, faceMatcher]);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setVideoReady(true);
        };
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
        setVideoReady(false);
        alert("Error accessing camera. Please ensure camera permissions are granted and no other application is using the camera.");
      });
  };

  const handleFaceScan = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setScannedUser(data.user);
      } else {
        alert('User not found.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      alert('An error occurred while fetching user data.');
    }
  };

  const handleConfirmAttendance = async (scannedUser) => {
    if (!selectedWorkshop || !scannedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workshopId: selectedWorkshop,
          presentUserIds: [scannedUser._id]
        })
      });

      if (response.ok) {
        alert('Attendance marked successfully!');
        setParticipants(prev => [...prev, { user: scannedUser }]);
        setScannedUser(null);
        setScanFace(false);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to mark attendance.');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('An error occurred while marking attendance.');
    }
  };

  const handleRetryScan = () => {
    setScannedUser(null);
  };

  const handleRemoveAttendee = async (workshopId, userId) => {
    if (!workshopId || !userId) return;

    if (window.confirm('Are you sure you want to remove this attendee?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/attendance/${workshopId}/attendees/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          alert('Attendee removed successfully!');
          setParticipants(prev => prev.filter(p => p.user._id !== userId));
        } else {
          const data = await response.json();
          alert(data.message || 'Failed to remove attendee.');
        }
      } catch (error) {
        console.error('Error removing attendee:', error);
        alert('An error occurred while removing the attendee.');
      }
    }
  };

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
          fetchWorkshops();
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/attendance/${workshopId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
        setIsModalOpen(true);
      } else {
        alert('Failed to fetch participants for marking attendance.');
      }
    } catch (error) {
      console.error('Error fetching participants for marking attendance:', error);
      alert('An error occurred while fetching participants for marking attendance.');
    }
  };

  const fetchWorkshopAndParticipantsForModal = async (workshopId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/workshops/${workshopId}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSelectedWorkshopDetails(data.workshop);
      setParticipants(data.participants);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching workshop and participants for modal:', err);
      alert('Failed to load workshop details and participants.');
    }
  };

  const handleViewParticipants = (workshopId) => {
    setModalMode('view');
    setSelectedWorkshop(workshopId);
    fetchWorkshopAndParticipantsForModal(workshopId);
  };

  const handleMarkAttendance = (workshopId) => {
    setModalMode('mark');
    setSelectedWorkshop(workshopId);
    fetchParticipants(workshopId);
  };

  const handleUpdateWorkshop = async () => {
    try {
      const token = localStorage.getItem('token');
      const workshopDataToSend = { ...editingWorkshop };

      if (workshopDataToSend.image && workshopDataToSend.image.image && workshopDataToSend.image.image.data) {
        workshopDataToSend.image = workshopDataToSend.image._id;
      } else if (workshopDataToSend.image && workshopDataToSend.image._id) {
        workshopDataToSend.image = workshopDataToSend.image._id;
      } else {
        workshopDataToSend.image = null;
      }

      const response = await fetch(`/api/workshops/${workshopDataToSend._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(workshopDataToSend)
      });

      if (response.ok) {
        alert('Workshop updated successfully!');
        setIsEditModalOpen(false);
        setEditingWorkshop(null);
        fetchWorkshops();
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
    setScanFace(false);
    setScannedUser(null);
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
                            {editingWorkshopId === workshop._id ? <div className="loading-spinner-small"></div> : '✎'}
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

      {isModalOpen && modalMode === 'view' && selectedWorkshopDetails && (
        <div className="attendance-modal-overlay" onClick={closeModal}>
          <div className="attendance-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wp-actions">
              <button onClick={() => {
                const input = document.getElementById('participants-content-to-print');
                html2canvas(input, {
                  scale: 2,
                  useCORS: true,
                 

                  width: input.scrollWidth,
                  height: input.scrollHeight,
                  windowWidth: input.scrollWidth,
                  windowHeight: input.scrollHeight
                }).then((canvas) => {
                  const imgData = canvas.toDataURL('image/png');
                  const pdf = new jsPDF('p', 'mm', 'a4');
                  const imgWidth = 190;
                  const pageHeight = 297;
                  const imgHeight = (canvas.height * imgWidth) / canvas.width;
                  let heightLeft = imgHeight;
                  let position = 10;

                  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                  heightLeft -= pageHeight - 20;

                  while (heightLeft > 0) {
                    position = heightLeft - imgHeight + 10;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight - 20;
                  }
                  pdf.save(`workshop_${selectedWorkshopDetails._id}_participants.pdf`);
                });
              }} className="wp-button">Download PDF</button>
            </div>

            <div id="participants-content-to-print" className="wp-table-container">
              <h2>Workshop Participants</h2>
              <div className="wp-details">
                <p><strong>Workshop Name:</strong> {selectedWorkshopDetails.name}</p>
                <p><strong>Club Name:</strong> {selectedWorkshopDetails.clubCode}</p>
                <p><strong>Date:</strong> {new Date(selectedWorkshopDetails.date).toLocaleDateString()}</p>
              </div>
              {participants.length > 0 ? (
                <table className="wp-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Roll No</th>
                      <th>Mobile No</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((participant) => (
                      <tr key={participant.user._id}>
                        <td>{participant.user.name}</td>
                        <td>{participant.user.rollNo}</td>
                        <td>{participant.user.mobileNumber || 'N/A'}</td>
                        <td>{participant.user.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="wp-no-participants">No participants registered for this workshop yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && modalMode === 'mark' && (
        <div className="attendance-modal-overlay" onClick={closeModal}>
          <div className="attendance-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Mark Attendance</h2>
            <div className="attendance-modal-header">
                <button onClick={() => setScanFace(true)}>New</button>
            </div>
            {scanFace ? (
              <div>
                {!videoReady && <p>Loading camera...</p>}
                <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                  <video ref={videoRef} style={{ display: 'block', width: '100%', height: 'auto' }} autoPlay muted playsInline />
                  <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                </div>
                <p>{scanStatus}</p>
                {scannedUser && (
                  <div>
                    <p>Name: {scannedUser.username}</p>
                    <p>Roll No: {scannedUser.rollNo}</p>
                    <button onClick={() => handleConfirmAttendance(scannedUser)}>Confirm</button>
                    <button onClick={() => handleRetryScan()}>Retry</button>
                  </div>
                )}
              </div>
            ) : (
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((participant) => (
                    <tr key={participant.user._id}>
                      <td>{participant.user.username}</td>
                      <td>{participant.user.rollNo}</td>
                      <td>
                        <button className="icon-button" onClick={() => handleRemoveAttendee(selectedWorkshop, participant.user._id)} title="Remove"><FontAwesomeIcon icon={faTrash} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {isEditModalOpen && editingWorkshop && (
        <div className="attendance-modal-overlay" onClick={closeEditModal}>
          <div className="attendance-modal-content" onClick={(e) => e.stopPropagation()}>
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
                  readOnly
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