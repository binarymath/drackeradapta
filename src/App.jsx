import React from 'react';
import { GeminiProvider } from './contexts/GeminiContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { AudioProvider } from './contexts/AudioContext';
import { MainLayout } from './MainLayout';

export default function App() {
  return (
    <GeminiProvider>
      <AudioProvider>
        <ActivityProvider>
          <MainLayout />
        </ActivityProvider>
      </AudioProvider>
    </GeminiProvider>
  );
}
