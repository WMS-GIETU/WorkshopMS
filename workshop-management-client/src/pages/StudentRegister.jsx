import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Register.css'; // Reusing some styles from the general Register page

const StudentRegister = () => {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [rollNo, setRollNo] = useState(''); // Added rollNo state
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register-student`, { 
        username: fullName, 
        email, 
        name: fullName, 
        rollNo, 
        mobileNumber 
      });
      setMessage(response.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Error requesting OTP.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify-student`, { 
        username: fullName, 
        email, 
        password, 
        otp, 
        name: fullName, 
        rollNo, 
        mobileNumber 
      });
      setMessage(response.data.message + ' Redirecting to login...');
      setTimeout(() => {
        navigate('/student-login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error verifying OTP.');
    }
  };

  return (
    <>
      <Header />
      <div className="register-container">
        <form className="register-form" onSubmit={step === 1 ? handleRequestOtp : handleVerifyOtp}>
          <h2>Student Registration</h2>
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          {step === 1 ? (
            <>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="rollNo">Roll Number</label>
                <input
                  type="text"
                  id="rollNo"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="mobileNumber">Mobile Number (Optional)</label>
                <input
                  type="text"
                  id="mobileNumber"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">College Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="register-button">Request OTP</button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="otp">OTP</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="register-button">Verify OTP & Register</button>
            </>
          )}
          <div className="login-link">
            Already have an account? <Link to="/student-login">Login here</Link>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default StudentRegister;