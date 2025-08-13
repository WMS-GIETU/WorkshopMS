import React, { useState, useEffect } from 'react';
import './Home.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to convert buffer to base64 URL
  const getImageSrc = (imageData) => {
    if (!imageData || !imageData.data || !imageData.contentType) return '';
    const buffer = imageData.data.data; // Access the actual buffer
    const b64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    return `data:${imageData.contentType};base64,${b64}`;
  };

  // Optional: Static mapping of clubCode to clubName if no API is available
  // const clubNameMap = {
  //   'CODE123': 'Coding Club',
  //   'ART456': 'Art Club',
  //   // Add more mappings as needed
  // };

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/workshops/public');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today

        const upcomingWorkshops = data.filter(workshop => {
          const workshopDate = new Date(workshop.date);
          return workshopDate >= today;
        });

        // Optional: Map clubCode to clubName if using a static mapping
        // const enrichedWorkshops = upcomingWorkshops.map(workshop => ({
        //   ...workshop,
        //   clubName: clubNameMap[workshop.clubCode] || workshop.clubCode
        // }));

        setWorkshops(upcomingWorkshops); // Use enrichedWorkshops if mapping is enabled
      } catch (e) {
        setError('Failed to fetch workshops. Please try again later.');
        console.error('Error fetching workshops:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, []);

  const handleCardClick = (w_name,desc) => {
    alert(`Workshop Name : ${w_name}\nDescription : ${desc}`);
  };

  if (loading) {
    return (
      <div className="home-container1 main-with-header-footer">
        <Header />
        <div className="home-header">
          <h1>Upcoming Workshops</h1>
        </div>
        <div className="loading-message">Loading workshops...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container1 main-with-header-footer">
        <Header />
        <div className="home-header">
          <h1>Upcoming Workshops</h1>
        </div>
        <div className="error-message">{error}</div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="home-container1 main-with-header-footer">
        <header className="home-header">
          <h1>Upcoming Workshops</h1>
        </header>

        {workshops.length === 0 ? (
          <div className="no-workshops-message">
            <p>No upcoming workshops found.</p>
          </div>
        ) : (
          <div className="workshop-cards1">
            {workshops.map(w => (
              <div key={w._id} className="workshop-card1" onClick={() => handleCardClick(w.name,w.description)}>
                {w.image && <img src={getImageSrc(w.image.image)} alt={w.name} className="workshop-image" />}
                <div className="workshop-info">
                  <h3>{w.name}</h3>
                  <p><strong>Club:</strong> {w.clubCode}</p> {/* Changed from clubName to clubCode */}
                  <p><strong>Date:</strong> {w.date}</p>
                  <p><strong>Location:</strong> {w.location}</p>
                  <p className="topic"><em>{w.topic}</em></p>
                </div>
              </div>
            ))}
          </div>
        )}
        <Footer />
      </div>
    </>
  );
};

export default Home;