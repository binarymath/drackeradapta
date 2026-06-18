import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { TradingCard } from './TradingCard';
import { Plus, Trash2, Printer, CheckSquare, Square, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { useActivity } from '../../contexts/ActivityContext';
import { theme } from '../../styles/theme';

export const TradingCardMaker = () => {
    const { activeActivity, updateActivityData, activeTabId, addActivityTab } = useActivity();
    
    // Fallback data if activeActivity.tradingCardData is not set
    const savedCards = activeActivity?.tradingCardData?.cards || [];
    
    const [currentCard, setCurrentCard] = useState({
        id: Date.now().toString(),
        title: '',
        hp: '100',
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
        skills: [{ name: '', desc: '', val: '' }],
        description: ''
    });

    const [isEditingList, setIsEditingList] = useState(false);
    const [cardsToPrint, setCardsToPrint] = useState([]);

    // Sync cardsToPrint with savedCards on first load or when new cards are added
    useEffect(() => {
        // Automatically select new cards for printing
        setCardsToPrint(savedCards.map(c => c.id));
    }, [savedCards.length]); // Intentionally checking length to trigger on add

    const togglePrintSelection = (id, e) => {
        e.stopPropagation();
        setCardsToPrint(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
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
            title: '', hp: '100', imageUrl: '',
            outerBorderColor: '#374151', innerBorderColor: '#9ca3af', cardBgColor: '#e5e7eb',
            innerBgColor: '#ffffff', footerBgColor: '#f3f4f6', titleColor: '#111827',
            textColor: '#1f2937', hpBgColor: '#ffffff', hpTextColor: '#dc2626',
            fontFamily: 'sans-serif', titleSize: 20, skillNameSize: 13, skillValSize: 14, skillDescSize: 10, footerDescSize: 10,
            titleAlign: 'left', skillDescAlign: 'left', footerDescAlign: 'center',
            skills: [{ name: '', desc: '', val: '' }], description: ''
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

    const handlePrint = () => {
        window.print();
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
                        margin: 1cm;
                    }
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {/* Print Only Container */}
            <div className="hidden print:grid print:grid-cols-2 print:gap-x-4 print:gap-y-6 print:w-full print:justify-items-center print:items-start" style={{ maxWidth: '18cm', margin: '0 auto' }}>
                {savedCards.filter(c => cardsToPrint.includes(c.id)).map(card => (
                    <div key={`print-${card.id}`} className="print-exact-colors relative" style={{ width: '256px', height: '352px', pageBreakInside: 'avoid' }}>
                        <div style={{ transform: 'scale(0.8)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
                            <TradingCard data={card} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
                {/* Form */}
                <Card className="flex flex-col gap-4">
                    <h2 className={theme.text.title}>Criar Novo Card</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Nome" value={currentCard.title} onChange={e => setCurrentCard({...currentCard, title: e.target.value})} placeholder="Ex: Célula Animal" />
                        <Input label="HP / Pontos" value={currentCard.hp} onChange={e => setCurrentCard({...currentCard, hp: e.target.value})} placeholder="Ex: 120" type="number" />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-1">
                            <Input label="URL da Imagem" value={currentCard.imageUrl} onChange={e => setCurrentCard({...currentCard, imageUrl: e.target.value})} placeholder="https://..." />
                            {(currentCard.imageUrl.includes('photos.app.goo.gl') || currentCard.imageUrl.includes('photos.google.com')) && (
                                <div className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 p-2 rounded flex flex-col gap-1 mt-1">
                                    <span className="font-bold flex items-center gap-1">ℹ️ Como usar imagens do Google Fotos:</span>
                                    <span>O link de compartilhamento não funciona direto. Você precisa abrir esse link no navegador, clicar com o <b>botão direito</b> em cima da foto e escolher <b>"Copiar endereço da imagem"</b>. Depois cole aqui!</span>
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
                                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
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
                            <label className={theme.text.label}>Habilidades ({currentCard.skills.length}/9)</label>
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

                    <div className="flex gap-2 mt-2">
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
                </Card>

                {/* Visual Preview */}
                <div className="flex flex-col items-center justify-center p-8 bg-brown-100 rounded-2xl border-2 border-dashed border-brown-300 relative">
                    <span className="absolute top-4 left-4 text-xs font-bold text-brown-400 uppercase tracking-wider">Preview em Tempo Real</span>
                    <div className="scale-100 transform origin-top hover:scale-105 transition-transform">
                        <TradingCard data={currentCard} />
                    </div>
                </div>
            </div>

            {/* Gallery Area / Carousel */}
            <div className="rounded-2xl overflow-hidden border border-brown-200 bg-white/50 backdrop-blur-sm relative no-print">
                <div className="p-6 flex justify-between items-center border-b border-brown-200 bg-brown-50">
                    <h2 className="text-xl font-bold text-brown-900 flex items-center gap-2">
                        🌟 Sua Coleção
                        <span className="bg-amber-500 text-brown-900 text-xs px-2 py-0.5 rounded-full font-black">
                            {savedCards.length}
                        </span>
                    </h2>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-brown-500 font-medium">
                            {cardsToPrint.length} selecionados para impressão
                        </span>
                        <Button onClick={handlePrint} variant="secondary" icon={Printer} disabled={savedCards.length === 0 || cardsToPrint.length === 0}>
                            Imprimir Selecionados
                        </Button>
                    </div>
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
                                const isSelected = cardsToPrint.includes(card.id);
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
                                        <div className="absolute -top-4 right-0 z-20 flex flex-col gap-2">
                                            {/* Print Toggle Button */}
                                            <button 
                                                onClick={(e) => togglePrintSelection(card.id, e)} 
                                                className={`p-2 rounded-full shadow-md transform hover:scale-110 transition-all ${isSelected ? 'bg-green-500 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}
                                                title={isSelected ? "Remover da Impressão" : "Adicionar à Impressão"}
                                            >
                                                {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        <div className="absolute -top-4 -left-2 opacity-0 group-hover/card:opacity-100 transition-opacity z-20">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }} 
                                                className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-full shadow-md transform hover:scale-110 transition-transform" 
                                                title="Excluir Card"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>

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

        </div>
    );
};
