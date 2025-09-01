import React, { useState, useEffect } from 'react';
import './StudentMyWorkshops.css';

const StudentMyWorkshops = () => {
  const [workshops, setWorkshops] = useState([]);

  useEffect(() => {
    const fetchPastWorkshops = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/attendance/my-attended-workshops', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setWorkshops(data);
      } catch (error) {
        console.error('Failed to fetch past workshops', error);
      }
    };
    fetchPastWorkshops();
  }, []);

  return (
    <div className="student-workshops-container-sw">
      <div className="workshops-wrapper-sw">
        <h1 className="workshops-title-sw">My Past Workshops</h1>
        {workshops.length > 0 ? (
          <div className="workshops-table-container-sw">
            <table className="workshops-table-sw">
              <thead>
                <tr className="table-header-sw">
                  <th className="table-cell-sw">Workshop Title</th>
                  <th className="table-cell-sw">Club</th>
                  <th className="table-cell-sw">Date</th>
                </tr>
              </thead>
              <tbody>
                {workshops.map((workshop) => (
                  <tr key={workshop._id} className="table-row-sw">
                    <td className="table-cell-sw">{workshop.name}</td>
                    <td className="table-cell-sw">{workshop.clubCode}</td>
                    <td className="table-cell-sw">{new Date(workshop.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-workshops-sw">No past workshops found.</p>
        )}
        <p className="workshops-footer-sw">
          View your past workshops and attendance details.
        </p>
      </div>
    </div>
  );
};

export default StudentMyWorkshops;
