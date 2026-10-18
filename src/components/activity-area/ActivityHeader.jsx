
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    FileText, 
    Check, 
    Pencil, 
    Maximize2, 
    Minimize2, 
    PenSquare, 
    Sparkles, 
    XCircle, 
    Compass, 
    Key, 
    Copy, 
    Download, 
    ChevronDown, 
    CheckCircle2,
    Gamepad2,
    Plus,
    MessageSquare
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from '../ui/Toast';
import { useActivity } from '../../contexts/ActivityContext';
import { useGemini } from '../../contexts/GeminiContext';
import { RPGDocGuideModal } from '../rpg/RPGDocGuideModal';
import { countAllBuiltMissions } from '../../utils/rpgStorage';
import { getAllCreatedSongs } from '../../utils/musicStorage';
import { exportActivityToPdf } from '../../utils/pdfExportHelper';

const MODAL_ACTIVITY_TYPES = ['wordsearch', 'crossword', 'quiz', 'connect_dots', 'domino', 'simplify'];

export const ActivityHeader = ({
    hasContent,
    activityType,
    onEdit,
    onNewActivity,
    showAnswers,
    setShowAnswers,
    handleDownloadPdf,
    foundWords,
    isFullWidth,
    toggleFullWidth,
    openManualMusicEditor,
    activityTitle,
    setActivityTitle,
    onPlayInRoulette,
    isGameMode = false,
    onToggleGameMode
}) => {
    const { activeActivity, tabs, activeTabId, classes, selectActivityTab, addActivityTab } = useActivity();
    const { apiKeyStatus, setShowSettings } = useGemini();
    const [showRPGDocModal, setShowRPGDocModal] = useState(false);
    const [showRelicsModal, setShowRelicsModal] = useState(false);
    const [missionsVersion, setMissionsVersion] = useState(0);
    const [musicLibVersion, setMusicLibVersion] = useState(0);

    const isModalActivity = MODAL_ACTIVITY_TYPES.includes(activityType);

    const handleOpenNewModalActivity = () => {
        if (activityType === 'simplify' && openManualMusicEditor) {
            openManualMusicEditor();
            return;
        }
        if (onNewActivity) {
            onNewActivity(activityType);
            return;
        }
        window.dispatchEvent(new CustomEvent('dracker_open_new_modal_activity', {
            detail: { type: activityType }
        }));
    };

    useEffect(() => {
        const handleUpdate = () => setMissionsVersion(v => v + 1);
        window.addEventListener('dracker_rpg_missions_updated', handleUpdate);
        return () => window.removeEventListener('dracker_rpg_missions_updated', handleUpdate);
    }, []);

    useEffect(() => {
        const handleMusicUpdate = () => setMusicLibVersion(v => v + 1);
        window.addEventListener('dracker_music_library_updated', handleMusicUpdate);
        return () => window.removeEventListener('dracker_music_library_updated', handleMusicUpdate);
    }, []);

    const createdSongsCount = useMemo(() => {
        return getAllCreatedSongs(tabs).length;
    }, [tabs, musicLibVersion]);

    const handleOpenCreatedLyrics = () => {
        const currentTab = (tabs || []).find(t => t.id === activeTabId);
        if (currentTab?.musicData) {
            const radioTab = (tabs || []).find(t => t.type === 'simplify' && !t.musicData && !t.hidden);
            if (radioTab) {
                selectActivityTab(radioTab.id);
            } else if (addActivityTab) {
                addActivityTab({
                    title: 'Rádio Drácker',
                    type: 'simplify',
                    content: ''
                });
            }
        }
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('dracker_open_created_music'));
        }, 50);
    };

    const rpgData = activeActivity?.rpgData;
    const stages = rpgData?.currentData?.etapas || [];
    const totalStages = stages.length;
    const currentRound = rpgData?.round || 1;
    const gameStatus = rpgData?.gameStatus || 'setup';
    const unlockedRelicsCount = gameStatus === 'finished' ? totalStages : Math.max(0, currentRound - 1);

    const builtMissionsCount = useMemo(() => {
        return countAllBuiltMissions(tabs, activeTabId, activeActivity);
    }, [tabs, activeTabId, activeActivity, missionsVersion]);

    const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const copyMenuRef = useRef(null);
    const downloadMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (copyMenuRef.current && !copyMenuRef.current.contains(e.target)) {
                setIsCopyMenuOpen(false);
            }
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
                setIsDownloadMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasAnswersAvailable = useMemo(() => {
        return ['quiz', 'wordsearch', 'crossword', 'domino'].includes(activityType);
    }, [activityType]);

    const handleCopyActivity = (withAnswers = false) => {
        setIsCopyMenuOpen(false);
        try {
            const title = activityTitle || activeActivity?.title || 'Atividade';

            if (activityType === 'quiz') {
                const quizData = activeActivity?.quizData;
                const questions = quizData?.questions || [];
                if (questions.length > 0) {
                    let out = `${title}\n\n`;
                    if (quizData.intro_text) out += `${quizData.intro_text}\n\n`;
                    questions.forEach((q, idx) => {
                        const statement = q.statement || q.question || `Questão ${idx + 1}`;
                        out += `${idx + 1}. ${statement}\n`;
                        const opts = [q.correct_answer, ...(q.distractors || [])].filter(Boolean);
                        const letters = ['A', 'B', 'C', 'D', 'E'];
                        opts.forEach((opt, oIdx) => {
                            const isCorrect = withAnswers && opt === q.correct_answer;
                            out += `   ${letters[oIdx]}) ${opt}${isCorrect ? ' ✓ (Gabarito)' : ''}\n`;
                        });
                        out += '\n';
                    });
                    if (withAnswers) {
                        out += '----------------------------------------\n';
                        out += 'GABARITO OFICIAL:\n';
                        questions.forEach((q, idx) => {
                            out += `${idx + 1}. ${q.correct_answer}\n`;
                        });
                    }
                    navigator.clipboard.writeText(out.trim());
                    toast(withAnswers ? 'Quiz copiado com gabarito!' : 'Questões do quiz copiadas!');
                    return;
                }
            }

            if (activityType === 'wordsearch') {
                let out = `${title}\n\n`;
                if (foundWords && foundWords.length > 0) {
                    out += 'PALAVRAS PARA ENCONTRAR:\n';
                    foundWords.forEach(w => {
                        const word = typeof w === 'string' ? w : (w.word || '');
                        const clue = typeof w === 'object' && w.clue ? ` - ${w.clue}` : '';
                        out += `• ${word}${clue}\n`;
                    });
                }
                if (withAnswers && activeActivity?.content) {
                    out += `\nConteúdo:\n${activeActivity.content.replace(/<[^>]+>/g, '')}`;
                }
                navigator.clipboard.writeText(out.trim());
                toast(withAnswers ? 'Caça-palavras copiado com respostas!' : 'Palavras copiadas!');
                return;
            }

            if (activityType === 'crossword' && activeActivity?.crosswordData) {
                const cw = activeActivity.crosswordData;
                let out = `${title}\n\n`;
                if (cw.clues?.horizontal?.length > 0) {
                    out += 'HORIZONTAIS:\n';
                    cw.clues.horizontal.forEach(c => {
                        out += `${c.number}. ${c.clue}${withAnswers ? ` (Resposta: ${c.answer})` : ''}\n`;
                    });
                    out += '\n';
                }
                if (cw.clues?.vertical?.length > 0) {
                    out += 'VERTICAIS:\n';
                    cw.clues.vertical.forEach(c => {
                        out += `${c.number}. ${c.clue}${withAnswers ? ` (Resposta: ${c.answer})` : ''}\n`;
                    });
                }
                navigator.clipboard.writeText(out.trim());
                toast(withAnswers ? 'Cruzadinha copiada com respostas!' : 'Dicas copiadas!');
                return;
            }

            const rawContent = activeActivity?.content || '';
            const cleanContent = rawContent.replace(/<[^>]+>/g, '').trim();
            const fullText = `${title}\n\n${cleanContent}`;
            navigator.clipboard.writeText(fullText.trim());
            toast('Conteúdo copiado com sucesso!');
        } catch (err) {
            console.error('[handleCopyActivity] Erro:', err);
            toast('Erro ao copiar conteúdo.');
        }
    };

    const handleDownloadDirectPdf = async (withAnswers = false) => {
        setIsDownloadMenuOpen(false);

        const currentShowAnswers = showAnswers;
        if (hasAnswersAvailable && setShowAnswers && currentShowAnswers !== withAnswers) {
            setShowAnswers(withAnswers);
            await new Promise(r => setTimeout(r, 120));
        }

        const title = activityTitle || activeActivity?.title || 'Atividade';
        const suffix = withAnswers ? '_Gabarito' : '_Folha';
        const filename = `${title}${hasAnswersAvailable ? suffix : ''}`;

        await exportActivityToPdf('activity-area-print', filename);

        if (hasAnswersAvailable && setShowAnswers && currentShowAnswers !== withAnswers) {
            setShowAnswers(currentShowAnswers);
        }
    };

    const NON_PRINTABLE_HEADER_TYPES = useMemo(() => [
        'storybook',      // Livro Infantil (possui visualizador próprio com impressão nativa A4 paisagem 50/50 e controles dedicados)
        'simplify',       // Rádio Drácker (possui download próprio discreto de letras/questões na sua barra)
        'rpg',            // DetectiveRPG (jogo interativo)
        'memory',         // Jogo da Memória (possui prévia de impressão própria)
        'roulette',       // Roleta Pedagógica (jogo em tempo real)
        'video_gallery',  // Vídeos Interativos
        'chat_dracker',   // Chat
        'about_system',   // Sobre o Sistema
        'dashboard',      // Dashboard
        'reports',        // Relatórios
        'merge_pdf'       // Unir PDF
    ], []);

    const canExportActivity = hasContent && !NON_PRINTABLE_HEADER_TYPES.includes(activityType);

    return (
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white no-print rounded-t-[2.5rem]">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 mr-3">
                {/* Logo do Drácker no Cabeçalho */}
                <div className="relative group shrink-0">
                    <div className="absolute inset-0 bg-amber-200 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <img 
                        src="/dracker_character.png" 
                        alt="Drácker" 
                        className="w-10 h-10 object-contain relative z-10 drop-shadow-sm transform group-hover:scale-110 transition-transform"
                    />
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`w-2 h-2 rounded-full ${hasContent ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-brown-300'}`}></span>
                            <span className="text-[10px] font-extrabold text-brown-500 uppercase tracking-widest whitespace-nowrap">
                                {activityType === 'about_system' || activityType === 'dashboard'
                                    ? 'Nova Atividade'
                                    : activityType === 'merge_pdf'
                                    ? 'Unir PDF'
                                    : activityType === 'simplify'
                                    ? 'Rádio Drácker'
                                    : activityType === 'video_gallery'
                                    ? 'Vídeos Interativos'
                                    : hasContent
                                    ? 'Atividade Pronta'
                                    : 'Aguardando Geração'}
                            </span>
                        </div>

                        {/* Botão no canto direito na mesma linha do Atividade Pronta */}
                        {activityType === 'storybook' && (
                            <button
                                type="button"
                                onClick={() => {
                                    const sourceId = activeActivity?.sourceChatTabId;
                                    const matchingChatTab = (tabs || []).find(t => 
                                        (sourceId && t.id === sourceId) || t.type === 'chat_dracker'
                                    );
                                    if (matchingChatTab && selectActivityTab) {
                                        selectActivityTab(matchingChatTab.id);
                                        toast('Voltando para a conversa com o Drácker...');
                                    } else if (addActivityTab) {
                                        addActivityTab({
                                            type: 'chat_dracker',
                                            title: 'Conversa com Drácker'
                                        });
                                    }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer ml-auto shrink-0"
                                title="Ir para a conversa com o Drácker que gerou esta criação"
                            >
                                <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                                <span>Conversa com Drácker</span>
                            </button>
                        )}

                        {/* Botão discreto para alternar entre modo folha/impressão e jogar online */}
                        {(['crossword', 'wordsearch', 'domino', 'connect_dots', 'quiz'].includes(activityType)) && hasContent && onToggleGameMode && (
                            <button
                                type="button"
                                onClick={onToggleGameMode}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer shadow-2xs border ${
                                    isGameMode
                                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-xs'
                                        : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
                                }`}
                                title={isGameMode ? "Voltar para o modo de folha para impressão/PDF" : "Jogar online de forma interativa"}
                            >
                                <Gamepad2 className={`w-3.5 h-3.5 ${isGameMode ? 'text-white' : 'text-blue-700'}`} />
                                <span>{isGameMode ? 'Voltar para Folha' : 'Jogar Online'}</span>
                            </button>
                        )}

                        {/* Aviso/Ação de Chave de API se não inserida */}
                        {(!apiKeyStatus || apiKeyStatus === 'empty' || apiKeyStatus === 'invalid') && (
                            <button
                                type="button"
                                onClick={() => setShowSettings(true)}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:brightness-110 border border-rose-600 rounded-lg px-2.5 py-0.5 text-xs font-black shadow-xs animate-pulse cursor-pointer transition-all hover:scale-105"
                                title="Inserir chave de API Gemini para gerar atividades"
                            >
                                <Key className="w-3 h-3 text-amber-200" />
                                <span>Inserir Chave API</span>
                            </button>
                        )}
                    </div>
                    {hasContent && activityType !== 'about_system' && activityType !== 'dashboard' && activityType !== 'merge_pdf' && (
                        <div className="w-full max-w-sm sm:max-w-md lg:max-w-xl">
                            <Input
                                value={activityTitle || ''}
                                onChange={(e) => setActivityTitle && setActivityTitle(e.target.value)}
                                placeholder="Título da Atividade"
                                className="h-7 px-2 text-sm font-bold bg-transparent border-transparent hover:border-brown-200 focus:bg-white focus:border-brown-400 w-full transition-all text-brown-900 rounded-md -ml-2"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2 items-center shrink-0 flex-wrap">
                {/* Ações da Rádio Drácker: Letras Criadas e Compor Música */}
                {activityType === 'simplify' && (
                    <>
                        <Button
                            onClick={handleOpenCreatedLyrics}
                            variant="secondary"
                            className="h-8 text-sm px-3 font-bold cursor-pointer"
                            icon={Sparkles}
                            title="Ver canções e letras didáticas criadas"
                        >
                            Letras Criadas {createdSongsCount > 0 ? `(${createdSongsCount})` : ''}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleOpenNewModalActivity}
                            variant="secondary"
                            className="h-8 text-sm px-3 font-bold cursor-pointer shrink-0"
                            icon={Plus}
                            title="Compor Nova Música Didática (+ Novo)"
                            aria-label="+ Novo"
                        >
                            Novo
                        </Button>
                    </>
                )}

                {/* Gatilho para atividades de modal vazias */}
                {!hasContent && isModalActivity && activityType !== 'simplify' && (
                    <Button
                        type="button"
                        onClick={handleOpenNewModalActivity}
                        variant="secondary"
                        className="h-8 text-sm px-3 font-bold cursor-pointer shrink-0"
                        icon={Plus}
                        title="Criar Nova Atividade (+ Novo)"
                        aria-label="+ Novo"
                    >
                        Novo
                    </Button>
                )}

                {hasContent && (
                    <>
                        {(activityType === 'quiz' || activityType === 'domino') && (
                            <Button
                                onClick={onEdit}
                                variant="secondary"
                                className="h-8 text-sm px-3"
                                icon={Pencil}
                            >
                                Editar
                            </Button>
                        )}
                        {activityType === 'quiz' && (
                            <Button
                                onClick={() => setShowAnswers(!showAnswers)}
                                variant={showAnswers ? "primary" : "secondary"}
                                className={`h-8 text-sm px-3 ${showAnswers ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                icon={showAnswers ? Check : undefined}
                            >
                                {showAnswers ? 'Gabarito ✓' : 'Gabarito'}
                            </Button>
                        )}

                        {activityType === 'rpg' && (
                            <>
                                {totalStages > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowRelicsModal(true)}
                                        className="h-8 px-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                        title="Ver status das relíquias conquistadas nesta expedição"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>{unlockedRelicsCount} de {totalStages} Relíquias Desbloqueadas</span>
                                    </button>
                                )}
                                <Button
                                    type="button"
                                    onClick={() => window.dispatchEvent(new CustomEvent('open_rpg_saved_missions'))}
                                    variant="secondary"
                                    className="h-8 px-3 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                                    icon={Compass}
                                    title="Ver e carregar missões já construídas"
                                >
                                    Missões Já Construídas ({builtMissionsCount})
                                </Button>
                                <Button 
                                    onClick={() => setShowRPGDocModal(true)} 
                                    variant="ghost" 
                                    className="h-8 px-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all" 
                                    icon={FileText} 
                                    title="Documento Pedagógico: O que é RPG, finalidade e como jogar na plataforma"
                                >
                                    Guia do RPG
                                </Button>
                            </>
                        )}
                        {canExportActivity && (
                            <>
                                {/* Botão Novo idêntico a Editar e Gabarito para atividades de modal */}
                                {isModalActivity && (
                                    <Button
                                        type="button"
                                        onClick={handleOpenNewModalActivity}
                                        variant="secondary"
                                        className="h-8 text-sm px-3 font-bold cursor-pointer shrink-0"
                                        icon={Plus}
                                        title="Criar nova atividade deste tipo (+ Novo)"
                                        aria-label="+ Novo"
                                    >
                                        Novo
                                    </Button>
                                )}

                                {/* Menu Discreto: Copiar */}
                                <div className="relative" ref={copyMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCopyMenuOpen(prev => !prev);
                                            setIsDownloadMenuOpen(false);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100/80 border border-stone-200 shadow-2xs transition-all cursor-pointer"
                                        title="Copiar texto ou gabarito da atividade"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                                        <span>Copiar</span>
                                        <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isCopyMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isCopyMenuOpen && (
                                        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-stone-400">
                                                Copiar Conteúdo
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyActivity(false)}
                                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-amber-900 hover:bg-amber-50/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-amber-600" />
                                                <span>Copiar Atividade</span>
                                            </button>
                                            {hasAnswersAvailable && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyActivity(true)}
                                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-emerald-900 hover:bg-emerald-50/70 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-stone-100 mt-1 pt-1.5"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Copiar com Gabarito</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Menu Discreto: Baixar PDF */}
                                <div className="relative" ref={downloadMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsDownloadMenuOpen(prev => !prev);
                                            setIsCopyMenuOpen(false);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100/80 border border-stone-200 shadow-2xs transition-all cursor-pointer"
                                        title="Baixar atividade diretamente em PDF"
                                    >
                                        <Download className="w-3.5 h-3.5 text-stone-500" />
                                        <span>Baixar PDF</span>
                                        <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDownloadMenuOpen && (
                                        <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-stone-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-stone-400">
                                                Baixar em PDF
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadDirectPdf(false)}
                                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-amber-900 hover:bg-amber-50/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-amber-600" />
                                                <span>Folha de Atividade (Aluno)</span>
                                            </button>
                                            {hasAnswersAvailable && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadDirectPdf(true)}
                                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-emerald-900 hover:bg-emerald-50/70 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-stone-100 mt-1 pt-1.5"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Folha com Gabarito</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Modal das Relíquias Desbloqueadas */}
                {showRelicsModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in no-print">
                        <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-amber-200 flex flex-col max-h-[85vh]">
                            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                                        🎒
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">
                                            Relíquias da Expedição
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Artefatos conquistados ({unlockedRelicsCount} de {totalStages} Desbloqueadas):
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowRelicsModal(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Fechar"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="overflow-y-auto py-4 space-y-2.5 flex-1 pr-1 custom-scrollbar">
                                {stages.map((etapa, idx) => {
                                    const stageNum = etapa.round || idx + 1;
                                    const isUnlocked = gameStatus === 'finished' || stageNum < currentRound;
                                    const isCurrent = gameStatus === 'playing' && stageNum === currentRound;
                                    const isLocked = gameStatus !== 'finished' && stageNum > currentRound;

                                    if (isUnlocked) {
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    window.dispatchEvent(new CustomEvent('open_rpg_review_chapter', { detail: { etapa } }));
                                                    setShowRelicsModal(false);
                                                }}
                                                className="w-full text-left p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-300 hover:border-amber-400 flex items-start gap-3 shadow-2xs transition-all cursor-pointer group"
                                                title={`Clique para revisar os desafios e gabarito do Capítulo ${stageNum}`}
                                            >
                                                <span className="text-2xl shrink-0 mt-0.5 group-hover:scale-110 transition-transform">✨</span>
                                                <div className="space-y-0.5 flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider block truncate">
                                                            Capítulo {stageNum} • Conquistado ✨
                                                        </span>
                                                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md">
                                                            Desbloqueado
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-black text-slate-900 group-hover:text-amber-800 transition-colors">
                                                        {etapa.item_recompensa || `Relíquia do Capítulo ${stageNum}`}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 font-medium line-clamp-1">
                                                        {etapa.titulo_capitulo}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    }

                                    if (isCurrent) {
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    window.dispatchEvent(new CustomEvent('open_rpg_review_chapter', { detail: { etapa } }));
                                                    setShowRelicsModal(false);
                                                }}
                                                className="w-full text-left p-3.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/80 border-2 border-indigo-300 hover:border-indigo-400 flex items-start gap-3 shadow-2xs transition-all cursor-pointer group"
                                                title={`Capítulo ${stageNum} em andamento`}
                                            >
                                                <span className="text-2xl shrink-0 mt-0.5 group-hover:scale-110 transition-transform">⚔️</span>
                                                <div className="space-y-0.5 flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block truncate">
                                                            Capítulo {stageNum} • Cena Atual em Investigação
                                                        </span>
                                                        <span className="text-[9px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-md animate-pulse">
                                                            Em Andamento
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-900 transition-colors">
                                                        Relíquia em Disputa: {etapa.item_recompensa || `Relíquia do Capítulo ${stageNum}`}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 font-medium line-clamp-1">
                                                        {etapa.titulo_capitulo}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            className="w-full text-left p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 opacity-60 cursor-not-allowed select-none"
                                            title={`Capítulo ${stageNum} bloqueado para esta turma`}
                                        >
                                            <span className="text-2xl shrink-0 mt-0.5 grayscale">🔒</span>
                                            <div className="space-y-0.5 flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block truncate">
                                                        Capítulo {stageNum} • Bloqueado
                                                    </span>
                                                    <span className="text-[9px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-md">
                                                        Bloqueado
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-500">
                                                    Relíquia Selada
                                                </h4>
                                                <p className="text-xs text-slate-400 font-medium line-clamp-1">
                                                    Complete as investigações anteriores para desbloquear
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowRelicsModal(false)}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal do Guia Pedagógico de RPG */}
                <RPGDocGuideModal isOpen={showRPGDocModal} onClose={() => setShowRPGDocModal(false)} />

                {activityType !== 'storybook' && (
                    <>
                        <div className="h-6 w-px bg-brown-200 mx-1"></div>

                        <Button
                            onClick={toggleFullWidth}
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-brown-100 text-brown-500"
                            icon={isFullWidth ? Minimize2 : Maximize2}
                            title={isFullWidth ? "Restaurar Visão" : "Expandir Tela"}
                        />
                    </>
                )}
            </div>
        </div>
    );
};
