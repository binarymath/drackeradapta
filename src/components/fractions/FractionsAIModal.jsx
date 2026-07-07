import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select, TextArea } from '../ui/Input';
import { Brain, Wand2, Sparkles, AlertCircle, BookOpen, Layers, Target } from 'lucide-react';
import { buildFractionsPrompt } from '../../core/prompts/fractionsPrompt';
import { generateIntelligentFractionsActivity } from '../../core/usecases/generateFractionsActivity';
import { useGemini } from '../../contexts/GeminiContext';
import { safeJSONParse } from '../../utils/jsonUtils';

export const FractionsAIModal = ({ isOpen, onClose, onConfirm, initialCount = 6 }) => {
    const { geminiService, apiKey } = useGemini();
    const [gradeLevel, setGradeLevel] = useState('6º Ano - Ensino Fundamental');
    const [focusType, setFocusType] = useState('misto');
    const [themeContext, setThemeContext] = useState('culinaria');
    const [questionCount, setQuestionCount] = useState(initialCount || 6);
    const [customInstructions, setCustomInstructions] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateAI = async () => {
        setIsLoading(true);
        setError('');

        try {
            if (!apiKey) {
                // Fallback local se não houver chave API configurada
                setTimeout(() => {
                    const localData = generateIntelligentFractionsActivity(gradeLevel, focusType, themeContext, questionCount);
                    onConfirm(localData);
                    onClose();
                    setIsLoading(false);
                }, 800);
                return;
            }

            const prompt = buildFractionsPrompt(gradeLevel, focusType, themeContext, questionCount, customInstructions);
            const raw = await geminiService.generateText(prompt);
            const parsed = safeJSONParse(raw);

            let list = parsed?.exercises || parsed?.exercicios || parsed?.atividades || parsed?.questions || parsed?.questoes;
            if (!list && Array.isArray(parsed)) list = parsed;

            if (list && Array.isArray(list) && list.length > 0) {
                onConfirm({
                    activityTitle: parsed?.activityTitle || parsed?.title || parsed?.titulo || `Atividade Prática: Frações - ${themeContext.toUpperCase()} (${gradeLevel})`,
                    gradeLevel: parsed?.gradeLevel || parsed?.turma || parsed?.ano || gradeLevel,
                    exercises: list
                });
                onClose();
            } else {
                console.warn('Falha no parse ou retorno vazio da IA em nuvem. Usando motor local.');
                const localData = generateIntelligentFractionsActivity(gradeLevel, focusType, themeContext, questionCount);
                onConfirm(localData);
                onClose();
            }
        } catch (e) {
            console.warn('Erro ao chamar API Gemini. Ativando motor pedagógico local:', e);
            const localData = generateIntelligentFractionsActivity(gradeLevel, focusType, themeContext, questionCount);
            onConfirm(localData);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="✨ Gerador Pedagógico de Frações com IA"
            className="max-w-2xl w-full"
        >
            <div className="space-y-6 p-2">
                <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                        <Wand2 className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h4 className="text-base font-black text-blue-950">Inteligência Artificial Drácker</h4>
                        <p className="text-xs text-slate-600 mt-0.5">Crie atividades personalizadas com problemas reais do dia a dia, adaptadas perfeitamente ao nível da sua turma.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Nível Escolar (Série/Ano)
                        </label>
                        <Select
                            value={gradeLevel}
                            onChange={(e) => setGradeLevel(e.target.value)}
                            className="w-full bg-white font-semibold"
                        >
                            <option value="4º Ano - Ensino Fundamental">4º Ano - Fundamental I</option>
                            <option value="5º Ano - Ensino Fundamental">5º Ano - Fundamental I</option>
                            <option value="6º Ano - Ensino Fundamental">6º Ano - Fundamental II</option>
                            <option value="7º Ano - Ensino Fundamental">7º Ano - Fundamental II</option>
                            <option value="8º e 9º Ano - Ensino Fundamental">8º e 9º Ano - Fundamental II</option>
                            <option value="Ensino Médio / Revisão">Ensino Médio / Revisão</option>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-blue-600" /> Foco da Atividade
                        </label>
                        <Select
                            value={focusType}
                            onChange={(e) => setFocusType(e.target.value)}
                            className="w-full bg-white font-semibold"
                        >
                            <option value="misto">Misto Completo (Visual + Operações + Problemas)</option>
                            <option value="visual">Apenas Representação Visual (Próprias, Impróprias e Mistas)</option>
                            <option value="operacoes">Apenas Operações Aritméticas (+, -, ×, ÷ com MMC)</option>
                            <option value="problemas">Apenas Problemas Contextualizados em Texto</option>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-600" /> Temática do Dia a Dia
                        </label>
                        <Select
                            value={themeContext}
                            onChange={(e) => setThemeContext(e.target.value)}
                            className="w-full bg-white font-semibold"
                        >
                            <option value="culinaria">🍕 Culinária & Receitas (Pizzas, Bolos, Chocolates)</option>
                            <option value="esportes">⚽ Esportes & Competições (Distâncias, Tempos, Pistas)</option>
                            <option value="cotidiano">🏡 Dia a Dia & Finanças (Mesada, Compras, Água)</option>
                            <option value="livre">🌟 Misto / Variado</option>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Quantidade de Questões
                        </label>
                        <Select
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Number(e.target.value))}
                            className="w-full bg-white font-semibold"
                        >
                            <option value={4}>4 questões</option>
                            <option value={6}>6 questões</option>
                            <option value={8}>8 questões</option>
                            <option value={10}>10 questões</option>
                        </Select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Instruções Especiais para a IA (Opcional)
                    </label>
                    <TextArea
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="Ex: Usar apenas frações com denominadores pares; evitar números decimais; incluir pelo menos uma questão sobre divisão de pizza..."
                        rows={3}
                        className="w-full bg-white text-sm"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 justify-center">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGenerateAI}
                        disabled={isLoading}
                        icon={Wand2}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black px-6 shadow-md"
                    >
                        {isLoading ? 'Gerando Atividade...' : 'Gerar com IA ✨'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
