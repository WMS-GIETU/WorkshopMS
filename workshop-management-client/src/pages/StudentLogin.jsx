import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../pages/Login.css'; // Reusing general login styles

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/student-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          // No clubCode for students
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (Array.isArray(data.user.roles) && data.user.roles.includes('student')) {
          login(data.user, data.token);
          navigate('/student-dashboard'); // Navigate to student dashboard
        } else {
          setError(`This login is only for Students. Your account has the following roles: ${data.user.roles.join(', ')}.`);
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    }
  };

  return (
    <>
      <Header />
      <div className="login-container main-with-header-footer">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Student Login</h2>
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label>College Email:</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your college email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <button type="submit">Login</button>
          <div className="login-link">
            Don't have an account? <Link to="/register/student">Register here</Link>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default StudentLogin;