import React from 'react';
import { LayoutTemplate, Upload, Trash2, ImageIcon, Plus } from 'lucide-react';
import { toDirectImageUrl, handleDriveImageError } from '../../utils/urlUtils';

const MemoryBuilder = ({
    topic, setTopic,
    customPairs, setCustomPairs,
    cardBackImage, setCardBackImage
}) => {

    const addCustomPair = () => {
        if (customPairs.length >= 20) return;
        setCustomPairs([...customPairs, { id: Date.now(), q: '', a: '', image: null }]);
    };

    const removeCustomPair = (id) => setCustomPairs(customPairs.filter(p => p.id !== id));

    const updateCustomPair = (id, field, value) => {
        setCustomPairs(customPairs.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleImageUpload = (id, file) => {
        if (file) updateCustomPair(id, 'image', URL.createObjectURL(file));
    };

    const handleBackImageUpload = (file) => {
        if (file) setCardBackImage(URL.createObjectURL(file));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-4 pb-20">
            {/* Configuração Geral */}
            <div className="bg-white p-4 rounded-xl border border-brown-200 shadow-sm">
                <label className="text-sm text-brown-600 mb-1 block">Título</label>
                <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Nome do Jogo..."
                    className="w-full bg-brown-50 border-brown-200 border rounded p-2 text-brown-900 placeholder-brown-400 outline-none focus:ring-2 focus:ring-brown-300"
                />

                <div className="mt-4 pt-4 border-t border-brown-100">
                    <label className="text-sm text-brown-600 mb-2 block flex items-center gap-2">
                        <LayoutTemplate size={14} /> Capa (Verso)
                    </label>
                    <div className="flex gap-4 items-center">
                        <label className="w-16 h-20 border-2 border-dashed border-brown-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-brown-50 overflow-hidden relative transition-colors bg-brown-50/50">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleBackImageUpload(e.target.files[0])} />
                            {cardBackImage ? <img src={toDirectImageUrl(cardBackImage)} className="w-full h-full object-cover" alt="Back" referrerPolicy="no-referrer" onError={handleDriveImageError} /> : <Upload size={16} className="text-brown-400" />}
                        </label>
                        <span className="text-xs text-brown-500">Imagem comum a todas as cartas.</span>
                        {cardBackImage && <button onClick={() => setCardBackImage(null)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>}
                    </div>
                </div>
            </div>

            {/* Lista de Pares */}
            {customPairs.map((pair, idx) => (
                <div key={pair.id} className="bg-white p-4 rounded-xl border border-brown-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
                    <span className="font-bold text-brown-400 block sm:w-8 text-center">#{idx + 1}</span>

                    <input
                        value={pair.q}
                        onChange={(e) => updateCustomPair(pair.id, 'q', e.target.value)}
                        placeholder="Pergunta"
                        className="flex-1 w-full bg-brown-50 border-brown-200 border rounded p-2 text-sm text-brown-900 outline-none focus:ring-1 focus:ring-brown-300"
                    />

                    <input
                        value={pair.a}
                        onChange={(e) => updateCustomPair(pair.id, 'a', e.target.value)}
                        placeholder="Resposta"
                        className="flex-1 w-full bg-brown-50 border-brown-200 border rounded p-2 text-sm text-brown-900 outline-none focus:ring-1 focus:ring-brown-300"
                    />

                    <div className="flex gap-2 w-full sm:w-auto justify-end sm:justify-start">
                        <label className="w-10 h-10 border border-dashed border-brown-300 rounded flex items-center justify-center cursor-pointer hover:bg-brown-50 overflow-hidden relative shrink-0 transition-colors">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(pair.id, e.target.files[0])} />
                            {pair.image ? <img src={toDirectImageUrl(pair.image)} className="w-full h-full object-cover" alt="Custom" referrerPolicy="no-referrer" onError={handleDriveImageError} /> : <ImageIcon size={14} className="text-brown-400" />}
                        </label>
                        <button onClick={() => removeCustomPair(pair.id)} className="text-brown-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}

            <button onClick={addCustomPair} disabled={customPairs.length >= 20} className="w-full py-3 border-2 border-dashed border-brown-300 rounded-xl text-brown-500 hover:text-brown-700 hover:bg-brown-50 flex justify-center gap-2 transition-colors">
                <Plus size={20} /> Adicionar Par
            </button>
        </div>
    );
};

export default MemoryBuilder;
