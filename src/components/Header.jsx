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
            <div className="mx-2 sm:mx-4 md:mx-6 px-3 sm:px-4 md:px-6 min-h-[4rem] h-auto flex flex-col md:flex-row md:items-center justify-between bg-white/95 backdrop-blur-md shadow-md border-2 border-slate-100 rounded-[2rem] py-2 md:py-0 gap-2">

                {/* Left Side: Logo & Mobile API Status */}
                <div className="flex items-center justify-between w-full md:w-auto gap-2 sm:gap-3">
                    {/* Logo Section */}
                    <div className="flex items-center gap-2.5 sm:gap-3 text-brown-900 min-w-0">
                        <img src="/dracker_character.png" alt="Drácker Logo" className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain drop-shadow-md hover:scale-110 transition-transform duration-300 shrink-0" />
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight leading-none font-handwritten truncate">Dracker AdaptAI</h1>
                            {/* API Status Badge - Mobile Compact */}
                            <div className="flex md:hidden mt-0.5">
                                {apiKeyStatus === 'valid' ? (
                                    <button 
                                        onClick={() => setShowSettings(true)}
                                        className="text-[10px] font-bold text-green-700 bg-green-100/70 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-300 cursor-pointer"
                                        title="Chave de API Gemini configurada"
                                    >
                                        <CheckCircle className="w-3 h-3 text-green-600" /> API OK
                                    </button>
                                ) : apiKeyStatus === 'validating' ? (
                                    <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100/70 px-2 py-0.5 rounded-full flex items-center gap-1 border border-yellow-300">
                                        <Loader2 className="w-3 h-3 animate-spin text-yellow-600" /> Verificando...
                                    </span>
                                ) : (
                                    <button 
                                        onClick={() => setShowSettings(true)}
                                        className="text-[10px] font-black text-white bg-gradient-to-r from-rose-600 to-amber-600 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse border border-rose-700 cursor-pointer active:scale-95 transition-transform"
                                        title="Clique para inserir sua Chave API Gemini"
                                    >
                                        <Key className="w-3 h-3 text-amber-200" /> Inserir Chave API
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Em telas menores/tablet portrait: Ação direta de Inserir API ao lado do Menu */}
                    <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
                        {(!apiKeyStatus || apiKeyStatus === 'empty' || apiKeyStatus === 'invalid') && (
                            <button 
                                onClick={() => setShowSettings(true)}
                                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-black text-xs shadow-md shadow-rose-500/30 animate-pulse active:scale-95 transition-all border border-rose-600 cursor-pointer"
                                title="Inserir Chave de API Gemini"
                            >
                                <Key className="w-3.5 h-3.5 text-amber-200" />
                                <span>Inserir API</span>
                            </button>
                        )}
                        <button
                            className="p-2 text-brown-600 hover:bg-brown-50 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
                        </button>
                    </div>
                </div>

                {/* Right Side: Desktop & Tablet Controls & Action Buttons */}
                <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-wrap justify-end">
                    {/* Botão de API Key em Destaque */}
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="mr-1 flex items-center group relative cursor-pointer"
                        title="Configurar Chave API Gemini"
                    >
                        {apiKeyStatus === 'valid' ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100/50 border border-green-300 text-green-800 text-xs font-bold transition-all group-hover:bg-green-100 group-hover:border-green-400 group-hover:shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                <span className="group-hover:hidden transition-all">API OK</span>
                                <span className="hidden group-hover:inline transition-all">Trocar API</span>
                            </div>
                        ) : apiKeyStatus === 'validating' ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100/80 border border-yellow-300 text-yellow-800 text-xs font-bold shadow-xs">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-600" />
                                <span>Verificando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white border-2 border-rose-400 text-xs sm:text-sm font-black shadow-lg shadow-rose-500/30 animate-pulse group-hover:animate-none group-hover:brightness-110 group-hover:shadow-xl transition-all group-hover:-translate-y-0.5">
                                <Key className="w-4 h-4 text-amber-200" />
                                <span className="tracking-wide">Inserir Chave de API</span>
                            </div>
                        )}
                    </button>
                    
                    <AudioControls />
                    <SystemControls />

                    <div className="w-px h-8 bg-brown-200 mx-1"></div>

                    <Button
                        onClick={() => onOpenBackupCenter ? onOpenBackupCenter('timeline') : onBackup()}
                        variant="ghost"
                        className="group flex items-center px-3.5 lg:px-4 py-2.5 rounded-[1.25rem] text-xs lg:text-sm font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 border-b-[3px] border-indigo-800 hover:-translate-y-0.5 hover:shadow-lg transition-all active:translate-y-0 active:border-b-0 whitespace-nowrap flex-shrink-0"
                        title="Gerenciador de Workspace e Histórico"
                    >
                        <FolderTree className="w-4 h-4 mr-1.5 lg:mr-2 text-indigo-200 group-hover:text-white transition-all duration-500" /> 
                        <span>Workspace</span>
                    </Button>

                    {!hideAtividadesButton && (
                        <button
                            onClick={onOpenDashboard}
                            className="flex items-center justify-center gap-1.5 lg:gap-2 px-4 lg:px-5 py-2.5 rounded-[1.25rem] bg-brown-900 hover:bg-brown-950 text-white text-xs lg:text-sm font-extrabold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all border border-brown-800 shrink-0 group"
                            title="Ver Minhas Atividades"
                        >
                            <LayoutGrid className="w-4 h-4 lg:w-5 lg:h-5 text-amber-300 group-hover:scale-110 transition-transform" />
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

                            <Button 
                                variant="ghost" 
                                onClick={() => setShowSettings(!showSettings)} 
                                className={`flex-col h-auto py-2 gap-1 bg-white border shadow-sm hover:bg-brown-50 hover:border-brown-300 ${
                                    (!apiKeyStatus || apiKeyStatus === 'empty' || apiKeyStatus === 'invalid')
                                        ? 'text-rose-700 border-rose-300 bg-rose-50/70 animate-pulse'
                                        : 'text-brown-700 border-brown-100'
                                }`}
                            >
                                <Key className={`w-5 h-5 ${(!apiKeyStatus || apiKeyStatus === 'empty' || apiKeyStatus === 'invalid') ? 'text-rose-600' : 'text-amber-600'}`} />
                                <span className="text-[10px] font-black">
                                    {(!apiKeyStatus || apiKeyStatus === 'empty' || apiKeyStatus === 'invalid') ? 'Inserir API' : 'Config / API'}
                                </span>
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
