import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';

export const RouletteQuestionsEditorModal = ({ isOpen, onClose, activeActivity, updateActivityData }) => {
    // Trabalharemos com uma cópia local durante a edição
    const [localQuestions, setLocalQuestions] = useState([]);

    useEffect(() => {
        if (isOpen && activeActivity?.questions) {
            // Como as perguntas podem ser duplicadas pela IA original ou distribuídas sequencialmente,
            // vamos editar o array único de perguntas.
            const uniqueMap = new Map();
            activeActivity.questions.forEach(q => {
                if (!uniqueMap.has(q.question)) {
                    uniqueMap.set(q.question, q);
                }
            });
            const uniqueQuestions = Array.from(uniqueMap.values());
            
            // Inicializar estado local copiando as propriedades essenciais
            setLocalQuestions(uniqueQuestions.map(q => ({
                id: q.id || Math.random().toString(36).substr(2, 9),
                question: q.question,
                imageUrl: q.imageUrl || '',
                name: q.name || '' // keep for legacy compatibility
            })));
        }
    }, [isOpen, activeActivity]);

    const handleQuestionChange = (id, newText) => {
        setLocalQuestions(prev => prev.map(q => q.id === id ? { ...q, question: newText } : q));
    };

    const formatImageUrl = (url) => {
        if (!url) return '';
        // Converte link de visualização do Google Drive para link de imagem direto (uc?export=view)
        const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (matchFile && matchFile[1]) {
            return `https://drive.google.com/uc?export=view&id=${matchFile[1]}`;
        }
        const matchId = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (url.includes('drive.google.com') && matchId && matchId[1]) {
            return `https://drive.google.com/uc?export=view&id=${matchId[1]}`;
        }
        return url;
    };

    const handleImageUrlChange = (id, newUrl) => {
        const formattedUrl = formatImageUrl(newUrl);
        setLocalQuestions(prev => prev.map(q => q.id === id ? { ...q, imageUrl: formattedUrl } : q));
    };

    const handleAddQuestion = () => {
        setLocalQuestions(prev => [
            ...prev,
            {
                id: Math.random().toString(36).substr(2, 9),
                question: '',
                imageUrl: '',
                name: ''
            }
        ]);
    };

    const handleSave = () => {
        if (!activeActivity || !updateActivityData) return;
        
        // Vamos reconstruir o array `questions` para salvar na tab
        // Note: Se o array original tinha "nomes" associados, o RouletteActivity agora ignora os nomes 
        // e usa sequencialmente, então apenas atualizar o array único é suficiente.
        updateActivityData(activeActivity.id, {
            questions: localQuestions
        });
        
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Perguntas da Roleta" maxWidth="max-w-4xl" icon={Save}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="font-bold">Dica de Imagens</h4>
                        <p className="text-sm">Você pode colar o endereço (URL) de uma imagem da internet para ser exibida junto com a pergunta no momento do sorteio.</p>
                    </div>
                </div>

                {localQuestions.map((q, index) => (
                    <div key={q.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold text-sm">
                                Pergunta {index + 1}
                            </span>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Texto da Pergunta</label>
                            <textarea 
                                value={q.question}
                                onChange={(e) => handleQuestionChange(q.id, e.target.value)}
                                rows={2}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium text-slate-800"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                                <ImageIcon className="w-4 h-4 text-slate-400" /> URL da Imagem (Opcional)
                            </label>
                            <div className="flex gap-4">
                                <input 
                                    type="text"
                                    value={q.imageUrl}
                                    onChange={(e) => handleImageUrlChange(q.id, e.target.value)}
                                    placeholder="https://exemplo.com/imagem.png"
                                    className="flex-1 p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                                {q.imageUrl && (
                                    <div className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-white flex items-center justify-center relative group">
                                        <img src={q.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                                        <button onClick={() => handleImageUrlChange(q.id, '')} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {localQuestions.length === 0 && (
                    <p className="text-center text-slate-400 italic py-8">Nenhuma pergunta encontrada.</p>
                )}

                <div className="flex justify-center mt-4">
                    <button
                        onClick={handleAddQuestion}
                        className="px-4 py-2 border-2 border-indigo-200 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2"
                    >
                        + Adicionar Nova Pergunta
                    </button>
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                </button>
            </div>
        </Modal>
    );
};
