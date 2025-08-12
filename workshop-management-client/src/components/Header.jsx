import React from 'react';
import { Link } from 'react-router-dom';
import './HeaderFooter.css';

const Header = () => {
  return (
    <header className="header-main">
      <div className="header-left">
        <Link to="/" className="logo">WorkshopMS</Link>
      </div>
      <div className="header-right">
        <div className="login-dropdown">
          <button className="login-btn">Login/Register ⮟</button>
          <div className="login-options">
            <Link to="/admin-login">Admin</Link>
            <Link to="/club-login">Club Member</Link>
            <Link to="/register" className="register-btn">Register</Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
