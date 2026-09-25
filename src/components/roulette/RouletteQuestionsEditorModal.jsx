import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, X, AlertCircle, Plus, Trash2, CheckCircle, FileText, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useActivity } from '../../contexts/ActivityContext';
import { convertQuizQuestionsToRoulette } from '../../services/questionTransitionService';
import { gameAudio } from '../../utils/gameAudio';

export const RouletteQuestionsEditorModal = ({ isOpen, onClose, activeActivity, updateActivityData }) => {
    // Trabalharemos com uma cópia local durante a edição
    const [localQuestions, setLocalQuestions] = useState([]);
    const { tabs } = useActivity();
    const [showQuizSelector, setShowQuizSelector] = useState(false);
    const [importSuccessMsg, setImportSuccessMsg] = useState('');

    // Abas de Quiz disponíveis para importação
    const quizTabs = (tabs || []).filter(t => t.type === 'quiz' && t.quizData?.questions?.length > 0);

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
                answer: q.answer || '',
                difficulty: q.difficulty || 'Média',
                imageUrl: q.imageUrl || '',
                options: q.options || undefined,
                name: q.name || '' // keep for legacy compatibility
            })));
            setShowQuizSelector(false);
            setImportSuccessMsg('');
        }
    }, [isOpen, activeActivity]);

    const handleQuestionChange = (id, newText) => {
        setLocalQuestions(prev => prev.map(q => q.id === id ? { ...q, question: newText } : q));
    };

    const handleAnswerChange = (id, newAnswer) => {
        setLocalQuestions(prev => prev.map(q => q.id === id ? { ...q, answer: newAnswer } : q));
    };

    const handleDifficultyChange = (id, newDiff) => {
        setLocalQuestions(prev => prev.map(q => q.id === id ? { ...q, difficulty: newDiff } : q));
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
                answer: '',
                difficulty: 'Média',
                imageUrl: '',
                name: ''
            }
        ]);
        gameAudio?.playTick?.();
    };

    const handleDeleteQuestion = (id) => {
        setLocalQuestions(prev => prev.filter(q => q.id !== id));
        gameAudio?.playTick?.();
    };

    const handleImportFromQuiz = (quizTab) => {
        if (!quizTab?.quizData?.questions?.length) return;
        const converted = convertQuizQuestionsToRoulette(quizTab.quizData.questions, {
            includeOptions: true
        });

        setLocalQuestions(prev => [...prev, ...converted]);
        setShowQuizSelector(false);
        setImportSuccessMsg(`+${converted.length} questão(ões) importadas de "${quizTab.title || 'Quiz'}" com sucesso!`);
        gameAudio?.playSuccess?.();
        setTimeout(() => setImportSuccessMsg(''), 4000);
    };

    const handleSave = () => {
        if (!activeActivity || !updateActivityData) return;
        
        updateActivityData(activeActivity.id, {
            questions: localQuestions
        });
        
        onClose();
    };

    // Render: sem GoogleSheetsImportModal aqui (ele está na toolbar do RouletteActivity)
    return (
        <>
        {isOpen && (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Perguntas da Roleta" maxWidth="max-w-4xl" icon={Save}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Banner de Ajuda / Importação */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-sm">Banco de Perguntas da Roleta ({localQuestions.length})</h4>
                            <p className="text-xs text-amber-700">Edite enunciados, gabaritos e adicione URLs de imagens para exibir no sorteio.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {/* Botão de Importar de um Quiz */}
                    {quizTabs.length > 0 && (
                        <div className="relative shrink-0 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setShowQuizSelector(!showQuizSelector)}
                                className="w-full sm:w-auto px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Importar de um Quiz...</span>
                            </button>

                            {/* Menu Suspenso de Quizzes Disponíveis */}
                            {showQuizSelector && (
                                <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">
                                        Escolha uma aba de Quiz:
                                    </div>
                                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                        {quizTabs.map(qt => (
                                            <button
                                                key={qt.id}
                                                onClick={() => handleImportFromQuiz(qt)}
                                                className="w-full text-left p-2 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-between text-xs"
                                            >
                                                <div className="truncate font-semibold text-slate-800">
                                                    {qt.title || 'Quiz'}
                                                </div>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
                                                    {qt.quizData.questions.length} questões
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                </div>

                {/* Notificação de Sucesso de Importação */}
                {importSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{importSuccessMsg}</span>
                    </div>
                )}

                {/* Lista de Questões */}
                {localQuestions.map((q, index) => (
                    <div key={q.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-sm space-y-4 relative group">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold text-sm">
                                Pergunta {index + 1}
                            </span>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                    <label className="text-xs font-bold text-slate-500">Dificuldade:</label>
                                    <select
                                        value={q.difficulty || 'Média'}
                                        onChange={(e) => handleDifficultyChange(q.id, e.target.value)}
                                        className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                    >
                                        <option value="Fácil">🟢 Fácil</option>
                                        <option value="Média">🟡 Média</option>
                                        <option value="Difícil">🔴 Difícil</option>
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                    title="Excluir esta pergunta"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Texto da Pergunta</label>
                            <textarea 
                                value={q.question}
                                onChange={(e) => handleQuestionChange(q.id, e.target.value)}
                                rows={2}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium text-slate-800 bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Resposta Esperada / Gabarito</label>
                            <textarea 
                                value={q.answer}
                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                rows={1}
                                placeholder="Gabarito da pergunta..."
                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none text-sm text-slate-700 bg-emerald-50/40"
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
                                    className="flex-1 p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
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
                        className="px-4 py-2 border-2 border-indigo-200 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Adicionar Nova Pergunta
                    </button>
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                </button>
            </div>
        </Modal>
        )}
        </>
    );
};
