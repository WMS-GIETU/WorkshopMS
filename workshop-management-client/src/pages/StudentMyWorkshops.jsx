import React from 'react';

const StudentMyWorkshops = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>My Registered Workshops</h1>
      <p>This page will display a list of workshops you have registered for.</p>
      {/* Future: Fetch and display workshops from API */}
      <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
        <h3>Workshop Title Placeholder</h3>
        <p>Date: DD/MM/YYYY</p>
        <p>Status: Registered</p>
      </div>
    </div>
  );
};

export default StudentMyWorkshops;