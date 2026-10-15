import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { TradingCard } from './TradingCard';
import { Plus, Trash2, Printer, Download, CheckSquare, Square, AlignLeft, AlignCenter, AlignRight, AlignJustify, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { useActivity } from '../../contexts/ActivityContext';
import { exportActivityToPdf } from '../../utils/pdfExportHelper';
import { exportElementToPng } from '../../utils/imageExportHelper';


export const TradingCardMaker = () => {
    const { activeActivity, updateActivityData, activeTabId, addActivityTab } = useActivity();
    
    // Fallback data if activeActivity.tradingCardData is not set
    const savedCards = activeActivity?.tradingCardData?.cards || [];
    
    const [currentCard, setCurrentCard] = useState({
        id: Date.now().toString(),
        title: '',
        hp: '100',
        hideHp: false,
        hpSize: 16,
        outerBorderColor: '#374151',
        innerBorderColor: '#9ca3af',
        cardBgColor: '#e5e7eb',
        innerBgColor: '#ffffff',
        hpBgColor: '#ffffff',
        hpTextColor: '#dc2626',
        fontFamily: 'sans-serif',
        titleSize: 20,
        skillNameSize: 13,
        skillValSize: 14,
        skillDescSize: 10,
        footerDescSize: 10,
        titleAlign: 'left',
        skillDescAlign: 'left',
        footerDescAlign: 'center',
        imageUrl: '',
        imageHeight: 160,
        imageFit: 'cover',
        imageMarginTop: 0,
        hideImage: false,
        skills: [{ name: '', desc: '', val: '' }],
        description: ''
    });

    const [isEditingList, setIsEditingList] = useState(false);
    // Mapa de ID -> quantidade de cópias para impressão (0 = desmarcado)
    const [printQuantities, setPrintQuantities] = useState({});
    const [directPrintCopies, setDirectPrintCopies] = useState(4);
    const [isPrintingDirectCurrent, setIsPrintingDirectCurrent] = useState(false);
    const [exportCardData, setExportCardData] = useState(null);

    const [previewRotation, setPreviewRotation] = useState({ x: 0, y: 0, active: false });
    const previewRef = useRef(null);
    const previewContainerRef = useRef(null);
    const [cardScale, setCardScale] = useState(1.4);
    const [zoomOffset, setZoomOffset] = useState(0);

    // Ajusta dinamicamente a escala para o card ocupar quase todo o plano de fundo pontilhado
    useEffect(() => {
        if (!previewContainerRef.current) return;

        const updateScale = () => {
            if (!previewContainerRef.current) return;
            const rect = previewContainerRef.current.getBoundingClientRect();
            // Margem interna para respiro e headers (aprox 48px na largura e 84px na altura)
            const availableW = Math.max(260, rect.width - 48);
            const availableH = Math.max(380, rect.height - 84);

            const scaleW = availableW / 320;
            const scaleH = availableH / 440;
            // Ocupa ~90% a 92% da dimensão limitante do container
            const idealScale = Math.min(scaleW, scaleH) * 0.92;
            const clamped = Math.max(0.85, Math.min(2.2, idealScale));
            setCardScale(Number(clamped.toFixed(2)));
        };

        updateScale();

        const resizeObserver = new ResizeObserver(() => {
            updateScale();
        });
        resizeObserver.observe(previewContainerRef.current);
        window.addEventListener('resize', updateScale);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateScale);
        };
    }, []);

    const effectiveScale = Math.max(0.7, Math.min(2.5, Number((cardScale + zoomOffset).toFixed(2))));

    const handlePreviewMouseMove = (e) => {
        if (!previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -12; // Max 12 deg
        const rotateY = ((x - centerX) / centerX) * 12;
        
        setPreviewRotation({ x: rotateX, y: rotateY, active: true });
    };

    const handlePreviewMouseLeave = () => {
        setPreviewRotation({ x: 0, y: 0, active: false });
    };

    // Sincroniza printQuantities com savedCards (novos cards entram com 1 cópia por padrão)
    useEffect(() => {
        setPrintQuantities(prev => {
            const next = { ...prev };
            savedCards.forEach(c => {
                if (next[c.id] === undefined) {
                    next[c.id] = 1;
                }
            });
            return next;
        });
    }, [savedCards.length]);

    const updateCardQuantity = (id, qty) => {
        const val = Math.max(0, Math.min(50, Number(qty) || 0));
        setPrintQuantities(prev => ({
            ...prev,
            [id]: val
        }));
    };

    const togglePrintSelection = (id, e) => {
        if (e) e.stopPropagation();
        setPrintQuantities(prev => {
            const currentQty = prev[id] || 0;
            return {
                ...prev,
                [id]: currentQty > 0 ? 0 : 1
            };
        });
    };

    const applyQuantityToAll = (qty) => {
        setPrintQuantities(() => {
            const next = {};
            savedCards.forEach(c => {
                next[c.id] = qty;
            });
            return next;
        });
    };

    const toggleSelectAll = (select) => {
        setPrintQuantities(() => {
            const next = {};
            savedCards.forEach(c => {
                next[c.id] = select ? 1 : 0;
            });
            return next;
        });
    };

    const totalSelectedCards = savedCards.filter(c => (printQuantities[c.id] || 0) > 0).length;
    const totalPrintCopies = savedCards.reduce((sum, c) => sum + (printQuantities[c.id] || 0), 0);
    const estimatedPages = Math.max(1, Math.ceil((totalPrintCopies || 4) / 4));

    // Monta a lista linear de cards a imprimir/exportar
    const printCardsList = React.useMemo(() => {
        if (isPrintingDirectCurrent) {
            return Array.from({ length: directPrintCopies }, (_, copyIdx) => ({
                card: currentCard,
                copyIdx,
                key: `current-${copyIdx}`
            }));
        }
        const selected = savedCards.flatMap(card => {
            const qty = printQuantities[card.id] || 0;
            return Array.from({ length: qty }, (_, copyIdx) => ({
                card,
                copyIdx,
                key: `${card.id}-${copyIdx}`
            }));
        });
        // Fallback: se nenhum card estiver selecionado na coleção, usa o card em edição atual
        if (selected.length === 0) {
            return Array.from({ length: directPrintCopies || 4 }, (_, copyIdx) => ({
                card: currentCard,
                copyIdx,
                key: `fallback-current-${copyIdx}`
            }));
        }
        return selected;
    }, [isPrintingDirectCurrent, directPrintCopies, currentCard, savedCards, printQuantities]);

    // Agrupa estritamente em páginas de 4 cards (2 colunas x 2 linhas) para folhas A4 perfeitas
    const printPages = React.useMemo(() => {
        const pages = [];
        for (let i = 0; i < printCardsList.length; i += 4) {
            pages.push(printCardsList.slice(i, i + 4));
        }
        return pages.length > 0 ? pages : [[]];
    }, [printCardsList]);

    const handlePrint = () => {
        setIsPrintingDirectCurrent(false);
        setTimeout(() => {
            window.print();
        }, 80);
    };

    const handlePrintCurrentCard = () => {
        setIsPrintingDirectCurrent(true);
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                setIsPrintingDirectCurrent(false);
            }, 800);
        }, 80);
    };

    const handleDownloadPdfCollection = async () => {
        setIsPrintingDirectCurrent(false);
        await new Promise(r => setTimeout(r, 80));
        const title = activeActivity?.title || 'Colecao_Trading_Cards';
        await exportActivityToPdf('activity-area-print', title);
    };

    const handleDownloadPdfCurrentCard = async () => {
        setIsPrintingDirectCurrent(true);
        await new Promise(r => setTimeout(r, 80));
        try {
            const title = currentCard.title ? `Card_${currentCard.title}` : 'Trading_Card';
            await exportActivityToPdf('activity-area-print', title);
        } finally {
            setIsPrintingDirectCurrent(false);
        }
    };

    const handleDownloadCurrentCardPng = async () => {
        const target = document.getElementById('trading-card-active-card-export');
        if (!target) return;
        const parent = target.parentElement;
        if (parent) parent.style.opacity = '1';
        try {
            const title = currentCard.title ? `Card_${currentCard.title}` : 'Trading_Card';
            await exportElementToPng(target, title, { scale: 3 });
        } finally {
            if (parent) parent.style.opacity = '0';
        }
    };

    const handleDownloadSpecificCardPng = async (card, e) => {
        if (e) e.stopPropagation();
        setExportCardData(card);
        await new Promise(r => setTimeout(r, 80));
        const target = document.getElementById('trading-card-specific-export');
        if (target) {
            const parent = target.parentElement;
            if (parent) parent.style.opacity = '1';
            try {
                const title = card.title ? `Card_${card.title}` : `Card_${card.id}`;
                await exportElementToPng(target, title, { scale: 3 });
            } finally {
                if (parent) parent.style.opacity = '0';
            }
        }
        setExportCardData(null);
    };

    // Save cards to context
    const saveToContext = (cards) => {
        if (activeTabId) {
            updateActivityData(activeTabId, { tradingCardData: { cards } });
        } else {
            // Cria uma nova aba se não houver nenhuma ativa
            addActivityTab({
                title: 'Coleção de Cards',
                type: 'trading_cards',
                content: '',
                tradingCardData: { cards }
            });
        }
    };

    const handleNewCard = () => {
        setCurrentCard({
            id: Date.now().toString(),
            title: '', hp: '100', hideHp: false, hpSize: 16, imageUrl: '',
            imageHeight: 160, imageFit: 'cover', imageMarginTop: 0,
            outerBorderColor: '#374151', innerBorderColor: '#9ca3af', cardBgColor: '#e5e7eb',
            innerBgColor: '#ffffff', footerBgColor: '#f3f4f6', titleColor: '#111827',
            textColor: '#1f2937', hpBgColor: '#ffffff', hpTextColor: '#dc2626',
            fontFamily: 'sans-serif', titleSize: 20, skillNameSize: 13, skillValSize: 14, skillDescSize: 10, footerDescSize: 10,
            titleAlign: 'left', skillDescAlign: 'left', footerDescAlign: 'center',
            hideImage: false, skills: [{ name: '', desc: '', val: '' }], description: ''
        });
    };

    const handleAddCard = () => {
        const newCards = [...savedCards, { ...currentCard, id: Date.now().toString() }];
        saveToContext(newCards);
        handleNewCard();
    };

    const handleDeleteCard = (id) => {
        const newCards = savedCards.filter(c => c.id !== id);
        saveToContext(newCards);
    };

    const handleLoadCard = (card) => {
        let loadedCard = { ...card };
        // Backward compatibility for old format
        if (!loadedCard.skills) {
            loadedCard.skills = [];
            if (loadedCard.skill1Name || loadedCard.skill1Desc || loadedCard.skill1Val) {
                loadedCard.skills.push({ name: loadedCard.skill1Name || '', desc: loadedCard.skill1Desc || '', val: loadedCard.skill1Val || '' });
            }
            if (loadedCard.skill2Name || loadedCard.skill2Desc || loadedCard.skill2Val) {
                loadedCard.skills.push({ name: loadedCard.skill2Name || '', desc: loadedCard.skill2Desc || '', val: loadedCard.skill2Val || '' });
            }
            if (loadedCard.skills.length === 0) {
                loadedCard.skills.push({ name: '', desc: '', val: '' });
            }
        }
        loadedCard.fontFamily = loadedCard.fontFamily || 'sans-serif';
        loadedCard.titleSize = loadedCard.titleSize || 20;
        loadedCard.skillNameSize = loadedCard.skillNameSize || 13;
        loadedCard.skillValSize = loadedCard.skillValSize || 14;
        loadedCard.skillDescSize = loadedCard.skillDescSize || loadedCard.descSize || 10;
        loadedCard.footerDescSize = loadedCard.footerDescSize || loadedCard.descSize || 10;
        loadedCard.titleAlign = loadedCard.titleAlign || 'left';
        loadedCard.skillDescAlign = loadedCard.skillDescAlign || 'left';
        loadedCard.footerDescAlign = loadedCard.footerDescAlign || 'center';
        loadedCard.hideImage = loadedCard.hideImage || false;
        loadedCard.hideHp = loadedCard.hideHp || false;
        loadedCard.hpSize = loadedCard.hpSize || 16;
        loadedCard.imageHeight = loadedCard.imageHeight || 160;
        loadedCard.imageFit = loadedCard.imageFit || 'cover';
        loadedCard.imageMarginTop = loadedCard.imageMarginTop || 0;
        
        setCurrentCard(loadedCard);
        setIsEditingList(false);
    };
    
    const handleUpdateCard = () => {
        const newCards = savedCards.map(c => c.id === currentCard.id ? currentCard : c);
        saveToContext(newCards);
    };

    const isUpdating = savedCards.some(c => c.id === currentCard.id);

    const handleUpdateSkill = (index, field, value) => {
        const newSkills = [...currentCard.skills];
        newSkills[index][field] = value;
        setCurrentCard({ ...currentCard, skills: newSkills });
    };

    const handleAddSkill = () => {
        if (currentCard.skills.length < 9) {
            setCurrentCard({ ...currentCard, skills: [...currentCard.skills, { name: '', desc: '', val: '' }] });
        }
    };

    const handleRemoveSkill = (index) => {
        const newSkills = currentCard.skills.filter((_, i) => i !== index);
        setCurrentCard({ ...currentCard, skills: newSkills });
    };

    return (
        <div className="flex flex-col gap-6">
            <style>{`
                @media print {
                    .print-exact-colors, .print-exact-colors * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {/* Target de Impressão e PDF (Páginas A4 discretas com exatamente 4 cards por folha) */}
            <div id="trading-cards-print-target" className="trading-cards-print-target">
                {printPages.map((pageCards, pageIdx) => (
                    <div 
                        key={`print-page-${pageIdx}`} 
                        className="trading-card-print-page print-exact-colors"
                    >
                        {/* Header da Folha / Guia de Corte */}
                        <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold mb-2 border-b border-gray-200 pb-1 shrink-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs">✂️</span>
                                <span className="font-bold text-gray-700">Drácker Adapta • Cards Colecionáveis Didáticos</span>
                                <span className="text-gray-400 font-normal">| Recorte nas linhas tracejadas</span>
                            </div>
                            <div className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                Folha {pageIdx + 1} de {printPages.length}
                            </div>
                        </div>

                        {/* Grade 2x2 Exata com 4 Cards */}
                        <div className="trading-card-print-grid grid grid-cols-2 grid-rows-2 gap-4 flex-1 items-center justify-items-center">
                            {pageCards.map(({ card, key }) => (
                                <div 
                                    key={key} 
                                    className="trading-card-print-slot relative flex items-center justify-center p-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white"
                                    style={{ width: '344px', height: '468px' }}
                                >
                                    <TradingCard data={card} noHoverScale={true} isPrint={true} />
                                </div>
                            ))}
                            {/* Preenchimento de slots vazios na última folha para estabilidade total do layout */}
                            {Array.from({ length: 4 - pageCards.length }).map((_, emptyIdx) => (
                                <div 
                                    key={`empty-${pageIdx}-${emptyIdx}`} 
                                    className="trading-card-print-slot border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-300 text-xs font-medium bg-gray-50/40"
                                    style={{ width: '344px', height: '468px' }}
                                >
                                    <span className="opacity-40 select-none text-[11px]">Espaço livre</span>
                                </div>
                            ))}
                        </div>

                        {/* Rodapé da folha */}
                        <div className="text-center text-[9px] text-gray-400 mt-2 pt-1 border-t border-gray-100 shrink-0">
                            Dica: Para melhor durabilidade e acabamento, utilize papel de gramatura 180g (offset ou fotográfico fosco).
                        </div>
                    </div>
                ))}
            </div>

            {/* Área de Edição e Galeria (Ocultas durante Impressão e Captura do PDF) */}
            <div className="trading-cards-editor-view flex flex-col gap-6 no-print">
                {/* Editor Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <Card className="flex flex-col gap-4">
                    <h2 className="heading-gamified text-xl">Criar Novo Card</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Nome" value={currentCard.title} onChange={e => setCurrentCard({...currentCard, title: e.target.value})} placeholder="Ex: Célula Animal" />
                        
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold text-brown-700">HP / Pontos</label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={!currentCard.hideHp} 
                                        onChange={e => setCurrentCard({...currentCard, hideHp: !e.target.checked})} 
                                        className="w-3.5 h-3.5 accent-amber-600 cursor-pointer" 
                                    />
                                    <span className="text-xs font-bold text-brown-600">Incluir HP</span>
                                </label>
                            </div>
                            {!currentCard.hideHp ? (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        value={currentCard.hp} 
                                        onChange={e => setCurrentCard({...currentCard, hp: e.target.value})} 
                                        placeholder="Ex: 120" 
                                        type="number" 
                                        className="flex-1"
                                    />
                                    <div className="flex items-center bg-white border border-brown-300 rounded-lg px-2 shadow-sm h-[42px]" title="Tamanho da fonte do HP">
                                        <span className="text-[10px] font-bold text-brown-500 mr-1.5">Tam:</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setCurrentCard({...currentCard, hpSize: Math.max(8, (currentCard.hpSize || 16) - 1)})} 
                                            className="w-5 h-5 flex items-center justify-center font-bold text-xs text-brown-700 hover:bg-brown-100 rounded"
                                            title="Diminuir fonte do HP"
                                        >
                                            -
                                        </button>
                                        <span className="w-6 text-center font-black text-xs text-brown-900">
                                            {currentCard.hpSize || 16}
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={() => setCurrentCard({...currentCard, hpSize: Math.min(32, (currentCard.hpSize || 16) + 1)})} 
                                            className="w-5 h-5 flex items-center justify-center font-bold text-xs text-brown-700 hover:bg-brown-100 rounded"
                                            title="Aumentar fonte do HP"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[42px] border border-dashed border-brown-300 rounded-lg flex items-center justify-center bg-brown-50/50 text-xs text-brown-400 font-medium">
                                    HP oculto neste card
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-1 border border-brown-200 p-3 rounded-lg bg-brown-50/50">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-brown-500 uppercase tracking-wider">Imagem do Card</span>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="checkbox" checked={!currentCard.hideImage} onChange={e => setCurrentCard({...currentCard, hideImage: !e.target.checked})} className="w-3.5 h-3.5 accent-amber-600 cursor-pointer" />
                                    <span className="text-xs font-bold text-brown-700">Incluir Imagem</span>
                                </label>
                            </div>
                            {!currentCard.hideImage && (
                                <div className="flex flex-col gap-2.5 mt-1">
                                    <Input value={currentCard.imageUrl} onChange={e => setCurrentCard({...currentCard, imageUrl: e.target.value})} placeholder="URL da Imagem (https://...)" />
                                    {(currentCard.imageUrl.includes('photos.app.goo.gl') || currentCard.imageUrl.includes('photos.google.com')) && (
                                        <div className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 p-2 rounded flex flex-col gap-1 mt-1">
                                            <span className="font-bold flex items-center gap-1">ℹ️ Como usar imagens do Google Fotos:</span>
                                            <span>O link de compartilhamento não funciona direto. Você precisa abrir esse link no navegador, clicar com o <b>botão direito</b> em cima da foto e escolher <b>"Copiar endereço da imagem"</b>. Depois cole aqui!</span>
                                        </div>
                                    )}

                                    {/* Controle de Altura e Enquadramento da Imagem */}
                                    <div className="bg-white/80 border border-brown-200 rounded-lg p-2.5 flex flex-col gap-2.5 mt-1">
                                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                                            <span className="text-[11px] font-bold text-brown-700 flex items-center gap-1">
                                                📏 Altura da Imagem:
                                                <span className="text-amber-800 font-extrabold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 text-xs">
                                                    {currentCard.imageHeight || 160}px
                                                </span>
                                            </span>
                                            {/* Presets Rápidos */}
                                            <div className="flex items-center gap-1">
                                                {[
                                                    { label: 'Pequena', val: 120 },
                                                    { label: 'Padrão', val: 160 },
                                                    { label: 'Grande', val: 200 },
                                                    { label: 'Destaque', val: 240 }
                                                ].map(preset => (
                                                    <button
                                                        key={preset.val}
                                                        type="button"
                                                        onClick={() => setCurrentCard({...currentCard, imageHeight: preset.val})}
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                                                            (currentCard.imageHeight || 160) === preset.val
                                                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                                                : 'bg-brown-50 text-brown-700 border-brown-200 hover:bg-brown-100'
                                                        }`}
                                                    >
                                                        {preset.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Slider contínuo de 100px a 260px */}
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-brown-400">100px</span>
                                            <input
                                                type="range"
                                                min="100"
                                                max="260"
                                                step="5"
                                                value={currentCard.imageHeight || 160}
                                                onChange={e => setCurrentCard({...currentCard, imageHeight: Number(e.target.value)})}
                                                className="flex-1 accent-amber-600 cursor-pointer h-1.5 bg-brown-200 rounded-lg"
                                            />
                                            <span className="text-[10px] font-bold text-brown-400">260px</span>
                                        </div>

                                        {/* Enquadramento da Imagem (object-fit) */}
                                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-brown-100">
                                            <span className="text-[11px] font-bold text-brown-700">Enquadramento:</span>
                                            <div className="flex items-center gap-1">
                                                {[
                                                    { id: 'cover', label: 'Cobrir (Sem distorcer)' },
                                                    { id: 'contain', label: 'Conter (Inteira)' },
                                                    { id: 'fill', label: 'Esticar' }
                                                ].map(fit => (
                                                    <button
                                                        key={fit.id}
                                                        type="button"
                                                        onClick={() => setCurrentCard({...currentCard, imageFit: fit.id})}
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                                                            (currentCard.imageFit || 'cover') === fit.id
                                                                ? 'bg-brown-800 text-white border-brown-800 shadow-sm'
                                                                : 'bg-brown-50 text-brown-700 border-brown-200 hover:bg-brown-100'
                                                        }`}
                                                    >
                                                        {fit.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Posição Vertical / Abaixar Imagem (Espaço para o Nome) */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-brown-100">
                                            <div className="flex items-center gap-2">
                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={Boolean(currentCard.imageMarginTop && currentCard.imageMarginTop > 0)} 
                                                        onChange={e => setCurrentCard({
                                                            ...currentCard, 
                                                            imageMarginTop: e.target.checked ? 25 : 0
                                                        })} 
                                                        className="w-3.5 h-3.5 accent-amber-600 cursor-pointer" 
                                                    />
                                                    <span className="text-[11px] font-bold text-brown-800">
                                                        Abaixar Imagem (Espaço para Nome)
                                                    </span>
                                                </label>
                                                {currentCard.hideHp && (
                                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                                                        HP Oculto
                                                    </span>
                                                )}
                                            </div>

                                            {/* Ajuste fino de pixels quando ativado ou quando HP estiver oculto */}
                                            {(Boolean(currentCard.imageMarginTop && currentCard.imageMarginTop > 0) || currentCard.hideHp) && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold text-brown-500">Espaço:</span>
                                                    <div className="flex items-center bg-white border border-brown-300 rounded px-1 py-0.5 shadow-sm">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setCurrentCard({...currentCard, imageMarginTop: Math.max(0, (currentCard.imageMarginTop || 0) - 5)})} 
                                                            className="w-5 h-5 flex items-center justify-center font-bold text-xs text-brown-700 hover:bg-brown-100 rounded"
                                                            title="Diminuir espaço acima da imagem"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center font-black text-xs text-amber-950">
                                                            +{currentCard.imageMarginTop || 0}px
                                                        </span>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setCurrentCard({...currentCard, imageMarginTop: Math.min(80, (currentCard.imageMarginTop || 0) + 5)})} 
                                                            className="w-5 h-5 flex items-center justify-center font-bold text-xs text-brown-700 hover:bg-brown-100 rounded"
                                                            title="Aumentar espaço acima da imagem"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    {[15, 25, 40].map(val => (
                                                        <button 
                                                            key={val}
                                                            type="button"
                                                            onClick={() => setCurrentCard({...currentCard, imageMarginTop: val})}
                                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                                                                currentCard.imageMarginTop === val 
                                                                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                                                                    : 'bg-brown-50 text-brown-700 border-brown-200 hover:bg-brown-100'
                                                            }`}
                                                            title={`Definir +${val}px de espaço`}
                                                        >
                                                            +{val}px
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Seção de Design Avançado */}
                        <div className="border border-brown-200 p-4 rounded-lg bg-brown-50/50 shadow-inner mt-2">
                            <h3 className="font-bold text-sm text-brown-800 mb-4 flex items-center gap-2">
                                🎨 Design Avançado de Cores
                            </h3>
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                {/* Moldura */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-brown-500 uppercase tracking-wider border-b border-brown-200 pb-1">Moldura</h4>
                                    <div className="grid grid-cols-3 gap-1">
                                        <div className="flex flex-col items-center gap-1">
                                            <input type="color" value={currentCard.outerBorderColor || '#374151'} onChange={e => setCurrentCard({...currentCard, outerBorderColor: e.target.value})} className="w-7 h-7 rounded cursor-pointer border border-brown-300 p-0 bg-white" />
                                            <span className="text-[9px] text-brown-600 text-center leading-tight">Borda<br/>Ext.</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <input type="color" value={currentCard.innerBorderColor || '#9ca3af'} onChange={e => setCurrentCard({...currentCard, innerBorderColor: e.target.value})} className="w-7 h-7 rounded cursor-pointer border border-brown-300 p-0 bg-white" />
                                            <span className="text-[9px] text-brown-600 text-center leading-tight">Borda<br/>Int.</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <input type="color" value={currentCard.cardBgColor || '#e5e7eb'} onChange={e => setCurrentCard({...currentCard, cardBgColor: e.target.value})} className="w-7 h-7 rounded cursor-pointer border border-brown-300 p-0 bg-white" />
                                            <span className="text-[9px] text-brown-600 text-center leading-tight">Fundo</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Fundos Internos */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-brown-500 uppercase tracking-wider border-b border-brown-200 pb-1">Áreas</h4>
                                    <div className="grid grid-cols-3 gap-1">
                                        <div className="flex flex-col items-center gap-1">
                                            <input type="color" value={currentCard.innerBgColor || '#ffffff'} onChange={e => setCurrentCard({...currentCard, innerBgColor: e.target.value})} className="w-7 h-7 rounded cursor-pointer border border-brown-300 p-0 bg-white" />
                                            <span className="text-[9px] text-brown-600 text-center leading-tight">Fundo<br/>Texto</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <input type="color" value={currentCard.hpBgColor || '#ffffff'} onChange={e => setCurrentCard({...currentCard, hpBgColor: e.target.value})} className="w-7 h-7 rounded cursor-pointer border border-brown-300 p-0 bg-white" />
                                            <span className="text-[9px] text-brown-600 text-center leading-tight">Fundo<br/>HP</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <input type="color" value={currentCard.footerBgColor || '#f3f4f6'} onChange={e => setCurrentCard({...currentCard, footerBgColor: e.target.value})} className="w-7 h-7 rounded cursor-pointer border border-brown-300 p-0 bg-white" />
                                            <span className="text-[9px] text-brown-600 text-center leading-tight">Rodapé</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Tipografia */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-brown-500 uppercase tracking-wider border-b border-brown-200 pb-1">Textos</h4>
                                    <div className="grid grid-cols-3 gap-1">
                                        <div className="flex flex-col items-center gap-1">
                                            <input type="color" value={currentCard.titleColor || '#111827'} onChange={e => setCurrentCard({...currentCard, titleColor: e.target.value})} className="w-7 h-7 rounded cursor-pointer border border-brown-300 p-0 bg-white" />
                                            <span className="text-[9px] text-brown-600 text-center leading-tight">Título</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <input type="color" value={currentCard.textColor || '#1f2937'} onChange={e => setCurrentCard({...currentCard, textColor: e.target.value})} className="w-7 h-7 rounded cursor-pointer border border-brown-300 p-0 bg-white" />
                                            <span className="text-[9px] text-brown-600 text-center leading-tight">Geral</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <input type="color" value={currentCard.hpTextColor || '#dc2626'} onChange={e => setCurrentCard({...currentCard, hpTextColor: e.target.value})} className="w-7 h-7 rounded cursor-pointer border border-brown-300 p-0 bg-white" />
                                            <span className="text-[9px] text-brown-600 text-center leading-tight">Valor<br/>HP</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seção de Tipografia */}
                        <div className="border border-brown-200 p-4 rounded-lg bg-brown-50/50 shadow-inner mt-2">
                            <h3 className="font-bold text-sm text-brown-800 mb-4 flex items-center gap-2">
                                🔤 Tipografia, Tamanhos e Alinhamentos
                            </h3>
                            
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                                    <div className="flex flex-col gap-1 col-span-2">
                                        <label className="text-[10px] font-bold text-brown-500 uppercase tracking-wider">Fonte Global</label>
                                        <select value={currentCard.fontFamily || 'sans-serif'} onChange={e => setCurrentCard({...currentCard, fontFamily: e.target.value})} className="border border-brown-300 p-1.5 text-sm rounded bg-white text-brown-900 outline-none focus:border-amber-500">
                                            <option value="sans-serif">Moderno (Sem Serifa)</option>
                                            <option value="serif">Clássico (Com Serifa)</option>
                                            <option value="monospace">Máquina (Monospace)</option>
                                            <option value="'Comic Sans MS', cursive, sans-serif">Divertida (Comic)</option>
                                            <option value="Impact, fantasy">Impacto (Grossa)</option>
                                            <option value="'Courier New', Courier, monospace">Jornal (Courier)</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-brown-500 uppercase tracking-wider text-center" title="Título do Card">Título</label>
                                        <input type="number" value={currentCard.titleSize || 20} onChange={e => setCurrentCard({...currentCard, titleSize: Number(e.target.value)})} className="border border-brown-300 p-1.5 text-sm rounded w-full text-center outline-none focus:border-amber-500" title="Tamanho em px" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-brown-500 uppercase tracking-wider text-center" title="Tamanho da Fonte do HP">HP</label>
                                        <input type="number" value={currentCard.hpSize || 16} onChange={e => setCurrentCard({...currentCard, hpSize: Number(e.target.value)})} className="border border-brown-300 p-1.5 text-sm rounded w-full text-center outline-none focus:border-amber-500" title="Tamanho em px" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-brown-500 uppercase tracking-wider text-center" title="Nome da Habilidade">Habilid.</label>
                                        <input type="number" value={currentCard.skillNameSize || 13} onChange={e => setCurrentCard({...currentCard, skillNameSize: Number(e.target.value)})} className="border border-brown-300 p-1.5 text-sm rounded w-full text-center outline-none focus:border-amber-500" title="Tamanho em px" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-brown-500 uppercase tracking-wider text-center" title="Descrição da Habilidade">Desc. Hab.</label>
                                        <input type="number" value={currentCard.skillDescSize || 10} onChange={e => setCurrentCard({...currentCard, skillDescSize: Number(e.target.value)})} className="border border-brown-300 p-1.5 text-sm rounded w-full text-center outline-none focus:border-amber-500" title="Tamanho em px" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-brown-500 uppercase tracking-wider text-center" title="Rodapé / Curiosidade">Rodapé</label>
                                        <input type="number" value={currentCard.footerDescSize || 10} onChange={e => setCurrentCard({...currentCard, footerDescSize: Number(e.target.value)})} className="border border-brown-300 p-1.5 text-sm rounded w-full text-center outline-none focus:border-amber-500" title="Tamanho em px" />
                                    </div>
                                </div>
                                
                                {/* Linha de Alinhamentos */}
                                <div className="grid grid-cols-3 gap-3 border-t border-brown-200/50 pt-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-brown-500 uppercase tracking-wider text-center">Alin. Título</label>
                                        <div className="flex bg-white border border-brown-300 rounded overflow-hidden">
                                            <button onClick={() => setCurrentCard({...currentCard, titleAlign: 'left'})} className={`p-1.5 flex-1 flex justify-center transition-colors ${currentCard.titleAlign === 'left' ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-gray-400 hover:bg-brown-50 hover:text-brown-600'}`} title="Esquerda">
                                                <AlignLeft className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setCurrentCard({...currentCard, titleAlign: 'center'})} className={`p-1.5 flex-1 flex justify-center transition-colors border-l border-brown-200 ${currentCard.titleAlign === 'center' ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-gray-400 hover:bg-brown-50 hover:text-brown-600'}`} title="Centro">
                                                <AlignCenter className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setCurrentCard({...currentCard, titleAlign: 'right'})} className={`p-1.5 flex-1 flex justify-center transition-colors border-l border-brown-200 ${currentCard.titleAlign === 'right' ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-gray-400 hover:bg-brown-50 hover:text-brown-600'}`} title="Direita">
                                                <AlignRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-brown-500 uppercase tracking-wider text-center">Alin. Desc. Habilidade</label>
                                        <div className="flex bg-white border border-brown-300 rounded overflow-hidden">
                                            <button onClick={() => setCurrentCard({...currentCard, skillDescAlign: 'left'})} className={`p-1.5 flex-1 flex justify-center transition-colors ${currentCard.skillDescAlign === 'left' ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-gray-400 hover:bg-brown-50 hover:text-brown-600'}`} title="Esquerda">
                                                <AlignLeft className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setCurrentCard({...currentCard, skillDescAlign: 'center'})} className={`p-1.5 flex-1 flex justify-center transition-colors border-l border-brown-200 ${currentCard.skillDescAlign === 'center' ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-gray-400 hover:bg-brown-50 hover:text-brown-600'}`} title="Centro">
                                                <AlignCenter className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setCurrentCard({...currentCard, skillDescAlign: 'right'})} className={`p-1.5 flex-1 flex justify-center transition-colors border-l border-brown-200 ${currentCard.skillDescAlign === 'right' ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-gray-400 hover:bg-brown-50 hover:text-brown-600'}`} title="Direita">
                                                <AlignRight className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setCurrentCard({...currentCard, skillDescAlign: 'justify'})} className={`p-1.5 flex-1 flex justify-center transition-colors border-l border-brown-200 ${currentCard.skillDescAlign === 'justify' ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-gray-400 hover:bg-brown-50 hover:text-brown-600'}`} title="Justificado">
                                                <AlignJustify className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-brown-500 uppercase tracking-wider text-center">Alin. Rodapé</label>
                                        <div className="flex bg-white border border-brown-300 rounded overflow-hidden">
                                            <button onClick={() => setCurrentCard({...currentCard, footerDescAlign: 'left'})} className={`p-1.5 flex-1 flex justify-center transition-colors ${currentCard.footerDescAlign === 'left' ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-gray-400 hover:bg-brown-50 hover:text-brown-600'}`} title="Esquerda">
                                                <AlignLeft className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setCurrentCard({...currentCard, footerDescAlign: 'center'})} className={`p-1.5 flex-1 flex justify-center transition-colors border-l border-brown-200 ${currentCard.footerDescAlign === 'center' ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-gray-400 hover:bg-brown-50 hover:text-brown-600'}`} title="Centro">
                                                <AlignCenter className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setCurrentCard({...currentCard, footerDescAlign: 'right'})} className={`p-1.5 flex-1 flex justify-center transition-colors border-l border-brown-200 ${currentCard.footerDescAlign === 'right' ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-gray-400 hover:bg-brown-50 hover:text-brown-600'}`} title="Direita">
                                                <AlignRight className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setCurrentCard({...currentCard, footerDescAlign: 'justify'})} className={`p-1.5 flex-1 flex justify-center transition-colors border-l border-brown-200 ${currentCard.footerDescAlign === 'justify' ? 'bg-amber-100 text-amber-700 shadow-inner' : 'text-gray-400 hover:bg-brown-50 hover:text-brown-600'}`} title="Justificado">
                                                <AlignJustify className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skills Area */}
                    <div className="flex flex-col gap-3 mt-2">
                        <div className="flex justify-between items-center">
                            <label className="block text-[15px] font-bold mb-2 text-slate-700 tracking-wide">Habilidades ({currentCard.skills.length}/9)</label>
                            {currentCard.skills.length < 9 && (
                                <button onClick={handleAddSkill} className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 transition-colors">
                                    <Plus className="w-3 h-3" /> Adicionar
                                </button>
                            )}
                        </div>

                        {currentCard.skills.map((skill, index) => (
                            <div key={index} className="border border-brown-200 p-3 rounded-lg bg-brown-50 relative group">
                                <h3 className="font-bold text-sm text-brown-800 mb-2">Habilidade {index + 1}</h3>
                                <button onClick={() => handleRemoveSkill(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Remover">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    <div className="col-span-2">
                                        <Input value={skill.name} onChange={e => handleUpdateSkill(index, 'name', e.target.value)} placeholder="Nome (Ex: Ataque Rápido)" className="text-sm" />
                                    </div>
                                    <Input value={skill.val} onChange={e => handleUpdateSkill(index, 'val', e.target.value)} placeholder="Valor/Dano" className="text-sm" />
                                </div>
                                <TextArea value={skill.desc} onChange={e => handleUpdateSkill(index, 'desc', e.target.value)} placeholder="Descrição do efeito... (Aperte Enter para pular linha)" className="text-sm resize-none" rows={2} />
                            </div>
                        ))}
                    </div>

                    <TextArea label="Descrição (Rodapé)" value={currentCard.description} onChange={e => setCurrentCard({...currentCard, description: e.target.value})} placeholder="Fato curioso ou descrição da carta..." rows={2} className="!resize-none mt-2" />

                    <div className="flex flex-col gap-2 mt-2">
                        <div className="flex gap-2">
                            {isUpdating ? (
                                <>
                                    <Button onClick={handleUpdateCard} variant="primary" className="flex-1 py-3 text-white bg-green-600 hover:bg-green-700">
                                        Atualizar Card
                                    </Button>
                                    <Button onClick={() => setCurrentCard({...currentCard, id: Date.now().toString()})} variant="secondary" className="flex-1 py-3">
                                        Cancelar Edição
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={handleAddCard} variant="primary" icon={Plus} className="flex-[2] py-3 text-white shadow-md bg-amber-600 hover:bg-amber-700">
                                    Adicionar à Coleção
                                </Button>
                            )}
                            <Button onClick={handleNewCard} variant="secondary" className="flex-1 py-3 border-brown-300 text-brown-700 bg-white hover:bg-brown-50">
                                + Nova Card
                            </Button>
                        </div>

                        {/* Impressão Direta do Card Atual */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-900">Imprimir este Card:</span>
                                <div className="flex items-center bg-white rounded-lg border border-amber-300 px-1 py-0.5 shadow-sm">
                                    <button 
                                        type="button"
                                        onClick={() => setDirectPrintCopies(prev => Math.max(1, prev - 1))}
                                        className="w-5 h-5 flex items-center justify-center font-bold text-xs text-amber-800 hover:bg-amber-100 rounded"
                                        title="Diminuir cópia"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={directPrintCopies}
                                        onChange={e => setDirectPrintCopies(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                                        className="w-8 text-center text-xs font-black text-amber-950 bg-transparent border-0 focus:outline-none"
                                        title="Quantidade de cópias"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setDirectPrintCopies(prev => Math.min(50, prev + 1))}
                                        className="w-5 h-5 flex items-center justify-center font-bold text-xs text-amber-800 hover:bg-amber-100 rounded"
                                        title="Aumentar cópia"
                                    >
                                        +
                                    </button>
                                </div>
                                <span className="text-[11px] text-amber-700 font-medium">
                                    (~{Math.ceil(directPrintCopies / 4)} {Math.ceil(directPrintCopies / 4) === 1 ? 'folha' : 'folhas'} A4)
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button 
                                    type="button" 
                                    onClick={handleDownloadCurrentCardPng} 
                                    variant="secondary" 
                                    icon={ImageIcon} 
                                    className="py-1.5 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm font-bold"
                                    title="Salvar imagem PNG individual deste card em alta resolução (ideal para WhatsApp, redes sociais e impressão fotográfica)"
                                >
                                    Salvar PNG
                                </Button>
                                <Button 
                                    type="button" 
                                    onClick={handleDownloadPdfCurrentCard} 
                                    variant="secondary" 
                                    icon={Download} 
                                    className="py-1.5 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm font-bold"
                                    title={`Baixar PDF com ${directPrintCopies} cópias deste card diagramadas em folha A4`}
                                >
                                    Baixar PDF ({directPrintCopies})
                                </Button>
                                <Button 
                                    type="button" 
                                    onClick={handlePrintCurrentCard} 
                                    variant="secondary" 
                                    icon={Printer} 
                                    className="py-1.5 px-3 text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100 shadow-sm font-bold"
                                    title={`Imprimir ${directPrintCopies} cópias deste card`}
                                >
                                    Imprimir ({directPrintCopies})
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Visual Preview */}
                <div 
                    ref={previewContainerRef}
                    className="flex flex-col items-center justify-between p-6 lg:p-8 bg-brown-100/90 rounded-2xl border-2 border-dashed border-brown-300 relative overflow-hidden min-h-[620px] lg:min-h-[720px] lg:sticky lg:top-6 self-start shadow-inner w-full"
                    style={{ perspective: '1200px' }}
                >
                    {/* Header do Preview com Controles de Zoom */}
                    <div className="w-full flex items-center justify-between z-20 mb-2 gap-2">
                        <span className="text-xs font-bold text-brown-600 uppercase tracking-wider flex items-center gap-1.5 select-none">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Preview em Tempo Real
                        </span>

                        <button 
                            type="button" 
                            onClick={handleDownloadCurrentCardPng} 
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer ml-auto"
                            title="Salvar imagem PNG individual deste card em alta resolução (300 DPI, transparente)"
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Salvar PNG</span>
                        </button>
                        
                        {/* Controles discretos de Zoom */}
                        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-brown-200 shadow-sm text-brown-700">
                            <button 
                                type="button"
                                onClick={() => setZoomOffset(prev => Math.max(-0.6, prev - 0.15))}
                                className="p-1 hover:bg-brown-100 rounded text-brown-600 hover:text-brown-900 transition-colors"
                                title="Diminuir Zoom"
                            >
                                <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                type="button"
                                onClick={() => setZoomOffset(0)}
                                className="px-1.5 py-0.5 text-[11px] font-bold hover:bg-brown-100 rounded text-brown-700 hover:text-brown-900 transition-colors"
                                title="Restaurar tamanho automático"
                            >
                                {Math.round(effectiveScale * 100)}%
                            </button>
                            <button 
                                type="button"
                                onClick={() => setZoomOffset(prev => Math.min(0.8, prev + 0.15))}
                                className="p-1 hover:bg-brown-100 rounded text-brown-600 hover:text-brown-900 transition-colors"
                                title="Aumentar Zoom"
                            >
                                <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            {zoomOffset !== 0 && (
                                <button 
                                    type="button"
                                    onClick={() => setZoomOffset(0)}
                                    className="p-1 hover:bg-brown-100 rounded text-amber-600 hover:text-amber-700 transition-colors ml-0.5"
                                    title="Redefinir para Automático"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Área central com Card Ampliado ocupando quase todo o fundo */}
                    <div className="flex-1 w-full flex items-center justify-center py-4 relative">
                        <div 
                            ref={previewRef}
                            className="relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                            style={{
                                width: `${320 * effectiveScale}px`,
                                height: `${440 * effectiveScale}px`,
                            }}
                            onMouseMove={handlePreviewMouseMove}
                            onMouseLeave={handlePreviewMouseLeave}
                        >
                            <div 
                                className={`relative transition-all ${previewRotation.active ? 'duration-75 ease-out' : 'duration-500 ease-out'}`}
                                style={{
                                    width: '320px',
                                    height: '440px',
                                    transform: previewRotation.active 
                                        ? `rotateX(${previewRotation.x.toFixed(1)}deg) rotateY(${previewRotation.y.toFixed(1)}deg) scale(${effectiveScale * 1.02})`
                                        : `rotateX(0deg) rotateY(0deg) scale(${effectiveScale})`,
                                    transformOrigin: 'center center',
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                {/* Reflexo de luz (Shine effect) */}
                                {previewRotation.active && (
                                    <div 
                                        className="absolute inset-0 z-50 pointer-events-none rounded-2xl"
                                        style={{
                                            background: `linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%)`,
                                            backgroundPosition: `${(previewRotation.y * -3) + 50}% ${(previewRotation.x * -3) + 50}%`,
                                            backgroundSize: '300% 300%',
                                            mixBlendMode: 'overlay',
                                            transition: 'background-position 0.1s ease-out'
                                        }}
                                    />
                                )}
                                <div className="shadow-[0_25px_60px_rgba(0,0,0,0.35)] rounded-2xl">
                                    <TradingCard data={currentCard} noHoverScale={true} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dica de interação no rodapé */}
                    <span className="text-[11px] text-brown-400 font-medium select-none pointer-events-none mt-2">
                        Passe o mouse sobre a carta para ver o efeito 3D
                    </span>
                </div>
            </div>

            {/* Gallery Area / Carousel */}
            <div className="rounded-2xl overflow-hidden border border-brown-200 bg-white/50 backdrop-blur-sm relative no-print">
                <div className="p-4 sm:p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-brown-200 bg-brown-50">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-brown-900 flex items-center gap-2">
                            🌟 Sua Coleção
                            <span className="bg-amber-500 text-brown-900 text-xs px-2 py-0.5 rounded-full font-black">
                                {savedCards.length}
                            </span>
                        </h2>
                        {savedCards.length > 0 && (
                            <div className="flex items-center gap-1.5 ml-2">
                                <button 
                                    type="button"
                                    onClick={() => toggleSelectAll(true)}
                                    className="text-xs font-semibold text-brown-600 hover:text-brown-900 underline underline-offset-2"
                                >
                                    Todos
                                </button>
                                <span className="text-brown-300">|</span>
                                <button 
                                    type="button"
                                    onClick={() => toggleSelectAll(false)}
                                    className="text-xs font-semibold text-brown-600 hover:text-brown-900 underline underline-offset-2"
                                >
                                    Nenhum
                                </button>
                            </div>
                        )}
                    </div>

                    {savedCards.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            {/* Seletor rápido de cópias para todos */}
                            <div className="flex items-center gap-1.5 bg-white/80 border border-brown-200 px-2.5 py-1 rounded-xl text-xs text-brown-700">
                                <span className="font-bold text-brown-600">Cópias p/ todos:</span>
                                {[1, 2, 4, 8].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => applyQuantityToAll(num)}
                                        className="px-2 py-0.5 rounded-lg font-bold text-[11px] bg-brown-100 hover:bg-amber-100 text-brown-800 hover:text-amber-900 transition-colors border border-brown-200"
                                        title={`Definir ${num} cópia(s) para todos os cards`}
                                    >
                                        {num}x
                                    </button>
                                ))}
                            </div>

                            {/* Informações de folhas e cópias */}
                            <div className="text-right flex flex-col">
                                <span className="text-xs font-bold text-brown-800">
                                    {totalPrintCopies} {totalPrintCopies === 1 ? 'cópia' : 'cópias'} ({totalSelectedCards} cards)
                                </span>
                                <span className="text-[11px] text-brown-500">
                                    ~{estimatedPages} {estimatedPages === 1 ? 'folha' : 'folhas'} A4 (4 cards/pág)
                                </span>
                            </div>

                            {/* Botões de Ação: Impressão e Download PDF */}
                            <div className="flex items-center gap-2">
                                <Button 
                                    onClick={handlePrint} 
                                    variant="secondary" 
                                    icon={Printer} 
                                    disabled={totalPrintCopies === 0}
                                    className="py-2.5 px-3.5 bg-white hover:bg-brown-100 text-brown-800 border-brown-300 shadow-sm disabled:opacity-50 text-xs font-bold"
                                    title="Imprimir ou Salvar como PDF via navegador"
                                >
                                    Imprimir {totalPrintCopies > 0 ? `(${totalPrintCopies})` : ''}
                                </Button>
                                <Button 
                                    onClick={handleDownloadPdfCollection} 
                                    variant="primary" 
                                    icon={Download} 
                                    disabled={totalPrintCopies === 0}
                                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50 text-xs font-bold"
                                    title="Baixar arquivo PDF diagramado com 4 cards por folha"
                                >
                                    Baixar PDF {totalPrintCopies > 0 ? `(${totalPrintCopies})` : ''}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {savedCards.length === 0 ? (
                    <div className="text-center p-12 text-brown-400 flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-16 h-24 border-2 border-dashed border-brown-300 rounded-lg mb-4 flex items-center justify-center">
                            <Plus className="w-8 h-8 text-brown-300" />
                        </div>
                        <p className="text-lg font-medium">Nenhum card na sua coleção.</p>
                        <p className="text-sm mt-1">Preencha o formulário acima e adicione seu primeiro card!</p>
                    </div>
                ) : (
                    <div className="relative group">
                        {/* Navigation Hints (Left/Right Fade) */}
                        <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        {/* Carousel Container */}
                        <div className="flex overflow-x-auto gap-6 p-8 snap-x snap-mandatory hide-scrollbar pb-12" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {savedCards.map(card => {
                                const qty = printQuantities[card.id] || 0;
                                const isSelected = qty > 0;
                                return (
                                    <div key={card.id} className="relative w-[192px] h-[264px] flex-shrink-0 snap-center group/card perspective-1000">
                                        {/* Scaled Card */}
                                        <div 
                                            className={`absolute top-0 left-0 transform scale-[0.6] origin-top-left cursor-pointer transition-all duration-300 group-hover/card:-translate-y-2 group-hover/card:shadow-xl ${isSelected ? '' : 'opacity-60 grayscale-[30%]'}`} 
                                            onClick={() => handleLoadCard(card)}
                                        >
                                            <TradingCard data={card} />
                                        </div>
                                        
                                        {/* Action Buttons Overlay */}
                                        <div className="absolute -top-3.5 right-0 z-20 flex flex-col items-end gap-1.5">
                                            <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-brown-200 p-0.5">
                                                <button 
                                                    type="button"
                                                    onClick={(e) => togglePrintSelection(card.id, e)} 
                                                    className={`p-1.5 rounded-full transition-all ${isSelected ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                                                    title={isSelected ? "Remover da Impressão" : "Adicionar à Impressão"}
                                                >
                                                    {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>

                                            {/* Quantidade de cópias quando selecionado */}
                                            {isSelected && (
                                                <div 
                                                    className="flex items-center gap-1 bg-amber-50/95 backdrop-blur-sm px-2 py-0.5 rounded-full shadow border border-amber-300 text-amber-900"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); updateCardQuantity(card.id, qty - 1); }}
                                                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-amber-200 text-amber-900 font-black text-xs transition-colors"
                                                        title="Diminuir 1 cópia"
                                                    >
                                                        -
                                                    </button>
                                                    <input 
                                                        type="number"
                                                        min="1"
                                                        max="50"
                                                        value={qty}
                                                        onChange={(e) => updateCardQuantity(card.id, parseInt(e.target.value) || 0)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-7 text-center font-black text-xs bg-transparent border-0 p-0 focus:outline-none focus:ring-1 focus:ring-amber-500 rounded text-amber-950"
                                                        title="Número de cópias a imprimir"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); updateCardQuantity(card.id, qty + 1); }}
                                                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-amber-200 text-amber-900 font-black text-xs transition-colors"
                                                        title="Aumentar 1 cópia"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute -top-3.5 -left-2 opacity-0 group-hover/card:opacity-100 transition-opacity z-20 flex items-center gap-1">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }} 
                                                className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-full shadow-md transform hover:scale-110 transition-transform" 
                                                title="Excluir Card"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => handleDownloadSpecificCardPng(card, e)} 
                                                className="p-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full shadow-md transform hover:scale-110 transition-transform" 
                                                title="Baixar este card em imagem PNG de alta resolução"
                                            >
                                                <ImageIcon className="w-3 h-3" />
                                            </button>
                                        </div>

                                        {/* Badge indicador de cópias no rodapé da miniatura */}
                                        {isSelected && (
                                            <div className="absolute bottom-1 right-2 z-10 pointer-events-none">
                                                <span className="bg-amber-500 text-brown-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                                                    {qty} {qty === 1 ? 'cópia' : 'cópias'}
                                                </span>
                                            </div>
                                        )}

                                        {/* Highlight indicator when selected */}
                                        {currentCard.id === card.id && (
                                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,1)]"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            </div> {/* fecha trading-cards-editor-view */}

            {/* Âncoras Ocultas para Captura de PNG em Alta Resolução (sem rotações 3D ou distorções) */}
            <div style={{ position: 'fixed', left: 0, top: 0, opacity: 0, pointerEvents: 'none', zIndex: -50 }} aria-hidden="true">
                <div id="trading-card-active-card-export" style={{ width: '320px', height: '440px' }}>
                    <TradingCard data={currentCard} noHoverScale={true} />
                </div>
                {exportCardData && (
                    <div id="trading-card-specific-export" style={{ width: '320px', height: '440px' }}>
                        <TradingCard data={exportCardData} noHoverScale={true} />
                    </div>
                )}
            </div>
        </div>
    );
};
