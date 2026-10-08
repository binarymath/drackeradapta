import React from 'react';
import { Settings, Key, Sparkles, BookOpen, BrainCircuit, X, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Input, TextArea, Select } from './ui/Input';
import { Card } from './ui/Card';

export const InspectorPanel = ({
    isOpen,
    onClose,
    apiKey,
    handleApiKeyChange,
    clearApiKey,
    selectedModel,
    setSelectedModel,
    modelOptions
}) => {
    if (!isOpen) return null;

    return (
        <div className="w-80 h-screen bg-white border-l border-slate-200 shadow-2xl flex flex-col z-40 transition-all duration-300 transform translate-x-0">
            {/* Header do Inspector */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2.5 text-indigo-700">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <BrainCircuit className="w-4 h-4" />
                    </div>
                    <h2 className="font-extrabold text-sm tracking-wide">Motor de Inteligência</h2>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50">
                
                {/* Cartão Principal de Configuração */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    
                    <div className="space-y-5">
                        {/* Passo 1: Pegar a Senha */}
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <h3 className="text-xs font-black text-indigo-800 mb-2 flex items-center gap-2">
                                <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                                Pegar a Senha Mestra
                            </h3>
                            <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                                O Drácker precisa de uma senha (gratuita) do Google para criar os jogos para você.
                            </p>
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Sparkles className="w-4 h-4" />
                                Pegar minha senha grátis
                            </a>
                        </div>

                        {/* Passo 2: Colar a Senha */}
                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                            <h3 className="text-xs font-black text-amber-800 mb-2 flex items-center gap-2">
                                <span className="bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                                Colar a Senha Aqui
                            </h3>
                            <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                                Copiou lá no site do Google? Agora é só colar aqui embaixo:
                            </p>
                            
                            <Input
                                type="password"
                                value={apiKey}
                                onChange={handleApiKeyChange}
                                placeholder="Cole sua senha (começa com AIza...)"
                                className="h-11 text-xs bg-white border-amber-200 focus:border-amber-500 font-mono shadow-inner w-full"
                            />

                            {apiKey && (
                                <div className="mt-3 flex justify-end">
                                    <button onClick={clearApiKey} className="text-[10px] text-red-500 hover:text-red-700 hover:underline font-bold px-2 flex items-center gap-1">
                                        <X className="w-3 h-3" />
                                        Esquecer senha salva
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 w-full"></div>

                    {/* Seleção de Modelo */}
                    <div className="space-y-2">
                        <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <BrainCircuit className="w-4 h-4 text-indigo-500" />
                            Cérebro do Drácker
                        </label>
                        <p className="text-[11px] font-medium text-slate-500 leading-snug">
                            Escolha qual versão da inteligência artificial você quer usar.
                        </p>
                        {modelOptions && (
                            <div className="pt-1">
                                <Select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel && setSelectedModel(e.target.value)}
                                    options={modelOptions}
                                />
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};
