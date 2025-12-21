# 🔧 Referência Técnica - Implementação de Toque em Palavras Cruzadas

## 📖 Índice
1. [States](#states)
2. [Funções Principais](#funções-principais)
3. [Event Handlers](#event-handlers)
4. [Integração no JSX](#integração-no-jsx)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Customização](#customização)

---

## States

### Definição

```javascript
// --- TOUCH/DRAG SELECTION STATE ---
const [isSelectingWord, setIsSelectingWord] = useState(false);
// Indica se o usuário está no processo de seleção (touch down)

const [selectedCells, setSelectedCells] = useState(new Set());
// Armazena as coordenadas das células selecionadas como strings "x-y"

const [touchStartCell, setTouchStartCell] = useState(null);
// Armazena a célula onde o toque começou {x, y}

const gridRef = useRef(null);
// Referência ao elemento DOM do grid para detecção de ponto
```

### Estrutura de Dados

```javascript
// selectedCells Example:
// Set { "3-2", "4-2", "5-2", "6-2" }
// Representa células de palavra horizontal

// touchStartCell Example:
// { x: 3, y: 2 }
// Célula onde usuario tocou inicialmente
```

---

## Funções Principais

### 1. getCellFromPoint()

**Objetivo:** Obter coordenadas da célula a partir de coordenadas do mouse/toque

```javascript
const getCellFromPoint = (clientX, clientY) => {
    if (!gridRef.current) return null;
    
    // Obtém elemento no ponto de coordenadas
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) return null;
    
    // Extrai x, y do ID do elemento (formato: cell-X-Y)
    const cellMatch = element.id?.match(/cell-(\d+)-(\d+)/);
    if (cellMatch) {
        return { x: parseInt(cellMatch[1]), y: parseInt(cellMatch[2]) };
    }
    return null;
};

// Uso:
// const cell = getCellFromPoint(50, 100);
// console.log(cell); // { x: 2, y: 3 }
```

**Problema Resolvido:** Touch events retornam coordenadas de viewport, não de elemento específico

---

### 2. getWordsAtCell()

**Objetivo:** Encontrar todas as palavras que passam por uma célula específica

```javascript
const getWordsAtCell = (x, y) => {
    return words.filter(w => {
        if (w.dir === 'H') {
            // Horizontal: mesma linha (y), coluna (x) entre início e fim
            return w.y === y && x >= w.x && x < w.x + w.word.length;
        } else {
            // Vertical: mesma coluna (x), linha (y) entre início e fim
            return w.x === x && y >= w.y && y < w.y + w.word.length;
        }
    });
};

// Uso:
// const words = getWordsAtCell(5, 10);
// console.log(words);
// [
//   { word: "GATO", dir: "H", x: 3, y: 10, ... },
//   { word: "MAGO", dir: "V", x: 5, y: 8, ... }
// ]
```

**Lógica:**
```
Célula (5, 10)

Horizontal:
┌─────────────────────────┐
│ y=10: [3][4][5]✓[6][7] │  ← y === 10, x dentro do range
└─────────────────────────┘

Vertical:
┌───────┐
│ x=5   │
├───┬───┤
│ y=8   │
│ y=9   │
│ y=10  │✓  ← x === 5, y dentro do range
│ y=11  │
└───┴───┘
```

---

### 3. getWordCells()

**Objetivo:** Obter array de todas as células que compõem uma palavra

```javascript
const getWordCells = (word) => {
    const cells = [];
    
    for (let i = 0; i < word.word.length; i++) {
        if (word.dir === 'H') {
            cells.push({ 
                x: word.x + i,  // Move horizontalmente
                y: word.y       // Y fixo
            });
        } else {
            cells.push({ 
                x: word.x,      // X fixo
                y: word.y + i   // Move verticalmente
            });
        }
    }
    
    return cells;
};

// Uso:
// const cells = getWordCells({ word: "GATO", dir: "H", x: 2, y: 5, ... });
// console.log(cells);
// [
//   { x: 2, y: 5 },
//   { x: 3, y: 5 },
//   { x: 4, y: 5 },
//   { x: 5, y: 5 }
// ]
```

**Visualização:**
```
Horizontal "GATO" em (2,5):
  0   1   2   3   4   5   6
0 [ ] [ ] [ ] [ ] [ ] [ ] [ ]
1 [ ] [ ] [ ] [ ] [ ] [ ] [ ]
2 [ ] [ ] [ ] [ ] [ ] [ ] [ ]
3 [ ] [ ] [ ] [ ] [ ] [ ] [ ]
4 [ ] [ ] [ ] [ ] [ ] [ ] [ ]
5 [ ] [ ] [G] [A] [T] [O] [ ]  ← Aqui
6 [ ] [ ] [ ] [ ] [ ] [ ] [ ]

Retorna: [(2,5), (3,5), (4,5), (5,5)]
```

---

### 4. selectWord()

**Objetivo:** Marcar uma palavra como selecionada

```javascript
const selectWord = (word) => {
    // Obtém todas as células da palavra
    const cells = getWordCells(word);
    
    // Converte para Set com formato "x-y"
    const cellSet = new Set(cells.map(c => `${c.x}-${c.y}`));
    
    // Atualiza estado
    setSelectedCells(cellSet);
};

// Uso:
// selectWord({ word: "GATO", dir: "H", x: 2, y: 5, ... });
// Agora selectedCells contém: Set { "2-5", "3-5", "4-5", "5-5" }
```

**Por que usar Set?**
```javascript
// Lookup O(1) vs Array O(n)
const isSelected = selectedCells.has("3-5");  // Rápido!

// vs
const isSelected = selectedArray.includes("3-5");  // Lento com muitas células
```

---

### 5. handleGridCellClick()

**Objetivo:** Permitir ciclar entre palavras quando há múltiplas na mesma célula

```javascript
const handleGridCellClick = (x, y) => {
    // Obtém todas as palavras nesta célula
    const wordsAtCell = getWordsAtCell(x, y);
    if (wordsAtCell.length === 0) return;

    // Se nada está selecionado, seleciona primeira palavra
    if (selectedCells.size === 0) {
        selectWord(wordsAtCell[0]);
        return;
    }

    // Verifica qual palavra atual está selecionada
    const currentWordCells = wordsAtCell.map(w => getWordCells(w));
    let currentWordIndex = -1;

    for (let i = 0; i < currentWordCells.length; i++) {
        const wordCellSet = new Set(currentWordCells[i].map(c => `${c.x}-${c.y}`));
        
        // Compara o tamanho e cada célula
        if (
            wordCellSet.size === selectedCells.size &&
            Array.from(wordCellSet).every(c => selectedCells.has(c))
        ) {
            currentWordIndex = i;
            break;
        }
    }

    // Move para próxima palavra (com ciclo)
    const nextIndex = (currentWordIndex + 1) % wordsAtCell.length;
    selectWord(wordsAtCell[nextIndex]);
};

// Fluxo:
// 1º Click: [Palavra 1 selecionada]
// 2º Click: [Palavra 2 selecionada]
// 3º Click: [Palavra 1 selecionada] (volta ao início)
```

---

## Event Handlers

### 1. handleTouchStart()

```javascript
const handleTouchStart = (e) => {
    const touch = e.touches[0];  // Pega primeiro toque
    const cell = getCellFromPoint(touch.clientX, touch.clientY);
    
    if (cell) {
        setTouchStartCell(cell);           // Registra início
        setIsSelectingWord(true);          // Marca como selecionando
        
        // Auto-seleciona primeira palavra nesta célula
        const wordsAtCell = getWordsAtCell(cell.x, cell.y);
        if (wordsAtCell.length > 0) {
            selectWord(wordsAtCell[0]);
        }
    }
};
```

**Timeline:**
```
touch.touches[0] → clientX, clientY (coordenadas globais)
                     ↓
                getCellFromPoint (converte para célula)
                     ↓
                setTouchStartCell, setIsSelectingWord
                     ↓
                getWordsAtCell (encontra palavras)
                     ↓
                selectWord (marca selecionada)
```

---

### 2. handleTouchMove()

```javascript
const handleTouchMove = (e) => {
    if (!isSelectingWord || !touchStartCell) return;  // Guard
    
    const touch = e.touches[0];
    const currentCell = getCellFromPoint(touch.clientX, touch.clientY);
    if (!currentCell) return;

    // Calcula diferença
    const dx = currentCell.x - touchStartCell.x;  // Δx
    const dy = currentCell.y - touchStartCell.y;  // Δy
    
    // Determina direção principal
    const isHorizontal = Math.abs(dx) > Math.abs(dy);

    // Encontra palavra na direção do movimento
    const wordsAtStart = getWordsAtCell(touchStartCell.x, touchStartCell.y);
    let selectedWord = null;

    if (isHorizontal) {
        selectedWord = wordsAtStart.find(w => w.dir === 'H');
    } else {
        selectedWord = wordsAtStart.find(w => w.dir === 'V');
    }

    if (selectedWord) {
        selectWord(selectedWord);
    }
};

// Lógica de Direção:
/*
Touch Start: (5, 10)
Touch Move:  (8, 10)

dx = 8 - 5 = 3
dy = 10 - 10 = 0

|3| > |0| → isHorizontal = true
           → Seleciona palavra H

---

Touch Start: (5, 10)
Touch Move:  (5, 14)

dx = 5 - 5 = 0
dy = 14 - 10 = 4

|0| > |4| → false (não é isHorizontal)
         → Seleciona palavra V
*/
```

---

### 3. handleTouchEnd()

```javascript
const handleTouchEnd = (e) => {
    setIsSelectingWord(false);  // Para seleção
    
    // Foca na primeira célula selecionada
    if (selectedCells.size > 0) {
        const cellArray = Array.from(selectedCells)
            .map(c => c.split('-').map(Number));  // "2-5" → [2, 5]
        
        if (cellArray.length > 0) {
            const firstCell = cellArray[0];
            const el = document.getElementById(`cell-${firstCell[0]}-${firstCell[1]}`);
            
            if (el) {
                el.focus();  // Foca para digitação
            }
        }
    }
};

// Resultado: Usuário pode digitar imediatamente após seleção
```

---

## Integração no JSX

### 1. Grid Container

```jsx
<div
    ref={gridRef}  // ← Referência para detecção
    className="grid gap-0 ... select-none"
    style={{
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
        width: 'fit-content',
        userSelect: 'none'  // ← Evita seleção de texto
    }}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
>
    {/* Células aqui */}
</div>
```

---

### 2. Célula Individual

```jsx
<div
    className={`
        relative w-8 h-8 sm:w-10 sm:h-10
        flex items-center justify-center
        ${isSelected ? 'bg-amber-200' : 'bg-white'}
        border border-brown-900
        transition-colors duration-75
    `}
    style={{ printColorAdjust: 'exact' }}
>
    <input
        id={`cell-${x}-${y}`}
        type="text"
        maxLength={1}
        className={`w-full h-full ... ${cell.status ? ... : 'text-brown-900'}`}
        value={cell.input}
        onChange={(e) => handleCellInput(x, y, e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, x, y)}
        onClick={() => handleGridCellClick(x, y)}
    />
</div>
```

---

## Exemplos de Uso

### Exemplo 1: Seleção Básica

```javascript
// Usuário toca em célula (3, 5)
// Palavra: "GATO" horizontal de (2, 5) a (5, 5)

// Resultado:
selectedCells = Set { "2-5", "3-5", "4-5", "5-5" }

// Renderização:
// [G] [A] [T] [O]  ← Todas com fundo amarelo
```

---

### Exemplo 2: Swipe Horizontal

```javascript
// Touch Start: (2, 5)
// Touch Move:  (5, 5)  // Deslizou para direita
// dx = 3, dy = 0

// isHorizontal = true
// Busca palavra H em (2, 5)
// Encontra: "GATO"
// Seleciona: Set { "2-5", "3-5", "4-5", "5-5" }
```

---

### Exemplo 3: Swipe Vertical

```javascript
// Touch Start: (5, 3)
// Touch Move:  (5, 7)  // Deslizou para baixo
// dx = 0, dy = 4

// isHorizontal = false
// Busca palavra V em (5, 3)
// Encontra: "MAGO"
// Seleciona: Set { "5-3", "5-4", "5-5", "5-6" }
```

---

### Exemplo 4: Ciclo de Palavras

```javascript
// Célula (5, 5) contém:
// - "GATO" (H): cells { "2-5", "3-5", "4-5", "5-5" }
// - "MAGO" (V): cells { "5-3", "5-4", "5-5", "5-6" }

// 1º Click em (5, 5):
// selectedCells = Set { "2-5", "3-5", "4-5", "5-5" }  (H selecionada)

// 2º Click em (5, 5):
// currentWordIndex = 0
// nextIndex = (0 + 1) % 2 = 1
// selectedCells = Set { "5-3", "5-4", "5-5", "5-6" }  (V selecionada)

// 3º Click em (5, 5):
// currentWordIndex = 1
// nextIndex = (1 + 1) % 2 = 0
// selectedCells = Set { "2-5", "3-5", "4-5", "5-5" }  (H novamente)
```

---

## Customização

### 1. Alterar Cor de Seleção

**Arquivo:** `src/components/CrosswordActivity.jsx`

**Procure:**
```jsx
${isSelected ? 'bg-amber-200' : 'bg-white'}
```

**Troque para:**
```jsx
${isSelected ? 'bg-green-300' : 'bg-white'}    // Verde
${isSelected ? 'bg-blue-200' : 'bg-white'}     // Azul
${isSelected ? 'bg-purple-200' : 'bg-white'}   // Roxo
${isSelected ? 'bg-yellow-100' : 'bg-white'}   // Amarelo claro
```

---

### 2. Alterar Velocidade de Transição

**Procure:**
```jsx
transition-colors duration-75
```

**Troque para:**
```jsx
transition-colors duration-300  // Mais lento
transition-colors duration-0    // Instantâneo
```

---

### 3. Alterar Dica para Usuário

**Procure:**
```jsx
💡 Dica: Toque e deslize o dedo para selecionar palavras, ou digite normalmente!
```

**Troque para seu próprio texto:**
```jsx
💡 Dica: Deslize para selecionar! Toque múltiplas vezes para alternar entre palavras cruzadas.
```

---

### 4. Desabilitar Feature

```javascript
// Remova os handlers do grid:
{/* 
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
*/}

// Remova o onClick das células:
{/* 
    onClick={() => handleGridCellClick(x, y)}
*/}
```

---

### 5. Debug - Logar Seleções

```javascript
const selectWord = (word) => {
    const cells = getWordCells(word);
    const cellSet = new Set(cells.map(c => `${c.x}-${c.y}`));
    
    // DEBUG
    console.log('Selecionada:', {
        word: word.word,
        direction: word.dir,
        cells: Array.from(cellSet),
        cellCount: cellSet.size
    });
    
    setSelectedCells(cellSet);
};
```

---

## Performance Tips

### 1. Memoização (se necessário)

```javascript
// Para palavras grandes/grades grandes:
const getWordCells = React.memo((word) => {
    // ... código ...
}, (prev, next) => 
    prev.word === next.word && 
    prev.x === next.x && 
    prev.y === next.y && 
    prev.dir === next.dir
);
```

### 2. Debounce de Touch Move (se lag)

```javascript
const [lastUpdateTime, setLastUpdateTime] = useState(0);

const handleTouchMove = (e) => {
    const now = Date.now();
    if (now - lastUpdateTime < 16) return;  // Limita a ~60fps
    setLastUpdateTime(now);
    
    // ... resto do código ...
};
```

---

## Troubleshooting

### Problema: Touch não funciona
**Debug:**
```javascript
window.addEventListener('touchstart', (e) => {
    console.log('Touch detectado:', e.touches[0]);
});
```

### Problema: Seleção incorreta
**Debug:**
```javascript
const getCellFromPoint = (clientX, clientY) => {
    console.log('Point:', clientX, clientY);
    // ... resto do código ...
    console.log('Cell found:', element?.id);
};
```

---

**Última Atualização:** Dezembro 2024  
**Versão Técnica:** 1.0
