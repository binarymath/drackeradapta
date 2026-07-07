import { buildFractionsPrompt } from '../prompts/fractionsPrompt';

export function generateIntelligentFractionsActivity(gradeLevel = '6º Ano - Ensino Fundamental', focusType = 'misto', themeContext = 'culinaria', questionCount = 6) {
  const count = Number(questionCount) || 6;
  const exercises = [];

  const themes = {
    culinaria: [
      { text: "Uma receita de bolo de chocolate exige 3/4 de xícara de açúcar. Se quisermos fazer o dobro da receita, precisaremos de 6/4 (1 e 2/4) de xícara. Pinte essa quantidade abaixo:", num: 6, den: 4, shape: "circle", cat: "visual_painting" },
      { text: "Para fazer uma torta salgada, Maria usou 1/2 kg de farinha de manhã e 1/3 kg à tarde. Calcule quanto de farinha ela usou no total:", num1: 1, den1: 2, op: "+", num2: 1, den2: 3, cat: "arithmetic_operation" },
      { text: "Em uma festa de aniversário, João comeu 2/6 de uma pizza gigante e Ana comeu 3/6. Que fração da pizza eles comeram juntos? Quanto sobrou?", cat: "word_problem", problemText: "Em uma festa de aniversário, João comeu 2/6 de uma pizza gigante e Ana comeu 3/6. Que fração da pizza eles comeram juntos? E que fração sobrou na bandeja?", answerText: "Comeram 5/6 da pizza juntos. Sobrou 1/6 na bandeja." }
    ],
    esportes: [
      { text: "Em uma corrida de revezamento, um atleta correu 5/3 de volta ao redor da pista. Pinte essa distância nas pistas abaixo:", num: 5, den: 3, shape: "rectangle", cat: "visual_painting" },
      { text: "Durante o treino, Lucas correu 3/4 de hora pela manhã e 2/5 de hora à tarde. Calcule o tempo total de treino:", num1: 3, den1: 4, op: "+", num2: 2, den2: 5, cat: "arithmetic_operation" },
      { text: "Um time de futebol venceu 3/5 dos jogos disputados em um campeonato. Se empatou 1/5, que fração dos jogos o time perdeu?", cat: "word_problem", problemText: "Um time de futebol venceu 3/5 dos jogos disputados em um campeonato. Se empatou 1/5, que fração dos jogos o time perdeu ao longo da temporada?", answerText: "Venceu + Empatou = 4/5. Portanto, o time perdeu 1/5 dos jogos." }
    ],
    cotidiano: [
      { text: "Carlos comprou uma barra de chocolate dividida em 8 pedaços e comeu 5 pedaços. Pinte a fração consumida por Carlos:", num: 5, den: 8, shape: "rectangle", cat: "visual_painting" },
      { text: "Calcule a diferença entre 5/6 de um salário e 1/3 do mesmo salário gastado em aluguel:", num1: 5, den1: 6, op: "-", num2: 1, den2: 3, cat: "arithmetic_operation" },
      { text: "Uma caixa d'água estava com 7/8 de sua capacidade total. Durante o dia, foram consumidos 3/8 da água. Que fração da água restou na caixa?", cat: "word_problem", problemText: "Uma caixa d'água estava com 7/8 de sua capacidade total. Durante o dia, foram consumidos 3/8 da água para limpeza e banho. Que fração da água restou na caixa no final do dia?", answerText: "7/8 - 3/8 = 4/8. Simplificando por 4, restou exatamente 1/2 (metade) da água." }
    ],
    livre: [
      { text: "Pinte a fração indicada abaixo, observando atentamente o número de partes em que o inteiro foi dividido:", num: 7, den: 5, shape: "circle", cat: "visual_painting" },
      { text: "Resolva a operação de multiplicação entre as duas frações:", num1: 2, den1: 3, op: "*", num2: 3, den2: 4, cat: "arithmetic_operation" },
      { text: "O professor Drácker dividiu a turma em grupos para um projeto. Se 2/5 dos alunos ficaram na biblioteca e 1/2 ficou no laboratório, que fração da turma estava envolvida nessas duas atividades?", cat: "word_problem", problemText: "O professor Drácker dividiu a turma em grupos para um projeto. Se 2/5 dos alunos ficaram na biblioteca e 1/2 ficou no laboratório de ciências, que fração total da turma estava envolvida nessas duas atividades?", answerText: "2/5 + 1/2 = 4/10 + 5/10 = 9/10 da turma." }
    ]
  };

  const selectedTheme = themes[themeContext] || themes.culinaria;

  for (let i = 0; i < count; i++) {
    const template = selectedTheme[i % selectedTheme.length];
    let cat = template.cat;
    if (focusType === 'visual') cat = 'visual_painting';
    if (focusType === 'operacoes') cat = 'arithmetic_operation';
    if (focusType === 'problemas') cat = 'word_problem';

    if (cat === 'visual_painting') {
      const num = template.num || (Math.floor(Math.random() * 6) + 2);
      const den = template.den || (Math.floor(Math.random() * 4) + 2);
      exercises.push({
        id: i + 1,
        category: 'visual_painting',
        instruction: `Exercício ${i + 1}: Pinte a fração ${num}/${den} na representação geométrica abaixo:`,
        num: num,
        den: den,
        shape: i % 2 === 0 ? 'circle' : 'rectangle'
      });
    } else if (cat === 'arithmetic_operation') {
      const num1 = template.num1 || (Math.floor(Math.random() * 4) + 1);
      const den1 = template.den1 || (Math.floor(Math.random() * 4) + 2);
      const op = template.op || ['+', '-', '*'][Math.floor(Math.random() * 3)];
      const num2 = template.num2 || (Math.floor(Math.random() * 3) + 1);
      const den2 = template.den2 || (Math.floor(Math.random() * 4) + 2);
      exercises.push({
        id: i + 1,
        category: 'arithmetic_operation',
        instruction: `Exercício ${i + 1}: Calcule o resultado e simplifique a operação abaixo:`,
        num1: num1,
        den1: den1,
        op: op,
        num2: num2,
        den2: den2
      });
    } else {
      exercises.push({
        id: i + 1,
        category: 'word_problem',
        instruction: `Problema Contextualizado ${i + 1}`,
        problemText: template.problemText || "Em uma atividade de sala, 3/4 dos alunos entregaram o trabalho no prazo e 1/8 entregou com atraso. Que fração da turma já entregou o trabalho?",
        answerText: template.answerText || "3/4 + 1/8 = 6/8 + 1/8 = 7/8 da turma entregaram o trabalho."
      });
    }
  }

  return {
    activityTitle: `Atividade Prática: Frações - ${themeContext.toUpperCase()} (${gradeLevel})`,
    gradeLevel: gradeLevel,
    exercises: exercises
  };
}
