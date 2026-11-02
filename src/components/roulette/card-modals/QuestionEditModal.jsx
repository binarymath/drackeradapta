import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Edit3, Image as ImageIcon, MessageCircle, Info, Plus, Trash2, CheckCircle2, Upload, Type, Eye, Bold } from 'lucide-react';
import { getDirectImageUrl, handleDriveImageError, isYouTubeUrl, getYouTubeEmbedUrl, toDirectImageUrl, renderQuestionText, normalizeSnippetTags } from '../../../utils/urlUtils';

export const QuestionEditModal = ({
    show,
    onClose,
    question,
    questionData,
    onSave
}) => {
    const targetQuestion = question || questionData;
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const [showPreview, setShowPreview] = useState(true);

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

    const handleImageUrlChange = (val) => {
        const trimmed = (val || '').trim();
        const formatted = toDirectImageUrl(trimmed);
        setFormData(prev => ({ ...prev, imageUrl: formatted }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result;
            if (dataUrl) {
                setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleClearImage = () => {
        setFormData(prev => ({ ...prev, imageUrl: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
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

    const applySnippetTag = (openTag, closeTag = '') => {
        const el = textareaRef.current;
        if (!el) {
            setFormData(prev => ({ ...prev, question: (prev.question || '') + `${openTag}trecho${closeTag}` }));
            return;
        }

        const start = el.selectionStart || 0;
        const end = el.selectionEnd || 0;
        const currentText = formData.question || '';
        const selectedText = currentText.substring(start, end);

        let prefix = '';
        let suffix = '';
        let inner = selectedText;

        if (inner) {
            const leadMatch = inner.match(/^(\s+)/);
            if (leadMatch) {
                prefix = leadMatch[0];
                inner = inner.slice(prefix.length);
            }
            const trailMatch = inner.match(/(\s+)$/);
            if (trailMatch) {
                suffix = trailMatch[0];
                inner = inner.slice(0, -suffix.length);
            }
        }

        const innerContent = inner || 'trecho';
        const replacement = `${prefix}${openTag}${innerContent}${closeTag}${suffix}`;

        const newText = currentText.substring(0, start) + replacement + currentText.substring(end);
        setFormData(prev => ({ ...prev, question: newText }));

        setTimeout(() => {
            el.focus();
            const selStart = start + prefix.length + openTag.length;
            const selEnd = selStart + innerContent.length;
            el.setSelectionRange(selStart, selEnd);
        }, 20);
    };

    const handleCustomSizePrompt = () => {
        const custom = window.prompt("Digite o tamanho do trecho em porcentagem (Ex: 150 para 150%, 80 para 80%, ou 200 para o dobro):", "150");
        if (!custom) return;
        const num = parseInt(custom.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > 0) {
            applySnippetTag(`[TAM=${num}]`, `[/TAM]`);
        }
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
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <MessageCircle className="w-4 h-4 text-indigo-500" />
                                Enunciado da Pergunta
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPreview(prev => !prev)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
                            >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{showPreview ? 'Ocultar Prévia' : 'Ver Prévia'}</span>
                            </button>
                        </div>

                        {/* Barra de Ajuste de Tamanho de Trechos */}
                        <div className="flex items-center gap-1.5 flex-wrap p-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-black mr-1 flex items-center gap-1">
                                <Type className="w-3.5 h-3.5 text-indigo-600" />
                                Tamanho do Trecho:
                            </span>
                            
                            <button
                                type="button"
                                onClick={() => applySnippetTag('[TAM=160]', '[/TAM]')}
                                className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Aumentar trecho selecionado (+60%)"
                            >
                                <span className="text-sm font-black text-indigo-700">A+</span>
                                <span className="text-[10px] text-slate-500 font-semibold">160%</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => applySnippetTag('[TAM=130]', '[/TAM]')}
                                className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Aumentar um pouco o trecho selecionado (+30%)"
                            >
                                <span className="text-xs font-black text-indigo-600">A</span>
                                <span className="text-[10px] text-slate-500 font-semibold">130%</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => applySnippetTag('[TAM=200]', '[/TAM]')}
                                className="px-2 py-1 bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Dobrar tamanho do trecho (200% - Destaque Gigante)"
                            >
                                <span className="text-sm font-black text-purple-700">A++</span>
                                <span className="text-[10px] text-slate-500 font-semibold">200%</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => applySnippetTag('[TAM=75]', '[/TAM]')}
                                className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Diminuir trecho selecionado (-25%)"
                            >
                                <span className="text-xs font-black text-slate-600">A-</span>
                                <span className="text-[10px] text-slate-500 font-semibold">75%</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => applySnippetTag('[TAM=60]', '[/TAM]')}
                                className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                                title="Reduzir bastante o trecho selecionado (60%)"
                            >
                                <span className="text-[10px] font-black text-slate-500">A--</span>
                                <span className="text-[10px] text-slate-500 font-semibold">60%</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleCustomSizePrompt}
                                className="px-2 py-1 bg-white hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 border border-slate-200 rounded-lg shadow-2xs text-[11px] font-bold text-amber-700 transition-all cursor-pointer"
                                title="Definir outra porcentagem personalizada para o trecho"
                            >
                                Outro %...
                            </button>

                            <div className="w-px h-4 bg-slate-300 mx-0.5" />

                            <button
                                type="button"
                                onClick={() => applySnippetTag('[B]', '[/B]')}
                                className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg shadow-2xs text-[11px] font-black text-slate-800 transition-all cursor-pointer flex items-center gap-0.5"
                                title="Negrito no trecho"
                            >
                                <Bold className="w-3 h-3" /> Negrito
                            </button>

                            <button
                                type="button"
                                onClick={() => applySnippetTag('[C]', '')}
                                className="px-2 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg shadow-2xs text-[11px] font-bold text-slate-700 transition-all cursor-pointer"
                                title="Centralizar esta linha ([C])"
                            >
                                [C] Centro
                            </button>

                            <button
                                type="button"
                                onClick={() => applySnippetTag(' [IMG] ', '')}
                                className="px-2 py-1 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 rounded-lg shadow-2xs text-[11px] font-bold text-rose-600 transition-all cursor-pointer flex items-center gap-1"
                                title="Posicionar a imagem neste trecho ([IMG])"
                            >
                                <ImageIcon className="w-3 h-3" /> [IMG]
                            </button>
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={formData.question}
                            onChange={(e) => handleChange('question', e.target.value)}
                            placeholder="Ex: Qual é a capital do Brasil? Selecione um trecho e clique em A+ para aumentá-lo!"
                            className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none font-medium text-slate-800 text-sm"
                            autoFocus
                        />

                        {/* Prévia ao vivo formatada */}
                        {showPreview && formData.question && (
                            <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-1">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">
                                    👁️ Prévia ao vivo da formatação:
                                </span>
                                <div className="text-slate-800 font-bold leading-relaxed whitespace-pre-wrap text-base">
                                    {normalizeSnippetTags(formData.question || '').split('\n').map((line, idx) => {
                                        let align = 'text-left';
                                        let c = line;
                                        if (c.trim().startsWith('[C]')) { align = 'text-center'; c = c.replace('[C]', ''); }
                                        else if (c.trim().startsWith('[R]')) { align = 'text-right'; c = c.replace('[R]', ''); }
                                        else if (c.trim().startsWith('[J]')) { align = 'text-justify'; c = c.replace('[J]', ''); }
                                        return (
                                            <div key={idx} className={align}>
                                                {renderQuestionText(c, formData.imageUrl)}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <p className="text-[11px] text-slate-500 font-medium px-1 leading-relaxed">
                            💡 <strong>Dica:</strong> Para aumentar ou diminuir qualquer parte da pergunta, <strong>selecione as palavras com o mouse</strong> e clique em <strong>A+ (160%)</strong>, <strong>A (130%)</strong>, <strong>A++ (200%)</strong> ou <strong>A- (75%)</strong>. Você também pode digitar manualmente <code className="text-indigo-600 bg-indigo-50 px-1 rounded">[TAM=150]seu texto[/TAM]</code> ou <code className="text-indigo-600 bg-indigo-50 px-1 rounded">[TAM=80]seu texto[/TAM]</code>.
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
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <ImageIcon className="w-4 h-4 text-rose-500" />
                                    Imagem ou Vídeo (Opcional)
                                </label>
                                {formData.imageUrl && (
                                    <button
                                        type="button"
                                        onClick={handleClearImage}
                                        className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200"
                                        title="Remover imagem"
                                    >
                                        <Trash2 className="w-3 h-3" /> Remover Mídia
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.imageUrl}
                                    onChange={(e) => handleImageUrlChange(e.target.value)}
                                    placeholder="Cole link da imagem, Drive ou YouTube..."
                                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all text-xs text-slate-800 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-300 hover:border-indigo-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                                    title="Carregar imagem do seu computador"
                                >
                                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Do PC</span>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            {formData.imageUrl && (
                                <div className="mt-2 h-36 rounded-xl border-2 border-indigo-100 overflow-hidden bg-slate-100 flex items-center justify-center p-2 relative shadow-inner">
                                    {isYouTubeUrl(formData.imageUrl) ? (
                                        <iframe 
                                            src={getYouTubeEmbedUrl(formData.imageUrl)} 
                                            className="w-full h-full rounded-lg shadow-sm"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <img 
                                            src={formData.imageUrl.startsWith('data:') ? formData.imageUrl : getDirectImageUrl(formData.imageUrl)} 
                                            alt="Preview" 
                                            className="max-h-full max-w-full object-contain rounded-lg shadow-sm" 
                                            referrerPolicy="no-referrer"
                                            onError={formData.imageUrl.startsWith('data:') ? undefined : handleDriveImageError}
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
