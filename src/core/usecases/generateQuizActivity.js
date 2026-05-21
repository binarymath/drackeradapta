import { buildQuizPrompt } from '../prompts/quizPrompt';
import { safeJSONParse } from '../../utils/jsonUtils';

export async function generateQuizActivity({ topic, lessonDetails, difficulty, model, geminiService }) {
  const levelLabel = difficulty === 'hard' ? 'Ensino Médio (Avançado - linguagem formal e conceitual)' : difficulty === 'easy' ? 'Anos Iniciais (Fácil - linguagem lúdica, simples e infantil)' : 'Anos Finais (Médio - linguagem padrão escolar)';
  const prompt = buildQuizPrompt(topic, lessonDetails, levelLabel);

  // Tenta primeiro com responseMimeType JSON (força saída JSON pura, sem markdown nem texto extra)
  let text = null;
  try {
    text = await geminiService.generateText(prompt, {
      model,
      fallbackModel: null,
      maxOutputTokens: 4096,
      temperature: 0.7,
      responseMimeType: 'application/json',
    });
  } catch (e) {
    // Alguns modelos não suportam responseMimeType; faz fallback sem ele
    console.warn('[generateQuizActivity] responseMimeType falhou, tentando sem:', e.message);
    text = await geminiService.generateText(prompt, {
      model,
      fallbackModel: null,
      maxOutputTokens: 4096,
      temperature: 0.7,
    });
  }

  if (!text || !text.trim()) {
    throw new Error('A API retornou uma resposta vazia. Tente novamente em instantes.');
  }

  console.log('[generateQuizActivity] Resposta bruta (600 chars):', text.slice(0, 600));

  const parsedData = safeJSONParse(text);

  if (!parsedData) {
    console.error('[generateQuizActivity] JSON parse falhou. Resposta completa:', text);
    throw new Error('Não foi possível processar a resposta do gerador (JSON inválido). Tente novamente.');
  }

  // Valida estrutura mínima esperada
  if (!parsedData.questions || !Array.isArray(parsedData.questions) || parsedData.questions.length === 0) {
    console.error('[generateQuizActivity] Estrutura inválida:', parsedData);
    throw new Error('A resposta gerada não contém questões válidas. Tente novamente.');
  }

  return parsedData;
}
