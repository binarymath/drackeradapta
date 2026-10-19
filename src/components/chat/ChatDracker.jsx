import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Copy, Check, PlusCircle, Play, Music, BookOpen, ClipboardList, Sparkles } from 'lucide-react';
import { useGemini } from '../../contexts/GeminiContext';
import { useActivity } from '../../contexts/ActivityContext';
import { toast } from '../ui/Toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Converte expressões, fórmulas e comandos LaTeX em texto corrente, limpo e legível para leitura fluida
export const latexToReadableText = (text) => {
    if (!text || typeof text !== 'string') return text;
    let s = text;

    // Frações recursivas ou simples: \frac{a}{b} ou frac{a}{b} -> a/b
    // Executa em loop para tratar frações aninhadas
    let prev;
    let loops = 0;
    do {
        prev = s;
        s = s.replace(/\\?frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2');
        loops++;
    } while (s !== prev && loops < 5);

    // Raízes: \sqrt[n]{x} -> raiz n-ésima(x), \sqrt{x} -> raiz(x)
    s = s.replace(/\\?sqrt\[([^\]]+)\]\{([^}]+)\}/g, 'raiz $1 de $2');
    s = s.replace(/\\?sqrt\{([^}]+)\}/g, 'raiz de $1');
    s = s.replace(/\\?sqrt\s+(\d+|[a-zA-Z])/g, 'raiz de $1');

    // Potências e expoentes
    s = s.replace(/\^\{0\}/g, '⁰');
    s = s.replace(/\^\{1\}/g, '¹');
    s = s.replace(/\^\{2\}/g, '²');
    s = s.replace(/\^\{3\}/g, '³');
    s = s.replace(/\^\{4\}/g, '⁴');
    s = s.replace(/\^\{5\}/g, '⁵');
    s = s.replace(/\^2\b/g, '²');
    s = s.replace(/\^3\b/g, '³');
    s = s.replace(/\^\{([^}]+)\}/g, '^($1)');

    // Subscritos simples
    s = s.replace(/_\{([^}]+)\}/g, '_$1');

    // Operadores matemáticos usuais e símbolos gregos
    s = s.replace(/\\times\b/g, ' × ');
    s = s.replace(/\\cdot\b/g, ' · ');
    s = s.replace(/\\div\b/g, ' ÷ ');
    s = s.replace(/\\pm\b/g, ' ± ');
    s = s.replace(/\\mp\b/g, ' ∓ ');
    s = s.replace(/\\neq\b/g, ' ≠ ');
    s = s.replace(/\\leq\b/g, ' ≤ ');
    s = s.replace(/\\geq\b/g, ' ≥ ');
    s = s.replace(/\\approx\b/g, ' ≈ ');
    s = s.replace(/\\infty\b/g, ' ∞ ');
    s = s.replace(/\\pi\b/g, 'π');
    s = s.replace(/\\alpha\b/g, 'α');
    s = s.replace(/\\beta\b/g, 'β');
    s = s.replace(/\\theta\b/g, 'θ');
    s = s.replace(/\\Delta\b/g, 'Δ');
    s = s.replace(/\\sum\b/g, 'soma de');
    s = s.replace(/\\prod\b/g, 'produto de');
    s = s.replace(/\\int\b/g, 'integral de');
    s = s.replace(/\\%|\\percent\b/g, '%');
    s = s.replace(/\\degree\b|\\circ\b/g, '°');

    // Estilos de texto em fórmulas: \text{...}, \mathbf{...}, \mathit{...}, etc.
    s = s.replace(/\\(text|textbf|textit|mathrm|mathbf|mathit)\{([^}]+)\}/g, '$2');

    // Espaçamentos em LaTeX: \, \: \; \! \quad \qquad
    s = s.replace(/\\[,;:!]/g, ' ');
    s = s.replace(/\\(quad|qquad)/g, ' ');

    // Parênteses e delimitadores especiais: \left( \right), \left[ \right]
    s = s.replace(/\\left\s*([([{|])/g, '$1');
    s = s.replace(/\\right\s*([)\]}|])/g, '$1');

    // Remove delimitadores de LaTeX de bloco e linha: \[ \] \( \)
    s = s.replace(/\\\[([\s\S]*?)\\\]/g, '$1');
    s = s.replace(/\\\(([\s\S]*?)\\\)/g, '$1');

    // Remove delimitadores de cifrão duplo $$...$$ e simples $...$
    s = s.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
    s = s.replace(/\$([^$\n]+)\$/g, '$1');

    // Limpa qualquer barra invertida residual antes de operadores ou chaves
    s = s.replace(/\\\{/g, '{').replace(/\\\}/g, '}');

    // Caso ainda tenha sobrado algum cifrão envolvendo números/fórmulas (ex: $1/2$ ou $x$)
    s = s.replace(/\$([0-9a-zA-Z\s+\-*/=^().,]+)\$/g, '$1');
    // E elimina qualquer cifrão colado a expressões matemáticas que não represente moeda (ex: $1/2)
    s = s.replace(/\$([a-zA-Z0-9/+\-*^()]+)/g, '$1');

    // Remove espaços múltiplos gerados pelas substituições
    s = s.replace(/ {2,}/g, ' ');

    return s;
};

export const ChatDracker = () => {
    const { geminiService, apiKey } = useGemini();
    const { activeTabId, tabs, updateActivityData, addActivityTab, topic, selectActivityTab } = useActivity();
    const existingStorybook = activeTabId
        ? tabs?.find(tab => tab.type === 'storybook' && tab.sourceChatTabId === activeTabId)
        : null;
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isGeneratingBook, setIsGeneratingBook] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    // Modos de resposta: história, metodologia ou ambos.
    const [pedagogicMode, setPedagogicMode] = useState('story_and_recipe');
    const messagesEndRef = useRef(null);

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleNewChat = () => {
        addActivityTab({
            type: 'chat_dracker',
            title: topic || 'Conversa com Drácker',
            chatData: {
                messages: [{
                    role: 'model',
                    parts: [{ text: "Olá! Que bom te encontrar por aqui!\n\nEu sou o Drácker, o dragãozinho marrom mais curioso da floresta encantada e mascote do \"Drácker Adapta\"! Minha missão, e a da minha turma de amigos (a sábia Coruja, o ágil Esquilo, a esperta Raposa e o fofinho Coelho), é ajudar você a transformar suas aulas em verdadeiras expedições de aprendizado, cheias de descobertas e engajamento!\n\nPara começarmos nossa aventura juntos, me diga: qual é o seu nome e o assunto de nossa conversa? Assim, posso te ajudar de uma forma ainda mais especial e adaptada aos seus desafios!\n\nMal posso esperar para desvendarmos os mistérios da educação ativa com você! Vamos nessa?" }]
                }]
            }
        });
    };

    const handleOpenRadio = () => {
        const existingTab = tabs?.find(t => t.type === 'simplify' && !t.hidden);
        if (existingTab) {
            selectActivityTab(existingTab.id);
        } else if (addActivityTab) {
            addActivityTab({
                title: "Rádio Drácker",
                type: 'simplify',
                content: 'Rádio Drácker - Músicas e Ritmos Pedagógicos',
                data: {}
            });
        }
    };

    const handleOpenVideoGallery = () => {
        const existingTab = tabs?.find(t => t.type === 'video_gallery' && !t.hidden);
        if (existingTab) {
            selectActivityTab(existingTab.id);
        } else if (addActivityTab) {
            addActivityTab({
                title: "Galeria Drácker",
                type: 'video_gallery',
                content: 'Galeria de Vídeos',
                data: {}
            });
        }
    };

    const getSystemPrompt = (mode, isFirstInteraction) => {
        const baseLore = `Você é o Drácker, um dragãozinho marrom muito curioso e aventureiro, mascote do sistema educacional "Drácker Adapta". Você é especialista em educação, mediação pedagógica e metodologias ativas.
Sua História (Lore): Você lidera missões com sua turma da floresta encantada: a sábia Coruja, que observa tudo e guarda os segredos do lugar; o ágil Esquilo, muito organizado; a esperta Raposa, que adora truques mágicos; e o fofinho Coelho saltitante.
PERSONALIZAÇÃO: A saudação inicial já pergunta o nome e o assunto; não repita essa pergunta se ela já apareceu na conversa. Se ainda não tiver perguntado, pergunte naturalmente uma única vez. Quando a pessoa compartilhar o nome ou o contexto da turma pela primeira vez, reconheça essa informação com um elogio inteligente, sincero e específico ao que ela demonstrou (por exemplo, uma boa observação pedagógica ou cuidado com a aprendizagem). Use o nome somente nesse primeiro reconhecimento; não o repita em todas as respostas. Não invente elogios nem informações pessoais.
REGRA MANDATÓRIA DE FORMATAÇÃO DE TEXTO E MATEMÁTICA:
NUNCA use código LaTeX nem coloque expressões entre cifrões ($ ou $$). NUNCA escreva fórmulas como $\frac{1}{2}$, $x^2$ ou semelhantes. Escreva sempre tudo em TEXTO CORRENTE, PURO E NATURAL em português, que seja fácil, agradável e fluido para qualquer professor ou aluno ler (por exemplo: escreva "1/2", "metade", "3/4", "x²", "raiz quadrada de 16", "2 + 2 = 4", "fração de 1 sobre 2"). Fórmulas matemáticas devem ser integradas naturalmente à frase sem símbolos de código.
REGRA MANDATÓRIA DE LOCAL: Todas as dinâmicas e atividades propostas DEVEM SER 100% EXECUTÁVEIS DENTRO DA SALA DE AULA (com carteiras organizadas em pequenos grupos de 3 a 4, duplas ou individuais), SEM necessidade de deslocamento para pátio, quadra ou fora da sala, A MENOS que o(a) professor(a) solicite explicitamente na conversa.
REFERÊNCIA PEDAGÓGICA: Sempre que apresentar um plano metodológico, nomeie explicitamente ao menos uma metodologia ativa adequada ao objetivo (por exemplo, Think-Pair-Share, aprendizagem cooperativa, aprendizagem baseada em problemas ou projetos, ou sala de aula invertida) e cite um estudioso ou especialista cuja contribuição tenha relação real com a proposta. Explique em uma frase como a referência se conecta à atividade. Doug Lemov, em "Aula Nota 10" (Teach Like a Champion), pode ser citado por técnicas práticas de condução e participação; Barak Rosenshine, pelos Princípios de Instrução. Se usar Lemov ou Rosenshine, nomeie separadamente a metodologia ativa e não afirme que eles criaram essa metodologia nem classifique seus livros/princípios como uma metodologia ativa. Não invente citações, obras ou atribuições; quando a relação não for segura, escolha uma referência mais diretamente ligada à metodologia selecionada.`;

        if (!isFirstInteraction) {
            return `${baseLore}

DIRETRIZ DE CONTINUIDADE:
Esta não é a primeira resposta ao professor. Use o histórico para preservar a história, o tema, a faixa etária e as decisões pedagógicas já estabelecidas.
- Responda de forma breve e natural, tratando somente do pedido mais recente. Não reapresente a história completa, o plano inteiro, listas de dicas ou informações já dadas.
- Quando o professor pedir um ajuste, entregue apenas o trecho revisado ou a etapa alterada, pronto para substituir o anterior. Preserve o restante sem reescrevê-lo.
- Mantenha a metodologia ativa já escolhida, a menos que o professor peça para mudá-la. Se pedir outra opção, escolha uma adequada ao objetivo e diferente das metodologias já sugeridas na conversa; explique a escolha em uma frase e não invente atribuições.
- Só apresente ou altere a dica de neurociência quando o professor pedir ou quando ela for diretamente necessária ao ajuste. Nesse caso, proponha uma dica prática e específica, diferente das já usadas nesta conversa, com uma justificativa cautelosa e sem alegações exageradas.
- Se o professor fizer uma pergunta pontual, responda diretamente em poucas frases. Mantenha o tom acolhedor do Drácker sem repetir saudações, elogios, perguntas ou explicações anteriores.
${mode === 'story_only'
    ? 'Neste modo, trabalhe somente a história; não acrescente metodologia.'
    : mode === 'recipe_only'
        ? 'Neste modo, trabalhe somente a metodologia da aula; não acrescente uma narrativa longa.'
        : 'Neste modo, refine a história e a metodologia apenas nos pontos solicitados, sem repetir ambos por inteiro.'}`;
        }

        if (mode === 'story_only') {
            return `${baseLore}

DIRETRIZ DESTE MODO (APENAS HISTÓRIA LÚDICA INFANTIL):
O(a) professor(a) escolheu o modo SÓ HISTÓRIA. NÃO inclua receita de bolo, cronômetro de minutos ou roteiro metodológico do professor nesta resposta.
Crie uma NARRATIVA INFANTIL ENCANTADORA, calorosa e rica, com o Drácker e seus amigos da floresta (a sábia Coruja, o ágil Esquilo, a esperta Raposa e o fofinho Coelho):
- Desenvolva uma história cativante que contextualize e ensine o tema com magia e curiosidade.
- Divida em parágrafos bem pontuados e diálogos vivos entre os personagens.
- Finalize com uma reflexão calorosa ou uma pergunta estimulante para as crianças.`;
        }

        if (mode === 'recipe_only') {
            return `${baseLore}

DIRETRIZ DESTE MODO (APENAS PLANO DE AULA):
O(a) professor(a) escolheu o modo DIRETO AO PONTO. NÃO invente uma história longa ou narrativa de ficção.
Entregue somente um plano de aula objetivo, claro e aplicável, organizado em etapas. Use linguagem pedagógica natural: não use metáforas ou termos de culinária, nem títulos como "receita de bolo", "ingredientes", "modo de preparo" ou "dica do chef".

Organize a resposta com esta estrutura:
📘 **PLANO DE AULA: [Nome do Tema / Desafio]**
⏱️ **Duração:** 45 a 50 min | 📍 **Local:** 100% na Sala de aula | 👥 **Dinâmica:** [Grupos de 4, Duplas ou Individual]

🧰 **Materiais e organização:**
- Materiais simples disponíveis na sala e organização das carteiras.
- **Metodologia ativa:** informe o nome da abordagem escolhida e como formar duplas, grupos ou trabalhar individualmente.
- Escolha a metodologia pela adequação ao objetivo e à turma; evite recorrer automaticamente à mesma abordagem.
- **Referência pedagógica:** cite um estudioso ou especialista relevante e explique brevemente a conexão com a proposta, sem atribuir a ele ideias que não desenvolveu.

🗺️ **Etapas da aula:**
- 🟢 **Início (5 a 10 min):** Sugestão do que o(a) professor(a) pode dizer, com uma pergunta-gatilho ou desafio breve para despertar a curiosidade.
- 🟡 **Desenvolvimento (20 a 25 min):** Passos concretos da atividade, o que os estudantes farão e como o(a) professor(a) acompanhará a aprendizagem.
- 🔴 **Fechamento (10 a 15 min):** Partilha das descobertas, síntese do conteúdo e uma forma rápida de verificar a compreensão.

🌿 **Olhares da turma da floresta:** inclua uma dica breve e diferente de cada personagem, sempre ligada à sua forma de ver a missão: a Coruja sugere observar evidências de aprendizagem; o Esquilo, organizar materiais e etapas; a Raposa, propor uma adaptação criativa; o Coelho, favorecer participação e acolhimento; e o Drácker, ajudar a turma a manter propósito e curiosidade. As dicas devem ser práticas, sem repetir a mesma orientação.

🧠 **Dica de neurociência para conduzir a turma:** finalize com uma sugestão curta, prática e responsável, escolhida de acordo com o desafio específico desta aula e diferente de fórmulas genéricas repetidas, como usar sempre um sinal de atenção ou dar uma instrução por vez. Relacione-a com cautela à atenção, previsibilidade ou autorregulação, sem prometer controle total nem usar linguagem de domínio/coerção.`;
        }

        // Modo combinado (história e plano de aula)
        return `${baseLore}

    DIRETRIZ DESTE MODO (HISTÓRIA LÚDICA + PLANO DE AULA):
Apresente uma experiência completa e harmoniosa:

1. 📖 **A HISTÓRIA PEDAGÓGICA:**
Uma narrativa calorosa, envolvente e com os personagens da floresta encantada (Drácker, Coruja, Esquilo, Raposa e Coelho), contextualizando o tema com emoção, mistério e descobertas.

2. 📘 **PLANO DE AULA (Início, Desenvolvimento e Fechamento):**
Logo após a narrativa, apresente uma proposta prática para o(a) professor(a) aplicar em sala, conectada à história. Use linguagem pedagógica, sem metáforas ou termos de culinária e sem chamar a proposta de receita:
- 🧰 **Materiais e organização:** Recursos simples da sala, metodologia ativa e formação de duplas ou grupos.
- **Metodologia ativa e referência:** nomeie a metodologia escolhida e cite um estudioso ou especialista com contribuição realmente relacionada; explique em uma frase como sua ideia orienta a atividade. Não atribua a Lemov ou Rosenshine a criação de metodologias que não criaram.
- Escolha a metodologia pela adequação ao objetivo e à turma; não use automaticamente a mesma abordagem.
- 🟢 **Início (5 a 10 min):** Leitura ou encenação da história e uma pergunta-gatilho.
- 🟡 **Desenvolvimento (20 a 25 min):** Atividade concreta nas carteiras, conectada à missão da história, com passos para estudantes e mediação do professor.
- 🔴 **Fechamento (10 min):** Partilha das descobertas, síntese e verificação breve da aprendizagem.
- 🌿 **Olhares da turma da floresta:** uma dica prática e própria de cada personagem: a Coruja observa evidências de aprendizagem; o Esquilo organiza etapas e materiais; a Raposa sugere uma adaptação criativa; o Coelho cuida da participação e do acolhimento; e o Drácker reforça propósito e curiosidade. Não repita dicas e não use títulos culinários.
- 🧠 **Dica de neurociência para conduzir a turma:** encerre com uma sugestão curta e prática, escolhida para o desafio específico desta aula e diferente de fórmulas genéricas repetidas, como usar sempre um sinal de atenção ou dar uma instrução por vez. Relacione-a com cautela à atenção, previsibilidade ou autorregulação; não prometa controle total nem recomende coerção.`;
    };

    // Load messages from current tab
    useEffect(() => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab && currentTab.chatData && currentTab.chatData.messages) {
            setMessages(prev => {
                // Avoid replacing the array if it's identical
                if (JSON.stringify(prev) === JSON.stringify(currentTab.chatData.messages)) return prev;
                return currentTab.chatData.messages;
            });
        } else if (!activeTabId || messages.length === 0) {
            // Initial greeting when no tab or empty
            // Initial greeting when no tab or empty
            setMessages([{
                role: 'model',
                parts: [{ text: "Olá! Que bom te encontrar por aqui!\n\nEu sou o Drácker, o dragãozinho marrom mais curioso da floresta encantada e mascote do \"Drácker Adapta\"! Minha missão, e a da minha turma de amigos (a sábia Coruja, o ágil Esquilo, a esperta Raposa e o fofinho Coelho), é ajudar você a transformar suas aulas em verdadeiras expedições de aprendizado, cheias de descobertas e engajamento!\n\nPara começarmos nossa aventura juntos, me diga: qual é o seu nome e o assunto de nossa conversa? Assim, posso te ajudar de uma forma ainda mais especial e adaptada aos seus desafios!\n\nMal posso esperar para desvendarmos os mistérios da educação ativa com você! Vamos nessa?" }]
            }]);
        }
    }, [activeTabId]); // Removed 'tabs' to prevent infinite update loops

    // Save messages to current tab
    useEffect(() => {
        if (messages.length > 0 && activeTabId) {
            updateActivityData(activeTabId, { chatData: { messages } });
        }
    }, [messages, activeTabId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages.length, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || !apiKey) return;
        
        const isFirstInteraction = !messages.some(message => message.role === 'user');
        const userMsg = { role: 'user', parts: [{ text: input.trim() }] };
        const newHistory = [...messages, userMsg];
        
        setMessages(newHistory);
        setInput('');
        setIsTyping(true);

        if (!activeTabId) {
            addActivityTab({
                type: 'chat_dracker',
                title: topic || 'Conversa com Drácker',
                chatData: { messages: newHistory }
            });
        }

        try {
            const prompt = getSystemPrompt(pedagogicMode, isFirstInteraction);
            const replyText = await geminiService.generateChatReply(newHistory, prompt);
            const modelMsg = { role: 'model', parts: [{ text: replyText }] };
            setMessages(prev => [...prev, modelMsg]);
        } catch (error) {
            console.error(error);
            const errorMsg = { role: 'model', parts: [{ text: "Opa, deu um probleminha aqui nas minhas engrenagens mágicas! Pode tentar de novo?" }] };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleGenerateStorybook = async () => {
        if (!apiKey) {
            toast('Por favor, configure sua Chave de API nas configurações antes de criar o livro.');
            return;
        }

        if (messages.length < 2) {
            toast('Converse um pouquinho mais com o Drácker antes de criar o livro!');
            return;
        }

        try {
            setIsGeneratingBook(true);

            let storybookData;
            let successMessage = '';
            let defaultTitle = '';
            let defaultContent = '';

            if (pedagogicMode === 'story_only') {
                toast('O Drácker e a Coruja estão escrevendo o Livro Infantil (10 páginas)... Aguarde!');
                storybookData = await geminiService.generateStorybookFromChat(messages);
                successMessage = 'Livro Infantil Ilustrado (10 páginas) criado com sucesso!';
                defaultTitle = 'Livro Infantil do Drácker';
                defaultContent = 'Livro Infantil Ilustrado do Drácker';
            } else if (pedagogicMode === 'recipe_only') {
                toast('O Drácker está estruturando o Guia Prático da Aula (10 páginas)... Aguarde!');
                storybookData = await geminiService.generateTeacherGuideBookFromChat(messages);
                successMessage = 'Guia de Metodologia da Aula (10 páginas) criado com sucesso!';
                defaultTitle = 'Guia de Aula do Professor';
                defaultContent = 'Manual Prático de Aula com Metodologia Ativa';
            } else {
                // Modo 'story_and_recipe': 20 páginas (10 de história + 10 de metodologia)
                toast('Produzindo Edição Mestre: 10 páginas de História + 10 páginas de Metodologia (20 páginas)... Aguarde!');
                storybookData = await geminiService.generateFullStoryAndGuideBookFromChat(messages);
                successMessage = 'Edição Mestre (20 páginas: História + Guia) criada com sucesso!';
                defaultTitle = 'Livro e Guia de Aula do Drácker';
                defaultContent = 'Edição Completa: História Infantil + Guia Prático de Aula';
            }
            
            if (addActivityTab) {
                addActivityTab({
                    type: 'storybook',
                    title: storybookData.title || defaultTitle,
                    content: storybookData.synopsis || defaultContent,
                    storybookData: storybookData,
                    sourceChatTabId: activeTabId || null
                });
                toast(successMessage);
            }
        } catch (error) {
            console.error('Erro ao gerar livro:', error);
            toast(`Erro ao criar livro: ${error.message || 'Tente novamente.'}`);
        } finally {
            setIsGeneratingBook(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 w-full bg-gradient-to-b from-[#fdfbf7] via-[#faf6ef] to-[#f5ede4] rounded-2xl overflow-hidden border border-brown-200/70 shadow-xl relative">
            
            {/* Header Area */}
            <div className="bg-white/85 backdrop-blur-md border-b border-brown-200/60 px-5 py-2.5 flex justify-between items-center z-20 shadow-xs shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100/90 border border-amber-300 flex items-center justify-center shadow-xs">
                        <img src="/dracker_character.png" alt="Drácker" className="w-7 h-7 object-contain" />
                    </div>
                    <div>
                        <span className="font-black text-brown-950 text-base flex items-center gap-2">
                            Conversar com o Drácker
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        </span>
                        <span className="text-[11px] text-brown-500 font-semibold hidden sm:inline">Seu companheiro de expedições e metodologias pedagógicas</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-brown-800 bg-white hover:bg-brown-100/80 rounded-xl transition-all border border-brown-300/80 shadow-xs cursor-pointer active:scale-95"
                        title="Iniciar nova conversa do zero"
                    >
                        <PlusCircle className="w-4 h-4 text-amber-600" />
                        <span>Nova Conversa</span>
                    </button>
                </div>
            </div>

            {/* Main Chat Area - Leitura Ampla, Maximizada e Fluida */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 md:px-10 pt-3 pb-2 space-y-4 custom-scrollbar relative z-10">
                {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={idx} className={`flex w-full items-start gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            
                            {/* Drácker Avatar - Topo do Balão */}
                            {!isUser && (
                                <div className="flex-shrink-0 mt-1 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-amber-200 to-amber-50 p-1.5 border-2 border-white shadow-md relative z-20 hover:scale-105 transition-transform">
                                    <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-contain" />
                                </div>
                            )}

                            {/* Message Bubble - Espaçoso, Amplo e Confortável */}
                            <div className={`w-full sm:max-w-[96%] relative px-4 sm:px-6 py-3.5 sm:py-4 rounded-3xl text-[15px] sm:text-[16px] leading-relaxed transition-all ${
                                isUser 
                                ? 'bg-gradient-to-br from-[#6b4733] to-[#4c3224] text-white rounded-tr-md shadow-[0_10px_25px_rgba(76,50,36,0.25)] border-t border-white/20' 
                                : 'bg-white/95 backdrop-blur-md text-brown-950 border-2 border-brown-200/90 rounded-tl-md shadow-[0_10px_30px_rgba(90,60,40,0.07)]'
                            }`}>
                                {/* Copy Button */}
                                <button
                                    onClick={() => handleCopy(msg.parts[0].text, idx)}
                                    className={`absolute top-4 ${isUser ? 'left-4 text-brown-200 hover:text-white' : 'right-4 text-brown-400 hover:text-brown-800'} p-1.5 rounded-xl bg-black/5 hover:bg-black/10 transition-colors z-30 cursor-pointer`}
                                    title="Copiar mensagem"
                                >
                                    {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                
                                <div className="font-normal relative z-20 mt-0.5 flex flex-col markdown-container">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({node, ...props}) => <p className="mb-2.5 last:mb-0" {...props} />,
                                            ul: ({node, ...props}) => <ul className={`list-disc pl-6 my-2.5 space-y-1 ${isUser ? 'marker:text-amber-200' : 'marker:text-amber-600'}`} {...props} />,
                                            ol: ({node, ...props}) => <ol className={`list-decimal pl-6 my-2.5 space-y-1 ${isUser ? 'marker:text-amber-200' : 'marker:text-amber-600'}`} {...props} />,
                                            strong: ({node, ...props}) => <strong className={`font-black ${isUser ? 'text-amber-100' : 'text-brown-950'}`} {...props} />,
                                            h1: ({node, ...props}) => <h1 className={`text-2xl font-black mb-3.5 mt-5 ${isUser ? 'text-white' : 'text-brown-950'}`} {...props} />,
                                            h2: ({node, ...props}) => <h2 className={`text-xl font-extrabold mb-3 mt-4 ${isUser ? 'text-white' : 'text-brown-950'}`} {...props} />,
                                            h3: ({node, ...props}) => <h3 className={`text-lg font-bold mb-2.5 mt-3 ${isUser ? 'text-white' : 'text-brown-950'}`} {...props} />,
                                            a: ({node, ...props}) => <a className={`underline font-bold hover:opacity-80 ${isUser ? 'text-amber-200' : 'text-amber-800 hover:text-amber-950'}`} target="_blank" rel="noopener noreferrer" {...props} />,
                                            blockquote: ({node, ...props}) => <blockquote className={`border-l-4 pl-4 py-2 my-4 italic rounded-r-xl ${isUser ? 'border-amber-300 bg-black/20 text-white' : 'border-amber-500 bg-amber-50/70 text-brown-900'}`} {...props} />,
                                            code: ({node, inline, className, children, ...props}) => {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline ? (
                                                    <pre className="p-4 sm:p-5 rounded-2xl my-4 overflow-x-auto custom-scrollbar font-mono text-sm bg-stone-900 text-stone-100 shadow-inner border border-stone-700">
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    </pre>
                                                ) : (
                                                    <code className={`px-2 py-0.5 rounded-lg text-sm font-mono font-bold ${isUser ? 'bg-black/30 text-amber-200' : 'bg-amber-100/70 text-brown-950'}`} {...props}>
                                                        {children}
                                                    </code>
                                                )
                                            }
                                        }}
                                    >
                                        {latexToReadableText(msg.parts[0].text)}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex w-full justify-start items-center gap-3.5 mt-2">
                        <div className="flex-shrink-0 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-amber-100 p-1.5 border-2 border-white shadow-md">
                            <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-contain animate-bounce" />
                        </div>
                        <div className="bg-white/95 border-2 border-brown-200 px-6 py-4 rounded-[2rem] rounded-tl-md shadow-md flex items-center gap-2">
                            <span className="w-3 h-3 bg-amber-500 rounded-full animate-bounce"></span>
                            <span className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                            <span className="w-3 h-3 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area Fixo colado na parte inferior com plano externo transparente */}
            <div className="sticky bottom-0 px-2 pb-2 sm:px-5 sm:pb-3 md:px-8 pt-2 z-20 shrink-0 bg-white/90 backdrop-blur-md border-t border-brown-200/60 shadow-[0_-8px_20px_rgba(76,50,36,0.06)]">
                
                {/* Barra de Ações Discreta Acima do Text Field */}
                <div className="max-w-6xl mx-auto flex flex-nowrap items-center gap-1.5 mb-1.5 px-0.5 overflow-x-auto no-scrollbar">
                    {/* Controles de Modo e Ação Inteligente */}
                    <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
                        {/* Seletor Segmentado Clean e Moderno */}
                        <div className="inline-flex max-w-full items-center overflow-x-auto no-scrollbar p-1 rounded-2xl bg-stone-100/90 border border-stone-200/80 shadow-inner">
                            <button
                                type="button"
                                onClick={() => {
                                    setPedagogicMode('story_only');
                                    toast('Modo Ativo: Só História Infantil');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    pedagogicMode === 'story_only'
                                        ? 'bg-white text-amber-900 shadow-xs border border-amber-200/60'
                                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                                }`}
                                title="História infantil ilustrada para encantar as crianças"
                            >
                                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                                <span>Só História</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setPedagogicMode('recipe_only');
                                    toast('Modo Ativo: Só Metodologia da Aula');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    pedagogicMode === 'recipe_only'
                                        ? 'bg-white text-amber-900 shadow-xs border border-amber-200/60'
                                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                                }`}
                                title="Roteiro prático passo a passo da aula para o professor (sem história)"
                            >
                                <ClipboardList className="w-3.5 h-3.5 text-amber-700" />
                                <span>Só Metodologia</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setPedagogicMode('story_and_recipe');
                                    toast('Modo Ativo: História + Metodologia Completa');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    pedagogicMode === 'story_and_recipe'
                                        ? 'bg-white text-amber-900 shadow-xs border border-amber-200/60'
                                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                                }`}
                                title="Combinação completa: História lúdica e receita de metodologia da aula"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>História + Metodologia</span>
                            </button>
                        </div>

                        {/* Botão de Ação Direta Inteligente */}
                        <button
                            type="button"
                            onClick={handleGenerateStorybook}
                            disabled={isGeneratingBook || messages.length < 2}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 ${
                                messages.length >= 2
                                    ? pedagogicMode === 'story_and_recipe'
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-amber-600/20'
                                        : pedagogicMode === 'recipe_only'
                                            ? 'bg-amber-800 hover:bg-amber-900 text-white'
                                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-stone-200/80 text-stone-400 opacity-60 cursor-not-allowed border border-stone-200'
                            }`}
                            title={
                                pedagogicMode === 'story_only'
                                    ? "Criar Livro Infantil com 10 páginas ilustradas"
                                    : pedagogicMode === 'recipe_only'
                                        ? "Criar Guia de Aula com 10 passos práticos"
                                        : "Criar Livro Mestre Completo com 20 páginas (10 de história + 10 de metodologia)"
                            }
                        >
                            {isGeneratingBook ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>
                                        {pedagogicMode === 'story_only' && 'Criando Livro...'}
                                        {pedagogicMode === 'recipe_only' && 'Criando Guia...'}
                                        {pedagogicMode === 'story_and_recipe' && 'Criando 20 Páginas...'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    {pedagogicMode === 'story_only' && (
                                        <>
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span>Gerar Livro (10 págs)</span>
                                        </>
                                    )}
                                    {pedagogicMode === 'recipe_only' && (
                                        <>
                                            <ClipboardList className="w-3.5 h-3.5" />
                                            <span>Gerar Guia (10 págs)</span>
                                        </>
                                    )}
                                    {pedagogicMode === 'story_and_recipe' && (
                                        <>
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>Gerar Completo (20 págs)</span>
                                        </>
                                    )}
                                </>
                            )}
                        </button>
                        {existingStorybook && (
                            <button
                                type="button"
                                onClick={() => selectActivityTab(existingStorybook.id)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer shrink-0"
                                title={`Abrir o storybook: ${existingStorybook.title || 'Livro do Drácker'}`}
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Abrir Storybook</span>
                            </button>
                        )}
                    </div>

                    {/* Atalhos Rápidos da Turma Discretos */}
                    <div className="hidden sm:flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleOpenRadio}
                            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/70 hover:bg-white border border-pink-200/70 text-pink-700 transition-all text-xs font-medium shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                            <Music className="w-3 h-3 text-pink-500" />
                            Rádio Drácker
                        </button>

                        <button
                            type="button"
                            onClick={handleOpenVideoGallery}
                            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/70 hover:bg-white border border-indigo-200/70 text-indigo-700 transition-all text-xs font-medium shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                            <Play className="w-3 h-3 text-indigo-500" />
                            Vídeos
                        </button>
                    </div>
                </div>

                {!apiKey && (
                    <div className="text-xs text-amber-900 mb-1 font-bold text-center bg-amber-100/90 py-1 px-4 rounded-xl border border-amber-300 max-w-6xl mx-auto shadow-2xs">
                        ⚠️ Insira sua Chave de API no botão superior para conversar com o Drácker.
                    </div>
                )}

                {/* Text Field com Plano de Fundo Branco, Fixo e Colado na Base */}
                <div className="relative max-w-6xl mx-auto rounded-2xl bg-white p-1.5 shadow-md border-2 border-brown-200/90 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                    <div className="flex items-end gap-2.5 px-2.5 py-0.5">
                        <textarea
                            className="flex-1 max-h-32 min-h-[46px] py-1.5 outline-none resize-none bg-white text-brown-950 placeholder-brown-400 font-medium text-sm sm:text-base custom-scrollbar leading-relaxed"
                            placeholder="Converse com o Drácker sobre ideias de aula, brincadeiras ou desafios pedagógicos..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={isTyping || !apiKey}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isTyping || !input.trim() || !apiKey}
                            className="p-2.5 mb-0.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                            title="Enviar mensagem (Enter)"
                        >
                            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatDracker;
