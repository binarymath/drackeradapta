import { buildQuizPrompt } from '../prompts/quizPrompt';
import { safeJSONParse } from '../../utils/jsonUtils';

// Tokens por questão: statement + correct_answer + 4 distractors + difficulty + JSON overhead
const TOKENS_PER_QUESTION = 300;
const BASE_TOKENS = 1500;

// Mapeamento de variantes (português, maiúsculas, variações) → valor canônico
const DIFFICULTY_MAP = {
  easy: 'easy', facil: 'easy', fácil: 'easy', faceis: 'easy', fáceis: 'easy',
  simples: 'easy', basico: 'easy', básico: 'easy', basica: 'easy', básica: 'easy',
  medium: 'medium', medio: 'medium', médio: 'medium', media: 'medium', média: 'medium',
  intermediario: 'medium', intermediário: 'medium', moderado: 'medium',
  hard: 'hard', dificil: 'hard', difícil: 'hard', dificeis: 'hard', difíceis: 'hard',
  avancado: 'hard', avançado: 'hard', complexo: 'hard', advanced: 'hard',
};

function normalizeDifficulty(raw) {
  if (!raw) return 'medium';
  const key = String(raw).toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos para lookup
  return DIFFICULTY_MAP[key] || DIFFICULTY_MAP[raw?.toLowerCase()?.trim()] || 'medium';
}

export async function generateQuizActivity({
  topic, lessonDetails, difficulty, model, geminiService,
  questionCount = 10, difficultyDist = { easy: 40, medium: 40, hard: 20 }
}) {
  const levelLabel =
    difficulty === 'hard' ? 'High School Advanced - formal and conceptual language' :
    difficulty === 'easy' ? 'Early Elementary - playful, simple and child-friendly language' :
                            'Middle School - standard educational language';

  const prompt = buildQuizPrompt(topic, lessonDetails, levelLabel, questionCount, difficultyDist);
  const maxTokens = BASE_TOKENS + questionCount * TOKENS_PER_QUESTION;

  console.log('[generateQuizActivity] Gerando', questionCount, 'questoes | maxTokens:', maxTokens);

  let text = null;

  // ── Tentativa 1: com responseMimeType JSON (força JSON puro, sem markdown)
  try {
    text = await geminiService.generateText(prompt, {
      model,
      fallbackModel: null,
      maxOutputTokens: maxTokens,
      temperature: 0.3,
      responseMimeType: 'application/json',
    });
  } catch (e) {
    console.warn('[generateQuizActivity] responseMimeType falhou:', e.message);
  }

  // ── Tentativa 2: sem responseMimeType
  if (!text || !text.trim()) {
    text = await geminiService.generateText(prompt, {
      model,
      fallbackModel: null,
      maxOutputTokens: maxTokens,
      temperature: 0.3,
    });
  }

  if (!text || !text.trim()) {
    throw new Error('A API retornou uma resposta vazia. Tente novamente em instantes.');
  }

  console.log('[generateQuizActivity] Resposta bruta (primeiros 1000 chars):', text.slice(0, 1000));

  const parsedData = safeJSONParse(text);

  if (!parsedData) {
    console.error('[generateQuizActivity] JSON parse falhou. Resposta completa:', text);
    throw new Error('Nao foi possivel processar a resposta (JSON invalido). Tente reduzir a quantidade de perguntas.');
  }

  if (!parsedData.questions || !Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
    console.error('[generateQuizActivity] Estrutura invalida:', parsedData);
    throw new Error('A resposta gerada nao contem questoes validas. Tente novamente.');
  }

  // ── Normaliza e valida cada questão ──────────────────────────────────────
  parsedData.questions = parsedData.questions.map((q, i) => {
    const distractors = Array.isArray(q.distractors)
      ? q.distractors.filter(d => d && String(d).trim())
      : [];

    // Completa distractors faltando com placeholders
    while (distractors.length < 4) {
      distractors.push(`Opcao ${String.fromCharCode(66 + distractors.length)}`);
    }

    const diff = normalizeDifficulty(q.difficulty);
    console.log(`[generateQuizActivity] Q${i+1} difficulty raw="${q.difficulty}" → normalized="${diff}"`);

    return {
      statement:      q.statement      || `Questao ${i + 1}`,
      correct_answer: q.correct_answer || '',
      distractors:    distractors.slice(0, 4),
      difficulty:     diff,
    };
  });

  // Log de distribuição final
  const dist = { easy: 0, medium: 0, hard: 0 };
  parsedData.questions.forEach(q => { dist[q.difficulty] = (dist[q.difficulty] || 0) + 1; });
  console.log('[generateQuizActivity] Distribuicao final:', dist, '| Total:', parsedData.questions.length);

  return parsedData;
}
