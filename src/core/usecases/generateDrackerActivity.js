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
  while (filled.length < 3) {
    const templateIdx = filled.length % SIMPLE_MATERIAL_FALLBACKS.length;
    // Parse the fallback string into object parts loosely or just provide a generic object
    const fallbackString = SIMPLE_MATERIAL_FALLBACKS[templateIdx];
    // Fallback strings are like "Materiais: x, y, z."
    // We'll just put that in materials.

    filled.push({
      title: `Construindo o Saber: ${topic || 'O Tema'}`,
      materials: fallbackString.replace('Materiais:', '').trim(),
      steps: '1. Organize a turma em pequenos grupos e entregue os materiais. 2. Peça que discutam e esbocem uma ideia prática ligada ao que foi aprendido. 3. Cada grupo terá 15 minutos para montar seu projeto. 4. Ao final, forme uma roda de conversa onde cada grupo apresentará o que produziu, explicando a relação com a aula de hoje.'
    });
  }

  return filled.slice(0, 3);
}

function ensureDrackerStory(rawStory, topic) {
  const baseStory = (rawStory || '').trim();
  if (!baseStory) {
    return `Drácker, ajustando sua mochila nas costas e com olhar atento, perguntou à turma sobre ${topic || 'o tema da aula'}. Como um bom estudante, ele sugeriu explorarem juntos, lembrando que aprender exige curiosidade e foco.`;
  }

  if (baseStory.toLowerCase().includes('drácker')) {
    return baseStory;
  }

  return `Drácker entrou na sala com sua mochila e postura estudiosa habitual para conversar sobre ${topic || 'o tema de hoje'}. ${baseStory}`;
}

export async function generateDrackerActivity({ topic, lessonDetails, difficulty, model, geminiService }) {
  const levelLabel = difficulty === 'hard' ? 'Ensino Médio (Avançado - linguagem mais aprofundada)' : difficulty === 'easy' ? 'Anos Iniciais (Fácil - linguagem lúdica, fantasia e muito simples)' : 'Anos Finais (Médio - linguagem escolar e prática)';

  const prompt = buildDrackerPrompt(topic, lessonDetails, levelLabel);
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

  // 1. Try centralized safe parser first
  try {
    const { safeJSONParse } = await import('../../utils/jsonUtils');
    parsed = safeJSONParse(raw) || {};

    // If parsed is empty (safeJSONParse returns null/null-like), throw to trigger fallback
    if (!parsed || Object.keys(parsed).length === 0) {
      throw new Error("Safe parse failed or empty");
    }
  } catch (e) {
    console.warn('Falha ao converter JSON do Drácker (safeParser). Tentando recuperação via regex.', e);

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
      const materials = block.match(/"(?:materials|materiais|recursos)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
      const steps = block.match(/"(?:steps|passos|instru[cç][oõ]es)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);

      if (titleM && (materials || steps)) {
        const extract = (m) => m ? m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '';
        scavengerActivities.push({
          title: extract(titleM),
          materials: extract(materials),
          steps: extract(steps)
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
