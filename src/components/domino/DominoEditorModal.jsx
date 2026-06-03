import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Plus, Trash2, Image as ImageIcon, Type, Calculator, CheckCircle } from 'lucide-react';
import { useGemini } from '../../contexts/GeminiContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';



export const DominoEditorModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [pairs, setPairs] = useState([]);
    const [topicInput, setTopicInput] = useState('');
    const [lessonDetailsInput, setLessonDetailsInput] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isCircular, setIsCircular] = useState(false);

    const { geminiService, selectedModel } = useGemini();
    const requiredPairs = isCircular ? 28 : 27;

    useEffect(() => {
        if (isOpen) {
            setTopicInput(initialData?.topic || '');
            setLessonDetailsInput(initialData?.lessonDetails || '');
            
            if (initialData?.pairs && initialData.pairs.length > 0) {
                setPairs(initialData.pairs);
                setIsCircular(initialData.isCircular || false);
            } else {
                // Iniciar com 1 par vazio
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
        newPairs[index][side][field] = value;
        setPairs(newPairs);
    };

    const handleImageUpload = (index, side, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            handleChangeContent(index, side, 'content', e.target.result);
            handleChangeContent(index, side, 'type', 'image');
        };
        reader.readAsDataURL(file);
    };

    const handleGenerateAI = async () => {
        if (!topicInput) {
            alert("Por favor, digite um Tema primeiro para a IA saber o que gerar.");
            return;
        }
        if (!geminiService || !geminiService.apiKey) {
            alert("Por favor, configure sua chave de API nas configurações primeiro.");
            return;
        }

        setIsGeneratingAI(true);
        try {
            const prompt = `Você é um gerador de atividades educativas.
Gere EXATAMENTE ${requiredPairs} pares de pergunta e resposta para um jogo de Dominó Educativo sobre o tema: "${topicInput}".
${lessonDetailsInput ? `Utilize este contexto/texto base para formular as perguntas e respostas:\n${lessonDetailsInput}` : ''}
É OBRIGATÓRIO gerar exatamente ${requiredPairs} itens para que o jogo tenha perfeitamente 28 peças no total. 
Cada par deve ser independente e ter uma resposta curta e direta.
Retorne APENAS um array JSON com exatamente ${requiredPairs} objetos, sem formatação markdown extra, neste formato exato:
[
  { "question": "Quanto é 2+2?", "answer": "4" },
  { "question": "Qual é a capital do Brasil?", "answer": "Brasília" }
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
                list = list.slice(0, requiredPairs); // Força ser exatamente o necessário se gerar a mais
            }
            if (list.length < requiredPairs) {
                alert(`A IA gerou apenas ${list.length} pares. Precisamos de exatamente ${requiredPairs}. O jogo ficará com menos de 28 peças, tente adicionar os faltantes manualmente.`);
            }

            const mappedPairs = list.map((p, idx) => ({ 
                id: `ai-pair-${Date.now()}-${idx}`,
                question: { type: 'text', content: (p.question || p.pergunta || '').toString() },
                answer: { type: 'text', content: (p.answer || p.resposta || '').toString() }
            }));
            
            setPairs(mappedPairs);
        } catch (e) {
            console.error("Erro na IA:", e);
            alert("Erro ao gerar com IA: " + e.message);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleSave = () => {
        // Validation for empty content could go here
        if (pairs.length < requiredPairs) {
            alert(`Atenção: O jogo requer exatamente 28 peças (Pares gerados: ${pairs.length}). Faltam ${requiredPairs - pairs.length} pares para fechar o jogo perfeitamente.`);
            return;
        }

        onSave({ pairs, isCircular, topic: topicInput, lessonDetails: lessonDetailsInput });
    };

    const piecesCount = isCircular ? pairs.length : pairs.length + 1;
    const progressPercentage = Math.min(100, (pairs.length / requiredPairs) * 100);

    const footer = (
        <div className="flex justify-between items-center w-full">
            <div className="text-sm text-brown-500 flex flex-col gap-1">
                <span>Pares: <b>{pairs.length}</b> / {requiredPairs} necessários</span>
                <div className="w-48 h-2 bg-brown-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all ${pairs.length >= requiredPairs ? 'bg-green-500' : 'bg-amber-500'}`} 
                        style={{ width: progressPercentage + "%" }}
                    />
                </div>
            </div>
            <div className="flex gap-3 items-center">
                <span className="text-sm font-bold text-brown-700 bg-brown-100 px-3 py-1 rounded-full">
                    Total de Peças: {piecesCount} / 28
                </span>
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button 
                    onClick={handleSave} 
                    icon={Save} 
                    disabled={pairs.length < requiredPairs}
                    className={pairs.length >= requiredPairs ? 'bg-green-600 hover:bg-green-700' : 'opacity-50 cursor-not-allowed'}
                >
                    Salvar Dominó
                </Button>
            </div>
        </div>
    );

    const renderSideInput = (index, side) => {
        const item = pairs[index][side]; // side is 'question' or 'answer'
        
        return (
            <div className="flex flex-col gap-2 flex-1 border border-brown-200 p-2 rounded-lg bg-white">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-brown-500 uppercase">
                        {side === 'question' ? 'Pergunta' : 'Resposta'}
                    </span>
                    <div className="flex gap-1">
                        <button 
                            title="Texto Comum"
                            onClick={() => handleChangeContent(index, side, 'type', 'text')}
                            className={"p-1 rounded " + (item.type === 'text' ? 'bg-blue-100 text-blue-700' : 'text-brown-400 hover:bg-brown-50')}
                        >
                            <Type size={14} />
                        </button>
                        <button 
                            title="Fórmula Matemática"
                            onClick={() => handleChangeContent(index, side, 'type', 'math')}
                            className={"p-1 rounded " + (item.type === 'math' ? 'bg-amber-100 text-amber-700' : 'text-brown-400 hover:bg-brown-50')}
                        >
                            <Calculator size={14} />
                        </button>
                        <label className={"cursor-pointer p-1 rounded " + (item.type === 'image' ? 'bg-green-100 text-green-700' : 'text-brown-400 hover:bg-brown-50')} title="Inserir Imagem">
                            <ImageIcon size={14} />
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleImageUpload(index, side, e.target.files[0])}
                            />
                        </label>
                    </div>
                </div>

                {item.type === 'image' ? (
                    <div className="relative group flex-1 flex flex-col justify-center items-center bg-brown-50 border border-dashed border-brown-300 rounded-lg min-h-[60px] overflow-hidden">
                        {item.content ? (
                            <>
                                <img src={item.content} alt="Preview" className="h-16 object-contain" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="text-white text-xs cursor-pointer hover:underline">
                                        Trocar Imagem
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => handleImageUpload(index, side, e.target.files[0])}
                                        />
                                    </label>
                                </div>
                            </>
                        ) : (
                            <label className="text-xs text-brown-500 cursor-pointer text-center w-full h-full flex flex-col items-center justify-center">
                                <ImageIcon size={20} className="mb-1 opacity-50" />
                                Clique para enviar
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleImageUpload(index, side, e.target.files[0])}
                                />
                            </label>
                        )}
                    </div>
                ) : (
                    <textarea
                        className="w-full text-sm p-2 border border-brown-200 rounded-md outline-none focus:border-brown-500 resize-none flex-1 font-medium text-brown-800"
                        rows={2}
                        placeholder={item.type === 'math' ? "Ex: 2x + 4 = 10" : "Digite o texto..."}
                        value={item.content}
                        onChange={(e) => handleChangeContent(index, side, 'content', e.target.value)}
                    />
                )}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editor de Dominó Pedagógico"
            icon={CheckCircle}
            size="2xl"
            footer={footer}
        >
            <div className="space-y-4">
                <Card className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4 md:items-end">
                        <div className="flex-1 space-y-3">
                            <Input
                                label="Tema do Dominó"
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                placeholder="Ex: Equações de 1º Grau, Geometria Básica..."
                                className="font-bold"
                            />
                            <div>
                                <label className="block text-sm font-bold text-brown-700 mb-1">Contexto / Texto Base</label>
                                <textarea
                                    value={lessonDetailsInput}
                                    onChange={(e) => setLessonDetailsInput(e.target.value)}
                                    placeholder="Opcional. Cole regras específicas, contexto ou o texto base que a IA deve utilizar..."
                                    className="w-full text-sm p-2 border border-brown-200 rounded-md outline-none focus:border-brown-500 resize-none h-16 bg-white font-medium text-brown-800"
                                />
                            </div>
                        </div>
                        <Button 
                            onClick={handleGenerateAI} 
                            className="bg-purple-600 hover:bg-purple-700 text-white min-w-[200px] h-12 md:h-auto md:self-stretch md:mb-[2px]"
                            icon={Sparkles}
                            disabled={isGeneratingAI}
                        >
                            {isGeneratingAI ? 'Gerando...' : "Gerar 28 Peças (IA)"}
                        </Button>
                    </div>

                    <div className="flex items-center gap-3 mt-2 p-3 bg-brown-50 rounded-lg border border-brown-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isCircular}
                                onChange={(e) => setIsCircular(e.target.checked)}
                                className="w-5 h-5 text-brown-600 border-brown-300 rounded focus:ring-brown-500 accent-brown-600"
                            />
                            <span className="font-semibold text-brown-800 text-sm">Dominó Circular (Ciclo Fechado)</span>
                        </label>
                        <p className="text-xs text-brown-500 flex-1 leading-tight border-l border-brown-300 pl-3">
                            Se marcado, a última resposta se conectará com a primeira pergunta (ciclo). Se desmarcado, o dominó será linear (terá uma peça de Início e uma peça de Fim).
                        </p>
                    </div>
                </Card>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 pb-4">
                    {pairs.map((pair, idx) => (
                        <div key={pair.id} className="flex gap-2 items-center bg-brown-50/50 p-2 rounded-xl border border-brown-100">
                            <div className="font-mono text-brown-400 text-xs font-bold w-6 text-center">
                                {idx + 1}
                            </div>
                            
                            <div className="flex-1 flex gap-3">
                                {renderSideInput(idx, 'question')}
                                {renderSideInput(idx, 'answer')}
                            </div>

                            <Button
                                onClick={() => handleRemovePair(idx)}
                                variant="ghost"
                                className="p-2 text-brown-400 hover:text-red-500 hover:bg-red-50 h-auto self-stretch"
                                title="Remover par"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    ))}
                    
                    <Button
                        onClick={handleAddPair}
                        variant="outline"
                        className="w-full py-4 border-dashed border-2 border-brown-300 text-brown-600 hover:bg-brown-50 hover:border-brown-400"
                        icon={Plus}
                    >
                        Adicionar Par Manualmente
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
