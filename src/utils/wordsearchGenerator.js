// Utilitário para geração de caça-palavras

/**
 * Normaliza palavra removendo acentos/diacríticos e caracteres não alfabéticos
 */
export const normalizeForGrid = (word) => {
  return (word || '')
    .toLowerCase()
    .normalize('NFD')
    //.replace(/[\u0300-\u036f]/g, '') // Mantém acentos
    .replace(/[^a-záéíóúâêôãõç]/g, '');
};

/**
 * Extrai palavras significativas do texto por frequência
 */
export const extractWords = (text, count = 10) => {
  const cleaned = (text || '')
    .toLowerCase()
    .replace(/[^a-záéíóúâêôãõç\s]/gi, ' ');

  const raw = cleaned.match(/\b[a-záéíóúâêôãõç]{3,}\b/gi) || [];
  const stopWords = new Set([
    'que', 'para', 'com', 'uma', 'por', 'este', 'esta', 'isso',
    'como', 'mais', 'menos', 'muito', 'pouco', 'todos', 'todas',
    'entre', 'sobre', 'pois', 'quando', 'onde', 'entao', 'então',
    'porque', 'porquê', 'seu', 'sua', 'seus', 'suas', 'nos', 'nós',
    'eles', 'elas', 'voce', 'você', 'tema', 'texto', 'atividade',
    'palavras', 'encontrar'
  ]);

  const freq = new Map();
  for (const w of raw) {
    const norm = normalizeForGrid(w);
    if (norm.length < 4 || norm.length > 12) continue;
    if (stopWords.has(norm)) continue;
    freq.set(norm, (freq.get(norm) || 0) + 1);
  }

  const sorted = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w.toUpperCase());

  return sorted.slice(0, count);
};

/**
 * Gera grade de caça-palavras
 */
export const generateWordSearch = (
  selectedWords,
  rows = 15,
  cols = 15,
  directions = { horizontal: true, vertical: false, diagonal: false, reverse: false },
  alphabetType = 'text'
) => {
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(''));
  const placedWords = [];
  const placements = [];
  
  let alphabet = '';
  if (alphabetType === 'numeric') {
    alphabet = '0123456789';
  } else {
    // Alfabeto estendido para incluir acentos na "sopa" (proporcionalmente menos frequentes)
    const baseAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const accents = 'ÁÉÍÓÚÂÊÔÃÕÇ';
    // Mistura: Acentuados aparecem com chance menor
    alphabet = baseAlphabet.repeat(4) + accents;
  }

  // Define vetores de direção conforme configurações
  const dirVecs = [];
  const addDir = (dx, dy) => dirVecs.push([dx, dy]);

  if (directions.horizontal) {
    addDir(0, 1);
    if (directions.reverse) addDir(0, -1);
  }
  if (directions.vertical) {
    addDir(1, 0);
    if (directions.reverse) addDir(-1, 0);
  }
  if (directions.diagonal) {
    addDir(1, 1);
    if (directions.reverse) addDir(-1, -1);
  }

  // Fallback se nenhuma direção marcada
  if (dirVecs.length === 0) dirVecs.push([0, 1]);

  // Coloca palavras maiores primeiro para melhor encaixe
  const words = [...selectedWords]
    .map(w => alphabetType === 'numeric' 
        ? w.replace(/[^0-9]/g, '').slice(0, Math.max(rows, cols)) 
        : w.toUpperCase().replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, '').slice(0, Math.max(rows, cols)))
    .filter(w => w.length >= (alphabetType === 'numeric' ? 1 : 3))
    .sort((a, b) => b.length - a.length);

  const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;

  for (const w of words) {
    let placed = false;

    // Tenta diversas posições e direções
    for (let attempts = 0; attempts < 200 && !placed; attempts++) {
      const dir = dirVecs[Math.floor(Math.random() * dirVecs.length)];
      const [dx, dy] = dir;

      // Calcula faixa válida para início
      const maxRow = dx >= 0 ? rows - 1 - dx * (w.length - 1) : rows - 1;
      const maxCol = dy >= 0 ? cols - 1 - dy * (w.length - 1) : cols - 1;
      const minRow = dx < 0 ? (w.length - 1) : 0;
      const minCol = dy < 0 ? (w.length - 1) : 0;

      const row = Math.floor(Math.random() * (maxRow - minRow + 1)) + minRow;
      const col = Math.floor(Math.random() * (maxCol - minCol + 1)) + minCol;

      let canPlace = true;
      for (let i = 0; i < w.length; i++) {
        const r = row + dx * i;
        const c = col + dy * i;
        if (!inBounds(r, c)) {
          canPlace = false;
          break;
        }
        const cell = grid[r][c];
        if (cell && cell !== w[i]) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        const cells = [];
        for (let i = 0; i < w.length; i++) {
          const r = row + dx * i;
          const c = col + dy * i;
          grid[r][c] = w[i];
          cells.push([r, c]);
        }
        placedWords.push(w);
        placements.push({ word: w, positions: cells });
        placed = true;
      }
    }
  }

  // Preenche espaços vazios com letras aleatórias
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (!grid[i][j]) {
        grid[i][j] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid, words: placedWords, placements };
};

/**
 * Gera operações matemáticas sem duplicatas de resposta nem de enunciado.
 */
export const generateMathProblems = (count, maxOrder, operations, multMaxOrder = 1, divMaxOrder = 1, specificDivisor = 'random') => {
  const maxNum = Math.pow(10, maxOrder) - 1;
  const problems = [];
  const usedAnswers = new Set();
  const usedProblems = new Set();

  const MAX_ATTEMPTS = count * 20; // Limite de tentativas para evitar loop infinito

  for (let i = 0; i < MAX_ATTEMPTS && problems.length < count; i++) {
    const op = operations[Math.floor(Math.random() * operations.length)];
    let a, b, answer;

    if (op === '+') {
      answer = Math.floor(Math.random() * maxNum) + 1;
      a = Math.floor(Math.random() * answer);
      b = answer - a;
    } else if (op === '-') {
      answer = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * (answer)); // b < answer para resultado positivo
      a = answer + b;
      // Garante que a fica dentro do limite de dígitos
      if (a > Math.pow(10, maxOrder + 1) - 1) continue;
    } else if (op === '*') {
      const maxA = Math.pow(10, maxOrder) - 1;
      const maxB = Math.pow(10, multMaxOrder) - 1;
      a = Math.floor(Math.random() * maxA) + 1;
      b = Math.floor(Math.random() * maxB) + 1;
      answer = a * b;
    } else if (op === '/') {
      const maxAnswer = Math.pow(10, maxOrder) - 1;
      
      if (divMaxOrder === 1 && specificDivisor !== 'random') {
          b = parseInt(specificDivisor);
      } else {
          const maxB = Math.pow(10, divMaxOrder) - 1;
          // Divisores devem ser a partir de 2, caso contrário a divisão por 1 ou 0 não é muito útil educacionalmente
          // Se maxB for 1, a matemática vai forçar divisor 1 se não ajustarmos, mas o código anterior usava floor(random * maxB) + 1
          // Vamos manter a partir de 2 se o limite permitir, ou 1 a 9.
          b = Math.floor(Math.random() * (maxB - 1)) + 2; 
          // Correção de fallback se maxB for 1, embora maxB = 10^1 - 1 = 9
      }
      
      answer = Math.floor(Math.random() * maxAnswer) + 1;
      a = answer * b;
    }

    // Descarta respostas de 1 dígito se ordem > 1 (muito fácil para cruzadinha)
    if (maxOrder > 1 && answer < 10) continue;

    const answerStr = answer.toString();
    let opSymbol = op;
    if (op === '*') opSymbol = 'x';
    if (op === '/') opSymbol = '÷';

    const problemStr = `${a} ${opSymbol} ${b} = ?`;

    // Descarta se a resposta OU o enunciado já foram usados
    if (usedAnswers.has(answerStr)) continue;
    if (usedProblems.has(problemStr)) continue;

    usedAnswers.add(answerStr);
    usedProblems.add(problemStr);
    problems.push({ problem: problemStr, answer: answerStr });
  }

  return problems;
};
