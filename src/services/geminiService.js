/**
 * Serviço para interação com a API Gemini
 * Centraliza toda a lógica de comunicação com a API, incluindo:
 * - Retry com backoff exponencial
 * - Fallback entre modelos
 * - Gerenciamento de rate limiting
 * - Conversão de áudio (TTS)
 */

class GeminiService {
  constructor(apiKey, statusCallback = null) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.lastRequestTime = 0;
    this.minRequestInterval = 5000; // 5 segundos entre requisições
    this.statusCallback = statusCallback; // Callback para reportar status
  }

  /**
   * Atualiza a chave da API
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Reporta status para o callback
   */
  reportStatus(type, message, details = {}) {
    if (this.statusCallback) {
      this.statusCallback({ type, message, details, timestamp: Date.now() });
    }
  }

  /**
   * Valida a chave de API testando uma chamada simples (listar modelos)
   */
  async validateApiKey() {
    try {
      // Tenta listar modelos (requisição leve)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`
      );
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  /**
   * Aguarda o intervalo mínimo entre requisições (rate limiting)
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      const seconds = Math.ceil(waitTime / 1000);
      this.reportStatus('rate-limit', `Aguardando ${seconds}s (limite de taxa)`, { waitTime });
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Faz requisição para a API com retry e backoff exponencial
   */
  async request(model, payload, options = {}) {
    const {
      maxRetries = 8,
      initialDelay = 3000,
      maxDelay = 90000,
      fallbackModel = null
    } = options;

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Determine API version based on model name or option
        // gemini-2.5-flash-tts often requires v1alpha, while others use v1beta
        const apiVersion = options.apiVersion || (model.includes('gemini-2.5') ? 'v1alpha' : 'v1beta');
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(
          url,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        );

        // Trata erros de overload/rate limit
        if (response.status === 503) {
          throw new Error('OVERLOADED');
        }
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}));
          const detail = errorData.error?.message || 'Limite de requisições';

          // Tenta extrair o tempo de espera da mensagem de erro
          // Ex: "Please retry in 44.34s"
          const match = detail.match(/retry in (\d+(\.\d+)?)s/);
          let userMessage = 'Limite de uso da API atingido. ';

          if (match) {
            const seconds = Math.ceil(parseFloat(match[1]));
            userMessage += `Por favor, aguarde ${seconds} segundos antes de tentar novamente.`;
          } else {
            userMessage += 'Tente novamente em alguns instantes.';
          }

          throw new Error(`RATE_LIMIT: ${userMessage}`);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Verifica erros na resposta
        if (data.error) {
          const errorMsg = data.error.message?.toLowerCase() || '';
          if (errorMsg.includes('overloaded') ||
            errorMsg.includes('resource') ||
            data.error.code === 503) {
            throw new Error('OVERLOADED');
          }
          throw new Error(data.error.message || 'Erro desconhecido');
        }

        this.reportStatus('success', 'Concluído');
        return data;

      } catch (error) {
        lastError = error;
        const isOverloaded = error.message === 'OVERLOADED' ||
          error.message.toLowerCase().includes('overloaded');

        // Se não é overload ou esgotou tentativas, falha
        if (!isOverloaded || attempt >= maxRetries) {
          break;
        }

        // Calcula delay com backoff exponencial e jitter
        const baseDelay = initialDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000;
        const delay = Math.min(baseDelay + jitter, maxDelay);
        const seconds = Math.round(delay / 1000);

        this.reportStatus('retry', `Tentativa ${attempt + 1}/${maxRetries} - Aguardando ${seconds}s`,
          { attempt: attempt + 1, maxRetries, delay, seconds });
        console.log(`Tentativa ${attempt + 1}/${maxRetries} - Aguardando ${seconds}s...`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Se tiver modelo de fallback e falhou, tenta com ele
    // DESABILITADO: usar apenas o modelo selecionado
    // if (fallbackModel && lastError?.message === 'OVERLOADED') {
    //   this.reportStatus('fallback', `Mudando para modelo alternativo: ${fallbackModel}`, { fallbackModel });
    //   console.log(`Tentando modelo fallback: ${fallbackModel}`);
    //   return this.request(fallbackModel, payload, {
    //     ...options,
    //     maxRetries: 3,
    //     fallbackModel: null
    //   });
    // }

    throw lastError;
  }

  /**
   * Gera texto usando o modelo especificado
   */
  /**
   * Gera texto usando rotação inteligente de modelos para evitar erros de Rate Limit
   */
  async generateText(prompt, options = {}) {
    const {
      maxOutputTokens = 4000,
      temperature = 0.7
    } = options;

    // MODELO ÚNICO: gemini-2.5-flash (sem fallback)
    const MODEL = 'gemini-2.5-flash';

    await this.enforceRateLimit();

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens,
        temperature
      }
    };

    if (options.responseMimeType) {
        payload.generationConfig.responseMimeType = options.responseMimeType;
    }

    try {
      console.log(`[GeminiService] Tentando modelo: ${MODEL}`);

      const data = await this.request(MODEL, payload, {
        maxRetries: 2,
        initialDelay: 2000
      });

      // O gemini-2.5-flash (v1alpha) pode retornar múltiplas partes:
      // partes com "thought: true" são raciocínio interno (ignorar)
      // partes sem "thought" ou com "thought: false" são o texto final
      const parts = data.candidates?.[0]?.content?.parts || [];
      const textParts = parts.filter(p => p.text && !p.thought).map(p => p.text);
      const text = textParts.join('') || parts.find(p => p.text)?.text || '';

      if (!text) {
        console.warn('[GeminiService] Partes recebidas:', JSON.stringify(parts).slice(0, 500));
        throw new Error('Resposta vazia da API');
      }

      return text;

    } catch (error) {
      console.error(`[GeminiService] Erro com modelo ${MODEL}:`, error.message);
      throw error;
    }
  }

  /**
   * Consulta a API para listar modelos disponíveis e escolhe o melhor
   */
  async getBestAvailableModel() {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
      if (!response.ok) throw new Error(`Falha ao listar modelos: ${response.status}`);

      const data = await response.json();
      if (!data.models) throw new Error('Lista de modelos vazia');

      // Filtra modelos que suportam generateContent
      const candidates = data.models.filter(m =>
        m.supportedGenerationMethods?.includes('generateContent')
      );

      if (candidates.length === 0) throw new Error('Nenhum modelo suporta geração de texto');

      // Prioridade: 1.5 Flash > 2.0 > 1.5 Pro > 1.0
      const preferences = [
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-pro'
      ];

      for (const pref of preferences) {
        const match = candidates.find(m => m.name.includes(pref));
        if (match) return match.name.replace('models/', ''); // Remove prefixo se existir na chamada futura (mas request monta URL com models/, entao cuidado)
        // O request monta a URL assim: .../models/${model}:generateContent
        // A API retorna nomes como "models/gemini-pro".
        // Se eu retornar "gemini-pro", o request fará "models/gemini-pro". OK.
        // Se eu retornar "models/gemini-pro", o request fará "models/models/gemini-pro". ERRADO.
        // Entao devo remover o prefixo 'models/'.
      }

      // Se nao achou preferido, pega o primeiro disponivel (ex: gemini-1.0-pro-001)
      return candidates[0].name.replace('models/', '');
    } catch (e) {
      throw new Error(`Erro buscando modelos: ${e.message}`);
    }
  }

  /**
   * Gera áudio (TTS) usando o modelo de voz
   */
  async generateSpeech(text, options = {}) {
    const {
      voice = 'Aoede',
      model = 'gemini-2.5-flash-preview-tts'
    } = options;

    // Delay inicial para evitar sobrecarga
    await new Promise(resolve => setTimeout(resolve, 2000));

    const payload = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice
            }
          }
        }
      }
    };

    const data = await this.request(model, payload, { maxRetries: 5 });
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      throw new Error('Nenhum áudio recebido da API');
    }

    return audioData;
  }

  /**
   * Gera palavra para o Jogo da Forca
   */
  /**
   * Gera lista de palavras para o Jogo da Forca (Lote de 10)
   */
  async generateHangmanWordsBatch(theme, details = '') {
    let contextPrompt = `O tema escolhido pelo usuário é: "${theme}".`;
    if (details && details.trim()) {
      contextPrompt += `\n    ATENÇÃO CRÍTICA: Baseie as palavras EXCLUSIVAMENTE ou fortemente neste contexto: "${details}". Não use palavras genéricas sobre o tema amplo.`;
    }

    const prompt = `Gere uma lista de exatamente 50 palavras secretas para um jogo de forca (hangman) em Português do Brasil.
    ${contextPrompt}
    
    REGRAS OBRIGATÓRIAS:
    1. Responda APENAS com um array JSON de strings. Exemplo: ["PALAVRA1", "PALAVRA2", ...]
    2. Nenhuma explicação ou texto fora do JSON.
    3. As palavras devem ser variadas em dificuldade (algumas fáceis, outras difíceis).
    4. Remova acentos, mas mantenha Ç se houver.
    5. Tudo em MAIÚSCULAS.
    6. Evite palavras compostas, mas se necessário use hífen.
    7. NÃO inclua palavras técnicas como "JSON", "CODE", "DATA", "STRING", "ARRAY".
    
    Gere 50 palavras para garantir que eu tenha um bom pool para o jogo.`;

    try {
      const text = await this.generateText(prompt, { temperature: 0.9, maxOutputTokens: 2000 }); // More tokens for more words
      console.log("Gemini Hangman Raw Response:", text); // Debug log

      let words = [];

      // 1. Tenta extrair JSON explícito
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          words = JSON.parse(jsonMatch[0]);
        } catch (e) { console.warn("Falha no JSON parse, tentando fallback regex..."); }
      }

      // 2. Fallback: Se não conseguiu JSON ou não veio JSON, busca palavras brutas
      if (!Array.isArray(words) || words.length === 0) {
        // Regex para pegar palavras em maiúsculo (pelo menos 3 letras)
        const matchAll = text.toUpperCase().match(/[A-ZÁÀÂÃÉÈÊÍÏÓÒÔÕÖÚÙÛÇ]{3,}/g);
        if (matchAll) {
          words = matchAll;
        }
      }

      if (!words || words.length === 0) throw new Error("A IA não retornou palavras válidas.");

      // Limpeza final 
      let cleanWords = words
        .map(w => w.trim().toUpperCase().replace(/[^A-ZÇ\- ]/g, '')) // Remove acentos
        .filter(w => w.length >= 3 && !['JSON', 'ARRAY', 'LISTA', 'STRING', 'CODE', 'JAVASCRIPT', 'DATA', 'EXEMPLO'].includes(w)); // Remove lixo técnico

      // Remove duplicatas
      cleanWords = [...new Set(cleanWords)];

      // GARANTIA MÍNIMA
      // Completamos se tiver poucas para garantir a jogabilidade (min 10)
      if (cleanWords.length < 10) {
        console.warn(`A IA retornou apenas ${cleanWords.length} palavras validas. Completando...`);
        const backups = ["DESAFIO", "CORAGEM", "AMIZADE", "SABEDORIA", "AVENTURA", "HISTORIA", "EXPLORAR", "MISTERIO", "LEGENDA", "HEROI"];
        let i = 0;
        while (cleanWords.length < 10) {
          const backup = backups[i % backups.length];
          if (!cleanWords.includes(backup)) {
            cleanWords.push(backup);
          }
          i++;
        }
      }

      // Retorna TODAS as palavras (o componente gerencia o pool)
      return cleanWords;

    } catch (e) {
      console.error("Erro ao gerar lote de palavras da forca:", e);
      // Propaga o erro real para aparecer na UI (ajuda no debug)
      throw new Error(`Falha: ${e.message}`);
    }
  }

  /**
   * Gera dica para o Jogo da Forca
   */
  async generateHangmanHint(word, theme) {
    const prompt = `Estou jogando forca. A palavra secreta é "${word}" e o tema é "${theme}".
    Dê uma dica curta, sutil e divertida para me ajudar a adivinhar.
    IMPORTANTE:
    - NÃO diga a palavra.
    - NÃO diga quais letras a palavra tem.
    - A dica deve ser em Português.
    - Máximo 15 palavras.`;

    try {
      const text = await this.generateText(prompt, { temperature: 0.8, maxOutputTokens: 100 });
      return text.trim();
    } catch (e) {
      console.error("Erro ao gerar dica da forca:", e);
      return "A IA está pensando, mas ficou sem palavras...";
    }
  }

  /**
   * Gera conteúdo para o jogo de ligar pontos (Liga Pontos)
   * Retorna array de objetos com id, text, emoji e color
   */
  async generateConnectDots(topic, details = '') {
    const prompt = `
      Você é um assistente pedagógico inteligente.
      Sua tarefa é gerar 7 pares de correspondência baseados no tema: "${topic}".
      ${details ? `\nATENÇÃO CRÍTICA: Os pares DEVEM SER baseados EXCLUSIVAMENTE ou fortemente neste contexto/detalhe: "${details}". Não faça perguntas genéricas sobre o tema.\n` : ''}
      
      DIRETRIZES PARA O CONTEÚDO:
      1. COESÃO LÓGICA E PADRONIZAÇÃO (CRÍTICO): Todos os pares devem seguir estritamente o mesmo padrão de raciocínio. Não misture tipos de associações. Por exemplo, se o tema for "Animais", escolha apenas UM tipo de relação (ex: Animal -> Onde vive, OU Animal -> O que come) e mantenha essa mesma lógica para os 7 pares. A atividade precisa fazer sentido como um conjunto coeso.
      2. Para o campo 'text': Crie o primeiro lado do par (Pergunta, Termo ou Conceito). Seja direto e claro (máximo 4-5 palavras).
      3. Para o campo 'emoji' (que será a RESPOSTA correspondente):
         - GERE UMA RESPOSTA CURTA (Texto/Número) SEGUIDA DE UM EMOJI ILUSTRATIVO.
         - Formato: "Resposta [Emoji]"
         - O objetivo é ajudar a associação visual.
         - Ex: Tema "Capitais": Pergunta "França", Resposta "Paris 🗼".
         - Ex: Tema "Matemática": Pergunta "5 x 5", Resposta "25 🔢".
         - Ex: Tema "Inglês": Pergunta "Azul", Resposta "Blue 🔵".

      CRITÉRIO CRÍTICO DE UNICIDADE E ANTI-AMBIGUIDADE:
      - NUNCA repita perguntas (campo 'text').
      - NUNCA repita respostas (campo 'emoji').
      - NÃO gere perguntas parecidas ou respostas que possam se sobrepor. Cada pergunta deve ter UMA e SOMENTE UMA resposta possível e óbvia no conjunto, sem gerar dupla interpretação.
      - EVITE ESTRITAMENTE o uso de sinônimos ou conceitos idênticos com nomes diferentes (Ex: não use "Soma" e "Adição", "Produto" e "Multiplicação", "Cachorro" e "Cão" na mesma atividade). Termos muito próximos confundem o aluno e geram ambiguidade.
      - Cada par deve ser TOTALMENTE DISTINTO dos outros, mas mantendo a mesma coesão lógica definida na regra 1.
      
      IMPORTANTE:
      - Gere EXATAMENTE 7 pares.
      - As cores devem ser variadas entre: 'bg-blue-100 border-blue-400', 'bg-green-100 border-green-400', 'bg-red-100 border-red-400', 'bg-yellow-100 border-yellow-400', 'bg-purple-100 border-purple-400', 'bg-orange-100 border-orange-400', 'bg-cyan-100 border-cyan-400', 'bg-pink-100 border-pink-400'.
      
      Retorne APENAS um array JSON puro (na raiz, sem encapsular em objetos). Sem markdown.
      Estrutura:
      [
        { "id": 1, "text": "Pergunta", "emoji": "Resposta 💡", "color": "bg-blue-100 border-blue-400" }
      ]
    `;

    try {
      const text = await this.generateText(prompt, { 
          temperature: 0.8,
          responseMimeType: "application/json"
      });

      // Use centralized safe parser
      const { safeJSONParse } = await import('../utils/jsonUtils');
      const parsed = safeJSONParse(text);

      let data = parsed;
      // Caso a IA tenha retornado um objeto como { "pares": [...] } em vez do array direto
      if (parsed && !Array.isArray(parsed)) {
          const values = Object.values(parsed);
          const arrayValue = values.find(v => Array.isArray(v));
          if (arrayValue) data = arrayValue;
      }

      if (!Array.isArray(data)) throw new Error("Formato inválido recebido da IA");

      // Garante IDs e estrutura
      return data.map((item, index) => ({
        id: index + 1,
        text: item.text,
        emoji: item.emoji,
        color: item.color || 'bg-slate-100 border-slate-400'
      }));
    } catch (e) {
      console.error("Erro ao gerar Liga Pontos:", e);
      throw new Error("Falha ao criar jogo. Tente novamente.");
    }
  }

  /**
   * Gera uma aventura de RPG educacional gamificada
   */
  async generateRPGAdventure(topic, details = '') {
    const prompt = `
      Você é um Mestre de RPG Educacional criativo.
      Crie uma mini-aventura de 5 etapas para ensinar sobre: "${topic}".
      ${details ? `\nATENÇÃO CRÍTICA: A aventura INTEIRA (locais, enigmas, perguntas) DEVE ser focada EXCLUSIVAMENTE ou fortemente sobre: "${details}". Não faça uma aventura genérica sobre o tema.\n` : ''}
      
      PERSONAGENS OBRIGATÓRIOS:
      - HEROI/GUIA: Drácker (um dragãozinho marrom com asas marrons, amigável, com grandes olhos azuis). Ele guia os jogadores.
      - ALIADOS: Os "Animaizinhos da Floresta Encantada" (coelhos, esquilos, corujas sábias) que ajudam ou pedem ajuda.
      
      ESTRUTURA DA RESPOSTA (JSON ÚNICO):
      {
        "title": "Título Criativo (Ex: Drácker e a Lenda de...)",
        "theme": "${topic}",
        "villain": "Nome do Vilão Temático (Ex: Dr. Poluição)",
        "intro": "Uma frase de introdução onde o Drácker convoca os alunos e os animais da floresta para resolver o problema causado pelo vilão.",
        "plot": "O que o vilão fez? (Ex: roubou as cores da Floresta Encantada, poluiu o rio mágico)",
        "encounters": [
          {
            "id": 1,
            "title": "Título da Fase 1 (Início)",
            "difficulty": "Fácil",
            "desc": "O Drácker aponta o primeiro desafio na Floresta ou local do tema. Os animais estão preocupados. O que os heróis veem?",
            "question": "Uma pergunta inicial sobre o tema para abrir o caminho."
          },
          {
            "id": 2,
            "title": "Título da Fase 2",
            "difficulty": "Médio",
            "desc": "Os animaizinhos encontram um obstáculo ou minion do vilão.",
            "question": "Uma pergunta de nível médio sobre o tema."
          },
          {
            "id": 3,
            "title": "Título da Fase 3 (Enigma)",
            "difficulty": "Médio",
            "desc": "O Drácker encontra um enigma antigo bloqueando o caminho.",
            "question": "Uma pergunta que exige raciocínio sobre o tema."
          },
          {
            "id": 4,
            "title": "Título da Fase 4 (Armadilha)",
            "difficulty": "Difícil",
            "desc": "Uma armadilha do vilão prende os animais ou o Drácker!",
            "question": "Uma pergunta difícil ou detalhe específico do tema para salvá-los."
          },
          {
            "id": 5,
            "title": "Título da Fase 5 (Chefe Final)",
            "difficulty": "Chefe",
            "desc": "Confronto final! Drácker e os animais se unem aos alunos contra o vilão.",
            "question": "A pergunta mais importante ou abrangente para derrotar o vilão."
          }
        ]
      }

      DIRETRIZES:
      - O MUNDO DEVE SER MÁGICO, mesmo que o tema seja ciência ou história (ex: Drácker viaja no tempo ou o vilão invadiu a floresta com tecnologia).
      - SEMPRE mencione "Drácker" e os "Animaizinhos" nas descrições.
      - As perguntas DEVEM ser educativas e relacionadas ao tema "${topic}"${details ? ` e ao contexto: "${details}"` : ''}.
      - Retorne APENAS o JSON válido.
    `;

    try {
      const text = await this.generateText(prompt, { temperature: 0.9, maxOutputTokens: 5000 });

      const { safeJSONParse } = await import('../utils/jsonUtils');
      const data = safeJSONParse(text);

      if (!data || !data.encounters) throw new Error("Formato inválido de aventura");

      return data;
    } catch (e) {
      console.error("Erro ao gerar RPG:", e);
      throw new Error("Falha ao criar aventura RPG. Tente novamente.");
    }
  }

  /**
   * Converte dados PCM base64 para formato WAV
   */
  pcmToWav(base64PCM, sampleRate = 24000) {
    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const binaryString = atob(base64PCM);
    const len = binaryString.length;
    const buffer = new ArrayBuffer(len);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < len; i++) {
      view[i] = binaryString.charCodeAt(i);
    }

    const wavHeader = new ArrayBuffer(44);
    const headerView = new DataView(wavHeader);

    writeString(headerView, 0, 'RIFF');
    headerView.setUint32(4, 36 + len, true);
    writeString(headerView, 8, 'WAVE');
    writeString(headerView, 12, 'fmt ');
    headerView.setUint32(16, 16, true);
    headerView.setUint16(20, 1, true);
    headerView.setUint16(22, 1, true);
    headerView.setUint32(24, sampleRate, true);
    headerView.setUint32(28, sampleRate * 2, true);
    headerView.setUint16(32, 2, true);
    headerView.setUint16(34, 16, true);
    writeString(headerView, 36, 'data');
    headerView.setUint32(40, len, true);

    const wavBlob = new Blob([headerView, view], { type: 'audio/wav' });
    return URL.createObjectURL(wavBlob);
  }

  /**
   * Limpa texto para fala (remove LaTeX e formatação)
   */
  cleanTextForSpeech(text) {
    return text
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 dividido por $2')
      .replace(/\\sqrt\{([^}]+)\}/g, 'raiz quadrada de $1')
      .replace(/\^(\d+)/g, ' elevado a $1')
      .replace(/_(\d+)/g, ' índice $1')
      .replace(/\\times/g, ' vezes ')
      .replace(/\\div/g, ' dividido por ')
      .replace(/\$/g, '')
      .replace(/\\/g, '')
      .replace(/(\d+)\.(\d+)/g, '$1,$2') // Standardize decimals (1.5 -> 1,5)
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Divide texto em chunks para processamento
   */
  sliceIntoChunks(text, maxLen = 500) {
    if (!text?.trim()) return [];

    const paras = text.split(/\n\n+/);
    const chunks = [];

    for (const p of paras) {
      if (p.length <= maxLen) {
        chunks.push(p);
        continue;
      }

      const sentences = p.split(/([.!?]+\s)/);
      let buf = '';

      for (let i = 0; i < sentences.length; i++) {
        buf += sentences[i] || '';
        if (buf.length >= maxLen) {
          chunks.push(buf.trim());
          buf = '';
        }
      }

      if (buf.trim()) chunks.push(buf.trim());
    }

    return chunks.length ? chunks : (text ? [text.slice(0, maxLen)] : []);
  }
}

// Factory function para criar instância do serviço
export const createGeminiService = (apiKey, statusCallback = null) => {
  return new GeminiService(apiKey, statusCallback);
};

// Singleton para uso global (opcional)
let instance = null;

export const getGeminiService = (apiKey = null) => {
  if (!instance && apiKey) {
    instance = new GeminiService(apiKey);
  } else if (instance && apiKey) {
    instance.setApiKey(apiKey);
  }
  return instance;
};

export default GeminiService;
