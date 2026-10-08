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
    FolderTree,
    LayoutGrid
} from 'lucide-react';


import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useProject } from '../contexts/ActivityContext';

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
    openAudioRecorder,
    onOpenDashboard,
    hideAtividadesButton
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { projectId, projectName } = useProject();

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

        </div >
    );

    return (
        <header className={`sticky top-4 z-50 no-print ${className || ''}`}>
            <div className={`mx-4 md:mx-6 pr-4 md:pr-6 px-4 min-h-[4rem] h-auto flex flex-col md:flex-row md:items-center justify-between bg-white/90 backdrop-blur-md shadow-md border-2 border-slate-100 rounded-[2rem] py-2 md:py-0`}>

                {/* Left Side: Logo */}
                <div className="flex items-center justify-between w-full md:w-auto">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 text-brown-900">
                        <img src="/dracker_character.png" alt="Drácker Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-md hover:scale-110 transition-transform duration-300" />
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-none font-handwritten">Dracker AdaptAI</h1>
                            {/* API Status Badge - Mobile Compact */}
                            <button 
                                onClick={() => setShowSettings(true)}
                                className="flex md:hidden mt-1 cursor-pointer active:scale-95 transition-transform"
                                title="Configurar Chave API"
                            >
                                {apiKeyStatus === 'valid' && <span className="text-[10px] font-bold text-green-700 bg-green-100/50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-200"><CheckCircle className="w-3 h-3" /> API OK</span>}
                                {apiKeyStatus === 'validating' && <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100/50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-yellow-200"><Loader2 className="w-3 h-3 animate-spin" /> Verificando...</span>}
                                {apiKeyStatus === 'invalid' && <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-200 shadow-sm animate-pulse"><AlertCircle className="w-3 h-3" /> Inserir API</span>}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle Button */}
                    <button
                        className="md:hidden p-2 text-brown-600 hover:bg-brown-50 rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>

                {/* Right Side: Desktop Controls & Action Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="mr-2 hidden lg:flex items-center group relative cursor-pointer"
                        title="Configurar Chave API"
                    >
                        {apiKeyStatus === 'valid' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100/40 border border-green-200/80 text-green-700 text-xs font-bold transition-all group-hover:bg-green-100 group-hover:border-green-300 group-hover:shadow-sm group-hover:text-green-800">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span className="group-hover:hidden transition-all">API OK</span>
                                <span className="hidden group-hover:inline transition-all">Trocar API</span>
                            </div>
                        )}
                        {apiKeyStatus === 'validating' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100/50 border border-yellow-200 text-yellow-700 text-xs font-bold">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Verificando...</span>
                            </div>
                        )}
                        {apiKeyStatus === 'invalid' && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 border border-red-200 text-red-700 text-xs font-bold shadow-sm animate-pulse group-hover:animate-none group-hover:bg-red-200 group-hover:shadow transition-all group-hover:-translate-y-0.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Inserir Chave API</span>
                            </div>
                        )}
                    </button>
                    
                    <AudioControls />
                    <SystemControls />

                    <div className="w-px h-8 bg-brown-200 mx-1"></div>

                    <Button
                        onClick={() => onOpenBackupCenter ? onOpenBackupCenter('timeline') : onBackup()}
                        variant="ghost"
                        className="group flex items-center px-4 py-2.5 rounded-[1.25rem] text-sm font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 border-b-[3px] border-indigo-800 hover:-translate-y-0.5 hover:shadow-lg transition-all active:translate-y-0 active:border-b-0 whitespace-nowrap flex-shrink-0"
                        title="Gerenciador de Workspace e Histórico"
                    >
                        <FolderTree className="w-4 h-4 mr-2 text-indigo-200 group-hover:text-white transition-all duration-500" /> 
                        <span>Workspace</span>
                    </Button>

                    {!hideAtividadesButton && (
                        <button
                            onClick={onOpenDashboard}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[1.25rem] bg-brown-900 hover:bg-brown-950 text-white text-sm font-extrabold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all border border-brown-800 shrink-0 group"
                            title="Ver Minhas Atividades"
                        >
                            <LayoutGrid className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
                            <span className="tracking-wide">Minhas Atividades</span>
                        </button>
                    )}
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
