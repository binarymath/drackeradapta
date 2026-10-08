import React from 'react';
import { GeminiProvider } from './contexts/GeminiContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { AudioProvider } from './contexts/AudioContext';

import { MainLayout } from './MainLayout';
import { ToastHost } from './components/ui/Toast';
import { ConfirmHost } from './components/ui/ConfirmDialog';

export default function App() {
  return (
    <GeminiProvider>
      <AudioProvider>
        <ActivityProvider>
          <MainLayout />
          <ToastHost />
          <ConfirmHost />
        </ActivityProvider>
      </AudioProvider>
    </GeminiProvider>
  );
}
