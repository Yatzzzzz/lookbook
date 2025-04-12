import React, { useRef, useEffect, useState, useCallback } from 'react';

interface VideoInputProps {
    onFrameCapture: (base64Frame: string | null) => void;
    captureInterval?: number; // Interval in ms to auto-capture frames
    isCapturing: boolean; // Control capturing externally
    setIsCapturing: (isCapturing: boolean) => void;
}

const VideoInput: React.FC<VideoInputProps> = ({
    onFrameCapture,
    captureInterval = 2000, // Default: capture every 2 seconds if auto-capturing
    isCapturing,
    setIsCapturing
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const cleanupStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            console.log("Camera stream stopped.");
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsCameraOn(false);
        setIsCapturing(false); // Ensure capturing stops if camera turns off
        onFrameCapture(null); // Signal no frame is available
    }, [setIsCapturing, onFrameCapture]);

    const startCamera = useCallback(async () => {
        setError(null);
        if (streamRef.current) { // Camera already running
            setIsCameraOn(true);
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } }, // Request a reasonable size
                audio: false // No audio needed
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Ensure metadata is loaded before accessing dimensions or playing
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                        videoRef.current.play().catch(err => {
                            console.error("Video play failed:", err);
                            setError(`Video play failed: ${err.message}`);
                        });
                    }
                };
            }
            setIsCameraOn(true);
            console.log("Camera started.");
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            if (err.name === 'NotAllowedError') {
                setError('Camera permission denied. Please grant access in your browser settings.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError('No camera found. Please ensure a camera is connected and enabled.');
            } else {
                setError(`Error accessing camera: ${err.message}`);
            }
            cleanupStream();
        }
    }, [cleanupStream]);

    const stopCamera = useCallback(() => {
        cleanupStream();
    }, [cleanupStream]);

    const captureFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !streamRef.current || videoRef.current.paused || videoRef.current.ended) {
            console.warn('Cannot capture frame: Video not ready or stream inactive.');
            onFrameCapture(null);
            return null;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas dimensions to match video display size for accurate capture
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');
        if (!context) {
            console.error('Could not get 2D context from canvas');
            onFrameCapture(null);
            return null;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get base64 encoded image data (JPEG is generally smaller than PNG)
        try {
            const base64Frame = canvas.toDataURL('image/jpeg', 0.8); // Adjust quality (0.0 to 1.0)
            onFrameCapture(base64Frame); // Pass frame to parent
            console.log("Frame captured");
            return base64Frame; // Return for potential immediate use
        } catch (e: any) {
            console.error("Error converting canvas to data URL:", e);
            setError(`Error capturing frame: ${e.message}`);
            onFrameCapture(null);
            return null;
        }
    }, [onFrameCapture]);

    // Effect to handle automatic capturing based on `isCapturing` prop
    useEffect(() => {
        if (isCapturing && isCameraOn && !intervalRef.current) {
            // Start interval immediately captures first frame
            captureFrame();
            intervalRef.current = setInterval(captureFrame, captureInterval);
            console.log(`Auto-capture started (interval: ${captureInterval}ms)`);
        } else if (!isCapturing && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log("Auto-capture stopped.");
        }

        // Cleanup interval on component unmount or when dependencies change
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                console.log("Auto-capture interval cleared on cleanup.");
            }
        };
    }, [isCapturing, isCameraOn, captureInterval, captureFrame]);

    // Cleanup stream on component unmount
    useEffect(() => {
        return () => {
            console.log("VideoInput unmounting, cleaning up stream...");
            cleanupStream();
        };
    }, [cleanupStream]);

    return (
        <div className="border p-2 rounded bg-gray-100 dark:bg-gray-800">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="relative mb-2">
                {/* Video element to display the stream */}
                <video
                    ref={videoRef}
                    playsInline // Important for iOS Safari to play inline
                    muted // Mute to avoid feedback loops
                    className={`w-full h-auto rounded ${!isCameraOn ? 'bg-black' : ''}`}
                    style={{ transform: 'scaleX(-1)' }} // Flip horizontally for mirror effect
                ></video>
                {/* Hidden canvas for capturing frames */}
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                {!isCameraOn && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">Camera Off</div>}
            </div>
            <div className="flex space-x-2 justify-center">
                {!isCameraOn ? (
                    <button onClick={startCamera} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Start Camera
                    </button>
                ) : (
                    <>
                        <button onClick={stopCamera} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                            Stop Camera
                        </button>
                        {/* Toggle Auto-Capture */}
                        <button
                            onClick={() => setIsCapturing(!isCapturing)}
                            className={`px-3 py-1 rounded ${isCapturing ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-500 hover:bg-gray-600'} text-white`}
                            disabled={!isCameraOn}
                        >
                            {isCapturing ? 'Stop Auto-Capture' : 'Start Auto-Capture'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VideoInput; 