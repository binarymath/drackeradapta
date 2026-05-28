import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, AlertCircle, GripVertical, Music, Play, MessageSquare } from 'lucide-react';
import { theme } from '../styles/theme';
import { Button } from './ui/Button';
import { Input, TextArea, Select } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

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
    const [orderedActivities, setOrderedActivities] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);

    useEffect(() => {
        // Carrega ordem salva no localStorage ou usa ordem padrão
        const saved = localStorage.getItem('activityOrder');
        if (saved) {
            try {
                const savedOrder = JSON.parse(saved);

                // Reconstruct the full object list using the saved order of IDs
                const rehydratedItems = savedOrder
                    .map(savedItem => activityOptions.find(opt => opt.id === savedItem.id))
                    .filter(item => item !== undefined); // Remove invalid/removed IDs

                // Find any NEW items in activityOptions that weren't in the saved order
                const newItems = activityOptions.filter(opt => !rehydratedItems.find(r => r.id === opt.id));

                setOrderedActivities([...rehydratedItems, ...newItems]);
            } catch {
                setOrderedActivities(activityOptions);
            }
        } else {
            setOrderedActivities(activityOptions);
        }
    }, [activityOptions]);

    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedItem === null || draggedItem === targetIndex) return;

        const newOrder = [...orderedActivities];
        const [movedItem] = newOrder.splice(draggedItem, 1);
        newOrder.splice(targetIndex, 0, movedItem);

        setOrderedActivities(newOrder);
        setDraggedItem(null);

        // Salva no localStorage
        localStorage.setItem('activityOrder', JSON.stringify(newOrder));
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

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
                                    className={`flex-1 py-2 text-xs font-bold ${difficulty === opt.id ? '' : 'bg-brown-50 hover:bg-brown-100 text-brown-700'}`}
                                    title={opt.tooltip}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Quiz: configurações de perguntas */}
                    {activityType === 'quiz' && (
                        <div className="space-y-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                            {/* Quantidade */}
                            <div>
                                <label className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Quantidade de Perguntas</label>
                                <div className="flex gap-1.5 flex-wrap mt-1.5">
                                    {[5, 10, 15, 20].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setQuestionCount(n)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
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
                                <label className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Distribuição de Dificuldade</label>

                                {/* Barra visual */}
                                <div className="flex h-3 rounded-full overflow-hidden mt-2 mb-3 border border-amber-200">
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
                                <div className="space-y-2">
                                    {[
                                        { key: 'easy',   label: '🟢 Fácil',   color: 'accent-green-500',  text: 'text-green-700'  },
                                        { key: 'medium', label: '🟡 Médio',   color: 'accent-amber-500',  text: 'text-amber-700'  },
                                        { key: 'hard',   label: '🔴 Difícil', color: 'accent-red-500',    text: 'text-red-700'    },
                                    ].map(({ key, label, color, text }) => {
                                        const val = difficultyDist[key];
                                        // Contagem aproximada para preview
                                        const total = (difficultyDist.easy + difficultyDist.medium + difficultyDist.hard) || 100;
                                        const cnt = Math.round(questionCount * val / total);

                                        return (
                                            <div key={key}>
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className={`text-[11px] font-bold ${text}`}>{label}</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[10px] font-bold ${text}`}>{cnt} questão{cnt !== 1 ? 'ões' : ''}</span>
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
                                                            className={`w-11 px-1.5 py-0.5 rounded text-[11px] font-bold border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 text-center ${text}`}
                                                        />
                                                        <span className={`text-[10px] ${text}`}>%</span>
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
                                                    className={`w-full h-2 rounded-full appearance-none cursor-pointer ${color}`}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Presets rápidos */}
                                <div className="flex gap-1.5 flex-wrap mt-2.5">
                                    <span className="text-[10px] text-amber-600 font-bold self-center mr-0.5">Presets:</span>
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
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                                    active
                                                        ? 'bg-amber-600 text-white border-amber-700'
                                                        : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'
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
                        {/* Fixed "About System" Link */}
                        <button
                            onClick={() => setActivityType('about_system')}
                            className={`w-full px-2 py-2 mb-2 rounded-lg text-left text-sm flex items-center gap-2 transition-all cursor-pointer border border-transparent ${activityType === 'about_system'
                                ? 'bg-brown-100 border-brown-300 text-brown-900 font-medium'
                                : 'bg-brown-50 hover:bg-brown-100 text-brown-700'
                                }`}
                        >
                            <div className="w-6 flex justify-center">
                                <span className="text-lg">ℹ️</span>
                            </div>
                            Drácker Página Inicial
                        </button>
                        {/* Fixed "Canal do Drácker" Link */}
                        <button
                            onClick={() => setActivityType('video_gallery')}
                            className={`w-full px-2 py-2 mb-2 rounded-lg text-left text-sm flex items-center gap-2 transition-all cursor-pointer border border-transparent ${activityType === 'video_gallery'
                                ? 'bg-brown-100 border-brown-300 text-brown-900 font-medium'
                                : 'bg-brown-50 hover:bg-brown-100 text-brown-700'
                                }`}
                        >
                            <div className="w-6 flex justify-center text-brown-500">
                                <Play className="w-4 h-4" />
                            </div>
                            Canal do Drácker
                        </button>
                        {/* Fixed "Rádio Drácker" Link */}
                        <button
                            onClick={() => setActivityType('simplify')}
                            className={`w-full px-2 py-2 mb-2 rounded-lg text-left text-sm flex items-center gap-2 transition-all cursor-pointer border border-transparent ${activityType === 'simplify'
                                ? 'bg-brown-100 border-brown-300 text-brown-900 font-medium'
                                : 'bg-brown-50 hover:bg-brown-100 text-brown-700'
                                }`}
                        >
                            <div className="w-6 flex justify-center text-brown-500">
                                <Music className="w-4 h-4" />
                            </div>
                            Rádio Drácker
                        </button>
                        {/* Fixed "Drácker Metodologia Ativa" Link */}
                        <button
                            onClick={() => setActivityType('summary')}
                            className={`w-full px-2 py-2 mb-2 rounded-lg text-left text-sm flex items-center gap-2 transition-all cursor-pointer border border-transparent ${activityType === 'summary'
                                ? 'bg-brown-100 border-brown-300 text-brown-900 font-medium'
                                : 'bg-brown-50 hover:bg-brown-100 text-brown-700'
                                }`}
                        >
                            <div className="w-6 flex justify-center text-brown-500">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            Drácker Metodologia Ativa
                        </button>
                        <div className="space-y-2">
                            {orderedActivities.filter(opt => opt.id !== 'summary').map((opt, index) => (
                                opt.url ? (
                                    <a
                                        key={opt.id}
                                        href={opt.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 bg-brown-50 hover:bg-brown-100 text-brown-800 transition-colors cursor-pointer"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <div className="cursor-grab p-1 -ml-1 hover:bg-brown-200 rounded text-brown-500">
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                        {opt.icon} {opt.label}
                                    </a>
                                ) : (
                                    <button
                                        key={opt.id}
                                        onClick={() => setActivityType(opt.id)}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`w-full px-2 py-2 rounded-lg text-left text-sm flex items-center gap-2 transition-all cursor-pointer ${activityType === opt.id ? 'bg-brown-100 border border-brown-400 text-brown-900 font-medium' : 'bg-brown-50 hover:bg-brown-100 text-brown-700'
                                            } ${draggedItem === index ? 'opacity-50' : ''}`}
                                    >
                                        <div className="cursor-grab p-1 hover:bg-brown-200 rounded text-brown-500" onClick={(e) => e.stopPropagation()}>
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                        {opt.icon} {opt.label}
                                    </button>
                                )
                            ))}
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



                    <Button
                        onClick={handleGenerate}
                        isLoading={isLoading}
                        icon={!isLoading ? Sparkles : undefined}
                        className="w-full py-3 text-white shadow-md hover:-translate-y-0.5"
                    >
                        {isLoading ? 'Criando...' : 'Gerar'}
                    </Button>

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
