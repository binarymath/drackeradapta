import React, { createContext, useContext, useState } from 'react';
import { useAudioNarration } from '../hooks/useAudioNarration';
import { useGemini } from './GeminiContext';

const AudioContext = createContext();

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};

export const AudioProvider = ({ children }) => {
    const { geminiService } = useGemini();

    const [showVoiceSettings, setShowVoiceSettings] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);

    // We use the existing hook, forcing it to use the service from context
    const audio = useAudioNarration(geminiService);

    return (
        <AudioContext.Provider value={{
            ...audio,
            showVoiceSettings,
            setShowVoiceSettings,
            showAudioRecorder,
            setShowAudioRecorder
        }}>
            {children}
        </AudioContext.Provider>
    );
};
