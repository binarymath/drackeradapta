import { buildDrackerPrompt } from '../prompts/drackerPrompt';

const SIMPLE_MATERIAL_FALLBACKS = [
  'Materiais: papel sulfite, lápis de cor e cola.',
  'Materiais: cartolina, canetinhas, tesoura sem ponta.',
  'Materiais: barbante, fita adesiva, tampinhas limpas.',
  'Materiais: revistas velhas, cola bastão, cartolina.',
  'Materiais: sucata limpa, fita crepe, lápis grafite.',
];

function normalizeActivities(rawActivities = [], topic) {
  const base = rawActivities
    .map((act) => {
      if (!act) return '';
      if (typeof act === 'string') return act.trim();

      const label = act.title || act.nome || act.activity || act.headline || '';
      const description = act.description || act.desc || '';
      const materials = act.materials || act.recursos || act.material || '';
      const steps = act.steps || act.passos || act.instrucoes || '';

      const parts = [];
      if (label) parts.push(`**${label}**`);
      if (materials) {
        const list = Array.isArray(materials) ? materials.join(', ') : materials;
        parts.push(`Materiais: ${list}`);
      }
      if (description) parts.push(description);
      if (steps) {
        const stepsText = Array.isArray(steps) ? steps.join(' ') : steps;
        parts.push(`Como fazer: ${stepsText}`);
      }

      return parts.join(' — ');
    })
    .filter(Boolean);

  const filled = [...base];
  while (filled.length < 5) {
    const template = SIMPLE_MATERIAL_FALLBACKS[filled.length % SIMPLE_MATERIAL_FALLBACKS.length];
    const label = `**Explorando ${topic || 'o tema'} (${filled.length + 1})**`;
    filled.push(`${label} — ${template}`);
  }

  return filled.slice(0, 5);
}

function ensureDrackerStory(rawStory, topic) {
  const baseStory = (rawStory || '').trim();
  if (!baseStory) {
    return `O dragãozinho Drácker, sempre curioso, perguntou à turma sobre ${topic || 'o tema da aula'}. Eles caminharam juntos pela sala, observando objetos e criando hipóteses. Drácker lembrou que aprender é brincar e explorar com cuidado.`;
  }

  if (baseStory.toLowerCase().includes('drácker')) {
    return baseStory;
  }

  return `Drácker, o dragãozinho camarada, entrou animado na sala para falar sobre ${topic || 'o tema de hoje'}. ${baseStory}`;
}

export async function generateDrackerActivity({ topic, lessonDetails, difficulty, model, geminiService }) {
  const difficultyLabel =
    difficulty === 'hard'
      ? 'avançado, mas ainda acolhedor'
      : difficulty === 'easy'
        ? 'infantil e simples'
        : 'claro e explicativo';

  const prompt = buildDrackerPrompt(topic, lessonDetails, difficultyLabel);
  const raw = await geminiService.generateText(prompt, {
    model,
    fallbackModel: null,
    maxOutputTokens: 2200,
    temperature: 0.65,
  });

  if (!raw || !raw.trim()) {
    throw new Error('A API retornou uma resposta vazia para o Drácker.');
  }

  let parsed = {};
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    const jsonSlice = raw.slice(firstBrace, lastBrace + 1);
    try {
      parsed = JSON.parse(jsonSlice);
    } catch (e) {
      console.warn('Falha ao converter JSON do Drácker, usando fallback.', e);

      // Tenta extrair apenas o valor de "story" para evitar exibir o texto original inteiro.
      const storyMatch = jsonSlice.match(/"story"\s*:\s*"([\s\S]*?)"\s*(,|})/);
      if (storyMatch) {
        parsed.story = storyMatch[1].replace(/\\n/g, '\n');
      }
    }
  }

  const story = ensureDrackerStory(parsed.story, topic);
  const activities = normalizeActivities(parsed.activities, topic);

  return { story, activities, metadata: { rawLength: raw.length } };
}
