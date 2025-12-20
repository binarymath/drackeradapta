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

    try {
      console.log(`[GeminiService] Tentando modelo: ${MODEL}`);

      const data = await this.request(MODEL, payload, {
        maxRetries: 2,
        initialDelay: 2000
      });

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
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
