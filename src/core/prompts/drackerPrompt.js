export function buildDrackerPrompt(topic, lessonDetails, difficultyLabel) {
  const safeTopic = topic || 'o tema definido pelo professor';
  const safeDetails = lessonDetails || 'Sem detalhes extras fornecidos.';

  return `Você é um assistente pedagógico especializado em criar atividades lúdicas e educativas.
Sua missão é gerar um conteúdo completo para a atividade "Aprenda com o Drácker".

**PARÂMETROS:**
- **TEMA:** ${safeTopic}
- **CONTEXTO:** ${safeDetails}
- **NÍVEL:** ${difficultyLabel}
- **PERSONAGEM:** Drácker, um dragãozinho juvenil (6º ano), corpo marrom, asas marrons, barriga creme, olhos azuis expressivos, chifres curtos e arredondados. Usa mochila e postura de estudante atento. Personalidade curiosa, focado em aprendizado ativo e autonomia.

---

**OBJETIVO 1: A HISTÓRIA (Obrigatoriamente 3 a 6 parágrafos)**
Escreva uma história envolvente onde o Drácker interage com as crianças sobre o tema.
- **Introdução:** O encontro com o Drácker e a apresentação do tema.
- **Desenvolvimento:** A exploração, perguntas curiosas, diálogos e descobertas. (Mínimo 2 parágrafos aqui). O Drácker deve mencionar elementos específicos do CONTEXTO (${safeDetails}).
- **Conclusão:** Uma lição aprendida ou um convite para a prática.
- **IMPORTANTE:** A história deve ser rica, bem escrita e adequada para crianças. Não faça resumos. Escreva a história completa.

**OBJETIVO 2: ATIVIDADES PRÁTICAS (Exatamente 5 atividades)**
Crie 5 atividades "mão na massa" relacionadas à história e ao tema.
Cada atividade deve ter:
1. **Título Criativo:** Um nome divertido.
2. **Materiais:** Lista de itens necessários (simples e escolares).
3. **Passo a Passo:** Instruções claras de como realizar.

---

**FORMATO DE RESPOSTA (JSON PURO):**
Você deve retornar APENAS um objeto JSON válido. Não use Markdown (\`\`\`json). Não inclua texto antes ou depois.

Exemplo de estrutura (siga estritamente as chaves em inglês):
{
  "story": "Era uma vez... (história completa com quebras de linha \\n)",
  "activities": [
    {
      "title": "Caça ao Tesouro",
      "materials": "Papel, caneta e fita adesiva",
      "steps": "1. Esconda as pistas... 2. Peça para os alunos..."
    },
    ... (mais 4 atividades)
  ]
}

Gere o JSON agora:`;
}
