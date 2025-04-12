'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import VideoInput from './VideoInput';
import { LucideVolume2, LucideMic, LucideSquare } from 'lucide-react';

interface Message {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    image?: string;
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

    // Speech recognition setup
    const startSpeechRecognition = useCallback(async () => {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            setError("Your browser doesn't support speech recognition. Try Chrome or Edge.");
            return;
        }
        
        try {
            setIsRecording(true);
            setError(null);
            audioChunksRef.current = [];
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                
                reader.onloadend = () => {
                    const base64Audio = reader.result as string;
                    setRecordedAudio(base64Audio);
                    
                    // For now, send directly. In production, you might want to validate or show preview
                    if (base64Audio) {
                        sendMessage(undefined, base64Audio);
                    }
                };
                
                reader.readAsDataURL(audioBlob);
                
                // Stop all audio tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current.start();
        } catch (err: any) {
            console.error("Error accessing microphone:", err);
            setIsRecording(false);
            setError(`Microphone error: ${err.message || "Unable to access microphone"}`);
        }
    }, []);
    
    const stopSpeechRecognition = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    // Text-to-speech for bot responses
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
    }, []);
    
    const stopSpeaking = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, []);

    const sendMessage = useCallback(async (manualText?: string, audioData?: string) => {
        const textToSend = manualText !== undefined ? manualText : inputText.trim();
        const frameToSend = isCapturingVideo ? latestFrame : null;
        const audioToSend = audioData || null;

        if (!textToSend && !frameToSend && !audioToSend) {
            setError("Please enter a message, enable video capture, or use voice input.");
            return;
        }

        setError(null);
        setIsLoading(true);
        stopSpeaking(); // Stop any ongoing speech
        cleanupEventSource();

        const userMessageId = `user-${Date.now()}`;
        const userMessage: Message = {
            id: userMessageId,
            sender: 'user',
            text: textToSend || (audioToSend ? '🎤 Voice message' : ''),
            image: frameToSend || undefined,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setRecordedAudio(null);

        const botMessageId = `bot-${Date.now()}`;
        currentBotMessageIdRef.current = botMessageId;
        setMessages((prev) => [...prev, { id: botMessageId, sender: 'bot', text: '...' }]);

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
    }, [inputText, latestFrame, isCapturingVideo, speakText, stopSpeaking]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (!isLoading) {
                sendMessage();
            }
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] gap-4 p-4 bg-white dark:bg-gray-900">
            {/* Video Input Area */}
            <div className="w-full md:w-1/3 lg:w-1/4 border rounded-lg shadow-md overflow-hidden flex flex-col">
                <h2 className="text-lg font-semibold p-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">Video Input</h2>
                <div className="p-2 flex-grow">
                    <VideoInput
                        onFrameCapture={handleFrameCapture}
                        isCapturing={isCapturingVideo}
                        setIsCapturing={setIsCapturingVideo}
                        captureInterval={3000} // Capture every 3s when active
                    />
                </div>
                {latestFrame && isCapturingVideo && (
                    <div className="p-2 border-t">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Captured Frame:</p>
                        <img src={latestFrame} alt="Last captured frame" className="max-w-full h-auto rounded border"/>
                    </div>
                )}
            </div>

            {/* Chat Area */}
            <div className="w-full md:w-2/3 lg:w-3/4 border rounded-lg shadow-md overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-gray-100 dark:bg-gray-800 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Chat with Gemini</h2>
                    <button 
                        onClick={clearConversation}
                        className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                        aria-label="Clear conversation"
                    >
                        Clear Chat
                    </button>
                </div>
                {/* Message List */}
                <div 
                    ref={messagesContainerRef}
                    className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-700"
                >
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 dark:text-gray-400 text-center">
                                Send a message to start a conversation with Gemini AI
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-lg shadow max-w-[80%] ${
                                        msg.sender === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                                    }`}>
                                        {msg.image && msg.sender === 'user' && (
                                            <img src={msg.image} alt="User input frame" className="max-w-[150px] h-auto rounded mb-2 border"/>
                                        )}
                                        {/* Render text with line breaks */}
                                        {msg.text.split('\n').map((line, index) => (
                                            <span key={index}>
                                                {line}
                                                {index < msg.text.split('\n').length - 1 && <br />}
                                            </span>
                                        ))}
                                        {/* Loading indicator for the bot message being generated */}
                                        {msg.sender === 'bot' && isLoading && msg.id === currentBotMessageIdRef.current && (
                                            <span className="inline-block w-2 h-2 ml-1 bg-current rounded-full animate-pulse"></span>
                                        )}
                                        
                                        {/* Speech button for bot messages */}
                                        {msg.sender === 'bot' && msg.text !== '...' && msg.text.length > 0 && (
                                            <button 
                                                onClick={() => speakText(msg.text)}
                                                className="ml-2 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 inline-flex items-center justify-center"
                                                title="Speak this message"
                                            >
                                                <LucideVolume2 size={16} />
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
                <div className="p-4 border-t bg-gray-100 dark:bg-gray-800">
                    {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isCapturingVideo ? "Type message (frame will be sent)..." : "Type your message..."}
                            className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                            disabled={isLoading || isRecording}
                        />
                        
                        {/* Voice Recording Button */}
                        <button
                            onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
                            disabled={isLoading}
                            className={`p-2 rounded-lg ${
                                isRecording 
                                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500'
                            } text-gray-800 dark:text-gray-200`}
                            title={isRecording ? "Stop recording" : "Start voice input"}
                        >
                            {isRecording ? <LucideSquare size={20} /> : <LucideMic size={20} />}
                        </button>
                        
                        {/* Send Button */}
                        <button
                            onClick={() => sendMessage()}
                            disabled={isLoading || (!inputText.trim() && !latestFrame && !isRecording)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                    
                    {/* Speech Indicators */}
                    {isSpeaking && (
                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                Speaking...
                            </p>
                            <button
                                onClick={stopSpeaking}
                                className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                            >
                                Stop
                            </button>
                        </div>
                    )}
                    
                    {isRecording && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                            Recording... Click the mic button again to stop and send
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatInterface; 