
import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Check, Pencil, Maximize2, Minimize2, PenSquare, Printer, Dices, Sparkles, XCircle, Compass, Users, Play, Square, Key } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useActivity } from '../../contexts/ActivityContext';
import { useGemini } from '../../contexts/GeminiContext';
import { RPGDocGuideModal } from '../rpg/RPGDocGuideModal';
import { countAllBuiltMissions } from '../../utils/rpgStorage';

export const ActivityHeader = ({
    hasContent,
    activityType,
    onEdit,
    showAnswers,
    setShowAnswers,
    handleDownloadPdf,
    foundWords,
    isFullWidth,
    toggleFullWidth,
    openManualMusicEditor,
    activityTitle,
    setActivityTitle,
    onPlayInRoulette
}) => {
    const { activeActivity, tabs, activeTabId, classes } = useActivity();
    const { apiKeyStatus, setShowSettings } = useGemini();
    const [showRPGDocModal, setShowRPGDocModal] = useState(false);
    const [showRelicsModal, setShowRelicsModal] = useState(false);
    const [missionsVersion, setMissionsVersion] = useState(0);
    const [rpgSessionState, setRpgSessionState] = useState(() => ({
        isClassActive: !!activeActivity?.rpgData?.isClassActive,
        elapsedTimeStr: '',
        selectedClassId: activeActivity?.classId || ''
    }));

    useEffect(() => {
        const handleSessionState = (e) => {
            if (e.detail) {
                setRpgSessionState(prev => ({ ...prev, ...e.detail }));
            }
        };
        window.addEventListener('dracker_rpg_session_state', handleSessionState);
        return () => window.removeEventListener('dracker_rpg_session_state', handleSessionState);
    }, []);

    useEffect(() => {
        const handleUpdate = () => setMissionsVersion(v => v + 1);
        window.addEventListener('dracker_rpg_missions_updated', handleUpdate);
        return () => window.removeEventListener('dracker_rpg_missions_updated', handleUpdate);
    }, []);

    const rpgData = activeActivity?.rpgData;
    const stages = rpgData?.currentData?.etapas || [];
    const totalStages = stages.length;
    const currentRound = rpgData?.round || 1;
    const gameStatus = rpgData?.gameStatus || 'setup';
    const unlockedRelicsCount = gameStatus === 'finished' ? totalStages : Math.max(0, currentRound - 1);

    const builtMissionsCount = useMemo(() => {
        return countAllBuiltMissions(tabs, activeTabId, activeActivity);
    }, [tabs, activeTabId, activeActivity, missionsVersion]);

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
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`w-2 h-2 rounded-full ${hasContent ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-brown-300'}`}></span>
                        <span className="text-[10px] font-extrabold text-brown-500 uppercase tracking-widest whitespace-nowrap">
                            {activityType === 'about_system' || activityType === 'dashboard'
                                ? 'Nova Atividade'
                                : activityType === 'merge_pdf'
                                ? 'Unir PDF'
                                : hasContent
                                ? 'Atividade Pronta'
                                : 'Aguardando Geração'}
                        </span>

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

                        {/* Nome da Turma ao lado do título de Atividade Pronta (conforme solicitado) */}
                        {activityType === 'rpg' && classes && classes.length > 0 && (
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-lg px-2 py-0.5 shadow-2xs">
                                <Users className="w-3 h-3 text-amber-700 shrink-0" />
                                <select
                                    value={rpgSessionState.selectedClassId || activeActivity?.classId || classes[0]?.id || ''}
                                    onChange={(e) => {
                                        const newCId = e.target.value;
                                        setRpgSessionState(prev => ({ ...prev, selectedClassId: newCId }));
                                        window.dispatchEvent(new CustomEvent('change_rpg_class', { detail: { classId: newCId } }));
                                    }}
                                    className="text-xs font-black text-amber-950 bg-transparent border-none outline-none cursor-pointer pr-1"
                                    title="Turma ativa para esta missão"
                                >
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Iniciar Aula Oficial ao lado direito de Atividade Pronta (conforme solicitado) */}
                        {activityType === 'rpg' && (
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent('toggle_rpg_official_class'))}
                                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-black text-xs transition-all border shadow-2xs cursor-pointer whitespace-nowrap ${
                                    (rpgSessionState.isClassActive || rpgData?.isClassActive)
                                        ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 ring-2 ring-rose-400/30' 
                                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                }`}
                                title={(rpgSessionState.isClassActive || rpgData?.isClassActive) ? 'Encerrar aula oficial e consolidar registros' : 'Iniciar aula oficial com a turma ativa'}
                            >
                                {(rpgSessionState.isClassActive || rpgData?.isClassActive) ? (
                                    <>
                                        <Square className="w-3 h-3 fill-current text-rose-600" />
                                        <span>ENCERRAR AULA {rpgSessionState.elapsedTimeStr ? `(${rpgSessionState.elapsedTimeStr})` : ''}</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3 h-3 fill-current text-indigo-600" />
                                        <span>INICIAR AULA OFICIAL</span>
                                    </>
                                )}
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
                {/* Manual Input Trigger for Music Activity */}
                {activityType === 'simplify' && (
                    <Button
                        onClick={openManualMusicEditor}
                        variant="secondary"
                        className="h-8 text-sm px-3 border-dashed border-brown-300 hover:border-brown-400"
                        icon={PenSquare}
                        title="Criar Manualmente"
                    >
                        Criar Novo
                    </Button>
                )}

                {/* Manual Input Trigger for empty Quiz */}
                {activityType === 'quiz' && !hasContent && (
                    <Button
                        onClick={onEdit}
                        variant="secondary"
                        className="h-8 text-sm px-3 border-dashed border-brown-300 hover:border-brown-400 bg-amber-50 text-amber-700"
                        icon={PenSquare}
                        title="Criar ou Importar Quiz"
                    >
                        Criar Quiz / Importar
                    </Button>
                )}

                {hasContent && (
                    <>
                        {(activityType === 'quiz' || activityType === 'simplify' || activityType === 'domino') && (
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
                            <>
                                <Button
                                    onClick={() => setShowAnswers(!showAnswers)}
                                    variant={showAnswers ? "primary" : "secondary"}
                                    className={`h-8 text-sm px-3 ${showAnswers ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                    icon={showAnswers ? Check : undefined}
                                >
                                    {showAnswers ? 'Gabarito ✓' : 'Gabarito'}
                                </Button>
                                {onPlayInRoulette && (
                                    <Button
                                        onClick={onPlayInRoulette}
                                        variant="secondary"
                                        className="h-8 text-sm px-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border-amber-300 font-bold shadow-2xs transition-all"
                                        icon={Dices}
                                        title="Jogar estas questões na Roleta Pedagógica para sortear alunos e acionar a bomba"
                                    >
                                        Jogar na Roleta
                                    </Button>
                                )}
                            </>
                        )}
                        {activityType === 'wordsearch' && foundWords && foundWords.length > 0 && (
                            <Button
                                onClick={() => setShowAnswers(!showAnswers)}
                                variant={showAnswers ? "primary" : "secondary"}
                                className={`h-8 text-sm px-3 ${showAnswers ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                icon={showAnswers ? Check : undefined}
                            >
                                {showAnswers ? 'Respostas' : 'Respostas'}
                            </Button>
                        )}
                        {activityType === 'rpg' ? (
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
                        ) : (
                            activityType !== 'memory' && (
                                <Button onClick={handleDownloadPdf} variant="ghost" className="h-8 w-8 p-0" icon={Printer} title="Imprimir" />
                            )
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

                <div className="h-6 w-px bg-brown-200 mx-1"></div>

                <Button
                    onClick={toggleFullWidth}
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-brown-100 text-brown-500"
                    icon={isFullWidth ? Minimize2 : Maximize2}
                    title={isFullWidth ? "Restaurar Visão" : "Expandir Tela"}
                />
            </div>
        </div>
    );
};
