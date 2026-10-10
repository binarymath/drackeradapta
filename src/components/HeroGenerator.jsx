import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Play, Music, Key } from 'lucide-react';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { useGemini } from '../contexts/GeminiContext';

export const HeroGenerator = ({
    topic,
    setTopic,
    lessonDetails,
    setLessonDetails,
    difficulty,
    setDifficulty,
    difficultyOptions,
    activityType,
    setActivityType,
    activityOptions,
    handleGenerate,
    isLoading,
    systemStatus,
    error,
    navLinks,
    selectActivityTab
}) => {
    const { apiKeyStatus, setShowSettings } = useGemini();
    // Foco principal: Barra de Busca Gigante
    return (
        <div className="flex flex-col items-center justify-center w-full h-full max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
            {/* Título Hero */}
            <div className="text-center mb-6 md:mb-8 space-y-3">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight font-['Fredoka']">
                    O que vamos <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-amber-500">criar hoje?</span>
                </h1>
                <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto">
                    Digite o tema e deixe nossa IA gerar atividades gamificadas perfeitas para seus alunos em segundos.
                </p>
            </div>

            {/* Banner de Chave API se não configurada */}
            {(!apiKeyStatus || apiKeyStatus === 'empty' || apiKeyStatus === 'invalid') && (
                <div 
                    onClick={() => setShowSettings(true)}
                    className="w-full mb-6 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer shadow-lg shadow-rose-500/20 hover:brightness-105 transition-all animate-pulse border-2 border-rose-400"
                    title="Clique para configurar sua Chave de API Gemini"
                >
                    <div className="flex items-center gap-3 text-center sm:text-left">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black shrink-0 mx-auto sm:mx-0">
                            <Key className="w-5 h-5 text-amber-200" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-white">Chave de API Gemini Não Configurada</h4>
                            <p className="text-xs text-rose-100 font-medium">Insira sua chave do Google AI Studio para desbloquear a geração com IA.</p>
                        </div>
                    </div>
                    <span className="text-xs font-black bg-white text-rose-700 px-4 py-2 rounded-xl whitespace-nowrap shadow-sm hover:bg-rose-50 transition-colors shrink-0">
                        Configurar Chave API
                    </span>
                </div>
            )}

            {/* Caixa Mágica de Geração */}
            <div className="w-full bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-200/40 border border-slate-100/60 space-y-8 relative z-10">
                {/* Tema Principal */}
                <div className="relative">
                    <label className="block text-[11px] font-black text-indigo-400 mb-2 uppercase tracking-widest">Qual será o Tema Principal?</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ex: Sistema Solar, Frações, Revolução Francesa..."
                        className="w-full text-2xl md:text-4xl font-black text-slate-800 placeholder:text-slate-200 border-none focus:outline-none focus:ring-0 bg-transparent p-0"
                        autoFocus
                    />
                </div>
                
                <div className="w-full h-px bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* Coluna Esquerda: Contexto */}
                    <div className="flex flex-col h-full">
                        <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest">
                            Contexto Pedagógico (Opcional)
                        </label>
                        <TextArea
                            value={lessonDetails}
                            onChange={(e) => setLessonDetails(e.target.value)}
                            placeholder="Foco em planetas rochosos..."
                            className="text-sm bg-slate-50 border-slate-100 hover:border-slate-200 focus:bg-white min-h-[120px] rounded-2xl resize-none flex-1"
                        />
                    </div>

                    {/* Coluna Direita: Controles */}
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest">
                                Público-Alvo / Dificuldade
                            </label>
                            <div className="flex gap-2">
                                {difficultyOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setDifficulty(opt.id)}
                                        className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-2xl border-2 transition-all duration-300 ${
                                            difficulty === opt.id
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-widest">
                                Formato da Atividade
                            </label>
                            <select
                                value={activityType}
                                onChange={(e) => setActivityType(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 hover:border-slate-200 rounded-2xl text-slate-700 font-bold focus:border-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer appearance-none"
                                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394A3B8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
                            >
                                <option value="" disabled>Selecione um formato mágico...</option>
                                {activityOptions.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Status e Erros */}
                {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                )}
                
                {systemStatus && !isLoading && (
                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-bold flex items-center gap-2">
                        {systemStatus.type === 'rate-limit' && <AlertCircle className="w-4 h-4" />}
                        {systemStatus.message}
                    </div>
                )}

                {/* Botão de Geração com Gradient */}
                <div className="pt-4">
                    <Button
                        onClick={handleGenerate}
                        isLoading={isLoading}
                        disabled={!topic || !activityType || isLoading}
                        className="w-full py-5 text-xl rounded-2xl shadow-xl shadow-indigo-500/25 font-['Fredoka'] bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white transform hover:-translate-y-1 transition-all border-none"
                    >
                        {isLoading ? 'Criando Mágica...' : 'Gerar Atividade Agora'}
                    </Button>
                </div>
            </div>

            {/* Nova Seção: Coisas do Drácker */}
            <div className="w-full mt-12 mb-8 animate-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="flex items-center justify-center gap-3 w-full mb-8">
                    <div className="h-px bg-slate-200 w-16 md:w-32"></div>
                    <h2 className="text-sm md:text-base font-black text-slate-400 uppercase tracking-widest px-2 text-center">Coisas do Drácker</h2>
                    <div className="h-px bg-slate-200 w-16 md:w-32"></div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-5xl mx-auto">
                    {/* Imagem em linha com os botões */}
                    <div className="shrink-0 group">
                        <img 
                            src="/dracker_2026.jpg" 
                            alt="Drácker e sua Turma" 
                            className="w-48 md:w-56 h-auto object-cover rounded-[2rem] shadow-lg group-hover:scale-105 group-hover:shadow-xl transition-all duration-300 border-4 border-white/50" 
                        />
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                    {/* Botão Festival Music (simplify) */}
                    <button
                        onClick={() => selectActivityTab && selectActivityTab('simplify')}
                        className="group relative bg-white border border-slate-100 p-6 rounded-[2rem] shadow-lg shadow-pink-500/10 hover:shadow-xl hover:shadow-pink-500/20 hover:-translate-y-1 transition-all text-left overflow-hidden flex items-center gap-5"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-[1.25rem] flex items-center justify-center shadow-md shadow-pink-500/30 shrink-0 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 z-10">
                            <Music className="w-6 h-6 text-white" />
                        </div>
                        <div className="z-10">
                            <h3 className="font-black text-slate-800 text-lg mb-1 group-hover:text-pink-600 transition-colors">Rádio Drácker</h3>
                            <p className="text-xs font-semibold text-slate-500 leading-snug">
                                Músicas e ritmos pedagógicos para animar a sua aula
                            </p>
                        </div>
                    </button>

                    {/* Botão Galeria de Vídeos (video_gallery) */}
                    <button
                        onClick={() => selectActivityTab && selectActivityTab('video_gallery')}
                        className="group relative bg-white border border-slate-100 p-6 rounded-[2rem] shadow-lg shadow-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all text-left overflow-hidden flex items-center gap-5"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.25rem] flex items-center justify-center shadow-md shadow-indigo-500/30 shrink-0 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 z-10">
                            <Play className="w-6 h-6 text-white fill-white/20" />
                        </div>
                        <div className="z-10">
                            <h3 className="font-black text-slate-800 text-lg mb-1 group-hover:text-indigo-600 transition-colors">Vídeos Interativos</h3>
                            <p className="text-xs font-semibold text-slate-500 leading-snug">
                                Explore a galeria de vídeos selecionados do Youtube
                            </p>
                        </div>
                    </button>
                    </div>
                </div>
            </div>

        </div>
    );
};
