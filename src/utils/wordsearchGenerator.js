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
  directions = { horizontal: true, vertical: false, diagonal: false, reverse: false }
) => {
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(''));
  const placedWords = [];
  const placements = [];
  // Alfabeto estendido para incluir acentos na "sopa" (proporcionalmente menos frequentes)
  const baseAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const accents = 'ÁÉÍÓÚÂÊÔÃÕÇ';
  // Mistura: Acentuados aparecem com chance menor
  const alphabet = baseAlphabet.repeat(4) + accents;

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
    .map(w => w.toUpperCase().replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, '').slice(0, Math.max(rows, cols)))
    .filter(w => w.length >= 3)
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
