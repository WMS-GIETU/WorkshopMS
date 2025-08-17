import React, { useState, useEffect } from 'react';
import './Home.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home = () => {
  const [workshops, setWorkshops] = useState([]);
  const [albumImages, setAlbumImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to convert buffer to base64 URL
  const getImageSrc = (imageData) => {
    if (!imageData || !imageData.data || !imageData.contentType) return '';
    let buffer = imageData.data;
    if (buffer.type === 'Buffer' && Array.isArray(buffer.data)) {
      buffer = buffer.data;
    }
    const b64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    return `data:${imageData.contentType};base64,${b64}`;
  };


  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const response = await fetch('/api/workshops/public');

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

        
        setWorkshops(upcomingWorkshops);
      } catch (e) {
        setError('Failed to fetch workshops. Please try again later.');
        console.error('Error fetching workshops:', e);
      }
    };

    const fetchAlbumImages = async () => {
      try {
        const response = await fetch('/api/album/public');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAlbumImages(data);
      } catch (e) {
        console.error('Error fetching album images:', e);
      }
    };

    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([fetchWorkshops(), fetchAlbumImages()]);
      setLoading(false);
    };

    fetchAllData();
  }, []);

  const handleCardClick = (w_name,desc) => {
    alert(`Workshop Name : ${w_name}\nDescription : ${desc}`);
  };

  return (
    <>
      <Header />
      <div className="home-container1 main-with-header-footer">
        <header className="home-header">
          <h1>Upcoming Workshops</h1>
        </header>

        {loading ? (
          <div className="loading-spinner-container">
            <div className="loader"></div>
            <p>Loading Workshops...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : workshops.length === 0 ? (
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
                  <p><strong>Club:</strong> {w.clubCode}</p>
                  <p><strong>Date:</strong> {new Date(w.date).toLocaleDateString('en-GB')}</p>
                  <p><strong>Location:</strong> {w.location}</p>
                  <p className="topic"><em>{w.topic}</em></p>
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="album-section">
          <header className="home-header">
            <h1>Album</h1>
          </header>
          {loading ? (
            <div className="loading-spinner-container">
              <div className="loader"></div>
              <p>Loading Album...</p>
            </div>
          ) : albumImages.length === 0 ? (
            <div className="no-workshops-message">
              <p>No album images found.</p>
            </div>
          ) : (
            <div className="workshop-cards1">
              {albumImages.map(image => (
                <div key={image._id} className="workshop-card1">
                  <img src={getImageSrc(image.image)} alt={image.caption} className="workshop-image" />
                   <div className="workshop-info">
                    {image.workshopDetails ? (
                      <>
                        <p><strong>Workshop:</strong> {image.workshopDetails.name}</p>
                        <p><strong>Club:</strong> {image.workshopDetails.clubCode}</p>
                        <p><strong>Date:</strong> {new Date(image.workshopDetails.date).toLocaleDateString('en-GB')}</p>
                      </>
                    ) : (
                      <p>{image.caption}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Home;
