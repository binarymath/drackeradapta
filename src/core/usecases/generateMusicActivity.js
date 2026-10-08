import { buildMusicPrompt } from '../prompts/musicPrompt';
import { buildQuestionsPrompt } from '../prompts/questionsPrompt';
import { parseQuestions } from '../parsers/questionsParser';


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
