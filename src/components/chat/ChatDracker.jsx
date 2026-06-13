import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Copy, Check, PlusCircle } from 'lucide-react';
import { useGemini } from '../../contexts/GeminiContext';
import { useActivity } from '../../contexts/ActivityContext';

export const ChatDracker = () => {
    const { geminiService, apiKey } = useGemini();
    const { activeTabId, tabs, updateActivityData, addActivityTab, topic } = useActivity();
    
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
                    parts: [{ text: "Olá, professor(a)! Sou o Drácker. Para começarmos nossa aventura pedagógica, pode se apresentar com nome e disciplina ?" }]
                }]
            }
        });
    };

    const SYSTEM_PROMPT = `Você é o Drácker, um dragãozinho marrom muito curioso e aventureiro, mascote do sistema educacional "Drácker Adapta". Você é especialista em educação e metodologias ativas.
Sua História (Lore): Você lidera missões para desvendar os mistérios da floresta com a ajuda indispensável de sua turma de amigos: a sábia Coruja, que observa tudo e guarda os segredos do lugar; o ágil Esquilo, sempre muito organizado com suas nozes; a esperta Raposa, que adora fazer truques mágicos; e o fofinho Coelho saltitante. Vocês vivem em uma floresta encantada e podem visitar outros lugares e cenários incríveis.
Objetivo: Ajudar os professores a criar aulas engajadoras. Quando puder e fizer sentido, use exemplos práticos que envolvam você e seus amigos da floresta para ilustrar dicas lúdicas aos professores.
IMPORTANTE: Na primeira interação, o usuário informará o nome e a disciplina que leciona. Memorize essas informações e passe a chamá-lo(a) pelo nome de forma carinhosa, pessoal e respeitosa em todas as respostas seguintes, além de adequar seus exemplos à disciplina informada.
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
            setMessages([{
                role: 'model',
                parts: [{ text: "Olá, professor(a)! Sou o Drácker. Para começarmos nossa aventura pedagógica, pode se apresentar com nome e disciplina ?" }]
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

    const formatMessageText = (text) => {
        if (!text) return null;
        
        // Separa por parágrafos
        const paragraphs = text.split(/\n\n+/);
        
        return paragraphs.map((paragraph, pIdx) => {
            // Verifica se o parágrafo é uma lista
            const lines = paragraph.split('\n');
            const isList = lines.every(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));

            const renderInline = (inlineText) => {
                // Renderiza negrito (**texto**)
                const parts = inlineText.split(/(\*\*.*?\*\*)/g);
                return parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-bold text-brown-900">{part.slice(2, -2)}</strong>;
                    }
                    return <span key={i}>{part}</span>;
                });
            };

            if (isList) {
                return (
                    <ul key={pIdx} className="list-disc pl-5 my-3 space-y-1 marker:text-brown-500">
                        {lines.map((line, lIdx) => (
                            <li key={lIdx}>{renderInline(line.replace(/^[-*]\s+/, ''))}</li>
                        ))}
                    </ul>
                );
            }

            return (
                <p key={pIdx} className="mb-3 last:mb-0">
                    {lines.map((line, lIdx) => (
                        <React.Fragment key={lIdx}>
                            {renderInline(line)}
                            {lIdx < lines.length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </p>
            );
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] w-full bg-[#fdfaf6] rounded-2xl overflow-hidden border border-brown-100 relative">
            
            {/* Header Area */}
            <div className="bg-white border-b border-brown-100 p-3 flex justify-between items-center z-20 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <img src="/dracker_character.png" alt="Drácker" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-brown-800">Conversar com o Drácker</span>
                </div>
                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-brown-600 bg-brown-50 hover:bg-brown-100 rounded-lg transition-colors border border-brown-200"
                    title="Iniciar nova conversa do zero"
                >
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Nova Conversa</span>
                </button>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar relative z-10">
                {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                            
                            {/* Drácker Avatar */}
                            {!isUser && (
                                <div className="flex-shrink-0 mr-4 self-end hidden sm:block w-20 h-20 md:w-32 md:h-32 relative z-20 hover:scale-105 transition-transform">
                                    <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-contain drop-shadow-lg" />
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div className={`max-w-[85%] md:max-w-[70%] relative p-5 pt-7 rounded-[28px] text-[15px] md:text-base leading-relaxed group ${
                                isUser 
                                ? 'bg-brown-600 text-white rounded-br-md shadow-md ml-12' 
                                : 'bg-white text-brown-800 border-2 border-brown-200 rounded-bl-md shadow-md mr-12'
                            }`}>
                                {/* Copy Button */}
                                <button
                                    onClick={() => handleCopy(msg.parts[0].text, idx)}
                                    className={`absolute top-3 ${isUser ? 'left-4 text-brown-200 hover:text-white' : 'right-4 text-brown-400 hover:text-brown-800'} opacity-40 hover:opacity-100 transition-opacity z-30`}
                                    title="Copiar mensagem"
                                >
                                    {copiedIndex === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>

                                {/* Speech bubble arrow for Drácker */}
                                {!isUser && (
                                    <div className="absolute -left-[10px] bottom-6 w-5 h-5 bg-white border-b-2 border-l-2 border-brown-200 transform rotate-45 z-10"></div>
                                )}
                                {/* Speech bubble arrow for User */}
                                {isUser && (
                                    <div className="absolute -right-[10px] bottom-6 w-5 h-5 bg-brown-600 transform rotate-45 z-10"></div>
                                )}
                                
                                <div className="font-medium relative z-20 mt-1">
                                    {formatMessageText(msg.parts[0].text)}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex w-full justify-start items-end mt-4">
                        <div className="flex-shrink-0 mr-4 w-20 h-20 md:w-32 md:h-32 relative z-20">
                            <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-contain drop-shadow-lg animate-pulse" />
                        </div>
                        <div className="bg-white border-2 border-brown-200 p-5 rounded-[28px] rounded-bl-md shadow-md relative h-[60px] flex items-center mr-12">
                            <div className="absolute -left-[10px] bottom-6 w-5 h-5 bg-white border-b-2 border-l-2 border-brown-200 transform rotate-45 z-10"></div>
                            <div className="flex gap-1.5 relative z-20">
                                <span className="w-2.5 h-2.5 bg-brown-400 rounded-full animate-bounce"></span>
                                <span className="w-2.5 h-2.5 bg-brown-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                                <span className="w-2.5 h-2.5 bg-brown-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white border-t border-brown-100 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                {!apiKey && (
                    <div className="text-sm text-red-500 mb-3 font-semibold text-center bg-red-50 py-2 rounded-lg border border-red-100">
                        ⚠️ Configure sua Chave de API nas configurações (engrenagem) antes de conversar com o Drácker.
                    </div>
                )}
                <div className="flex items-end gap-3 relative max-w-4xl mx-auto">
                    <textarea
                        className="flex-1 max-h-32 min-h-[60px] p-4 pr-16 rounded-2xl border-2 border-brown-200 focus:border-brown-400 focus:ring-4 focus:ring-brown-50 outline-none resize-none text-brown-800 font-medium custom-scrollbar text-[15px] md:text-base transition-all"
                        placeholder="Pergunte sobre aulas, metodologias ou brincadeiras..."
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
                        className="absolute right-3 bottom-3 p-3 bg-brown-600 hover:bg-brown-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95"
                    >
                        {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatDracker;
