    import React, { useState, useEffect } from 'react';
import { useActivity } from '../../contexts/ActivityContext';
import { NumberLineRenderer } from './NumberLineRenderer';
import { NumberLineGame } from './NumberLineGame';
import { NumberLinePrint } from './NumberLinePrint';
import {
    Sparkles, Plus, Trash2, Eye, EyeOff, Play, Printer, Settings,
    ArrowLeftRight, HelpCircle, Loader2, Download
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, Select, TextArea } from '../ui/Input';
import { Card } from '../ui/Card';
import { buildNumberLinePrompt } from '../../core/prompts/numberLinePrompt';
import { getGeminiService } from '../../services/geminiService';
import { safeJSONParse } from '../../utils/jsonUtils';

const defaultPresets = {
    fractions: {
        domainType: 'fraction',
        minVal: 0,
        maxVal: 2,
        step: 1,
        denominator: 4,
        title: 'Reta Numérica com Frações (Quartos)',
        description: 'Observe a divisão da reta numérica e encontre os valores correspondentes.',
        points: [
            { id: 'p1', val: 0.25, label: '1/4', color: 'blue', hiddenVal: true },
            { id: 'p2', val: 0.75, label: '3/4', color: 'emerald', hiddenVal: true },
            { id: 'p3', val: 1.5, label: '6/4', color: 'amber', hiddenVal: true },
            { id: 'p4', val: 1.0, label: '1', color: 'purple', hiddenVal: false }
        ],
        arcs: [],
        questions: [
            'Qual fração o marcador azul representa na reta?',
            'Escreva a fração equivalente ao número inteiro 1 com denominador 4.',
            'Quanto falta para o marcador verde chegar ao número 2?'
        ]
    },
    integers: {
        domainType: 'integer',
        minVal: -6,
        maxVal: 6,
        step: 1,
        denominator: 1,
        title: 'Reta Numérica de Números Inteiros',
        description: 'Encontre a posição dos números positivos e negativos na reta.',
        points: [
            { id: 'p1', val: -4, label: 'A', color: 'red', hiddenVal: true },
            { id: 'p2', val: -1, label: 'B', color: 'blue', hiddenVal: true },
            { id: 'p3', val: 3, label: 'C', color: 'emerald', hiddenVal: true },
            { id: 'p4', val: 0, label: '0', color: 'purple', hiddenVal: false }
        ],
        arcs: [],
        questions: [
            'Qual é o oposto ou simétrico do número representado pelo marcador C?',
            'Qual a distância entre o ponto A (-4) e a origem (0)?',
            'Coloque em ordem crescente: -4, -1, 0, 3.'
        ]
    },
    decimals: {
        domainType: 'decimal',
        minVal: 0,
        maxVal: 1.5,
        step: 0.1,
        denominator: 10,
        title: 'Reta Numérica com Números Decimais',
        description: 'Identifique os décimos marcados na reta numérica.',
        points: [
            { id: 'p1', val: 0.3, label: '0.3', color: 'blue', hiddenVal: true },
            { id: 'p2', val: 0.8, label: '0.8', color: 'amber', hiddenVal: true },
            { id: 'p3', val: 1.2, label: '1.2', color: 'emerald', hiddenVal: true }
        ],
        arcs: [],
        questions: [
            'Qual número decimal está exatamente na metade entre 0 e 1?',
            'Escreva o número 0.8 na forma de fração simplificada.'
        ]
    }
};

export const NumberLineMaker = () => {
    const { activeTabId, activeActivity, updateActivityData, addActivityTab, topic, lessonDetails, difficulty } = useActivity();
    const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'game' | 'print'
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

    const [localData, setLocalData] = useState(() => activeActivity?.numberLineData || defaultPresets.fractions);

    useEffect(() => {
        if (activeActivity?.numberLineData) {
            setLocalData(activeActivity.numberLineData);
        }
    }, [activeActivity?.numberLineData]);

    const currentData = activeActivity?.numberLineData || localData;

    const handleUpdate = (newData) => {
        const updatedData = { ...currentData, ...newData };
        setLocalData(updatedData);

        if (activeTabId) {
            updateActivityData(activeTabId, {
                numberLineData: updatedData,
                title: newData.title || updatedData.title
            });
        } else if (addActivityTab) {
            addActivityTab({
                title: newData.title || updatedData.title || 'Reta Numérica',
                type: 'number_line',
                content: '',
                numberLineData: updatedData
            });
        }
    };

    const handleApplyPreset = (presetKey) => {
        const preset = defaultPresets[presetKey];
        if (preset) {
            handleUpdate(preset);
        }
    };

    const getPointPositionString = (pt) => {
        if (pt.posStr !== undefined) return pt.posStr;
        if (currentData.domainType === 'fraction' && currentData.denominator > 0) {
            const den = Number(currentData.denominator) || 1;
            const num = Math.round(pt.val * den);
            if (Math.abs(pt.val - num / den) < 0.001) {
                if (num % den === 0) return `${num / den}`;
                return `${num}/${den}`;
            }
        }
        return `${pt.val}`;
    };

    const handleAddPoint = () => {
        const newId = `p_${Date.now()}`;
        const den = Number(currentData.denominator) || 4;
        let newVal, newStr;
        if (currentData.domainType === 'fraction') {
            const midNum = Math.round(((currentData.minVal + currentData.maxVal) / 2) * den);
            newVal = midNum / den;
            newStr = midNum % den === 0 ? `${midNum / den}` : `${midNum}/${den}`;
        } else {
            newVal = Math.round(((currentData.minVal + currentData.maxVal) / 2) * 10) / 10;
            newStr = `${newVal}`;
        }
        const newPoints = [
            ...(currentData.points || []),
            { id: newId, val: newVal, posStr: newStr, label: newStr, color: 'blue', hiddenVal: true }
        ];
        handleUpdate({ points: newPoints });
    };

    const handleRemovePoint = (id) => {
        const newPoints = (currentData.points || []).filter(p => p.id !== id);
        handleUpdate({ points: newPoints });
    };

    const handleUpdatePoint = (id, field, value) => {
        const newPoints = (currentData.points || []).map(p => {
            if (p.id === id) {
                return { ...p, [field]: value };
            }
            return p;
        });
        handleUpdate({ points: newPoints });
    };

    const handleUpdatePointPosition = (id, inputStr) => {
        let val = 0;
        const cleaned = inputStr.trim().replace(',', '.');
        if (cleaned.includes('/')) {
            const parts = cleaned.split('/');
            const num = parseFloat(parts[0]);
            const den = parseFloat(parts[1]);
            if (!isNaN(num) && !isNaN(den) && den !== 0) {
                val = num / den;
            } else if (!isNaN(num)) {
                val = num;
            }
        } else {
            const num = parseFloat(cleaned);
            if (!isNaN(num)) val = num;
        }

        const newPoints = (currentData.points || []).map(p => {
            if (p.id === id) {
                const oldPosStr = getPointPositionString(p);
                const isNumericOrMatchingLabel = !p.label || p.label === oldPosStr || /^[0-9/\s.-]+$/.test(p.label);
                return {
                    ...p,
                    posStr: inputStr,
                    val: val,
                    label: isNumericOrMatchingLabel ? inputStr : p.label
                };
            }
            return p;
        });
        handleUpdate({ points: newPoints });
    };

    const handleAddArc = () => {
        const newArcs = [
            ...(currentData.arcs || []),
            { id: `a_${Date.now()}`, fromVal: currentData.minVal, toVal: currentData.maxVal, label: 'Salto' }
        ];
        handleUpdate({ arcs: newArcs });
    };

    const handleRemoveArc = (id) => {
        const newArcs = (currentData.arcs || []).filter(a => a.id !== id);
        handleUpdate({ arcs: newArcs });
    };

    const handleUpdateArc = (id, field, value) => {
        const newArcs = (currentData.arcs || []).map(a => {
            if (a.id === id) {
                return { ...a, [field]: value };
            }
            return a;
        });
        handleUpdate({ arcs: newArcs });
    };

    const generateIntelligentDrackerActivity = () => {
        const types = ['fraction', 'integer', 'decimal'];
        const chosenType = (topic || '').toLowerCase().includes('inteiro') ? 'integer' : (topic || '').toLowerCase().includes('decimal') ? 'decimal' : types[Math.floor(Math.random() * types.length)];
        
        if (chosenType === 'integer') {
            const max = [5, 6, 8, 10][Math.floor(Math.random() * 4)];
            return {
                domainType: 'integer',
                minVal: -max,
                maxVal: max,
                step: 1,
                denominator: 1,
                title: `Reta Numérica dos Inteiros (-${max} a +${max})`,
                description: 'Analise a posição dos números positivos, negativos e o ponto de origem na reta.',
                points: [
                    { id: `p_${Date.now()}_1`, val: -Math.floor(max * 0.7), label: 'A', color: 'red', position: 'top', hiddenVal: true },
                    { id: `p_${Date.now()}_2`, val: -1, label: 'B', color: 'amber', position: 'bottom', hiddenVal: true },
                    { id: `p_${Date.now()}_3`, val: Math.floor(max * 0.5), label: 'C', color: 'blue', position: 'top', hiddenVal: true },
                    { id: `p_${Date.now()}_4`, val: 0, label: '0', color: 'purple', position: 'tick', hiddenVal: false }
                ],
                arcs: [],
                questions: [
                    'Qual letra representa um número negativo na reta numérica?',
                    'Qual é a distância em unidades entre o ponto A e a origem (0)?',
                    'Qual dos pontos marcados possui o maior valor absoluto?'
                ]
            };
        } else if (chosenType === 'decimal') {
            return {
                domainType: 'decimal',
                minVal: 0,
                maxVal: 2,
                step: 0.2,
                denominator: 10,
                title: 'Desafio na Reta Decimal (Décimos e Quintos)',
                description: 'Identifique os valores em notação decimal marcados na escala.',
                points: [
                    { id: `p_${Date.now()}_1`, val: 0.4, label: '0.4', color: 'blue', position: 'top', hiddenVal: true },
                    { id: `p_${Date.now()}_2`, val: 1.2, label: 'X', color: 'emerald', position: 'bottom', hiddenVal: true },
                    { id: `p_${Date.now()}_3`, val: 1.6, label: '?', color: 'red', position: 'top', hiddenVal: true }
                ],
                arcs: [],
                questions: [
                    'Qual número decimal a letra X representa na reta?',
                    'Escreva a fração irredutível equivalente ao ponto marcado em 0.4.',
                    'Quanto falta para o ponto X atingir o número inteiro 2?'
                ]
            };
        } else {
            const dens = [3, 5, 6, 8];
            const den = dens[Math.floor(Math.random() * dens.length)];
            return {
                domainType: 'fraction',
                minVal: 0,
                maxVal: 2,
                step: 1,
                denominator: den,
                title: `Explorando Frações na Reta (Subdivisão em ${den} partes)`,
                description: `A reta numérica entre cada número inteiro está dividida em ${den} partes iguais. Encontre as frações!`,
                points: [
                    { id: `p_${Date.now()}_1`, val: 1 / den, label: `1/${den}`, color: 'blue', position: 'top', hiddenVal: true },
                    { id: `p_${Date.now()}_2`, val: Math.floor(den * 1.5) / den, label: 'Ponto M', color: 'emerald', position: 'bottom', hiddenVal: true },
                    { id: `p_${Date.now()}_3`, val: 1, label: '1', color: 'purple', position: 'tick', hiddenVal: false }
                ],
                arcs: [],
                questions: [
                    `Que fração imprópria ou número misto o Ponto M representa?`,
                    `Por que a distância entre 0 e 1 foi dividida em ${den} partes? O que isso indica no denominador?`,
                    `Se avançarmos mais 2 subdivisões a partir de 1/${den}, em qual fração paramos?`
                ]
            };
        }
    };

    const handleGenerateAI = async () => {
        setIsGenerating(true);
        setStatusMsg({ text: '', type: '' });
        try {
            const apiKey = localStorage.getItem('gemini_api_key') || '';

            if (!apiKey) {
                setTimeout(() => {
                    const intelligentActivity = generateIntelligentDrackerActivity();
                    handleUpdate(intelligentActivity);
                    setStatusMsg({
                        text: 'Atividade pedagógica gerada e adaptada pelo Motor Inteligente Drácker! (Para IA em nuvem customizada por prompt, insira sua chave Gemini nas Configurações).',
                        type: 'success'
                    });
                    setIsGenerating(false);
                }, 800);
                return;
            }

            const prompt = buildNumberLinePrompt(topic, lessonDetails, difficulty);
            const gemini = getGeminiService(apiKey);
            const responseText = await gemini.generateText(prompt);
            const parsed = safeJSONParse(responseText);

            if (parsed && (parsed.points || parsed.minVal !== undefined)) {
                handleUpdate(parsed);
                setStatusMsg({
                    text: 'Atividade criada com sucesso via Inteligência Artificial Gemini!',
                    type: 'success'
                });
            } else {
                throw new Error('Falha no parse do retorno da IA.');
            }
        } catch (err) {
            console.warn('IA Nuvem indisponível ou erro no parse. Ativando Motor Pedagógico Local:', err);
            const intelligentActivity = generateIntelligentDrackerActivity();
            handleUpdate(intelligentActivity);
            setStatusMsg({
                text: 'Atividade dinâmica gerada pelo Motor Pedagógico Inteligente Drácker!',
                type: 'success'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadTransparentPNG = () => {
        const svgElem = document.getElementById('number-line-svg');
        if (!svgElem) return;

        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgElem);

        if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!svgString.match(/^<svg[^>]+width=/)) {
            svgString = svgString.replace(/^<svg/, '<svg width="1000" height="260"');
        }

        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Largura padrão exata de uma folha A4 em 300 DPI (2480 pixels) para preencher perfeitamente de ponta a ponta
            canvas.width = 2480;
            canvas.height = 645;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);

            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `${(currentData.title || 'reta-numerica').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-transparente.png`;
            downloadLink.href = pngUrl;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };
        img.src = url;
    };

    return (
        <div className="space-y-6 w-full">
            {/* Top Navigation Bar & Action Buttons */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-brown-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brown-100 rounded-xl text-brown-800">
                        <ArrowLeftRight className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-brown-900">Drácker: Crie sua Reta Numérica</h2>
                        <p className="text-xs text-brown-600">Ferramenta pedagógica para frações, números inteiros e decimais</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Button
                        onClick={() => setViewMode('editor')}
                        variant={viewMode === 'editor' ? 'primary' : 'ghost'}
                        icon={Settings}
                        className="text-xs py-2"
                    >
                        Construtor
                    </Button>
                    <Button
                        onClick={() => setViewMode('game')}
                        variant={viewMode === 'game' ? 'primary' : 'ghost'}
                        icon={Play}
                        className="text-xs py-2 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                        Lousa Interativa
                    </Button>
                    <Button
                        onClick={() => setViewMode('print')}
                        variant={viewMode === 'print' ? 'primary' : 'ghost'}
                        icon={Printer}
                        className="text-xs py-2"
                    >
                        Folha de Atividade
                    </Button>
                </div>
            </div>

            {/* Quick AI Assistant Bar */}
            {viewMode === 'editor' && (
                <Card className="bg-gradient-to-r from-amber-50 to-brown-50 border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 no-print shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>Crie ou adapte sua atividade pedagógica na reta numérica com Inteligência Artificial:</span>
                    </div>
                    <Button
                        onClick={handleGenerateAI}
                        isLoading={isGenerating}
                        variant="secondary"
                        icon={Sparkles}
                        className="text-xs py-1.5 px-4 bg-amber-400 hover:bg-amber-500 text-amber-950 font-extrabold border-amber-600 shadow shrink-0"
                    >
                        Gerar via Drácker IA
                    </Button>
                </Card>
            )}

            {statusMsg.text && (
                <div className={`p-3.5 border rounded-xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm transition-all ${
                    statusMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-amber-100 border-amber-300 text-amber-900'
                }`}>
                    <div className="flex items-center gap-2">
                        <span>{statusMsg.type === 'success' ? '✨' : '💡'}</span>
                        <span>{statusMsg.text}</span>
                    </div>
                    <button onClick={() => setStatusMsg({ text: '', type: '' })} className="opacity-60 hover:opacity-100 p-1">✕</button>
                </div>
            )}

            {/* MAIN VIEW MODE SWITCHER */}
            {viewMode === 'game' ? (
                <NumberLineGame
                    data={currentData}
                    onExitGame={() => setViewMode('editor')}
                />
            ) : viewMode === 'print' ? (
                <div className="space-y-4">
                    <div className="flex justify-end no-print">
                        <Button onClick={() => window.print()} icon={Printer} className="py-2.5 px-6 shadow-lg">
                            Imprimir / Salvar PDF
                        </Button>
                    </div>
                    <NumberLinePrint data={currentData} showAnswers={false} />
                </div>
            ) : (
                /* CONSTRUTOR / EDITOR MODE */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visual Preview Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                                <h3 className="text-sm font-black text-brown-800 uppercase tracking-wider">Visualização em Tempo Real</h3>
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Seletor de Pixels para Fonte */}
                                    <div className="flex items-center gap-1.5 bg-brown-50 px-2 py-1 rounded-lg border border-brown-200 text-xs font-bold text-brown-700">
                                        <span>Fonte:</span>
                                        <select
                                            value={currentData.fontSizePx || 16}
                                            onChange={(e) => handleUpdate({ fontSizePx: Number(e.target.value) })}
                                            className="bg-white border border-brown-300 rounded px-1.5 py-0.5 text-xs font-bold text-brown-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
                                        >
                                            <option value={12}>12 px</option>
                                            <option value={14}>14 px</option>
                                            <option value={16}>16 px (Padrão)</option>
                                            <option value={18}>18 px</option>
                                            <option value={20}>20 px</option>
                                            <option value={22}>22 px</option>
                                            <option value={24}>24 px</option>
                                            <option value={28}>28 px</option>
                                            <option value={32}>32 px</option>
                                            <option value={36}>36 px</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleDownloadTransparentPNG}
                                        className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-brown-500 hover:text-brown-800 bg-transparent hover:bg-brown-100/60 rounded-md transition-colors cursor-pointer"
                                        title="Baixar imagem PNG de alta resolução com fundo transparente"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Baixar PNG Transparente</span>
                                    </button>
                                    <span className="text-xs bg-brown-100 text-brown-700 px-2 py-1 rounded font-bold">
                                        {currentData.domainType === 'fraction' ? 'Fração' : currentData.domainType === 'integer' ? 'Inteiros' : 'Decimais'}
                                    </span>
                                </div>
                            </div>

                            <NumberLineRenderer data={currentData} showAnswers={true} />
                        </Card>

                        {/* Title & Description Settings - Dynamic Interactive Panel */}
                        <Card className="p-6 bg-gradient-to-br from-white via-amber-50/30 to-brown-50/50 border border-amber-200/80 shadow-md space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brown-200/60 pb-3.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shadow-2xs">
                                        <Sparkles className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-brown-900 tracking-tight">📝 Dados e Cabeçalho da Atividade</h3>
                                        <p className="text-[11px] text-brown-600 font-medium">Personalize o título e as instruções que aparecerão na folha do aluno</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 self-start sm:self-center bg-brown-100/80 text-brown-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-brown-200">
                                    <span>Domínio Ativo:</span>
                                    <span className="text-amber-900 underline decoration-amber-500 decoration-2">
                                        {currentData.domainType === 'fraction' ? 'Frações' : currentData.domainType === 'integer' ? 'Números Inteiros' : 'Decimais'}
                                    </span>
                                </div>
                            </div>

                            {/* Título interativo com sugestões */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-black text-brown-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>🏷️ Título Principal da Atividade</span>
                                    </label>
                                    <span className="text-[10px] font-bold text-brown-500">
                                        {(currentData.title || '').length} caracteres
                                    </span>
                                </div>
                                <Input
                                    value={currentData.title || ''}
                                    onChange={(e) => handleUpdate({ title: e.target.value })}
                                    placeholder="Ex: Desafio na Reta Numérica"
                                    className="font-bold text-brown-900 border-brown-300 focus:border-amber-500 shadow-2xs"
                                />
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    <span className="text-[11px] font-bold text-brown-700">Sugestões rápidas:</span>
                                    {(currentData.domainType === 'fraction'
                                        ? ['Caça às Frações na Reta 🎯', 'Desafio dos Denominadores 🧩', 'Onde está a Fração? 📍']
                                        : currentData.domainType === 'integer'
                                        ? ['Explorando os Inteiros (-/+) ❄️', 'Termômetro e Saldo na Reta 🌡️', 'Simétricos e Opostos ⚖️']
                                        : ['Régua e Décimos 📏', 'Salto Decimal na Reta 🏃', 'Precisão Decimal 🔍']
                                    ).map(sugTitle => (
                                        <button
                                            key={sugTitle}
                                            onClick={() => handleUpdate({ title: sugTitle })}
                                            className="text-[11px] bg-white hover:bg-amber-100 text-brown-800 font-bold px-2 py-0.5 rounded-lg border border-brown-200 transition-all shadow-2xs hover:border-amber-400 active:scale-95 cursor-pointer"
                                            title="Clique para usar este título"
                                        >
                                            + {sugTitle}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Enunciado interativo com sugestões */}
                            <div className="space-y-2 pt-1">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-black text-brown-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>📢 Enunciado Pedagógico / Instruções Gerais</span>
                                    </label>
                                </div>
                                <TextArea
                                    value={currentData.description || ''}
                                    onChange={(e) => handleUpdate({ description: e.target.value })}
                                    rows={3}
                                    placeholder="Digite as instruções ou selecione uma sugestão abaixo..."
                                    className="text-sm font-medium text-brown-800 border-brown-300 focus:border-amber-500 shadow-2xs leading-relaxed"
                                />
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                    <span className="text-[11px] font-bold text-brown-700">Enunciados dinâmicos:</span>
                                    {(currentData.domainType === 'fraction'
                                        ? [
                                            'Observe a reta numérica dividida em partes iguais e descubra as frações correspondentes aos pontos marcados.',
                                            'Identifique os valores das frações ocultas e responda às questões pedagógicas abaixo.'
                                        ]
                                        : currentData.domainType === 'integer'
                                        ? [
                                            'Analise os números inteiros na reta. Identifique os valores positivos, negativos e suas distâncias até a origem (0).',
                                            'Encontre a posição dos pontos na escala e determine o simétrico ou oposto de cada marcador.'
                                        ]
                                        : [
                                            'Observe atentamente a régua decimal e determine o valor exato em décimos dos pontos destacados.',
                                            'Calcule os saltos entre os números decimais e complete os valores que faltam na reta.'
                                        ]
                                    ).map((sugDesc, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleUpdate({ description: sugDesc })}
                                            className="text-[11px] bg-white hover:bg-amber-100 text-brown-800 font-semibold px-2.5 py-1 rounded-lg border border-brown-200 transition-all shadow-2xs hover:border-amber-400 text-left active:scale-98 cursor-pointer"
                                            title="Clique para usar este enunciado"
                                        >
                                            💡 {sugDesc.slice(0, 52)}...
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Settings & Points Editor */}
                    <div className="space-y-6">
                        {/* Domain & Interval Card */}
                        <Card className="space-y-4">
                            <h3 className="text-sm font-bold text-brown-800 border-b border-brown-100 pb-2">
                                📏 Domínio e Intervalo
                            </h3>

                            <Select
                                label="Tipo de Número"
                                value={currentData.domainType || 'fraction'}
                                onChange={(e) => handleUpdate({ domainType: e.target.value })}
                                options={[
                                    { value: 'fraction', label: 'Frações (Ex: 1/2, 3/4)' },
                                    { value: 'integer', label: 'Inteiros (Ex: -5, 0, +5)' },
                                    { value: 'decimal', label: 'Decimais (Ex: 0.1, 1.5)' }
                                ]}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Início (Mínimo)"
                                    type="number"
                                    value={currentData.minVal}
                                    onChange={(e) => handleUpdate({ minVal: Number(e.target.value) })}
                                />
                                <Input
                                    label="Fim (Máximo)"
                                    type="number"
                                    value={currentData.maxVal}
                                    onChange={(e) => handleUpdate({ maxVal: Number(e.target.value) })}
                                />
                            </div>

                            {currentData.domainType === 'fraction' ? (
                                <div className="space-y-3">
                                    <Input
                                        label="Denominador(es) / Subdivisões (Ex: 4 ou 2, 4)"
                                        type="text"
                                        value={currentData.denominator ?? '4'}
                                        onChange={(e) => handleUpdate({ denominator: e.target.value })}
                                        placeholder="Ex: 4 (ou 2, 4 para múltiplas escalas)"
                                    />
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <span className="text-xs font-bold text-brown-700 w-full">🎨 Cores das Subdivisões (por Denominador):</span>
                                        {(typeof currentData.denominator === 'string'
                                            ? currentData.denominator.split(/[,;\s]+/).map(Number).filter(n => !isNaN(n) && n > 0)
                                            : [Number(currentData.denominator) || 4]
                                        ).map((den, idx) => {
                                            const denColors = currentData.denominatorColors || {};
                                            const defaultCol = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'][idx % 6] || '#3b82f6';
                                            const col = denColors[den] || defaultCol;
                                            return (
                                                <div key={den} className="flex items-center gap-1.5 px-2.5 py-1 bg-brown-50 rounded-xl border border-brown-200 shadow-sm">
                                                    <span className="text-xs font-bold text-brown-800">1/{den}:</span>
                                                    <input
                                                        type="color"
                                                        value={col}
                                                        onChange={(e) => {
                                                            handleUpdate({
                                                                denominatorColors: {
                                                                    ...(currentData.denominatorColors || {}),
                                                                    [den]: e.target.value
                                                                }
                                                            });
                                                        }}
                                                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                                                        title={`Escolha a cor RGB para as frações com denominador ${den}`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <Input
                                    label="Passo de Marcação (Escala)"
                                    type="number"
                                    step={currentData.domainType === 'decimal' ? '0.1' : '1'}
                                    value={currentData.step || 1}
                                    onChange={(e) => handleUpdate({ step: Number(e.target.value) })}
                                />
                            )}
                        </Card>

                        {/* Points Management Card */}
                        <Card className="space-y-4">
                            <div className="flex justify-between items-center border-b border-brown-100 pb-2">
                                <h3 className="text-sm font-bold text-brown-800">📍 Marcadores e Pinos</h3>
                                <Button onClick={handleAddPoint} variant="secondary" className="py-1 px-2.5 text-xs flex items-center gap-1">
                                    <Plus className="w-3.5 h-3.5" /> Adicionar
                                </Button>
                            </div>

                            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1.5 custom-scrollbar">
                                {(currentData.points || []).map((pt, index) => (
                                    <div key={pt.id} className="p-3.5 bg-gradient-to-r from-brown-50/80 to-amber-50/40 rounded-2xl border border-brown-200/80 shadow-xs space-y-3 transition-all hover:border-brown-300">
                                        {/* Linha 1: Cabeçalho do Marcador e Ações Rápidas */}
                                        <div className="flex items-center justify-between gap-2 border-b border-brown-100 pb-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-xs"
                                                    style={{
                                                        backgroundColor: pt.color?.startsWith('#') ? pt.color : ({ blue: '#3b82f6', emerald: '#10b981', amber: '#f59e0b', red: '#ef4444', purple: '#a855f7' }[pt.color] || '#3b82f6')
                                                    }}
                                                >
                                                    {index + 1}
                                                </span>
                                                <span className="text-xs font-bold text-brown-800">Marcador #{index + 1}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <label className="flex items-center justify-center p-1.5 bg-white border border-brown-300 rounded-lg shadow-2xs cursor-pointer hover:bg-brown-50/80 transition-colors" title="Aperte para alterar a cor do marcador">
                                                    <input
                                                        type="color"
                                                        value={pt.color?.startsWith('#') ? pt.color : ({ blue: '#3b82f6', emerald: '#10b981', amber: '#f59e0b', red: '#ef4444', purple: '#a855f7' }[pt.color] || '#3b82f6')}
                                                        onChange={(e) => handleUpdatePoint(pt.id, 'color', e.target.value)}
                                                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                                                    />
                                                </label>
                                                <button
                                                    onClick={() => handleRemovePoint(pt.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remover Marcador"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Linha 2: Grade com os 3 controles essenciais */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                            <div>
                                                <label className="block text-[10px] font-extrabold text-brown-600 uppercase tracking-wider mb-1">Rótulo / Texto</label>
                                                <input
                                                    type="text"
                                                    value={pt.label || ''}
                                                    onChange={(e) => handleUpdatePoint(pt.id, 'label', e.target.value)}
                                                    placeholder="Ex: A, x ou ?"
                                                    className="w-full px-2.5 py-1.5 bg-white border border-brown-300 rounded-lg text-xs font-bold text-brown-900 focus:outline-hidden focus:ring-2 focus:ring-brown-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-extrabold text-brown-600 uppercase tracking-wider mb-1">Posição na Reta</label>
                                                <input
                                                    type="text"
                                                    value={pt.posStr !== undefined ? pt.posStr : getPointPositionString(pt)}
                                                    onChange={(e) => handleUpdatePointPosition(pt.id, e.target.value)}
                                                    placeholder="Ex: 3/4 ou -2"
                                                    className="w-full px-2.5 py-1.5 bg-white border border-brown-300 rounded-lg text-xs font-bold text-center text-brown-900 focus:outline-hidden focus:ring-2 focus:ring-brown-500"
                                                    title="Digite uma fração (ex: 3/4) ou número (ex: -2 ou 1.5)"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-extrabold text-brown-600 uppercase tracking-wider mb-1">Tipo de Exibição</label>
                                                <select
                                                    value={pt.position || 'top'}
                                                    onChange={(e) => handleUpdatePoint(pt.id, 'position', e.target.value)}
                                                    className="w-full px-2.5 py-1.5 bg-white border border-brown-300 rounded-lg text-xs font-bold text-brown-900 focus:outline-hidden focus:ring-2 focus:ring-brown-500 cursor-pointer"
                                                >
                                                    <option value="top">⬆️ Balão Acima</option>
                                                    <option value="bottom">⬇️ Balão Abaixo</option>
                                                    <option value="tick">✏️ Rótulo no Eixo</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Linha 3: Ocultar no exercício */}
                                        <div className="pt-1 flex items-center">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(pt.hiddenVal)}
                                                    onChange={(e) => handleUpdatePoint(pt.id, 'hiddenVal', e.target.checked)}
                                                    className="w-3.5 h-3.5 rounded text-brown-600 accent-brown-600 cursor-pointer"
                                                />
                                                <span className="text-[11px] font-bold text-brown-700">
                                                    Ocultar valor na Lousa/Exercício (Exibir "?")
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Arcs / Jumps Management Card */}
                        <Card className="space-y-4">
                            <div className="flex justify-between items-center border-b border-brown-100 pb-2">
                                <h3 className="text-sm font-bold text-brown-800">🔄 Saltos / Arcos (Tracejados)</h3>
                                <Button onClick={handleAddArc} variant="secondary" className="py-1 px-2.5 text-xs flex items-center gap-1">
                                    <Plus className="w-3.5 h-3.5" /> Adicionar Salto
                                </Button>
                            </div>

                            {(currentData.arcs || []).length === 0 ? (
                                <p className="text-xs text-brown-500 italic text-center py-2">
                                    Nenhum salto tracejado ativo nesta reta.
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-1.5 custom-scrollbar">
                                    {(currentData.arcs || []).map((arc, index) => (
                                        <div key={arc.id} className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 shadow-xs space-y-3">
                                            <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
                                                <span className="text-xs font-bold text-amber-900">Salto Tracejado #{index + 1}</span>
                                                <button
                                                    onClick={() => handleRemoveArc(arc.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remover salto tracejado"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                <div>
                                                    <label className="block text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-1">De (Início)</label>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={arc.fromVal}
                                                        onChange={(e) => handleUpdateArc(arc.id, 'fromVal', Number(e.target.value))}
                                                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-center text-amber-950 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-1">Para (Destino)</label>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={arc.toVal}
                                                        onChange={(e) => handleUpdateArc(arc.id, 'toVal', Number(e.target.value))}
                                                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-center text-amber-950 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-1">Rótulo / Operação</label>
                                                    <input
                                                        type="text"
                                                        value={arc.label || ''}
                                                        onChange={(e) => handleUpdateArc(arc.id, 'label', e.target.value)}
                                                        placeholder="Ex: +2/4 ou +5"
                                                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-center text-amber-950 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};
