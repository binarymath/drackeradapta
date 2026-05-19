
export const memoryService = {
    // Busca imagem de fundo (Imagen ou Pollinations)
    generateBackground: async (topicTerm, apiKey) => {
        if (!apiKey) {
            return `https://image.pollinations.ai/prompt/abstract%20background%20${topicTerm}?width=1080&height=720&nologo=true&blur=5`;
        }

        try {
            const prompt = `A beautiful, artistic, abstract background wallpaper about ${topicTerm}, soft colors, 4k resolution, cinematic lighting, no text`;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt: prompt }],
                    parameters: { sampleCount: 1 }
                })
            });
            const data = await response.json();
            if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
                return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
            }
            throw new Error('Imagen failed');
        } catch (err) {
            console.error("Erro no Imagen, usando fallback:", err);
            return `https://image.pollinations.ai/prompt/abstract%20wallpaper%20${topicTerm}?width=1080&height=720&nologo=true`;
        }
    },

    // Gera pares via Gemini ou Local (Genérico)
    // Gera pares via Gemini Service (Centralizado)
    // Gera pares via Gemini Service (Centralizado)
    generatePairs: async (topic, details, geminiService, model) => {
        let pairs = [];
        let error = null;

        if (geminiService) {
            try {
                // Prompt para texto plano (Mais robusto que JSON)
                const prompt = `Gere 12 perguntas e respostas ÚNICAS sobre "${topic}".
                ${details ? `CONTEXTO ADICIONAL DA AULA: "${details}". Use este contexto para guiar a criação das perguntas.` : ''}
                
                Formato OBRIGATÓRIO por linha: PERGUNTA | RESPOSTA
                
                REGRAS RÍGIDAS:
                1. NUNCA repita a mesma pergunta ou resposta.
                2. Sem numeração, sem markdown, apenas o texto bruto.
                3. As perguntas DEVEM terminar com interrogação "?".
                4. As respostas devem ser curtas (máx 3 palavras).
                5. Gere exatamente 12 pares distintos.
                
                Exemplo:
                Qual a capital da França? | Paris
                Quanto é 2 + 2? | 4`;

                // Usa o serviço centralizado do app (que já trata retry/models/key)
                const text = await geminiService.generateText(prompt, { temperature: 0.7, model });

                if (text) {
                    // Parse de texto linha a linha
                    const lines = text.split('\n').filter(line => line.includes('|'));

                    pairs = lines.map(line => {
                        let [q, a] = line.split('|').map(s => s.trim());
                        if (q && a) {
                            // Garante interrogação no final da pergunta
                            if (!q.endsWith('?') && !q.endsWith(':')) q += '?';
                            return { question: q, answer: a };
                        }
                        return null;
                    }).filter(p => p !== null);
                }
            } catch (err) {
                console.error("Erro Gemini Service:", err);
                error = `Erro IA: ${err.message}`;
            }
        } else {
            error = "Serviço de IA não inicializado. Verifique a API Key.";
        }

        // Fallback genérico APENAS se nenhum par foi gerado
        if (pairs.length === 0) {
            if (!error) error = `Não foi possível gerar sobre "${topic}".`;
            pairs = Array.from({ length: 12 }, (_, i) => ({ question: `Item ${i + 1}`, answer: `Par ${i + 1}` }));
        }

        // Formatação final dos cards
        const selectedPairs = pairs.slice(0, 12);
        const gameCards = [];
        selectedPairs.forEach((pair, index) => {
            gameCards.push({ id: `q-${index}`, pairId: index, content: pair.question, type: 'question', customImage: null });
            gameCards.push({ id: `a-${index}`, pairId: index, content: pair.answer, type: 'answer', customImage: null });
        });

        return { cards: gameCards, error };
    }
};
