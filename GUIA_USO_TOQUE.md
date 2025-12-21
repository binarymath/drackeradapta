# Guia de Uso - Seleção por Toque em Palavras Cruzadas

## 🎮 Como Usar em Mobile

### 1️⃣ Método: Toque Simples

#### Passo 1: Toque em uma célula
```
┌─────────────────┐
│  1  │  2  │  3  │
├─────┼─────┼─────┤
│  4  │ 👆  │  5  │  ← Toque aqui
├─────┼─────┼─────┤
│  6  │  7  │  8  │
└─────────────────┘
```

#### Passo 2: Célula e palavra são destacadas
```
┌─────────────────────────────────┐
│  1  │  2  │  3  │               │
├─────┴─────┴─────┤               │
│  4  │ 🟨  │  5  │  ← Destacada  │
├─────┼─────┼─────┤               │
│  6  │  7  │  8  │               │
└─────────────────────────────────┘
```

#### Passo 3: Digite para preencher
```
Digite: "G", "A", "T", "O"
┌─────────────────────────────────┐
│  1  │  2  │  3  │               │
├─────┴─────┴─────┤               │
│  4  │ 🟨  │  5  │               │
│      G A T O    │  ← Preenchido │
├─────┼─────┼─────┤               │
│  6  │  7  │  8  │               │
└─────────────────────────────────┘
```

---

### 2️⃣ Método: Deslizar (Swipe)

#### Para Palavras Horizontais
```
1. Toque em uma célula
2. Deslize o dedo para a DIREITA →
3. Palavra horizontal é selecionada

Célula: A(1,1) até B(1,3)
           ↓
        A  B  C
        ↑-----→  (deslize)
```

#### Para Palavras Verticais
```
1. Toque em uma célula
2. Deslize o dedo para BAIXO ↓
3. Palavra vertical é selecionada

Célula: A(1,1) até C(3,1)
           ↓
        A
        ↓
        B
        ↓
        C
      (deslize)
```

---

### 3️⃣ Método: Ciclar Entre Palavras

#### Quando há cruzamento
```
Célula contém:
- Palavra Horizontal: "GATO" (1-4)
- Palavra Vertical: "MAGO" (4-7)

1º Toque → Destaca GATO (primeiro)
┌─────┬─────┬─────┐
│ 🟨  │ 🟨  │ 🟨  │  ← GATO (H)
├─────┼─────┼─────┤
│  M  │  A  │  G  │
│  A  │  G  │  O  │
└─────┴─────┴─────┘

2º Toque → Destaca MAGO (segundo)
┌─────┬─────┬─────┐
│ 🟨  │     │     │
├─────┼─────┼─────┤
│ 🟨  │     │     │  ← MAGO (V)
│ 🟨  │     │     │
└─────┴─────┴─────┘

3º Toque → Volta para GATO (cicla)
```

---

## 💡 Dicas Úteis

### ✅ O Que Funciona Bem

1. **Seleção Rápida**
   - Toque + deslize é mais rápido que cliques múltiplos

2. **Preenchimento em Sequência**
   - Seleciona palavra → Digita automaticamente → Move para próxima

3. **Múltiplas Palavras**
   - Toque novamente para alternar entre palavras cruzadas

### ⚠️ Cuidados

1. **Não Estique Demais**
   - Deslize na direção correta (H ou V)
   - Deslizes diagonais podem não funcionar bem

2. **Célula Deve Ser Válida**
   - Não toque em células preenchidas (cinzas)
   - A célula deve conter pelo menos uma palavra

3. **Digitação Limpa**
   - Ao digitar, a seleção é limpa (isso é normal)
   - Toque novamente para selecionar nova palavra

---

## 🎯 Exemplos Práticos

### Exemplo 1: Preencher uma Palavra Horizontal

**Dica:** "Fruta amarela"  
**Resposta:** BANANA

```
Passo 1: Tocar na primeira célula
         ↓
         [B] [  ] [  ] [  ] [  ] [  ]
Passo 2: Deslizar para direita (ou apenas digitar)
         ↓
         [B] [A] [N] [A] [N] [A]
Resultado: ✅ Palavra preenchida!
```

### Exemplo 2: Preencher uma Palavra Vertical

**Dica:** "Animal que bate asa"  
**Resposta:** POMBO

```
Passo 1: Tocar na primeira célula
         ↓
         [P]
         [  ]
         [  ]
         [  ]
         [  ]

Passo 2: Deslizar para baixo (ou apenas digitar)
         ↓
         [P]
         [O]
         [M]
         [B]
         [O]

Resultado: ✅ Palavra preenchida!
```

### Exemplo 3: Alternar Entre Palavras Cruzadas

**Situação:** Célula contém letra de 2 palavras

```
╔══════════════════════════════════════╗
║ Toque 1ª vez → Destaca HORIZONTAL   ║
║ [🟨] [🟨] [🟨]                      ║
║  [  ] [  ] [  ]                     ║
║  [  ] [  ] [  ]                     ║
╚══════════════════════════════════════╝
      ↓ (toque novamente)
╔══════════════════════════════════════╗
║ Toque 2ª vez → Destaca VERTICAL     ║
║ [🟨]                                 ║
║ [🟨]                                 ║
║ [🟨]                                 ║
║ [🟨]                                 ║
║ [🟨]                                 ║
╚══════════════════════════════════════╝
```

---

## 📊 Comparativo: Toque vs Mouse vs Teclado

| Ação | Desktop (Mouse) | Mobile (Toque) | Teclado |
|------|-----------------|---|---------|
| Selecionar | Click | Tap + Swipe | Setas |
| Preencher | Click + Digitar | Tap + Digitar | Digitar |
| Alternar Palavras | Click repetido | Tap repetido | Tab/Setas |
| Velocidade | ⚡ Rápido | ⚡ Rápido | ⏱️ Médio |
| Intuitividade | ✅ Alta | ✅ Alta | ⚠️ Média |

---

## 🆘 Problemas Comuns

### P: "Meu toque não funciona"
**R:** 
1. Verifique se é em um dispositivo touch (mobile/tablet)
2. Tente usar navegador mais recente
3. Limpe o cache do navegador

### P: "O deslizar não está selecionando corretamente"
**R:**
1. Deslize na direção correta (H=direita, V=baixo)
2. Comece em uma célula válida
3. Deslize com mais decisão (não muito leve)

### P: "Não consigo alternar entre palavras cruzadas"
**R:**
1. Toque na célula de cruzamento
2. Toque novamente para alternar
3. Repita conforme necessário

### P: "Seleção desaparece quando digito"
**R:**
Isso é normal! Quando você digita, a seleção é limpa. Toque novamente para selecionar outra palavra.

---

## 🎓 Dicas de Especialista

### Para Jogadores Rápidos

```
1. Toque na célula
2. Imediatamente comece a digitar
3. Usa setas do teclado para navegar
4. Repete o processo

Isso é mais rápido que esperar!
```

### Para Jogadores Visuais

```
1. Vê a dica
2. Toca e desliza para selecionar
3. Observa as células destacadas
4. Digita com confiança
```

### Para Jogadores Concentrados

```
1. Usa deslizar para seleção
2. Digita continuamente
3. Deixa o dedo no grid
4. Toca para alternar palavras conforme necessário
```

---

## 🏆 Modo Competição

**Dica:** Em modo competição, tempo importa!

Estratégia ótima:
1. **Leia a dica** - 1 segundo
2. **Selecione por deslizar** - 0.5 segundo (mais rápido que click)
3. **Digite rapidamente** - Depende da velocidade
4. **Próxima palavra** - Volte ao passo 1

### Benchmark de Tempo
```
Deslizar + Digitar:   ~3-5 segundos por palavra
Click + Digitar:      ~4-6 segundos por palavra
Só teclado:          ~5-7 segundos por palavra
```

---

## 📱 Otimizado Para

✅ **Funcionário para:**
- iPhone 6 em diante
- Android 5.0+
- Tablets
- Navegadores: Chrome, Firefox, Safari, Edge

⚠️ **Pode não funcionar:**
- Internet Explorer (descontinuado)
- Navegadores muito antigos
- Dispositivos sem suporte a Touch Events

---

**Versão:** 1.0  
**Última Atualização:** Dezembro 2024  
**Suporte:** Entre em contato com o desenvolvedor
