import { useState, useRef, useCallback } from 'react';

const DEFAULT_SETTINGS = {
  voiceURI: '',
  rate: 1.1,
  pitch: 1.0
};

export function useAudioNarration(geminiService) {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechChunks, setSpeechChunks] = useState([]);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [speechSettings, setSpeechSettings] = useState(DEFAULT_SETTINGS);
  const utteranceRef = useRef(null);

  const resetAudioState = useCallback(() => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeechChunks([]);
    setChunkIndex(0);
    setIsSpeaking(false);
    setIsPaused(false);
    setIsGeneratingAudio(false);
  }, []);

  const generateAudio = useCallback((text) => {
    if (!text || !geminiService) return;
    setIsGeneratingAudio(true);
    const clean = geminiService.cleanTextForSpeech(text);
    const chunks = geminiService.sliceIntoChunks(clean, 300);
    setSpeechChunks(chunks);
    setChunkIndex(0);
    setIsGeneratingAudio(false);
  }, [geminiService]);

  const selectVoice = (voices) => {
    if (speechSettings.voiceURI) {
      return voices.find(v => v.voiceURI === speechSettings.voiceURI) || null;
    }
    const brVoices = voices.filter(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
    return brVoices.find(v =>
      v.name.includes('Google') ||
      v.name.includes('Francisca') ||
      v.name.includes('Luciana') ||
      v.name.toLowerCase().includes('female')
    ) || brVoices[0] || null;
  };

  const playChunk = useCallback((index) => {
    if (index < 0 || index >= speechChunks.length) return;

    window.speechSynthesis.cancel();
    const chunkText = speechChunks[index];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = 'pt-BR';

    const voices = window.speechSynthesis.getVoices();
    const chosenVoice = selectVoice(voices);
    if (chosenVoice) utterance.voice = chosenVoice;

    utterance.rate = speechSettings.rate;
    utterance.pitch = speechSettings.pitch;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setIsGeneratingAudio(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (index < speechChunks.length - 1) {
        setChunkIndex(index + 1);
        playChunk(index + 1);
      }
    };

    utterance.onerror = (e) => {
      console.error('Browser TTS Error', e);
      setIsGeneratingAudio(false);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [speechChunks, speechSettings.pitch, speechSettings.rate, speechSettings.voiceURI]);

  const handleSpeak = useCallback(() => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      playChunk(chunkIndex);
    }
  }, [chunkIndex, isPaused, isSpeaking, playChunk]);

  const speakNext = useCallback(() => {
    if (chunkIndex < speechChunks.length - 1) {
      setChunkIndex(prev => prev + 1);
      setIsSpeaking(false);
      setTimeout(() => playChunk(chunkIndex + 1), 100);
    }
  }, [chunkIndex, playChunk, speechChunks]);

  const speakPrev = useCallback(() => {
    if (chunkIndex > 0) {
      setChunkIndex(prev => prev - 1);
      setIsSpeaking(false);
      setTimeout(() => playChunk(chunkIndex - 1), 100);
    }
  }, [chunkIndex, playChunk]);

  return {
    isGeneratingAudio,
    isSpeaking,
    isPaused,
    speechChunks,
    chunkIndex,
    speechSettings,
    setSpeechSettings,
    generateAudio,
    handleSpeak,
    speakNext,
    speakPrev,
    resetAudioState
  };
}
