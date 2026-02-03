import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, AlertCircle, GripVertical } from 'lucide-react';
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
    openManualMusicEditor
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
                        label="Detalhes"
                        value={lessonDetails}
                        onChange={(e) => setLessonDetails(e.target.value)}
                        placeholder="Detalhes..."
                    />

                    <div>
                        <label className={theme.text.label}>Dificuldade / Linguagem</label>
                        <div className="flex gap-2">
                            {difficultyOptions.map((opt) => (
                                <Button
                                    key={opt.id}
                                    onClick={() => setDifficulty(opt.id)}
                                    variant={difficulty === opt.id ? 'primary' : 'ghost'}
                                    className={`flex-1 py-2 text-sm ${difficulty === opt.id ? '' : 'bg-brown-50 hover:bg-brown-100 text-brown-700'}`}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={theme.text.label}>Tipo</label>
                        <div className="space-y-2">
                            {orderedActivities.map((opt, index) => (
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
                        {/* Fixed "About System" Link */}
                        <button
                            onClick={() => setActivityType('about_system')}
                            className={`w-full px-2 py-2 mt-2 rounded-lg text-left text-sm flex items-center gap-2 transition-all cursor-pointer border border-transparent ${activityType === 'about_system'
                                ? 'bg-brown-100 border-brown-300 text-brown-900 font-medium'
                                : 'bg-brown-50 hover:bg-brown-100 text-brown-700'
                                }`}
                        >
                            <div className="w-6 flex justify-center">
                                <span className="text-lg">ℹ️</span>
                            </div>
                            Sobre o Sistema
                        </button>
                    </div>

                    {activityType === 'image_ai' && (
                        <div className="bg-brown-50 p-4 rounded-lg border border-brown-200 space-y-3 mt-4">
                            <TextArea
                                label="🖼️ Prompt da Imagem (IA)"
                                rows={3}
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                placeholder="Descreva o desenho..."
                                className="bg-white"
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
