import React from 'react';
import './HeaderFooter.css';

const Footer = () => {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Workshop Management System | Built by Team 3CSE</p>
    </footer>
  );
};

export default Footer;
