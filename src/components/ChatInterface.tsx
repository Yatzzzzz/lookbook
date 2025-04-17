'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import VideoInput from './VideoInput';
import { LucideVolume2, LucideMic, LucideSquare } from 'lucide-react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

interface Message {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    image?: string;
    isGenerating?: boolean;
}

const STORAGE_KEY = 'gemini-chat-history';

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [latestFrame, setLatestFrame] = useState<string | null>(null);
    const [isCapturingVideo, setIsCapturingVideo] = useState<boolean>(false);
    
    // Audio/speech related states
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
    const [transcribedText, setTranscribedText] = useState<string>('');
    
    const currentBotMessageIdRef = useRef<string | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Add a new state for the microphone notification
    const [showMicNotification, setShowMicNotification] = useState<boolean>(false);

    // Add new state for guidance text
    const [guidanceText, setGuidanceText] = useState<string>('');
    const [showCapturedImagePreview, setShowCapturedImagePreview] = useState<boolean>(false);

    // Load chat history from localStorage on component mount
    useEffect(() => {
        try {
            const savedMessages = localStorage.getItem(STORAGE_KEY);
            if (savedMessages) {
                setMessages(JSON.parse(savedMessages));
                console.log('Chat history loaded from local storage');
            }
        } catch (err) {
            console.error('Failed to load chat history from localStorage:', err);
            // If loading fails, we just start with an empty chat
        }
    }, []);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        // Don't save if messages are empty (initial state) or we're currently loading
        if (messages.length === 0 || isLoading) return;
        
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
            console.log('Chat history saved to local storage');
        } catch (err) {
            console.error('Failed to save chat history to localStorage:', err);
        }
    }, [messages, isLoading]);

    const handleFrameCapture = useCallback((base64Frame: string | null) => {
        setLatestFrame(base64Frame);
        if (base64Frame) {
            setShowCapturedImagePreview(true);
            setGuidanceText('Image captured - click on the microphone to ask related questions');
            
            // Clear guidance after 10 seconds if not acted upon
            setTimeout(() => {
                setGuidanceText('');
            }, 10000);
        }
    }, []);

    const cleanupEventSource = () => {
        currentBotMessageIdRef.current = null;
        setIsLoading(false);
    };

    useEffect(() => {
        return cleanupEventSource;
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Function to clear the conversation history
    const clearConversation = useCallback(() => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
        setError(null);
    }, []);
    
    // Text-to-speech for bot responses - define this early to avoid reference issues
    const stopSpeaking = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);
    
    const speakText = useCallback((text: string) => {
        if (!window.speechSynthesis) {
            console.error("Speech synthesis not supported in this browser");
            return;
        }
        
        // Stop any ongoing speech
        stopSpeaking();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0; // Normal speaking rate
        utterance.pitch = 1.0; // Normal pitch
        
        // Use a female voice if available
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => voice.name.includes('female') || voice.name.includes('Female'));
        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            setIsSpeaking(false);
        };
        
        speechSynthesisRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [stopSpeaking]);

    const addMessage = useCallback((text: string, sender: 'user' | 'bot', image?: string, isGenerating: boolean = false) => {
        const id = uuidv4();
        const newMessage: Message = { id, text, sender, timestamp: Date.now(), image, isGenerating };
        
        // Add to state
        setMessages(prev => [...prev, newMessage]);
        
        // If it's a bot message being generated, track its ID
        if (sender === 'bot' && isGenerating) {
            currentBotMessageIdRef.current = id;
        }
        
        // Store the updated conversation
        try {
            const updatedMessages = [...messages, newMessage];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
        } catch (err) {
            console.error('Failed to save conversation to localStorage:', err);
        }
        
        return id;
    }, [messages]);

    const sendMessage = useCallback(async (manualText?: string, audioData?: string) => {
        const textToSend = manualText !== undefined ? manualText : inputText.trim();
        const frameToSend = isCapturingVideo ? latestFrame : null;
        const audioToSend = audioData || null;

        if (!textToSend && !frameToSend && !audioToSend) {
            setError("Please enter a message, enable video capture, or use voice input.");
            return;
        }

        // Clear guidance text when sending a message
        setGuidanceText('');
        
        setError(null);
        setIsLoading(true);
        stopSpeaking(); // Stop any ongoing speech
        cleanupEventSource();

        const userMessageId = addMessage(textToSend, 'user', frameToSend);
        const botMessageId = addMessage('...', 'bot', undefined, true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: textToSend,
                    imageParts: frameToSend ? [frameToSend] : [],
                    audioPart: audioToSend || undefined,
                }),
            });

            if (!response.ok) {
                let errorBody = { message: `API request failed with status ${response.status}` };
                try {
                    errorBody = await response.json();
                } catch (e) { /* Ignore parsing error */ }
                throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Response body is null');
            }

            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
            let buffer = '';
            let fullResponse = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += value;
                let boundary = buffer.indexOf('\n\n');
                
                while (boundary !== -1) {
                    const chunk = buffer.substring(0, boundary);
                    buffer = buffer.substring(boundary + 2);
                    
                    if (chunk.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(chunk.substring(6));
                            
                            if (data.text) {
                                fullResponse += data.text;
                                setMessages((prev) =>
                                    prev.map((msg) =>
                                        msg.id === botMessageId
                                            ? { ...msg, text: fullResponse }
                                            : msg
                                    )
                                );
                            } else if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                    
                    boundary = buffer.indexOf('\n\n');
                }
            }
            
            // Once the full response is received, speak it if needed
            if (fullResponse && audioToSend) {
                // Only auto-speak if the user sent audio (voice message)
                speakText(fullResponse);
            }
            
        } catch (error: any) {
            console.error('Error sending message:', error);
            setError(error.message || 'Failed to send message');
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === botMessageId
                        ? { ...msg, text: `Error: ${error.message || 'Unknown error'}` }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    }, [inputText, latestFrame, isCapturingVideo, speakText, stopSpeaking, addMessage, setGuidanceText]);

    // Simplified speech recognition
    const startSpeechRecognition = useCallback(() => {
        console.log("Starting speech recognition (simplified)...");
        
        // Already recording, don't start again
        if (isRecording) {
            console.log("Already recording, ignoring start request");
            return;
        }
        
        if (!navigator.mediaDevices) {
            setError("Your browser doesn't support speech recognition. Try Chrome or Edge.");
            return;
        }
        
        // First set recording state to true for immediate UI feedback
        setIsRecording(true);
        setError(null);
        audioChunksRef.current = [];
        
        // Show notification
        setShowMicNotification(true);
        setTimeout(() => setShowMicNotification(false), 3000);
        
        // Use a try-catch block to handle potential permission issues
        try {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    console.log("Microphone access granted");
                    
                    // Create and configure the MediaRecorder
                    const recorder = new MediaRecorder(stream);
                    mediaRecorderRef.current = recorder;
                    
                    // Set up event handlers
                    recorder.ondataavailable = (event) => {
                        if (event.data.size > 0) {
                            audioChunksRef.current.push(event.data);
                        }
                    };
                    
                    recorder.onstop = () => {
                        // Process the recorded audio
                        if (audioChunksRef.current.length === 0) {
                            console.warn("No audio data recorded");
                            return;
                        }
                        
                        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                        const reader = new FileReader();
                        
                        reader.onloadend = () => {
                            const base64Audio = reader.result as string;
                            if (base64Audio) {
                                setRecordedAudio(base64Audio);
                                sendMessage("", base64Audio);
                            }
                        };
                        
                        reader.readAsDataURL(audioBlob);
                        
                        // Clean up
                        stream.getTracks().forEach(track => track.stop());
                    };
                    
                    // Start recording
                    recorder.start(100); // Collect data every 100ms
                    console.log("Recording started successfully");
                })
                .catch(err => {
                    console.error("Error accessing microphone:", err);
                    setIsRecording(false);
                    setError(`Microphone error: ${err.message || "Unable to access microphone. Please check browser permissions."}`);
                });
        } catch (err) {
            console.error("Critical error starting recording:", err);
            setIsRecording(false);
            setError("Failed to start recording. Please check your microphone permissions.");
        }
    }, [sendMessage, setRecordedAudio, setShowMicNotification, setError]);
    
    const stopSpeechRecognition = useCallback(() => {
        console.log("Stopping speech recognition...");
        
        // Stop the recorder if it exists and is active
        if (mediaRecorderRef.current) {
            try {
                if (mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop();
                    console.log("MediaRecorder stopped");
                } else {
                    console.warn("MediaRecorder not active");
                }
            } catch (err) {
                console.error("Error stopping MediaRecorder:", err);
            }
            
            // Clear the reference
            mediaRecorderRef.current = null;
        }
        
        // Update UI state regardless of recorder state
        setIsRecording(false);
    }, []);
    
    // Simplified toggle function
    const toggleRecording = useCallback(() => {
        console.log("Toggle recording, current state:", isRecording);
        
        if (isRecording) {
            stopSpeechRecognition();
            setGuidanceText('');
        } else {
            startSpeechRecognition();
            setGuidanceText('Ask fashion related question and click on the send button to receive answers');
        }
    }, [isRecording, startSpeechRecognition, stopSpeechRecognition]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!isLoading) {
                sendMessage();
            }
        }
    };

    // Prevent event propagation to avoid page navigation issues
    const handleButtonClick = (e: React.MouseEvent, callback: () => void) => {
        e.preventDefault();
        e.stopPropagation();
        callback();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
            {/* Video Input Area - maximized to half the screen */}
            <div className="w-full border-b border-gray-200 dark:border-gray-700 overflow-hidden">
                <VideoInput
                    onFrameCapture={handleFrameCapture}
                    isCapturing={isCapturingVideo}
                    setIsCapturing={setIsCapturingVideo}
                    captureInterval={3000} // Capture every 3s when active
                />
            </div>

            {/* Chat Area */}
            <div className="flex-grow flex flex-col h-[50vh] overflow-hidden">
                {/* Chat header with icons */}
                <div className="p-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        {/* Clear chat button */}
                        <button 
                            onClick={(e) => handleButtonClick(e, clearConversation)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Clear conversation"
                        >
                            <Image src="/clear-chat.svg" alt="Clear Chat" width={20} height={20} />
                        </button>
                        
                        {/* Microphone button - more prominent */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log("Microphone button clicked");
                                toggleRecording(); // Use the simpler toggleRecording function
                            }}
                            className={`p-2 rounded-full transition-colors ${
                                isRecording 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                            }`}
                            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                        >
                            <Image 
                                src={isRecording ? "/microphone-on.svg" : "/microphone.svg"} 
                                alt={isRecording ? "Microphone On" : "Microphone"} 
                                width={24} 
                                height={24} 
                                priority
                            />
                        </button>
                        
                        {/* Guidance text */}
                        {guidanceText && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <span>{guidanceText}</span>
                                {guidanceText.includes('send button') && (
                                    <span className="ml-1 inline-flex items-center">
                                        <Image src="/send.svg" alt="Send" width={16} height={16} priority />
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Captured image preview */}
                    {showCapturedImagePreview && latestFrame && (
                        <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Latest capture:</div>
                            <div className="w-12 h-12 relative border rounded overflow-hidden">
                                <img 
                                    src={latestFrame} 
                                    alt="Captured" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Message List */}
                <div 
                    ref={messagesContainerRef}
                    className="flex-grow overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-700"
                >
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 dark:text-gray-400 text-center">
                                Send a message to start a conversation with Gemini AI
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-2 rounded-lg shadow max-w-[85%] ${
                                        msg.sender === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                                    }`}>
                                        {msg.image && msg.sender === 'user' && (
                                            <img src={msg.image} alt="User input frame" className="max-w-full h-auto rounded mb-2 border"/>
                                        )}
                                        {/* Render text with line breaks */}
                                        {msg.text.split('\n').map((line, index) => (
                                            <span key={index}>
                                                {line}
                                                {index < msg.text.split('\n').length - 1 && <br />}
                                            </span>
                                        ))}
                                        {/* Loading indicator for the bot message being generated */}
                                        {msg.isGenerating && (
                                            <span className="ml-1 inline-flex items-center">
                                                <span className="w-1.5 h-1.5 bg-current rounded-full mr-1 animate-ping"></span>
                                                <span className="w-1.5 h-1.5 bg-current rounded-full mr-1 animate-ping" style={{ animationDelay: '0.2s' }}></span>
                                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></span>
                                            </span>
                                        )}
                                        {/* Audio playback button for bot messages */}
                                        {msg.sender === 'bot' && !msg.isGenerating && (
                                            <button
                                                onClick={() => speakText(msg.text)}
                                                className="ml-1 p-1 text-xs rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 inline-flex items-center"
                                                aria-label="Listen to response"
                                            >
                                                <span className="sr-only">Listen</span>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M15.54 8.46C16.1255 9.04554 16.4684 9.83901 16.4684 10.67C16.4684 11.501 16.1255 12.2945 15.54 12.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
                
                {/* Input Area */}
                <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && inputText.trim() && !isLoading) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Ask a fashion question..."
                            className="flex-grow p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            disabled={isLoading}
                        />
                        <button
                            onClick={(e) => handleButtonClick(e, () => sendMessage())}
                            disabled={isLoading || (!inputText.trim() && !latestFrame && !isRecording)}
                            className="p-2 rounded-full bg-white hover:bg-gray-100 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            aria-label="Send message"
                        >
                            <Image src="/send.svg" alt="Send" width={24} height={24} priority />
                        </button>
                    </div>
                    
                    {/* Status Indicators */}
                    {(isSpeaking || isRecording) && (
                        <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            {isSpeaking && (
                                <div className="flex items-center">
                                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                    <span>Speaking</span>
                                    <button
                                        onClick={stopSpeaking}
                                        className="ml-1 text-xs text-blue-500 hover:text-blue-600"
                                    >
                                        Stop
                                    </button>
                                </div>
                            )}
                            
                            {isRecording && (
                                <div className="flex items-center">
                                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                                    <span>Recording</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Microphone activation notification */}
            {showMicNotification && (
                <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg z-50 shadow-lg">
                    <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        <span>Microphone activated! Speak now...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface; 