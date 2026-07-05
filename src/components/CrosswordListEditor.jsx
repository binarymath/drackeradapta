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
import { LatexRenderer } from './ui/LatexRenderer';

export const CrosswordListEditor = ({
    initialData,
    onConfirm,
    onCancel,
    topic,
    lessonDetails
}) => {
    const [words, setWords] = useState([]);
    const [topicInput, setTopicInput] = useState(topic || '');
    const [detailsInput, setDetailsInput] = useState(lessonDetails || '');
    const [editingIndices, setEditingIndices] = useState(new Set());
    const [gameModeType, setGameModeType] = useState('text'); // 'text' ou 'math'
    const [mathOperations, setMathOperations] = useState(['+', '-']);
    const [mathMaxOrder, setMathMaxOrder] = useState(2);
    const [mathMultMaxOrder, setMathMultMaxOrder] = useState(1);
    const [mathDivMaxOrder, setMathDivMaxOrder] = useState(1);
    const [mathSpecificDivisor, setMathSpecificDivisor] = useState('random');
    const [mathCount, setMathCount] = useState(10);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const { geminiService, selectedModel } = useGemini();

    useEffect(() => {
        if (initialData && initialData.words) {
            setWords(initialData.words);
        }
        // Pré-carrega tema e detalhes da sidebar (igual ao Memory Game)
        setTopicInput(initialData?.topic || topic || '');
        setDetailsInput(initialData?.lessonDetails || lessonDetails || '');
    }, [initialData, topic, lessonDetails]);

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
        // 1. Normaliza: trim em todos os campos
        const trimmed = words.map(w => ({
            word: (w.word || '').toString().trim(),
            clue: (w.clue || '').toString().trim(),
        }));

        // 2. Remove entradas com palavra OU dica vazia
        const nonEmpty = trimmed.filter(w => w.word !== '' && w.clue !== '');

        if (nonEmpty.length < 2) {
            alert('Adicione pelo menos 2 entradas válidas (com palavra/número E dica preenchidos).');
            return;
        }

        // 3. Remove duplicatas de palavra (mantém a primeira ocorrência, case-insensitive)
        const seenWords = new Set();
        const deduped = nonEmpty.filter(w => {
            const key = w.word.toUpperCase();
            if (seenWords.has(key)) return false;
            seenWords.add(key);
            return true;
        });

        // 4. Avisa se havia duplicatas
        if (deduped.length < nonEmpty.length) {
            const removed = nonEmpty.length - deduped.length;
            console.info(`[CrosswordListEditor] ${removed} entrada(s) duplicada(s) removida(s).`);
        }

        if (deduped.length < 2) {
            alert('Após remover duplicatas, restaram menos de 2 entradas. Revise a lista.');
            return;
        }

        onConfirm({ words: deduped, topic: topicInput || (gameModeType === 'math' ? 'CRUZADINHA NUMÉRICA' : '') });
    };

    const handleGenerateMath = () => {
        if (mathOperations.length === 0) {
            alert("Selecione pelo menos uma operação matemática.");
            return;
        }
        const problems = generateMathProblems(mathCount, mathMaxOrder, mathOperations, mathMultMaxOrder, mathDivMaxOrder, mathSpecificDivisor);
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
            const contextBlock = detailsInput
                ? `\nContexto/Detalhes adicionais: ${detailsInput}` : '';

            const prompt = `Você é um gerador de atividades educativas de matemática.
Gere ${mathCount} problemas matemáticos educativos.
Tema/Contexto: ${topicInput || 'Matemática Geral'}${contextBlock}

CRIE PROBLEMAS VARIADOS E ADEQUADOS AO CONTEXTO. Pode incluir:
- Situações-problema com ${mathOperations.join(', ')}
- Frações (ex: "1/2 + 1/4 = ?"), se o tema sugerir
- Formas geométricas (ex: lados de um triângulo), se o tema sugerir
- Tabuada, medidas, porcentagem ou sequências numéricas
- Problemas de lógica matemática simples

REGRAS DE DIFICULDADE (para operações numéricas):
- Adição/Subtração: números com no máximo ${mathMaxOrder} dígito(s)
${mathOperations.includes('*') ? `- Multiplicação: multiplicando até ${mathMaxOrder} dígito(s), multiplicador até ${mathMultMaxOrder} dígito(s)` : ''}
${mathOperations.includes('/') ? `- Divisão: dividendo até ${mathMaxOrder} dígito(s), divisor até ${mathDivMaxOrder} dígito(s), resultado exato` : ''}

A resposta ("answer") de cada problema DEVE ser APENAS UM NÚMERO INTEIRO POSITIVO.
Retorne SOMENTE um array JSON:
[
  { "answer": 25, "problem": "João tinha 10 maçãs e ganhou mais 15. Quantas maçãs ele tem agora?" },
  { "answer": 3, "problem": "Um triângulo tem quantos lados?" }
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
            const contextBlock = detailsInput
                ? `\nContexto/Detalhes: ${detailsInput}` : '';
            const prompt = `Você é um gerador de atividades educativas.\nGere 10 palavras cruzadas criativas e educativas para o tema: "${topicInput}".${contextBlock}\nRetorne APENAS um JSON estrito. Não use formatação markdown.\nO JSON DEVE ser um array de objetos com este formato exato:\n[{"word": "RESPOSTA", "clue": "Dica ou pergunta"}]`;

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
                        className={`rounded-lg ${gameModeType === 'text' ? 'bg-brown-600 shadow-sm text-white hover:bg-brown-700' : 'text-brown-600 hover:bg-brown-100'}`}
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
                        Fórmula / Matemática
                    </Button>
                </div>

                {/* Topic + Details Input — pré-carregado da sidebar */}
                <Card className="space-y-3">
                    <Input
                        label="Título / Tema"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        className="text-lg font-bold"
                        placeholder={gameModeType === 'math' ? "Ex: Frações, Geometria, Tabuada..." : "Ex: Sistema Solar"}
                    />
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-brown-800">
                            Contexto / Detalhes
                            <span className="ml-2 text-xs font-normal text-brown-400">(pré-carregado da barra lateral)</span>
                        </label>
                        <textarea
                            value={detailsInput}
                            onChange={(e) => setDetailsInput(e.target.value)}
                            rows={2}
                            placeholder="Ex: alunos do 4º ano, foco em frações simples, relacionar com culinária..."
                            className="w-full p-2 bg-brown-50 border border-brown-200 rounded-lg text-sm text-brown-900 placeholder:text-brown-400 resize-none outline-none focus:border-brown-500 focus:ring-1 focus:ring-brown-500 transition-all"
                        />
                    </div>
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
                        
                        <div className="space-y-4 mb-4">
                            {/* Primeira linha: Operações e Quantidade */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                                    <label className="text-xs font-bold text-amber-800 block mb-2">Operações (Sem IA)</label>
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
                                
                                <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                                    <label className="text-xs font-bold text-amber-800 block mb-2">Quantidade (Contas ou IA)</label>
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
                            </div>

                            {/* Ordens Numéricas */}
                            <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm">
                                <h4 className="text-sm font-bold text-amber-900 mb-3 border-b border-amber-100 pb-2">Controle de Dificuldade (Ordem de Dígitos)</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-1 md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-amber-800 flex justify-between">
                                            <span>Ordem Numérica da Resposta / Base</span>
                                            <span className="text-amber-600 bg-amber-100 px-2 py-0.5 rounded text-[10px]">Todas as operações</span>
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="range" min="1" max="10" step="1"
                                                value={mathMaxOrder}
                                                onChange={(e) => setMathMaxOrder(parseInt(e.target.value))}
                                                className="flex-1 accent-amber-600"
                                            />
                                            <div className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-md min-w-[60px] text-center text-sm">
                                                {mathMaxOrder} {mathMaxOrder === 1 ? 'Dígito' : 'Dígitos'}
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-amber-700/70 leading-tight">Controla o limite de dígitos do resultado para Adição/Subtração, e o tamanho do multiplicando/dividendo para as outras.</p>
                                    </div>

                                    {mathOperations.includes('*') && (
                                        <div className="space-y-2 pt-2 border-t md:border-t-0 md:border-l border-amber-50 md:pl-6">
                                            <label className="text-xs font-bold text-amber-800 flex justify-between">
                                                <span>Ordem do Multiplicador</span>
                                                <span className="text-amber-600 bg-amber-100 px-2 py-0.5 rounded text-[10px]">Multiplicação (x)</span>
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <input 
                                                    type="range" min="1" max="10" step="1"
                                                    value={mathMultMaxOrder}
                                                    onChange={(e) => setMathMultMaxOrder(parseInt(e.target.value))}
                                                    className="flex-1 accent-amber-600"
                                                />
                                                <div className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-md min-w-[60px] text-center text-sm">
                                                    {mathMultMaxOrder} {mathMultMaxOrder === 1 ? 'Dígito' : 'Dígitos'}
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-amber-700/70">Quantos dígitos tem o número que multiplica (Ex: x 12).</p>
                                        </div>
                                    )}

                                    {mathOperations.includes('/') && (
                                        <div className="space-y-2 pt-2 border-t md:border-t-0 md:border-l border-amber-50 md:pl-6">
                                            <label className="text-xs font-bold text-amber-800 flex justify-between">
                                                <span>Ordem do Divisor</span>
                                                <span className="text-amber-600 bg-amber-100 px-2 py-0.5 rounded text-[10px]">Divisão (÷)</span>
                                            </label>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-4">
                                                    <input 
                                                        type="range" min="1" max="10" step="1"
                                                        value={mathDivMaxOrder}
                                                        onChange={(e) => {
                                                            setMathDivMaxOrder(parseInt(e.target.value));
                                                            if (parseInt(e.target.value) > 1) setMathSpecificDivisor('random');
                                                        }}
                                                        className="flex-1 accent-amber-600"
                                                    />
                                                    <div className="bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-md min-w-[60px] text-center text-sm">
                                                        {mathDivMaxOrder} {mathDivMaxOrder === 1 ? 'Dígito' : 'Dígitos'}
                                                    </div>
                                                </div>
                                                
                                                {mathDivMaxOrder === 1 && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-bold text-amber-700">Dígito exato:</span>
                                                        <select 
                                                            value={mathSpecificDivisor} 
                                                            onChange={(e) => setMathSpecificDivisor(e.target.value)}
                                                            className="flex-1 text-sm p-1 rounded border border-amber-300 bg-white text-amber-900 outline-none"
                                                        >
                                                            <option value="random">Aleatório (2 a 9)</option>
                                                            {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                                <option key={n} value={n.toString()}>Dividir apenas por {n}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-amber-700/70">Quantos dígitos tem o número que divide (Ex: ÷ 25).</p>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                                <th className="px-4 py-3 text-left text-xs font-bold text-brown-600 uppercase w-1/3">{gameModeType === 'math' ? 'Fórmula / Resposta' : 'Palavra (Resposta)'}</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-brown-600 uppercase">{gameModeType === 'math' ? 'Fórmula / Operação (LaTeX)' : 'Dica (Pergunta)'}</th>
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
                                                <LatexRenderer content={item.clue || '...'} className="text-brown-600 pl-2 block leading-snug" />
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
