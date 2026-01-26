import { buildMusicPrompt } from '../prompts/musicPrompt';
import { buildQuestionsPrompt } from '../prompts/questionsPrompt';
import { parseQuestions } from '../parsers/questionsParser';

const MUSIC_LABELS = ['MUSIC', 'MUSICA', 'MÚSICA', 'LETRA'];
const STYLE_LABELS = ['STYLE', 'ESTILO', 'RITMO'];
const QUESTIONS_LABELS = ['QUESTIONS', 'QUESTOES', 'QUESTÕES', 'PERGUNTAS'];

function padWithFallbackQuestions(baseQuestions, lyrics, topic, target = 10) {
  const lines = (lyrics || '').split(/\n+/).map(l => l.trim()).filter(Boolean);
  const safeTopic = topic || 'a música';
  let cursor = 0;

  while (baseQuestions.length < target) {
    const line = lines[cursor % Math.max(lines.length, 1)] || safeTopic;
    const qText = `O que acontece neste trecho: "${line}"?`;
    const correct = line;
    const distractors = [
      `Outra parte de ${safeTopic}`,
      `Um detalhe que não aparece no trecho`,
      `Uma ideia diferente da letra`
    ];

    baseQuestions.push({
      text: qText,
      correctAnswer: correct,
      distractors,
      options: [correct, ...distractors],
      ordered_options: [correct, ...distractors]
    });

    cursor += 1;
    if (cursor > 30) break; // safety
  }

  return baseQuestions.slice(0, target);
}

function sliceSection(raw, labels, nextLabels = []) {
  if (!raw) return '';
  const labelRegex = new RegExp(`(^|\n)\s*(?:\\d+\s*[\\.|\)]\s*)?(?:${labels.join('|')})\\b`, 'i');
  const match = raw.match(labelRegex);
  if (!match) return '';
  const start = match.index + match[0].length;
  const after = raw.slice(start);
  let end = after.length;
  if (nextLabels.length) {
    const nextRegex = new RegExp(`(^|\n)\s*(?:\\d+\s*[\\.|\)]\s*)?(?:${nextLabels.join('|')})\\b`, 'i');
    const nextMatch = after.match(nextRegex);
    if (nextMatch && nextMatch.index >= 0) {
      end = nextMatch.index;
    }
  }
  return after.slice(0, end).trim();
}

export async function generateMusicActivity({ topic, lessonDetails, model, geminiService }) {
  // Step 1: Generate Lyrics ONLY
  const prompt = buildMusicPrompt(topic, lessonDetails);
  let lyrics = await geminiService.generateText(prompt, {
    model,
    fallbackModel: null,
    maxOutputTokens: 8000,
    temperature: 0.7
  });

  if (!lyrics || !lyrics.trim()) {
    throw new Error('A API retornou uma resposta vazia para a música.');
  }

  // Clean up any potential markdown or labels that slipped in
  lyrics = lyrics.replace(/MUSIC\s*/i, '').replace(/--- FIM DA MÚSICA ---/g, '').trim();

  // Step 2: Generate Questions based on the lyrics
  // Retry loop to ensure we get at least 12 questions
  let questions = [];
  let attempts = 0;
  const MAX_ATTEMPTS = 4; // Increased attempts for larger batch checking

  while (questions.length < 12 && attempts < MAX_ATTEMPTS) {
    attempts++;
    console.log(`Generating questions attempt ${attempts}/${MAX_ATTEMPTS}`);

    const qPrompt = buildQuestionsPrompt(lyrics);
    const qText = await geminiService.generateText(qPrompt, {
      model,
      fallbackModel: null,
      maxOutputTokens: 3000, // Increased tokens for 12 qs
      temperature: 0.4 + (attempts * 0.1)
    });

    const parsed = parseQuestions(qText);

    // Merge unique
    const newQuestions = parsed.filter(nq => !questions.find(eq => eq.text === nq.text));
    questions = [...questions, ...newQuestions];

    if (questions.length >= 12) break;
  }

  // Deduplicate
  const mergedUnique = questions.reduce((acc, q) => {
    if (!acc.find(item => item.text === q.text)) acc.push(q);
    return acc;
  }, []);

  // Return only parsed questions
  questions = mergedUnique.slice(0, 12); // Cap at 12 if we got more

  return { lyrics, style: '', questions, metadata: { apiRequests: attempts } };
}
