import React, { createContext, useContext, useMemo } from 'react';
import { useGeminiState } from '../hooks/useGeminiState';

const SystemStateContext = createContext();

export const useSystemState = () => {
    const context = useContext(SystemStateContext);
    if (!context) {
        throw new Error('useSystemState must be used within a SystemProvider');
    }
    return context;
};

export const SystemProvider = ({ children }) => {
    const geminiState = useGeminiState();

    const value = useMemo(() => ({
        ...geminiState, // Spread for direct access (e.g. { loading, error } = useSystemState())
        geminiState    // Keep for nested access if needed
    }), [geminiState]);

    return (
        <SystemStateContext.Provider value={value}>
            {children}
        </SystemStateContext.Provider>
    );
};
