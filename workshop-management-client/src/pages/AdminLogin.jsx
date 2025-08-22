import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AdminLogin = () => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [clubCode, setClubCode] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: adminId,
          password: password,
          clubCode: clubCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Debug logging (remove in production)
        console.log('Login response:', data);
        console.log('User roles:', data.user.roles);
        console.log('Is array?', Array.isArray(data.user.roles));
        console.log('Includes admin?', data.user.roles.includes('admin'));

        // Check if user is an admin
        if (Array.isArray(data.user.roles) && data.user.roles.includes('admin')) {
          // Check if club code matches
          if (data.user.clubCode === clubCode) {
            login(data.user, data.token);
            navigate('/intro');
          } else {
            alert('Invalid club code. Please check your club code and try again.');
          }
        } else {
          // Provide more specific error message
          const roles = Array.isArray(data.user.roles) ? data.user.roles.join(', ') : 'none';
          alert(`This login is only for Admins. Your account has the following roles: ${roles}. Please use Club Member Login for club member accounts.`);
        }      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <>
      <Header />
      <div className="login-container main-with-header-footer">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Admin Login</h2>
          <div className="form-group">
            <label>Admin ID:</label>
            <input
              type="text"
              name="adminId"
              placeholder="Enter Admin ID"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
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
          <div className="login-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default AdminLogin;