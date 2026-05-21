/**
 * Utilitário para geração de palavras cruzadas via Backtracking.
 * Tenta conectar as palavras em uma grade vazia.
 */

export const generateCrossword = (wordsWithClues, gridSize = 15) => {
    // wordsWithClues: [{ word: 'MELANCIA', clue: 'Fruta...' }, ...]

    // ── 1. Sanitização e deduplicação ──────────────────────────────────────
    // Remove entradas com palavra ou dica vazia
    const cleaned = (wordsWithClues || [])
        .filter(w => w.word && w.word.toString().trim() !== '' && w.clue && w.clue.toString().trim() !== '')
        .map(w => ({
            ...w,
            word: w.word.toString().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
            clue: w.clue.toString().trim(),
        }))
        .filter(w => w.word.length > 0); // Remove palavras que viraram string vazia após normalização

    // Remove duplicatas de palavra (mantém a primeira ocorrência)
    const seenWords = new Set();
    const seenClues = new Set();
    const unique = cleaned.filter(w => {
        if (seenWords.has(w.word)) return false;
        if (seenClues.has(w.clue.toLowerCase())) return false;
        seenWords.add(w.word);
        seenClues.add(w.clue.toLowerCase());
        return true;
    });

    // ── 2. Ordena da maior para menor para facilitar encaixe ────────────────
    const sortedWords = [...unique]
        .filter(w => w.word.length > 0 && w.word.length <= gridSize)
        .sort((a, b) => b.word.length - a.word.length);

    let bestResult = null;
    let maxWordsPlaced = 0;

    // Tenta gerar N vezes e escolhe a melhor (com mais palavras conectadas)
    for (let attempt = 0; attempt < 10; attempt++) {
        const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null)); // null = vazio
        const placed = [];

        // 1. Coloca a primeira palavra no meio (Alterna H e V para dar mais chances de balanceamento)
        if (sortedWords.length > 0) {
            const first = sortedWords[0];
            const startDir = attempt % 2 === 0 ? 'H' : 'V';
            const startCol = startDir === 'H' ? Math.floor((gridSize - first.word.length) / 2) : Math.floor(gridSize / 2);
            const startRow = startDir === 'V' ? Math.floor((gridSize - first.word.length) / 2) : Math.floor(gridSize / 2);

            if (placeWord(grid, first.word, startCol, startRow, startDir)) {
                placed.push({ ...first, x: startCol, y: startRow, dir: startDir });
            }
        }

        // 2. Tenta encaixar as demais
        for (let i = 1; i < sortedWords.length; i++) {
            const currentObj = sortedWords[i];
            const w = currentObj.word;
            let inserted = false;

            // Busca interseções possíveis com palavras já colocadas
            // Itera aleatoriamente sobre as palavras já colocadas para dar variedade
            const shuffledPlaced = [...placed].sort(() => Math.random() - 0.5);

            for (const p of shuffledPlaced) {
                if (inserted) break;

                // Tenta cruzar cada letra da palavra candidata com cada letra da palavra já colocada
                for (let j = 0; j < w.length; j++) { // Indice na palavra candidata
                    const charC = w[j];

                    for (let k = 0; k < p.word.length; k++) { // Indice na palavra colocada
                        const charP = p.word[k];

                        if (charC === charP) {
                            // Ponto de interseção
                            // Se a colocada é H, a nova deve ser V, e vice-versa
                            const newDir = p.dir === 'H' ? 'V' : 'H';

                            // Calcula posição inicial da nova palavra baseada na interseção
                            // Se p é H em (px, py), a letra k está em (px+k, py)
                            // A nova palavra (V) deve ter a letra j em (px+k, py)
                            // Logo, inicio da nova (V) é x = px+k, y = py-j

                            // Se p é V em (px, py), a letra k está em (px, py+k)
                            // Nova (H) deve ter letra j em (px, py+k)
                            // Inicio nova (H) é x = px-j, y = py+k

                            let nx, ny;
                            if (p.dir === 'H') {
                                nx = p.x + k;
                                ny = p.y - j;
                            } else {
                                nx = p.x - j;
                                ny = p.y + k;
                            }

                            if (canPlace(grid, w, nx, ny, newDir, gridSize)) {
                                placeWord(grid, w, nx, ny, newDir);
                                placed.push({ ...currentObj, x: nx, y: ny, dir: newDir });
                                inserted = true;
                                break;
                            }
                        }
                    }
                    if (inserted) break;
                }
            }
        }

        const countH = placed.filter(p => p.dir === 'H').length;
        const countV = placed.length - countH;
        const balance = Math.abs(countH - countV);

        // Escolhe a tentativa que colocou mais palavras. Em caso de empate, escolhe a mais balanceada entre H e V.
        if (placed.length > maxWordsPlaced || (placed.length === maxWordsPlaced && bestResult && balance < bestResult.balance)) {
            maxWordsPlaced = placed.length;
            bestResult = { grid, placed, balance };
        }

        // Se encaixou todas, para de tentar
        if (placed.length === sortedWords.length) break;
    }

    if (!bestResult) return { grid: [], placed: [] };

    // 3. Tenta encaixar as palavras não cruzadas ("ilhas") na melhor grade gerada
    const initiallyUnplaced = sortedWords.filter(sw => !bestResult.placed.find(pw => pw.word === sw.word));
    for (const sw of initiallyUnplaced) {
        let inserted = false;
        
        // Prioriza a direção que tem MENOS palavras atualmente para manter a grade compacta e balanceada
        const numH = bestResult.placed.filter(p => p.dir === 'H').length;
        const numV = bestResult.placed.length - numH;
        const dirs = numH > numV ? ['V', 'H'] : ['H', 'V'];
        const coords = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                coords.push({r, c});
            }
        }
        // Embaralha coordenadas para que as ilhas não fiquem todas presas no topo esquerdo
        coords.sort(() => Math.random() - 0.5);

        for (const dir of dirs) {
            if (inserted) break;
            for (const {r, c} of coords) {
                if (canPlace(bestResult.grid, sw.word, c, r, dir, gridSize)) {
                    placeWord(bestResult.grid, sw.word, c, r, dir);
                    bestResult.placed.push({ ...sw, x: c, y: r, dir });
                    inserted = true;
                    break;
                }
            }
        }
    }

    // Normalização final das coordenadas e numeração
    // Ordena por posição Y depois X para numerar questões de cima para baixo, esq para direita
    const finalPlaced = bestResult.placed.map((w, idx) => ({ ...w, num: 0 })); // num temp

    // Numeração lógica (opcional, pode ser feita no render)
    // Vamos apenas retornar a lista com coordenadas validas
    return {
        grid: bestResult.grid,
        words: finalPlaced,
        unplaced: sortedWords.filter(sw => !bestResult.placed.find(pw => pw.word === sw.word))
    };
};

function placeWord(grid, word, x, y, dir) {
    if (dir === 'H') {
        for (let i = 0; i < word.length; i++) {
            grid[y][x + i] = word[i];
        }
    } else {
        for (let i = 0; i < word.length; i++) {
            grid[y + i][x] = word[i];
        }
    }
    return true;
}

function canPlace(grid, word, x, y, dir, size) {
    // Limites básicos
    if (x < 0 || y < 0) return false;
    if (dir === 'H') {
        if (x + word.length > size) return false;
    } else {
        if (y + word.length > size) return false;
    }

    // Verifica colisões e regras de adjacência
    // Regra: Uma célula pode ser:
    // 1. Vazia (null) -> Pode usar, se não criar cluster indesejado (letras grudadas sem sentido)
    // 2. Mesma letra -> Pode cruzar
    // 3. Letra diferente -> Falha

    // Além disso, não pode tocar em outras palavras nas pontas ou laterais onde não há cruzamento

    for (let i = 0; i < word.length; i++) {
        let cx = dir === 'H' ? x + i : x;
        let cy = dir === 'H' ? y : y + i;
        const char = word[i];
        const cell = grid[cy][cx];

        // 1. Colisao direta
        if (cell !== null && cell !== char) return false;

        // 2. Verificar vizinhos (para não grudar palavras paralelamente)
        // Se a célula já tem o char correto (interseção), não precisamos checar vizinhos 'perpendiculares' pois já está validada pela outra palavra.
        // Mas se a célula é NULL (estamos preenchendo espaço vazio), precisamos garantir que não estamos encostando em nada

        if (cell === null) {
            // Verifica adjacências que não sejam a própria linha da palavra
            // Se H, checa acima e abaixo. Se V, checa esq e dir.
            // A MENOS que seja um ponto de cruzamento futuro (mas aqui é null, então não é cruzamento)

            if (dir === 'H') {
                if (cy > 0 && grid[cy - 1][cx] !== null) return false; // Vizinho Top
                if (cy < size - 1 && grid[cy + 1][cx] !== null) return false; // Vizinho Bottom
            } else {
                if (cx > 0 && grid[cy][cx - 1] !== null) return false; // Vizinho Left
                if (cx < size - 1 && grid[cy][cx + 1] !== null) return false; // Vizinho Right
            }
        }
    }

    // Verificar as pontas (antes da primeira letra e depois da última)
    // Não pode haver letra imediatamente antes ou depois
    if (dir === 'H') {
        if (x > 0 && grid[y][x - 1] !== null) return false;
        if (x + word.length < size && grid[y][x + word.length] !== null) return false;
    } else {
        if (y > 0 && grid[y - 1][x] !== null) return false;
        if (y + word.length < size && grid[y + word.length][x] !== null) return false;
    }

    return true;
}
