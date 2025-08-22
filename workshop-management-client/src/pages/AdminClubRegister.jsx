import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'clubMember', // default role
    clubCode: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [adminCheckResult, setAdminCheckResult] = useState(null);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.clubCode.trim()) {
      newErrors.clubCode = 'Club code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkAdminExists = async () => {
    if (!formData.clubCode.trim()) {
      alert('Please enter a club code first');
      return;
    }

    setIsCheckingAdmin(true);
    setAdminCheckResult(null);

    try {
      console.log('Checking admin for club code:', formData.clubCode);
      const url = `/api/auth/check-admin/${formData.clubCode}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setAdminCheckResult(data);
      } else {
        alert(data.message || 'Failed to check admin status');
      }
    } catch (error) {
      console.error('Admin check error:', error);
      console.error('Error details:', error.message);
      alert(`Failed to check admin status: ${error.message}`);
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Submitting registration request:', {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        clubCode: formData.clubCode
      });
      
      const response = await fetch('/api/registration-requests/submit-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          clubCode: formData.clubCode
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        const roleMessage = formData.role === 'admin' 
          ? '✅ Registration request submitted successfully! Your request has been sent to the system administrator for approval. You will receive an email notification once approved.'
          : '✅ Registration request submitted successfully! Your request has been sent to your club administrator for approval. You will receive an email notification once approved.';
        alert(roleMessage);
        navigate('/');
      } else {
        // Handle specific admin validation error
        if (data.message && data.message.includes('admin already exists')) {
          alert('❌ Admin already exists for this club. Only one admin is allowed per club. Please register as a Club Member instead.');
        } else if (data.message && data.message.includes('No admin found')) {
          alert('❌ No admin found for this club. Please contact the system administrator.');
        } else {
          alert(data.message || 'Registration request failed');
        }
      }
    } catch (error) {
      console.error('Registration request error:', error);
      alert('Registration request failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="register-container">
        <form className="register-form" onSubmit={handleSubmit}>
          <h2>Submit Registration Request</h2>

          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label>Confirm Password:</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <div className="form-group">
            <label>Role:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="clubMember">Club Member</option>
              <option value="admin">Admin (One per club only)</option>
            </select>
            {formData.role === 'admin' && (
              <div className="role-info">
                <span className="info-icon">ℹ️</span>
                <span className="info-text">Only one admin is allowed per club. If an admin already exists, registration will be rejected.</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Club Code:</label>
            <div className="club-code-container">
              <input
                type="text"
                name="clubCode"
                placeholder="Enter Club's Unique Code"
                value={formData.clubCode}
                onChange={handleChange}
                className={errors.clubCode ? 'error' : ''}
              />
              <button 
                type="button" 
                className="check-admin-btn"
                onClick={checkAdminExists}
                disabled={isCheckingAdmin || !formData.clubCode.trim()}
              >
                {isCheckingAdmin ? 'Checking...' : 'Check Admin'}
              </button>
            </div>
            {errors.clubCode && <span className="error-message">{errors.clubCode}</span>}
            
            {adminCheckResult && (
              <div className={`admin-check-result ${adminCheckResult.exists ? 'exists' : 'not-exists'}`}>
                <span className="result-icon">
                  {adminCheckResult.exists ? '❌' : '✅'}
                </span>
                <span className="result-text">
                  {adminCheckResult.exists 
                    ? `Admin exists: ${adminCheckResult.admin.username} (${adminCheckResult.admin.email})`
                    : 'No admin found for this club'
                  }
                </span>
              </div>
            )}
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting Request...' : 'Submit Registration Request'}
          </button>

          <div className="login-link">
            Already have an account? <span onClick={() => navigate('/admin-login')}>Login here</span>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Register;