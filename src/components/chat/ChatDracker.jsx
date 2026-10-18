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
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isGeneratingBook, setIsGeneratingBook] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    // Modo de resposta: 'story_and_recipe' (História + Receita da Aula) ou 'recipe_only' (Apenas Receita de Bolo da Metodologia)
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

    const getSystemPrompt = (mode) => {
        const baseLore = `Você é o Drácker, um dragãozinho marrom muito curioso e aventureiro, mascote do sistema educacional "Drácker Adapta". Você é especialista em educação, mediação pedagógica e metodologias ativas.
Sua História (Lore): Você lidera missões com sua turma da floresta encantada: a sábia Coruja, que observa tudo e guarda os segredos do lugar; o ágil Esquilo, muito organizado; a esperta Raposa, que adora truques mágicos; e o fofinho Coelho saltitante.
IMPORTANTE: Na primeira interação, memorize o nome do(a) professor(a) e a disciplina para chamá-lo(a) pelo nome carinhosamente em todas as respostas.
REGRA MANDATÓRIA DE FORMATAÇÃO DE TEXTO E MATEMÁTICA:
NUNCA use código LaTeX nem coloque expressões entre cifrões ($ ou $$). NUNCA escreva fórmulas como $\frac{1}{2}$, $x^2$ ou semelhantes. Escreva sempre tudo em TEXTO CORRENTE, PURO E NATURAL em português, que seja fácil, agradável e fluido para qualquer professor ou aluno ler (por exemplo: escreva "1/2", "metade", "3/4", "x²", "raiz quadrada de 16", "2 + 2 = 4", "fração de 1 sobre 2"). Fórmulas matemáticas devem ser integradas naturalmente à frase sem símbolos de código.
REGRA MANDATÓRIA DE LOCAL: Todas as dinâmicas e atividades propostas DEVEM SER 100% EXECUTÁVEIS DENTRO DA SALA DE AULA (com carteiras organizadas em pequenos grupos de 3 a 4, duplas ou individuais), SEM necessidade de deslocamento para pátio, quadra ou fora da sala, A MENOS que o(a) professor(a) solicite explicitamente na conversa.`;

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

DIRETRIZ DESTE MODO (APENAS RECEITA DE BOLO DA METODOLOGIA):
O(a) professor(a) escolheu o modo DIRETO AO PONTO. NÃO invente uma história longa ou narrativa de ficção.
Entregue ESTRITAMENTE a sequência didática prática, estruturada exatamente como uma RECEITA DE BOLO infalível:

Estrutura Obrigatória da Resposta:
🍳 **RECEITA DE BOLO DA AULA: [Nome do Tema / Desafio]**
⏱️ **Duração:** 45 a 50 min | 📍 **Local:** 100% na Sala de aula | 👥 **Dinâmica:** [Grupos de 4, Duplas ou Individual]

📦 **1. INGREDIENTES DA AULA:**
- Materiais simples da sala (folhas de caderno/sulfite, lápis de cor/caneta, lousa/quadro).
- Metodologia Ativa aplicada (ex: Think-Pair-Share / Pense-Compartilhe, Rotação nas Carteiras, Jigsaw simplificado ou Desafio Relâmpago).
- Arranjo rápido das carteiras (fácil de movimentar em 1 minuto sem barulho).

👩‍🍳 **2. MODO DE PREPARO (Passo a Passo com Início, Meio e Fim):**
- 🟢 **INÍCIO / AQUECIMENTO (5 a 10 min):** O que o(a) professor(a) fala na abertura. Pergunta-gatilho ou enigma do Drácker na lousa para ativar a curiosidade imediata e prender a atenção de todos.
- 🟡 **MEIO / DESENVOLVIMENTO ATIVO (20 a 25 min):** Atividade prática dos alunos nas carteiras. Passo a passo do que cada grupo ou aluno deve produzir, calcular ou discutir. Papel do professor como mediador circulando entre as mesas.
- 🔴 **FIM / FECHAMENTO E PARTILHA (10 a 15 min):** Apresentação rápida ("Partilha dos Dragões" - 1 minuto por equipe), síntese do aprendizado e validação do professor.

💡 **DICA DO CHEF DRÁCKER:**
- Como adaptar se a turma for agitada ou quieta.
- Como aplicar 100% individual se não der tempo de fazer grupos.`;
        }

        // Modo 'story_and_recipe' (Padrão Completo)
        return `${baseLore}

DIRETRIZ DESTE MODO (HISTÓRIA LÚDICA + RECEITA DE BOLO DA AULA):
Apresente uma experiência completa e harmoniosa:

1. 📖 **A HISTÓRIA PEDAGÓGICA:**
Uma narrativa calorosa, envolvente e com os personagens da floresta encantada (Drácker, Coruja, Esquilo, Raposa e Coelho), contextualizando o tema com emoção, mistério e descobertas.

2. 🍳 **A RECEITA DE BOLO DA AULA (Início, Meio e Fim):**
Logo após a narrativa, entregue o passo a passo prático para o(a) professor(a) aplicar na sala de aula conectado à história:
- 📦 **Ingredientes da Aula:** Materiais da sala e metodologia ativa utilizada.
- 🟢 **Início (5-10 min):** Leitura/encenação da história e pergunta-gatilho.
- 🟡 **Meio (20-25 min):** Atividade ativa nas carteiras (em grupo de 3 a 4 ou duplas) resolvendo a missão da história.
- 🔴 **Fim (10 min):** Fechamento, partilha dos grupos e síntese do aprendizado.
- 💡 **Dica do Chef Drácker:** Adaptação para atividade 100% individual.`;
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
            const prompt = getSystemPrompt(pedagogicMode);
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
        <div className="flex flex-col flex-1 h-[calc(100vh-170px)] sm:h-[calc(100vh-190px)] min-h-[480px] w-full bg-gradient-to-b from-[#fdfbf7] via-[#faf6ef] to-[#f5ede4] rounded-3xl overflow-hidden border border-brown-200/70 shadow-2xl relative">
            
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
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-10 pt-4 pb-2 space-y-6 custom-scrollbar relative z-10">
                {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={idx} className={`flex w-full items-start gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            
                            {/* Drácker Avatar - Topo do Balão */}
                            {!isUser && (
                                <div className="flex-shrink-0 mt-1 w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-2xl bg-gradient-to-tr from-amber-200 to-amber-50 p-1.5 border-2 border-white shadow-md relative z-20 hover:scale-105 transition-transform">
                                    <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-contain" />
                                </div>
                            )}

                            {/* Message Bubble - Espaçoso, Amplo e Confortável */}
                            <div className={`w-full sm:max-w-[92%] md:max-w-[94%] xl:max-w-[96%] relative px-6 sm:px-8 py-5 sm:py-6 rounded-[2rem] text-[15px] sm:text-[16px] md:text-[17px] leading-relaxed transition-all ${
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
                                            p: ({node, ...props}) => <p className="mb-3.5 last:mb-0" {...props} />,
                                            ul: ({node, ...props}) => <ul className={`list-disc pl-6 my-3.5 space-y-1.5 ${isUser ? 'marker:text-amber-200' : 'marker:text-amber-600'}`} {...props} />,
                                            ol: ({node, ...props}) => <ol className={`list-decimal pl-6 my-3.5 space-y-1.5 ${isUser ? 'marker:text-amber-200' : 'marker:text-amber-600'}`} {...props} />,
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
            <div className="px-3 pb-2 sm:px-6 sm:pb-3 md:px-10 md:pb-3 pt-1 z-20 shrink-0 bg-transparent">
                
                {/* Barra de Ações Discreta Acima do Text Field */}
                <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 mb-1.5 px-0.5">
                    {/* Controles de Modo e Ação Inteligente */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Seletor Segmentado Clean e Moderno */}
                        <div className="inline-flex items-center p-1 rounded-2xl bg-stone-100/90 border border-stone-200/80 shadow-inner">
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
                    </div>

                    {/* Atalhos Rápidos da Turma Discretos */}
                    <div className="flex items-center gap-1.5">
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
