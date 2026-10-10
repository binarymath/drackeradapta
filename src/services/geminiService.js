/**
 * Serviço para interação com a API Gemini
 * Centraliza toda a lógica de comunicação com a API, incluindo:
 * - Retry com backoff exponencial
 * - Fallback entre modelos
 * - Gerenciamento de rate limiting
 * - Conversão de áudio (TTS)
 */

import { safeJSONParse } from '../utils/jsonUtils';
import { shuffleInPlace } from '../utils/array';

const API_ROOT = 'https://generativelanguage.googleapis.com';
const DEFAULT_MODEL = 'gemini-2.5-flash';

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
      const response = await fetch(`${API_ROOT}/v1beta/models`, {
        headers: { 'x-goog-api-key': this.apiKey }
      });
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
        const url = `${API_ROOT}/${apiVersion}/models/${model}:generateContent`;

        const response = await fetch(
          url,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
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
   * Gera texto usando rotação inteligente de modelos para evitar erros de Rate Limit
   */
  async generateText(prompt, options = {}) {
    const {
      maxOutputTokens = 4000,
      temperature = 0.7
    } = options;

    // Usa o modelo informado (seletor da interface); padrão: gemini-2.5-flash (sem fallback)
    const MODEL = options.model || DEFAULT_MODEL;

    await this.enforceRateLimit();

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens,
        temperature
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
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

      const candidate = data.candidates?.[0];
      const finishReason = candidate?.finishReason;
      
      if (finishReason && finishReason !== 'STOP') {
        console.warn(`[GeminiService] Aviso: finishReason é ${finishReason}`);
      }

      // O gemini-2.5-flash (v1alpha) pode retornar múltiplas partes:
      // partes com "thought: true" são raciocínio interno (ignorar)
      // partes sem "thought" ou com "thought: false" são o texto final
      const parts = candidate?.content?.parts || [];
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
   * Responde ao chat (sessão Conversar com Drácker) mantendo histórico.
   * history: Array de { role: "user" | "model", parts: [{ text: string }] }
   */
  async generateChatReply(history, systemInstruction = '', options = {}) {
    const {
      maxOutputTokens = 4000,
      temperature = 0.7
    } = options;

    const MODEL = options.model || DEFAULT_MODEL;

    await this.enforceRateLimit();

    const payload = {
      contents: history,
      generationConfig: {
        maxOutputTokens,
        temperature
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    try {
      console.log(`[GeminiService] Chat request com modelo: ${MODEL}`);
      const data = await this.request(MODEL, payload, { maxRetries: 2, initialDelay: 2000 });
      
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const textParts = parts.filter(p => p.text && !p.thought).map(p => p.text);
      const text = textParts.join('') || parts.find(p => p.text)?.text || '';

      if (!text) throw new Error('Resposta vazia da API no chat');
      return text;
    } catch (error) {
      console.error(`[GeminiService] Erro no Chat com ${MODEL}:`, error.message);
      throw error;
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
   * Gera a História Completa do Livro-Jogo (Abertura + 4 Etapas + Finais)
   */
  async generateFullRPG(topic, details, teams, questionType, options = {}) {
    const {
      universe = 'forest',
      customLore = '',
      stageCount = 4
    } = options;

    let universeDescription = '';
    if (universe === 'forest') {
      universeDescription = `
      UNIVERSO: Floresta Encantada e Natureza Mística.
      PERSONAGENS:
      - Drácker: Um dragãozinho marrom, detetive da natureza, amigável, curioso e muito inteligente.
      - Amigos da Floresta: Coruja sábia, Raposa esperta, Esquilo veloz, Coelho saltitante, Castor engenhoso (chame-os pelas espécies ou papéis na floresta).
      AMBIENTAÇÃO: Bosques mágicos, clareiras secretas, riachos cristalinos e mistérios da fauna/flora.
      `;
    } else if (universe === 'space') {
      universeDescription = `
      UNIVERSO: Odisséia Espacial e Exploradores Cósmicos.
      PERSONAGENS:
      - Drácker: Capitão Drácker, um dragãozinho astronauta corajoso e líder da nave de exploração.
      - Aliados Espaciais: Robô assistente R-Byte, Estrela guia brilhante, Cientista cósmico.
      AMBIENTAÇÃO: Estações espaciais orbitais, constelações brilhantes, nebulosas e luas misteriosas.
      `;
    } else if (universe === 'medieval') {
      universeDescription = `
      UNIVERSO: Reino dos Feiticeiros, Castelos e Masmorras Mágicas.
      PERSONAGENS:
      - Drácker: Jovem Mago Dragão, guardião do fogo da sabedoria e feitiços de proteção.
      - Aliados: Guardião do Castelo, Fada luminosa, Alquimista do reino.
      AMBIENTAÇÃO: Torres antigas, castelos encantados, bibliotecas secretas e pergaminhos mágicos.
      `;
    } else if (universe === 'ocean') {
      universeDescription = `
      UNIVERSO: Expedição Submarina e Cidades dos Corais.
      PERSONAGENS:
      - Drácker: Drácker Mergulhador das Profundezas com sua bolha/escafandro mágico.
      - Aliados Aquáticos: Golfinho mensageiro, Tartaruga marinha centenária, Cavalo-marinho sábio.
      AMBIENTAÇÃO: Cidades de corais coloridos, cavernas marinhas bioluminescentes e baús submersos de mistério.
      `;
    } else {
      universeDescription = `
      UNIVERSO E TEMA ESPECÍFICO: ${customLore || 'Aventura Fantástica Educativa Adaptada ao Tema'}.
      PERSONAGENS: Drácker (mentor, guia curioso e conselheiro da turma) e companheiros temáticos adequados ao enredo.
      `;
    }

    const safeStages = Math.max(3, Math.min(5, Number(stageCount) || 4));
    const isIndividualMode = Boolean(options.isIndividual || options.participationMode === 'class_students');

    const prompt = `
      Você é o mestre de um RPG Educacional Investigativo infantil/juvenil de alto nível.
      O TEMA da aula é: "${topic}". O CONTEXTO é: "${details}".
      O formato das perguntas deve ser: ${questionType === 'multiple_choice' ? 'Múltipla Escolha (com 4 alternativas A, B, C, D e a resposta certa)' : 'Dissertativa (pergunta aberta e a resposta esperada)'}.
      
      ${isIndividualMode ? `
      MODO DE JOGO: JORNADA INDIVIDUAL NO CADERNO ESCOLAR.
      Os alunos realizarão as atividades individualmente em seus cadernos de aula!
      Portanto, para CADA etapa (round), crie UMA MISSÃO INVESTIGATIVA CENTRAL PARA O CADERNO que toda a turma deva copiar, resolver, calcular ou responder no caderno escolar.
      No array "enigmas" de cada etapa, retorne apenas 1 enigma com "team": "Missão Individual no Caderno".
      ` : `
      EQUIPES/HERÓIS NA PARTIDA: ${teams.map(t => t.name).join(', ')}.
      Para CADA etapa, crie uma pergunta direcionada e DIFERENTE para cada equipe.
      `}
      
      ${universeDescription}

      CRIE A HISTÓRIA COMPLETA DO JOGO (COM INÍCIO, MEIO E FIM).
      O jogo deve ter EXATAMENTE ${safeStages} ETAPAS (rounds/capítulos).
      A história deve evoluir gradativamente até a grande revelação no final (etapa ${safeStages}).
      
      MUITO IMPORTANTE: O JOGO PRECISA SER ÁGIL, EMOCIONANTE E DIRETO AO PONTO!
      - A "historia_abertura" (round 1) deve ter NO MÁXIMO 4 frases cativantes.
      - As "narrativa_avanco" (rounds 2 até ${safeStages}) devem ter NO MÁXIMO 2 frases cada.
      - As perguntas devem ser claras, contextualizadas com o tema de estudo e desafiadoras na medida certa.
      - O "reforco_pedagogico" deve ter NO MÁXIMO 3 frases, sendo um balão de fala acolhedor e explicativo do Drácker sobre o conceito do TEMA para apoiar os alunos durante a investigação (NUNCA diga que o mistério já foi desvendado ou que a aventura terminou).
      - Os finais devem ter NO MÁXIMO 3 frases.
      
      REGRAS PEDAGÓGICAS E DE DIRECIONAMENTO:
      ${isIndividualMode ? `
      1. MISSÃO NO CADERNO: A pergunta deve começar convocando a turma para o caderno (Ex: "Atenção, bravos exploradores! Em seus cadernos de aula, resolvam o seguinte desafio proposto pelo Drácker: [pergunta/exercício sobre o tema]?").
      ` : `
      1. DIRECIONAMENTO NOMINAL OBRIGATÓRIO: Cada pergunta do campo "question" DEVE obrigatoriamente convocar a equipe pelo nome logo no início, integrando-a na cena da aventura (Exemplo: "Atenção, [Nome da Equipe]! Ao investigarem este local, o Drácker lança este desafio para vocês: [pergunta sobre o tema]?"). NUNCA faça uma pergunta genérica sem citar o nome da equipe!
      2. As perguntas de todas as equipes dentro da MESMA ETAPA devem ter rigorosamente o MESMO GRAU DE DIFICULDADE.
      `}
      - GABARITO DO MESTRE DETALHADO OBRIGATÓRIO: No campo "correct_answer", NUNCA forneça apenas a resposta seca (como apenas um número "20%" ou apenas uma letra). O gabarito DEVE fornecer a resposta final clara E a resolução pedagógica detalhada passo a passo com os cálculos e raciocínios (Exemplo: "20%. Resolução detalhada: O valor aumentou de 100 para 120 moedas (aumento de 20 moedas). Como o valor original era 100 moedas, calcula-se (20 / 100) * 100 = 20% de aumento.").
      - Respostas únicas, precisas e inconfundíveis.
      - NUNCA coloque alternativas que sejam matematicamente equivalentes ou sinônimas (exemplo: se a resposta for 1/2, NÃO coloque 2/4 como outra alternativa. Evite gerar ambiguidades!).
      
      ESTRUTURA DA RESPOSTA (JSON PURO, SEM MARKDOWN):
      {
        "titulo_aventura": "Título épico e cativante da expedição",
        "historia_abertura": "A introdução épica da história detalhando o mistério no universo selecionado...",
        "etapas": [
          {
            "round": 1,
            "titulo_capitulo": "Nome temático do capítulo (Ex: O Portal das Raízes Antigas)",
            "local_cena": "Nome do local (Ex: Clareira dos Sussurros)",
            "item_recompensa": "Nome do artefato mágico ou recompensa deste capítulo (Ex: Cristal da Sabedoria)",
            "narrativa_avanco": "O início da investigação ou desenvolvimento da cena...",
            "enigmas": [
              {
                "team": "${isIndividualMode ? 'Missão Individual no Caderno' : 'Nome da Equipe 1'}",
                "question": "Pergunta contextualizada no tema e na aventura...",
                "options": ["A) ...", "B) ...", "C) ...", "D) ..."], // Vazio [] se for dissertativa
                "correct_answer": "Resposta final destacada + Resolução pedagógica passo a passo detalhada",
                "dica_dracker": "Uma pista sutil e pedagógica do Drácker para quem precisar de ajuda"
              }
            ]
          }
          // repita rigorosamente a mesma estrutura para os rounds até ${safeStages}
        ],
        "reforco_pedagogico": "Um balão de fala do Drácker explicando de forma simples o conceito base do TEMA para apoiar os exploradores durante a missão.",
        "finais": {
          "vitoria_epica": "Narrativa triunfante caso a turma tenha pontuação alta.",
          "vitoria_com_ajuda": "Narrativa de superação e aprendizado caso a turma tenha pontuação com mais erros."
        }
      }
    `;
    try {
      const text = await this.generateText(prompt, { temperature: 0.8, responseMimeType: "application/json", maxOutputTokens: 8192 });
      const data = safeJSONParse(text);
      if (!data || !data.etapas || data.etapas.length < safeStages) throw new Error("Formato inválido ou número de etapas incompleto");
      return data;
    } catch (e) {
      console.error("Erro Full RPG:", e);
      throw new Error("Falha ao gerar o livro-jogo: " + e.message);
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
   * Gera perguntas para a Roleta Pedagógica baseadas em um tema e lista de nomes
   */
  async generateRouletteQuestions(topic, namesText, lessonDetails, difficultyLabel = 'Média') {
    const namesList = namesText.split('\n').map(n => n.trim()).filter(n => n);
    if (namesList.length === 0) return [];
    
    // Gera exatamente 20 perguntas pedagógicas ricas para a roleta
    const qty = 20;

    const prompt = `Você é um assistente pedagógico especializado em gamificação escolar.
Tema: ${topic}
Contexto Adicional da Aula: ${lessonDetails || 'Nenhum contexto extra fornecido.'}
Nível Geral Recomendado: ${difficultyLabel}

Crie exatamente ${qty} perguntas únicas, engajadoras e formativas sobre o tema para usar em uma roleta gamificada de sala de aula.
Distribua as ${qty} perguntas com VARIAÇÃO DE DIFICULDADE clara entre:
- 7 perguntas de nível Fácil (conceitos diretos, identificação e definições fundamentais)
- 7 perguntas de nível Médio (aplicação prática, raciocínio, relações e causas)
- 6 perguntas de nível Difícil (desafios, análise crítica, deduções e conexões interdisciplinares)

Retorne APENAS um JSON válido no formato de array com 20 objetos. Cada objeto deve ter:
- 'question': a pergunta em si, formulada de modo claro e instigante.
- 'answer': a resposta esperada/gabarito de forma concisa e correta.
- 'difficulty': exatamente uma das opções: "Fácil", "Média" ou "Difícil".

Exemplo de retorno esperado:
[
  {
    "question": "Qual é a definição básica desse conceito?",
    "answer": "É a capacidade de realizar trabalho...",
    "difficulty": "Fácil"
  },
  {
    "question": "Como podemos aplicar essa fórmula em uma situação cotidiana?",
    "answer": "Calculando a velocidade média...",
    "difficulty": "Média"
  },
  {
    "question": "Qual seria a consequência a longo prazo se essa variável fosse alterada?",
    "answer": "O sistema entraria em colapso devido a...",
    "difficulty": "Difícil"
  }
]

IMPORTANTE: Retorne APENAS o JSON (array de 20 objetos), sem markdown (\`\`\`json) ou explicações adicionais.`;

    try {
      const text = await this.generateText(prompt, { 
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        temperature: 0.8
      });
      const jsonStr = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      let questions = JSON.parse(jsonStr);
      
      if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error("Formato de perguntas inválido retornado pela IA");
      }

      // Embaralha as perguntas para misturar as dificuldades na roleta
      shuffleInPlace(questions);

      // Retorna a lista completa das 20 perguntas geradas com dificuldade e ID
      return questions.map((qObj, idx) => {
        // Suporte a compatibilidade (caso a IA retorne array de strings)
        if (typeof qObj === 'string') {
            qObj = { question: qObj, answer: '', difficulty: 'Média' };
        }

        // Formata decimais para o padrão brasileiro (ex: 1.5 -> 1,5)
        let questionText = (qObj.question || '').replace(/(\d+)\.(\d+)/g, '$1,$2');
        let answerText = (qObj.answer || '').replace(/(\d+)\.(\d+)/g, '$1,$2');
        let difficulty = qObj.difficulty || (idx % 3 === 0 ? 'Fácil' : idx % 3 === 1 ? 'Média' : 'Difícil');
        let assignedName = namesList.length > 0 ? namesList[idx % namesList.length] : '';

        return {
          id: Date.now().toString() + '-' + idx,
          name: assignedName,
          question: questionText,
          answer: answerText,
          difficulty: difficulty,
          active: true
        };
      });
    } catch (err) {
      console.error("[GeminiService] Erro ao gerar perguntas da roleta:", err);
      throw err;
    }
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
