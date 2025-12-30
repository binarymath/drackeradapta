import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Download, X, Minus, Maximize2, RotateCcw } from 'lucide-react';
import { theme } from '../styles/theme';
import { Button } from './ui/Button';

// Using a fixed position discrete widget approach
export const AudioRecorderModal = ({ isOpen, onClose }) => {
    // --- STATE ---
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false); // For playback
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isMinimized, setIsMinimized] = useState(false);

    // Dragging State
    const [position, setPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 200 }); // Initial position bottom-right approx
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // --- REFS ---
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const timerIntervalRef = useRef(null);
    const audioPlayerRef = useRef(null);

    // --- EFFECTS ---
    useEffect(() => {
        if (isOpen) {
            // Set initial position if off-screen or first open
            if (position.x > window.innerWidth || position.y > window.innerHeight) {
                setPosition({ x: window.innerWidth - 300, y: window.innerHeight - 300 });
            }

            // Reset state when opening clean
            if (!isRecording && !audioBlob) {
                setDuration(0);
            }
        } else {
            // Cleanup on close
            stopRecordingContext();
        }
        return () => stopRecordingContext();
    }, [isOpen, position]);

    // Timer Logic
    useEffect(() => {
        if (isRecording) {
            timerIntervalRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerIntervalRef.current);
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [isRecording]);

    // Dragging Logic
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                e.preventDefault(); // Prevent text selection
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        // Calculate offset from the top-left corner of the modal
        const rect = e.currentTarget.getBoundingClientRect();
        // We use the parent (modal) rect, but event is on header. 
        // Need to be careful. Let's just track offset from mouse to current position.
        // Actually, simpler: offset = mouse - currentPosition
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };


    // --- RECORDING FUNCTIONS ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop());
                stopVisualizer();
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setAudioBlob(null);
            setAudioUrl(null);
            setDuration(0);

            initVisualizer(stream);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Erro ao acessar microfone. Verifique as permissões.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerIntervalRef.current);
        }
    };

    const stopRecordingContext = () => {
        stopRecording();
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        stopVisualizer();
    };

    // --- AUDIO PLAYER ---
    const togglePlayback = () => {
        if (!audioPlayerRef.current) return;
        if (audioPlayerRef.current.paused) {
            audioPlayerRef.current.play();
            setIsPaused(false);
        } else {
            audioPlayerRef.current.pause();
            setIsPaused(true);
        }
    };

    // --- VISUALIZER ---
    const initVisualizer = (stream) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        analyserRef.current = audioContextRef.current.createAnalyser();
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);

        analyserRef.current.fftSize = 256;
        drawVisualizer();
    };

    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Brown Theme Colors
            // Background is transparent/white, bars should be visible
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2; // Scale down

                // Gradient Brown/Amber
                const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
                gradient.addColorStop(0, '#d97706'); // Amber 600
                gradient.addColorStop(1, '#78350f'); // Brown 900

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };
        draw();
    };

    const stopVisualizer = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    // --- UTILS ---
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    // --- RENDER ---
    if (!isOpen) return null;

    return (
        <div
            className={`fixed z-50 transition-shadow duration-300 drop-shadow-2xl ${isMinimized ? 'w-auto' : 'w-72'}`}
            style={{
                left: position.x,
                top: position.y,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            <div className="bg-white rounded-2xl border border-brown-200 overflow-hidden shadow-lg flex flex-col">

                {/* Header / Drag Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    className={`flex items-center justify-between bg-brown-50 p-2 border-b border-brown-100 cursor-grab active:cursor-grabbing select-none ${isRecording ? 'animate-pulse-slow bg-red-50' : ''}`}
                >
                    <div className="flex items-center gap-2 pointer-events-none">
                        <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-brown-400'}`}></div>
                        <span className="text-xs font-bold text-brown-800 uppercase tracking-wide">
                            {isRecording ? 'Gravando...' : 'Gravador'}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-brown-200 rounded text-brown-600">
                            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <button onClick={onClose} className="p-1 hover:bg-red-100 rounded text-brown-600 hover:text-red-500">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {!isMinimized && (
                    <div className="p-3 bg-white flex flex-col gap-3">

                        {/* Visualizer / Timer Display */}
                        <div className="relative h-20 bg-brown-50 rounded-lg border border-brown-100 overflow-hidden flex items-center justify-center">
                            {isRecording ? (
                                <canvas ref={canvasRef} width={250} height={80} className="absolute inset-0 w-full h-full z-10" />
                            ) : audioUrl ? (
                                <div className="text-center z-20 w-full px-4">
                                    <audio ref={audioPlayerRef} src={audioUrl} onEnded={() => setIsPaused(true)} className="hidden" />
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <div className="h-6 w-1 bg-brown-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                        <div className="h-10 w-1 bg-brown-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="h-6 w-1 bg-brown-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span className="text-[10px] text-brown-500 block">Áudio pronto</span>
                                </div>
                            ) : (
                                <div className="text-brown-300 text-[10px]">Pressione para gravar</div>
                            )}

                            {/* Timer Overlay */}
                            <div className="absolute bottom-1 right-2 z-30">
                                <span className="font-mono text-xl font-bold text-brown-800 tabular-nums drop-shadow-sm">
                                    {formatTime(duration)}
                                </span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                            {!audioUrl ? (
                                isRecording ? (
                                    <Button onClick={stopRecording} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 shadow-lg text-white p-0 flex items-center justify-center">
                                        <Square className="w-4 h-4 fill-current" />
                                    </Button>
                                ) : (
                                    <Button onClick={startRecording} className="w-10 h-10 rounded-full bg-brown-600 hover:bg-brown-700 shadow-lg text-white p-0 flex items-center justify-center group">
                                        <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </Button>
                                )
                            ) : (
                                <>
                                    <Button onClick={() => { setAudioUrl(null); setAudioBlob(null); setDuration(0); }} variant="ghost" className="text-gray-400 hover:text-brown-600 p-1" title="Nova Gravação (Descartar atual)">
                                        <RotateCcw className="w-4 h-4" />
                                    </Button>

                                    <Button onClick={togglePlayback} className="w-10 h-10 rounded-full bg-brown-600 hover:bg-brown-700 text-white p-0 flex items-center justify-center">
                                        {isPaused || (audioPlayerRef.current?.paused) ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
                                    </Button>

                                    <a href={audioUrl} download={`gravacao-${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`} className={`${theme.button.icon} text-green-600 hover:bg-green-50 p-1`} title="Baixar">
                                        <Download className="w-4 h-4" />
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
