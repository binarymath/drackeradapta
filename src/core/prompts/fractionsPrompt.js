export function buildFractionsPrompt(gradeLevel, focusType, themeContext, questionCount, customInstructions) {
  const count = questionCount || 6;
  const grade = gradeLevel || '6º Ano - Ensino Fundamental';
  const focus = focusType || 'misto';
  const theme = themeContext || 'culinaria';
  const instructions = customInstructions ? `\nInstruções Especiais do Professor: ${customInstructions}` : '';

  return (
    `Você é o assistente pedagógico Drácker, especialista em ensino de matemática, frações e resolução de problemas.\n` +
    `Nível Escolar: ${grade}\n` +
    `Foco Pedagógico: ${focus} (visual = apenas pintar/identificar frações; operacoes = apenas contas +, -, *, /; problemas = problemas em texto; misto = mistura equilibrada)\n` +
    `Temática / Contexto: ${theme} (use histórias, objetos e exemplos relacionados ao tema escolhido)\n` +
    `Quantidade de Questões: Exatamente ${count} questões.${instructions}\n\n` +
    `Crie uma folha de atividades completa em formato JSON EXCLUSIVAMENTE, seguindo rigorosamente esta estrutura:\n` +
    `{\n` +
    `  "activityTitle": "Título criativo e motivador da atividade",\n` +
    `  "gradeLevel": "${grade}",\n` +
    `  "exercises": [\n` +
    `    {\n` +
    `      "id": 1,\n` +
    `      "category": "visual_painting" | "arithmetic_operation" | "word_problem",\n` +
    `      "instruction": "Enunciado da questão para o aluno",\n` +
    `      // Se category == "visual_painting":\n` +
    `      "num": 5, "den": 4, "shape": "circle" | "rectangle",\n` +
    `      // Se category == "arithmetic_operation":\n` +
    `      "num1": 1, "den1": 2, "op": "+" | "-" | "*", "num2": 1, "den2": 3,\n` +
    `      // Se category == "word_problem":\n` +
    `      "problemText": "História/problema completo e contextualizado com a temática escolhida",\n` +
    `      "answerText": "Gabarito ou resposta explicada para o professor (ex: 5/6 ou 1 e 1/4)"\n` +
    `    }\n` +
    `  ]\n` +
    `}\n\n` +
    `IMPORTANTE:\n` +
    `1. Retorne APENAS o JSON válido sem blocos markdown (\`\`\`json) ou textos extras.\n` +
    `2. Se o foco for "visual", gere todas com category="visual_painting" (inclua pelo menos uma fração imprópria ou mista para enriquecer).\n` +
    `3. Se o foco for "operacoes", gere todas com category="arithmetic_operation" com denominadores variados e coerentes com a série.\n` +
    `4. Se o foco for "problemas", gere todas com category="word_problem" com enunciados claros, criativos e envolventes.\n` +
    `5. Se o foco for "misto", distribua igualmente entre visual_painting, arithmetic_operation e word_problem.`
  );
}
