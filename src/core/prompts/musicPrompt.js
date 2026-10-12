export function buildMusicPrompt(topic, lessonDetails) {
  const context = lessonDetails || '';
  return (
    `Crie uma música infantil sobre "${topic}" para crianças de 6-10 anos.\n\n` +
    `PERSONAGEM: Drácker, um dragãozinho marrom com asas marrons que explora a Floresta Encantada com seus amigos (a sábia Coruja, o ágil Esquilo, a esperta Raposa e o fofinho Coelho). Ele adora resolver mistérios e aprender coisas novas.\n\n` +
    `ESTILO: Música infantil envolvente (6-10 anos) com clima de MISTÉRIO e DESAFIO. Ritmo cativante que desperte curiosidade.\n` +
    `ESTRUTURA OBRIGATÓRIA: Verso 1 -> Refrão -> Verso 2 -> Refrão -> Ponte -> Refrão / Final\n` +
    `${context ? `CONTEXTO ESPECÍFICO (ATENÇÃO CRÍTICA): A música INTEIRA deve focar EXCLUSIVAMENTE ou fortemente neste contexto: "${context}".\n` : ''}\n` +
    `Idioma: Português Brasil. Sem markdown.\n\n` +
    `REGRAS CRÍTICAS DE GERAÇÃO:\n` +
    `1. PROIBIDO RESUMIR: Nunca use "(Refrão)", "[Repete Refrão]" ou "Refrão 2x". Você DEVE escrever a letra completa do refrão TODAS AS VEZES que ele aparecer.\n` +
    `2. COMPLETUDE: A música deve ser longa e completa. Escreva cada estrofe inteira.\n` +
    `3. MARCADOR FINAL: Ao terminar a música, pule uma linha e escreva EXATAMENTE: "--- FIM DA MÚSICA ---"\n\n` +
    `MUSIC\n` +
    `[Título da Música]\n` +
    `[Letra completa...]\n\n`
  );
}

/**
 * Prompt oficial para geração de canção pedagógica com Drácker e os amigos da floresta + questões
 * Focado na EXPLICAÇÃO CONCEITUAL DETALHADA E PASSO A PASSO
 */
export function buildDrackerMusicWithAnimalsPrompt({
  topic,
  lessonDetails = '',
  gradeLevel = 'Ensino Fundamental I (6 a 10 anos)',
  musicalStyle = 'Pop Dançante Infantil Alegre',
  questionCount = 6
}) {
  const context = lessonDetails ? `FOCO PEDAGÓGICO / CONCEITO ESPECÍFICO A ENSINAR: "${lessonDetails}"\n` : '';

  return (
    `Você é o compositor-pedagogo oficial do ecossistema educacional "Drácker Adapta".\n` +
    `Sua missão CRÍTICA é compor uma canção que funcione como uma VERDADEIRA AULA DIDÁTICA RIMADA, com EXPLICAÇÃO DETALHADA E APROFUNDADA do conceito de "${topic}", evitando completamente rimas genéricas ou vazias.\n\n` +
    `TEMA CENTRAL / CONCEITO: "${topic}"\n` +
    `${context}` +
    `PÚBLICO-ALVO / SÉRIE: ${gradeLevel}\n` +
    `ESTILO MUSICAL: ${musicalStyle}\n` +
    `QUANTIDADE DE QUESTÕES: exatamente ${questionCount} questões conceituais.\n\n` +
    `EXIGÊNCIA PEDAGÓGICA CRÍTICA - EXPLICAÇÃO CONCEITUAL DETALHADA:\n` +
    `1. A música NÃO PODE ter rimas vazias como "o saber é poder", "vamos estudar que legal", "a floresta é feliz". CADA ESTROFE DEVE CONTER CONTEÚDO DIDÁTICO REAL.\n` +
    `2. A letra DEVE explicar com clareza:\n` +
    `   - O QUE É o conceito (definição exata, vocabulário técnico adaptado para a faixa etária);\n` +
    `   - COMO FUNCIONA (o passo a passo de resolução, as etapas do processo, as relações de causa e efeito);\n` +
    `   - EXEMPLOS PRÁTICOS REAIS (se for matemática: números e operações reais; se for ciências: processos biológicos/físicos reais; se for língua: regras e palavras reais);\n` +
    `   - A PEGADINHA OU ERRO COMUM que o estudante não deve cometer;\n` +
    `   - UMA REGRA MNEMÔNICA cantada no refrão para fixação imediata na memória.\n\n` +
    `MATRIZ DIDÁTICA DOS PERSONAGENS NA FLORESTA ENCANTADA:\n` +
    `- 🐉 DRÁCKER (O Desafio Inicial): Apresenta uma dúvida real e intrigante da sala de aula/vida prática, lançando o mistério de "${topic}".\n` +
    `- 🦉 SÁBIA CORUJA (A Definição Formal): Pousada no galho alto, ensina o vocabulário correto e a regra fundamental do conceito de forma cristalina.\n` +
    `- 🐿️ ÁGIL ESQUILO (O Passo a Passo Prático): Organiza com suas nozes e galhos o passo 1, passo 2 e passo 3 de como calcular ou aplicar o conceito na prática com números/exemplos claros.\n` +
    `- 🦊 ESPERTA RAPOSA (A Dica de Ouro & Macete): Mostra a contraprova ou a charada esperta para não errar a regra na prova ou no exercício.\n` +
    `- 🐰 FOFINHO COELHO (O Refrão Mnemônico): Salta no ritmo da música e conduz o refrão mais contagiante com a fórmula/regra que todos memorizam.\n\n` +
    `ESTRUTURA OBRIGATÓRIA DA LETRA:\n` +
    `[Verso 1] (Drácker contextualiza o problema real da aula sobre "${topic}")\n` +
    `[Refrão] (A regra de ouro ou fórmula central em rima marcante e chiclete - escreva por extenso)\n` +
    `[Verso 2] (A sábia Coruja explica a teoria e o significado dos termos técnicos)\n` +
    `[Refrão] (Repita o refrão completo por extenso, NUNCA use "repete refrão")\n` +
    `[Ponte] (O ágil Esquilo e a esperta Raposa demonstram o exemplo concreto e o macete de resolução)\n` +
    `[Refrão] (Repita o refrão completo por extenso)\n` +
    `[Final] (Síntese consolidando a regra aprendida e celebração do domínio do conceito)\n\n` +
    `DIRETRIZES DAS ${questionCount} QUESTÕES DE COMPREENSÃO CONCEITUAL:\n` +
    `- Cada pergunta DEVE testar o entendimento dos passos didáticos ensinados na música (NÃO faça perguntas superficiais como nome de personagem ou onde moram).\n` +
    `- Foque na mecânica do conceito: como se resolve? O que significa o termo? Qual foi a regra explicada?\n` +
    `- "correctAnswer": precisa ser exata e pedagógica.\n` +
    `- "distractors": array com EXATAMENTE 3 alternativas incorretas plausíveis (erros conceituais clássicos cometidos por alunos).\n` +
    `- "difficulty": distribuição equilibrada entre "facil", "medio" e "dificil".\n\n` +
    `FORMATO DE RESPOSTA OBRIGATÓRIO (APENAS JSON VÁLIDO, SEM TEXTO EXTRA):\n` +
    `{\n` +
    `  "title": "Título específico do conceito (ex: O Mistério das Frações: Numerador e Denominador)",\n` +
    `  "style": "${musicalStyle}",\n` +
    `  "synopsis": "Resumo pedagógico (2 a 3 linhas) de qual conceito a música ensina passo a passo com a turma",\n` +
    `  "lyrics": "Letra completa com [Verso 1], [Refrão], [Verso 2], [Refrão], [Ponte], [Refrão], [Final] formatada",\n` +
    `  "questions": [\n` +
    `    {\n` +
    `      "text": "Pergunta avaliando o conceito específico ensinado...",\n` +
    `      "correctAnswer": "Alternativa correta e precisa",\n` +
    `      "distractors": ["Erro conceitual 1", "Erro conceitual 2", "Erro conceitual 3"],\n` +
    `      "difficulty": "facil"\n` +
    `    }\n` +
    `  ]\n` +
    `}`
  );
}
