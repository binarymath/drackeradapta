import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Sparkles, FileText, Pencil, Check, Calculator, Type, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { generateMathProblems } from '../utils/wordsearchGenerator';
import { numberToPortugueseWords, formatAnswerForMathCrossword } from '../utils/numberToWords';
import { useGemini } from '../contexts/GeminiContext';
import { safeJSONParse } from '../utils/jsonUtils';

// UI Components
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { LatexRenderer } from './ui/LatexRenderer';
import { toast } from './ui/Toast';
import { GlobalAIGeneratorPanel } from './common/GlobalAIGeneratorPanel';

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
    const [mathSubMode, setMathSubMode] = useState('direct'); // 'direct' (Contas Diretas) ou 'ai_problems' (Situações-Problema IA)
    const [showAdvancedMath, setShowAdvancedMath] = useState(false);
    const [mathAnswerFormat, setMathAnswerFormat] = useState(initialData?.mathAnswerFormat || 'text_words'); // 'text_words' (Opção 2 - Por Extenso) ou 'numeric'
    const [mathOperations, setMathOperations] = useState(['+', '-']);
    const [mathMaxOrder, setMathMaxOrder] = useState(2);
    const [mathMultMaxOrder, setMathMultMaxOrder] = useState(1);
    const [mathDivMaxOrder, setMathDivMaxOrder] = useState(1);
    const [mathSpecificDivisor, setMathSpecificDivisor] = useState('random');
    const [mathCount, setMathCount] = useState(10);
    const [gradeLevel, setGradeLevel] = useState('Ensino Fundamental II - 6º ao 9º Ano (11 a 14 anos)');
    const [itemCount, setItemCount] = useState(10);
    const [difficultyDist, setDifficultyDist] = useState({ easy: 40, medium: 40, hard: 20 });
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const { geminiService, selectedModel } = useGemini();

    useEffect(() => {
        if (initialData && initialData.words) {
            setWords(initialData.words);
        }
        if (initialData?.mathAnswerFormat) {
            setMathAnswerFormat(initialData.mathAnswerFormat);
        }
        // Pré-carrega tema e detalhes da sidebar (igual ao Memory Game)
        setTopicInput(initialData?.topic || topic || '');
        setDetailsInput(initialData?.lessonDetails || lessonDetails || '');
    }, [initialData, topic, lessonDetails]);

    const handleFormatChange = (newFormat) => {
        setMathAnswerFormat(newFormat);
        if (words.length > 0) {
            const converted = words.map(w => {
                const formatted = formatAnswerForMathCrossword(w.word, newFormat);
                return {
                    ...w,
                    word: formatted,
                    originalWord: formatted
                };
            });
            setWords(converted);
        }
    };

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
        // 1. Normaliza: trim em todos os campos e formata por extenso se estiver em math + text_words
        const trimmed = words.map(w => {
            let finalWord = (w.word || '').toString().trim();
            if (gameModeType === 'math' && mathAnswerFormat === 'text_words') {
                finalWord = formatAnswerForMathCrossword(finalWord, 'text_words');
            }
            return {
                word: finalWord,
                originalWord: w.originalWord || finalWord,
                clue: (w.clue || '').toString().trim(),
            };
        });

        // 2. Remove entradas com palavra OU dica vazia
        const nonEmpty = trimmed.filter(w => w.word !== '' && w.clue !== '');

        if (nonEmpty.length < 2) {
            toast('Adicione pelo menos 2 entradas válidas (com palavra/número E dica preenchidos).');
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
            toast('Após remover duplicatas, restaram menos de 2 entradas. Revise a lista.');
            return;
        }

        onConfirm({ 
            words: deduped, 
            topic: topicInput || (gameModeType === 'math' ? (mathAnswerFormat === 'text_words' ? 'CRUZADINHA MATEMÁTICA' : 'CRUZADINHA NUMÉRICA') : ''),
            mathAnswerFormat
        });
    };

    const handleGenerateMath = () => {
        if (mathOperations.length === 0) {
            toast("Selecione pelo menos uma operação matemática.");
            return;
        }
        const problems = generateMathProblems(mathCount, mathMaxOrder, mathOperations, mathMultMaxOrder, mathDivMaxOrder, mathSpecificDivisor);
        const mappedWords = problems.map(p => {
            const formatted = formatAnswerForMathCrossword(p.answer, mathAnswerFormat);
            return { 
                word: formatted, 
                originalWord: formatted, 
                clue: p.problem 
            };
        });
        setWords(mappedWords);
        setEditingIndices(new Set());
        setTopicInput(mathAnswerFormat === 'text_words' ? 'CRUZADINHA MATEMÁTICA' : 'CRUZADINHA NUMÉRICA');
        toast(`✨ ${mappedWords.length} contas geradas com respostas ${mathAnswerFormat === 'text_words' ? 'por extenso' : 'numéricas'}!`);
    };

    const toggleMathOp = (op) => {
        setMathOperations(prev => 
            prev.includes(op) ? prev.filter(o => o !== op) : [...prev, op]
        );
    };

    const handleGenerateAIProblems = async () => {
        if (!geminiService || !geminiService.apiKey) {
            toast("Por favor, configure sua chave de API nas configurações primeiro.");
            return;
        }

        setIsGeneratingAI(true);
        try {
            const contextBlock = detailsInput
                ? `\nContexto pedagógico & plano de aula: ${detailsInput}` : '';

            const isPorExtenso = mathAnswerFormat === 'text_words';
            const countToGen = Number(itemCount) || Number(mathCount) || 10;

            const easyP = Math.round((countToGen * (difficultyDist?.easy || 40)) / 100);
            const medP = Math.round((countToGen * (difficultyDist?.medium || 40)) / 100);
            const hardP = Math.max(0, countToGen - easyP - medP);

            const prompt = `Você é um gerador de excelência de atividades pedagógicas de matemática para palavras cruzadas escolares.
Gere EXATAMENTE ${countToGen} situações-problema ou desafios matemáticos educativos.
Tema/Contexto: ${topicInput || 'Matemática do Cotidiano'}${contextBlock}
Nível/Ano Escolar dos alunos: ${gradeLevel}.

Distribuição de dificuldade pedagógica:
- Fácil (~${easyP} problemas): enunciados curtos, diretos e números menores.
- Médio (~${medP} problemas): situações contextualizadas do dia a dia (compras, medidas, tempo).
- Difícil (~${hardP} problemas): desafios que exigem raciocínio dedutivo ou 2 etapas de cálculo.

CRIE PROBLEMAS VARIADOS E ADEQUADOS AO CONTEXTO. Pode incluir:
- Situações-problema com ${mathOperations.join(', ')}
- Medidas, horas, dinheiro/compras, frações práticas ou raciocínio lógico simples

${isPorExtenso ? `REGRA CRÍTICA PARA A RESPOSTA (CRUZADINHA POR EXTENSO - OPÇÃO 2):
A resposta ("answer") de cada problema DEVE ser o resultado numérico escrito OBRIGATORIAMENTE POR EXTENSO em português brasileiro, em LETRAS MAIÚSCULAS e sem acentos (Exemplos: "VINTE E CINCO", "DOZE", "QUATROCENTOS", "DEZ").
NÃO retorne dígitos numéricos no campo "answer", retorne o número por extenso!` : `A resposta ("answer") de cada problema DEVE ser APENAS UM NÚMERO INTEIRO POSITIVO.`}

Retorne SOMENTE um array JSON no formato exato:
[
  { "answer": "${isPorExtenso ? 'VINTE E CINCO' : '25'}", "problem": "Dona Maria comprou 10 maçãs e ganhou mais 15. Quantas maçãs ela tem ao todo?" },
  { "answer": "${isPorExtenso ? 'TRES' : '3'}", "problem": "Quantos lados tem um triângulo?" }
]`;

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

            const mappedWords = problems.map(p => {
                const rawAns = (p.answer || p.word || '').toString().trim();
                const clueText = (p.problem || p.clue || '').toString().trim();
                const formattedAns = formatAnswerForMathCrossword(rawAns, mathAnswerFormat);
                return { 
                    word: formattedAns, 
                    originalWord: formattedAns,
                    clue: clueText 
                };
            }).filter(p => p.word && p.clue);

            setWords(mappedWords);
            setEditingIndices(new Set());
            if (!topicInput) setTopicInput(mathAnswerFormat === 'text_words' ? 'Cruzadinha Matemática (Por Extenso)' : 'Cruzadinha: Situações-Problema');
            toast(`🎉 ${mappedWords.length} situações-problema geradas com sucesso!`);
            
        } catch (e) {
            console.error("Erro na IA:", e);
            toast("Erro ao gerar problemas com IA: " + e.message);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleGenerateAIText = async () => {
        if (!topicInput || !topicInput.trim()) {
            toast("Por favor, digite o tema central das palavras cruzadas primeiro.");
            return;
        }
        if (!geminiService || !geminiService.apiKey) {
            toast("Por favor, configure sua chave de API nas configurações primeiro.");
            return;
        }

        setIsGeneratingAI(true);
        try {
            const countToGen = Number(itemCount) || 10;
            const easyP = Math.round((countToGen * (difficultyDist?.easy || 40)) / 100);
            const medP = Math.round((countToGen * (difficultyDist?.medium || 40)) / 100);
            const hardP = Math.max(0, countToGen - easyP - medP);

            const prompt = `Você é um gerador de excelência de atividades educativas e pedagógicas de Palavras Cruzadas.
Gere EXATAMENTE ${countToGen} palavras cruzadas educativas de alto nível pedagógico sobre o tema: "${topicInput.trim()}".
Nível/Ano Escolar dos alunos: ${gradeLevel}.
${detailsInput?.trim() ? `Contexto pedagógico & delimitação do tema:\n${detailsInput.trim()}` : ''}

Distribuição de dificuldade pedagógica das pistas:
- Fácil (~${easyP} palavras): termos fundamentais, vocabulário direto e pistas claras.
- Médio (~${medP} palavras): conceitos escolares padrão do currículo, definições precisas.
- Difícil (~${hardP} palavras): conceitos aprofundados, termos técnicos ou raciocínio dedutivo.

REGRAS OBRIGATÓRIAS:
1. Cada "word" deve ser uma ÚNICA palavra em português, sem espaços, sem hífens e sem pontuação (ex: "FOTOSSINTESE", "PIRAMIDE", "GRAVIDADE").
2. "clue" deve ser uma dica, definição ou enigma educativo claro e engajador.
3. Retorne APENAS um JSON válido no formato exato:
[
  {"word": "PIRAMIDE", "clue": "Poliedro com base poligonal e faces triangulares que se unem em um vértice."},
  {"word": "VERTICE", "clue": "Ponto de encontro de duas ou mais arestas."}
]`;

            const text = await geminiService.generateText(prompt, {
                model: selectedModel,
                maxOutputTokens: 8000,
                temperature: 0.5,
                responseMimeType: "application/json"
            });

            const responseData = safeJSONParse(text);
            if (!responseData) {
                console.error("RAW AI TEXT:", text);
                throw new Error("A IA não retornou dados válidos. Veja o console.");
            }
            
            const list = Array.isArray(responseData) ? responseData : (responseData.words || []);
            if (!list || list.length === 0) throw new Error("A IA retornou uma lista vazia.");

            const mappedWords = list.map(p => ({ 
                word: (p.word || p.answer || '').toString().toUpperCase().trim().replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, ''), 
                clue: (p.clue || p.problem || '').toString().trim() 
            })).filter(p => p.word.length >= 2);

            setWords(mappedWords);
            setEditingIndices(new Set());
            toast(`🎉 ${mappedWords.length} palavras cruzadas geradas com sucesso!`);
            
        } catch (e) {
            console.error("Erro na IA:", e);
            toast("Erro ao gerar palavras com IA: " + e.message);
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

                {/* Painel Global de Geração com IA integrado localmente */}
                {gameModeType === 'text' && (
                    <GlobalAIGeneratorPanel
                        itemTypeLabel="palavras cruzadas"
                        topic={topicInput}
                        onTopicChange={setTopicInput}
                        context={detailsInput}
                        onContextChange={setDetailsInput}
                        gradeLevel={gradeLevel}
                        onGradeLevelChange={setGradeLevel}
                        itemCount={itemCount}
                        onItemCountChange={setItemCount}
                        itemCountOptions={[6, 8, 10, 12, 15]}
                        difficultyDist={difficultyDist}
                        onDifficultyDistChange={setDifficultyDist}
                        onGenerate={handleGenerateAIText}
                        isGenerating={isGeneratingAI}
                        collapsible={true}
                        defaultExpanded={words.length === 0}
                    />
                )}

                {gameModeType === 'math' && (
                    <div className="space-y-4">
                        {/* Barra Superior de Formato das Respostas (Opção 2 - Por Extenso) */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/90 rounded-2xl p-4 shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                    <span className="text-xs font-black text-amber-950 uppercase tracking-wide block">
                                        Respostas na Grade:
                                    </span>
                                    <p className="text-[11px] text-amber-900/70">
                                        {mathAnswerFormat === 'text_words'
                                            ? 'As respostas numéricas viram palavras por extenso em letras (ex: 25 ➔ VINTE E CINCO), permitindo cruzamentos na grade.'
                                            : 'As respostas numéricas aparecem diretamente em algarismos/dígitos (ex: 25).'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-amber-200 shadow-2xs shrink-0 self-start sm:self-center">
                                    <button
                                        type="button"
                                        onClick={() => handleFormatChange('text_words')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            mathAnswerFormat === 'text_words'
                                                ? 'bg-amber-600 text-white shadow-xs font-black'
                                                : 'text-amber-900/80 hover:bg-amber-50'
                                        }`}
                                    >
                                        <span>✍️ Por Extenso (Letras)</span>
                                        <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded uppercase">Padrão</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleFormatChange('numeric')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            mathAnswerFormat === 'numeric'
                                                ? 'bg-amber-600 text-white shadow-xs font-black'
                                                : 'text-amber-900/80 hover:bg-amber-50'
                                        }`}
                                    >
                                        <span>🔢 Dígitos (0-9)</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Seletor de Modo: Contas Diretas vs Situações-Problema IA */}
                        <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-fit gap-1 border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setMathSubMode('direct')}
                                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    mathSubMode === 'direct'
                                        ? 'bg-white text-amber-900 shadow-xs border border-amber-200/80 font-black'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                <Calculator className="w-4 h-4 text-amber-600" />
                                <span>⚡ Contas Diretas (Aritmética)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMathSubMode('ai_problems')}
                                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    mathSubMode === 'ai_problems'
                                        ? 'bg-white text-purple-900 shadow-xs border border-purple-200/80 font-black'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                            >
                                <Brain className="w-4 h-4 text-purple-600" />
                                <span>✨ Situações-Problema (com IA)</span>
                            </button>
                        </div>

                        {/* Painel 1: Contas Diretas */}
                        {mathSubMode === 'direct' && (
                            <Card className="bg-white border-slate-200 p-5 shadow-xs space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Operações */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                            <span>Operações Matemáticas</span>
                                            <span className="text-[10px] text-slate-400 font-normal">Selecione uma ou mais</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { op: '+', label: 'Adição', symbol: '+' },
                                                { op: '-', label: 'Subtração', symbol: '−' },
                                                { op: '*', label: 'Multiplicação', symbol: '×' },
                                                { op: '/', label: 'Divisão', symbol: '÷' }
                                            ].map(({ op, label, symbol }) => {
                                                const active = mathOperations.includes(op);
                                                return (
                                                    <button
                                                        key={op}
                                                        type="button"
                                                        onClick={() => toggleMathOp(op)}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                            active
                                                                ? 'bg-amber-500 text-white border-amber-600 shadow-2xs font-black'
                                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black shrink-0 ${
                                                            active ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                                                        }`}>
                                                            {symbol}
                                                        </span>
                                                        <span>{label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Quantidade */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                            <span>Quantidade de Contas</span>
                                            <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                                {mathCount} {mathCount === 1 ? 'conta' : 'contas'}
                                            </span>
                                        </label>
                                        <div className="flex gap-1.5 pt-1">
                                            {[6, 8, 10, 12, 15, 20].map(cnt => (
                                                <button
                                                    key={cnt}
                                                    type="button"
                                                    onClick={() => setMathCount(cnt)}
                                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                        mathCount === cnt
                                                            ? 'bg-amber-600 text-white border-amber-700 shadow-2xs font-black'
                                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {cnt}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="range"
                                            min="4"
                                            max="25"
                                            step="1"
                                            value={mathCount}
                                            onChange={(e) => setMathCount(parseInt(e.target.value))}
                                            className="w-full accent-amber-600 cursor-pointer mt-1"
                                        />
                                    </div>
                                </div>

                                {/* Dificuldade Didática */}
                                <div className="pt-3 border-t border-slate-100 space-y-2">
                                    <label className="text-xs font-bold text-slate-700 block">Dificuldade dos Números</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'easy', label: 'Fácil', desc: '1 Dígito (1 a 9)', order: 1 },
                                            { id: 'medium', label: 'Médio', desc: 'Até 2 Dígitos (10 a 99)', order: 2 },
                                            { id: 'hard', label: 'Avançado', desc: 'Até 3 Dígitos (100 a 999)', order: 3 },
                                        ].map(lvl => {
                                            const isSelected = mathMaxOrder === lvl.order;
                                            return (
                                                <button
                                                    key={lvl.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setMathMaxOrder(lvl.order);
                                                        if (lvl.order === 1) {
                                                            setMathMultMaxOrder(1);
                                                            setMathDivMaxOrder(1);
                                                        } else if (lvl.order === 2) {
                                                            setMathMultMaxOrder(1);
                                                            setMathDivMaxOrder(1);
                                                        } else {
                                                            setMathMultMaxOrder(2);
                                                            setMathDivMaxOrder(1);
                                                        }
                                                    }}
                                                    className={`p-2.5 rounded-xl border text-left transition-all ${
                                                        isSelected
                                                            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
                                                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <div className={`text-xs font-black ${isSelected ? 'text-amber-900' : 'text-slate-800'}`}>
                                                        {lvl.label}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                                                        {lvl.desc}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Detalhes avançados opcionais */}
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowAdvancedMath(!showAdvancedMath)}
                                            className="text-[11px] font-bold text-slate-500 hover:text-amber-700 flex items-center gap-1 transition-colors"
                                        >
                                            {showAdvancedMath ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                            <span>{showAdvancedMath ? 'Ocultar ajustes finos de dígitos' : 'Ajustes finos de dígitos (multiplicador/divisor)'}</span>
                                        </button>
                                        {showAdvancedMath && (
                                            <div className="mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <label className="font-bold text-slate-700 block mb-1">
                                                        Dígitos Base / Resultado: <b>{mathMaxOrder}</b>
                                                    </label>
                                                    <input
                                                        type="range" min="1" max="6" step="1"
                                                        value={mathMaxOrder}
                                                        onChange={(e) => setMathMaxOrder(parseInt(e.target.value))}
                                                        className="w-full accent-amber-600 cursor-pointer"
                                                    />
                                                </div>
                                                {mathOperations.includes('*') && (
                                                    <div>
                                                        <label className="font-bold text-slate-700 block mb-1">
                                                            Dígitos do Multiplicador: <b>{mathMultMaxOrder}</b>
                                                        </label>
                                                        <input
                                                            type="range" min="1" max="4" step="1"
                                                            value={mathMultMaxOrder}
                                                            onChange={(e) => setMathMultMaxOrder(parseInt(e.target.value))}
                                                            className="w-full accent-amber-600 cursor-pointer"
                                                        />
                                                    </div>
                                                )}
                                                {mathOperations.includes('/') && (
                                                    <div>
                                                        <label className="font-bold text-slate-700 block mb-1">
                                                            Dígitos do Divisor: <b>{mathDivMaxOrder}</b>
                                                        </label>
                                                        <input
                                                            type="range" min="1" max="4" step="1"
                                                            value={mathDivMaxOrder}
                                                            onChange={(e) => {
                                                                setMathDivMaxOrder(parseInt(e.target.value));
                                                                if (parseInt(e.target.value) > 1) setMathSpecificDivisor('random');
                                                            }}
                                                            className="w-full accent-amber-600 cursor-pointer"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleGenerateMath} 
                                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-2.5 rounded-xl shadow-xs text-sm" 
                                    icon={Calculator}
                                >
                                    ⚡ Gerar Contas Diretas Agora
                                </Button>
                            </Card>
                        )}

                        {/* Painel 2: Situações-Problema com IA */}
                        {mathSubMode === 'ai_problems' && (
                            <GlobalAIGeneratorPanel
                                itemTypeLabel="situações-problema de matemática"
                                topic={topicInput || 'Matemática do Cotidiano'}
                                onTopicChange={setTopicInput}
                                context={detailsInput}
                                onContextChange={setDetailsInput}
                                gradeLevel={gradeLevel}
                                onGradeLevelChange={setGradeLevel}
                                itemCount={itemCount}
                                onItemCountChange={setItemCount}
                                itemCountOptions={[6, 8, 10, 12, 15]}
                                difficultyDist={difficultyDist}
                                onDifficultyDistChange={setDifficultyDist}
                                onGenerate={handleGenerateAIProblems}
                                isGenerating={isGeneratingAI}
                                collapsible={true}
                                defaultExpanded={true}
                            />
                        )}
                    </div>
                )}



                <Card className="p-0 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-brown-100/50 border-b border-brown-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-brown-600 uppercase w-12">#</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-brown-600 uppercase w-1/3">
                                    {gameModeType === 'math' 
                                        ? (mathAnswerFormat === 'text_words' ? 'Resposta por Extenso (Grade)' : 'Número / Resposta') 
                                        : 'Palavra (Resposta)'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-brown-600 uppercase">
                                    {gameModeType === 'math' ? 'Fórmula / Operação / Problema' : 'Dica (Pergunta)'}
                                </th>
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
                                                    onBlur={(e) => {
                                                        if (gameModeType === 'math' && mathAnswerFormat === 'text_words') {
                                                            const formatted = formatAnswerForMathCrossword(e.target.value, 'text_words');
                                                            if (formatted && formatted !== e.target.value) {
                                                                handleChange(idx, 'word', formatted);
                                                            }
                                                        }
                                                    }}
                                                    className="w-full font-bold uppercase text-brown-800 bg-white border border-brown-300 focus:border-brown-500 rounded px-2 py-1 outline-none transition-all shadow-sm"
                                                    placeholder={gameModeType === 'math' 
                                                        ? (mathAnswerFormat === 'text_words' ? "Ex: VINTE E CINCO ou 25" : "Ex: 25") 
                                                        : "PALAVRA"
                                                    }
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-bold text-brown-800 pl-2 block">
                                                    {item.word || '...'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <textarea
                                                    value={item.clue}
                                                    onChange={(e) => handleChange(idx, 'clue', e.target.value)}
                                                    rows={2}
                                                    className="w-full text-brown-700 bg-white border border-brown-300 focus:border-brown-500 rounded px-2 py-1 outline-none resize-none transition-all shadow-sm"
                                                    placeholder={gameModeType === 'math' ? "Ex: 10 + 15 = ? ou situação-problema..." : "Dica para esta palavra..."}
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
