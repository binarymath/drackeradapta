import React from 'react';
import {
    Brain,
    Volume2,
    Pause,
    Settings,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';

export const Header = ({
    apiKeyStatus,
    handleSpeak,
    isGeneratingAudio,
    isSpeaking,
    isPaused,
    speakPrev,
    speakNext,
    speechChunks,
    chunkIndex,
    showSettings,
    setShowSettings
}) => {
    return (
        <header className="bg-white shadow border-b border-slate-200 sticky top-0 z-20 no-print">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700">
                    <Brain className="w-8 h-8" />
                    <h1 className="text-xl font-bold">AdaptAI</h1>

                    {apiKeyStatus === 'valid' && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> API OK
                        </span>
                    )}
                    {apiKeyStatus === 'validating' && (
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                        </span>
                    )}
                    {apiKeyStatus === 'invalid' && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Chave Inválida
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSpeak}
                        disabled={isGeneratingAudio}
                        className={`p-2 rounded ${isSpeaking ? 'bg-red-100 hover:bg-red-200' : 'bg-slate-100 hover:bg-slate-200'}`}
                        title={isSpeaking && !isPaused ? 'Pausar narração' : isPaused ? 'Retomar narração' : 'Ouvir narração'}
                    >
                        {isSpeaking && !isPaused ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <div className="flex items-center gap-1">
                        <button onClick={speakPrev} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200" disabled={!speechChunks.length || chunkIndex === 0}>Anterior</button>
                        <button onClick={speakNext} className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200" disabled={!speechChunks.length || chunkIndex >= speechChunks.length - 1}>Próximo</button>
                        {speechChunks.length > 0 && (
                            <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hidden sm:inline">{chunkIndex + 1}/{speechChunks.length}</span>
                        )}
                    </div>
                    {isGeneratingAudio ? (
                        <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded hidden sm:flex">
                            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                            <span className="text-xs text-blue-700 font-medium">Gerando áudio...</span>
                        </div>
                    ) : (
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hidden sm:inline">
                            {isSpeaking ? (isPaused ? 'Pausado' : 'Tocando') : 'Parado'}
                        </span>
                    )}
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-slate-100 rounded">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
};
