import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
    PieChart, Plus, Minus, X, Divide, Maximize2, Minimize2, 
    Download, Printer, Sparkles, RefreshCw, CheckCircle2, HelpCircle, Wand2 
} from 'lucide-react';
import { FractionsRenderer } from './FractionsRenderer';
import { FractionsAIModal } from './FractionsAIModal';
import { useActivity } from '../../contexts/ActivityContext';

export const FractionsMaker = () => {
    const { activeTabId, activeActivity, updateActivityData } = useActivity();
    const fd = activeActivity?.fractionsData || {};

    // --- STATE ---
    const [activeTab, setActiveTab] = useState(fd.activeTab || 'single'); // 'single' | 'ops' | 'print'
    
    // Comparison / Multi View State
    const [fractions, setFractions] = useState(fd.fractions || [
        { id: 1, type: 'fraction', num: 3, den: 4, decimalValue: '0.75', color: '#3b82f6' }
    ]);
    const [shape, setShape] = useState(fd.shape || 'circle');
    
    // Operations State
    const [opType1, setOpType1] = useState(fd.opType1 || 'fraction');
    const [opDecimal1, setOpDecimal1] = useState(fd.opDecimal1 !== undefined ? fd.opDecimal1 : '0.5');
    const [opNum1, setOpNum1] = useState(fd.opNum1 !== undefined ? fd.opNum1 : 1);
    const [opDen1, setOpDen1] = useState(fd.opDen1 !== undefined ? fd.opDen1 : 2);
    const [opColor1, setOpColor1] = useState(fd.opColor1 || '#3b82f6'); // azul
    const [opType2, setOpType2] = useState(fd.opType2 || 'fraction');
    const [opDecimal2, setOpDecimal2] = useState(fd.opDecimal2 !== undefined ? fd.opDecimal2 : '0.25');
    const [opNum2, setOpNum2] = useState(fd.opNum2 !== undefined ? fd.opNum2 : 1);
    const [opDen2, setOpDen2] = useState(fd.opDen2 !== undefined ? fd.opDen2 : 3);
    const [opColor2, setOpColor2] = useState(fd.opColor2 || '#f59e0b'); // laranja
    const [operator, setOperator] = useState(fd.operator || '+'); // '+', '-', '*', '/'
    
    // UI / Presentation State
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showAnswers, setShowAnswers] = useState(fd.showAnswers || false);
    const [printCount, setPrintCount] = useState(fd.printCount || 6);
    const [printType, setPrintType] = useState(fd.printType || 'all'); // 'all' | 'visual' | 'ops' | 'simplify'
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [customExercisesData, setCustomExercisesData] = useState(fd.customExercisesData || null);
    const [aiHistory, setAiHistory] = useState(fd.aiHistory || []); // Histórico de atividades IA na sessão
    const [activeSource, setActiveSource] = useState(fd.activeSource || 'random'); // 'random' | índice em aiHistory
    const [imageSizePx, setImageSizePx] = useState(fd.imageSizePx || 140); // Linha scrubbing: 60px a 280px (Padrão 140px)
    const [fontSizePx, setFontSizePx] = useState(fd.fontSizePx || 16); // Linha scrubbing de fonte: 12px a 36px (Padrão 16px)

    // Autosave to context
    useEffect(() => {
        if (activeTabId) {
            updateActivityData(activeTabId, {
                fractionsData: {
                    activeTab, fractions, shape, opNum1, opDen1, opColor1, opNum2, opDen2, opColor2,
                    opType1, opDecimal1, opType2, opDecimal2,
                    operator, showAnswers, printCount, printType, customExercisesData, aiHistory,
                    activeSource, imageSizePx, fontSizePx
                }
            });
        }
    }, [
        activeTabId, updateActivityData,
        activeTab, fractions, shape, opNum1, opDen1, opColor1, opNum2, opDen2, opColor2,
        opType1, opDecimal1, opType2, opDecimal2,
        operator, showAnswers, printCount, printType, customExercisesData, aiHistory,
        activeSource, imageSizePx, fontSizePx
    ]);

    // Colors Palette
    const colorOptions = [
        { label: 'Azul', value: '#3b82f6', bg: 'bg-blue-500' },
        { label: 'Verde', value: '#10b981', bg: 'bg-emerald-500' },
        { label: 'Roxo', value: '#8b5cf6', bg: 'bg-purple-500' },
        { label: 'Laranja', value: '#f59e0b', bg: 'bg-amber-500' },
        { label: 'Rosa', value: '#f43f5e', bg: 'bg-rose-500' },
        { label: 'Indigo', value: '#6366f1', bg: 'bg-indigo-500' },
    ];

    // ESC Key to close fullscreen
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // --- FRACTIONS MULTI-VIEW HELPERS ---
    const addFraction = () => {
        if (fractions.length >= 5) return;
        setFractions([...fractions, { id: Date.now(), type: 'fraction', num: 1, den: 2, decimalValue: '0.5', color: colorOptions[Math.floor(Math.random() * colorOptions.length)].value }]);
    };
    
    const updateFraction = (id, field, value) => {
        setFractions(fractions.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    const removeFraction = (id) => {
        if (fractions.length <= 1) return;
        setFractions(fractions.filter(f => f.id !== id));
    };

    // --- MATH HELPERS ---
    const mdc = (a, b) => (b === 0 ? Math.abs(a) : mdc(b, a % b));

    const formatDecimal = (val) => {
        const num = Number(String(val).replace(',', '.'));
        if (isNaN(num)) return val;
        return num.toLocaleString(undefined, { maximumFractionDigits: 3 });
    };

    const decimalToFraction = (decimalStr) => {
        let str = String(decimalStr).replace(',', '.');
        let val = parseFloat(str);
        if (isNaN(val)) return { num: 0, den: 1, divisor: 1, raw: str };
        
        let decParts = str.split('.');
        if (decParts.length === 1) {
            return { num: parseInt(decParts[0]), den: 1, divisor: 1, raw: str };
        }
        let decimals = decParts[1].length;
        let den = Math.pow(10, decimals);
        let num = parseInt(str.replace('.', ''));
        
        let divisor = mdc(num, den);
        return { num: num / divisor, den: den / divisor, divisor, raw: str };
    };

    const getMixedFractionText = (n, d) => {
        if (n === 0) return "0";
        if (d === 1) return `${n}`;
        if (n >= d) {
            const whole = Math.floor(n / d);
            const rem = n % d;
            if (rem === 0) return `${whole} (Inteiro)`;
            return `${whole} e ${rem}/${d}`;
        }
        return `${n}/${d}`;
    };

    const getMixedFractionJSX = (n, d) => {
        if (n === 0) return <span style={{ fontSize: `${fontSizePx}px` }}>0</span>;
        if (d === 1) return <span style={{ fontSize: `${fontSizePx}px` }}>{n}</span>;
        if (n >= d) {
            const whole = Math.floor(n / d);
            const rem = n % d;
            if (rem === 0) return <span className="font-bold text-blue-700" style={{ fontSize: `${fontSizePx}px` }}>{whole} (Inteiro)</span>;
            return (
                <span className="inline-flex items-center gap-1" style={{ fontSize: `${fontSizePx}px` }}>
                    <span className="text-gray-700">{n}/{d} =</span>
                    <span className="font-extrabold text-blue-700" style={{ fontSize: `${fontSizePx * 1.2}px` }}>{whole}</span>
                    <span className="text-gray-500 font-semibold uppercase" style={{ fontSize: `${Math.max(10, fontSizePx - 4)}px` }}>e</span>
                    <span className="font-bold text-blue-700" style={{ fontSize: `${fontSizePx}px` }}>{rem}/{d}</span>
                </span>
            );
        }
        return <span className="font-bold text-gray-800" style={{ fontSize: `${fontSizePx}px` }}>{n}/{d}</span>;
    };

    // --- PNG DOWNLOAD HELPER ---
    const handleDownloadTransparentPNG = (containerId, filename = "fracao_dracker.png") => {
        const container = document.getElementById(containerId);
        if (!container) return;
        const svgs = container.querySelectorAll('svg');
        if (svgs.length === 0) return;

        const size = 200;
        const padding = 20;
        const width = svgs.length * size + (svgs.length - 1) * padding;
        const height = size;

        const canvas = document.createElement('canvas');
        canvas.width = width * 2; // 2x resolution
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);

        let loaded = 0;
        const serializer = new XMLSerializer();

        svgs.forEach((svg, idx) => {
            let svgStr = serializer.serializeToString(svg);
            if (!svgStr.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
                svgStr = svgStr.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, idx * (size + padding), 0, size, size);
                URL.revokeObjectURL(url);
                loaded++;
                if (loaded === svgs.length) {
                    const pngUrl = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = pngUrl;
                    link.click();
                }
            };
            img.src = url;
        });
    };

    // --- OPERATIONS CALCULATION ---
    const calculateOperations = () => {
        let n1, d1, n2, d2;
        let isDec1 = false, isDec2 = false;
        
        if (opType1 === 'decimal') {
            const f1 = decimalToFraction(opDecimal1);
            n1 = f1.num;
            d1 = f1.den;
            isDec1 = true;
        } else {
            n1 = Math.max(0, Number(opNum1) || 0);
            d1 = Math.max(1, Number(opDen1) || 1);
        }

        if (opType2 === 'decimal') {
            const f2 = decimalToFraction(opDecimal2);
            n2 = f2.num;
            d2 = f2.den;
            isDec2 = true;
        } else {
            n2 = Math.max(0, Number(opNum2) || 0);
            d2 = Math.max(1, Number(opDen2) || 1);
        }

        let resN = 0, resD = 1;
        let showEquivalents = false;
        let eqN1 = n1, eqD1 = d1, eqN2 = n2, eqD2 = d2;
        let mmcValue = d1;
        let multsA = [], multsB = [];

        if (operator === '+' || operator === '-') {
            if (d1 === d2) {
                resD = d1;
                resN = operator === '+' ? n1 + n2 : n1 - n2;
            } else {
                showEquivalents = true;
                mmcValue = (d1 * d2) / mdc(d1, d2);
                resD = mmcValue;
                const m1 = resD / d1;
                const m2 = resD / d2;
                eqN1 = n1 * m1;
                eqN2 = n2 * m2;
                eqD1 = resD;
                eqD2 = resD;
                resN = operator === '+' ? eqN1 + eqN2 : eqN1 - eqN2;

                for (let i = 1; i <= (mmcValue / d1) + 1; i++) multsA.push(d1 * i);
                for (let i = 1; i <= (mmcValue / d2) + 1; i++) multsB.push(d2 * i);
            }
        } else if (operator === '*') {
            resN = n1 * n2;
            resD = d1 * d2;
        } else if (operator === '/') {
            resN = n1 * d2;
            resD = d1 * n2;
            if (resD === 0) resD = 1;
        }

        const divisor = mdc(resN, resD);
        let finalN = resN;
        let finalD = resD;
        if (divisor > 1 && resN !== 0) {
            finalN = resN / divisor;
            finalD = resD / divisor;
        }

        return {
            n1, d1, n2, d2, isDec1, isDec2,
            resN, resD, finalN, finalD, divisor,
            showEquivalents, eqN1, eqD1, eqN2, eqD2,
            mmcValue, multsA, multsB
        };
    };

    const opsData = calculateOperations();

    const operatorSymbols = { '+': '+', '-': '-', '*': '×', '/': '÷' };

    // --- RENDER CONTENT ---
    const renderVisualizerContent = (isFullScreenView = false) => (
        <div className="space-y-6">
            {/* Control Bar */}
            <Card className="p-5 bg-gradient-to-r from-blue-50/80 to-slate-50 border-blue-200">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col bg-white p-2 rounded-xl border border-slate-300 shadow-2xs">
                                <label className="text-[10px] font-extrabold text-slate-500 mb-1 uppercase tracking-wider">Forma Global</label>
                                <select
                                    value={shape}
                                    onChange={(e) => setShape(e.target.value)}
                                    className="px-3 py-1 border border-slate-200 rounded-lg font-bold text-sm bg-slate-50 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="circle">⚪ Círculo</option>
                                    <option value="rectangle">▭ Retângulo</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={() => handleDownloadTransparentPNG('single-svg-container', `comparacao_fracoes.png`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
                                title="Baixar imagem PNG transparente"
                            >
                                <Download className="w-3.5 h-3.5 text-blue-600" />
                                <span>Baixar PNG</span>
                            </button>

                            {/* Botão Tela Cheia */}
                            {!isFullScreenView && (
                                <button
                                    onClick={() => setIsFullscreen(true)}
                                    className="flex items-center justify-center p-2 text-blue-950 bg-blue-200 hover:bg-blue-300 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 border border-blue-400 ml-1"
                                    title="Expandir para 100% da tela (Tela Cheia)"
                                >
                                    <Maximize2 className="w-4 h-4 text-blue-900" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Fractions List Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {fractions.map((frac, idx) => (
                            <div key={frac.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-300 shadow-2xs relative group">
                                <span className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-slate-700 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                    {idx + 1}
                                </span>
                                
                                <div className="flex flex-col gap-1 items-center justify-center border-r border-slate-100 pr-2">
                                    <button 
                                        onClick={() => updateFraction(frac.id, 'type', frac.type === 'fraction' ? 'decimal' : 'fraction')}
                                        className="text-[10px] font-extrabold uppercase bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                                        title="Alternar entre Fração e Decimal"
                                    >
                                        {frac.type === 'fraction' ? 'Fração' : 'Decimal'}
                                    </button>
                                </div>

                                {frac.type === 'fraction' ? (
                                    <div className="flex items-center gap-2 pl-1">
                                        <input
                                            type="number" min="0" max="50" value={frac.num}
                                            onChange={(e) => updateFraction(frac.id, 'num', Math.max(0, Number(e.target.value)))}
                                            className="w-14 text-center font-extrabold text-lg bg-slate-50 border border-slate-300 rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-xl font-black text-slate-400">/</span>
                                        <input
                                            type="number" min="1" max="50" value={frac.den}
                                            onChange={(e) => updateFraction(frac.id, 'den', Math.max(1, Number(e.target.value)))}
                                            className="w-14 text-center font-extrabold text-lg bg-slate-50 border border-slate-300 rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 pl-1">
                                        <input
                                            type="number" step="0.01" value={frac.decimalValue}
                                            onChange={(e) => updateFraction(frac.id, 'decimalValue', e.target.value)}
                                            className="w-24 text-center font-extrabold text-lg bg-slate-50 border border-slate-300 rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}
                                
                                <div className="flex flex-col items-center justify-center gap-1.5 pl-3 border-l border-slate-200">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Cor</span>
                                    <label 
                                        className="relative w-8 h-8 rounded-full shadow-sm border-2 border-slate-200 hover:scale-110 hover:border-blue-400 transition-all overflow-hidden cursor-pointer flex-shrink-0" 
                                        style={{ backgroundColor: frac.color }}
                                        title="Escolher Cor Livre (RGB)"
                                    >
                                        <input
                                            type="color"
                                            value={frac.color}
                                            onChange={(e) => updateFraction(frac.id, 'color', e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </label>
                                </div>
                                
                                {fractions.length > 1 && (
                                    <button
                                        onClick={() => removeFraction(frac.id)}
                                        className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors rounded-full flex items-center justify-center border-2 border-white shadow-sm opacity-0 group-hover:opacity-100 cursor-pointer"
                                        title="Remover Fração"
                                    >
                                        <X className="w-3 h-3 font-bold" />
                                    </button>
                                )}
                            </div>
                        ))}
                        
                        {fractions.length < 5 && (
                            <button
                                onClick={addFraction}
                                className="flex flex-col items-center justify-center gap-1 h-[88px] px-4 border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 rounded-2xl transition-colors cursor-pointer text-blue-600"
                            >
                                <Plus className="w-6 h-6" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Adicionar</span>
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Visual Display */}
            <Card className="p-8 flex flex-col items-center justify-center min-h-80 bg-white border-slate-200 shadow-sm overflow-x-auto">
                <div id="single-svg-container" className="flex items-center justify-center gap-4 md:gap-8 p-6 min-w-max bg-slate-50/60 rounded-2xl border border-dashed border-slate-300 my-4">
                    {fractions.map((frac, idx) => {
                        let renderNum = frac.num;
                        let renderDen = frac.den;
                        
                        if (frac.type === 'decimal') {
                            const decObj = decimalToFraction(frac.decimalValue);
                            renderNum = decObj.num;
                            renderDen = decObj.den;
                        }
                        
                        return (
                            <React.Fragment key={frac.id}>
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex flex-col items-center">
                                        <span className="inline-block px-3 py-1 rounded-t-lg bg-white border border-slate-200 border-b-0 text-slate-700 font-bold shadow-2xs text-center min-w-[80px]" style={{ fontSize: `${Math.max(12, fontSizePx - 2)}px` }}>
                                            {frac.type === 'fraction' ? (
                                                renderNum >= renderDen && renderNum % renderDen !== 0 
                                                    ? getMixedFractionJSX(renderNum, renderDen)
                                                    : `${renderNum}/${renderDen}`
                                            ) : (
                                                <span style={{ fontSize: `${fontSizePx}px` }}>{formatDecimal(frac.decimalValue)}</span>
                                            )}
                                        </span>
                                        <span className="inline-block px-3 py-0.5 rounded-b-lg bg-slate-100 border border-slate-200 text-slate-500 font-bold text-center min-w-[80px]" style={{ fontSize: `${Math.max(10, fontSizePx - 6)}px` }}>
                                            {frac.type === 'fraction' ? `= ${formatDecimal(frac.num / frac.den)}` : `= ${renderNum}/${renderDen}`}
                                        </span>
                                    </div>
                                    <FractionsRenderer
                                        numerator={renderNum}
                                        denominator={renderDen}
                                        shape={shape}
                                        fillColor={frac.color}
                                        sizeClassName="shrink-0"
                                        style={{ width: isFullScreenView ? `${Math.min(imageSizePx * 1.5, 300)}px` : `${imageSizePx}px`, height: isFullScreenView ? `${Math.min(imageSizePx * 1.5, 300)}px` : `${imageSizePx}px` }}
                                        maxShapesToRender={20}
                                    />
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="mt-4 text-center text-slate-500 max-w-lg" style={{ fontSize: `${Math.max(12, fontSizePx - 2)}px` }}>
                    💡 <strong className="text-slate-700">Dica Pedagógica:</strong> Compare as frações visualmente. Você pode utilizar o espaço entre as figuras para perguntar ao aluno se a primeira é maior (&gt;), menor (&lt;) ou equivalente (=) à segunda.
                </div>
            </Card>
        </div>
    );

    const renderOperationsContent = (isFullScreenView = false) => {
        const sumMultiColors = operator === '+' ? [
            { count: opsData.eqN1, color: opColor1 },
            { count: opsData.eqN2, color: opColor2 }
        ] : null;

        const simplifiedMultiColors = operator === '+' && opsData.eqN1 % opsData.divisor === 0 && opsData.eqN2 % opsData.divisor === 0 ? [
            { count: opsData.eqN1 / opsData.divisor, color: opColor1 },
            { count: opsData.eqN2 / opsData.divisor, color: opColor2 }
        ] : null;

        return (
            <div className="space-y-6">
                {/* Control Bar */}
            <Card className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-blue-200 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        {/* 1º Termo com Cor Própria */}
                        <div className="flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-300 shadow-2xs gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">1º Termo</span>
                                <button 
                                    onClick={() => setOpType1(opType1 === 'fraction' ? 'decimal' : 'fraction')}
                                    className="text-[9px] font-extrabold uppercase bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                                    title="Alternar entre Fração e Decimal"
                                >
                                    {opType1 === 'fraction' ? 'Fração' : 'Decimal'}
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                {opType1 === 'fraction' ? (
                                    <div className="flex flex-col items-center">
                                        <input
                                            type="number" min="0" max="30" value={opNum1}
                                            onChange={(e) => setOpNum1(Math.max(0, Number(e.target.value)))}
                                            className="w-14 text-center font-extrabold text-lg bg-slate-50 border border-slate-300 rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="w-12 h-0.5 bg-slate-800 my-1" />
                                        <input
                                            type="number" min="1" max="30" value={opDen1}
                                            onChange={(e) => setOpDen1(Math.max(1, Number(e.target.value)))}
                                            className="w-14 text-center font-extrabold text-lg bg-slate-50 border border-slate-300 rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <input
                                            type="number" step="0.01" value={opDecimal1}
                                            onChange={(e) => setOpDecimal1(e.target.value)}
                                            className="w-20 text-center font-extrabold text-lg bg-slate-50 border border-slate-300 rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}
                                <div className="flex flex-col items-center justify-center gap-1 pl-2.5 border-l border-slate-200">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Cor</span>
                                    <label 
                                        className="relative w-8 h-8 mt-1 rounded-full shadow-sm border-2 border-slate-200 hover:scale-110 hover:border-blue-400 transition-all overflow-hidden cursor-pointer flex-shrink-0" 
                                        style={{ backgroundColor: opColor1 }}
                                        title="Escolher Cor Livre (RGB)"
                                    >
                                        <input
                                            type="color"
                                            value={opColor1}
                                            onChange={(e) => setOpColor1(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Operador (Apenas Símbolos) */}
                        <select
                            value={operator}
                            onChange={(e) => setOperator(e.target.value)}
                            className="px-4 py-2 border-2 border-blue-500 rounded-2xl font-black text-3xl text-blue-700 bg-white shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-50 transition-all text-center"
                        >
                            <option value="+">＋</option>
                            <option value="-">－</option>
                            <option value="*">×</option>
                            <option value="/">÷</option>
                        </select>

                        {/* 2º Termo com Cor Própria */}
                        <div className="flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-300 shadow-2xs gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">2º Termo</span>
                                <button 
                                    onClick={() => setOpType2(opType2 === 'fraction' ? 'decimal' : 'fraction')}
                                    className="text-[9px] font-extrabold uppercase bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                                    title="Alternar entre Fração e Decimal"
                                >
                                    {opType2 === 'fraction' ? 'Fração' : 'Decimal'}
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                {opType2 === 'fraction' ? (
                                    <div className="flex flex-col items-center">
                                        <input
                                            type="number" min="0" max="30" value={opNum2}
                                            onChange={(e) => setOpNum2(Math.max(0, Number(e.target.value)))}
                                            className="w-14 text-center font-extrabold text-lg bg-slate-50 border border-slate-300 rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div className="w-12 h-0.5 bg-slate-800 my-1" />
                                        <input
                                            type="number" min="1" max="30" value={opDen2}
                                            onChange={(e) => setOpDen2(Math.max(1, Number(e.target.value)))}
                                            className="w-14 text-center font-extrabold text-lg bg-slate-50 border border-slate-300 rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <input
                                            type="number" step="0.01" value={opDecimal2}
                                            onChange={(e) => setOpDecimal2(e.target.value)}
                                            className="w-20 text-center font-extrabold text-lg bg-slate-50 border border-slate-300 rounded-lg px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}
                                <div className="flex flex-col items-center justify-center gap-1 pl-2.5 border-l border-slate-200">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Cor</span>
                                    <label 
                                        className="relative w-8 h-8 mt-1 rounded-full shadow-sm border-2 border-slate-200 hover:scale-110 hover:border-blue-400 transition-all overflow-hidden cursor-pointer flex-shrink-0" 
                                        style={{ backgroundColor: opColor2 }}
                                        title="Escolher Cor Livre (RGB)"
                                    >
                                        <input
                                            type="color"
                                            value={opColor2}
                                            onChange={(e) => setOpColor2(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Forma */}
                        <div className="flex flex-col bg-white p-3 rounded-2xl border border-slate-300 shadow-2xs justify-center self-stretch">
                            <label className="text-[10px] font-extrabold text-slate-500 mb-1.5 uppercase tracking-wider">Forma</label>
                            <select
                                value={shape}
                                onChange={(e) => setShape(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-xl font-bold text-sm bg-slate-50 shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 h-full"
                            >
                                <option value="circle">⚪ Círculo</option>
                                <option value="rectangle">▭ Retângulo</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <button
                            onClick={() => handleDownloadTransparentPNG('ops-svg-container', `operacao_${opNum1}_${opDen1}_${operator}_${opNum2}_${opDen2}.png`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer"
                            title="Baixar imagem PNG transparente"
                        >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>Baixar PNG</span>
                        </button>

                        {!isFullScreenView && (
                            <button
                                onClick={() => setIsFullscreen(true)}
                                className="flex items-center justify-center p-2 text-blue-950 bg-blue-200 hover:bg-blue-300 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 border border-blue-400 ml-1"
                                title="Expandir para 100% da tela (Tela Cheia)"
                            >
                                <Maximize2 className="w-4 h-4 text-blue-900" />
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Visual Equation Display */}
            <Card className="p-6 md:p-8 flex flex-col items-center bg-white border-slate-200 shadow-sm overflow-x-auto" id="ops-svg-container">
                {/* Original Equation */}
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 w-full pb-6 border-b border-slate-100">
                    <div className="flex flex-col items-center">
                        <div className="mb-2 font-bold text-slate-700 text-center" style={{ fontSize: `${fontSizePx}px` }}>
                            {opType1 === 'decimal' ? (
                                <>
                                    <span>{formatDecimal(opDecimal1)}</span>
                                    <span className="block text-slate-400 font-semibold mt-0.5" style={{ fontSize: `${Math.max(10, fontSizePx - 4)}px` }}>(= {opsData.n1}/{opsData.d1})</span>
                                </>
                            ) : getMixedFractionJSX(opsData.n1, opsData.d1)}
                        </div>
                        <FractionsRenderer numerator={opsData.n1} denominator={opsData.d1} shape={shape} fillColor={opColor1} sizeClassName="shrink-0" style={{ width: `${imageSizePx}px`, height: `${imageSizePx}px` }} />
                    </div>

                    <div className="font-black text-blue-600 mx-2" style={{ fontSize: `${fontSizePx * 2}px` }}>{operatorSymbols[operator]}</div>

                    <div className="flex flex-col items-center">
                        <div className="mb-2 font-bold text-slate-700 text-center" style={{ fontSize: `${fontSizePx}px` }}>
                            {opType2 === 'decimal' ? (
                                <>
                                    <span>{formatDecimal(opDecimal2)}</span>
                                    <span className="block text-slate-400 font-semibold mt-0.5" style={{ fontSize: `${Math.max(10, fontSizePx - 4)}px` }}>(= {opsData.n2}/{opsData.d2})</span>
                                </>
                            ) : getMixedFractionJSX(opsData.n2, opsData.d2)}
                        </div>
                        <FractionsRenderer numerator={opsData.n2} denominator={opsData.d2} shape={shape} fillColor={opColor2} sizeClassName="shrink-0" style={{ width: `${imageSizePx}px`, height: `${imageSizePx}px` }} />
                    </div>
                </div>

                {/* MMC Equivalent Fractions Line (if different denominators in + / -) */}
                {opsData.showEquivalents && (
                    <div className="w-full flex flex-col items-center py-6 bg-blue-50/50 rounded-2xl border border-blue-200/80 my-6 px-4">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-extrabold text-blue-800 mb-4 bg-blue-100 px-3 py-1 rounded-full border border-blue-300">
                            <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                            <span>Transformando em Frações Equivalentes (MMC = {opsData.mmcValue})</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
                            <div className="flex flex-col items-center">
                                <div className="mb-2 font-bold text-blue-900" style={{ fontSize: `${fontSizePx}px` }}>{getMixedFractionJSX(opsData.eqN1, opsData.eqD1)}</div>
                                <FractionsRenderer numerator={opsData.eqN1} denominator={opsData.eqD1} shape={shape} fillColor={opColor1} sizeClassName="shrink-0" style={{ width: `${imageSizePx}px`, height: `${imageSizePx}px` }} />
                            </div>

                            <div className="font-black text-indigo-500 mx-2" style={{ fontSize: `${fontSizePx * 1.8}px` }}>{operatorSymbols[operator]}</div>

                            <div className="flex flex-col items-center">
                                <div className="mb-2 font-bold text-blue-900" style={{ fontSize: `${fontSizePx}px` }}>{getMixedFractionJSX(opsData.eqN2, opsData.eqD2)}</div>
                                <FractionsRenderer numerator={opsData.eqN2} denominator={opsData.eqD2} shape={shape} fillColor={opColor2} sizeClassName="shrink-0" style={{ width: `${imageSizePx}px`, height: `${imageSizePx}px` }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Final Result & Simplification */}
                <div className="mt-6 flex flex-col items-center w-full">
                    <div className="text-3xl font-black text-slate-400 mb-4">＝</div>

                    <div className="w-full bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-6 flex flex-col items-center">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-4 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                            Resultado Final da Operação
                        </span>

                        {operator === '+' && opsData.resN >= 0 && (
                            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-extrabold mb-4 bg-white px-4 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
                                <span className="flex items-center gap-1.5 text-slate-700">
                                    <span className="w-3.5 h-3.5 rounded-full inline-block shadow-xs" style={{ backgroundColor: opColor1 }}></span>
                                    <span>1ª Fração ({opsData.eqN1}/{opsData.eqD1})</span>
                                </span>
                                <span className="text-slate-400 font-black">＋</span>
                                <span className="flex items-center gap-1.5 text-slate-700">
                                    <span className="w-3.5 h-3.5 rounded-full inline-block shadow-xs" style={{ backgroundColor: opColor2 }}></span>
                                    <span>2ª Fração ({opsData.eqN2}/{opsData.eqD2})</span>
                                </span>
                            </div>
                        )}

                        {opsData.resN < 0 ? (
                            <div className="text-lg font-bold text-rose-600 my-4">
                                ⚠️ Resultado Negativo ({opsData.resN}/{opsData.resD}): A segunda fração é maior que a primeira.
                            </div>
                        ) : opsData.divisor > 1 && opsData.resN !== 0 ? (
                            /* Antes e Depois da Simplificação */
                            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 w-full">
                                <div className="flex flex-col items-center p-4 bg-white/70 rounded-xl border border-slate-200">
                                    <span className="font-bold text-slate-500 mb-2 uppercase tracking-wider" style={{ fontSize: `${Math.max(11, fontSizePx - 3)}px` }}>Antes ({opsData.resN}/{opsData.resD})</span>
                                    <FractionsRenderer numerator={opsData.resN} denominator={opsData.resD} shape={shape} fillColor="#3b82f6" isResult={false} multiColors={sumMultiColors} sizeClassName="shrink-0" style={{ width: `${imageSizePx}px`, height: `${imageSizePx}px` }} />
                                </div>

                                <div className="flex flex-col items-center text-emerald-600 font-extrabold" style={{ fontSize: `${fontSizePx * 1.5}px` }}>
                                    <span>➔</span>
                                    <span className="text-[10px] uppercase tracking-wider bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-900 mt-1">Simplificado por ÷{opsData.divisor}</span>
                                </div>

                                <div className="flex flex-col items-center p-4 bg-white rounded-xl border-2 border-emerald-400 shadow-md">
                                    <span className="font-black text-emerald-800 mb-2 uppercase tracking-wider" style={{ fontSize: `${Math.max(11, fontSizePx - 3)}px` }}>Irredutível ({opsData.finalN}/{opsData.finalD})</span>
                                    <FractionsRenderer numerator={opsData.finalN} denominator={opsData.finalD} shape={shape} fillColor="#10b981" isResult={true} multiColors={simplifiedMultiColors} sizeClassName="shrink-0" style={{ width: `${imageSizePx}px`, height: `${imageSizePx}px` }} />
                                </div>
                            </div>
                        ) : (
                            /* Resultado Direto sem Simplificação */
                            <div className="flex flex-col items-center p-4 bg-white rounded-xl border-2 border-emerald-400 shadow-sm">
                                <span className="font-black text-emerald-800 mb-2 uppercase tracking-wider" style={{ fontSize: `${fontSizePx}px` }}>{getMixedFractionJSX(opsData.finalN, opsData.finalD)}</span>
                                <FractionsRenderer numerator={opsData.finalN} denominator={opsData.finalD} shape={shape} fillColor="#10b981" isResult={true} multiColors={simplifiedMultiColors} sizeClassName="shrink-0" style={{ width: `${imageSizePx}px`, height: `${imageSizePx}px` }} />
                            </div>
                        )}

                        <div className="mt-6 text-center font-black text-emerald-900 bg-white px-6 py-2 rounded-xl shadow-xs border border-emerald-200" style={{ fontSize: `${fontSizePx * 1.2}px` }}>
                            {opsData.resN}/{opsData.resD}
                            {opsData.divisor > 1 && opsData.resN !== 0 && (
                                <span className="text-emerald-700"> ➔ Simplificado: {opsData.finalN}/{opsData.finalD}</span>
                            )}
                            {opsData.finalN >= opsData.finalD && opsData.finalN % opsData.finalD !== 0 && (
                                <span className="block font-bold text-blue-800 mt-1" style={{ fontSize: `${fontSizePx}px` }}>Fração Mista: {getMixedFractionText(opsData.finalN, opsData.finalD)}</span>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Step by Step Pedagogical Explanation */}
            <Card className="p-6 bg-blue-50/70 border border-blue-200">
                <h3 className="font-black text-blue-900 mb-4 flex items-center gap-2" style={{ fontSize: `${fontSizePx * 1.15}px` }}>
                    <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>Como esse cálculo é feito? (Passo a Passo Didático)</span>
                </h3>

                <div className="space-y-3 text-slate-800 leading-relaxed" style={{ fontSize: `${fontSizePx}px` }}>
                    {(opsData.isDec1 || opsData.isDec2) && (
                        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                Passo 0: Transformação (Alinhamento de Idioma)
                            </h4>
                            <p className="text-amber-800">
                                Detectamos uma entrada com números decimais! Para facilitar o cálculo e usar a mesma linguagem visual, transformamos os decimais em frações correspondentes.
                            </p>
                            <ul className="list-disc ml-6 mt-2 text-amber-700 font-medium">
                                {opsData.isDec1 && <li>O 1º termo <strong>{formatDecimal(opDecimal1)}</strong> virou a fração <strong>{opsData.n1}/{opsData.d1}</strong>.</li>}
                                {opsData.isDec2 && <li>O 2º termo <strong>{formatDecimal(opDecimal2)}</strong> virou a fração <strong>{opsData.n2}/{opsData.d2}</strong>.</li>}
                            </ul>
                        </div>
                    )}

                    {operator === '+' && (
                        opsData.showEquivalents ? (
                            <>
                                <p>Para somar frações com denominadores diferentes (<strong>{opsData.d1}</strong> e <strong>{opsData.d2}</strong>), precisamos primeiro encontrar o <strong>MMC (Mínimo Múltiplo Comum)</strong> para igualar os denominadores.</p>
                                <div className="bg-white p-4 rounded-xl border border-blue-200 my-2 font-mono shadow-2xs" style={{ fontSize: `${Math.max(12, fontSizePx - 2)}px` }}>
                                    <div>• Múltiplos de <strong>{opsData.d1}</strong>: &#123; {opsData.multsA.map((m, idx) => (
                                        <React.Fragment key={m}>
                                            {m === opsData.mmcValue ? <u className="font-extrabold text-blue-600">{m}</u> : m}
                                            {idx < opsData.multsA.length - 1 ? ', ' : ''}
                                        </React.Fragment>
                                    ))}, ... &#125;</div>
                                    <div className="mt-1">• Múltiplos de <strong>{opsData.d2}</strong>: &#123; {opsData.multsB.map((m, idx) => (
                                        <React.Fragment key={m}>
                                            {m === opsData.mmcValue ? <u className="font-extrabold text-blue-600">{m}</u> : m}
                                            {idx < opsData.multsB.length - 1 ? ', ' : ''}
                                        </React.Fragment>
                                    ))}, ... &#125;</div>
                                    <div className="mt-2 font-sans font-bold text-blue-800">➔ O MMC é <span className="text-blue-600 text-base">{opsData.mmcValue}</span>! Ele será o nosso novo denominador comum.</div>
                                </div>
                                <p><strong>2.</strong> Criamos as frações equivalentes (dividindo o MMC pelo denominador antigo e multiplicando pelo numerador):</p>
                                <ul className="list-disc ml-6 space-y-1 text-slate-700">
                                    <li>1ª Fração: <strong>{opNum1}/{opDen1}</strong> vira <strong>{opsData.eqN1}/{opsData.eqD1}</strong>.</li>
                                    <li>2ª Fração: <strong>{opNum2}/{opDen2}</strong> vira <strong>{opsData.eqN2}/{opsData.eqD2}</strong>.</li>
                                </ul>
                                <p><strong>3.</strong> Com os denominadores iguais, somamos os numeradores: <strong>{opsData.eqN1} + {opsData.eqN2} = {opsData.resN}</strong>.</p>
                            </>
                        ) : (
                            <>
                                <p>Como os denominadores já são <strong>iguais</strong> (<strong>{opsData.d1}</strong>), o cálculo é direto:</p>
                                <p><strong>1.</strong> Mantemos o denominador comum: <strong>{opsData.resD}</strong>.</p>
                                <p><strong>2.</strong> Somamos os numeradores: <strong>{opNum1} + {opNum2} = {opsData.resN}</strong>.</p>
                            </>
                        )
                    )}

                    {operator === '-' && (
                        opsData.showEquivalents ? (
                            <>
                                <p>Para subtrair frações com denominadores diferentes, encontramos o <strong>MMC (Mínimo Múltiplo Comum)</strong> entre <strong>{opsData.d1}</strong> e <strong>{opsData.d2}</strong>.</p>
                                <div className="bg-white p-4 rounded-xl border border-blue-200 my-2 font-mono shadow-2xs" style={{ fontSize: `${Math.max(12, fontSizePx - 2)}px` }}>
                                    <div>• Múltiplos de <strong>{opsData.d1}</strong>: &#123; {opsData.multsA.map((m, idx) => (
                                        <React.Fragment key={m}>
                                            {m === opsData.mmcValue ? <u className="font-extrabold text-blue-600">{m}</u> : m}
                                            {idx < opsData.multsA.length - 1 ? ', ' : ''}
                                        </React.Fragment>
                                    ))}, ... &#125;</div>
                                    <div className="mt-1">• Múltiplos de <strong>{opsData.d2}</strong>: &#123; {opsData.multsB.map((m, idx) => (
                                        <React.Fragment key={m}>
                                            {m === opsData.mmcValue ? <u className="font-extrabold text-blue-600">{m}</u> : m}
                                            {idx < opsData.multsB.length - 1 ? ', ' : ''}
                                        </React.Fragment>
                                    ))}, ... &#125;</div>
                                    <div className="mt-2 font-sans font-bold text-blue-800">➔ O MMC é <span className="text-blue-600 text-base">{opsData.mmcValue}</span>!</div>
                                </div>
                                <p><strong>2.</strong> Frações equivalentes: <strong>{opsData.eqN1}/{opsData.eqD1}</strong> e <strong>{opsData.eqN2}/{opsData.eqD2}</strong>.</p>
                                <p><strong>3.</strong> Subtraímos os numeradores: <strong>{opsData.eqN1} - {opsData.eqN2} = {opsData.resN}</strong>.</p>
                            </>
                        ) : (
                            <>
                                <p>Como os denominadores são <strong>iguais</strong> (<strong>{opsData.d1}</strong>):</p>
                                <p><strong>1.</strong> Mantemos o denominador: <strong>{opsData.resD}</strong>.</p>
                                <p><strong>2.</strong> Subtraímos os numeradores: <strong>{opNum1} - {opNum2} = {opsData.resN}</strong>.</p>
                            </>
                        )
                    )}

                    {operator === '*' && (
                        <>
                            <p>A multiplicação de frações é simples e direta!</p>
                            <p><strong>1.</strong> Multiplicamos os numeradores (os números de cima): <strong>{opNum1} × {opNum2} = {opsData.resN}</strong>.</p>
                            <p><strong>2.</strong> Multiplicamos os denominadores (os números de baixo): <strong>{opDen1} × {opDen2} = {opsData.resD}</strong>.</p>
                        </>
                    )}

                    {operator === '/' && (
                        <>
                            <p>Para dividir frações, aplicamos a regra da inversão:</p>
                            <p><strong>1.</strong> Mantemos a primeira fração (<strong>{opNum1}/{opDen1}</strong>) e multiplicamos pelo <strong>inverso</strong> da segunda fração (<strong>{opDen2}/{opNum2}</strong>).</p>
                            <p><strong>2.</strong> Multiplicamos os numeradores: <strong>{opNum1} × {opDen2} = {opsData.resN}</strong>.</p>
                            <p><strong>3.</strong> Multiplicamos os denominadores: <strong>{opDen1} × {opNum2} = {opsData.resD}</strong>.</p>
                        </>
                    )}

                    {opsData.divisor > 1 && opsData.resN !== 0 && (
                        <div className="mt-3 p-3 bg-emerald-100/80 border border-emerald-300 rounded-xl text-emerald-900 font-semibold" style={{ fontSize: `${fontSizePx}px` }}>
                            ✨ <strong>Simplificação pelo MDC:</strong> O Maior Divisor Comum entre {opsData.resN} e {opsData.resD} é <strong>{opsData.divisor}</strong>. Dividindo ambos por {opsData.divisor}, chegamos à fração irredutível <strong>{opsData.finalN}/{opsData.finalD}</strong>.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

    const renderPrintContent = () => {
        const currentData = typeof activeSource === 'number' && aiHistory[activeSource] ? aiHistory[activeSource] : customExercisesData;

        const exercisesToRender = currentData && currentData.exercises ? currentData.exercises : Array.from({ length: printCount }, (_, idx) => {
            const num = Math.floor(Math.random() * 5) + 1;
            const den = Math.floor(Math.random() * 5) + 2;
            const op = ['+', '-', '*'][Math.floor(Math.random() * 3)];
            const num2 = Math.floor(Math.random() * 4) + 1;
            const den2 = Math.floor(Math.random() * 4) + 2;
            const cat = idx < Math.ceil(printCount / 2) ? 'visual_painting' : 'arithmetic_operation';
            return { id: idx, category: cat, num, den, op, num1: num, den1: den, num2, den2 };
        });

        const classifyEx = (ex) => {
            const cat = String(ex.category || '').toLowerCase();
            if (cat.includes('visual') || cat.includes('paint') || cat.includes('pint') || cat.includes('figura') || cat.includes('geom') || cat === '1' || cat === 1) {
                return 'visual';
            }
            if (cat.includes('op') || cat.includes('arith') || cat.includes('calc') || cat.includes('soma') || cat.includes('subtr') || cat === '2' || cat === 2) {
                return 'ops';
            }
            if (cat.includes('word') || cat.includes('prob') || cat.includes('text') || cat.includes('hist') || cat.includes('dia') || cat === '3' || cat === 3) {
                return 'word';
            }
            if (ex.problemText || ex.question || (ex.instruction && ex.instruction.length > 50)) return 'word';
            if (ex.op || ex.operator || (ex.num1 !== undefined && ex.num2 !== undefined)) return 'ops';
            if (ex.shape || (ex.num !== undefined && ex.den !== undefined)) return 'visual';
            return 'word'; // Garante 100% de exibição, nunca descarta nenhuma questão
        };

        const visualList = exercisesToRender.filter(ex => classifyEx(ex) === 'visual');
        const opsList = exercisesToRender.filter(ex => classifyEx(ex) === 'ops');
        const wordList = exercisesToRender.filter(ex => classifyEx(ex) === 'word');

        let sectionIndex = 1;

        return (
            <div className="space-y-6">
                {(aiHistory.length > 0 || currentData) && (
                    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4 no-print animate-in fade-in border border-blue-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl text-slate-950 shadow-md shrink-0">
                                <Sparkles className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black tracking-wide text-amber-300 flex items-center gap-2">
                                    <span>📚 Memória de Atividades da IA ({aiHistory.length} criadas)</span>
                                </h4>
                                <p className="text-xs text-blue-200 mt-0.5">
                                    Alterne livremente entre as listas geradas pela IA ou volte para o gerador aleatório sem perder nada!
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => {
                                    setActiveSource('random');
                                    setCustomExercisesData(null);
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${activeSource === 'random' && !customExercisesData ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}`}
                            >
                                🎲 Padrão (Aleatório)
                            </button>

                            {aiHistory.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setActiveSource(idx);
                                        setCustomExercisesData(item);
                                        if (item.exercises) setPrintCount(item.exercises.length);
                                    }}
                                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${(activeSource === idx || customExercisesData === item) ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105' : 'bg-blue-600/60 hover:bg-blue-600 text-white border-blue-400/30'}`}
                                >
                                    <Wand2 className="w-3.5 h-3.5" />
                                    <span>{item.activityTitle ? (item.activityTitle.length > 25 ? item.activityTitle.substring(0, 25) + '...' : item.activityTitle) : `IA #${aiHistory.length - idx}`}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <Card className="p-4 bg-amber-50 border-amber-200 flex flex-wrap items-center justify-between gap-4 no-print">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Quantidade de Exercícios:</span>
                        {[4, 6, 8, 10].map((cnt) => (
                            <button
                                key={cnt}
                                onClick={() => setPrintCount(cnt)}
                                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all border ${printCount === cnt ? 'bg-amber-600 text-white border-amber-700 shadow-sm' : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-100'}`}
                            >
                                {cnt} questões
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 mr-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase whitespace-nowrap">📐 Figuras:</span>
                            <input
                                type="range"
                                min="60"
                                max="280"
                                step="10"
                                value={imageSizePx}
                                onChange={(e) => setImageSizePx(Number(e.target.value))}
                                className="w-20 accent-blue-600 cursor-pointer"
                                title="Deslize para ajustar o tamanho das figuras"
                            />
                            <span className="bg-white text-blue-900 font-extrabold text-xs px-2 py-0.5 rounded border border-slate-200 min-w-[50px] text-center shadow-2xs">
                                {imageSizePx} px
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 mr-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase whitespace-nowrap">🔤 Fonte:</span>
                            <input
                                type="range"
                                min="12"
                                max="36"
                                step="1"
                                value={fontSizePx}
                                onChange={(e) => setFontSizePx(Number(e.target.value))}
                                className="w-20 accent-blue-600 cursor-pointer"
                                title="Deslize para ajustar o tamanho da fonte"
                            />
                            <span className="bg-white text-blue-900 font-extrabold text-xs px-2 py-0.5 rounded border border-slate-200 min-w-[48px] text-center shadow-2xs">
                                {fontSizePx} px
                            </span>
                        </div>
                        <Button
                            onClick={() => setIsAIModalOpen(true)}
                            icon={Wand2}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs py-1.5 px-3 font-extrabold shadow-sm"
                        >
                            Gerar com IA ✨
                        </Button>
                        {customExercisesData && (
                            <Button
                                onClick={() => {
                                    setActiveSource('random');
                                    setCustomExercisesData(null);
                                }}
                                variant="secondary"
                                className="text-xs py-1.5 px-2 text-red-600 hover:bg-red-50 font-bold border border-red-200"
                                title="Voltar ao gerador aleatório padrão"
                            >
                                🔄 Padrão
                            </Button>
                        )}
                        <Button
                            onClick={() => setShowAnswers(!showAnswers)}
                            variant={showAnswers ? "primary" : "secondary"}
                            className="text-xs py-1.5"
                        >
                            {showAnswers ? "🙈 Ocultar Gabarito" : "👁️ Mostrar Gabarito"}
                        </Button>
                        <Button
                            onClick={() => window.print()}
                            icon={Printer}
                            className="text-xs py-1.5 px-4 shadow-sm"
                        >
                            Imprimir / PDF
                        </Button>
                    </div>
                </Card>

                {/* Print Sheet A4 Layout */}
                <div className="bg-white p-8 md:p-12 border border-slate-300 rounded-2xl shadow-sm print:shadow-none print:border-none print:p-0 space-y-8">
                    <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
                                {customExercisesData?.activityTitle || "Atividade de Matemática: Frações e Operações"}
                            </h1>
                            <p className="text-xs text-slate-600 mt-1">Escola: _________________________________________ Data: ____/____/________</p>
                            <p className="text-xs text-slate-600 mt-1">Aluno(a): _______________________________________ Turma: <u className="font-semibold text-slate-800">{customExercisesData?.gradeLevel || "_________"}</u></p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold px-3 py-1 bg-slate-100 border border-slate-300 rounded-md">Drácker Adapta</span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {visualList.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">{sectionIndex++}. Observe as representações geométricas e pinte ou represente as frações indicadas:</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {visualList.map((ex, i) => {
                                        const n = ex.num !== undefined ? ex.num : (ex.num1 || 1);
                                        const d = ex.den !== undefined ? ex.den : (ex.den1 || 2);
                                        const shp = ex.shape || (i % 2 === 0 ? 'circle' : 'rectangle');
                                        return (
                                            <div key={ex.id || i} className="p-5 border border-slate-200 print:border-slate-300 rounded-xl bg-white flex items-center justify-between gap-4 shadow-2xs print:shadow-none break-inside-avoid">
                                                <div className="flex flex-col items-start space-y-2 max-w-[65%]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 text-base md:text-lg tracking-tight shrink-0">
                                                            {i + 1}.
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exercício Visual</span>
                                                    </div>
                                                    <span className="font-extrabold text-slate-800 leading-snug" style={{ fontSize: `${fontSizePx}px` }}>
                                                        {ex.instruction && <span className="block font-semibold text-slate-700 mb-1" style={{ fontSize: `${Math.max(12, fontSizePx - 2)}px` }}>{ex.instruction}</span>}
                                                        Pinte a fração: <u className="text-blue-600 font-black" style={{ fontSize: `${fontSizePx * 1.2}px` }}>{n}/{d}</u>
                                                        {n >= d && <span className="block font-semibold text-slate-500 mt-0.5" style={{ fontSize: `${Math.max(11, fontSizePx - 3)}px` }}>ou {getMixedFractionText(n, d)}</span>}
                                                    </span>
                                                    {showAnswers && (
                                                        <span className="mt-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                                                            💡 Gabarito: {n} fatias pintadas de {d} {n >= d ? `(${getMixedFractionText(n, d)})` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                <FractionsRenderer numerator={n} denominator={d} forceEmpty={!showAnswers} shape={shp} sizeClassName="shrink-0" style={{ width: `${imageSizePx}px`, height: `${imageSizePx}px` }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {opsList.length > 0 && (
                            <div className={`space-y-6 ${visualList.length > 0 ? 'pt-6 border-t-2 border-slate-200' : ''}`}>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">{sectionIndex++}. Calcule e simplifique as operações de frações abaixo:</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {opsList.map((ex, i) => {
                                        const n1 = ex.num1 !== undefined ? ex.num1 : (ex.num || 1);
                                        const d1 = ex.den1 !== undefined ? ex.den1 : (ex.den || 2);
                                        const n2 = ex.num2 !== undefined ? ex.num2 : 1;
                                        const d2 = ex.den2 !== undefined ? ex.den2 : 3;
                                        const symbol = ex.op === '+' ? '+' : ex.op === '-' ? '-' : ex.op === '*' ? '×' : '÷';
                                        
                                        let calcAns = '';
                                        if (ex.op === '+') calcAns = `${n1*d2 + n2*d1}/${d1*d2}`;
                                        else if (ex.op === '-') calcAns = `${n1*d2 - n2*d1}/${d1*d2}`;
                                        else if (ex.op === '*') calcAns = `${n1*n2}/${d1*d2}`;
                                        else calcAns = `${n1*d2}/${d1*n2}`;

                                        return (
                                            <div key={ex.id || i} className="p-5 border border-slate-200 print:border-slate-300 rounded-xl bg-white flex flex-col justify-between shadow-2xs print:shadow-none break-inside-avoid space-y-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 text-base md:text-lg tracking-tight shrink-0">
                                                            {i + 1 + visualList.length}.
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cálculo de Frações</span>
                                                    </div>
                                                </div>
                                                {ex.instruction && !ex.instruction.startsWith('Exercício') && (
                                                    <p className="text-xs font-semibold text-slate-700">{ex.instruction}</p>
                                                )}
                                                <div className="py-4 px-4 bg-slate-50 print:bg-slate-50/60 rounded-xl border border-slate-200 flex items-center justify-center gap-3 font-black text-slate-800 tracking-wide" style={{ fontSize: `${fontSizePx * 1.3}px` }}>
                                                    <span className="px-2.5 py-1 bg-white rounded-lg shadow-2xs border border-slate-200" style={{ fontSize: `${fontSizePx * 1.2}px` }}>{n1}/{d1}</span>
                                                    <span className="text-indigo-600 font-black" style={{ fontSize: `${fontSizePx * 1.5}px` }}>{symbol}</span>
                                                    <span className="px-2.5 py-1 bg-white rounded-lg shadow-2xs border border-slate-200" style={{ fontSize: `${fontSizePx * 1.2}px` }}>{n2}/{d2}</span>
                                                    <span className="text-slate-400" style={{ fontSize: `${fontSizePx * 1.3}px` }}>=</span>
                                                    <span className="inline-block min-w-[80px] h-10 bg-white rounded-lg border-2 border-dashed border-indigo-300 flex items-center justify-center text-emerald-600 font-extrabold px-3" style={{ fontSize: `${fontSizePx * 1.2}px` }}>
                                                        {showAnswers ? (ex.answerText || calcAns) : ''}
                                                    </span>
                                                </div>
                                                <div className="min-h-[65px] border border-dashed border-slate-200 rounded-xl p-2.5 flex flex-col justify-end">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Espaço para Cálculos / MMC</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {wordList.length > 0 && (
                            <div className={`space-y-6 ${(visualList.length > 0 || opsList.length > 0) ? 'pt-6 border-t-2 border-slate-200' : ''}`}>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">{sectionIndex++}. Problemas Contextualizados do Dia a Dia:</h2>
                                <div className="space-y-6">
                                    {wordList.map((ex, i) => {
                                        let titleText = `Problema ${i + 1 + visualList.length + opsList.length}`;
                                        let bodyText = ex.problemText || ex.question || '';
                                        
                                        if (ex.instruction && ex.instruction.trim() !== bodyText.trim()) {
                                            if (bodyText.includes(ex.instruction.trim())) {
                                                // bodyText já contém instruction
                                            } else if (ex.instruction.trim().includes(bodyText.trim())) {
                                                bodyText = ex.instruction.trim();
                                            } else if (ex.instruction.length < 50) {
                                                titleText += ` • ${ex.instruction.trim()}`;
                                            } else {
                                                bodyText = `${ex.instruction.trim()} ${bodyText.trim()}`;
                                            }
                                        }

                                        return (
                                            <div key={ex.id || i} className="p-5 border border-slate-200 print:border-slate-300 rounded-xl bg-white space-y-4 shadow-2xs print:shadow-none break-inside-avoid">
                                                <div className="flex items-center gap-2 border-b border-slate-100 print:border-slate-200 pb-2.5">
                                                    <span className="font-black text-slate-900 text-base md:text-lg tracking-tight shrink-0">
                                                        {i + 1 + visualList.length + opsList.length}.
                                                    </span>
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                                        {titleText}
                                                    </span>
                                                </div>
                                                <p className="font-normal text-slate-800 leading-relaxed text-justify print:text-left" style={{ fontSize: `${fontSizePx}px` }}>
                                                    {bodyText}
                                                </p>
                                                <div className="min-h-[100px] border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/30 print:bg-transparent flex flex-col justify-end">
                                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Espaço para Cálculos e Resolução</span>
                                                </div>
                                                {showAnswers && ex.answerText && (
                                                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 flex items-start gap-2">
                                                        <span className="text-emerald-600 font-black shrink-0">💡 Gabarito:</span>
                                                        <span>{ex.answerText}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 w-full">
            {/* Top Navigation Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-800">
                        <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Drácker: Estúdio de Frações</h2>
                        <p className="text-xs text-slate-600">Visualizador geométrico, calculadora passo a passo com MMC/MDC e folhas de atividades</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto justify-end">
                    {/* Linha Scrubbing (Slider de Pixels) para Tamanho das Figuras */}
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-black text-slate-500 uppercase whitespace-nowrap">📐 Figuras:</span>
                        <input
                            type="range"
                            min="60"
                            max="280"
                            step="10"
                            value={imageSizePx}
                            onChange={(e) => setImageSizePx(Number(e.target.value))}
                            className="w-20 sm:w-28 accent-blue-600 cursor-pointer"
                            title="Deslize para aumentar ou diminuir as figuras em pixels"
                        />
                        <span className="bg-white text-blue-900 font-extrabold text-xs px-2 py-0.5 rounded border border-slate-200 min-w-[50px] text-center shadow-2xs">
                            {imageSizePx} px
                        </span>
                    </div>

                    {/* Linha Scrubbing (Slider de Pixels) para Fonte / Texto */}
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-black text-slate-500 uppercase whitespace-nowrap">🔤 Fonte:</span>
                        <input
                            type="range"
                            min="12"
                            max="36"
                            step="1"
                            value={fontSizePx}
                            onChange={(e) => setFontSizePx(Number(e.target.value))}
                            className="w-20 sm:w-28 accent-blue-600 cursor-pointer"
                            title="Deslize para aumentar ou diminuir a fonte das frações"
                        />
                        <span className="bg-white text-blue-900 font-extrabold text-xs px-2 py-0.5 rounded border border-slate-200 min-w-[48px] text-center shadow-2xs">
                            {fontSizePx} px
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={() => setActiveTab('single')}
                            variant={activeTab === 'single' ? 'primary' : 'ghost'}
                            className="text-xs py-2 font-extrabold"
                        >
                            🟢 Comparador / Equivalências
                        </Button>
                        <Button
                            onClick={() => setActiveTab('ops')}
                            variant={activeTab === 'ops' ? 'primary' : 'ghost'}
                            className="text-xs py-2 font-extrabold"
                        >
                            🔵 Operações & MMC
                        </Button>
                        <Button
                            onClick={() => setActiveTab('print')}
                            variant={activeTab === 'print' ? 'primary' : 'ghost'}
                            icon={Printer}
                            className="text-xs py-2 font-extrabold"
                        >
                            📋 Folha de Exercícios
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Tab Content */}
            {activeTab === 'single' && renderVisualizerContent(false)}
            {activeTab === 'ops' && renderOperationsContent(false)}
            {activeTab === 'print' && renderPrintContent()}

            {/* Fullscreen Presentation Overlay (100% Width & Height) */}
            {isFullscreen && (
                <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto p-6 sm:p-10 flex flex-col animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="p-2 bg-blue-100 rounded-lg text-blue-800 font-black text-sm">
                                🖵 Apresentação em Tela Cheia (100%)
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                                Pressione <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-slate-700">ESC</kbd> para sair
                            </span>
                        </div>
                        <button
                            onClick={() => setIsFullscreen(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                            <Minimize2 className="w-4 h-4" />
                            <span>Sair (100%)</span>
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full">
                        {activeTab === 'single' ? renderVisualizerContent(true) : renderOperationsContent(true)}
                    </div>
                </div>
            )}

            <FractionsAIModal
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onConfirm={(data) => {
                    let list = data?.exercises || data?.exercicios || data?.atividades || data?.questions || data?.questoes;
                    if (!list && Array.isArray(data)) list = data;
                    if (!list) list = [];

                    const normalized = {
                        activityTitle: data?.activityTitle || data?.title || data?.titulo || "Atividade de Matemática: Frações e Operações",
                        gradeLevel: data?.gradeLevel || data?.turma || data?.ano || "6º Ano - Ensino Fundamental",
                        exercises: list
                    };
                    setCustomExercisesData(normalized);
                    setAiHistory(prev => [normalized, ...prev]);
                    setActiveSource(0);
                    if (list.length > 0) setPrintCount(list.length);
                    setActiveTab('print'); // Redireciona imediatamente para a aba da Folha de Exercícios onde as questões estão
                }}
                initialCount={printCount}
            />
        </div>
    );
};
