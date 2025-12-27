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
      if (!act) return null;
      // Handle string legacy case
      if (typeof act === 'string') {
        return {
          title: act,
          materials: '',
          steps: ''
        };
      }

      const title = act.title || act.nome || act.activity || act.headline || 'Atividade Prática';
      const description = act.description || act.desc || ''; // Optional description
      const materials = act.materials || act.recursos || act.material || '';
      const steps = act.steps || act.passos || act.instrucoes || '';

      return {
        title,
        materials: Array.isArray(materials) ? materials.join(', ') : materials,
        steps: Array.isArray(steps) ? steps.join(' ') : steps,
        description
      };
    })
    .filter(Boolean);

  const filled = [...base];
  while (filled.length < 5) {
    const templateIdx = filled.length % SIMPLE_MATERIAL_FALLBACKS.length;
    // Parse the fallback string into object parts loosely or just provide a generic object
    const fallbackString = SIMPLE_MATERIAL_FALLBACKS[templateIdx];
    // Fallback strings are like "Materiais: x, y, z."
    // We'll just put that in materials.

    filled.push({
      title: `Explorando ${topic || 'o tema'} (${filled.length + 1})`,
      materials: fallbackString.replace('Materiais:', '').trim(),
      steps: 'Crie livremente com a turma usando os materiais disponíveis.'
    });
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
    maxOutputTokens: 4000,
    temperature: 0.75,
  });

  if (!raw || !raw.trim()) {
    throw new Error('A API retornou uma resposta vazia para o Drácker.');
  }

  let parsed = {};

  // 1. Clean Markdown wrappers
  let cleanRaw = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // 2. Extract JSON block if surrounded by text
  const firstBrace = cleanRaw.indexOf('{');
  const lastBrace = cleanRaw.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanRaw = cleanRaw.slice(firstBrace, lastBrace + 1);
  }

  // 3. Try Direct Parse
  try {
    parsed = JSON.parse(cleanRaw);
  } catch (e) {
    console.warn('Falha ao converter JSON do Drácker (parse direto). Tentando recuperação via regex.', e);

    // 4. Fallback: Regex Scavenger Mode
    // Finds "story": "..." and activity objects anywhere in the text

    // Story
    const storyMatch = raw.match(/"story"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (storyMatch) {
      parsed.story = storyMatch[1]
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');
    }

    // Activities (Global Object Search)
    const scavengerActivities = [];
    const allBraceBlocks = raw.match(/\{[\s\S]*?\}/g) || [];

    for (const block of allBraceBlocks) {
      // Look for title + (materials OR steps) inside any block
      const titleM = block.match(/"(?:title|nome|t[ií]tulo)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
      const matM = block.match(/"(?:materials|materiais|recursos)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
      const stepsM = block.match(/"(?:steps|passos|instru[cç][oõ]es)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);

      if (titleM && (matM || stepsM)) {
        const extract = (m) => m ? m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '';
        scavengerActivities.push({
          title: extract(titleM),
          materials: extract(matM),
          steps: extract(stepsM)
        });
      }
    }

    if (scavengerActivities.length > 0) {
      if (!parsed.activities) parsed.activities = [];
      parsed.activities = scavengerActivities;
    }
  }

  // 5. Desperate Text Scavenger (If JSON and Object Regex failed or yielded few results)
  // Sometimes the model ignores JSON and just prints text like:
  // "1. Caça ao Tesouro"
  // "Materiais: x, y, z"
  // "Passo a passo: ..."
  if (!parsed.activities || !Array.isArray(parsed.activities) || parsed.activities.length < 3) {
    console.warn('Fallback Final: Tentando extrair de texto estruturado (não-JSON)...');

    const textActivities = [];
    // Split by something that looks like a numbered activity header: "1. Título", "Atividade 1:", etc.
    // Regex: Newline + Number + Dot/Paren + Space + Text
    const splitRegex = /\n\s*(?:\d+\.|Atividade \d+:?)\s+(.*?)(?=\n\s*(?:\d+\.|Atividade \d+:?)|$)/gs;

    let match;
    while ((match = splitRegex.exec(raw)) !== null) {
      const fullBlock = match[0]; // The whole activity block
      const titleLine = match[1].split('\n')[0].trim(); // mostly the title

      // Extract Materials
      const matMatch = fullBlock.match(/(?:Materiais|Recursos|Itens necessários)[:\s]+(.*?)(?=\n\s*(?:Passo|Como fazer|Instru|Steps)|$)/i);
      const materials = matMatch ? matMatch[1].trim() : '';

      // Extract Steps
      const stepMatch = fullBlock.match(/(?:Passo a passo|Como fazer|Instruções|Steps)[:\s]+([\s\S]*?)$/i);
      const steps = stepMatch ? stepMatch[1].trim() : '';

      if (titleLine && (materials || steps)) {
        textActivities.push({
          title: titleLine.replace(/[*"]/g, ''),
          materials: materials.replace(/[*"]/g, ''),
          steps: steps.replace(/[*"]/g, '')
        });
      }
    }

    if (textActivities.length > 0) {
      // Merge or overwrite if we found nothing before
      if (!parsed.activities || parsed.activities.length === 0) {
        parsed.activities = textActivities;
      } else {
        // Append compliant ones
        parsed.activities = [...parsed.activities, ...textActivities];
      }
    }
  }

  const story = ensureDrackerStory(parsed.story, topic);
  const activities = normalizeActivities(parsed.activities, topic);

  return { story, activities, metadata: { rawLength: raw.length } };
}
