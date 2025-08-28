import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const Camera = ({ onFaceScan }) => {
  const videoRef = useRef();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  useEffect(() => {
    const fetchFaceData = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/face', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const faceData = await response.json();
      const labeledFaceDescriptors = faceData.map(
        (fd) =>
          new faceapi.LabeledFaceDescriptors(
            fd.user._id,
            fd.descriptions.map((desc) => new Float32Array(Object.values(desc)))
          )
      );
      setFaceMatcher(new faceapi.FaceMatcher(labeledFaceDescriptors));
    };
    if (modelsLoaded) {
      fetchFaceData();
    }
  }, [modelsLoaded]);

  useEffect(() => {
    if (modelsLoaded && faceMatcher) {
      startVideo();
    }
  }, [modelsLoaded, faceMatcher]);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error(err));
  };

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (videoRef.current) {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
        if (detections.length > 0) {
          const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);
          if (bestMatch.label !== 'unknown') {
            onFaceScan(bestMatch.label);
          }
        }
      }
    }, 1000);
  };

  return (
    <div>
      <video ref={videoRef} onPlay={handleVideoOnPlay} />
    </div>
  );
};

export default Camera;