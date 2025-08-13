import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import './Album.css';

const Album = () => {
  const { user, isAdmin } = useAuth();
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [availableWorkshops, setAvailableWorkshops] = useState([]);

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const response = await fetch('/api/workshops', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch workshops');
        }
        const data = await response.json();
        setAvailableWorkshops(data.map(workshop => workshop.name));
      } catch (error) {
        console.error('Error fetching workshops:', error);
        alert('Failed to load workshops.');
      }
    };

    fetchImages();
    fetchWorkshops();
  }, []);

  const openImageOverlay = (image) => setSelectedImage(image);
  const closeImageOverlay = () => setSelectedImage(null);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/album', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      const imagesWithSrc = data.map(img => {
        const buffer = img.image.data.data;
        const b64 = btoa(
          new Uint8Array(buffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );
        return {
          ...img,
          src: `data:${img.image.contentType};base64,${b64}`,
          uploadedAt: new Date(img.createdAt).toLocaleDateString(),
          uploadedBy: img.uploadedBy || 'Unknown',
        };
      });
      setImages(imagesWithSrc);
    } catch (error) {
      console.error('Error fetching images:', error);
      alert('Failed to load images.');
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!selectedWorkshop) {
      alert('Please select a workshop before uploading images.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', files[0]);
    formData.append('workshop', selectedWorkshop);

    try {
      const response = await fetch('/api/album/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      alert('Image uploaded successfully!');
      fetchImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!isAdmin()) {
      alert('Only admins can delete images.');
      return;
    }
    
    const confirmDelete = window.confirm('Are you sure you want to delete this image?');
    if (confirmDelete) {
      try {
        const response = await fetch(`/api/album/${imageId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete image');
        }

        alert('Image deleted successfully!');
        fetchImages();
      } catch (error) {
        console.error('Error deleting image:', error);
        alert('Failed to delete image. Please try again.');
      }
    }
  };

  return (
    <>
      <div className="album-container">
        <Sidebar />
        <div className="albm-main-content">
          <h2>Workshop Album</h2>
          <div className="upload-area">
            <select
              value={selectedWorkshop}
              onChange={(e) => setSelectedWorkshop(e.target.value)}
              className="workshop-select"
            >
              <option value="">Select a Workshop</option>
              {availableWorkshops.map((ws, index) => (
                <option key={index} value={ws}>{ws}</option>
              ))}
            </select>
            <div>
              <input
                type="file"
                id="image-upload"
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
                    <span>Upload Workshop Image</span>
                  </>
                )}
              </label>
            </div>
            <p className="upload-hint">Select a workshop and click to upload an image</p>
          </div>

          <div className="image-grid">
            {images.length === 0 ? (
              <p>No images in the album yet. Upload some!</p>
            ) : (
              images.map((image) => (
                <div key={image._id} className="image-item">
                  <div className="image-container">
                    <img
                      src={image.src}
                      alt={image.workshop}
                      className="album-image"
                      onClick={() => openImageOverlay(image)}
                    />
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
                          onClick={() => handleDeleteImage(image._id)}
                          title="Delete image"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedImage && (
            <div className="image-overlay-modal" onClick={closeImageOverlay}>
              <div className="image-overlay-content" onClick={(e) => e.stopPropagation()}>
                <img src={selectedImage.src} alt={selectedImage.workshop} className="full-image" />
                <div className="overlay-actions">
                  <a
                    href={selectedImage.src}
                    download={`${selectedImage.workshop}.png`}
                    className="download-button"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Album;