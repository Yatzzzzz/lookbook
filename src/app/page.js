'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react';

const FRAME_INTERVAL_MS = 500; // Send video frame every 500ms (adjust as needed)
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3000/api/gemini-live'; // Adjust protocol/port if needed

export default function FashionAssistantPage() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [conversation, setConversation] = useState([]); // { type: 'user'/'ai'/'info'/'error', text: '...' }
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [userInput, setUserInput] = useState('');

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const webSocketRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const frameIntervalRef = useRef(null);
    const audioContextRef = useRef(null);
    const aiAudioSourceRef = useRef(null); // To store the current AudioBufferSourceNode for interruption

    // --- WebSocket Connection ---
    const connectWebSocket = useCallback(() => {
        if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
            console.log("WebSocket already open.");
            return;
        }

        console.log(`Attempting to connect WebSocket to ${WEBSOCKET_URL}...`);
        // Ensure correct URL (ws:// or wss://)
        const ws = new WebSocket(WEBSOCKET_URL.replace(/^http/, 'ws'));
        webSocketRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
            setConversation(prev => [...prev, { type: 'info', text: 'Connected.' }]);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                // console.log('Message from server:', message.type); // Can be verbose

                switch (message.type) {
                    case 'ai_text':
                        setConversation(prev => [...prev, { type: 'ai', text: message.payload }]);
                        setIsAiSpeaking(false); // Assume text means audio might follow or is done
                        break;
                    case 'ai_audio':
                        playAiAudio(message.payload); // Play received audio chunk (base64)
                        setIsAiSpeaking(true);
                        break;
                    case 'info':
                         setConversation(prev => [...prev, { type: 'info', text: message.payload }]);
                         break;
                    case 'error':
                         console.error('Backend Error:', message.payload);
                         setConversation(prev => [...prev, { type: 'error', text: message.payload }]);
                         // Potentially stop streaming or disconnect on critical errors
                         break;
                    // Add other message handlers
                }
            } catch (error) {
                console.error('Failed to parse server message or handle it:', error);
                 setConversation(prev => [...prev, { type: 'error', text: 'Received invalid message from server.' }]);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            setConversation(prev => [...prev, { type: 'error', text: 'Connection error.' }]);
            setIsConnected(false);
            setIsAiSpeaking(false);
            // Consider attempting reconnection here
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
            setIsAiSpeaking(false);
            setIsStreaming(false); // Stop streaming if connection drops
            setConversation(prev => [...prev, { type: 'info', text: 'Disconnected.' }]);
            webSocketRef.current = null;
        };
    }, []);

    useEffect(() => {
        connectWebSocket(); // Connect on component mount

        // Cleanup on unmount
        return () => {
            webSocketRef.current?.close();
            stopStreaming(); // Ensure media is released
             if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [connectWebSocket]); // connectWebSocket is stable due to useCallback


    // --- Media Streaming ---
    const startStreaming = async () => {
        if (isStreaming) return;
        if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
             setConversation(prev => [...prev, { type: 'error', text: 'Not connected to backend.' }]);
             return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }, // Request specific size
                audio: true // Request microphone access (even if only sending video frames initially)
            });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video metadata to load to get correct dimensions
                 videoRef.current.onloadedmetadata = () => {
                    if (canvasRef.current && videoRef.current) {
                        canvasRef.current.width = videoRef.current.videoWidth;
                        canvasRef.current.height = videoRef.current.videoHeight;
                    }
                     // Start sending frames *after* metadata is loaded
                    clearInterval(frameIntervalRef.current); // Clear any previous interval
                    frameIntervalRef.current = setInterval(sendVideoFrame, FRAME_INTERVAL_MS);
                    setIsStreaming(true);
                    setConversation(prev => [...prev, { type: 'info', text: 'Streaming started.' }]);
                };
            }

             // --- Basic Audio Context Setup ---
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                 audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
             // In a real app: connect stream to audio nodes for processing/sending audio chunks
             // const source = audioContextRef.current.createMediaStreamSource(stream);
             // Connect source to processing nodes...


        } catch (error) {
            console.error('Error accessing media devices:', error);
             setConversation(prev => [...prev, { type: 'error', text: `Error accessing camera/mic: ${error.message}` }]);
             setIsStreaming(false);
        }
    };

    const stopStreaming = () => {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        // Clear canvas? Optional.
        setIsStreaming(false);
        console.log('Streaming stopped.');
         if (isConnected) { // Only add message if still connected
             setConversation(prev => [...prev, { type: 'info', text: 'Streaming stopped.' }]);
        }
    };

    // --- Sending Data ---
    const sendVideoFrame = () => {
        if (!isStreaming || !webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN || !videoRef.current || !canvasRef.current) {
            return;
        }
        const context = canvasRef.current.getContext('2d');
        if (!context) return;

        try {
            // Draw current video frame to canvas
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            // Get frame data as base64 encoded JPEG
            const frameData = canvasRef.current.toDataURL('image/jpeg', 0.7); // Adjust quality if needed

            // Send via WebSocket
            webSocketRef.current.send(JSON.stringify({
                type: 'video_frame',
                payload: frameData // Send base64 string
            }));
        } catch (error) {
            console.error("Error capturing or sending video frame:", error);
            // Potentially stop streaming on repeated errors
        }
    };

     const sendUserText = () => {
         if (!userInput.trim() || !webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) {
             return;
         }
         // Interrupt AI if it's speaking
         if (isAiSpeaking) {
             sendInterrupt();
         }

         const textToSend = userInput;
         setConversation(prev => [...prev, { type: 'user', text: textToSend }]);
         webSocketRef.current.send(JSON.stringify({ type: 'user_text', payload: textToSend }));
         setUserInput(''); // Clear input field
     };

      const handleUserInputKeyDown = (event) => {
        if (event.key === 'Enter') {
            sendUserText();
        }
    };

    // In a real app, you'd replace sendUserText with microphone button logic
    // that captures audio chunks and sends them (type: 'user_audio_chunk')

    const sendInterrupt = () => {
        if (!webSocketRef.current || webSocketRef.current.readyState !== WebSocket.OPEN) return;
        console.log("Sending interrupt signal...");
        webSocketRef.current.send(JSON.stringify({ type: 'interrupt' }));
         // Immediately stop local playback
        if (aiAudioSourceRef.current) {
            try {
                 aiAudioSourceRef.current.stop();
                 console.log("Stopped local AI audio playback.");
            } catch (e) { console.warn("Could not stop audio node", e)} // Might already be stopped
            aiAudioSourceRef.current = null;
        }
        setIsAiSpeaking(false);
    };


    // --- AI Audio Playback ---
     const playAiAudio = async (base64Audio) => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            console.warn("AudioContext not ready for playback.");
            // Try to resume/recreate if needed
             audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
             if (audioContextRef.current.state === 'suspended') {
                 await audioContextRef.current.resume();
             }
             if (audioContextRef.current.state !== 'running'){
                 setConversation(prev => [...prev, { type: 'error', text: 'Cannot play audio. Please interact with the page first.' }]);
                 return;
             }
        } else if (audioContextRef.current.state === 'suspended') {
             await audioContextRef.current.resume(); // Needs user interaction first time usually
         }

         // Stop any currently playing AI audio first
         if (aiAudioSourceRef.current) {
             try {aiAudioSourceRef.current.stop();} catch(e){console.warn("Previous node stop failed", e)}
         }


        try {
            // Decode base64 -> ArrayBuffer
            const byteString = atob(base64Audio);
            const byteArray = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                byteArray[i] = byteString.charCodeAt(i);
            }
            const arrayBuffer = byteArray.buffer;

            // Decode audio data
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

            // Create source node and play
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
            aiAudioSourceRef.current = source; // Store node reference for interruption

            source.onended = () => {
                // Only set isAiSpeaking to false if this *specific* node finished
                if (aiAudioSourceRef.current === source) {
                     setIsAiSpeaking(false);
                     aiAudioSourceRef.current = null;
                }
                 // console.log("AI audio finished playing.");
            };

        } catch (error) {
            console.error('Error decoding or playing AI audio:', error);
            setIsAiSpeaking(false);
             setConversation(prev => [...prev, { type: 'error', text: 'Failed to play AI audio.' }]);
             aiAudioSourceRef.current = null; // Clear ref on error
        }
    };


    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
            {/* Video/Control Panel */}
            <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
                <h2>Live Feed</h2>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxWidth: '640px', border: '1px solid black', backgroundColor: '#eee' }}></video>
                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                <div style={{ marginTop: '20px' }}>
                    {!isStreaming ? (
                        <button onClick={startStreaming} disabled={!isConnected}>Start Camera & Mic</button>
                    ) : (
                        <button onClick={stopStreaming}>Stop Camera & Mic</button>
                    )}
                </div>
                 <p>Status: {isConnected ? 'Connected' : 'Disconnected'} | {isStreaming ? 'Streaming' : 'Not Streaming'} | AI: {isAiSpeaking ? 'Speaking...' : 'Idle'}</p>
                  {/* Simple Text Input for Demo */}
                <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                     <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleUserInputKeyDown}
                        placeholder="Type your question..."
                        disabled={!isStreaming || !isConnected}
                        style={{ flexGrow: 1, padding: '8px' }}
                    />
                    <button onClick={sendUserText} disabled={!isStreaming || !isConnected || !userInput.trim()}>Send</button>
                    {/* In real app, replace with Mic button */}
                     <button onClick={sendInterrupt} disabled={!isAiSpeaking} title="Interrupt AI">
                        Interrupt 🎤
                     </button>
                 </div>
            </div>

            {/* Conversation Panel */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
                 {/* Reverse flex direction + map means latest messages appear at the bottom and stay visible */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {conversation.slice().reverse().map((msg, index) => ( // Reverse for display order
                        <div key={conversation.length - 1 - index} style={{
                            alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                            backgroundColor: msg.type === 'user' ? '#dcf8c6' : msg.type === 'ai' ? '#fff' : msg.type === 'error' ? '#ffdddd' : '#eee',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            maxWidth: '80%',
                            border: msg.type === 'error' ? '1px solid red' : msg.type === 'info' ? '1px solid #ccc': '1px solid #eee',
                            wordWrap: 'break-word',
                            fontSize: msg.type === 'info' || msg.type === 'error' ? '0.8em' : '1em',
                            color: msg.type === 'info' ? '#555' : msg.type === 'error' ? 'red' : '#000',
                        }}>
                            {msg.text}
                        </div>
                    ))}
                </div>
                 <h2 style={{ textAlign: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1, marginBottom: '10px' }}>Conversation</h2>
            </div>
        </div>
    );
}