# ⚡ Quick Start - Seleção por Toque em Palavras Cruzadas

## 🚀 Começar em 5 Minutos

### 1️⃣ Instalar (1 minuto)
```bash
cd "Atividade Adaptada"
npm install
```

### 2️⃣ Iniciar Servidor (1 minuto)
```bash
npm run dev
```

### 3️⃣ Abrir no Navegador (1 minuto)
```
Desktop:  http://localhost:5173
Mobile:   [IP LOCAL]:5173
```

### 4️⃣ Testar Feature (2 minutos)
- [ ] Clique em \"Jogo\"
- [ ] Toque em uma célula
- [ ] Deslize para selecionar
- [ ] Digite as letras
- [ ] Pronto! 🎉

---

## 📱 Como Usar em Mobile

### Método 1: Toque Simples
```
1. Toque célula
2. Palavra selecionada (amarela)
3. Digite letras
```

### Método 2: Deslizar
```
Toque + Deslize DIREITA → Palavra Horizontal
Toque + Deslize BAIXO   → Palavra Vertical
```

### Método 3: Ciclar Palavras
```
Toque 1ª vez → Palavra A
Toque 2ª vez → Palavra B
Toque 3ª vez → Volta para A
```

---

## 🎯 Exemplo Prático

### Preencher \"MELANCIA\" (Horizontal)

```
Célula: [M] [E] [L] [A] [N] [C] [I] [A]

Passos:
1. Toque primeira célula
2. Deslize para direita (ou apenas toque)
3. Digite: M-E-L-A-N-C-I-A

Resultado: ✅ Palavra preenchida!
```

---

## 🔧 Customização Rápida

### Alterar Cor de Seleção
Arquivo: `src/components/CrosswordActivity.jsx`

Procure:
```jsx
${isSelected ? 'bg-amber-200' : 'bg-white'}
```

Troque para:
```jsx
${isSelected ? 'bg-green-300' : 'bg-white'}  // Verde
${isSelected ? 'bg-blue-200' : 'bg-white'}   // Azul
```

### Alterar Velocidade de Transição
Procure:
```jsx
transition-colors duration-75
```

Troque para:
```jsx
transition-colors duration-300  // Mais lento
```

---

## 📚 Documentação Recomendada

### Rápido (5 min)
👉 [GUIA_USO_TOQUE.md](./GUIA_USO_TOQUE.md)

### Completo (15 min)
👉 [IMPLEMENTACAO_TOQUE.md](./IMPLEMENTACAO_TOQUE.md)

### Técnico (15 min)
👉 [REFERENCIA_TECNICA.md](./REFERENCIA_TECNICA.md)

### Todos os Docs
👉 [INDICE_DOCUMENTACAO.md](./INDICE_DOCUMENTACAO.md)

---

## ✅ Checklist Rápido

- [ ] Instalado `npm install`
- [ ] Servidor rodando `npm run dev`
- [ ] Acessável em localhost:5173
- [ ] Jogo carrega
- [ ] Toque funciona
- [ ] Deslizar funciona
- [ ] Dígitos preenchem
- [ ] Tudo OK!

---

## 🐛 Problemas Rápidos?

### Seleção não funciona
```
1. Limpe cache: Ctrl+Shift+Delete
2. Recarregue: F5
3. Tente novo navegador
```

### Deslizar não detecta
```
1. Deslize com força (não muito leve)
2. Direção correta (H=direita, V=baixo)
3. Comece em célula válida
```

### Seleção desaparece
```
Isso é normal! Ao digitar, limpamos a seleção.
Toque novamente para nova seleção.
```

---

## 📞 Precisa de Help?

1. **Leia:** [GUIA_USO_TOQUE.md](./GUIA_USO_TOQUE.md)
2. **Veja:** [Troubleshooting](./GUIA_USO_TOQUE.md#🆘-problemas-comuns)
3. **Teste:** [Checklist](./CHECKLIST_VALIDACAO.md)
4. **Consulte:** [Index](./INDICE_DOCUMENTACAO.md)

---

## 🎉 Sucesso!

Você já deve estar usando a **Seleção por Toque** em palavras cruzadas!

```
Aproveite o jogo! 🎮
```

---

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Status:** ✅ Pronto
