import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, BookOpen, Target, Lightbulb, Check, HelpCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * Modal de Edição de Textos das Missões do RPG
 * Permite que o professor ajuste enunciados, narrativas, dicas e opções na hora da aula
 */
export const RPGTextEditModal = ({
    isOpen,
    onClose,
    type = 'story', // 'story' | 'enigma'
    title = 'Editar Texto da Missão',
    initialData = {},
    onSave
}) => {
    const [formData, setFormData] = useState({
        // Campos de História
        titulo_capitulo: '',
        local_cena: '',
        storyText: '',
        // Campos de Enigma
        question: '',
        dica_dracker: '',
        options: [],
        correct_answer: ''
    });

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                titulo_capitulo: initialData.titulo_capitulo || '',
                local_cena: initialData.local_cena || '',
                storyText: initialData.storyText || '',
                question: initialData.question || '',
                dica_dracker: initialData.dica_dracker || '',
                options: Array.isArray(initialData.options) ? [...initialData.options] : [],
                correct_answer: initialData.correct_answer || ''
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleOptionChange = (idx, val) => {
        const next = [...formData.options];
        next[idx] = val;
        setFormData(prev => ({ ...prev, options: next }));
    };

    const handleAddOption = () => {
        setFormData(prev => ({
            ...prev,
            options: [...prev.options, `Nova alternativa ${String.fromCharCode(65 + prev.options.length)}`]
        }));
    };

    const handleRemoveOption = (idx) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== idx)
        }));
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (onSave) {
            onSave(formData);
        }
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-250">
                {/* Cabeçalho */}
                <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 px-6 py-4 flex items-center justify-between text-white shrink-0 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl shadow-inner">
                            {type === 'story' ? <BookOpen className="w-5 h-5 text-amber-100" /> : <Target className="w-5 h-5 text-amber-100" />}
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 block">
                                Editor de Missão do Drácker
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                                {title}
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                        title="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Conteúdo Formulário */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-slate-800">
                    {type === 'story' ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                                        Título do Capítulo
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.titulo_capitulo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, titulo_capitulo: e.target.value }))}
                                        placeholder="Ex: O Mistério Aprofunda"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                                        Local da Cena
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.local_cena}
                                        onChange={(e) => setFormData(prev => ({ ...prev, local_cena: e.target.value }))}
                                        placeholder="Ex: Clareira dos Cristais"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                                    Texto da Narrativa / História da Missão
                                </label>
                                <textarea
                                    value={formData.storyText}
                                    onChange={(e) => setFormData(prev => ({ ...prev, storyText: e.target.value }))}
                                    rows={8}
                                    placeholder="Escreva a narrativa deste capítulo da missão..."
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all resize-y font-medium"
                                    autoFocus
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Dica: Você pode usar quebras de linha e formatar o texto para facilitar a leitura dos estudantes durante a projeção.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-black uppercase text-slate-600 mb-1">
                                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                                    Enunciado / Desafio da Missão
                                </label>
                                <textarea
                                    value={formData.question}
                                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                                    rows={5}
                                    placeholder="Digite o enunciado completo do desafio proposto aos alunos..."
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-y font-bold"
                                    autoFocus
                                />
                            </div>

                            {/* Alternativas (se for múltipla escolha ou tiver opções) */}
                            {formData.options.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-black uppercase text-slate-600">
                                            Alternativas de Resposta
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleAddOption}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Adicionar Alternativa
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.options.map((opt, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                                                    {String.fromCharCode(65 + idx)}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                                                />
                                                {formData.options.length > 2 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveOption(idx)}
                                                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                                        title="Remover alternativa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="flex items-center gap-2 text-xs font-black uppercase text-slate-600 mb-1">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                    Dica do Mestre Drácker (Opcional)
                                </label>
                                <textarea
                                    value={formData.dica_dracker}
                                    onChange={(e) => setFormData(prev => ({ ...prev, dica_dracker: e.target.value }))}
                                    rows={2}
                                    placeholder="Dica ou orientação para auxiliar o esquadrão..."
                                    className="w-full p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs sm:text-sm font-medium text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all resize-y"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                                    Gabarito / Resposta Esperada (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.correct_answer}
                                    onChange={(e) => setFormData(prev => ({ ...prev, correct_answer: e.target.value }))}
                                    placeholder="Resposta correta ou critério para validação do professor..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </>
                    )}

                    {/* Rodapé de Ações */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="rounded-xl px-4 text-slate-600"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-5 font-bold flex items-center gap-1.5 shadow-xs"
                        >
                            <Check className="w-4 h-4" />
                            <span>Salvar Alterações</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
