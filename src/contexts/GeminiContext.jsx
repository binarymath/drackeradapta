import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createGeminiService } from '../services/geminiService';
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from '../utils/storage';

const GeminiContext = createContext();

export const useGemini = () => {
    const context = useContext(GeminiContext);
    if (!context) {
        throw new Error('useGemini must be used within a GeminiProvider');
    }
    return context;
};

export const GeminiProvider = ({ children }) => {
    const [apiKey, setApiKey] = useState(() => safeLocalStorageGet('gemini_api_key') || '');
    const [apiKeyStatus, setApiKeyStatus] = useState('empty');
    const [systemStatus, setSystemStatus] = useState(null);

    // Model selection state
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

    // Settings UI
    const [showSettings, setShowSettings] = useState(() => !safeLocalStorageGet('gemini_api_key'));


    const modelOptions = useMemo(() => [
        { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    ], []);

    // Create Service Instance
    const geminiService = useMemo(() => {
        if (!apiKey) return null;
        return createGeminiService(apiKey, (status) => {
            if (status.type === 'success') {
                setSystemStatus(null);
                return;
            }
            setSystemStatus(status);
            if (status.type === 'error') {
                setTimeout(() => setSystemStatus(null), 5000);
            }
        });
    }, [apiKey]);

    // Validate API Key
    useEffect(() => {
        if (!apiKey) {
            setApiKeyStatus('empty');
            return;
        }
        if (apiKey.length < 10) {
            setApiKeyStatus('invalid');
            return;
        }

        const validate = async () => {
            setApiKeyStatus('validating');
            if (geminiService) {
                const isValid = await geminiService.validateApiKey();
                setApiKeyStatus(isValid ? 'valid' : 'invalid');
                if (isValid) {
                    safeLocalStorageSet('gemini_api_key', apiKey);
                }
            }
        };

        const timer = setTimeout(validate, 800);
        return () => clearTimeout(timer);
    }, [apiKey, geminiService]);

    const handleApiKeyChange = (e) => setApiKey(e.target.value);

    const clearApiKey = () => {
        setApiKey('');
        safeLocalStorageRemove('gemini_api_key');
        setApiKeyStatus('empty');
        setShowSettings(true);
    };

    return (
        <GeminiContext.Provider value={{
            apiKey,
            setApiKey,
            apiKeyStatus,
            handleApiKeyChange,
            clearApiKey,
            geminiService,
            systemStatus,
            setSystemStatus,
            selectedModel,
            setSelectedModel,
            modelOptions,
            showSettings,
            setShowSettings
        }}>
            {children}
        </GeminiContext.Provider>
    );
};
