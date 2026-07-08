import React, { useState } from 'react';
import { Brain, Sparkles, LayoutTemplate, Upload, Trash2, Edit3, AlertCircle } from 'lucide-react';
import { toDirectImageUrl, handleDriveImageError } from '../../utils/urlUtils';

const MemoryInput = ({
    topic,
    cardBackImage, setCardBackImage,
    generateCards,
    setModeBuilder,
    error,
    hasKey
}) => {
    const [view, setView] = useState('selection'); // 'selection' | 'ai-setup'

    const handleBackImageUpload = (file) => {
        if (file) setCardBackImage(URL.createObjectURL(file));
    };

    const handleGenerateClick = (e) => {
        e.preventDefault(); // Prevent accidental form submission behavior if nested
        console.log("MemoryInput: 'Gerar Jogo Agora' clicked.");

        if (!hasKey) {
            console.warn("MemoryInput: Button clicked but hasKey is false.");
            return;
        }

        if (typeof generateCards !== 'function') {
            console.error("MemoryInput: generateCards prop is not a function!", generateCards);
            return;
        }

        generateCards();
    };

    // --- SELECTION VIEW ---
    if (view === 'selection') {
        return (
            <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-4">
                <div className="text-center mb-2">
                    <h2 className="text-xl font-bold text-brown-800">Como deseja criar?</h2>
                    <p className="text-sm text-brown-600">Tema atual: <span className="font-bold">{topic || "Livre"}</span></p>
                </div>

                <button
                    onClick={() => setView('ai-setup')}
                    className="w-full bg-brown-600 hover:bg-brown-700 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5"
                >
                    <Sparkles size={24} />
                    <div className="text-left">
                        <div className="text-sm font-bold">Criar com IA</div>
                        <div className="text-xs text-brown-200 font-normal">Gera pares automaticamente</div>
                    </div>
                </button>

                <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-brown-200"></div>
                    <span className="flex-shrink-0 mx-4 text-brown-400 text-xs uppercase">Ou</span>
                    <div className="flex-grow border-t border-brown-200"></div>
                </div>

                <button
                    onClick={setModeBuilder}
                    className="w-full bg-white border-2 border-brown-100 hover:border-brown-300 hover:bg-brown-50 text-brown-700 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
                >
                    <Edit3 size={24} />
                    <div className="text-left">
                        <div className="text-sm font-bold">Criar Manualmente</div>
                        <div className="text-xs text-brown-500 font-normal">Edite ou crie do zero</div>
                    </div>
                </button>
            </div>
        );
    }

    // --- AI SETUP VIEW ---
    return (
        <div className="w-full max-w-md mx-auto p-2">
            <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setView('selection')} className="p-1 hover:bg-brown-100 rounded-full text-brown-600">
                    <LayoutTemplate className="rotate-90" size={20} />
                </button>
                <h2 className="text-lg font-bold text-brown-800">Configuração Rápida</h2>
            </div>

            <div className="bg-brown-50 p-3 rounded-lg border border-brown-200 mb-4">
                <label className="text-xs text-brown-500 mb-2 block font-semibold flex items-center gap-1">
                    <Upload size={12} /> Personalizar Capa (Opcional)
                </label>

                <div className="flex items-center gap-3">
                    <label className="w-16 h-20 bg-white border-2 border-dashed border-brown-300 rounded cursor-pointer hover:border-brown-500 flex flex-col items-center justify-center text-brown-400 overflow-hidden relative transition-colors">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleBackImageUpload(e.target.files[0])} />
                        {cardBackImage ? <img src={toDirectImageUrl(cardBackImage)} className="w-full h-full object-cover" alt="Capa" referrerPolicy="no-referrer" onError={handleDriveImageError} /> : <Upload size={20} />}
                    </label>

                    <div className="flex-1 space-y-2">
                        <p className="text-xs text-brown-600 leading-tight">
                            Envie uma imagem para o verso das cartas.
                        </p>
                        {cardBackImage && (
                            <button onClick={() => setCardBackImage(null)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                                <Trash2 size={12} /> Remover imagem
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <button
                type="button" // Explicitly prevent submit
                onClick={handleGenerateClick}
                disabled={!hasKey}
                className={`w-full py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all font-bold text-white
                    ${!hasKey ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:scale-[1.02]'}`}
            >
                <Sparkles size={20} />
                {hasKey ? "Gerar Jogo Agora" : "Configure a API Key"}
            </button>
            {!hasKey && (
                <p className="text-red-500 text-xs text-center mt-2">
                    * Vá em Configurações (⚙️) para adicionar sua chave Gemini.
                </p>
            )}
        </div>
    );
};

export default MemoryInput;
