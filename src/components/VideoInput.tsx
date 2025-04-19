import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

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
    const [cameraInitializing, setCameraInitializing] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [showCaptureFeedback, setShowCaptureFeedback] = useState(false);
    const [captureCount, setCaptureCount] = useState(0);

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

    const startCamera = useCallback(async (e?: React.MouseEvent) => {
        // Prevent default behavior if event is provided
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        setError(null);
        // Prevent multiple initialization attempts
        if (streamRef.current || cameraInitializing) {
            return;
        }
        
        setCameraInitializing(true);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 }, 
                    height: { ideal: 480 },
                    facingMode: 'environment' // Prefer rear camera on mobile
                },
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
        } finally {
            setCameraInitializing(false);
        }
    }, [cleanupStream, cameraInitializing]);

    const stopCamera = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
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
            
            // Show capture feedback
            setShowCaptureFeedback(true);
            setCaptureCount(prev => prev + 1);
            
            // Hide feedback after 2 seconds
            setTimeout(() => {
                setShowCaptureFeedback(false);
            }, 2000);
            
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

    // Toggle auto-capture
    const toggleAutoCapture = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsCapturing(!isCapturing);
    }, [isCapturing, setIsCapturing]);

    // Manual capture button handler
    const handleManualCapture = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCameraOn && !isCapturing) {
            captureFrame();
        }
    };

    return (
        <div className="relative w-full">
            {error && <p className="text-red-500 text-sm absolute top-2 left-2 right-2 z-10 bg-black bg-opacity-50 p-1 rounded">{error}</p>}
            <div className="relative w-full" style={{ minHeight: '160px' }}>
                {/* Video element to display the stream */}
                <video
                    ref={videoRef}
                    playsInline // Important for iOS Safari to play inline
                    muted // Mute to avoid feedback loops
                    className={`w-full h-auto ${!isCameraOn ? 'bg-black' : ''}`}
                    style={{ 
                        transform: 'scaleX(-1)', // Flip horizontally for mirror effect
                        maxHeight: '50vh' // Limit height to half of viewport height
                    }}
                ></video>
                {/* Hidden canvas for capturing frames */}
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                
                {/* Center camera control overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {!isCameraOn && (
                        // Start camera icon button
                        <button 
                            onClick={startCamera}
                            disabled={cameraInitializing}
                            className={`p-3 rounded-full transition-colors ${cameraInitializing ? 'opacity-50' : ''}`}
                            aria-label="Start Camera"
                        >
                            {cameraInitializing ? (
                                <div className="w-10 h-10 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin"></div>
                            ) : (
                                <Image 
                                    src="/start-camera.svg" 
                                    alt="Start Camera" 
                                    width={40} 
                                    height={40} 
                                />
                            )}
                        </button>
                    )}
                </div>
                
                {/* Camera controls in the middle-left of the screen */}
                {isCameraOn && (
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-4">
                        {/* Auto-capture toggle button */}
                        <button
                            onClick={toggleAutoCapture}
                            className="p-2 rounded-full transition-colors"
                            aria-label={isCapturing ? "Auto-Capture is On" : "Start Auto-Capture"}
                        >
                            <Image 
                                src={isCapturing ? "/capture-is-on.svg" : "/start-camera-capture.svg"} 
                                alt={isCapturing ? "Auto-Capture is On" : "Start Auto-Capture"} 
                                width={32} 
                                height={32} 
                            />
                        </button>
                        
                        {/* Stop camera button */}
                        <button 
                            onClick={stopCamera} 
                            className="p-2 rounded-full transition-colors"
                            aria-label="Stop Camera"
                        >
                            <Image 
                                src="/stop-camera.svg" 
                                alt="Stop Camera" 
                                width={32} 
                                height={32} 
                            />
                        </button>
                    </div>
                )}
                
                {/* Capture feedback notification */}
                {showCaptureFeedback && (
                    <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded-lg shadow-lg animate-pulse transition-opacity">
                        <div className="flex flex-col">
                            <p className="font-semibold">Image Captured! {captureCount > 1 ? `(${captureCount})` : ''}</p>
                            <p className="text-xs mt-1">Now click the microphone icon below to ask questions about this image</p>
                        </div>
                    </div>
                )}
                
                {/* Auto-capture indicator */}
                {isCapturing && (
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full shadow-lg">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-xs">Auto-Capturing</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoInput; 