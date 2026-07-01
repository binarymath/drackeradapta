export function buildNumberLinePrompt(topic, contextDetails, difficulty) {
  return (
    `Você é o assistente pedagógico Drácker, especialista em matemática e ensino visual da Reta Numérica.\n` +
    `Tema da Atividade: ${topic || 'Reta Numérica com Frações e Números Inteiros'}\n` +
    `Contexto Pedagógico: ${contextDetails || 'Ensino Fundamental'}\n` +
    `Nível de Dificuldade: ${difficulty || 'medium'}\n\n` +
    `Crie uma atividade completa e interativa de Reta Numérica em formato JSON EXCLUSIVAMENTE, seguindo esta estrutura rigorosa:\n` +
    `{\n` +
    `  "title": "Título criativo e educativo da atividade",\n` +
    `  "description": "Breve instrução para o aluno sobre o que fazer na reta numérica",\n` +
    `  "domainType": "fraction" | "integer" | "decimal",\n` +
    `  "minVal": número mínimo do eixo (ex: -5 se integer, ou 0 se fraction),\n` +
    `  "maxVal": número máximo do eixo (ex: 5 se integer, ou 2 se fraction),\n` +
    `  "step": passo inteiro ou decimal (ex: 1 ou 0.5),\n` +
    `  "denominator": denominador se for fração (ex: 2, 3, 4, 5, ou 8),\n` +
    `  "points": [\n` +
    `    {"id": "p1", "val": -2, "label": "A", "color": "blue", "hiddenVal": true},\n` +
    `    {"id": "p2", "val": 1.5, "label": "3/2", "color": "emerald", "hiddenVal": true}\n` +
    `  ],\n` +
    `  "arcs": [\n` +
    `    {"id": "a1", "fromVal": -2, "toVal": 1, "label": "+3"}\n` +
    `  ],\n` +
    `  "questions": [\n` +
    `    "Qual número ou fração o ponto A representa na reta numérica?",\n` +
    `    "Calcule a distância entre os pontos marcados."\n` +
    `  ]\n` +
    `}\n\n` +
    `IMPORTANTE:\n` +
    `1. Retorne APENAS o JSON sem blocos markdown (\`\`\`json) ou textos extras.\n` +
    `2. Se o tema envolver frações, use domainType="fraction" e defina pontos com valores coerentes com o denominador escolhido.\n` +
    `3. Inclua entre 4 e 6 pontos interessantes com "hiddenVal": true para o modo de adivinhação/lousa.`
  );
}
