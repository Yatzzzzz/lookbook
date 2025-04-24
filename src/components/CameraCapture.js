import { useRef, useEffect, useState } from 'react';

export default function CameraCapture({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
      } catch (error) {
        console.error("Error accessing the camera", error);
      }
    }
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    canvas.toBlob((blob) => {
      onCapture(blob);
    }, 'image/jpeg');
  };

  return (
    <div>
      <video ref={videoRef} style={{ width: '100%', maxWidth: '400px' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {streaming && <button onClick={captureImage}>Capture</button>}
    </div>
  );
}
