import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './Attendance.css';

// Sample data (replace with dynamic data from an API or state)
const attendanceData = [
  { id: 1, name: 'Vinay', date: '11/07/2025', time: '6:30 to 7:30', venue: 'Smart class', topic: 'Robotics' },
  { id: 2, name: 'Tapan', date: '11/07/2025', time: '6:30 to 7:30', venue: 'Smart class', topic: 'Robotics' },
  { id: 3, name: 'Yashwant', date: '11/07/2025', time: '6:30 to 7:30', venue: 'Smart class', topic: 'Robotics' },
  { id: 4, name: 'Ganesh', date: '11/07/2025', time: '6:30 to 7:30', venue: 'Smart class', topic: 'Robotics' },
];

const Attendance = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isNewMemberOverlayOpen, setIsNewMemberOverlayOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState(null);
  const { user } = useAuth();
  // TODO: Filter attendance data by user.clubCode when using dynamic data
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    barcode: '',
    image: null,
  });

  const handleAttendanceClick = (attendee) => {
    setSelectedAttendee(attendee);
    setIsOverlayOpen(true);
  };

  const closeOverlay = () => {
    setIsOverlayOpen(false);
    setSelectedAttendee(null);
  };

  const openNewMemberOverlay = () => {
    setIsNewMemberOverlayOpen(true);
  };

  const closeNewMemberOverlay = () => {
    setIsNewMemberOverlayOpen(false);
    setNewMemberData({ name: '', barcode: '', image: null });
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setNewMemberData({ ...newMemberData, image: files[0] });
    } else {
      setNewMemberData({ ...newMemberData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form submitted with data: ' + JSON.stringify(newMemberData));
    closeNewMemberOverlay();
  };

  const handleConfirm = () => {
    alert('Confirmed new member data');
  };

  const handleReject = () => {
    alert('Rejected new member data');
    setNewMemberData({ name: '', barcode: '', image: null });
  };

  const startScanner = () => {
  };

  const isScanning = () => {
  };

  const stopScanner = () => {
  };

  const barcodeResult = () => {
  };

  return (
    <div className="container">
      <Sidebar />
      <div className="att-main-content">
        <div className="header">
          <h1>Workshop's Attendance</h1>
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
                <th>Topic</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record.id}>
                  <td>{record.name}</td>
                  <td>{record.date}</td>
                  <td>{record.time}</td>
                  <td>{record.venue}</td>
                  <td>{record.topic}</td>
                  <td>
                    <span
                      className="icon icon-edit"
                      aria-label={`Edit ${record.name}`}
                      onClick={() => alert(`Edit clicked for ${record.name}`)}
                    ></span>
                    <span
                      className="icon icon-delete"
                      aria-label={`Delete ${record.name}`}
                      onClick={() => alert(`Delete clicked for ${record.name}`)}
                    ></span>
                    <span
                      className="icon icon-attnd"
                      aria-label={`Mark attendance for ${record.name}`}
                      onClick={() => handleAttendanceClick(record)}
                    ></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isOverlayOpen && selectedAttendee && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Attendance Details</h2>
            <div className="overlay-header">
              <p>Name: {selectedAttendee.name}</p>
              <p>Date: {selectedAttendee.date}</p>
              <p>Time: {selectedAttendee.time}</p>
              <button className="new-mem-button" onClick={openNewMemberOverlay}>
                New
              </button>
              <button className="close-button" onClick={closeOverlay}>
                Close
              </button>
            </div>
            <div className="overlay-table">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll No.</th>
                    <th>Branch</th>
                    <th>Section</th>
                    <th>Year</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((record) => (
                    <tr key={record.id}>
                      <td>{record.name}</td>
                      <td>{record.date}</td>
                      <td>{record.time}</td>
                      <td>{record.venue}</td>
                      <td>{record.topic}</td>
                      <td>
                        <span
                          className="icon icon-edit"
                          aria-label={`Edit ${record.name}`}
                          onClick={() => alert(`Edit clicked for ${record.name}`)}
                        ></span>
                        <span
                          className="icon icon-delete"
                          aria-label={`Delete ${record.name}`}
                          onClick={() => alert(`Delete clicked for ${record.name}`)}
                        ></span>
                        <span
                          className="icon icon-attnd"
                          aria-label={`Mark attendance for ${record.name}`}
                          onClick={() => handleAttendanceClick(record)}
                        ></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isNewMemberOverlayOpen && (
        <div className="overlay">
          <div className="overlay-content">
            <h2>Add New Member</h2>
            <form onSubmit={handleSubmit} className="new-member-form">
              <div className="form-group">
                <label htmlFor="name">Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newMemberData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Scan The ID Card:</label>
                <div id="scanner-container" style={{ margin: '20px auto', width: '640px' }}>
                  <div id="scanner-viewport" className="viewport" style={{ width: '200px', height: '225px', border: '1px solid #ccc' }}></div>
                  <button
                    type="button"
                    onClick={startScanner}
                    disabled={isScanning}
                    style={{ padding: '10px 20px', margin: '5px', fontSize: '16px' }}
                  >
                    Start Scanner
                  </button>
                  <button
                    type="button"
                    onClick={stopScanner}
                    disabled={!isScanning}
                    style={{ padding: '10px 20px', margin: '5px', fontSize: '16px' }}
                  >
                    Stop Scanner
                  </button>
                  <div id="result" style={{ marginTop: '20px' }}>
                    Scanned Barcode: {barcodeResult}
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="confirm-button" onClick={handleConfirm}>
                  Confirm
                </button>
                <button type="button" className="reject-button" onClick={handleReject}>
                  Reject
                </button>
                
              </div>
            </form>
              <button type="submit" className="submit-button">
                  Submit
              </button>
              <button className="close-button" onClick={closeNewMemberOverlay}>
              Close
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;