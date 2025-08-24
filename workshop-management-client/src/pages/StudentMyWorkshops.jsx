import React, { useState, useEffect } from 'react';
import './StudentMyWorkshops.css';

const StudentMyWorkshops = () => {
  const [workshops, setWorkshops] = useState([
    { id: 1, title: 'Web Development Workshop', date: '15/06/2025', attendance: 'Present' },
    { id: 2, title: 'Data Science Bootcamp', date: '20/07/2025', attendance: 'Absent' },
  ]);

  useEffect(() => {
    const fetchPastWorkshops = async () => {
      // Simulate API call to fetch past workshops; replace with actual API in production
      // Example: const response = await fetch('/api/past-workshops');
      // setWorkshops(await response.json());
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
                  <th className="table-cell-sw">Date</th>
                  <th className="table-cell-sw">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {workshops.map((workshop) => (
                  <tr key={workshop.id} className="table-row-sw">
                    <td className="table-cell-sw">{workshop.title}</td>
                    <td className="table-cell-sw">{workshop.date}</td>
                    <td className="table-cell-sw">{workshop.attendance}</td>
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