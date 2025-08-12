import React from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './History.css';

const History = () => {
    const { user } = useAuth();
    // TODO: Filter workshop history by user.clubCode when using dynamic data
    
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
                <tr>
                  <td>Vinay</td>
                  <td>11/07/2025</td>
                  <td>6:30 to 7:30</td>
                  <td>Smart class</td>
                  <td>Robotics</td>
                </tr>
                <tr>
                  <td>Vinay</td>
                  <td>11/07/2025</td>
                  <td>6:30 to 7:30</td>
                  <td>Smart class</td>
                  <td>Robotics</td>
                </tr>
                <tr>
                  <td>Vinay</td>
                  <td>11/07/2025</td>
                  <td>6:30 to 7:30</td>
                  <td>Smart class</td>
                  <td>Robotics</td>
                </tr>
                <tr>
                  <td>Vinay</td>
                  <td>11/07/2025</td>
                  <td>6:30 to 7:30</td>
                  <td>Smart class</td>
                  <td>Robotics</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>
      );
    };
export default History;
