import React from 'react';
import {
    Brain,
    Volume2,
    Pause,
    Settings,
    CheckCircle,
    AlertCircle,
    Loader2,
    SlidersHorizontal
} from 'lucide-react';

import { theme } from '../styles/theme';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

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
    setShowSettings,
    openVoiceSettings,
    onBackup,
    onRestore
}) => {
    return (
        <header className={theme.layout.header}>
            <div className={theme.layout.headerContainer}>
                <div className="flex items-center gap-2 text-brown-900">
                    <img src="/dracker.png" alt="Drácker Logo" className="w-10 h-10 object-contain hover:scale-110 transition-transform" />
                    <h1 className="text-xl font-bold tracking-tight">Dracker AdaptAI</h1>

                    {apiKeyStatus === 'valid' && (
                        <Badge variant="success">
                            <CheckCircle className="w-3 h-3" /> API OK
                        </Badge>
                    )}
                    {apiKeyStatus === 'validating' && (
                        <Badge variant="warning">
                            <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                        </Badge>
                    )}
                    {apiKeyStatus === 'invalid' && (
                        <Badge variant="error">
                            <AlertCircle className="w-3 h-3" /> Chave Inválida
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="icon"
                        onClick={openVoiceSettings}
                        title="Configurar Voz do Narrador"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </Button>


                    <Button
                        onClick={handleSpeak}
                        disabled={isGeneratingAudio}
                        variant={isSpeaking ? "danger" : "icon"}
                        className={isSpeaking ? '' : 'text-brown-800'}
                        title={isSpeaking && !isPaused ? 'Pausar narração' : isPaused ? 'Retomar narração' : 'Ouvir narração'}
                    >
                        {isSpeaking && !isPaused ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={speakPrev} disabled={!speechChunks.length || chunkIndex === 0}>Anterior</Button>
                        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={speakNext} disabled={!speechChunks.length || chunkIndex >= speechChunks.length - 1}>Próximo</Button>
                        {speechChunks.length > 0 && (
                            <span className="text-xs px-2 py-1 rounded bg-brown-50 text-brown-700 hidden sm:inline font-mono border border-brown-100">{chunkIndex + 1}/{speechChunks.length}</span>
                        )}
                    </div>
                    {isGeneratingAudio ? (
                        <div className="flex items-center gap-2 px-2 py-1 bg-brown-50 rounded-lg hidden sm:flex border border-brown-100">
                            <Loader2 className="w-3 h-3 animate-spin text-brown-600" />
                            <span className="text-xs text-brown-700 font-medium">Gerando áudio...</span>
                        </div>
                    ) : (
                        <span className="text-xs px-2 py-1 rounded-lg bg-brown-50 text-brown-700 hidden sm:inline border border-brown-100">
                            {isSpeaking ? (isPaused ? 'Pausado' : 'Tocando') : 'Parado'}
                        </span>
                    )}
                    <div className="flex items-center gap-2 border-l pl-2 ml-2 border-brown-200">
                        <Button
                            onClick={onBackup}
                            variant="secondary"
                            className="px-3 py-1.5 text-xs font-bold"
                            title="Fazer backup de tudo"
                        >
                            Backup
                        </Button>
                        <label className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm ${theme.button.primary}`}>
                            Restaurar
                            <input type="file" accept=".json" onChange={onRestore} className="hidden" />
                        </label>
                    </div>
                    <Button variant="icon" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
};
