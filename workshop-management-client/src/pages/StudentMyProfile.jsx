import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './StudentMyProfile.css';
import * as faceapi from 'face-api.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

const StudentMyProfile = () => {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [hasFaceData, setHasFaceData] = useState(false);
  const [updateRequestStatus, setUpdateRequestStatus] = useState('none');
  const [currentFaceDescriptor, setCurrentFaceDescriptor] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isFaceScanned, setIsFaceScanned] = useState(false);

  const videoRef = useRef();
  const canvasRef = useRef();
  const intervalRef = useRef();

  useEffect(() => {
    const loadModels = async () => {
      try {
        setScanStatus('Loading face recognition models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        setModelsLoaded(true);
        setScanStatus('Models loaded. Ready to scan.');
      } catch (error) {
        console.error('Error loading models:', error);
        setScanStatus('Error: Could not load face models.');
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        rollNo: user.rollNo,
        email: user.email,
        role: user.roles ? user.roles.join(', ') : 'Student',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchFaceStatus = async () => {
      if (!user || !token) return;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/face/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setHasFaceData(data.hasFaceData);
          setUpdateRequestStatus(data.updateRequestStatus);
          console.log('Fetched updateRequestStatus:', data.updateRequestStatus);
          console.log('Fetched hasFaceData:', data.hasFaceData);
        } else {
          console.error('Failed to fetch face status:', data.message);
          setScanStatus(`Error fetching face status: ${data.message}`);
        }
      } catch (error) {
        console.error('Network error fetching face status:', error);
        setScanStatus('Network error fetching face status.');
      }
    };
    fetchFaceStatus();
  }, [user, token]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      setScanStatus('Error: Could not access webcam. Please ensure camera access is granted.');
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleScanButtonClick = () => {
    setIsCameraOn(true);
    setIsScanning(true);
    setIsFaceScanned(false);
    setCurrentFaceDescriptor(null);
    setScanStatus('Starting camera...');
    startVideo();
  };

  useEffect(() => {
    if (isCameraOn && isScanning) {
      videoRef.current.addEventListener('play', () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
        faceapi.matchDimensions(canvas, displaySize);

        intervalRef.current = setInterval(async () => {
          if (videoRef.current && !videoRef.current.paused && videoRef.current.videoWidth > 0) {
            const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks()
              .withFaceDescriptors();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);

            resizedDetections.forEach(detection => {
              const box = detection.detection.box;
              context.strokeStyle = '#00FF00';
              context.lineWidth = 2;
              context.strokeRect(box.x, box.y, box.width, box.height);
            });

            if (detections.length > 0) {
              setCurrentFaceDescriptor(detections[0].descriptor);
              setScanStatus('Face Scanned Successfully!');
              setIsFaceScanned(true);
              setIsScanning(false);
              stopVideo();
              setIsCameraOn(false);
            } else {
              setScanStatus('No face detected. Please position your face in the center.');
            }
          }
        }, 300);
      });
    }
    return () => {
      stopVideo();
    };
  }, [isCameraOn, isScanning]);

  const handleSubmit = async () => {
    if (!currentFaceDescriptor) {
      setScanStatus('No face data to submit.');
      return;
    }
    if (!user || !token) {
      setScanStatus('User not authenticated.');
      return;
    }

    setIsSubmitting(true);
    setScanStatus('Submitting face data...');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/face/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ faceDescriptor: Array.from(currentFaceDescriptor) }),
      });

      const data = await response.json();

      if (response.ok) {
        setScanStatus('Face data successfully submitted!');
        setHasFaceData(true);
        setUpdateRequestStatus('none');
        setIsFaceScanned(false);
      } else {
        setScanStatus(`Error submitting face data: ${data.message}`);
      }
    } catch (error) {
      console.error('Error during face data submission:', error);
      setScanStatus('Network error during face data submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [updateReason, setUpdateReason] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [isSubmittingUpdateRequest, setIsSubmittingUpdateRequest] = useState(false);

  const handleRequestUpdate = () => {
    setIsReasonModalOpen(true);
  };

  const submitUpdateRequest = async () => {
    if (!updateReason) {
      setScanStatus('Please provide a reason for the update.');
      return;
    }
    setIsSubmittingUpdateRequest(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/face/request-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: updateReason }),
      });
      const data = await response.json();
      if (response.ok) {
        setUpdateRequestStatus('pending');
        setScanStatus('Request to update face data has been sent for approval.');
        setIsReasonModalOpen(false);
        setUpdateReason('');
      } else {
        setScanStatus(`Error requesting update: ${data.message}`);
      }
    } catch (error) {
      console.error('Error requesting face data update:', error);
      setScanStatus('Network error while requesting face data update.');
    } finally {
      setIsSubmittingUpdateRequest(false);
    }
  };

  useEffect(() => {
    const fetchFaceStatus = async () => {
      if (!user || !token) return;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/face/status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setHasFaceData(data.hasFaceData);
          setUpdateRequestStatus(data.updateRequestStatus);
          if (data.updateRequestStatus === 'rejected') {
            setRejectionMessage(data.rejectionReason);
          }
        } else {
          console.error('Failed to fetch face status:', data.message);
          setScanStatus(`Error fetching face status: ${data.message}`);
        }
      } catch (error) {
        console.error('Network error fetching face status:', error);
        setScanStatus('Network error fetching face status.');
      }
    };
    fetchFaceStatus();
  }, [user, token]);

  if (!profileData) {
    return (
      <div className="student-profile-container-sw">
        <div className="loading-sw">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="student-profile-container-sw">
      <div className="profile-wrapper-sw">
        <h1 className="profile-title-sw">My Profile</h1>
        <div className="profile-card-sw">
          <div className="profile-details-sw">
            <p className="profile-field-sw"><span className="field-label-sw">Name:</span> {profileData.name}</p>
            <p className="profile-field-sw"><span className="field-label-sw">Roll No:</span> {profileData.rollNo}</p>
            <p className="profile-field-sw"><span className="field-label-sw">Email:</span> {profileData.email}</p>
            <p className="profile-field-sw"><span className="field-label-sw">Role:</span> {profileData.role}</p>
          </div>
          <div className="face-scan-section-sw">
            <h2 className="section-title-sw">Face Scan for Attendance</h2>

            {isCameraOn && (
              <div className="webcam-container-sw">
                <video ref={videoRef} width="300" height="225" autoPlay muted></video>
                <canvas ref={canvasRef} className="face-canvas-sw"></canvas>
              </div>
            )}

            {!modelsLoaded && <p className="scan-status-sw">Loading models...</p>}
            {modelsLoaded && (
              <>
                {hasFaceData && updateRequestStatus === 'none' && (
                  <div className="face-data-exists-sw">
                    <p>Already Face data exist</p>
                    <FontAwesomeIcon icon={faLock} className="lock-icon-sw" onClick={handleRequestUpdate} />
                  </div>
                )}

                {updateRequestStatus === 'pending' && (
                  <p className="scan-status-sw info-sw">
                    Your request to update face data is pending approval.
                  </p>
                )}

                {updateRequestStatus === 'rejected' && (
                  <div className="face-data-exists-sw">
                    <p className="scan-status-sw error-sw">
                      Your request to update face data was rejected. Please contact admin for more information.
                    </p>
                    <FontAwesomeIcon icon={faLock} className="lock-icon-sw" onClick={handleRequestUpdate} />
                  </div>
                )}

                {(!hasFaceData || updateRequestStatus === 'approved') && (
                  <div className="face-scan-controls">
                    <button
                      onClick={handleScanButtonClick}
                      disabled={isScanning || isSubmitting}
                      className={`face-scan-button-sw ${isScanning || isSubmitting ? 'disabled-sw' : ''}`}
                    >
                      {isScanning ? 'Scanning...' : 'Scan Face'}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!isFaceScanned || isSubmitting}
                      className={`face-scan-button-sw ${!isFaceScanned || isSubmitting ? 'disabled-sw' : ''}`}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                )}
              </>
            )}

            {scanStatus && (
              <p className={`scan-status-sw ${scanStatus.includes('Error') ? 'error-sw' : scanStatus.includes('Successfully') ? 'success-sw' : 'info-sw'}`}>
                {scanStatus}
              </p>
            )}

            {isReasonModalOpen && (
              <div className="reason-modal-overlay-sw">
                <div className="reason-modal-sw">
                  <h3>Reason for Face Data Update</h3>
                  <textarea
                    value={updateReason}
                    onChange={(e) => setUpdateReason(e.target.value)}
                    placeholder="Please provide a brief reason for requesting the update..."
                  />
                  <div className="modal-buttons-sw">
                    <button onClick={submitUpdateRequest} disabled={isSubmittingUpdateRequest}>
                      {isSubmittingUpdateRequest ? 'Submitting...' : 'Submit'}
                    </button>
                    <button onClick={() => setIsReasonModalOpen(false)} disabled={isSubmittingUpdateRequest}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMyProfile;