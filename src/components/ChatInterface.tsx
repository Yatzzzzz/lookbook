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
    const [voicesLoaded, setVoicesLoaded] = useState<boolean>(false);
    
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

        // Initialize speech synthesis voices when component mounts
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            // Check if voices are already available
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                setVoicesLoaded(true);
            } else {
                // If voices aren't available yet, listen for the voiceschanged event
                const onVoicesChanged = () => {
                    setVoicesLoaded(true);
                    window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                };
                window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
                
                // Clean up event listener
                return () => {
                    window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                };
            }
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
            setGuidanceText('Image captured - click on the microphone icon to ask questions about it');
            
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
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            } catch (err) {
                console.error("Error stopping speech synthesis:", err);
            }
        }
    }, []);
    
    const speakText = useCallback((text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            console.error("Speech synthesis not supported in this browser");
            return;
        }
        
        try {
            // Stop any ongoing speech
            stopSpeaking();
            
            // Break the text into smaller chunks if it's too long (browser limitation)
            const MAX_CHUNK_LENGTH = 100;
            const processTextInChunks = (text: string) => {
                // Split by sentences or other logical breaks
                const sentences = text.split(/(?<=[.!?])\s+/);
                let currentChunk = '';
                const chunks: string[] = [];
                
                sentences.forEach(sentence => {
                    if ((currentChunk + sentence).length < MAX_CHUNK_LENGTH) {
                        currentChunk += (currentChunk ? ' ' : '') + sentence;
                    } else {
                        if (currentChunk) {
                            chunks.push(currentChunk);
                        }
                        currentChunk = sentence;
                    }
                });
                
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                
                return chunks;
            };
            
            const textChunks = processTextInChunks(text);
            let chunkIndex = 0;
            
            const speakNextChunk = () => {
                if (chunkIndex >= textChunks.length) {
                    setIsSpeaking(false);
                    return;
                }
                
                const chunk = textChunks[chunkIndex];
                const utterance = new SpeechSynthesisUtterance(chunk);
                
                // Configure utterance
                utterance.rate = 1.0; // Normal speaking rate
                utterance.pitch = 1.0; // Normal pitch
                
                // Try to find a female voice if available and voices are loaded
                if (voicesLoaded) {
                    try {
                        const voices = window.speechSynthesis.getVoices();
                        // Prefer female voices, fall back to first available
                        const femaleVoice = voices.find(voice => 
                            voice.name.toLowerCase().includes('female') || 
                            voice.name.toLowerCase().includes('woman')
                        );
                        
                        if (femaleVoice) {
                            utterance.voice = femaleVoice;
                        } else if (voices.length > 0) {
                            // Use first available voice as fallback
                            utterance.voice = voices[0];
                        }
                    } catch (err) {
                        console.warn("Error setting voice:", err);
                    }
                }
                
                // Set event handlers
                utterance.onstart = () => {
                    setIsSpeaking(true);
                };
                
                utterance.onend = () => {
                    // Move to next chunk
                    chunkIndex++;
                    speakNextChunk();
                };
                
                utterance.onerror = (event) => {
                    console.warn("Speech synthesis error:", event);
                    // Try to continue with next chunk
                    chunkIndex++;
                    speakNextChunk();
                };
                
                // Keep track of current utterance
                speechSynthesisRef.current = utterance;
                
                // Speak with slight delay to prevent browser issues
                setTimeout(() => {
                    try {
                        window.speechSynthesis.speak(utterance);
                    } catch (err) {
                        console.error("Error during speech synthesis:", err);
                        setIsSpeaking(false);
                    }
                }, 50);
            };
            
            // Start the speaking process
            speakNextChunk();
            
        } catch (err) {
            console.error("Critical error in speech synthesis:", err);
            setIsSpeaking(false);
        }
    }, [stopSpeaking, voicesLoaded]);

    const addMessage = useCallback((text: string, sender: 'user' | 'bot', image?: string, isGenerating: boolean = false) => {
        const id = uuidv4();
        const newMessage: Message = { 
            id, 
            text, 
            sender, 
            image, 
            isGenerating 
        };
        
        // Add to state
        setMessages(prev => [...prev, newMessage]);
        
        // If it's a bot message being generated, track its ID
        if (sender === 'bot' && isGenerating) {
            currentBotMessageIdRef.current = id;
        }
        
        return id;
    }, []);

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

        // Clear input field immediately for better UX
        setInputText('');
        
        const userMessageId = addMessage(textToSend, 'user', frameToSend || undefined);
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
                try {
                    setTimeout(() => {
                        speakText(fullResponse);
                    }, 100);
                } catch (err) {
                    console.warn("Could not auto-speak response:", err);
                }
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
    const toggleRecording = useCallback((e?: React.MouseEvent) => {
        // Prevent default event behavior if provided
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        console.log("Toggle recording, current state:", isRecording);
        
        if (isRecording) {
            stopSpeechRecognition();
            setGuidanceText('');
        } else {
            startSpeechRecognition();
            setGuidanceText('Ask a fashion related question about the captured image');
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
                <div className="p-2 flex flex-col border-b border-gray-200 dark:border-gray-700">
                    {/* Guidance text - separate line above controls */}
                    {guidanceText && (
                        <div className="w-full mb-2 px-1 py-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded">
                            <p>{guidanceText}</p>
                        </div>
                    )}
                    
                    {/* Controls row with preview */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            {/* Clear chat button */}
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    clearConversation();
                                }}
                                className="p-1.5 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Clear conversation"
                            >
                                <div className="flex items-center justify-center w-10 h-10 translate-y-1">
                                    <Image src="/svg icons/clear chat.svg" alt="Clear Chat" width={30} height={30} className="object-contain" />
                                </div>
                            </button>
                            
                            {/* Microphone button - more prominent */}
                            <button
                                onClick={toggleRecording}
                                className={`p-2 rounded-full transition-colors ${
                                    isRecording 
                                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                                        : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                                }`}
                                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                            >
                                <div className="flex items-center justify-center w-6 h-6">
                                    <Image 
                                        src={isRecording ? "/svg icons/microphone is on.svg" : "/svg icons/microphone.svg"} 
                                        alt={isRecording ? "Microphone On" : "Microphone"} 
                                        width={20} height={20}
                                        className="object-contain translate-y-0.5" 
                                        priority
                                    />
                                </div>
                            </button>
                            
                            {/* Small Send Text button - now to the right of microphone */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    // Stop recording if it's active
                                    if (isRecording) {
                                        stopSpeechRecognition();
                                    }
                                    // Then send the message
                                    sendMessage();
                                }}
                                disabled={isLoading || (!inputText.trim() && !latestFrame && !isRecording)}
                                className="px-2 py-1 text-xs rounded bg-white hover:bg-gray-100 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                aria-label="Send message"
                            >
                                <span>Send</span>
                                <div className="flex items-center justify-center w-4 h-4">
                                    <Image src="/svg icons/send.svg" alt="Send" width={16} height={16} className="object-contain" priority />
                                </div>
                            </button>
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
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    try {
                                                        speakText(msg.text);
                                                    } catch (err) {
                                                        console.warn("Failed to speak message:", err);
                                                    }
                                                }}
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
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a fashion question..."
                            className="flex-grow p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            disabled={isLoading}
                        />
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Stop recording if it's active
                                if (isRecording) {
                                    stopSpeechRecognition();
                                }
                                // Then send the message
                                sendMessage();
                            }}
                            disabled={isLoading || (!inputText.trim() && !latestFrame && !isRecording)}
                            className="p-2 rounded-full bg-white hover:bg-gray-100 border border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            aria-label="Send message"
                        >
                            <div className="flex items-center justify-center w-6 h-6">
                                <Image src="/svg icons/send.svg" alt="Send" width={22} height={22} className="object-contain" priority />
                            </div>
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
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            stopSpeaking();
                                        }}
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