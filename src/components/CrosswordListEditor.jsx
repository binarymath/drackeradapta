import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Sparkles, FileText, Pencil, Check, Calculator, Type, Brain } from 'lucide-react';
import { generateMathProblems } from '../utils/wordsearchGenerator';
import { useGemini } from '../contexts/GeminiContext';

// UI Components
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export const CrosswordListEditor = ({
    initialData,
    onConfirm,
    onCancel,
    topic
}) => {
    const [words, setWords] = useState([]);
    const [topicInput, setTopicInput] = useState(topic || '');
    const [editingIndices, setEditingIndices] = useState(new Set());
    const [gameModeType, setGameModeType] = useState('text'); // 'text' ou 'math'
    const [mathOperations, setMathOperations] = useState(['+', '-']);
    const [mathMaxOrder, setMathMaxOrder] = useState(2);
    const [mathMultMaxOrder, setMathMultMaxOrder] = useState(1);
    const [mathDivMaxOrder, setMathDivMaxOrder] = useState(1);
    const [mathCount, setMathCount] = useState(10);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const { geminiService, selectedModel } = useGemini();

    useEffect(() => {
        if (initialData && initialData.words) {
            setWords(initialData.words);
        }
    }, [initialData]);

    const handleAddWord = () => {
        const newIdx = words.length;
        setWords([...words, { word: '', clue: '' }]);
        setEditingIndices(prev => new Set(prev).add(newIdx));
    };

    const handleRemoveWord = (index) => {
        const newWords = [...words];
        newWords.splice(index, 1);
        setWords(newWords);

        // Adjust editing indices
        const newSet = new Set();
        editingIndices.forEach(idx => {
            if (idx < index) newSet.add(idx);
            if (idx > index) newSet.add(idx - 1);
        });
        setEditingIndices(newSet);
    };

    const toggleEdit = (index) => {
        setEditingIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const handleChange = (index, field, value) => {
        const newWords = [...words];
        newWords[index] = { ...newWords[index], [field]: value };
        // Force uppercase for words
        if (field === 'word') {
            newWords[index][field] = value.toUpperCase();
        }
        setWords(newWords);
    };

    const handleConfirm = () => {
        // Filter empty entries
        const validWords = words.filter(w => w.word && w.word.toString().trim() !== '' && w.clue && w.clue.toString().trim() !== '');
        if (validWords.length < 2) {
            alert("Adicione pelo menos 2 palavras/números válidos.");
            return;
        }
        onConfirm({ words: validWords, topic: topicInput || (gameModeType === 'math' ? 'CRUZADINHA NUMÉRICA' : '') });
    };

    const handleGenerateMath = () => {
        if (mathOperations.length === 0) {
            alert("Selecione pelo menos uma operação matemática.");
            return;
        }
        const problems = generateMathProblems(mathCount, mathMaxOrder, mathOperations, mathMultMaxOrder, mathDivMaxOrder);
        const mappedWords = problems.map(p => ({ word: p.answer.toString(), clue: p.problem }));
        setWords(mappedWords);
        setEditingIndices(new Set());
        setTopicInput('CRUZADINHA NUMÉRICA');
    };

    const toggleMathOp = (op) => {
        setMathOperations(prev => 
            prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op]
        );
    };

    const handleGenerateAIProblems = async () => {
        if (!geminiService || !geminiService.apiKey) {
            alert("Por favor, configure sua chave de API nas configurações primeiro.");
            return;
        }

        setIsGeneratingAI(true);
        try {
            const prompt = `Gere ${mathCount} situações-problema (problemas matemáticos em formato de texto/história) simples.
Tema opcional: ${topicInput || 'Geral'}.
As operações permitidas são: ${mathOperations.join(', ')}.

REGRAS DE DIFICULDADE (Siga ESTRITAMENTE o número de dígitos solicitados):
- Para Adição/Subtração: Os números da conta e a resposta devem ter no máximo ${mathMaxOrder} dígito(s).
${mathOperations.includes('*') ? `- Para Multiplicação: O multiplicando deve ter no máximo ${mathMaxOrder} dígito(s) e o multiplicador (ex: vezes X) deve ter no máximo ${mathMultMaxOrder} dígito(s).` : ''}
${mathOperations.includes('/') ? `- Para Divisão: O dividendo e quociente devem estar no limite de ${mathMaxOrder} dígito(s) e o divisor deve ter no máximo ${mathDivMaxOrder} dígito(s). A divisão deve ser exata.` : ''}

A resposta (resultado) de cada problema DEVE ser APENAS UM NÚMERO INTEIRO POSITIVO.
Retorne APENAS um JSON estrito no seguinte formato:
[
  { "answer": 25, "problem": "João tinha 10 maçãs e ganhou mais 15. Quantas maçãs ele tem agora?" }
]`;

            // Import dynamically to use the safe parser just in case
            const { safeJSONParse } = await import('../utils/jsonUtils');
            
            const text = await geminiService.generateText(prompt, {
                model: selectedModel,
                maxOutputTokens: 8000,
                temperature: 0.7,
                responseMimeType: "application/json"
            });

            const responseData = safeJSONParse(text);
            if (!responseData) {
                console.error("RAW AI TEXT:", text);
                throw new Error("JSON inválido gerado pela IA. Veja o console para detalhes.");
            }

            let problems = [];
            if (Array.isArray(responseData)) {
                problems = responseData;
            } else if (responseData.problems && Array.isArray(responseData.problems)) {
                problems = responseData.problems;
            } else if (responseData.words && Array.isArray(responseData.words)) {
                problems = responseData.words;
            } else if (responseData.data && Array.isArray(responseData.data)) {
                problems = responseData.data;
            } else {
                // Tenta encontrar qualquer array dentro do objeto
                const possibleArray = Object.values(responseData).find(v => Array.isArray(v));
                if (possibleArray) problems = possibleArray;
            }

            if (!problems || problems.length === 0) {
                throw new Error("A IA não retornou uma lista válida.");
            }

            const mappedWords = problems.map(p => ({ 
                word: (p.answer || p.word || '').toString(), 
                clue: p.problem || p.clue || '' 
            }));
            setWords(mappedWords);
            setEditingIndices(new Set());
            if (!topicInput) setTopicInput('Cruzadinha: Situações-Problema');
            
        } catch (e) {
            console.error("Erro na IA:", e);
            alert("Erro ao gerar problemas com IA: " + e.message);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleGenerateAIText = async () => {
        if (!topicInput) {
            alert("Por favor, digite um Título/Tema primeiro para a IA saber o que gerar.");
            return;
        }
        if (!geminiService || !geminiService.apiKey) {
            alert("Por favor, configure sua chave de API nas configurações primeiro.");
            return;
        }

        setIsGeneratingAI(true);
        try {
            const prompt = `Você é um gerador de atividades educativas.\nGere 10 palavras cruzadas criativas e educativas para o tema: "${topicInput}".\nRetorne APENAS um JSON estrito. Não use formatação markdown.\nO JSON DEVE ser um array de objetos com este formato exato:\n[{"word": "RESPOSTA", "clue": "Dica ou pergunta"}]`;

            const { safeJSONParse } = await import('../utils/jsonUtils');
            
            const text = await geminiService.generateText(prompt, {
                model: selectedModel,
                maxOutputTokens: 8000,
                temperature: 0.7,
                responseMimeType: "application/json"
            });

            const responseData = safeJSONParse(text);
            if (!responseData) {
                console.error("RAW AI TEXT:", text);
                throw new Error("A IA não retornou dados válidos. Veja o console.");
            }
            
            const list = Array.isArray(responseData) ? responseData : (responseData.words || []);
            if (!list || list.length === 0) throw new Error("A IA retornou uma lista vazia.");

            const mappedWords = list.map(p => ({ word: (p.word || p.answer || '').toString().toUpperCase(), clue: p.clue || p.problem || '' }));
            setWords(mappedWords);
            setEditingIndices(new Set());
            
        } catch (e) {
            console.error("Erro na IA:", e);
            alert("Erro ao gerar palavras com IA: " + e.message);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const footer = (
        <div className="flex justify-between items-center w-full">
            <div className="text-sm text-brown-500">
                Total: <b>{words.length}</b> palavras
            </div>
            <div className="flex gap-3">
                <Button onClick={onCancel} variant="secondary">Cancelar</Button>
                <Button onClick={handleConfirm} icon={Save}>Gerar Jogo</Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onCancel}
            title="Gerador de Palavras Cruzadas"
            icon={Sparkles}
            size="xl"
            footer={footer}
        >
            <div className="space-y-6">

                {/* Mode Selector */}
                <div className="flex gap-4 p-1 bg-brown-100/50 rounded-xl w-fit">
                    <Button 
                        variant={gameModeType === 'text' ? 'primary' : 'ghost'} 
                        onClick={() => setGameModeType('text')}
                        className={`rounded-lg ${gameModeType === 'text' ? 'bg-white shadow-sm text-brown-900 hover:bg-white' : 'text-brown-600 hover:bg-brown-100'}`}
                        icon={Type}
                    >
                        História (Letras)
                    </Button>
                    <Button 
                        variant={gameModeType === 'math' ? 'primary' : 'ghost'} 
                        onClick={() => setGameModeType('math')}
                        className={`rounded-lg ${gameModeType === 'math' ? 'bg-amber-500 shadow-sm text-white hover:bg-amber-600' : 'text-brown-600 hover:bg-brown-100'}`}
                        icon={Calculator}
                    >
                        Matemática (Números)
                    </Button>
                </div>

                {/* Topic Input */}
                <Card>
                    <Input
                        label="Título / Tema"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        className="text-lg font-bold"
                        placeholder={gameModeType === 'math' ? "Ex: Cruzadinha Numérica" : "Ex: Sistema Solar"}
                    />
                </Card>

                {gameModeType === 'text' && (
                    <Card className="bg-purple-50 border-purple-200">
                        <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            Gerador com Inteligência Artificial
                        </h3>
                        <p className="text-sm text-purple-700 mb-4">
                            Digite um tema acima e deixe a IA criar as palavras e dicas para você.
                        </p>
                        <Button 
                            onClick={handleGenerateAIText} 
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white relative overflow-hidden" 
                            icon={Brain}
                            disabled={isGeneratingAI}
                        >
                            {isGeneratingAI ? 'Gerando com IA...' : 'Gerar Palavras Cruzadas (IA)'}
                            {isGeneratingAI && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                        </Button>
                    </Card>
                )}

                {gameModeType === 'math' && (
                    <Card className="bg-amber-50 border-amber-200">
                        <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-amber-600" />
                            Gerador de Problemas Matemáticos
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg border border-amber-100">
                                <label className="text-xs font-bold text-amber-800 block mb-2">Operações</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { op: '+', label: 'Adição' },
                                        { op: '-', label: 'Subtração' },
                                        { op: '*', label: 'Multiplicação' },
                                        { op: '/', label: 'Divisão' }
                                    ].map(({op, label}) => (
                                        <button
                                            key={op}
                                            onClick={() => toggleMathOp(op)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-bold border transition-colors ${
                                                mathOperations.includes(op) 
                                                ? 'bg-amber-100 border-amber-400 text-amber-900' 
                                                : 'bg-white border-brown-200 text-brown-500 hover:bg-brown-50'
                                            }`}
                                        >
                                            {op} {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border border-amber-100">
                                <label className="text-xs font-bold text-amber-800 block mb-2">Quantidade de Contas</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" min="5" max="30" step="1"
                                        value={mathCount}
                                        onChange={(e) => setMathCount(parseInt(e.target.value))}
                                        className="flex-1 accent-amber-600"
                                    />
                                    <div className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-md min-w-[60px] text-center">
                                        {mathCount}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border border-amber-100">
                                <label className="text-xs font-bold text-amber-800 block mb-2">Ordem Numérica (Adição/Base)</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" min="1" max="10" step="1"
                                        value={mathMaxOrder}
                                        onChange={(e) => setMathMaxOrder(parseInt(e.target.value))}
                                        className="flex-1 accent-amber-600"
                                    />
                                    <div className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-md min-w-[60px] text-center">
                                        {mathMaxOrder} {mathMaxOrder === 1 ? 'Dígito' : 'Dígitos'}
                                    </div>
                                </div>
                            </div>

                            {mathOperations.includes('*') && (
                                <div className="bg-white p-3 rounded-lg border border-amber-100">
                                    <label className="text-xs font-bold text-amber-800 block mb-2">Ordem Multiplicador (Ex: x 12)</label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range" min="1" max="10" step="1"
                                            value={mathMultMaxOrder}
                                            onChange={(e) => setMathMultMaxOrder(parseInt(e.target.value))}
                                            className="flex-1 accent-amber-600"
                                        />
                                        <div className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-md min-w-[60px] text-center">
                                            {mathMultMaxOrder} {mathMultMaxOrder === 1 ? 'Dígito' : 'Dígitos'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {mathOperations.includes('/') && (
                                <div className="bg-white p-3 rounded-lg border border-amber-100">
                                    <label className="text-xs font-bold text-amber-800 block mb-2">Ordem Divisor (Ex: ÷ 25)</label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range" min="1" max="10" step="1"
                                            value={mathDivMaxOrder}
                                            onChange={(e) => setMathDivMaxOrder(parseInt(e.target.value))}
                                            className="flex-1 accent-amber-600"
                                        />
                                        <div className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-md min-w-[60px] text-center">
                                            {mathDivMaxOrder} {mathDivMaxOrder === 1 ? 'Dígito' : 'Dígitos'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-4 w-full">
                            <Button 
                                onClick={handleGenerateMath} 
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" 
                                icon={Calculator}
                                disabled={isGeneratingAI}
                            >
                                Gerar Contas Diretas
                            </Button>
                            <Button 
                                onClick={handleGenerateAIProblems} 
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white relative overflow-hidden" 
                                icon={Brain}
                                disabled={isGeneratingAI}
                            >
                                {isGeneratingAI ? 'Gerando com IA...' : 'Gerar Situações-Problema (IA)'}
                                {isGeneratingAI && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                            </Button>
                        </div>
                    </Card>
                )}



                <Card className="p-0 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-brown-100/50 border-b border-brown-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-brown-600 uppercase w-12">#</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-brown-600 uppercase w-1/3">{gameModeType === 'math' ? 'Resposta (Número)' : 'Palavra (Resposta)'}</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-brown-600 uppercase">{gameModeType === 'math' ? 'Operação (Conta)' : 'Dica (Pergunta)'}</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-brown-600 uppercase w-24">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brown-100">
                            {words.map((item, idx) => {
                                const isEditing = editingIndices.has(idx);
                                return (
                                    <tr key={idx} className={`transition-colors ${isEditing ? 'bg-brown-50' : 'hover:bg-brown-50'}`}>
                                        <td className="px-4 py-3 text-center font-mono text-brown-400 text-xs">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input
                                                    value={item.word}
                                                    onChange={(e) => handleChange(idx, 'word', e.target.value)}
                                                    className="w-full font-bold uppercase text-brown-800 bg-white border border-brown-300 focus:border-brown-500 rounded px-2 py-1 outline-none transition-all shadow-sm"
                                                    placeholder={gameModeType === 'math' ? "NÚMERO" : "PALAVRA"}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-bold text-brown-800 pl-2 block">{item.word || '...'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <textarea
                                                    value={item.clue}
                                                    onChange={(e) => handleChange(idx, 'clue', e.target.value)}
                                                    rows={2}
                                                    className="w-full text-brown-700 bg-white border border-brown-300 focus:border-brown-500 rounded px-2 py-1 outline-none resize-none transition-all shadow-sm"
                                                    placeholder={gameModeType === 'math' ? "Ex: 10 + 5" : "Dica para esta palavra..."}
                                                />
                                            ) : (
                                                <span className="text-brown-600 pl-2 block leading-snug">{item.clue || '...'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    onClick={() => toggleEdit(idx)}
                                                    variant="ghost"
                                                    className={`p-2 h-auto ${isEditing ? 'text-green-600 hover:bg-green-50' : 'text-brown-400 hover:bg-brown-100'}`}
                                                    title={isEditing ? "Salvar edição" : "Editar palavra"}
                                                >
                                                    {isEditing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                                    {/* Using Sparkles as generic edit for consistency with header, but user asked for 'Edit' option. 
                                                        Actually, for Edit commonly Pencil is used. I'll stick to a Pencil icon if available or Edit icon.
                                                        The original imports had Sparkles, FileText. I might need to import Pencil or Edit.
                                                        Checking imports: X, Plus, Trash2, Save, Sparkles, FileText.
                                                        Let's add Pencil and Check to imports for better UX.
                                                    */}
                                                </Button>
                                                <Button
                                                    onClick={() => handleRemoveWord(idx)}
                                                    variant="ghost"
                                                    className="p-2 text-brown-400 hover:text-red-500 hover:bg-red-50 h-auto"
                                                    title="Remover palavra"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {words.length === 0 && (
                        <div className="p-8 text-center text-brown-400 italic">
                            Nenhuma palavra na lista. Adicione algumas!
                        </div>
                    )}

                    <div className="p-4 bg-brown-50 border-t border-brown-200">
                        <Button
                            onClick={handleAddWord}
                            variant="secondary"
                            className="bg-transparent hover:bg-brown-200"
                            icon={Plus}
                        >
                            Adicionar Novo {gameModeType === 'math' ? 'Problema' : 'Palavra'}
                        </Button>
                    </div>
                </Card>
            </div>
        </Modal>
    );
};
