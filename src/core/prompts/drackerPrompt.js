export function buildDrackerPrompt(topic, lessonDetails, difficultyLabel) {
  const safeTopic = topic || 'o tema definido pelo professor';
  const safeDetails = lessonDetails || 'Sem detalhes extras fornecidos.';

  return `Você é um assistente pedagógico especializado em criar atividades lúdicas e educativas.
Sua missão é gerar um conteúdo completo para a atividade "Aprenda com o Drácker".

**PARÂMETROS:**
- **TEMA:** ${safeTopic}
- **CONTEXTO ESPECÍFICO E OBRIGATÓRIO (Detalhes):** ${safeDetails}
- **NÍVEL:** ${difficultyLabel}
- **PERSONAGEM:** Drácker, um dragãozinho juvenil (6º ano), corpo marrom, asas marrons, barriga creme, olhos azuis expressivos, chifres curtos e arredondados. Usa mochila e postura de estudante atento. Personalidade curiosa, focado em aprendizado ativo e autonomia.

---

**OBJETIVO 1: A HISTÓRIA (Obrigatoriamente 3 a 6 parágrafos)**
Escreva uma história envolvente onde o Drácker interage com as crianças sobre o tema.
- **Introdução:** O encontro com o Drácker e a apresentação do tema.
- **Desenvolvimento:** A exploração, perguntas curiosas, diálogos e descobertas. (Mínimo 2 parágrafos aqui). O Drácker DEVE focar incisivamente neste CONTEXTO: "${safeDetails}".
- **Conclusão:** Uma lição aprendida ou um convite para a prática.
- **IMPORTANTE:** A história deve ser rica, bem escrita e adequada para crianças. Não faça resumos. Escreva a história completa.

**OBJETIVO 2: ATIVIDADES PRÁTICAS (Exatamente 3 atividades)**
Crie 3 atividades "mão na massa" relacionadas à história e ao tema.
Cada atividade deve ter:
1. **Título Criativo:** Um nome divertido.
2. **Materiais:** Lista de itens necessários (simples e escolares).
3. **Passo a Passo:** Instruções COMPLETAS E DETALHADAS de como realizar a atividade do início ao fim.
- **ATENÇÃO CRÍTICA (NÃO IGNORE):** NUNCA dê respostas curtas, preguiçosas ou genéricas. 
  ❌ EXEMPLO DO QUE NÃO FAZER (PROIBIDO): "Crie livremente com a turma usando os materiais disponíveis." ou "Peça para os alunos discutirem."
  ✅ EXEMPLO DO QUE FAZER (OBRIGATÓRIO): "1. O professor deve organizar a turma em pequenos grupos e distribuir os materiais. 2. Cada grupo terá 10 minutos para montar um projeto usando as regras Y. 3. Ao final, cada grupo apresenta sua construção e o professor faz uma reflexão guiada ligando com o tema Z."
  Seja prático e metodológico. Explique como o professor conduzirá e como os alunos executarão a prática. O texto do "Passo a Passo" deve ser um roteiro aplicável real, longo e extremamente claro. **NUNCA pare a resposta pela metade.** Mantenha o formato JSON íntegro.

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
    ... (mais 2 atividades)
  ]
}

Gere o JSON agora:`;
}
