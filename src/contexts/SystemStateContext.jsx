import React, { createContext, useContext, useMemo } from 'react';
import { useDrackerState } from '../hooks/useDrackerState';

const SystemStateContext = createContext();

export const useSystemState = () => {
    const context = useContext(SystemStateContext);
    if (!context) {
        throw new Error('useSystemState must be used within a SystemProvider');
    }
    return context;
};

export const SystemProvider = ({ children }) => {
    const drackerState = useDrackerState();

    const value = useMemo(() => ({
        ...drackerState, // Spread for direct access (e.g. { determineArchetype } = useSystemState())
        drackerState // Keep for nested access (e.g. { drackerState } = useSystemState())
    }), [drackerState]);

    return (
        <SystemStateContext.Provider value={value}>
            {children}
        </SystemStateContext.Provider>
    );
};
