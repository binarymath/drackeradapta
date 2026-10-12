import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Sparkles, Link2, Palette, ArrowRight } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { toast } from './ui/Toast';
import { GlobalAIGeneratorPanel } from './common/GlobalAIGeneratorPanel';

const AVAILABLE_COLORS = [
    'bg-blue-100 border-blue-400 text-blue-900',
    'bg-emerald-100 border-emerald-400 text-emerald-900',
    'bg-amber-100 border-amber-400 text-amber-900',
    'bg-purple-100 border-purple-400 text-purple-900',
    'bg-rose-100 border-rose-400 text-rose-900',
    'bg-cyan-100 border-cyan-400 text-cyan-900',
    'bg-orange-100 border-orange-400 text-orange-900',
    'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-900'
];

export function ConnectDotsEditorModal({ 
    isOpen, 
    onClose, 
    initialData, 
    onConfirm,
    topic = '',
    lessonDetails = '',
    geminiService
}) {
    const [pairs, setPairs] = useState([]);
    const [topicInput, setTopicInput] = useState('');
    const [detailsInput, setDetailsInput] = useState('');
    const [gradeLevel, setGradeLevel] = useState('Ensino Fundamental I - 1º ao 3º Ano (6 a 8 anos)');
    const [itemCount, setItemCount] = useState(6);
    const [difficultyDist, setDifficultyDist] = useState({ easy: 40, medium: 40, hard: 20 });
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (Array.isArray(initialData)) {
                setPairs(initialData);
            } else if (initialData && Array.isArray(initialData.pairs)) {
                setPairs(initialData.pairs);
                if (initialData.topic) setTopicInput(initialData.topic);
                if (initialData.lessonDetails) setDetailsInput(initialData.lessonDetails);
            } else if (!pairs || pairs.length === 0) {
                // Pares padrão de exemplo
                setPairs([
                    { id: 1, text: "Sol", emoji: "Dia ☀️", color: AVAILABLE_COLORS[0] },
                    { id: 2, text: "Lua", emoji: "Noite 🌙", color: AVAILABLE_COLORS[1] },
                    { id: 3, text: "Chuva", emoji: "Nuvem 🌧️", color: AVAILABLE_COLORS[2] },
                    { id: 4, text: "Flor", emoji: "Jardim 🌸", color: AVAILABLE_COLORS[3] }
                ]);
            }

            if (topic && !topicInput) setTopicInput(topic);
            if (lessonDetails && !detailsInput) setDetailsInput(lessonDetails);
        }
    }, [isOpen, initialData, topic, lessonDetails]);

    const handleUpdate = (id, field, value) => {
        setPairs(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const handleDelete = (id) => {
        if (pairs.length <= 2) {
            toast("É necessário ter pelo menos 2 pares para ligar os pontos.");
            return;
        }
        setPairs(prev => prev.filter(p => p.id !== id));
    };

    const handleAdd = () => {
        const nextIdx = pairs.length;
        const newId = Date.now() + Math.floor(Math.random() * 1000);
        setPairs(prev => [...prev, {
            id: newId,
            text: `Conceito ${nextIdx + 1}`,
            emoji: `Correspondência ${nextIdx + 1} ✨`,
            color: AVAILABLE_COLORS[nextIdx % AVAILABLE_COLORS.length]
        }]);
    };

    const cycleColor = (id) => {
        setPairs(prev => prev.map(p => {
            if (p.id !== id) return p;
            const currentIdx = AVAILABLE_COLORS.indexOf(p.color);
            const nextIdx = (currentIdx + 1) % AVAILABLE_COLORS.length;
            return { ...p, color: AVAILABLE_COLORS[nextIdx] };
        }));
    };

    // Geração Inteligente com Drácker IA
    const handleGenerateAI = async () => {
        if (!topicInput || !topicInput.trim()) {
            toast("Por favor, digite o tema central de ligar os pontos primeiro.");
            return;
        }

        if (!geminiService || !geminiService.apiKey) {
            toast("Por favor, configure sua chave de API nas configurações primeiro.");
            return;
        }

        setIsGeneratingAI(true);
        try {
            const countToGen = Number(itemCount) || 6;
            const easyP = Math.round((countToGen * (difficultyDist?.easy || 40)) / 100);
            const medP = Math.round((countToGen * (difficultyDist?.medium || 40)) / 100);
            const hardP = Math.max(0, countToGen - easyP - medP);

            const prompt = `Você é um gerador de excelência de atividades pedagógicas de Ligar os Pontos (Associação de Colunas/Conceitos).
Gere EXATAMENTE ${countToGen} pares educativos e instigantes sobre o tema: "${topicInput.trim()}".
Nível/Ano Escolar dos alunos: ${gradeLevel}.
${detailsInput?.trim() ? `Contexto pedagógico & delimitação do tema:\n${detailsInput.trim()}` : ''}

Distribuição de dificuldade pedagógica:
- Fácil (~${easyP} pares): associações diretas, conceitos básicos e intuitivos.
- Médio (~${medP} pares): conteúdos curriculares do ano escolar, definições e causas/efeitos.
- Difícil (~${hardP} pares): relações conceituais mais elaboradas, problemas para correlacionar ou termos específicos.

REGRAS OBRIGATÓRIAS:
1. "text" é a Coluna da Esquerda (enunciado curto, conceito, pergunta, operação ou elemento a ser relacionado). Máximo 45 caracteres.
2. "emoji" é a Coluna da Direita (resposta, correspondência, resultado ou par correto). Máximo 45 caracteres. Pode incluir um emoji temático e visual no final.
3. Retorne APENAS um JSON válido no formato exato:
[
  {"text": "Brasil", "emoji": "Brasília 🏛️"},
  {"text": "França", "emoji": "Paris 🗼"}
]`;

            const rawText = await geminiService.generateText(prompt, {
                model: 'gemini-2.5-flash',
                maxOutputTokens: 3000,
                temperature: 0.6,
                responseMimeType: "application/json"
            });

            const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            const list = Array.isArray(parsed) ? parsed : (parsed.pairs || parsed.data || []);

            if (!list || list.length === 0) {
                throw new Error("A IA não retornou pares válidos.");
            }

            const mapped = list.map((p, idx) => ({
                id: Date.now() + idx,
                text: (p.text || p.pergunta || p.left || '').toString().trim(),
                emoji: (p.emoji || p.resposta || p.right || '').toString().trim(),
                color: AVAILABLE_COLORS[idx % AVAILABLE_COLORS.length]
            })).filter(p => p.text && p.emoji);

            if (mapped.length < 2) {
                throw new Error("Pares insuficientes gerados.");
            }

            setPairs(mapped);
            toast(`✨ ${mapped.length} pares gerados com sucesso pelo Drácker!`);
        } catch (err) {
            console.error("Erro na geração de pares com IA:", err);
            toast("Erro ao gerar pares com IA: " + (err.message || 'Tente novamente'));
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleSave = () => {
        if (pairs.length < 2) {
            toast("Adicione pelo menos 2 pares para a atividade.");
            return;
        }

        if (pairs.some(p => !p.text.trim() || !p.emoji.trim())) {
            toast("Preencha todos os campos dos pares antes de salvar.");
            return;
        }

        onConfirm({
            pairs,
            topic: topicInput.trim() || 'Ligar os Pontos',
            lessonDetails: detailsInput.trim()
        });
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="🔗 Estúdio de Ligar os Pontos"
            size="xl"
        >
            <div className="space-y-6 p-1 max-h-[78vh] overflow-y-auto pr-2">
                {/* Painel Global de IA Drácker */}
                <GlobalAIGeneratorPanel
                    itemTypeLabel="pares de ligação"
                    topic={topicInput}
                    onTopicChange={setTopicInput}
                    context={detailsInput}
                    onContextChange={setDetailsInput}
                    gradeLevel={gradeLevel}
                    onGradeLevelChange={setGradeLevel}
                    itemCount={itemCount}
                    onItemCountChange={setItemCount}
                    itemCountOptions={[4, 6, 8, 10]}
                    difficultyDist={difficultyDist}
                    onDifficultyDistChange={setDifficultyDist}
                    onGenerate={handleGenerateAI}
                    isGenerating={isGeneratingAI}
                    defaultExpanded={true}
                />

                {/* Lista de Pares Configurados */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                                Pares de Associação ({pairs.length})
                            </h3>
                        </div>
                        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 font-bold border-slate-300">
                            Mínimo 2 pares
                        </Badge>
                    </div>

                    <div className="space-y-2.5">
                        {pairs.map((pair, index) => (
                            <Card 
                                key={pair.id} 
                                className="p-3.5 flex flex-col md:flex-row gap-3 items-center bg-white border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-sm transition-all rounded-2xl"
                            >
                                <span className="font-black text-sm text-slate-400 w-6 text-center select-none">
                                    {index + 1}.
                                </span>

                                <div className="flex-1 w-full">
                                    <label className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                                        <span>Coluna A (Esquerda)</span>
                                    </label>
                                    <Input
                                        value={pair.text}
                                        onChange={(e) => handleUpdate(pair.id, 'text', e.target.value)}
                                        placeholder="Ex: Brasil, 7 x 8, Água..."
                                        maxLength={45}
                                        className="h-9 text-xs font-semibold"
                                    />
                                </div>

                                <div className="hidden md:flex text-slate-300">
                                    <ArrowRight className="w-4 h-4" />
                                </div>

                                <div className="flex-1 w-full">
                                    <label className="text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                                        <span>Coluna B (Direita / Resposta)</span>
                                    </label>
                                    <Input
                                        value={pair.emoji}
                                        onChange={(e) => handleUpdate(pair.id, 'emoji', e.target.value)}
                                        placeholder="Ex: Brasília 🏛️, 56, H2O..."
                                        maxLength={45}
                                        className="h-9 text-xs font-semibold"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2 md:pt-4">
                                    <button
                                        type="button"
                                        onClick={() => cycleColor(pair.id)}
                                        className={`w-8 h-8 rounded-full border-2 cursor-pointer shadow-xs hover:scale-110 transition-transform ${pair.color.split(' ')[0]} ${pair.color.split(' ')[1]}`}
                                        title="Clique para alternar a cor da linha"
                                    />

                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDelete(pair.id)}
                                        className="h-8 w-8 rounded-xl"
                                        title="Excluir par"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Button 
                        onClick={handleAdd} 
                        variant="outline" 
                        className="w-full dashed border-2 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 py-3 rounded-2xl font-bold text-slate-700 hover:text-indigo-700 transition-all"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Mais um Par
                    </Button>
                </div>
            </div>

            <div className="flex justify-between items-center gap-2 mt-6 pt-4 border-t border-slate-100">
                <Button variant="ghost" onClick={onClose} className="font-bold text-slate-500">
                    Cancelar
                </Button>
                <Button 
                    onClick={handleSave} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/20 px-6"
                >
                    <Save className="w-4 h-4 mr-2" /> Salvar Atividade
                </Button>
            </div>
        </Modal>
    );
}

export default ConnectDotsEditorModal;
