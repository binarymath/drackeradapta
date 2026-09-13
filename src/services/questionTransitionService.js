/**
 * questionTransitionService.js
 * Utilitários e serviços para converter e transicionar questões
 * de forma bidirecional entre Quiz e Roleta Pedagógica.
 */

export const normalizeDifficultyToQuiz = (diff) => {
    if (!diff) return 'medium';
    const lower = String(diff).toLowerCase().trim();
    if (lower.includes('fácil') || lower.includes('facil') || lower === 'easy') return 'easy';
    if (lower.includes('difícil') || lower.includes('dificil') || lower === 'hard') return 'hard';
    return 'medium';
};

export const normalizeDifficultyToRoulette = (diff) => {
    if (!diff) return 'Média';
    const lower = String(diff).toLowerCase().trim();
    if (lower === 'easy' || lower.includes('fácil') || lower.includes('facil')) return 'Fácil';
    if (lower === 'hard' || lower.includes('difícil') || lower.includes('dificil')) return 'Difícil';
    return 'Média';
};

/**
 * Converte questões de um Quiz para o formato da Roleta
 */
export const convertQuizQuestionsToRoulette = (quizQuestions = [], options = {}) => {
    const { includeOptions = true } = options;

    return quizQuestions.map((q, idx) => {
        let allOptions = [];
        if (q.ordered_options && Array.isArray(q.ordered_options) && q.ordered_options.length > 0) {
            allOptions = q.ordered_options;
        } else if (q.correct_answer || (q.distractors && q.distractors.length > 0)) {
            const rawOpts = [q.correct_answer, ...(q.distractors || [])].filter(Boolean);
            allOptions = rawOpts.sort(() => Math.random() - 0.5);
        }

        return {
            id: `roulette-q-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
            question: (q.statement || '').replace(/^\d+[.)]\s*/, '').trim(),
            answer: (q.correct_answer || '').trim(),
            difficulty: normalizeDifficultyToRoulette(q.difficulty),
            imageUrl: q.image_url || '',
            imageBgColor: q.image_bg_color || 'transparent',
            options: includeOptions && allOptions.length > 0 ? allOptions : undefined
        };
    });
};

/**
 * Converte questões da Roleta para o formato do Quiz
 */
export const convertRouletteQuestionsToQuiz = (rouletteQuestions = [], options = {}) => {
    const { mode = 'text_only' } = options; // 'text_only' | 'multiple_choice'

    return rouletteQuestions.map((q, idx) => {
        const statement = (q.question || '').replace(/^\d+[.)]\s*/, '').trim();
        const correctAnswer = (q.answer || '').trim();
        const difficulty = normalizeDifficultyToQuiz(q.difficulty);
        const imageUrl = q.imageUrl || '';

        // Se a questão já veio com opções (ex: originada de um quiz anterior)
        if (q.options && Array.isArray(q.options) && q.options.length > 1) {
            const distractors = q.options.filter(opt => opt !== correctAnswer);
            return {
                id: `quiz-q-${Date.now()}-${idx}`,
                statement,
                correct_answer: correctAnswer || q.options[0],
                distractors,
                ordered_options: q.options,
                difficulty,
                image_url: imageUrl || undefined
            };
        }

        if (mode === 'text_only') {
            return {
                id: `quiz-q-${Date.now()}-${idx}`,
                statement,
                correct_answer: correctAnswer,
                distractors: [],
                ordered_options: [],
                difficulty,
                image_url: imageUrl || undefined
            };
        }

        // Fallback caso seja multiple_choice sem opções prévias e sem IA
        return {
            id: `quiz-q-${Date.now()}-${idx}`,
            statement,
            correct_answer: correctAnswer || 'Opção Correta',
            distractors: ['Opção B', 'Opção C', 'Opção D'],
            ordered_options: [correctAnswer || 'Opção Correta', 'Opção B', 'Opção C', 'Opção D'].sort(() => Math.random() - 0.5),
            difficulty,
            image_url: imageUrl || undefined
        };
    });
};

/**
 * Gera distratores pedagógicos inteligentes com Gemini para uma lista de questões dissertativas
 */
export const generateDistractorsWithAI = async (questions = [], geminiService, model = null) => {
    if (!questions || questions.length === 0) return [];
    if (!geminiService || !geminiService.generateText) {
        throw new Error('Serviço de IA não disponível.');
    }

    // Monta payload simplificado para enviar ao Gemini
    const itemsToProcess = questions.map((q, idx) => ({
        index: idx,
        question: (q.question || q.statement || '').trim(),
        answer: (q.answer || q.correct_answer || '').trim(),
        difficulty: q.difficulty || 'Média'
    }));

    const prompt = `Você é um professor e especialista em elaboração de itens de avaliação escolar.
Receba esta lista de ${itemsToProcess.length} perguntas com suas respectivas respostas corretas/gabaritos.
Para CADA uma das perguntas, elabore EXATAMENTE 3 distratores (alternativas incorretas).

CRITÉRIOS DOS DISTRATORES:
1. Devem ser plausíveis, convincentes e relacionados ao mesmo tema/campo semântico da pergunta.
2. Não use "Todas as anteriores", "Nenhuma das anteriores", "Opção A", etc.
3. Devem ter tamanho e complexidade semelhantes à resposta correta.
4. Mantenha o mesmo nível de linguagem da pergunta.

Perguntas a processar:
${JSON.stringify(itemsToProcess, null, 2)}

RETORNE APENAS um JSON válido no formato de array de objetos com o mesmo tamanho da lista de entrada:
[
  {
    "index": 0,
    "distractors": ["Alternativa Incorreta 1", "Alternativa Incorreta 2", "Alternativa Incorreta 3"]
  }
]
IMPORTANTE: Retorne APENAS o JSON puro sem markdown ou blocos adicionais.`;

    try {
        let text = await geminiService.generateText(prompt, {
            model,
            responseMimeType: "application/json",
            temperature: 0.5,
            maxOutputTokens: 8192
        });

        // Limpeza de markdown se presente
        if (text) {
            text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        }

        const parsed = JSON.parse(text);
        const distractorsMap = new Map();
        if (Array.isArray(parsed)) {
            parsed.forEach(item => {
                if (item && item.index !== undefined && Array.isArray(item.distractors)) {
                    distractorsMap.set(item.index, item.distractors.slice(0, 3));
                }
            });
        }

        // Reconstrói as questões com os distratores gerados
        return questions.map((q, idx) => {
            const statement = (q.question || q.statement || '').replace(/^\d+[.)]\s*/, '').trim();
            const correctAnswer = (q.answer || q.correct_answer || '').trim();
            const rawDistractors = distractorsMap.get(idx) || ['Alternativa B', 'Alternativa C', 'Alternativa D'];
            
            const options = [correctAnswer, ...rawDistractors].sort(() => Math.random() - 0.5);

            return {
                id: `quiz-q-${Date.now()}-${idx}`,
                statement,
                correct_answer: correctAnswer,
                distractors: rawDistractors,
                ordered_options: options,
                difficulty: normalizeDifficultyToQuiz(q.difficulty),
                image_url: q.imageUrl || q.image_url || undefined
            };
        });
    } catch (err) {
        console.error('[generateDistractorsWithAI] Erro ao gerar distratores:', err);
        // Fallback para conversão sem IA
        return convertRouletteQuestionsToQuiz(questions, { mode: 'multiple_choice' });
    }
};
