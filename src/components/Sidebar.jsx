import React from 'react';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import WordsearchWizard from './WordsearchWizard';

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
    geminiService,
    directions,
    setDirections,
    handleWordsearchComplete,
    setError,
    wordsearchTrigger,
    handleGenerate,
    systemStatus,
    error,
    openSaveLoad
}) => {
    return (
        <div className="lg:col-span-4 space-y-6 no-print">
            {showSettings && (
                <div className="bg-white p-6 rounded-lg shadow border border-amber-200 space-y-4">
                    <div>
                        <h2 className="text-sm font-bold text-amber-900 mb-3">🔑 Chave Gemini API</h2>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={handleApiKeyChange}
                            placeholder="Cole sua chave aqui..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded text-sm font-mono"
                        />
                        <p className="text-xs text-slate-600 mt-2">
                            Não tem? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline font-bold">Obter chave grátis</a>
                        </p>
                        {apiKey && (
                            <button onClick={clearApiKey} className="w-full mt-2 py-2 bg-red-100 text-red-700 rounded text-sm font-semibold hover:bg-red-200">
                                Limpar Chave
                            </button>
                        )}
                    </div>

                    {apiKey && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-2">⚡ Modelo de IA</h3>
                            <div className="space-y-2">
                                {modelOptions.map((model) => (
                                    <label key={model.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="model"
                                            value={model.id}
                                            checked={selectedModel === model.id}
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            className="rounded"
                                        />
                                        <span className="text-xs text-slate-700">{model.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    {imagePng && (
                        <div className="mt-6">
                            <img src={imagePng} alt="Imagem gerada por IA" className="max-w-full border rounded" />
                            <div className="mt-3">
                                <button onClick={handleDownloadGeneratedPng} className="px-3 py-2 rounded text-sm bg-blue-100 hover:bg-blue-200">Baixar PNG</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Nova Atividade</h2>

                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Tema</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Ex: Cores primárias..."
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Detalhes</label>
                        <textarea
                            value={lessonDetails}
                            onChange={(e) => setLessonDetails(e.target.value)}
                            placeholder="Detalhes..."
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-sm h-16 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Escolha a linguagem dos textos das atividades</label>
                        <div className="flex gap-2">
                            {difficultyOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setDifficulty(opt.id)}
                                    className={`flex-1 py-2 rounded text-sm ${difficulty === opt.id ? 'bg-amber-600 text-white' : 'bg-slate-100'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2">Tipo</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {activityOptions.map((opt) => (
                                opt.url ? (
                                    <a
                                        key={opt.id}
                                        href={opt.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full px-3 py-2 rounded text-left text-sm flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700"
                                    >
                                        {opt.icon} {opt.label}
                                    </a>
                                ) : (
                                    <button
                                        key={opt.id}
                                        onClick={() => setActivityType(opt.id)}
                                        className={`w-full px-3 py-2 rounded text-left text-sm flex items-center gap-2 ${activityType === opt.id ? 'bg-amber-100 border border-amber-500' : 'bg-slate-50 hover:bg-slate-100'}`}
                                    >
                                        {opt.icon} {opt.label}
                                    </button>
                                )
                            ))}
                        </div>
                    </div>

                    {activityType === 'image_ai' && (
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-3 mt-4">
                            <label className="block text-sm font-semibold mb-2 text-purple-900">🖼️ Prompt da Imagem (IA)</label>
                            <textarea
                                className="w-full border rounded p-2"
                                rows={3}
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                placeholder="Descreva o desenho (ex.: um dragãozinho camarada na floresta encantada)"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-purple-900">Estilo</label>
                                    <select className="w-full border rounded p-2 text-sm" value={imageStyle} onChange={(e) => setImageStyle(e.target.value)}>
                                        <option value="infantil-desenho">Infantil (desenho/cartoon)</option>
                                        <option value="aquarela">Aquarela suave</option>
                                        <option value="flat">Flat minimalista</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-purple-900">Resolução</label>
                                    <select className="w-full border rounded p-2 text-sm" value={imageSize} onChange={(e) => setImageSize(e.target.value)}>
                                        <option value="1K">1K (rápida)</option>
                                        <option value="2K">2K (nítida)</option>
                                        <option value="4K">4K (detalhada)</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={handleGenerateImage}
                                disabled={isLoading}
                                className={`w-full py-2 rounded font-bold text-white ${isLoading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'}`}
                            >
                                Gerar Desenho
                            </button>
                            {imagePng && (
                                <div className="mt-4">
                                    <img src={imagePng} alt="Desenho gerado por IA" className="max-w-full border rounded" />
                                    <div className="mt-3">
                                        <button onClick={handleDownloadGeneratedPng} className="px-3 py-2 rounded text-sm bg-blue-100 hover:bg-blue-200">Baixar PNG</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}



                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className={`w-full py-3 rounded font-bold text-white flex items-center justify-center gap-2 ${isLoading ? 'bg-amber-400' : 'bg-amber-600 hover:bg-amber-700'
                            }`}
                    >
                        {isLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</>
                        ) : (
                            <><Sparkles className="w-5 h-5" /> Gerar</>
                        )}
                    </button>

                    {isLoading && (
                        <div className="mt-3 p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2">
                            <div className="flex items-center gap-2 text-amber-800">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="font-semibold">
                                    {activityType === 'wordsearch' ? '🔄 Gerando Caça-Palavras...' : '📝 Criando Atividade...'}
                                </span>
                            </div>
                            <p className="text-xs text-amber-700">
                                {activityType === 'wordsearch'
                                    ? 'Gerando texto educativo, criando grade, selecionando palavras e configurando desafio...'
                                    : 'Processando sua solicitação...'}
                            </p>
                        </div>
                    )}

                    {activityType === 'wordsearch' && geminiService && (
                        <WordsearchWizard
                            apiKey={apiKey}
                            topic={topic}
                            lessonDetails={lessonDetails}
                            difficulty={difficulty}
                            directions={directions}
                            setDirections={setDirections}
                            onComplete={handleWordsearchComplete}
                            onError={setError}
                            geminiService={geminiService}
                            triggerStart={wordsearchTrigger}
                            defaultTitle={topic}
                        />
                    )}

                    {systemStatus && (
                        <div className={`mt-2 p-3 rounded-lg text-sm ${systemStatus.type === 'rate-limit' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
                            systemStatus.type === 'retry' ? 'bg-orange-50 border border-orange-200 text-orange-800' :
                                systemStatus.type === 'fallback' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                                    'bg-slate-50 border border-slate-200 text-slate-800'
                            }`}>
                            <div className="flex items-center gap-2">
                                {systemStatus.type === 'retry' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {systemStatus.type === 'rate-limit' && <AlertCircle className="w-4 h-4" />}
                                <span className="font-semibold">
                                    {systemStatus.type === 'rate-limit' ? '⏳ Aguardando Vaga (Limite de Taxa)' :
                                        systemStatus.type === 'retry' ? '🔄 Tentando Conectar (Sobrecarga detectada)' :
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
                        <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5" /> {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
