import { buildQuizPrompt } from '../prompts/quizPrompt';

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

  // Extrai JSON pelo primeiro { até o último }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('JSON structure not found in response');
  }

  const cleanJson = text.substring(firstBrace, lastBrace + 1);
  const parsedData = JSON.parse(cleanJson);
  return parsedData;
}
