import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, AlertCircle, Music, Play, MessageSquare, Compass, ArrowLeftRight, PieChart } from 'lucide-react';
import { theme } from '../styles/theme';
import { Button } from './ui/Button';
import { Input, TextArea, Select } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { useActivity } from '../contexts/ActivityContext';

export const Sidebar = ({
    showSettings,
    apiKey,
    handleApiKeyChange,
    clearApiKey,
    modelOptions,
    selectedModel,
    setSelectedModel,
    imagePng,
    handleDownloadGeneratedPng,
    topic,
    setTopic,
    lessonDetails,
    setLessonDetails,
    difficultyOptions,
    difficulty,
    setDifficulty,
    activityOptions,
    activityType,
    setActivityType,
    imagePrompt,
    setImagePrompt,
    imageStyle,
    setImageStyle,
    imageSize,
    setImageSize,
    handleGenerateImage,
    isLoading,
    handleGenerate,
    systemStatus,
    error,
    openSaveLoad,
    openManualMusicEditor,
    questionCount,
    setQuestionCount,
    difficultyDist,
    setDifficultyDist
}) => {
    const { tabs, setActiveTabId } = useActivity();

    const handleActivitySelect = (type) => {
        setActivityType(type);
        setTimeout(() => {
            if (window.innerWidth < 1024) {
                const container = document.getElementById('activity-area-container');
                if (container) {
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 30);
    };

    const navLinks = [
        { id: 'about_system', label: 'Página Inicial', icon: <span className="text-xl">ℹ️</span> },
        { id: 'chat_dracker', label: 'Conversar com o Drácker', icon: <MessageSquare className="w-5 h-5" /> },
        { id: 'video_gallery', label: 'Canal do Drácker', icon: <Play className="w-5 h-5" /> },
        { id: 'simplify', label: 'Rádio Drácker', icon: <Music className="w-5 h-5" /> },
        { id: 'summary', label: 'Metodologia Ativa', icon: <MessageSquare className="w-5 h-5" /> },
        { id: 'rpg', label: 'Mestre RPG', icon: <Compass className="w-5 h-5" /> },
        { id: 'number_line', label: 'Reta Numérica', icon: <ArrowLeftRight className="w-5 h-5" /> },
        { id: 'fractions', label: 'Frações e Operações', icon: <PieChart className="w-5 h-5" /> },
        ...activityOptions.filter(opt => 
            opt.id !== 'summary' && 
            opt.id !== 'rpg' && 
            opt.id !== 'number_line' && 
            opt.id !== 'fractions' && 
            opt.id !== 'about_system' && 
            opt.id !== 'chat_dracker' && 
            opt.id !== 'video_gallery' && 
            opt.id !== 'simplify'
        )
    ];

    return (
        <div className={theme.layout.sidebar}>
            {/* Dracker 2026 Banner */}
            <div className="mb-4 rounded-xl overflow-hidden shadow-sm border border-brown-100 group">
                <img
                    src="/dracker_2026.jpg"
                    alt="Dracker 2026"
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            {showSettings && (
                <Card className="space-y-4">
                    <div>
                        <h2 className={theme.text.title.replace('text-lg', 'text-sm')}>🔑 Chave Gemini API</h2>
                        <Input
                            type="password"
                            value={apiKey}
                            onChange={handleApiKeyChange}
                            placeholder="Cole sua chave aqui..."
                        />
                        <p className={`${theme.text.small} mt-2`}>
                            Não tem? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className={theme.text.link}>Obter chave grátis</a>
                        </p>
                        {apiKey && (
                            <Button onClick={clearApiKey} variant="danger" className="w-full mt-2 py-2 text-sm">
                                Limpar Chave
                            </Button>
                        )}
                    </div>


                    {imagePng && (
                        <div className="mt-6">
                            <img src={imagePng} alt="Imagem gerada por IA" className="max-w-full border border-brown-200 rounded-lg shadow-sm" />
                            <div className="mt-3">
                                <Button onClick={handleDownloadGeneratedPng} variant="secondary" className="px-3 py-2 text-sm">Baixar PNG</Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h2 className={theme.text.title}>Nova Atividade</h2>
                </div>

                    <div className="space-y-4">
                        <Input
                            label="Tema"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Ex: Cores primárias..."
                        />

                    <TextArea
                        label="Contexto Específico (Detalhes da Aula)"
                        value={lessonDetails}
                        onChange={(e) => setLessonDetails(e.target.value)}
                        placeholder="Ex: Focar na fotossíntese; Nível 3º ano; Apenas continentes da Ásia..."
                        rows={4}
                        className="!resize-none"
                    />

                    <div>
                        <label className={theme.text.label}>Dificuldade / Linguagem</label>
                        <div className="flex gap-2">
                            {difficultyOptions.map((opt) => (
                                <Button
                                    key={opt.id}
                                    onClick={() => setDifficulty(opt.id)}
                                    variant={difficulty === opt.id ? 'primary' : 'ghost'}
                                    className={`flex-1 py-2.5 text-[15px] font-bold ${difficulty === opt.id ? '' : 'bg-brown-50 hover:bg-brown-100 text-brown-700'}`}
                                    title={opt.tooltip}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Quiz: configurações de perguntas */}
                    {activityType === 'quiz' && (
                        <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                            {/* Quantidade */}
                            <div>
                                <label className="text-[14px] font-bold text-amber-900 uppercase tracking-wide">Quantidade de Perguntas</label>
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {[5, 10, 15, 20].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setQuestionCount(n)}
                                            className={`flex-1 py-2 rounded-lg text-[15px] font-bold border transition-all ${
                                                questionCount === n
                                                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                                                    : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-100'
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Divisor */}
                            <div className="border-t border-amber-200" />

                            {/* Distribuição de dificuldade */}
                            <div>
                                <label className="text-[14px] font-bold text-amber-900 uppercase tracking-wide">Distribuição de Dificuldade</label>

                                {/* Barra visual */}
                                <div className="flex h-3.5 rounded-full overflow-hidden mt-2.5 mb-4 border border-amber-200 shadow-inner">
                                    <div
                                        className="bg-green-400 transition-all duration-200"
                                        style={{ width: `${difficultyDist.easy}%` }}
                                        title={`Fácil: ${difficultyDist.easy}%`}
                                    />
                                    <div
                                        className="bg-amber-400 transition-all duration-200"
                                        style={{ width: `${difficultyDist.medium}%` }}
                                        title={`Médio: ${difficultyDist.medium}%`}
                                    />
                                    <div
                                        className="bg-red-400 transition-all duration-200"
                                        style={{ width: `${difficultyDist.hard}%` }}
                                        title={`Difícil: ${difficultyDist.hard}%`}
                                    />
                                </div>

                                {/* Sliders */}
                                <div className="space-y-3">
                                    {[
                                        { key: 'easy',   label: '🟢 Fácil',   color: 'accent-green-500',  text: 'text-green-800'  },
                                        { key: 'medium', label: '🟡 Médio',   color: 'accent-amber-500',  text: 'text-amber-800'  },
                                        { key: 'hard',   label: '🔴 Difícil', color: 'accent-red-500',    text: 'text-red-800'    },
                                    ].map(({ key, label, color, text }) => {
                                        const val = difficultyDist[key];
                                        // Contagem aproximada para preview
                                        const total = (difficultyDist.easy + difficultyDist.medium + difficultyDist.hard) || 100;
                                        const cnt = Math.round(questionCount * val / total);

                                        return (
                                            <div key={key}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-[14px] font-bold ${text}`}>{label}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[13px] font-bold ${text}`}>{cnt} questão{cnt !== 1 ? 'ões' : ''}</span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={val}
                                                            onChange={e => {
                                                                const newVal = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                                                // Ajusta os outros dois proporcionalmente
                                                                const others = ['easy','medium','hard'].filter(k => k !== key);
                                                                const remaining = 100 - newVal;
                                                                const currentOthersSum = others.reduce((s,k) => s + difficultyDist[k], 0);
                                                                const updated = { ...difficultyDist, [key]: newVal };
                                                                if (currentOthersSum === 0) {
                                                                    updated[others[0]] = Math.floor(remaining / 2);
                                                                    updated[others[1]] = remaining - updated[others[0]];
                                                                } else {
                                                                    others.forEach(k => {
                                                                        updated[k] = Math.round(remaining * difficultyDist[k] / currentOthersSum);
                                                                    });
                                                                    // Ajuste de arredondamento
                                                                    const diff = 100 - Object.values(updated).reduce((s,v) => s+v, 0);
                                                                    updated[others[1]] = Math.max(0, updated[others[1]] + diff);
                                                                }
                                                                setDifficultyDist(updated);
                                                            }}
                                                            className={`w-13 px-2 py-1 rounded text-[13px] font-bold border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 text-center ${text}`}
                                                        />
                                                        <span className={`text-[13px] font-bold ${text}`}>%</span>
                                                    </div>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    value={val}
                                                    onChange={e => {
                                                        const newVal = Number(e.target.value);
                                                        const others = ['easy','medium','hard'].filter(k => k !== key);
                                                        const remaining = 100 - newVal;
                                                        const currentOthersSum = others.reduce((s,k) => s + difficultyDist[k], 0);
                                                        const updated = { ...difficultyDist, [key]: newVal };
                                                        if (currentOthersSum === 0) {
                                                            updated[others[0]] = Math.floor(remaining / 2);
                                                            updated[others[1]] = remaining - updated[others[0]];
                                                        } else {
                                                            others.forEach(k => {
                                                                updated[k] = Math.round(remaining * difficultyDist[k] / currentOthersSum);
                                                            });
                                                            const diff = 100 - Object.values(updated).reduce((s,v) => s+v, 0);
                                                            updated[others[1]] = Math.max(0, updated[others[1]] + diff);
                                                        }
                                                        setDifficultyDist(updated);
                                                    }}
                                                    className={`w-full h-2.5 rounded-full appearance-none cursor-pointer ${color}`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Presets rápidos */}
                                <div className="flex gap-2 flex-wrap mt-3 items-center">
                                    <span className="text-[13px] text-amber-800 font-bold mr-1">Presets:</span>
                                    {[
                                        { label: 'Simples',     dist: { easy: 70, medium: 20, hard: 10 } },
                                        { label: 'Balanceado',  dist: { easy: 40, medium: 40, hard: 20 } },
                                        { label: 'Desafiador',  dist: { easy: 20, medium: 40, hard: 40 } },
                                        { label: 'Avançado',    dist: { easy: 0,  medium: 30, hard: 70 } },
                                    ].map(p => {
                                        const active = p.dist.easy === difficultyDist.easy && p.dist.medium === difficultyDist.medium && p.dist.hard === difficultyDist.hard;
                                        return (
                                            <button
                                                key={p.label}
                                                onClick={() => setDifficultyDist(p.dist)}
                                                className={`px-3 py-1.5 rounded-lg text-[13px] font-bold border transition-all ${
                                                    active
                                                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                                                        : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-100'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className={theme.text.label}>Tipo</label>
                        <div className="space-y-2 pt-1">
                            {navLinks.map((opt) => {
                                const isActive = activityType === opt.id;
                                if (opt.url) {
                                    return (
                                        <a
                                            key={opt.id}
                                            href={opt.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-3 px-3.5 rounded-2xl text-left flex items-center justify-between transition-all duration-200 cursor-pointer bg-white/70 hover:bg-white text-brown-800 hover:text-brown-950 font-bold border border-brown-200/60 hover:border-brown-300 shadow-2xs hover:shadow-sm group"
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                                                <div className="w-9 h-9 rounded-xl bg-brown-100/80 group-hover:bg-brown-200/80 text-brown-600 group-hover:text-brown-900 flex items-center justify-center shrink-0 transition-all group-hover:scale-105">
                                                    <span className="[&>svg]:w-5 [&>svg]:h-5 flex items-center justify-center">{opt.icon}</span>
                                                </div>
                                                <span className="truncate text-[16px] tracking-tight">{opt.label}</span>
                                            </div>
                                        </a>
                                    );
                                }
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleActivitySelect(opt.id)}
                                        className={`w-full py-3 px-3.5 rounded-2xl text-left flex items-center justify-between transition-all duration-200 cursor-pointer group ${
                                            isActive
                                                ? 'bg-gradient-to-r from-brown-900 via-brown-850 to-brown-800 text-white font-extrabold shadow-md border border-brown-700/90 scale-[1.01]'
                                                : 'bg-white/70 hover:bg-white text-brown-800 hover:text-brown-950 font-bold border border-brown-200/60 hover:border-brown-300 shadow-2xs hover:shadow-sm hover:scale-[1.005]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                                isActive
                                                    ? 'bg-white/20 text-amber-300 shadow-inner scale-105'
                                                    : 'bg-brown-100/80 group-hover:bg-brown-200/80 text-brown-600 group-hover:text-brown-900 group-hover:scale-105'
                                            }`}>
                                                <span className="[&>svg]:w-5 [&>svg]:h-5 flex items-center justify-center">
                                                    {opt.icon}
                                                </span>
                                            </div>
                                            <span className="truncate text-[16px] tracking-tight">{opt.label}</span>
                                        </div>
                                        <div className="shrink-0 pl-1">
                                            <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                                                isActive
                                                    ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)] scale-110'
                                                    : 'bg-transparent group-hover:bg-brown-300'
                                            }`} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {activityType === 'image_ai' && (
                        <div className="bg-brown-50 p-4 rounded-lg border border-brown-200 space-y-3 mt-4">
                            <TextArea
                                label="🖼️ Prompt da Imagem (IA)"
                                rows={3}
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                placeholder="Descreva o desenho..."
                                className="bg-white !resize-none"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Select
                                    label="Estilo"
                                    value={imageStyle}
                                    onChange={(e) => setImageStyle(e.target.value)}
                                    options={[
                                        { value: 'infantil-desenho', label: 'Infantil' },
                                        { value: 'aquarela', label: 'Aquarela' },
                                        { value: 'flat', label: 'Flat' }
                                    ]}
                                />
                                <Select
                                    label="Resolução"
                                    value={imageSize}
                                    onChange={(e) => setImageSize(e.target.value)}
                                    options={[
                                        { value: '1K', label: '1K' },
                                        { value: '2K', label: '2K' },
                                        { value: '4K', label: '4K' }
                                    ]}
                                />
                            </div>
                            <Button
                                onClick={handleGenerateImage}
                                isLoading={isLoading}
                                className="w-full py-2"
                            >
                                Gerar Desenho
                            </Button>
                            {imagePng && (
                                <div className="mt-4">
                                    <img src={imagePng} alt="Desenho gerado" className="max-w-full border border-brown-200 rounded-lg shadow-sm" />
                                    <div className="mt-3">
                                        <Button onClick={handleDownloadGeneratedPng} variant="secondary" className="px-3 py-2 text-sm">Baixar PNG</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}



                    {activityType !== 'about_system' && activityType !== 'dashboard' && activityType !== 'merge_pdf' && (
                        <>
                            {isLoading && (
                                <div className="mt-3 p-4 rounded-lg bg-brown-50 border border-brown-200 space-y-2 animate-pulse">
                                    <div className="flex items-center gap-2 text-brown-800">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="font-semibold">
                                            {activityType === 'wordsearch' ? '🔄 Gerando Caça-Palavras...' : '📝 Criando Atividade...'}
                                        </span>
                                    </div>
                                    <p className={theme.text.small}>
                                        {activityType === 'wordsearch'
                                            ? 'Gerando texto educativo...'
                                            : 'Processando sua solicitação...'}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {systemStatus && (
                        <div className={`mt-2 p-3 rounded-lg text-sm ${systemStatus.type === 'rate-limit' ? theme.status.warning :
                            systemStatus.type === 'retry' ? theme.status.warning.replace('yellow', 'orange') :
                                systemStatus.type === 'fallback' ? theme.status.info :
                                    theme.status.info
                            }`}>
                            <div className="flex items-center gap-2">
                                {systemStatus.type === 'retry' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {systemStatus.type === 'rate-limit' && <AlertCircle className="w-4 h-4" />}
                                <span className="font-semibold">
                                    {systemStatus.type === 'rate-limit' ? '⏳ Aguardando Vaga' :
                                        systemStatus.type === 'retry' ? '🔄 Tentando Conectar' :
                                            systemStatus.type === 'fallback' ? '🔀 Mudança de Modelo' :
                                                'ℹ️ Sistema'}
                                </span>
                            </div>
                            <p className="mt-1 text-xs">{systemStatus.message}</p>
                            {systemStatus.details?.attempt && (
                                <p className="mt-1 text-xs opacity-75">
                                    Tentativa {systemStatus.details.attempt} de {systemStatus.details.maxRetries}
                                </p>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className={`p-3 text-xs rounded border flex items-start gap-2 ${theme.status.error}`}>
                            <AlertCircle className="w-4 h-4 mt-0.5" /> {error}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
