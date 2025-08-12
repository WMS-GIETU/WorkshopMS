import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './Album.css';

const Album = () => {
  const { user, isAdmin } = useAuth();
  const [images, setImages] = useState([
    { id: 1, src: 'https://picsum.photos/300/200?random=1', alt: 'Sample image 1', workshop: 'Robotics Workshop' },
    { id: 2, src: 'https://picsum.photos/300/200?random=2', alt: 'Sample image 2', workshop: 'Web Development' },
    { id: 3, src: 'https://picsum.photos/300/200?random=3', alt: 'Sample image 3', workshop: 'AI Workshop' },
    { id: 4, src: 'https://picsum.photos/300/200?random=4', alt: 'Sample image 4', workshop: 'Data Science' },
    { id: 5, src: 'https://picsum.photos/300/200?random=5', alt: 'Sample image 5', workshop: 'Mobile Development' },
    { id: 6, src: 'https://picsum.photos/300/200?random=6', alt: 'Sample image 6', workshop: 'Cybersecurity' },
  ]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      // Simulate file upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add new images to the album
      const newImages = Array.from(files).map((file, index) => ({
        id: Date.now() + index,
        src: URL.createObjectURL(file),
        alt: `Uploaded image ${index + 1}`,
        workshop: `Workshop ${images.length + index + 1}`,
        uploadedBy: user?.username,
        uploadedAt: new Date().toLocaleDateString()
      }));
      
      setImages(prev => [...prev, ...newImages]);
      alert('Images uploaded successfully!');
    } catch (error) {
      alert('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = (imageId) => {
    if (!isAdmin()) {
      alert('Only admins can delete images.');
      return;
    }
    
    const confirmDelete = window.confirm('Are you sure you want to delete this image?');
    if (confirmDelete) {
      setImages(prev => prev.filter(img => img.id !== imageId));
      alert('Image deleted successfully!');
    }
  };

  return (
    <div className='container'>
      <Sidebar />
      <div className='albm-main-content'>
        <div className='header'>
          <h1>Workshop Album</h1>
          <div className='user-info'>
          <span className='user-role'>
              Logged in as: {user?.username} ({Array.isArray(user?.roles) && user.roles.includes('admin') ? 'Administrator' : 'Club Member'})
            </span>
          </div>
        </div>
        <div className="album-content">
          <div className="upload-section">
            <div className="upload-area">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <label htmlFor="image-upload" className="upload-button">
                {isUploading ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <span className="upload-icon">📷</span>
                    <span>Upload Workshop Images</span>
                  </>
                )}
              </label>
              <p className="upload-hint">Click to upload images from your workshops</p>
            </div>
          </div>
          
          <div className="image-grid">
            {images.map((image) => (
              <div key={image.id} className="image-item">
                <div className="image-container">
                  <img src={image.src} alt={image.alt} className="album-image" />
                  <div className="image-overlay">
                    <div className="image-info">
                      <h4>{image.workshop}</h4>
                      {image.uploadedBy && (
                        <p>Uploaded by: {image.uploadedBy}</p>
                      )}
                      {image.uploadedAt && (
                        <p>Date: {image.uploadedAt}</p>
                      )}
                    </div>
                    {isAdmin() && (
                      <button
                        className="delete-image-btn"
                        onClick={() => handleDeleteImage(image.id)}
                        title="Delete image"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Album;