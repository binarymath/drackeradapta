import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Image as ImageIcon, MessageCircle, Info } from 'lucide-react';
import { getDirectImageUrl, handleDriveImageError, isYouTubeUrl, getYouTubeEmbedUrl } from '../../../utils/urlUtils';

export const QuestionEditModal = ({
    show,
    onClose,
    question,
    onSave
}) => {
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        imageUrl: '',
        difficulty: 'Fácil'
    });

    useEffect(() => {
        if (show && question) {
            setFormData({
                question: question.question || '',
                answer: question.answer || '',
                imageUrl: question.imageUrl || '',
                difficulty: question.difficulty || 'Fácil'
            });
        }
    }, [show, question]);

    if (!show) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Edit3 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black">Editar Questão</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-slate-800">
                    
                    {/* Pergunta */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <MessageCircle className="w-4 h-4 text-indigo-500" />
                            Pergunta
                        </label>
                        <textarea
                            value={formData.question}
                            onChange={(e) => handleChange('question', e.target.value)}
                            placeholder="Ex: Qual é a capital do Brasil? [IMG]"
                            className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none font-medium"
                            autoFocus
                        />
                        <p className="text-[11px] text-slate-500 font-medium px-2">
                            Dica: Digite <strong className="text-indigo-600 bg-indigo-50 px-1 rounded">[IMG]</strong> ou <strong className="text-indigo-600 bg-indigo-50 px-1 rounded">[YT]</strong> no meio do texto para escolher onde a mídia vai aparecer! Você também pode ajustar o tamanho usando <strong className="text-indigo-600 bg-indigo-50 px-1 rounded">[IMG=300]</strong>.
                        </p>
                    </div>

                    {/* Resposta Esperada */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Info className="w-4 h-4 text-emerald-500" />
                            Resposta Esperada (Opcional)
                        </label>
                        <textarea
                            value={formData.answer}
                            onChange={(e) => handleChange('answer', e.target.value)}
                            placeholder="Resposta de referência para o professor..."
                            className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Imagem */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <ImageIcon className="w-4 h-4 text-rose-500" />
                                Link da Imagem ou YouTube (Opcional)
                            </label>
                            <input
                                type="url"
                                value={formData.imageUrl}
                                onChange={(e) => handleChange('imageUrl', e.target.value)}
                                placeholder="https://..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all"
                            />
                            {formData.imageUrl && (
                                <div className="mt-2 h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center p-2">
                                    {isYouTubeUrl(formData.imageUrl) ? (
                                        <iframe 
                                            src={getYouTubeEmbedUrl(formData.imageUrl)} 
                                            className="w-full h-full rounded-lg shadow-sm"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <img 
                                            src={getDirectImageUrl(formData.imageUrl)} 
                                            alt="Preview" 
                                            className="max-h-full max-w-full object-contain rounded-lg shadow-sm" 
                                            referrerPolicy="no-referrer"
                                            onError={handleDriveImageError}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Dificuldade */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                📊 Dificuldade
                            </label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => handleChange('difficulty', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-bold text-slate-700"
                            >
                                <option value="Fácil">Fácil</option>
                                <option value="Médio">Médio</option>
                                <option value="Difícil">Difícil</option>
                            </select>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        Salvar Alterações
                    </button>
                </div>

            </div>
        </div>
    );
};
