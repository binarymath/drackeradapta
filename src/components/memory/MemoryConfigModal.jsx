import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Brain, Image as ImageIcon, Plus, Trash2, Wand2, Upload, AlertCircle } from 'lucide-react';
import { memoryService } from './memoryService';
import { useGemini } from '../../contexts/GeminiContext';

const MemoryConfigModal = ({ isOpen, onClose, onConfirm, initialData = null }) => {
    const { geminiService, apiKey } = useGemini();
    const [mode, setMode] = useState('ai');
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Manual Mode State
    const [manualPairs, setManualPairs] = useState([{ id: 1, text1: '', text2: '', image1: null, image2: null }]);
    const [backgroundFile, setBackgroundFile] = useState(null);

    // Hydrate from initialData for Editing
    const hasInitializedRef = React.useRef(false);

    React.useEffect(() => {
        if (isOpen && !hasInitializedRef.current) {
            hasInitializedRef.current = true;
            
            if (initialData) {
                setTopic(initialData.topic || '');

                // If we explicitly saved manual pairs, use them directly
                if (initialData.manualPairs && initialData.manualPairs.length > 0) {
                    setManualPairs(initialData.manualPairs);
                    setMode(initialData.gameMode || 'manual');
                } else if (initialData.cards && initialData.cards.length > 0) {
                    // Try to reconstruct pairs (fallback for old saves)
                    const uniquePairs = [];
                    const pairsMap = {};

                    initialData.cards.forEach(card => {
                        if (!pairsMap[card.pairId]) pairsMap[card.pairId] = [];
                        pairsMap[card.pairId].push(card);
                    });

                    Object.values(pairsMap).forEach((pairCards, idx) => {
                        if (pairCards.length === 2) {
                            const card1 = pairCards[0];
                            const card2 = pairCards[1];
                            uniquePairs.push({
                                id: Date.now() + idx,
                                text1: card1.content || '',
                                text2: card2.content || '',
                                image1: card1.customImage || null,
                                image2: card2.customImage || null
                            });
                        }
                    });

                    if (uniquePairs.length > 0) {
                        setManualPairs(uniquePairs);
                        setMode(initialData.gameMode || 'manual'); // Default to manual edit if we have cards
                    }
                } else {
                    setMode(initialData.gameMode || 'ai'); // Default to AI if no cards (just topic reuse)
                }

                if (initialData.cardBackImage) {
                    setBackgroundFile(initialData.cardBackImage);
                }
            } else {
                // Reset if opening new
                setTopic('');
                setManualPairs([{ id: 1, text1: '', text2: '', image1: null, image2: null }]);
                setMode('ai');
                setBackgroundFile(null);
            }
        } else if (!isOpen) {
            hasInitializedRef.current = false;
        }
    }, [isOpen, initialData]);

    const handleAddPair = () => {
        setManualPairs([...manualPairs, { id: Date.now(), text1: '', text2: '', image1: null, image2: null }]);
    };

    const handleRemovePair = (id) => {
        setManualPairs(manualPairs.filter(p => p.id !== id));
    };

    const handlePairChange = (id, field, value) => {
        setManualPairs(manualPairs.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleImageUpload = (id, field, file) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handlePairChange(id, field, reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBackgroundUpload = (file) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBackgroundFile(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }

    const handleGenerateAI = async () => {
        if (!topic.trim()) {
            setError('Por favor, digite um tema.');
            return;
        }
        if (!apiKey) {
            setError('Configure sua API Key nas configurações (⚙️) antes de usar a IA.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { cards, error: serviceError } = await memoryService.generatePairs(topic, geminiService);
            if (serviceError) throw new Error(serviceError);

            onConfirm({
                type: 'ai',
                topic,
                cards,
                bgImage: null,
                cardBackImage: backgroundFile // Agora passamos a capa personalizada
            });
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmManual = () => {
        const validPairs = manualPairs.filter(p => (p.text1 || p.image1) && (p.text2 || p.image2));
        if (validPairs.length < 2) {
            setError('Crie pelo menos 2 pares para jogar.');
            return;
        }

        onConfirm({
            type: 'manual',
            topic: topic || 'Jogo Personalizado',
            pairs: validPairs,
            cardBackImage: backgroundFile
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Configurar Jogo da Memória"
            className="max-w-4xl" // Aumentei a largura
        >
            <div className="flex flex-col h-[650px] lg:h-auto lg:max-h-[85vh]">

                {/* Tabs & Top Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
                    <div className="flex gap-2 p-1 bg-brown-100/50 rounded-lg flex-1 w-full md:w-auto">
                        <button
                            onClick={() => setMode('ai')}
                            className={`flex-1 py-2 px-4 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all
                                ${mode === 'ai' ? 'bg-white shadow text-brown-800' : 'text-brown-500 hover:bg-brown-200/50'}`}
                        >
                            <Brain size={16} /> Automático (IA)
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 py-2 px-4 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all
                                ${mode === 'manual' ? 'bg-white shadow text-brown-800' : 'text-brown-500 hover:bg-brown-200/50'}`}
                        >
                            <ImageIcon size={16} /> Manual
                        </button>
                    </div>

                    {/* Capa Personalizada (Available for Both) */}
                    <div className="flex items-center gap-2 bg-brown-50 px-3 py-1.5 rounded-lg border border-brown-100">
                        <span className="text-xs font-bold text-brown-600 uppercase mr-2">Capa das Cartas:</span>
                        {backgroundFile ? (
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded border border-brown-200 overflow-hidden relative group">
                                    <img src={backgroundFile} className="w-full h-full object-cover" alt="Verso" />
                                </div>
                                <button onClick={() => setBackgroundFile(null)} className="text-xs text-red-500 hover:underline">Remover</button>
                            </div>
                        ) : (
                            <label className="cursor-pointer text-xs bg-white border border-brown-300 hover:bg-brown-50 px-3 py-1.5 rounded flex items-center gap-1 text-brown-600 transition-colors">
                                <Upload size={12} /> Escolher Imagem
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleBackgroundUpload(e.target.files[0])} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Content Area - Scrollable if needed */}
                <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
                    {mode === 'ai' ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-6 text-center animate-in fade-in slide-in-from-bottom-2">
                            <div className="w-20 h-20 bg-gradient-to-br from-brown-100 to-brown-50 rounded-full flex items-center justify-center shadow-inner mb-2 ring-4 ring-white">
                                <Wand2 size={32} className="text-brown-500" />
                            </div>
                            <div className="w-full max-w-lg space-y-4">
                                <div className="text-left bg-brown-50 p-4 rounded-xl border border-brown-100">
                                    <label className="block text-sm font-bold text-brown-800 mb-1">Tema do Jogo</label>
                                    <p className="text-xs text-brown-500 mb-3">A IA criará pares de perguntas e respostas sobre isso.</p>
                                    <Input
                                        placeholder="Ex: Curiosidades sobre o Espaço..."
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        className="text-lg h-12 bg-white"
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 justify-center animate-pulse">
                                        <AlertCircle size={16} /> {error}
                                    </div>
                                )}

                                <Button
                                    onClick={handleGenerateAI}
                                    disabled={isLoading}
                                    className="w-full h-14 text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                                >
                                    {isLoading ? 'Criando Jogo Mágico...' : 'Gerar Jogo com IA ✨'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 pb-4">
                            <div className="bg-brown-50 p-4 rounded-xl border border-brown-100 flex gap-4 items-center">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-brown-700 mb-1 uppercase">Título do Jogo</label>
                                    <Input
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="Ex: Minha Família"
                                        className="bg-white"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button size="sm" variant="ghost" onClick={handleAddPair} className="h-10 border border-dashed border-brown-300 bg-white">
                                        <Plus size={16} className="mr-1" /> Adicionar Par
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {manualPairs.map((pair, index) => (
                                    <div key={pair.id} className="bg-white p-3 rounded-lg border border-brown-200 shadow-sm relative group hover:border-brown-400 transition-colors">
                                        <button
                                            onClick={() => handleRemovePair(pair.id)}
                                            className="absolute -top-2 -right-2 bg-red-100 text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-200"
                                            title="Remover par"
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Carta 1 */}
                                            <div className="flex gap-2 items-center">
                                                <div className="w-6 h-6 rounded-full bg-brown-100 text-brown-600 flex items-center justify-center text-xs font-bold">1</div>
                                                <Input
                                                    placeholder="Texto da Carta 1..."
                                                    value={pair.text1}
                                                    onChange={(e) => handlePairChange(pair.id, 'text1', e.target.value)}
                                                    className="flex-1 text-sm h-9"
                                                />
                                                <label className={`w-9 h-9 flex-shrink-0 flex items-center justify-center border rounded cursor-pointer transition-colors ${pair.image1 ? 'border-green-500 bg-green-50' : 'border-brown-200 hover:bg-brown-50'}`}>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(pair.id, 'image1', e.target.files[0])} />
                                                    {pair.image1 ? <img src={pair.image1} className="w-full h-full object-cover rounded" /> : <ImageIcon size={14} className="text-brown-400" />}
                                                </label>
                                            </div>

                                            {/* Carta 2 */}
                                            <div className="flex gap-2 items-center">
                                                <div className="w-6 h-6 rounded-full bg-brown-100 text-brown-600 flex items-center justify-center text-xs font-bold">2</div>
                                                <Input
                                                    placeholder="Texto da Carta 2..."
                                                    value={pair.text2}
                                                    onChange={(e) => handlePairChange(pair.id, 'text2', e.target.value)}
                                                    className="flex-1 text-sm h-9"
                                                />
                                                <label className={`w-9 h-9 flex-shrink-0 flex items-center justify-center border rounded cursor-pointer transition-colors ${pair.image2 ? 'border-green-500 bg-green-50' : 'border-brown-200 hover:bg-brown-50'}`}>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(pair.id, 'image2', e.target.files[0])} />
                                                    {pair.image2 ? <img src={pair.image2} className="w-full h-full object-cover rounded" /> : <ImageIcon size={14} className="text-brown-400" />}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 justify-center">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <Button
                                onClick={handleConfirmManual}
                                className="w-full h-12 text-lg shadow-md mt-4 sticky bottom-0 z-10"
                            >
                                Confirmar Jogo Manual
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default MemoryConfigModal;
