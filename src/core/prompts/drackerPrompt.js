export function buildDrackerPrompt(topic, lessonDetails, difficultyLabel) {
  const safeTopic = topic || 'o tema definido pelo professor';
  const safeDetails = lessonDetails || 'Sem detalhes extras fornecidos.';

  return `Atue como roteirista pedagógico do Dragãozinho camarada Drácker. Gere conteúdo em português brasileiro.
TEMA: "${safeTopic}"
DETALHES: ${safeDetails}
NÍVEL E TOM: ${difficultyLabel} (linguagem acolhedora e clara).

PRODUZA APENAS UM JSON COM O FORMATO:
{
  "story": "história com Drácker em parágrafos separados por \n\n",
  "activities": [
    "Atividade 1 com materiais simples",
    "Atividade 2 com materiais simples",
    "Atividade 3 com materiais simples",
    "Atividade 4 com materiais simples",
    "Atividade 5 com materiais simples"
  ]
}

REGRAS DA HISTÓRIA:
- Drácker deve aparecer como um amigo que aprende junto com as crianças.
- Estrutura: 5 a 7 parágrafos curtos (3-4 frases), separados por \n\n.
- Traga situações cotidianas da sala de aula ou do bairro.
- Mantenha a voz narrativa positiva, curiosa e colaborativa.

REGRAS DAS ATIVIDADES:
- Exatamente 5 atividades práticas e rápidas para sala de aula.
- Cada item deve caber em uma única linha do JSON, com até 30-40 palavras.
- Cite materiais bem simples (papel, lápis de cor, cartolina, cola, tesoura sem ponta, barbante, tampinhas, revistas, sucata limpa).
- Inclua título, materiais e passo a passo na mesma linha, podendo usar negrito com ** **.
- Não use markdown fora do JSON. Não crie campos extras.`;
}
