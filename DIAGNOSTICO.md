# 🔍 Diagnóstico de Sobrecarga - AdaptAI

## Como Identificar o que está sobrecarregando

### 1. **Abra o Console do Navegador** (F12 → Console)

Enquanto usa o app, monitore:

```javascript
// Procure por estas mensagens:
🔍 [API Request] Modelo: gemini-2.5-flash, Payload: 0.85KB, Prompt: 42 chars
⏱️ [API Response] Status: 200, Tempo: 2.34s
✅ [API Success] Resposta: 1.20KB, Total: 2.34s
```

### 2. **Sinais de Sobrecarga**

**🔴 PROBLEMA: Payloads grandes**
```
Payload: 5.20KB ← Muito grande! Reduzir prompt
```
✅ **Solução**: Prompts devem ter < 1KB (200-300 caracteres)

**🔴 PROBLEMA: Tempo > 10s**
```
Tempo: 15.45s ← Muito lento!
```
✅ **Solução**: Servidor Gemini está sobrecarregado. Aguarde 5-10 minutos.

**🔴 PROBLEMA: Status 429 ou 503**
```
Status: 429 ← Rate limit / Sobrecarga
Status: 503 ← Servidor indisponível
```
✅ **Solução**: 
- Aguarde 10-30 minutos
- Troque para modelo alternativo (2.0-flash)
- Reduza frequência de requisições

### 3. **Monitor de Rede** (F12 → Network)

1. Filtre por `generativelanguage.googleapis.com`
2. Clique na requisição
3. Veja a aba "Timing":
   - **Waiting (TTFB)**: Se > 5s → servidor lento
   - **Content Download**: Se > 2s → resposta grande

### 4. **Métricas Importantes**

| Métrica | Ideal | Alerta | Crítico |
|---------|-------|--------|---------|
| Tamanho Prompt | < 500 chars | 500-1000 | > 1000 |
| Tamanho Payload | < 1KB | 1-3KB | > 3KB |
| Tempo Resposta | < 3s | 3-8s | > 8s |
| Tentativas | 0-1 | 2-4 | > 5 |

### 5. **Causas Comuns de Sobrecarga**

#### No SEU lado (cliente):
- ✅ **Prompts muito longos**: Reduza para 30-50 palavras
- ✅ **Muitas requisições rápidas**: Aguarde 3-5s entre cada geração
- ✅ **Áudio com chunks grandes**: Já otimizado (500 chars)
- ✅ **Caça-palavras usando IA**: Já otimizado (gerado localmente)

#### No lado do SERVIDOR Gemini:
- ⚠️ **Horário de pico**: 9h-18h (horário comercial US)
- ⚠️ **Muitos usuários simultâneos**: Google limita taxa
- ⚠️ **Manutenção/instabilidade**: Aguarde alguns minutos
- ⚠️ **Modelo específico sobrecarregado**: Troque de modelo

### 6. **Como Reduzir Sobrecarga**

**No código (já implementado):**
```javascript
// ✅ Prompts ultracurtos
quiz: '5 perguntas',
wordsearch: 'Texto curto',

// ✅ Limite de tokens
maxOutputTokens: 180,

// ✅ Retry com backoff exponencial
3s → 6s → 12s → 24s → 48s

// ✅ Fallback automático
Flash → 2.0-flash
```

**Dicas de uso:**
1. **Evite regenerar muito rápido**: Aguarde 5s entre tentativas
2. **Use temas simples**: "Cores" em vez de "Teoria das cores primárias e secundárias"
3. **Evite horários de pico**: Teste à noite ou madrugada
4. **Limite de API grátis**: 60 requisições/minuto (verifique em aistudio.google.com)

### 7. **Teste de Performance**

Abra o Console e cole:

```javascript
// Mostra estatísticas de todas as requisições
console.table(
  performance.getEntriesByType('resource')
    .filter(r => r.name.includes('generativelanguage'))
    .map(r => ({
      url: r.name.split('?')[0].split('/').pop(),
      duration: `${(r.duration/1000).toFixed(2)}s`,
      size: `${(r.transferSize/1024).toFixed(2)}KB`
    }))
);
```

### 8. **Quando Está Normal?**

✅ Console mostra:
```
🔍 Payload: 0.45KB, Prompt: 25 chars
⏱️ Status: 200, Tempo: 1.8s
✅ Resposta: 0.92KB
```

✅ Tempo total < 3 segundos
✅ Nenhuma tentativa de retry
✅ Status sempre 200

### 9. **Soluções Rápidas**

Se receber erro de sobrecarga:

1. **Imediato**: Aguarde 30 segundos, tente novamente
2. **Curto prazo** (5 min): Troque para modelo 2.0-flash
3. **Médio prazo** (30 min): Servidor Gemini geralmente se recupera
4. **Última opção**: Obtenha nova API key em aistudio.google.com

### 10. **Script de Teste**

Para testar se o servidor está funcionando, abra o Console:

```javascript
// Teste rápido de conectividade
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=SUA_API_KEY', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    contents: [{parts: [{text: 'Oi'}]}],
    generationConfig: {maxOutputTokens: 50}
  })
})
.then(r => r.json())
.then(d => console.log('✅ Servidor OK:', d))
.catch(e => console.error('❌ Servidor com problema:', e));
```

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────┐
│ DIAGNÓSTICO RÁPIDO                      │
├─────────────────────────────────────────┤
│ 1. Abra F12 → Console                   │
│ 2. Gere uma atividade                   │
│ 3. Procure logs com 🔍 ⏱️ ✅            │
│ 4. Veja tempo e tamanho                 │
│                                         │
│ Se TEMPO > 8s → Servidor lento          │
│ Se PAYLOAD > 3KB → Prompt muito grande  │
│ Se STATUS 429/503 → Sobrecarga          │
└─────────────────────────────────────────┘
```

**Quer mais ajuda?** Compartilhe uma captura do Console (F12) mostrando os logs.
