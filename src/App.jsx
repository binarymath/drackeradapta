import React from 'react';
import { GeminiProvider } from './contexts/GeminiContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { AudioProvider } from './contexts/AudioContext';
import { SystemProvider } from './contexts/SystemStateContext';
import { MainLayout } from './MainLayout';

export default function App() {
  return (
    <GeminiProvider>
      <AudioProvider>
        <SystemProvider>
          <ActivityProvider>
            <MainLayout />
          </ActivityProvider>
        </SystemProvider>
      </AudioProvider>
    </GeminiProvider>
  );
}
