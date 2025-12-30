import { buildQuizPrompt } from '../prompts/quizPrompt';
import { safeJSONParse } from '../../utils/jsonUtils';

export async function generateQuizActivity({ topic, lessonDetails, difficulty, model, geminiService }) {
  const difficultyLabel = difficulty === 'hard' ? 'Difícil' : difficulty === 'easy' ? 'Fácil/Infantil' : 'Médio';
  const prompt = buildQuizPrompt(topic, lessonDetails, difficultyLabel);

  let text = await geminiService.generateText(prompt, {
    model,
    fallbackModel: null,
    maxOutputTokens: 4000,
    temperature: 0.7
  });

  if (!text || !text.trim()) {
    throw new Error('A API retornou uma resposta vazia. Tente novamente em instantes.');
  }

  const parsedData = safeJSONParse(text);

  if (!parsedData) {
    throw new Error('Não foi possível processar a resposta do gerador (JSON inválido). Tente novamente.');
  }

  return parsedData;
}
