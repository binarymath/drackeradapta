export function buildMusicPrompt(topic, lessonDetails) {
  const context = lessonDetails || '';
  return (
    `Crie uma música infantil sobre "${topic}" para crianças de 6-10 anos.\n\n` +
    `PERSONAGEM: Drácker, um dragãozinho curioso que explora a Floresta Encantada. Ele adora resolver mistérios e aprender coisas novas.\n\n` +
    `ESTILO: Música infantil envolvente (6-10 anos) com clima de MISTÉRIO e DESAFIO. Ritmo cativante que desperte curiosidade.\n` +
    `ESTRUTURA OBRIGATÓRIA: Verso 1 -> Refrão -> Verso 2 -> Refrão -> Ponte -> Refrão / Final\n` +
    `${context ? `CONTEXTO: ${context}\n` : ''}\n` +
    `Idioma: Português Brasil. Sem markdown.\n\n` +
    `MUSIC\n` +
    `[Título da Música]\n` +
    `[Letra completa...]\n\n` +
    `IMPORTANTE: A música deve ser COMPLETA. OBRIGATÓRIO incluir TODAS as partes: Verso 1, Refrão, Verso 2, Refrão, Ponte, Refrão Final.\n` +
    `NÃO termine a música pela metade. Escreva até o fim.`
  );
}
