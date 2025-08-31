import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './StudentMyProfile.css';
import * as faceapi from 'face-api.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEdit } from '@fortawesome/free-solid-svg-icons';

const StudentMyProfile = () => {
  const { user, token, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableName, setEditableName] = useState('');
  const [editableMobileNumber, setEditableMobileNumber] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [hasFaceData, setHasFaceData] = useState(false);
  const [updateRequestStatus, setUpdateRequestStatus] = useState('none');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [scanStep, setScanStep] = useState('idle'); // idle, front, left, right, done
  const [faceDescriptors, setFaceDescriptors] = useState([]);

  const videoRef = useRef();
  const canvasRef = useRef();
  const intervalRef = useRef();
  const scanStepRef = useRef(scanStep);

  useEffect(() => {
    scanStepRef.current = scanStep;
  }, [scanStep]);

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
        mobileNumber: user.mobileNumber || '',
        role: user.roles ? user.roles.join(', ') : 'Student',
      });
      setEditableName(user.name);
      setEditableMobileNumber(user.mobileNumber || '');
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
        console.log('Face status data:', data);
        if (response.ok) {
          setHasFaceData(data.hasFaceData);
          setUpdateRequestStatus(data.updateRequestStatus);
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
    setFaceDescriptors([]);
    setScanStep('front');
    setScanStatus('Please look directly at the camera for the front view.');
  };

  const getHeadPose = (landmarks) => {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const jawline = landmarks.getJawOutline();

    const eyeMidpoint = {
      x: (leftEye[0].x + rightEye[3].x) / 2,
      y: (leftEye[0].y + rightEye[3].y) / 2,
    };

    const noseTip = nose[3];
    const jawLeft = jawline[0];
    const jawRight = jawline[16];

    const horizontalDist = Math.abs(eyeMidpoint.x - noseTip.x);

    const faceWidth = Math.abs(jawLeft.x - jawRight.x);
    const noseToJawLeft = Math.abs(noseTip.x - jawLeft.x);
    const noseToJawRight = Math.abs(noseTip.x - jawRight.x);

    const ratio = noseToJawLeft / noseToJawRight;

    if (ratio > 1.8) {
      return 'right';
    } else if (ratio < 0.55) {
      return 'left';
    } else if (horizontalDist < faceWidth * 0.25) {
      return 'front';
    } else {
      return 'unknown';
    }
  };

  useEffect(() => {
    if (isCameraOn) {
      startVideo();
    } else {
      stopVideo();
    }
  }, [isCameraOn]);

  useEffect(() => {
    if (isScanning && modelsLoaded) {
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

          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

          if (detections.length > 0) {
            const landmarks = detections[0].landmarks;
            const headPose = getHeadPose(landmarks);
            const currentScanStep = scanStepRef.current;

            if (headPose === currentScanStep) {
              const descriptor = detections[0].descriptor;
              setFaceDescriptors(prev => [...prev, Array.from(descriptor)]);

              if (currentScanStep === 'front') {
                setScanStatus('Front view scanned. Now, please turn your head to the left.');
                setScanStep('left');
              } else if (currentScanStep === 'left') {
                setScanStatus('Left view scanned. Now, please turn your head to the right.');
                setScanStep('right');
              } else if (currentScanStep === 'right') {
                setScanStatus('All scans complete! You can now submit.');
                setScanStep('done');
                setIsScanning(false);
                setIsCameraOn(false);
              }
            } else {
              setScanStatus(`Please turn your head to the ${currentScanStep}. Detected: ${headPose}`);
            }
          } else {
            setScanStatus(`No face detected. Please position your face for the ${scanStepRef.current} view.`);
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isScanning, modelsLoaded]);

  const handleSubmit = async () => {
    if (faceDescriptors.length < 3) {
      setScanStatus('Please complete all three face scans.');
      return;
    }
    if (!user || !token) {
      setScanStatus('User not authenticated.');
      return;
    }

    setIsSubmitting(true);
    setScanStatus('Submitting face data...');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/face/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ descriptors: faceDescriptors }),
      });

      const data = await response.json();

      if (response.ok) {
        setScanStatus('Face data successfully submitted!');
        setHasFaceData(true);
        setUpdateRequestStatus('none');
        setScanStep('idle');
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
  const [isSubmittingUpdateRequest, setIsSubmittingUpdateRequest] = useState(false);

  const handleRequestUpdate = () => {
    setIsReasonModalOpen(true);
  };

  const handleCancel = () => {
    setEditableName(profileData.name);
    setEditableMobileNumber(profileData.mobileNumber || '');
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editableName,
          mobileNumber: editableMobileNumber,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Profile updated successfully!');
        refreshUser(); // Call a function from AuthContext to refresh user data
        setIsEditing(false);
      } else {
        alert(`Error updating profile: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Network error during profile update.');
    }
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
        <h1 className="profile-title-sw">My Profile
          <FontAwesomeIcon 
            icon={faEdit} 
            className="edit-icon-sw" 
            onClick={() => setIsEditing(true)} 
          />
        </h1>
        <div className="profile-card-sw">
          <div className="profile-details-sw">
            <p className="profile-field-sw">
              <span className="field-label-sw">Name:</span> 
              {isEditing ? (
                <input 
                  type="text" 
                  value={editableName} 
                  onChange={(e) => setEditableName(e.target.value)} 
                  className="edit-input-sw"
                />
              ) : (
                profileData.name
              )}
            </p>
            <p className="profile-field-sw"><span className="field-label-sw">Roll No:</span> {profileData.rollNo}</p>
            <p className="profile-field-sw"><span className="field-label-sw">Email:</span> {profileData.email}</p>
            <p className="profile-field-sw">
              <span className="field-label-sw">Mobile No. :</span> 
              {isEditing ? (
                <input 
                  type="text" 
                  value={editableMobileNumber} 
                  onChange={(e) => setEditableMobileNumber(e.target.value)} 
                  className="edit-input-sw"
                />
              ) : (
                profileData.mobileNumber || 'Not Provided'
              )}
            </p>
            <p className="profile-field-sw"><span className="field-label-sw">Role:</span> {profileData.role}</p>
            {isEditing && (
              <div className="edit-buttons-sw">
                <button onClick={handleSave} className="save-button-sw">Save Changes</button>
                <button onClick={handleCancel} className="cancel-button-sw">Cancel</button>
              </div>
            )}
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
                {hasFaceData && (updateRequestStatus === 'none' || updateRequestStatus === 'fulfilled') && (
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

                {((!hasFaceData && updateRequestStatus === 'none') || updateRequestStatus === 'approved') && (
                  <div className="face-scan-controls">
                    <button
                      onClick={handleScanButtonClick}
                      disabled={isScanning || isSubmitting}
                      className={`face-scan-button-sw ${isScanning || isSubmitting ? 'disabled-sw' : ''}`}
                    >
                      {isScanning ? `Scanning ${scanStep}...` : 'Scan Face'}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={scanStep !== 'done' || isSubmitting}
                      className={`face-scan-button-sw ${scanStep !== 'done' || isSubmitting ? 'disabled-sw' : ''}`}
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