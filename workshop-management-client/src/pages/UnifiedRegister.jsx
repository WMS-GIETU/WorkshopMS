import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './UnifiedRegister.css';

const UnifiedRegister = () => {
  return (
    <>
      <Header />
      <div className="unified-register-container">
        <h2>Choose Your Registration Type</h2>
        <div className="registration-options">
          <Link to="/register/admin-club" className="option-card">
            <h3>Admin / Club Member</h3>
            <p>Register as an admin or a club member to manage workshops and club activities.</p>
          </Link>
          <Link to="/register/student" className="option-card">
            <h3>Student</h3>
            <p>Register as a student to enroll in workshops and view your progress.</p>
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default UnifiedRegister;