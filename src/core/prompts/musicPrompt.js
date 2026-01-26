export function buildMusicPrompt(topic, lessonDetails) {
  const context = lessonDetails || '';
  return (
    `Crie uma música infantil sobre "${topic}" para crianças de 6-10 anos.\n\n` +
    `PERSONAGEM: Drácker, um dragãozinho marrom com asas marrons que explora a Floresta Encantada. Ele adora resolver mistérios e aprender coisas novas.\n\n` +
    `ESTILO: Música infantil envolvente (6-10 anos) com clima de MISTÉRIO e DESAFIO. Ritmo cativante que desperte curiosidade.\n` +
    `ESTRUTURA OBRIGATÓRIA: Verso 1 -> Refrão -> Verso 2 -> Refrão -> Ponte -> Refrão / Final\n` +
    `${context ? `CONTEXTO ADICIONAL (Use para inspirar a letra e o estilo): ${context}\n` : ''}\n` +
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
