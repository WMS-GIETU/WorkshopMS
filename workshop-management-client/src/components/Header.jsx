import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HeaderFooter.css';

const Header = () => {
  const navigate = useNavigate();

  const handleAboutClick = () => {
    navigate('/about');
  };

  return (
    <header className="header-main">
      <div className="header-left">
        <Link to="/" className="logo">WorkshopMS</Link>
      </div>
      <div className="header-right">
        <div className="about-link-wrapper">
          <button className="login-btn" onClick={handleAboutClick}>About</button>
        </div>
        <div className="login-dropdown">
          <button className="login-btn">Login/Register ⮟</button>
          <div className="login-options">
            <Link to="/admin-login">Admin</Link>
            <Link to="/club-login">Club Member</Link>
            <Link to="/student-login">Student</Link>
            <Link to="/register" className="register-btn">Register</Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
