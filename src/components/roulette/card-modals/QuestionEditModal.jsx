import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Image as ImageIcon, MessageCircle, Info, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { getDirectImageUrl, handleDriveImageError, isYouTubeUrl, getYouTubeEmbedUrl } from '../../../utils/urlUtils';

export const QuestionEditModal = ({
    show,
    onClose,
    question,
    questionData,
    onSave
}) => {
    const targetQuestion = question || questionData;

    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        imageUrl: '',
        difficulty: 'Fácil',
        options: []
    });

    useEffect(() => {
        if (show && targetQuestion) {
            setFormData({
                question: targetQuestion.question || '',
                answer: targetQuestion.answer || '',
                imageUrl: targetQuestion.imageUrl || '',
                difficulty: targetQuestion.difficulty || 'Fácil',
                options: Array.isArray(targetQuestion.options) ? [...targetQuestion.options] : []
            });
        }
    }, [show, targetQuestion]);

    // Fechar com tecla ESC
    useEffect(() => {
        if (!show) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [show, onClose]);

    if (!show) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionChange = (idx, value) => {
        setFormData(prev => {
            const nextOptions = [...(prev.options || [])];
            nextOptions[idx] = value;
            return { ...prev, options: nextOptions };
        });
    };

    const handleAddOption = () => {
        setFormData(prev => ({
            ...prev,
            options: [...(prev.options || []), `Nova Alternativa ${String.fromCharCode(65 + (prev.options?.length || 0))}`]
        }));
    };

    const handleRemoveOption = (idx) => {
        setFormData(prev => ({
            ...prev,
            options: (prev.options || []).filter((_, i) => i !== idx)
        }));
    };

    const handleSave = () => {
        if (onSave) {
            onSave({
                ...(targetQuestion || {}),
                ...formData
            });
        }
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl shadow-inner">
                            <Edit3 className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 block">
                                Editor de Questão
                            </span>
                            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                                Editar Pergunta da Rodada
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                        title="Fechar"
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
                            Enunciado da Pergunta
                        </label>
                        <textarea
                            value={formData.question}
                            onChange={(e) => handleChange('question', e.target.value)}
                            placeholder="Ex: Qual é a capital do Brasil? [IMG]"
                            className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none font-medium text-slate-800"
                            autoFocus
                        />
                        <p className="text-[11px] text-slate-500 font-medium px-2">
                            Dica: Digite <strong className="text-indigo-600 bg-indigo-50 px-1 rounded">[IMG]</strong> ou <strong className="text-indigo-600 bg-indigo-50 px-1 rounded">[YT]</strong> no meio do texto para escolher onde a mídia vai aparecer! Você também pode ajustar o tamanho usando <strong className="text-indigo-600 bg-indigo-50 px-1 rounded">[IMG=300]</strong>.
                        </p>
                    </div>

                    {/* Alternativas (se houver ou se desejar adicionar) */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs font-black uppercase text-slate-700 tracking-wider">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Alternativas de Múltipla Escolha (Opcional)
                            </label>
                            <button
                                type="button"
                                onClick={handleAddOption}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" /> Adicionar Alternativa
                            </button>
                        </div>

                        {formData.options && formData.options.length > 0 ? (
                            <div className="space-y-2">
                                {formData.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200">
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            placeholder={`Opção ${String.fromCharCode(65 + idx)}...`}
                                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(idx)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                            title="Remover alternativa"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">
                                Nenhuma alternativa cadastrada (pergunta aberta / dissertativa).
                            </p>
                        )}
                    </div>

                    {/* Resposta Esperada */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Info className="w-4 h-4 text-emerald-500" />
                            Resposta Esperada (Gabarito / Orientação para o Professor)
                        </label>
                        <textarea
                            value={formData.answer}
                            onChange={(e) => handleChange('answer', e.target.value)}
                            placeholder="Resposta de referência para o professor..."
                            className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all resize-none text-slate-800 font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Imagem ou Vídeo */}
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
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all text-slate-800"
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
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-bold text-slate-700 cursor-pointer"
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
