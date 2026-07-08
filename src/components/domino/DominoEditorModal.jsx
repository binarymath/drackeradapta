import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Plus, Trash2, Image as ImageIcon, Type, Calculator, CheckCircle, Link2, ArrowRight, HelpCircle, RefreshCw } from 'lucide-react';
import { useGemini } from '../../contexts/GeminiContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { LatexRenderer } from '../ui/LatexRenderer';

import { toDirectImageUrl, handleDriveImageError } from '../../utils/urlUtils';
export { toDirectImageUrl, handleDriveImageError };



export const DominoEditorModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [pairs, setPairs] = useState([]);
    const [topicInput, setTopicInput] = useState('');
    const [lessonDetailsInput, setLessonDetailsInput] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isCircular, setIsCircular] = useState(false);
    const [textFontSize, setTextFontSize] = useState(initialData?.textFontSize || initialData?.fontSizePx || 14);
    const [mathFontSize, setMathFontSize] = useState(initialData?.mathFontSize || initialData?.fontSizePx || 18);

    const { geminiService, selectedModel } = useGemini();
    const requiredPairs = isCircular ? 28 : 27;

    useEffect(() => {
        if (isOpen) {
            setTopicInput(initialData?.topic || '');
            setLessonDetailsInput(initialData?.lessonDetails || '');
            setTextFontSize(initialData?.textFontSize || initialData?.fontSizePx || 14);
            setMathFontSize(initialData?.mathFontSize || initialData?.fontSizePx || 18);
            
            if (initialData?.pairs && initialData.pairs.length > 0) {
                setPairs(initialData.pairs);
                setIsCircular(initialData.isCircular || false);
            } else {
                setPairs([{ id: `pair-${Date.now()}`, question: { type: 'text', content: '' }, answer: { type: 'text', content: '' } }]);
            }
        }
    }, [isOpen, initialData]);

    const handleAddPair = () => {
        setPairs([...pairs, { id: `pair-${Date.now()}`, question: { type: 'text', content: '' }, answer: { type: 'text', content: '' } }]);
    };

    const handleRemovePair = (index) => {
        const newPairs = [...pairs];
        newPairs.splice(index, 1);
        setPairs(newPairs);
    };

    const handleChangeContent = (index, side, field, value) => {
        const newPairs = [...pairs];
        newPairs[index][side][field] = field === 'content' && newPairs[index][side].type === 'image' ? toDirectImageUrl(value) : value;
        setPairs(newPairs);
    };

    const handleImageUpload = (index, side, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const newPairs = [...pairs];
            newPairs[index][side].content = e.target.result;
            newPairs[index][side].type = 'image';
            setPairs(newPairs);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerateAI = async () => {
        if (!topicInput) {
            alert("Por favor, digite um Tema primeiro para a Inteligência Artificial saber o que gerar.");
            return;
        }
        if (!geminiService || !geminiService.apiKey) {
            alert("Por favor, configure sua chave de API nas configurações primeiro.");
            return;
        }

        setIsGeneratingAI(true);
        try {
            const prompt = `Você é um gerador de atividades educativas de excelência.
Gere EXATAMENTE ${requiredPairs} pares de pergunta e resposta para um jogo de Dominó Educativo sobre o tema: "${topicInput}".
${lessonDetailsInput ? `Utilize este contexto/texto base para formular as perguntas e respostas:\n${lessonDetailsInput}` : ''}
É OBRIGATÓRIO gerar exatamente ${requiredPairs} itens para que o jogo tenha perfeitamente 28 peças no total. 
Cada par deve ser independente e ter uma resposta curta e direta.
IMPORTANTE - FORMATAÇÃO MATEMÁTICA E CIENTÍFICA (LaTeX):
Se o tema envolver matemática, física, química, ciências exatas ou cálculos, você DEVE formatar todas as fórmulas, equações, frações, raízes, potências e funções utilizando a sintaxe oficial LaTeX (ex: \\frac{3}{4}, \\sqrt{16}, x^2 + 2x + 1 = 0, \\sin(\\theta), etc.).
Quando um par ou item contiver fórmula matemática ou notação científica, defina o campo "type" como "formula".

Retorne APENAS um array JSON com exatamente ${requiredPairs} objetos, sem formatação markdown extra, neste formato exato:
[
  { "question": "\\frac{1}{2} + \\frac{1}{2}", "answer": "1", "type": "formula" },
  { "question": "Qual é a capital do Brasil?", "answer": "Brasília", "type": "text" }
]`;

            const { safeJSONParse } = await import('../../utils/jsonUtils');
            
            const text = await geminiService.generateText(prompt, {
                model: selectedModel,
                maxOutputTokens: 8000,
                temperature: 0.7,
                responseMimeType: "application/json"
            });

            const responseData = safeJSONParse(text);
            if (!responseData) {
                throw new Error("A IA não retornou dados válidos. Tente novamente.");
            }
            
            let list = [];
            if (Array.isArray(responseData)) list = responseData;
            else if (responseData.pairs) list = responseData.pairs;
            else if (responseData.data) list = responseData.data;

            if (list.length > requiredPairs) {
                list = list.slice(0, requiredPairs);
            }
            if (list.length < requiredPairs) {
                alert(`A IA gerou apenas ${list.length} pares. Precisamos de exatamente ${requiredPairs}. Adicione os faltantes manualmente na lista abaixo.`);
            }

            const mappedPairs = list.map((p, idx) => {
                const qContent = (p.question?.content || p.question || p.pergunta || '').toString();
                const aContent = (p.answer?.content || p.answer || p.resposta || '').toString();
                const isQFormula = p.type === 'formula' || p.type === 'math' || p.question_type === 'formula' || p.question_type === 'math' || /\\frac|\\sqrt|\\sin|\\cos|\^|_|\\alpha|\\beta|\\pi/.test(qContent);
                const isAFormula = p.type === 'formula' || p.type === 'math' || p.answer_type === 'formula' || p.answer_type === 'math' || /\\frac|\\sqrt|\\sin|\\cos|\^|_|\\alpha|\\beta|\\pi/.test(aContent);
                return { 
                    id: `ai-pair-${Date.now()}-${idx}`,
                    question: { type: isQFormula ? 'formula' : (p.question?.type || 'text'), content: qContent },
                    answer: { type: isAFormula ? 'formula' : (p.answer?.type || 'text'), content: aContent }
                };
            });
            
            setPairs(mappedPairs);
        } catch (e) {
            console.error("Erro na IA:", e);
            alert("Erro ao gerar com IA: " + e.message);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleSave = () => {
        if (pairs.length < requiredPairs) {
            alert(`Atenção: O jogo requer exatamente 28 peças (Pares gerados: ${pairs.length}). Faltam ${requiredPairs - pairs.length} pares para fechar o jogo perfeitamente.`);
            return;
        }

        onSave({ pairs, isCircular, topic: topicInput, lessonDetails: lessonDetailsInput, textFontSize, mathFontSize, fontSizePx: textFontSize });
    };

    const piecesCount = isCircular ? pairs.length : pairs.length + 1;
    const progressPercentage = Math.min(100, (pairs.length / requiredPairs) * 100);

    const footer = (
        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 pt-2">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <div className="text-sm font-bold text-slate-700 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span>Progresso do Jogo:</span>
                        <span className="text-indigo-600 font-black">{pairs.length} / {requiredPairs} pares</span>
                    </div>
                    <div className="w-56 h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${pairs.length >= requiredPairs ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} 
                            style={{ width: progressPercentage + "%" }}
                        />
                    </div>
                </div>
                <div className="bg-indigo-900 text-white px-4 py-2 rounded-xl font-black text-sm shadow-md flex items-center gap-2">
                    <span>🁫 Total Peças:</span>
                    <span className="text-amber-400 text-base">{piecesCount} / 28</span>
                </div>
            </div>

            <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
                <Button onClick={onClose} variant="secondary" className="px-5 py-2.5 rounded-xl font-bold">Cancelar</Button>
                <Button 
                    onClick={handleSave} 
                    icon={Save} 
                    disabled={pairs.length < requiredPairs}
                    className={`px-6 py-2.5 rounded-xl font-black shadow-lg transition-all ${
                        pairs.length >= requiredPairs 
                            ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white hover:shadow-emerald-500/20' 
                            : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    }`}
                >
                    Salvar e Publicar Dominó
                </Button>
            </div>
        </div>
    );

    const renderSideInput = (index, side) => {
        const item = pairs[index][side];
        const isQuestion = side === 'question';
        
        return (
            <div className={`flex flex-col gap-3.5 flex-1 p-4 sm:p-5 rounded-2xl border-2 transition-all ${
                isQuestion 
                    ? 'bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 border-blue-200/90 shadow-sm hover:border-blue-400' 
                    : 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border-emerald-200/90 shadow-sm hover:border-emerald-400'
            }`}>
                <div className="flex flex-wrap justify-between items-center gap-2 border-b pb-3 border-slate-200/80">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{isQuestion ? '🔵' : '🟢'}</span>
                        <div className="flex flex-col">
                            <span className={`text-xs font-black uppercase tracking-wider ${isQuestion ? 'text-blue-800' : 'text-emerald-800'}`}>
                                {isQuestion ? 'Lado A (Pergunta)' : 'Lado B (Resposta)'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                                {isQuestion ? 'Inicia a conexão da peça' : 'Conecta com a próxima peça'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-2xs">
                        <button 
                            type="button"
                            onClick={() => handleChangeContent(index, side, 'type', 'text')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                item.type === 'text' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'
                            }`}
                        >
                            <Type size={14} />
                            <span>Texto</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => handleChangeContent(index, side, 'type', 'formula')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                item.type === 'formula' || item.type === 'math' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'
                            }`}
                        >
                            <Calculator size={14} />
                            <span>Fórmula</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => handleChangeContent(index, side, 'type', 'image')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                item.type === 'image' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'
                            }`}
                        >
                            <ImageIcon size={14} />
                            <span>Imagem / URL</span>
                        </button>
                    </div>
                </div>

                {item.type === 'image' ? (
                    <div className="flex flex-col gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <span className="text-purple-600">🔗</span>
                            <span>Insira o link da imagem (Google Drive ou Web) ou faça Upload:</span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="relative flex-1">
                                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Cole aqui o link (ex: drive.google.com/file/d/...)"
                                    value={item.content || ''}
                                    onChange={(e) => handleChangeContent(index, side, 'content', e.target.value)}
                                    className="w-full text-xs pl-9 pr-3 py-3 border border-slate-200 rounded-xl outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 font-mono text-slate-800 bg-slate-50/50 transition-all"
                                />
                            </div>
                            <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm hover:shadow-md">
                                <ImageIcon size={15} />
                                <span>Anexar Arquivo</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleImageUpload(index, side, e.target.files[0])}
                                />
                            </label>
                        </div>

                        {item.content ? (
                            <div className="p-3 bg-slate-50/90 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
                                <div className="h-24 w-36 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center p-1.5 shadow-2xs shrink-0">
                                    <img 
                                        src={toDirectImageUrl(item.content)} 
                                        alt="Preview" 
                                        className="max-h-full max-w-full object-contain drop-shadow-xs" 
                                        referrerPolicy="no-referrer"
                                        onError={handleDriveImageError}
                                    />
                                </div>
                                <div className="flex-1 min-w-0 text-center sm:text-left">
                                    <span className="text-xs font-black text-emerald-600 flex items-center justify-center sm:justify-start gap-1">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Imagem Carregada e Ativa no Dominó</span>
                                    </span>
                                    <p className="text-[11px] text-slate-500 truncate font-mono mt-1 bg-white p-1.5 rounded-lg border border-slate-200/80">{item.content}</p>
                                    <span className="text-[10px] font-bold text-purple-700 mt-1 inline-block">✨ Conversão automática do Google Drive ativada</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleChangeContent(index, side, 'content', '')}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shrink-0"
                                >
                                    🗑️ Remover
                                </button>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500 text-center py-3.5 bg-purple-50/40 rounded-xl border border-dashed border-purple-200 px-3">
                                💡 <strong>Dica do Google Drive:</strong> Cole qualquer link compartilhado (<code className="text-purple-700 font-bold">drive.google.com/file/d/...</code>) que o sistema transforma na imagem correta automaticamente!
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 flex-1">
                        <textarea
                            className="w-full text-sm p-3.5 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 resize-none flex-1 font-medium text-slate-800 bg-white shadow-2xs min-h-[90px] transition-all"
                            rows={3}
                            placeholder={item.type === 'formula' || item.type === 'math' ? "Ex: \\frac{3}{4} + \\sqrt{16} = \\dots (use sintaxe LaTeX para fórmulas)" : isQuestion ? "Digite aqui a pergunta, conceito ou problema da peça..." : "Digite aqui a resposta que se conectará com esta peça..."}
                            value={item.content}
                            onChange={(e) => handleChangeContent(index, side, 'content', e.target.value)}
                        />
                        {(item.type === 'formula' || item.type === 'math') && (
                            <div className="flex flex-col gap-1.5 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 shadow-2xs animate-in fade-in duration-200">
                                <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                                    <span className="flex items-center gap-1">✨ Pré-visualização da Fórmula (LaTeX):</span>
                                    <span className="text-[10px] bg-amber-200/60 px-2 py-0.5 rounded text-amber-900 font-mono">KaTeX Ativo</span>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-amber-200/60 min-h-[48px] flex items-center justify-center text-center overflow-x-auto">
                                    {item.content ? (
                                        <LatexRenderer content={item.content} mathFontSize={mathFontSize} textFontSize={textFontSize} className="font-bold text-slate-800" />
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Digite uma fórmula ou equação acima para ver o resultado...</span>
                                    )}
                                </div>
                                <div className="text-[10px] text-amber-700/80 font-medium">
                                    💡 <strong>Dica LaTeX:</strong> Use <code className="bg-amber-100 px-1 rounded font-mono">\frac&#123;a&#125;&#123;b&#125;</code> para frações, <code className="bg-amber-100 px-1 rounded font-mono">\sqrt&#123;x&#125;</code> para raiz, <code className="bg-amber-100 px-1 rounded font-mono">x^2</code> para potência, ou digite equações diretamente!
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Estúdio de Criação de Dominó Pedagógico"
            icon={CheckCircle}
            size="2xl"
            footer={footer}
        >
            <div className="space-y-8 pb-4">
                {/* Painel Superior Hero - Estúdio */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-500/30 flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                        <div>
                            <span className="bg-indigo-500/20 text-indigo-300 text-xs font-black px-3 py-1 rounded-full border border-indigo-400/30 uppercase tracking-widest inline-block mb-2">
                                ✨ Design & Lógica Pedagógica
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Estúdio de Dominó Interativo</h2>
                            <p className="text-sm text-slate-300 font-medium mt-1 max-w-2xl">
                                Configure conexões dinâmicas! No dominó, o <strong className="text-emerald-400 font-bold">Lado B (Resposta)</strong> de uma peça se conectará perfeitamente com o <strong className="text-blue-400 font-bold">Lado A (Pergunta)</strong> da próxima peça.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center shrink-0">
                            <span className="text-xs text-slate-300 font-bold block uppercase tracking-wider">Total Necessário</span>
                            <span className="text-2xl font-black text-amber-400">{requiredPairs} Peças</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10 pt-2 border-t border-white/10">
                        <div className="md:col-span-6 space-y-2">
                            <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider">1. Disciplina / Tema da Aula</label>
                            <input
                                type="text"
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                placeholder="Ex: Equações de 1º Grau, Geometria Básica, Sinônimos..."
                                className="w-full text-base font-bold p-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-400 outline-none focus:border-amber-400 focus:bg-white/15 transition-all shadow-inner"
                            />
                        </div>
                        <div className="md:col-span-6 space-y-2">
                            <label className="block text-xs font-bold text-indigo-200 uppercase tracking-wider">2. Texto Base ou Regras (Para a IA)</label>
                            <textarea
                                value={lessonDetailsInput}
                                onChange={(e) => setLessonDetailsInput(e.target.value)}
                                placeholder="Opcional. Cole regras específicas, contexto ou o texto base que a Inteligência Artificial deve utilizar..."
                                className="w-full text-xs font-medium p-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-400 outline-none focus:border-amber-400 focus:bg-white/15 transition-all h-[52px] resize-none shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 pt-2 border-t border-white/10 relative z-10">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 bg-white/5 rounded-2xl border border-white/10 flex-1 justify-between">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={isCircular}
                                    onChange={(e) => setIsCircular(e.target.checked)}
                                    className="w-5 h-5 text-amber-500 border-white/30 rounded focus:ring-amber-400 accent-amber-500"
                                />
                                <div className="flex flex-col">
                                    <span className="font-black text-white text-sm">Dominó Circular (Ciclo Fechado)</span>
                                    <span className="text-xs text-slate-300">
                                        {isCircular 
                                            ? '♻️ A última resposta conectará de volta com a primeira pergunta do jogo.' 
                                            : '➡️ Cadeia linear com peças explícitas de INÍCIO e FIM nas pontas.'}
                                    </span>
                                </div>
                            </label>

                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-white/10 text-xs font-bold text-slate-200">
                                    <span>📝 Texto:</span>
                                    <select
                                        value={textFontSize}
                                        onChange={(e) => setTextFontSize(Number(e.target.value))}
                                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-black text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                                    >
                                        <option value={12}>12 px</option>
                                        <option value={14}>14 px</option>
                                        <option value={16}>16 px</option>
                                        <option value={18}>18 px</option>
                                        <option value={20}>20 px</option>
                                        <option value={22}>22 px</option>
                                        <option value={24}>24 px</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-white/10 text-xs font-bold text-slate-200">
                                    <span>🧮 Fórmula:</span>
                                    <select
                                        value={mathFontSize}
                                        onChange={(e) => setMathFontSize(Number(e.target.value))}
                                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-black text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                                    >
                                        <option value={14}>14 px</option>
                                        <option value={16}>16 px</option>
                                        <option value={18}>18 px</option>
                                        <option value={20}>20 px</option>
                                        <option value={22}>22 px</option>
                                        <option value={24}>24 px</option>
                                        <option value={28}>28 px</option>
                                        <option value={32}>32 px</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <Button 
                            onClick={handleGenerateAI} 
                            className="bg-gradient-to-r from-purple-500 via-indigo-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black px-8 py-4 rounded-2xl shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2.5 text-base shrink-0 border border-white/20"
                            icon={Sparkles}
                            disabled={isGeneratingAI}
                        >
                            {isGeneratingAI ? '⚡ IA Gerando Peças...' : "✨ Gerar 28 Peças Automaticamente (IA)"}
                        </Button>
                    </div>
                </div>

                {/* Lista de Peças em Formato de Cards Realistas */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-100/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 sticky top-0 z-20 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-xs">🁫</span>
                            <div>
                                <h3 className="font-black text-slate-900 text-base">Mesa de Peças do Dominó</h3>
                                <p className="text-xs text-slate-500 font-medium">Cada card representa uma peça física que será recortada pelos alunos.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="text-xs font-bold bg-white text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                💡 Lado A (Esquerda) conecta com Lado B (Direita)
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 pb-6 custom-scrollbar">
                        {pairs.map((pair, idx) => (
                            <div 
                                key={pair.id} 
                                className="bg-white rounded-3xl border-2 border-slate-200/80 shadow-md hover:shadow-xl hover:border-indigo-400/80 transition-all duration-300 overflow-hidden group/card"
                            >
                                {/* Cabeçalho da Peça */}
                                <div className="bg-slate-900 text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-indigo-600 text-white px-3.5 py-1 rounded-xl font-black text-sm shadow-xs tracking-wide">
                                            🁫 PEÇA #{idx + 1}
                                        </span>
                                        <span className="text-xs text-slate-300 font-medium hidden md:inline bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
                                            ⚡ Conecta com a Peça #{idx === pairs.length - 1 ? (isCircular ? '1 (Ciclo)' : 'FIM') : idx + 2}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRemovePair(idx)}
                                        className="text-slate-400 hover:text-white hover:bg-red-600/90 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-800/50"
                                        title="Remover esta peça"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Excluir Peça</span>
                                    </button>
                                </div>
                                
                                {/* Corpo em Tela Dividida (Split View) */}
                                <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-50/60 to-white grid grid-cols-1 lg:grid-cols-11 gap-4 sm:gap-6 items-stretch">
                                    <div className="lg:col-span-5 flex flex-col">
                                        {renderSideInput(idx, 'question')}
                                    </div>
                                    
                                    {/* Divisória Realista da Peça de Dominó */}
                                    <div className="lg:col-span-1 flex lg:flex-col items-center justify-center py-2 lg:py-0 relative select-none">
                                        <div className="w-full h-1 lg:w-1 lg:h-full bg-gradient-to-b from-slate-200 via-indigo-300 to-slate-200 rounded-full"></div>
                                        <div className="w-11 h-11 rounded-full bg-slate-900 border-4 border-white text-amber-400 font-black flex items-center justify-center text-sm shadow-lg z-10 group-hover/card:scale-110 group-hover/card:bg-indigo-900 transition-all">
                                            •
                                        </div>
                                    </div>

                                    <div className="lg:col-span-5 flex flex-col">
                                        {renderSideInput(idx, 'answer')}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <button
                            type="button"
                            onClick={handleAddPair}
                            className="w-full py-6 bg-gradient-to-r from-slate-50 via-indigo-50/60 to-slate-50 hover:from-indigo-100/80 hover:to-indigo-50/80 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-3xl text-indigo-950 font-black text-base shadow-sm hover:shadow-lg transition-all flex items-center justify-center gap-3 group/add cursor-pointer"
                        >
                            <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl group-hover/add:scale-110 transition-transform shadow-md">
                                <Plus className="w-6 h-6" />
                            </span>
                            <span>Adicionar Nova Peça Manualmente à Mesa de Dominó</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

