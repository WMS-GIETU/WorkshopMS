import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const ClubmemLogin = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [clubCode, setClubCode] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: rollNumber,
          password: password,
          clubCode: clubCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if user is a club member
        if (Array.isArray(data.user.roles) && data.user.roles.includes('clubMember')) {
          // Check if club code matches
          if (data.user.clubCode === clubCode) {
            login(data.user, data.token);
            navigate('/intro');
          } else {
            alert('Invalid club code');
          }
        } else {
          alert('This login is only for Club Members. Please use Admin Login for admin accounts.');
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Club Member Login</h2>
        <div className="form-group">
          <label>Student Roll no. :</label>
          <input 
            type="text" 
            name="rollNumber" 
            placeholder="Enter Roll Number" 
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            required 
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input 
            type="password" 
            placeholder="Enter password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>
        <div className="form-group">
          <label>Club Code:</label>
          <input 
            type="text" 
            name="clubCode" 
            placeholder="Enter Club's Unique Code" 
            value={clubCode}
            onChange={(e) => setClubCode(e.target.value)}
            required 
          />
        </div>
        <button type="submit">Login</button>
        
        <div className="register-link">
          Don't have an account? <span onClick={() => navigate('/register')}>Register here</span>
        </div>
      </form>
    </div>
  );
};

export default ClubmemLogin;
