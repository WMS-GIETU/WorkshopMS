import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './History.css';

const History = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/workshops/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container">
                <Sidebar />
                <div className="loading">Loading...</div>
            </div>
        );
    }
    
    return (
        <div className='container'>
        <Sidebar />
        <div className='his-main-content'>
          <div className='header'>
            <h1>Workshop History</h1>
            <div className='user-info'>
            <span className='user-role'>
              Logged in as: {user?.username} ({user?.role === 'admin' ? 'Administrator' : 'Club Member'})
            </span>
            </div>
          </div>
          <div className="table-content">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Venue</th>
                  <th>Topic</th>
                </tr>
              </thead>
              <tbody>
                {history.map((workshop) => (
                  <tr key={workshop._id}>
                    <td>{workshop.name}</td>
                    <td>{new Date(workshop.date).toLocaleDateString()}</td>
                    <td>{workshop.time}</td>
                    <td>{workshop.location}</td>
                    <td>{workshop.topic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      );
    };
export default History;
