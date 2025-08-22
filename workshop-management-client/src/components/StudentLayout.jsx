import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Import the Sidebar component
import './Sidebar.css'; // Reusing Sidebar styles

const StudentLayout = () => {
  return (
    <div className="layout-container">
      <div className="main-content-wrapper">
        <Sidebar /> {/* Use the unified Sidebar component */}
        <main className="main-content">
          <Outlet /> {/* This is where the routed components will be rendered */}
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;