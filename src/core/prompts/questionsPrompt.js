export function buildQuestionsPrompt(lyrics) {
  const safeLyrics = (lyrics || '').slice(0, 1500);
  return (
    `OBRIGATÓRIO: Crie EXATAMENTE 12 perguntas sobre a letra abaixo.\n` +
    `IMPORTANTE: As perguntas devem verificar se a criança aprendeu o conceito ensinado na música.\n` +
    `PROIBIDO: Perguntas sobre o nome do personagem, cor do dragão, onde ele mora, etc.\n` +
    `PROIBIDO: Perguntas sobre o ritmo, estilo musical, instrumentos, ou se a música é rápida/lenta.\n` +
    `PROIBIDO: Perguntas meta-referenciais como "O que a música diz sobre...". Pergunte diretamente sobre o assunto.\n` +
    `FOCO TOTAL: O que o tema ensina? Como funciona o conceito explicado?\n\n` +
    `4 perguntas fáceis (1-4) - Compreensão básica do tema\n` +
    `4 perguntas médias (5-8) - Aplicação e conexão com conceitos\n` +
    `4 perguntas difíceis (9-12) - Desafio criativo sobre o tema\n\n` +
    `Formato por linha (numerada): pergunta? | Correct: resposta | Distractors: errada1; errada2; errada3\n` +
    `Idioma: Português Brasil. Sem markdown.\n\n` +
    `LETRA:\n${safeLyrics}`
  );
}
