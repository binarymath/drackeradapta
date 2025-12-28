import React, { useState } from 'react';
import {
    Brain,
    Volume2,
    Pause,
    Settings,
    CheckCircle,
    AlertCircle,
    Loader2,
    SlidersHorizontal,
    Menu,
    X,
    Save,
    Upload
} from 'lucide-react';

import { theme } from '../styles/theme';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export const Header = ({
    className,
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const AudioControls = () => (
        <div className="flex items-center gap-2 bg-brown-50 rounded-lg p-1 border border-brown-100">
            <Button
                onClick={handleSpeak}
                disabled={isGeneratingAudio}
                variant={isSpeaking ? "danger" : "ghost"}
                className={`w-8 h-8 p-0 rounded-full ${isSpeaking ? '' : 'text-brown-800 hover:bg-brown-200'}`}
                title={isSpeaking && !isPaused ? 'Pausar narração' : isPaused ? 'Retomar narração' : 'Ouvir narração'}
            >
                {isSpeaking && !isPaused ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>

            <div className="flex items-center gap-0.5">
                <Button variant="ghost" className="w-8 h-8 p-0 rounded-full text-brown-600" onClick={speakPrev} disabled={!speechChunks.length || chunkIndex === 0}>
                    <span className="text-xs font-bold">{'<'}</span>
                </Button>
                <span className="text-xs font-mono text-brown-500 min-w-[3ch] text-center">
                    {speechChunks.length > 0 ? `${chunkIndex + 1}/${speechChunks.length}` : '-/-'}
                </span>
                <Button variant="ghost" className="w-8 h-8 p-0 rounded-full text-brown-600" onClick={speakNext} disabled={!speechChunks.length || chunkIndex >= speechChunks.length - 1}>
                    <span className="text-xs font-bold">{'>'}</span>
                </Button>
            </div>
        </div>
    );

    const SystemControls = ({ mobile = false }) => (
        <div className={`flex ${mobile ? 'flex-col items-stretch gap-3' : 'items-center gap-2'}`}>
            {/* Audio Settings Toggle */}
            <Button
                variant={mobile ? "secondary" : "icon"}
                onClick={openVoiceSettings}
                title="Configurar Voz do Narrador"
                className={mobile ? "justify-start" : ""}
            >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {mobile && "Configurar Voz"}
            </Button>

            {!mobile && <div className="h-6 w-px bg-brown-200 mx-1"></div>}

            {/* Backup / Restore */}
            <div className={`flex ${mobile ? 'flex-col gap-2' : 'items-center gap-2'}`}>
                <Button
                    onClick={onBackup}
                    variant="ghost"
                    className={`text-xs font-bold text-brown-700 ${mobile ? 'justify-start border border-brown-200 bg-white' : ''}`}
                    title="Fazer backup de tudo"
                >
                    <Save className="w-3 h-3 mr-2" /> Backup
                </Button>
                <label className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm ${theme.button.primary} ${mobile ? 'w-full' : ''}`}>
                    <Upload className="w-3 h-3 mr-2" /> Restaurar
                    <input type="file" accept=".json" onChange={onRestore} className="hidden" />
                </label>
            </div>

            {!mobile && <div className="h-6 w-px bg-brown-200 mx-1"></div>}

            <Button
                variant={mobile ? "secondary" : "icon"}
                onClick={() => setShowSettings(!showSettings)}
                className={mobile ? "justify-start" : ""}
            >
                <Settings className="w-5 h-5 mr-2" />
                {mobile ? "Configurações da API" : ""}
            </Button>
        </div>
    );

    return (
        <header className={`${theme.layout.header} ${className || ''} relative z-50`}>
            <div className={`${theme.layout.headerContainer} flex-col md:flex-row md:items-center`}>

                {/* Top Bar: Logo + Mobile Toggle */}
                <div className="flex items-center justify-between w-full md:w-auto">
                    <div className="flex items-center gap-3 text-brown-900">
                        <img src="/dracker.png" alt="Drácker Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                        <div>
                            <h1 className="text-lg md:text-xl font-bold tracking-tight leading-none">Dracker AdaptAI</h1>
                            {/* API Status Badge - Visible on Mobile too, but smaller */}
                            <div className="flex md:hidden mt-0.5">
                                {apiKeyStatus === 'valid' && <span className="text-[10px] text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Online</span>}
                                {apiKeyStatus === 'validating' && <span className="text-[10px] text-yellow-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> ...</span>}
                                {apiKeyStatus === 'invalid' && <span className="text-[10px] text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Off</span>}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-brown-700 hover:bg-brown-100 rounded-lg transition-colors"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Desktop Controls (Hidden on Mobile) */}
                <div className="hidden md:flex items-center gap-4 ml-auto">
                    {/* Desktop API Status */}
                    <div className="mr-2">
                        {apiKeyStatus === 'valid' && <Badge variant="success"><CheckCircle className="w-3 h-3" /> API OK</Badge>}
                        {apiKeyStatus === 'validating' && <Badge variant="warning"><Loader2 className="w-3 h-3 animate-spin" /> Verificando...</Badge>}
                        {apiKeyStatus === 'invalid' && <Badge variant="error"><AlertCircle className="w-3 h-3" /> Chave Inválida</Badge>}
                    </div>

                    <AudioControls />
                    <SystemControls />
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden w-full pt-4 pb-2 border-t border-brown-100 mt-3 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex justify-center">
                            <AudioControls />
                        </div>
                        <div className="bg-brown-50/50 p-3 rounded-xl border border-brown-100">
                            <SystemControls mobile={true} />
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};
