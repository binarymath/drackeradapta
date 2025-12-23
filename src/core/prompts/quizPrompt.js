export function buildQuizPrompt(topic, lessonDetails, difficultyLabel) {
  return `Crie uma atividade de Quiz sobre "${topic}".
           
           Nível: ${difficultyLabel}.
           Detalhes: ${lessonDetails || 'Sem detalhes'}.

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
           - 10 Questões no total (4 Fáceis, 4 Médias, 2 Difíceis - misturadas).
           - O texto introdutório deve ajudar a criança a entender o tema.
           - Retorne APENAS o JSON puro. SEM MARKDOWN. SEM TEXTO ANTES OU DEPOIS.`;
}
