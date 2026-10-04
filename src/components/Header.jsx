import React, { useState } from 'react';
import {
    Brain,
    Volume2,
    Mic,
    Pause,
    Key,
    CheckCircle,
    AlertCircle,
    Loader2,
    SlidersHorizontal,
    Save,
    Upload,
    History,
    Menu,
    X,
    FolderTree
} from 'lucide-react';

import { theme } from '../styles/theme';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useActivity } from '../contexts/ActivityContext';

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
    onRestore,
    onOpenBackupCenter,
    openAudioRecorder
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { projectId, projectName } = useActivity();

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
                {/* Voice Recorder Trigger */}
                <div className="h-6 w-px bg-brown-200 mx-1"></div>
                <Button
                    onClick={openAudioRecorder}
                    variant="ghost"
                    className="w-8 h-8 p-0 rounded-full text-brown-600 hover:bg-brown-200 hover:text-brown-900"
                    title="Gravador de Voz"
                >
                    <Mic className="w-4 h-4" />
                </Button>

            </div>
        </div>
    );

    const SystemControls = () => (
        <div className="flex items-center gap-2">
            {/* Audio Settings Toggle */}
            <Button
                variant="icon"
                onClick={openVoiceSettings}
                title="Configurar Voz do Narrador"
            >
                <SlidersHorizontal className="w-4 h-4" />
            </Button>

            <div className="h-6 w-px bg-brown-200 mx-1"></div>

            {/* Central de Versões Única */}
            <Button
                onClick={() => onOpenBackupCenter ? onOpenBackupCenter('timeline') : onBackup()}
                variant="ghost"
                className="group flex items-center h-[36px] px-3 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 border-b-[3px] border-indigo-800 hover:-translate-y-0.5 hover:shadow-lg transition-all active:translate-y-0 active:border-b-0 ml-1.5 lg:ml-2 whitespace-nowrap flex-shrink-0"
                title="Gerenciador de Workspace e Histórico"
            >
                <FolderTree className="w-3.5 h-3.5 mr-1.5 text-indigo-200 group-hover:text-white transition-all duration-500" /> 
                <span>Gerenciador de Workspace</span>
            </Button>

            <div className="h-6 w-px bg-brown-200 mx-1"></div>

            <Button
                variant="icon"
                onClick={() => setShowSettings(!showSettings)}
            >
                <Key className="w-5 h-5 text-amber-600" />
            </Button>
        </div >
    );

    return (
        <header className={`${theme.layout.header} ${className || ''} relative z-50`}>
            {/* Remove h-16 constraint for mobile layout */}
            <div className={`${theme.layout.headerContainer.replace('h-16', 'min-h-[4rem] h-auto')} flex-col md:flex-row md:items-center py-2 md:py-0`}>

                {/* Top Row: Logo & Desktop Controls */}
                <div className="flex items-center justify-between w-full md:w-auto">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 text-brown-900">
                        <img src="/dracker_character.png" alt="Drácker Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-md hover:scale-110 transition-transform duration-300" />
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-none font-handwritten">Dracker AdaptAI</h1>
                            {/* API Status Badge - Mobile Compact */}
                            <div className="flex md:hidden mt-0.5">
                                {apiKeyStatus === 'valid' && <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> API OK</span>}
                                {apiKeyStatus === 'validating' && <span className="text-[10px] font-bold text-yellow-600 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> ...</span>}
                                {apiKeyStatus === 'invalid' && <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Off</span>}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle Button */}
                    <button
                        className="md:hidden p-2 text-brown-600 hover:bg-brown-50 rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>

                    {/* Desktop Controls */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="mr-2">
                            {apiKeyStatus === 'valid' && <Badge variant="success"><CheckCircle className="w-3 h-3" /> API OK</Badge>}
                            {apiKeyStatus === 'validating' && <Badge variant="warning"><Loader2 className="w-3 h-3 animate-spin" /> Verificando...</Badge>}
                            {apiKeyStatus === 'invalid' && <Badge variant="error"><AlertCircle className="w-3 h-3" /> Chave Inválida</Badge>}
                        </div>
                        <AudioControls />
                        <SystemControls />
                    </div>
                </div>

                {/* Mobile Toolbar (Collapsible Hamburger) */}
                {isMenuOpen && (
                    <div className="md:hidden w-full mt-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-300">

                        {/* Audio Player Row */}
                        <div className="flex justify-center bg-brown-50/50 p-2 rounded-2xl border border-brown-100 shadow-inner">
                            <AudioControls />
                        </div>

                        {/* Quick Actions Grid - Friendly & Intuitive */}
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant="ghost" onClick={openVoiceSettings} className="flex-col h-auto py-2 gap-1 text-brown-700 bg-white border border-brown-100 shadow-sm hover:bg-brown-50 hover:border-brown-300">
                                <SlidersHorizontal className="w-5 h-5" />
                                <span className="text-[10px] font-bold">Voz</span>
                            </Button>

                            <Button variant="ghost" onClick={() => setShowSettings(!showSettings)} className="flex-col h-auto py-2 gap-1 text-brown-700 bg-white border border-brown-100 shadow-sm hover:bg-brown-50 hover:border-brown-300">
                                <Key className="w-5 h-5 text-amber-600" />
                                <span className="text-[10px] font-bold">Config</span>
                            </Button>

                            <Button variant="ghost" onClick={() => onOpenBackupCenter ? onOpenBackupCenter('timeline') : onBackup()} className="flex-col h-auto py-2 gap-1 text-brown-700 bg-white border border-brown-100 shadow-sm hover:bg-brown-50 hover:border-brown-300">
                                <FolderTree className="w-5 h-5 text-indigo-600" />
                                <span className="text-[10px] font-bold">Workspace</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};
