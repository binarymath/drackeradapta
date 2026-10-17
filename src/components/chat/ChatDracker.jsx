import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Copy, Check, PlusCircle, Play, Music } from 'lucide-react';
import { useGemini } from '../../contexts/GeminiContext';
import { useActivity } from '../../contexts/ActivityContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const ChatDracker = () => {
    const { geminiService, apiKey } = useGemini();
    const { activeTabId, tabs, updateActivityData, addActivityTab, topic, selectActivityTab } = useActivity();
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
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

    const SYSTEM_PROMPT = `Você é o Drácker, um dragãozinho marrom muito curioso e aventureiro, mascote do sistema educacional "Drácker Adapta". Você é especialista em educação e metodologias ativas.
Sua História (Lore): Você lidera missões para desvendar os mistérios da floresta com a ajuda indispensável de sua turma de amigos: a sábia Coruja, que observa tudo e guarda os segredos do lugar; o ágil Esquilo, sempre muito organizado com suas nozes; a esperta Raposa, que adora fazer truques mágicos; e o fofinho Coelho saltitante. Vocês vivem em uma floresta encantada e podem visitar outros lugares e cenários incríveis.
Objetivo: Ajudar os professores a criar aulas engajadoras. Quando puder e fizer sentido, use exemplos práticos que envolvam você e seus amigos da floresta para ilustrar dicas lúdicas aos professores.
IMPORTANTE: Na primeira interação, o usuário informará o nome e a disciplina que leciona. Memorize essas informações e passe a chamá-lo(a) pelo nome de forma carinhosa, pessoal e respeitosa em todas as respostas seguintes, além de adequar seus exemplos à disciplina informada.
Se for explicar conceitos ou responder questões de matemática, física, química ou ciências exatas, utilize sempre a sintaxe oficial LaTeX (ex: $x^2$, $$\\frac{3}{4}$$, etc.) para que as fórmulas e equações sejam renderizadas perfeitamente com KaTeX.
Responda de forma sempre encorajadora, criativa, amigável e direta.
Não use respostas longas demais a menos que seja solicitado. Seja prático.`;

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
            const replyText = await geminiService.generateChatReply(newHistory, SYSTEM_PROMPT);
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



    return (
        <div className="flex flex-col h-[calc(100vh-95px)] min-h-[640px] w-full bg-gradient-to-b from-[#fdfbf7] via-[#faf6ef] to-[#f5ede4] rounded-3xl overflow-hidden border border-brown-200/70 shadow-2xl relative">
            
            {/* Header Area */}
            <div className="bg-white/85 backdrop-blur-md border-b border-brown-200/60 px-6 py-3.5 flex justify-between items-center z-20 shadow-xs shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100/90 border border-amber-300 flex items-center justify-center shadow-xs">
                        <img src="/dracker_character.png" alt="Drácker" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                        <span className="font-black text-brown-950 text-base md:text-lg flex items-center gap-2">
                            Conversar com o Drácker
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </span>
                        <span className="text-xs text-brown-500 font-semibold hidden sm:inline">Seu companheiro de expedições e metodologias pedagógicas</span>
                    </div>
                </div>
                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-brown-800 bg-white hover:bg-brown-100/80 rounded-xl transition-all border border-brown-300 shadow-xs cursor-pointer active:scale-95"
                    title="Iniciar nova conversa do zero"
                >
                    <PlusCircle className="w-4 h-4 text-amber-600" />
                    <span>Nova Conversa</span>
                </button>
            </div>

            {/* Main Chat Area - Leitura Ampla, Fluida e Altura Total */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-12 py-6 space-y-7 custom-scrollbar relative z-10">
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
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
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
                                        {msg.parts[0].text}
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

            {/* Input Area Flutuante em 3D Transparente / Glassmorphism de Alta Amplitude */}
            <div className="px-4 pb-4 sm:px-6 sm:pb-6 md:px-12 md:pb-6 pt-2 z-20 shrink-0 bg-gradient-to-t from-[#f5ede4] via-[#f5ede4]/90 to-transparent">
                
                {/* Ações Rápidas: Coisas do Drácker */}
                <div className="max-w-6xl mx-auto flex items-center gap-2.5 mb-2.5 overflow-x-auto no-scrollbar py-0.5">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <img src="/cover_musica_dracker.jpg" alt="Turma" className="w-5 h-5 rounded-full object-cover border border-brown-300" onError={(e) => { e.target.src = '/dracker_expedition_logo.png' }} />
                        <span className="text-[11px] font-black uppercase text-brown-600 tracking-wider">Atalhos da Floresta:</span>
                    </div>
                    
                    <button
                        type="button"
                        onClick={handleOpenRadio}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm border border-pink-200 text-pink-700 transition-all text-xs font-bold shrink-0 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                    >
                        <Music className="w-3.5 h-3.5 text-pink-500" />
                        Rádio Drácker
                    </button>

                    <button
                        type="button"
                        onClick={handleOpenVideoGallery}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm border border-indigo-200 text-indigo-700 transition-all text-xs font-bold shrink-0 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                    >
                        <Play className="w-3.5 h-3.5 text-indigo-500" />
                        Galeria de Vídeos
                    </button>
                </div>

                {!apiKey && (
                    <div className="text-xs text-amber-900 mb-2 font-bold text-center bg-amber-100/90 backdrop-blur-md py-2 px-4 rounded-2xl border border-amber-300 max-w-6xl mx-auto shadow-2xs">
                        ⚠️ Insira sua Chave de API no botão superior para conversar com o Drácker.
                    </div>
                )}

                {/* Text Field de Diálogo 3D Amplo e Confortável */}
                <div className="relative max-w-6xl mx-auto rounded-[2rem] bg-white/85 backdrop-blur-md p-2 shadow-[0_14px_40px_rgba(62,39,35,0.14),0_2px_6px_rgba(0,0,0,0.04)] border-2 border-white/95 hover:border-amber-300 focus-within:border-amber-500 focus-within:shadow-[0_18px_45px_rgba(217,119,6,0.2)] transition-all">
                    <div className="flex items-end gap-3 px-3 py-1.5">
                        <textarea
                            className="flex-1 max-h-40 min-h-[58px] py-2.5 outline-none resize-none bg-transparent text-brown-950 placeholder-brown-400 font-medium text-[15px] sm:text-base md:text-[17px] custom-scrollbar leading-relaxed"
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
                            className="p-3.5 mb-1 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-md shadow-amber-600/35 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                            title="Enviar mensagem (Enter)"
                        >
                            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatDracker;
