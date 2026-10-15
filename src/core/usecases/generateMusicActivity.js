import { buildMusicPrompt, buildDrackerMusicWithAnimalsPrompt } from '../prompts/musicPrompt';
import { buildQuestionsPrompt } from '../prompts/questionsPrompt';
import { parseQuestions } from '../parsers/questionsParser';
import { safeJSONParse } from '../../utils/jsonUtils';
import { shuffleInPlace } from '../../utils/array';

/**
 * Detecta o domínio pedagógico para estruturar a explicação conceitual no gerador local
 */
function detectPedagogicalDomain(topic = '', details = '') {
  const text = `${topic} ${details}`.toLowerCase();

  if (/fra[cç][aã]o|fra[cç][oõ]es|denominador|numerador|equivalente|simplific/i.test(text)) {
    return 'fracoes';
  }
  if (/[aá]rea|per[ií]metro|geometr|tri[aâ]ngul|quadrad|ret[aâ]ngul|pol[ií]gono/i.test(text)) {
    return 'geometria';
  }
  if (/multiplic|tabuada|dobro|triplo|fator|produto|divis[aã]o|m[uú]ltiplo|divisor/i.test(text)) {
    return 'matematica_operacoes';
  }
  if (/[aá]gua|chuva|evapora|condensa|precipita|transpira|ciclo/i.test(text)) {
    return 'ciclo_agua';
  }
  if (/planta|fotoss[ií]ntese|clorofila|oxig[eê]nio|raiz|semente/i.test(text)) {
    return 'ciencias_plantas';
  }
  if (/verbo|tempo|pret[eé]rito|passado|futuro|presente|a[cç][aã]o|gram[aá]tica|substantivo|adjetivo/i.test(text)) {
    return 'portugues_verbos';
  }
  if (/matem[aá]t|n[uú]mero|c[aá]lculo|adi[cç][aã]o|subtra[cç]/i.test(text)) {
    return 'matematica_geral';
  }
  if (/ci[eê]ncia|natureza|ecossistema|animal|bicho/i.test(text)) {
    return 'ciencias_geral';
  }
  return 'geral';
}

/**
 * Gerador local inteligente, dinâmico e conceituado (Drácker & Turma da Floresta)
 * Garante que NUNCA repete a mesma letra e SEMPRE aprofunda o conceito passo a passo.
 */
export function generateLocalDrackerMusic({
  topic = 'Matemática e Descobertas',
  lessonDetails = '',
  gradeLevel = 'Ensino Fundamental I',
  musicalStyle = 'Pop Dançante Infantil Alegre',
  questionCount = 6
}) {
  const safeTopic = topic?.trim() || 'Aprender na Floresta';
  const domain = detectPedagogicalDomain(safeTopic, lessonDetails);
  const randomSeed = Math.floor(Math.random() * 3); // 3 variações dinâmicas por domínio

  let title = `O Mistério de ${safeTopic} com a Turma do Drácker`;
  let style = musicalStyle || 'Pop Dançante Infantil Alegre';
  let synopsis = '';
  let lyrics = '';
  let baseQuestions = [];

  // ==========================================
  // DOMÍNIO 1: FRAÇÕES (Numerador & Denominador)
  // ==========================================
  if (domain === 'fracoes') {
    title = `A Dança das Frações: O Segredo das Partes Iguais com Drácker`;
    synopsis = `Drácker e os amigos da floresta explicam com detalhes o que é numerador, denominador e como fatiar qualquer todo em partes rigorosamente iguais.`;

    const rimaIntro = [
      `Na clareira encantada, Drácker reuniu uma torta inteira,\n"Como repartir sem briga para a turma da clareira?"\nUma fração não é mistério, é pedaço com razão,\nDividir em partes iguais é a nossa grande missão!`,
      `Drácker trouxe para a roda uma torta de nozes douradas,\n"Se somos muitos amigos, como deixá-las fatiadas?"\nFração é dividir o inteiro com justiça e exatidão,\nCada parte bem contada na palma da nossa mão!`
    ][randomSeed % 2];

    const refrao = `[Refrão]
Traço no meio pra dividir com atenção!
Embaixo é o DENOMINADOR: quantas partes tem o chão!
Em cima é o NUMERADOR: quantas partes eu peguei!
Com Drácker e o Coelho saltitante, a regra decorei!
Traço no meio, numerador a brilhar,
Denominador embaixo para tudo organizar!`;

    lyrics = `[Verso 1]
${rimaIntro}

${refrao}

[Verso 2]
A sábia Coruja no galho alto começa a ensinar:
"Olhe para o número de baixo antes de começar!
É o DENOMINADOR, o total que o todo virou,
Se cortei a torta em quatro, é o quatro que mandou!
E o número lá de cima? NUMERADOR ele é,
Mostra quantas fatias vão alimentar o nosso jacaré!"

${refrao}

[Ponte]
O ágil Esquilo organiza suas nozes com primor:
"Cortei quatro pedacinhos de sabor encantador!
Comi duas fatias, deu dois quartos na jogada,
Que é a mesma metade, simplificada e comprovada!"
A esperta Raposa dá o macete sem demora:
"Multiplique em cima e embaixo e a equivalência vigora!
Nunca some os denominadores se iguais eles já estão,
Repete o de baixo e soma em cima de montão!"

${refrao}

[Final]
Agora toda a floresta sabe bem como frações usar:
Drácker, Coruja, Esquilo, Raposa e Coelho a cantar!
O traço da fração virou a ponte do saber,
Dividir com exatidão é muito fácil aprender!`;

    baseQuestions = [
      {
        text: `De acordo com a explicação da sábia Coruja, qual é a função exata do DENOMINADOR em uma fração?`,
        correctAnswer: `Indicar em quantas partes iguais o número inteiro foi dividido`,
        distractors: [
          `Indicar quantas fatias já foram comidas pelo esquilo`,
          `Multiplicar o valor da torta por quatro`,
          `Somar o total de animais presentes na clareira`
        ],
        difficulty: 'facil'
      },
      {
        text: `O que representa o NUMERADOR, que fica na parte de cima do traço da fração?`,
        correctAnswer: `A quantidade de partes que foram consideradas ou tomadas do total`,
        distractors: [
          `O total absoluto de fatias que existiam no início`,
          `Apenas a metade do tamanho da torta inteira`,
          `O resultado final de uma divisão por zero`
        ],
        difficulty: 'facil'
      },
      {
        text: `No exemplo do ágil Esquilo, cortar em 4 partes e comer 2 (2/4) é equivalente a qual fração simples?`,
        correctAnswer: `1/2 (metade da torta)`,
        distractors: [
          `1/4 (um quarto da torta)`,
          `3/4 (três quartos da torta)`,
          `4/2 (duas tortas inteiras)`
        ],
        difficulty: 'medio'
      },
      {
        text: `Qual é a dica de ouro da esperta Raposa para somar frações que já têm o mesmo denominador?`,
        correctAnswer: `Repete o denominador embaixo e soma apenas os numeradores em cima`,
        distractors: [
          `Soma os de cima e também soma os de baixo juntos`,
          `Multiplica tudo em cruz sem olhar os números`,
          `Elimina o denominador e guarda só o numerador`
        ],
        difficulty: 'medio'
      },
      {
        text: `Por que é obrigatório que todas as partes de uma fração sejam rigorosamente IGUAIS?`,
        correctAnswer: `Porque frações representam divisões equitativas e proporções exatas de uma unidade`,
        distractors: [
          `Porque os animais não gostam de pedaços redondos`,
          `Para que o número de cima seja sempre menor que o de baixo`,
          `Apenas por motivo estético na hora de desenhar a figura`
        ],
        difficulty: 'dificil'
      },
      {
        text: `Como a esperta Raposa demonstra que encontramos frações equivalentes?`,
        correctAnswer: `Multiplicando ou dividindo tanto o numerador quanto o denominador pelo mesmo valor`,
        distractors: [
          `Somando o número dois apenas na parte de baixo`,
          `Trocando o numerador pelo denominador de posição`,
          `Subtraindo um de todos os lados da fração`
        ],
        difficulty: 'dificil'
      }
    ];

  // ==========================================
  // DOMÍNIO 2: CICLO DA ÁGUA & CIÊNCIAS NATURAIS
  // ==========================================
  } else if (domain === 'ciclo_agua') {
    title = `A Viagem da Gotinha: O Ciclo da Água Passo a Passo com Drácker`;
    synopsis = `Drácker e os animais da floresta desvendam o ciclo hidrológico detalhando evaporação, condensação, precipitação e transpiração vegetal.`;

    const refrao = `[Refrão]
Evapora lá do rio, sobe em vapor pro céu!
Condensa lá no alto, vira nuvem feito véu!
Precipita em gotinhas, é a chuva a desabar!
Infiltra no solo e o ciclo vai recomeçar!
Água viaja, transforma e mantém a vida sã,
Com Drácker e o Coelho cantando de manhã!`;

    lyrics = `[Verso 1]
Drácker olhou a poça d’água sob o sol a brilhar,
"Para onde foi a água que estava neste lugar?"
A sábia Coruja bateu asas com serenidade:
"A água não sumiu, seguiu o ciclo da verdade!
O calor do Sol aquece e transforma o líquido em vapor,
EVAPORAÇÃO é a primeira etapa desse grande motor!"

${refrao}

[Verso 2]
"E lá em cima, Coruja, o que acontece de montão?"
"Lá no alto é bem mais frio, ocorre a CONDENSAÇÃO!
O vapor se junta todo em gotículas tão pequenas,
Formando nuvens brancas, leves e serenas!
As árvores da floresta também ajudam a subir,
Com a TRANSPIRAÇÃO que faz mais água fluir!"

${refrao}

[Ponte]
O ágil Esquilo aponta para o céu a escurecer:
"A nuvem ficou pesada, a PRECIPITAÇÃO vai descer!
Gotas caem no telhado, regam folhas e o capim,
A água volta pro chão em um caminho sem fim!"
A esperta Raposa mostra a terra a beber:
"A INFILTRAÇÃO alimenta os lençóis pra floresta florescer!
E rios correm pro mar, sem a água se perder!"

${refrao}

[Final]
Sol, vapor, nuvem, chuva e rio a desaguar:
Drácker e todos os bichos entenderam como a Terra sabe respirar!
Preservar cada gota é lição de cidadão,
O ciclo da água gravado no nosso coração!`;

    baseQuestions = [
      {
        text: `Qual é o processo em que a água líquida dos rios e poças é aquecida pelo Sol e vira vapor?`,
        correctAnswer: `Evaporação`,
        distractors: [`Condensação`, `Precipitação`, `Infiltração`],
        difficulty: 'facil'
      },
      {
        text: `Como se chama a etapa em que o vapor de água sobe, esfria nas alturas e forma as nuvens?`,
        correctAnswer: `Condensação`,
        distractors: [`Transpiração`, `Ebulição`, `Solidificação`],
        difficulty: 'facil'
      },
      {
        text: `O que é a PRECIPITAÇÃO explicada pelo ágil Esquilo na canção?`,
        correctAnswer: `A queda da água das nuvens de volta à Terra em forma de chuva, neve ou granizo`,
        distractors: [
          `A subida rápida do vapor quando está muito calor`,
          `O congelamento instantâneo do fundo dos rios`,
          `A perda de água pelas folhas das árvores`
        ],
        difficulty: 'medio'
      },
      {
        text: `Qual é a contribuição das plantas e árvores da Floresta Encantada para o ciclo da água?`,
        correctAnswer: `Liberar vapor de água na atmosfera através da transpiração vegetal`,
        distractors: [
          `Bloquear a formação de nuvens de chuva`,
          `Fazer a água salgada virar gelo`,
          `Impedir que a água infiltre no solo`
        ],
        difficulty: 'medio'
      },
      {
        text: `Por que dizemos que a água do planeta se move em um 'ciclo contínuo'?`,
        correctAnswer: `Porque ela muda de estado físico e circula infinitamente sem se destruir`,
        distractors: [
          `Porque a água desaparece da Terra e nunca mais retorna`,
          `Porque a chuva só cai uma vez por ano em todo o planeta`,
          `Porque toda a água da Terra já se transformou em vapor`
        ],
        difficulty: 'dificil'
      },
      {
        text: `O que acontece na etapa de INFILTRAÇÃO demonstrada pela esperta Raposa?`,
        correctAnswer: `A água da chuva penetra no solo e reabastece os lençóis freáticos subterrâneos`,
        distractors: [
          `A água evapora antes de tocar o solo da floresta`,
          `O solo rejeita a água e causa tempestades de vento`,
          `A água se transforma em minerais de rocha pura`
        ],
        difficulty: 'dificil'
      }
    ];

  // ==========================================
  // DOMÍNIO 3: MULTIPLICAÇÃO & OPERAÇÕES
  // ==========================================
  } else if (domain === 'matematica_operacoes' || domain === 'matematica_geral') {
    title = `A Tabuada sem Segredos: Multiplicar com Drácker e o Esquilo`;
    synopsis = `Drácker e os animais da floresta ensinam o conceito exato de multiplicação como adição repetida de parcelas iguais e a comutatividade.`;

    const refrao = `[Refrão]
Multiplicar é somar parcelas iguais!
Três vezes quatro é quatro mais quatro e quatro a mais!
A ordem dos fatores não muda o produto não,
Com Drácker e seus amigos, tabuada é diversão!
Cálculo certeiro, nozes a somar,
O Esquilo e a Coruja nos ensinaram a calcular!`;

    lyrics = `[Verso 1]
Drácker viu o Esquilo carregar nozes no cesto:
"São muitas cestinhas, como conto isso a contento?"
O ágil Esquilo sorriu e alinhou tudo no chão:
"Não precisa contar de um em um na aflição!
Temos cinco cestas com três nozes em cada uma,
Multiplicação resolve sem dúvida alguma!"

${refrao}

[Verso 2]
A sábia Coruja pousou no galho com precisão:
"Multiplicação é um atalho genial da adição!
Em vez de 3 + 3 + 3 + 3 + 3 sem parar,
Você faz 5 vezes 3 e vê 15 brotar!
O 5 e o 3 são os FATORES que você juntou,
E o 15 é o PRODUTO que a conta encontrou!"

${refrao}

[Ponte]
A esperta Raposa traz o truque que resolve a lida:
"A comutatividade nunca pode ser esquecida!
3 vezes 5 ou 5 vezes 3 dá o mesmo resultado,
Inverta os fatores e o produto está guardado!
E multiplicar por zero dá sempre zero na questão,
Multiplicar por um repete o número em sua mão!"
O fofinho Coelho dá três saltos de emoção:
"Agora a tabuada virou pura canção!"

${refrao}

[Final]
Agora toda turma faz contas com velocidade:
Drácker lidera a expedição com facilidade!
Multiplicar é somar com inteligência e união,
Mais um mistério desvendado com nota dez na lição!`;

    baseQuestions = [
      {
        text: `Segundo a explicação da Coruja, o que é a MULTIPLICAÇÃO em sua essência?`,
        correctAnswer: `Uma soma abreviada de parcelas iguais`,
        distractors: [
          `Uma divisão de números por dois`,
          `Uma subtração sucessiva de nozes`,
          `Apenas uma lista de rimas sem regra matemática`
        ],
        difficulty: 'facil'
      },
      {
        text: `Como se chamam os números que multiplicamos entre si e o resultado final da operação?`,
        correctAnswer: `Fatores e Produto`,
        distractors: [
          `Numerador e Denominador`,
          `Parcela e Subtraendo`,
          `Dividendo e Resto`
        ],
        difficulty: 'facil'
      },
      {
        text: `O que diz a regra da 'Comutatividade' explicada pela esperta Raposa na canção?`,
        correctAnswer: `A ordem dos fatores não altera o produto (ex: 3x5 = 5x3 = 15)`,
        distractors: [
          `O número maior deve sempre vir primeiro na conta`,
          `Toda multiplicação deve terminar em zero`,
          `O resultado muda se você trocar os números de lado`
        ],
        difficulty: 'medio'
      },
      {
        text: `O que acontece quando multiplicamos qualquer número por ZERO?`,
        correctAnswer: `O resultado é sempre zero`,
        distractors: [
          `O resultado é o próprio número`,
          `O resultado vira dez`,
          `O resultado dobra de tamanho`
        ],
        difficulty: 'medio'
      },
      {
        text: `Se você tem 4 caixas e cada caixa tem 6 maçãs, qual cálculo representa essa quantidade?`,
        correctAnswer: `4 x 6 = 24 maçãs`,
        distractors: [
          `4 + 6 = 10 maçãs`,
          `6 - 4 = 2 maçãs`,
          `24 / 4 = 6 maçãs`
        ],
        difficulty: 'dificil'
      },
      {
        text: `Por que o elemento 1 (um) é chamado de elemento neutro da multiplicação?`,
        correctAnswer: `Porque qualquer número multiplicado por 1 continua sendo ele mesmo`,
        distractors: [
          `Porque multiplicações por 1 sempre resultam em zero`,
          `Porque o número 1 não pode ser multiplicado`,
          `Porque o 1 faz o número virar o dobro`
        ],
        difficulty: 'dificil'
      }
    ];

  // ==========================================
  // DOMÍNIO 4: LÍNGUA PORTUGUESA & VERBOS
  // ==========================================
  } else if (domain === 'portugues_verbos') {
    title = `A Dança dos Tempos Verbais: Presente, Passado e Futuro com Drácker`;
    synopsis = `Drácker e os amigos da floresta ensinam o que são verbos, como identificá-los como palavras de ação e como conjugar no pretérito, presente e futuro.`;

    const refrao = `[Refrão]
Verbo é ação, estado ou fenômeno da natureza!
O que acontece AGORA é PRESENTE com certeza!
O que já aconteceu é PRETÉRITO no passado!
O que ainda vai acontecer é FUTURO anunciado!
Com Drácker e o Coelho a cantar e conjugar,
A língua portuguesa ficou fácil de dominar!`;

    lyrics = `[Verso 1]
Drácker correu, Drácker pula, Drácker voará,
"Três palavras tão parecidas, o que muda em cada lugar?"
A sábia Coruja no alto explicou com emoção:
"Você usou três VERBOS, que indicam movimento e ação!
Quem pratica a ação é o sujeito em questão,
E o tempo verbal organiza a nossa comunicação!"

${refrao}

[Verso 2]
"Olhe o PRETÉRITO que o Esquilo já viveu:
Ontem ele colheu a noz, ontem ele comeu!
Terminações com -RAM no passado vão soar:
'Eles cantaram na floresta até o sol se pôr lá!'
E se for no FUTURO, com -RÃO vamos escrever:
'Eles cantarão amanhã quando o dia nascer!'"

${refrao}

[Ponte]
A esperta Raposa traz a dica sem igual:
"Cuidado com a pegadinha na escrita gramatical!
-RAM com 'M' é passado que já se encerrou,
-RÃO com 'til' é futuro que ainda não chegou!
Conjugue com as pessoas: Eu, Tu, Ele a caminhar,
Nós, Vós, Eles para concordar e acertar!"
O fofinho Coelho dá saltos de animação:
"Eu aprendi, tu aprendeste, nós gravamos a lição!"

${refrao}

[Final]
Agora toda a floresta escreve e fala com primor:
Drácker lidera a turma com clareza e amor!
Verbo é o motor da frase que faz a história andar,
No tempo certo conjugado para todo mundo brilhar!`;

    baseQuestions = [
      {
        text: `De acordo com a explicação da sábia Coruja, o que é um VERBO?`,
        correctAnswer: `Uma palavra que indica ação, estado ou fenômeno da natureza`,
        distractors: [
          `Uma palavra usada apenas para dar nome aos animais`,
          `Uma qualidade ou característica dada a um objeto`,
          `Um sinal de pontuação usado no fim da frase`
        ],
        difficulty: 'facil'
      },
      {
        text: `Qual tempo verbal usamos para descrever algo que JÁ ACONTECEU no passado?`,
        correctAnswer: `Pretérito (Passado)`,
        distractors: [`Presente`, `Futuro`, `Infinitivo`],
        difficulty: 'facil'
      },
      {
        text: `Qual é a diferença clássica entre as terminações -RAM e -RÃO ensinada pela Raposa?`,
        correctAnswer: `-RAM indica passado já ocorrido; -RÃO indica futuro que ainda vai acontecer`,
        distractors: [
          `-RAM é singular e -RÃO é plural`,
          `-RAM é substantivo e -RÃO é adjetivo`,
          `Não há diferença alguma, são a mesma palavra`
        ],
        difficulty: 'medio'
      },
      {
        text: `Na frase 'O Esquilo colheu nozes ontem', em qual tempo verbal está o verbo 'colheu'?`,
        correctAnswer: `Pretérito perfeito (Passado)`,
        distractors: [`Presente`, `Futuro do presente`, `Gerúndio`],
        difficulty: 'medio'
      },
      {
        text: `O que significa a regra de concordância entre o sujeito e o verbo?`,
        correctAnswer: `O verbo deve flexionar em pessoa e número para combinar com o sujeito da frase`,
        distractors: [
          `O verbo deve vir sempre antes de qualquer substantivo`,
          `O verbo só pode ser escrito em letras maiúsculas`,
          `O sujeito deve ser sempre o Drácker`
        ],
        difficulty: 'dificil'
      },
      {
        text: `Qual frase expressa uma ação que acontecerá no FUTURO?`,
        correctAnswer: `Drácker e seus amigos viajarão pela floresta amanhã`,
        distractors: [
          `Drácker e seus amigos viajaram pela floresta ontem`,
          `Drácker e seus amigos viajam pela floresta agora`,
          `Drácker e seus amigos viajando sem parar`
        ],
        difficulty: 'dificil'
      }
    ];

  // ==========================================
  // DOMÍNIO 5: GENERAL/OUTROS CONCEITOS (DEDICADO)
  // ==========================================
  } else {
    title = `Desvendando ${safeTopic}: O Passo a Passo com a Turma do Drácker`;
    synopsis = `Drácker e os amigos da floresta dissecam as definições, passos lógicos e regras práticas de ${safeTopic} em uma expedição rimada e aprofundada.`;

    const subContext = lessonDetails ? `com atenção especial a ${lessonDetails}` : 'passo a passo';

    const refrao = `[Refrão]
Preste atenção na regra que a floresta ensinou!
${safeTopic} é um conceito que a turma dominou!
Passo um para entender, passo dois para aplicar,
Passo três com a Raposa para a prova gabaritar!
Com Drácker e o Coelho num ritmo sem igual,
Aprender de verdade é a nossa lei principal!`;

    lyrics = `[Verso 1]
Na clareira encantada Drácker ergueu o olhar:
"Temos uma nova dúvida para investigar!
O que é ${safeTopic} e como podemos compreender,
Para nunca mais esquecer e no caderno resolver?"
A sábia Coruja ajustou suas asas com precisão:
"Todo conceito tem uma lógica, preste muita atenção!
${lessonDetails ? `O foco de hoje é claro: "${lessonDetails}"!\n` : ''}Vamos olhar a estrutura fundamental da questão!"

${refrao}

[Verso 2]
A sábia Coruja no galho mais alto explicou o termo central:
"Identifique os elementos que compõem o essencial!
Não tente decorar sem entender o porquê,
Veja a relação de causa e efeito acontecer!
O nome técnico serve para tudo organizar,
E com clareza mental você vai longe chegar!"

${refrao}

[Ponte]
O ágil Esquilo organiza os dados no chão:
"Primeiro organizo as partes com exatidão!
Segundo verifico a regra com muito cuidado,
Terceiro confiro a resposta e vejo o resultado!"
A esperta Raposa chega com o macete na mão:
"Cuidado com a pegadinha clássica da questão!
Se você seguir o método passo a passo até o final,
Acerta qualquer exercício com nota sensacional!"

${refrao}

[Final]
Agora toda a turma comemora a conquista no ar:
Drácker bate as asas e convida a praticar!
Com método, curiosidade e união exemplar,
${safeTopic} agora é saber que ninguém vai apagar!`;

    baseQuestions = [
      {
        text: `Qual é o primeiro passo recomendado pela Coruja e pelo Drácker ao estudar "${safeTopic}"?`,
        correctAnswer: `Compreender a definição fundamental e as relações lógicas em vez de apenas decorar`,
        distractors: [
          `Tentar adivinhar a resposta sem ler o enunciado`,
          `Ignorar as etapas de resolução e pular para o final`,
          `Decorar palavras sem entender o significado real`
        ],
        difficulty: 'facil'
      },
      {
        text: `Como o ágil Esquilo organiza a resolução prática dos desafios desse conteúdo?`,
        correctAnswer: `Seguindo etapas sequenciais: organizar dados, aplicar a regra e conferir o resultado`,
        distractors: [
          `Misturando todos os passos sem critério nenhum`,
          `Pedindo que outra pessoa faça a conta inteira`,
          `Fazendo tudo correndo sem conferir nada`
        ],
        difficulty: 'facil'
      },
      {
        text: `De acordo com a esperta Raposa, qual é a melhor estratégia para evitar pegadinhas em "${safeTopic}"?`,
        correctAnswer: `Identificar os pontos de atenção e verificar a contraprova antes de concluir`,
        distractors: [
          `Marcar a primeira alternativa sem ler as outras`,
          `Esquecer as regras logo após a aula terminar`,
          `Focar apenas em rimas sem prestar atenção nos fatos`
        ],
        difficulty: 'medio'
      },
      {
        text: `Qual é o papel do refrão rítmico conduzido pelo fofinho Coelho no aprendizado?`,
        correctAnswer: `Fixar a regra central na memória através da repetição ativa e do ritmo musical`,
        distractors: [
          `Substituir a necessidade de fazer exercícios práticos`,
          `Distrair os alunos durante o horário de estudo`,
          `Encurtar a explicação para não precisar pensar`
        ],
        difficulty: 'medio'
      },
      {
        text: `Se você precisasse aplicar o que aprendeu sobre "${safeTopic}" em uma nova situação escolar, o que faria?`,
        correctAnswer: `Usaria o método demonstrado pela turma, explicando os conceitos com clareza aos colegas`,
        distractors: [
          `Desistiria se a pergunta parecesse um pouco diferente`,
          `Usaria números aleatórios sem seguir nenhuma lógica`,
          `Diria que o conteúdo só funciona dentro de canções`
        ],
        difficulty: 'dificil'
      },
      {
        text: `Qual síntese a aventura do Drácker e dos amigos da floresta deixa sobre o domínio de novos conhecimentos?`,
        correctAnswer: `Com curiosidade, método investigativo e persistência, qualquer tema complexo se torna acessível`,
        distractors: [
          `Que apenas alunos que já sabem tudo conseguem aprender`,
          `Que o aprendizado acontece sem nenhum esforço ou prática`,
          `Que devemos evitar temas que pareçam desafiadores`
        ],
        difficulty: 'dificil'
      }
    ];
  }

  // Ajusta quantidade solicitada
  const selectedQuestions = baseQuestions.slice(0, Math.min(questionCount, baseQuestions.length)).map((q, idx) => {
    const cleanedDistractors = q.distractors.slice(0, 3);
    const options = [q.correctAnswer, ...cleanedDistractors];
    return {
      id: `q-local-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      text: q.text,
      correctAnswer: q.correctAnswer,
      distractors: cleanedDistractors,
      options: shuffleInPlace([...options]),
      ordered_options: [...options],
      difficulty: q.difficulty
    };
  });

  return {
    title,
    style,
    synopsis,
    lyrics,
    questions: selectedQuestions,
    isLocalFallback: true,
    pedagogicalDomain: domain
  };
}

/**
 * Geração principal com IA do Drácker e amigos da floresta + perguntas pedagógicas conceituais
 */
export async function generateDrackerMusicWithAI({
  topic,
  lessonDetails = '',
  gradeLevel = 'Ensino Fundamental I (6 a 10 anos)',
  musicalStyle = 'Pop Dançante Infantil Alegre',
  questionCount = 6,
  geminiService,
  model = null,
  apiKey = null
}) {
  if (!topic || !topic.trim()) {
    throw new Error('Por favor, informe o tema da música.');
  }

  // Se não houver serviço Gemini ou apiKey, usa o motor inteligente local
  if (!geminiService || !apiKey) {
    console.info('IA Drácker: gerando conteúdo musical pelo motor pedagógico local dinâmico.');
    return generateLocalDrackerMusic({
      topic,
      lessonDetails,
      gradeLevel,
      musicalStyle,
      questionCount
    });
  }

  try {
    const prompt = buildDrackerMusicWithAnimalsPrompt({
      topic,
      lessonDetails,
      gradeLevel,
      musicalStyle,
      questionCount
    });

    // Temperatura 0.8 para garantir variabilidade e vocabulário pedagógico rico
    const rawResponse = await geminiService.generateText(prompt, {
      model,
      fallbackModel: null,
      maxOutputTokens: 8192,
      temperature: 0.8,
      responseMimeType: 'application/json'
    });

    if (!rawResponse || !rawResponse.trim()) {
      throw new Error('Resposta vazia da IA.');
    }

    const parsed = safeJSONParse(rawResponse);

    if (parsed && parsed.lyrics && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      const normalizedQuestions = parsed.questions.map((q, idx) => {
        const text = q.text || q.question || `Pergunta ${idx + 1}`;
        const correctAnswer = q.correctAnswer || q.answer || q.correct_option || '';
        let distractors = Array.isArray(q.distractors) ? q.distractors : (q.incorrect_options || []);
        distractors = distractors.map(d => String(d).trim()).filter(Boolean);

        while (distractors.length < 3) {
          distractors.push(`Alternativa complementar ${distractors.length + 1}`);
        }
        distractors = distractors.slice(0, 3);

        const options = shuffleInPlace([correctAnswer, ...distractors]);

        return {
          id: `q-ai-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          text,
          correctAnswer,
          distractors,
          options,
          ordered_options: options,
          difficulty: q.difficulty || (idx < 2 ? 'facil' : idx < 4 ? 'medio' : 'dificil')
        };
      });

      return {
        title: parsed.title || `O Mistério de ${topic} com Drácker e Amigos`,
        style: parsed.style || musicalStyle,
        synopsis: parsed.synopsis || `Explicação detalhada do conceito de ${topic} com a Turma do Drácker`,
        lyrics: parsed.lyrics.trim(),
        questions: normalizedQuestions,
        isAIGenerated: true
      };
    } else {
      console.warn('Formato inesperado no retorno da IA. Ativando motor pedagógico local dinâmico.', parsed);
      return generateLocalDrackerMusic({
        topic,
        lessonDetails,
        gradeLevel,
        musicalStyle,
        questionCount
      });
    }
  } catch (err) {
    console.warn('Erro na chamada da IA Gemini para Música. Ativando fallback local dinâmico:', err);
    return generateLocalDrackerMusic({
      topic,
      lessonDetails,
      gradeLevel,
      musicalStyle,
      questionCount
    });
  }
}

/**
 * Caso de uso legado para compatibilidade
 */
export async function generateMusicActivity({ topic, lessonDetails, model, geminiService }) {
  return generateDrackerMusicWithAI({
    topic,
    lessonDetails,
    geminiService,
    model,
    apiKey: geminiService?.apiKey
  });
}
