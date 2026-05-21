export function buildQuizPrompt(topic, lessonDetails, difficultyLabel) {
  return `Crie uma atividade de Quiz sobre "${topic}".
           
           Nível: ${difficultyLabel}.
           CONTEXTO ESPECÍFICO E OBRIGATÓRIO (Detalhes): ${lessonDetails || 'Sem detalhes'}.

           RETORNE APENAS UM JSON VÁLIDO (sem markdown de código) com a seguinte estrutura:
           {
             "intro_text": "Texto explicativo curto e amigável sobre o tema...",
             "questions": [
               {
                 "statement": "Enunciado da questão...",
                 "correct_answer": "Resposta Certa",
                 "distractors": ["Errada 1", "Errada 2", "Errada 3", "Errada 4"]
               }
             ]
           }
           
           REQUISITOS:
           - OBRIGATÓRIO E CRÍTICO: As perguntas DEVEM SER focadas EXCLUSIVAMENTE ou fortemente no "CONTEXTO ESPECÍFICO" fornecido acima. Não gere um quiz genérico se os detalhes foram fornecidos.
           - 10 Questões no total (4 Fáceis, 4 Médias, 2 Difíceis - misturadas).
           - O texto introdutório deve ajudar a criança a entender o tema, conectando com os detalhes.
           - ATENÇÃO CRÍTICA: NÃO USE aspas duplas (") dentro das frases e textos do JSON. Se precisar citar algo, use aspas simples ('). O uso de aspas duplas dentro dos valores QUEBRARÁ O CÓDIGO.
           - Retorne APENAS o JSON puro. SEM MARKDOWN. SEM TEXTO ANTES OU DEPOIS.`;
}
