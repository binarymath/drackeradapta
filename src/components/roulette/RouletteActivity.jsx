import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useActivity } from '../../contexts/ActivityContext';
import { useGemini } from '../../contexts/GeminiContext';
import { RouletteWheel } from './RouletteWheel';
import { RouletteCard } from './RouletteCard';
import { StudentHistoryModal } from './StudentHistoryModal';
import { RouletteQuestionsEditorModal } from './RouletteQuestionsEditorModal';
import { RouletteStyleSelector } from './RouletteStyleSelector';
import { TransitionQuestionsModal } from '../modals/TransitionQuestionsModal';
import { ClassesManagerModal } from './ClassesManagerModal';
import { GroupsManagerModal } from './GroupsManagerModal';
import { GroupRoundCard } from './GroupRoundCard';
import { QuestionManagerModal } from './card-modals/QuestionManagerModal';
import { StartClassWarningModal } from './card-modals/StartClassWarningModal';
import { RouletteSidebar } from './RouletteSidebar';
import { ClassSessionReportModal } from './ClassSessionReportModal';
import { GoogleSheetsImportModal } from './GoogleSheetsImportModal';
import { RouletteEmptyState } from './RouletteEmptyState';
import { CheckCircle, XCircle, RotateCcw, List, Download, UserX, Edit3, RotateCw, RefreshCw, Eye, EyeOff, HeartHandshake, Award, Maximize2, Minimize2, Users, Plus, Minus, Target, UserMinus, Sparkles, AlertTriangle, User, Trophy, ChevronRight, ChevronLeft, BarChart3, Play, Square } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

// Quando maximizada, a arena é desenhada direto no <body> (igual ao card do sorteio),
// escapando de containers pai e cobrindo 100% da tela na camada z-[9000].
const ArenaPortal = ({ active, children }) =>
    active && typeof document !== 'undefined' ? createPortal(children, document.body) : children;

// Temas visuais imersivos para o palco de fundo da roleta
import { useRouletteCore, STAGE_THEMES } from './hooks/useRouletteCore';

export const RouletteActivity = () => {
    const {
        isClassActive,
        toggleClassStatus,
        activeActivity,
        activeGroupItems,
        activeGroupTab,
        activeItems,
        activityRemovedIds,
        addActivityTab,
        arenaRef,
        availableHelpers,
        classId,
        classes,
        combinedItems,
        currentClass,
        currentGroups,
        currentSessionId,
        currentTheme,
        gameMode,
        geminiService,
        getItemWeight,
        groupRoundSlots,
        handleResetDrawCycle,
        handleSaveGroups,
        handleSelectStyle,
        handleSpin,
        handleSpinComplete,
        handleToggleDifficulty,
        handleUpdateStudentFull,
        hasRouletteData,
        historyStudent,
        interactionLogs,
        isMaximized,
        isSidebarOpen,
        logTeacherAction,
        pickWeightedQuestion,
        pickWeightedStudent,
        placarTab,
        questionDrawCounts,
        rouletteStyle,
        saveClassUpdates,
        selectedModel,
        sessionStartTime,
        setActiveGroupTab,
        setClasses,
        setGameMode,
        setGroupRoundSlots,
        setHistoryStudent,
        setInteractionLogs,
        setIsMaximized,
        setIsSidebarOpen,
        setPlacarTab,
        setQuestionDrawCounts,
        setRouletteStyle,
        setShowCard,
        setShowClassReportModal,
        setShowClassesModal,
        setShowDifficulty,
        setShowGroupRoundConfirm,
        setShowGroupsModal,
        setShowQuestionsEditor,
        setShowSheetsModal,
        setShowTransitionModal,
        setSpinning,
        setStudentDrawCounts,
        setUsedQuestions,
        setWinner,
        showCard,
        showClassReportModal,
        showClassesModal,
        showDifficulty,
        showGroupRoundConfirm,
        showGroupsModal,
        showQuestionsEditor,
        showSheetsModal,
        showTransitionModal,
        spinning,
        groupSpinMode,
        setGroupSpinMode,
        startGroupRound,
        studentCycleInfo,
        studentDrawCounts,
        studentProbabilityStats,
        studentToGroupMap,
        tabs,
        toggleMaximize,
        uniqueQuestions,
        updateActivityData,
        updateStudentInClass,
        usedQuestions,
        winner,
        selectedManualQuestionId,
        setSelectedManualQuestionId,
        handleChangeWinnerStudent,
        handleSelectStudentManually,
        handleToggleStudentActivityStatus,
        handleActivateAll,
        handleDeactivateAll,
        handleAdjustPoints,
        handleChangeWinnerQuestion,
        handleEditQuestionContent,
        handleSpinAgain,
        handleResult,
        handleBatchResult,
        handleToggleStudentAbsent,
        handleHelpResult,
        handleSelectGroupManually,
        handleAdjustGroupPoints,
        handleGroupResult,
        handleGroupSlotResult,
        handleChangeGroupSlotQuestion,
        handleEditGroupSlotQuestionContent,
        handleClearGroupRound,
        handleTimerExplode,
        handleRevealAnswer,
        handleRevealHint,
        handleReactivate,
        handleResetUsedQuestions,
        handleDownloadCSV,
        handleSheetsImport,
        handleCreateRouletteFromSheets,
    } = useRouletteCore();

    const [showQuestionManagerModal, setShowQuestionManagerModal] = useState(false);

    const handleToggleQuestionActive = (questionText, isActive) => {
        if (!activeActivity || !activeActivity.questions) return;
        const updatedQs = activeActivity.questions.map(q => {
            if (q.question === questionText) {
                return { ...q, isActive };
            }
            return q;
        });
        updateActivityData(activeActivity.id, { questions: updatedQs });
    };

    const [showStartClassWarning, setShowStartClassWarning] = useState(false);
    const [pendingSpinAction, setPendingSpinAction] = useState(null); // 'spin' | 'groupRound'

    const handleSafeSpinAction = (actionType) => {
        if (!isClassActive) {
            setPendingSpinAction(actionType);
            setShowStartClassWarning(true);
        } else {
            if (actionType === 'spin') handleSpin();
            else if (actionType === 'groupRound') startGroupRound();
        }
    };

    const confirmStartAndSpin = () => {
        toggleClassStatus();
        setShowStartClassWarning(false);
        setTimeout(() => {
            if (pendingSpinAction === 'spin') handleSpin();
            else if (pendingSpinAction === 'groupRound') startGroupRound();
            setPendingSpinAction(null);
        }, 100);
    };

    const confirmTestSpin = () => {
        setShowStartClassWarning(false);
        if (pendingSpinAction === 'spin') handleSpin();
        else if (pendingSpinAction === 'groupRound') startGroupRound();
        setPendingSpinAction(null);
    };

    if (!hasRouletteData && (!classes || classes.length === 0)) {
        return (
            <RouletteEmptyState
                showSheetsModal={showSheetsModal}
                setShowSheetsModal={setShowSheetsModal}
                handleSheetsImport={handleSheetsImport}
                handleCreateRouletteFromSheets={handleCreateRouletteFromSheets}
                classes={classes}
            />
        );
    }
    return (
        <div className={`flex flex-col w-full animate-in fade-in duration-500 bg-slate-50 ${isMaximized ? 'fixed inset-0 z-[9999] h-[100dvh]' : 'relative h-full'}`}>
            
            {/* NOVO TOPO FLUIDO UNIFICADO */}
            <div className={`w-full flex flex-col bg-white p-4 sm:px-6 sm:pt-4 sm:pb-3 shadow-sm border-b border-slate-200 shrink-0 z-20 relative ${isMaximized ? 'rounded-none' : 'rounded-t-[2.5rem]'}`}>
                
                {/* LINHA 1: Estilos da Roleta (maior e no topo) */}
                <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                    <div className="flex-1 w-full overflow-x-auto no-scrollbar">
                        <RouletteStyleSelector 
                            selectedStyle={rouletteStyle}
                            onSelectStyle={handleSelectStyle}
                            disabled={spinning}
                            compact={true}
                        />
                    </div>
                    
                    {/* Botões Iniciar Aula, Placar, Maximizar ao lado dos estilos */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                            type="button"
                            onClick={toggleClassStatus}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all border shadow-sm cursor-pointer ${
                                isClassActive 
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                                    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                            }`}
                        >
                            {isClassActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            <span>{isClassActive ? 'ENCERRAR AULA' : 'INICIAR AULA OFICIAL'}</span>
                        </button>

                        <button onClick={() => setIsSidebarOpen(true)} className="flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl shadow-sm cursor-pointer">
                            <Users className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Placar</span>
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">{combinedItems.length}</span>
                        </button>

                        <button onClick={toggleMaximize} className={`flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl border shadow-sm cursor-pointer ${isMaximized ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-indigo-500" />}
                            <span className="hidden sm:inline">{isMaximized ? 'Minimizar' : 'Maximizar'}</span>
                        </button>
                    </div>
                </div>

                {/* LINHA 2: Turma, Modo, Contadores e Opções */}
                <div className="flex flex-col xl:flex-row justify-between items-center gap-4 w-full">
                    
                    {/* Lado Esquerdo: Turma + Seletor de Modo */}
                    <div className="flex items-center gap-3 flex-wrap">
                        
                        {/* Seletor de Turma */}
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shadow-inner">
                            <select 
                                value={classId || currentClass?.id}
                                onChange={(e) => {
                                    const chosenId = e.target.value;
                                    const chosenObj = (classes || []).find(c => c.id === chosenId);
                                    updateActivityData(activeActivity.id, { 
                                        classId: chosenId,
                                        classData: chosenObj || null
                                    });
                                }}
                                className="bg-transparent max-w-[150px] sm:max-w-xs text-lg font-black text-slate-800 outline-none cursor-pointer truncate"
                                title={currentClass?.name || "Trocar Turma"}
                            >
                                {(classes && classes.length > 0 ? classes : (currentClass ? [currentClass] : [])).map(c => (
                                    <option key={c.id} value={c.id} title={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <span className="text-slate-400 font-bold text-[10px] sm:text-xs px-2 border-l border-slate-200 whitespace-nowrap">
                                {currentClass?.students?.length || 0} alunos
                            </span>
                        </div>

                        {/* Seletor de Modo (Individual/Equipes) */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                            <button
                                type="button"
                                onClick={() => {
                                    if (gameMode !== 'individual') logTeacherAction('mode_change', 'Modo Individual', '');
                                    setGameMode('individual');
                                    setPlacarTab('students');
                                    if (activeActivity && updateActivityData) updateActivityData(activeActivity.id, { gameMode: 'individual' });
                                }}
                                disabled={spinning}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    gameMode === 'individual'
                                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-800 border border-transparent'
                                }`}
                            >
                                <User className="w-3.5 h-3.5" />
                                <span>Individual</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (gameMode !== 'groups') logTeacherAction('mode_change', 'Modo Equipes', '');
                                    setGameMode('groups');
                                    setPlacarTab('groups');
                                    if (activeActivity && updateActivityData) updateActivityData(activeActivity.id, { gameMode: 'groups' });
                                }}
                                disabled={spinning}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    gameMode === 'groups'
                                        ? 'bg-indigo-600 text-white shadow-sm border border-indigo-700'
                                        : 'text-slate-500 hover:text-slate-800 border border-transparent'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>Equipes ({currentGroups.length})</span>
                            </button>
                        </div>
                    </div>

                    {/* Lado Direito: Ações Secundárias */}
                    <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                        {/* Contador de perguntas */}
                        {uniqueQuestions.length > 0 && (
                            <button 
                                onClick={() => setShowQuestionManagerModal(true)}
                                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-slate-100 hover:text-indigo-700 transition-colors cursor-pointer"
                                title="Gerenciar perguntas (Ver histórico, acertos e remover da roleta)"
                            >
                                <span>❓ {usedQuestions.size}/{uniqueQuestions.length}</span>
                                <RefreshCw className="w-3.5 h-3.5 text-indigo-500 ml-0.5" />
                            </button>
                        )}

                        <div className="group relative">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all shadow-sm cursor-pointer">
                                <List className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Opções</span>
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 flex flex-col p-1.5">
                                <button onClick={handleToggleDifficulty} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 w-full text-left cursor-pointer">
                                    {showDifficulty ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    {showDifficulty ? 'Ocultar Dificuldade' : 'Dificuldade Oculta'}
                                </button>
                                <button onClick={() => setShowQuestionsEditor(true)} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 w-full text-left cursor-pointer">
                                    <Edit3 className="w-3.5 h-3.5" /> Editar Perguntas
                                </button>
                                <button onClick={() => setShowSheetsModal(true)} className="flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700 w-full text-left cursor-pointer">
                                    <span>📊</span> Importar Planilha
                                </button>
                                <div className="h-px bg-slate-100 my-1 mx-2" />
                                <button onClick={() => setShowTransitionModal(true)} className="flex items-center gap-2 px-3 py-2 hover:bg-amber-50 rounded-lg text-xs font-bold text-amber-700 w-full text-left cursor-pointer">
                                    <CheckCircle className="w-3.5 h-3.5 text-amber-600" /> Transformar em Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PALCO CENTRAL (Clean) */}
            <div className="w-full flex-1 flex flex-col relative z-10 overflow-hidden">
                <div 
                    ref={arenaRef}
                    className="absolute inset-0 w-full h-full p-4 sm:p-6 lg:p-8 overflow-hidden flex flex-col items-center justify-center transition-all duration-500"
                >
                    {/* Alerta / Convite amigável quando Modo Grupos estiver ativo mas sem grupos */}
                    {gameMode === 'groups' && currentGroups.length === 0 && (
                        <div className="z-20 my-2 max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-lg animate-in fade-in shrink-0">
                            <Users className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
                            <h4 className="text-slate-800 font-bold text-base mb-1">Nenhuma equipe cadastrada</h4>
                            <p className="text-slate-500 text-sm mb-4">Organize os alunos em grupos para girar a roleta por equipes e pontuar juntos!</p>
                            <button
                                type="button"
                                onClick={() => setShowGroupsModal(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> Criar Equipes Agora
                            </button>
                        </div>
                    )}

                    {/* Roda / Chassi de Roleta Central + Alavanca Mecânica */}
                    <div className={`z-10 relative w-full flex items-center justify-center min-h-0 flex-1 px-4 sm:px-16 ${gameMode === 'groups' && currentGroups.length === 0 ? 'opacity-30' : ''}`}>
                        
                        <div className={`relative flex items-center justify-center w-full mx-auto ${
                            (rouletteStyle === 'slot' || rouletteStyle === 'marquee') 
                                ? (isMaximized ? 'max-w-5xl sm:max-w-6xl md:max-w-[90rem]' : 'max-w-4xl')
                                : (isMaximized ? 'max-w-3xl sm:max-w-4xl md:max-w-5xl' : 'max-w-xl sm:max-w-2xl')
                        }`}>
                            
                            <div className="w-full flex justify-center">
                                <RouletteWheel 
                                    style={rouletteStyle}
                                    items={gameMode === 'groups' ? (winner?.id === 'simultaneous' ? [...activeGroupItems, winner] : activeGroupItems) : activeItems} 
                                    spinning={spinning} 
                                    winner={winner} 
                                    onSpinComplete={handleSpinComplete} 
                                    isMaximized={isMaximized}
                                />
                            </div>

                            {/* Alavanca ao lado */}
                            <div 
                                className={`absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-8 flex items-center z-30 transition-all ${
                                    (spinning || (gameMode === 'groups' ? activeGroupItems.length === 0 : activeItems.length === 0)) ? 'cursor-not-allowed opacity-80' : 'cursor-pointer group'
                                }`} 
                            onClick={() => {
                                if (!spinning && (gameMode === 'groups' ? activeGroupItems.length > 0 : activeItems.length > 0)) {
                                    handleSafeSpinAction('spin');
                                }
                            }}
                            title="Puxar Alavanca!"
                        >
                            {/* Base/Slot da Alavanca */}
                            <div className={`bg-gradient-to-r from-zinc-700 to-zinc-900 rounded-r-xl border-y-4 border-r-4 border-zinc-600 shadow-xl flex items-center justify-center relative z-20 ${
                                isMaximized ? 'w-6 sm:w-10 h-32 sm:h-48' : 'w-4 sm:w-8 h-24 sm:h-36'
                            }`}>
                                <div className={`bg-black rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,1)] ${
                                    isMaximized ? 'w-2 sm:w-4 h-24 sm:h-36' : 'w-1.5 sm:w-3 h-16 sm:h-24'
                                }`}></div>
                            </div>

                            {/* Haste e Bola */}
                            <div className={`absolute origin-left transition-transform duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] z-10 flex items-center ${
                                spinning 
                                    ? 'rotate-[65deg]' 
                                    : '-rotate-45 group-hover:-rotate-[35deg] active:rotate-[65deg]'
                            } ${isMaximized ? 'left-3 sm:left-6' : 'left-2 sm:left-4'}`} style={{ top: 'calc(50% - 10px)' }}>
                                <div className={`bg-gradient-to-b from-gray-300 via-white to-gray-500 border border-gray-600 shadow-lg rounded-r-full ${
                                    isMaximized ? 'w-24 sm:w-40 h-6 sm:h-8' : 'w-16 sm:w-28 h-4 sm:h-6'
                                }`}></div>
                                <div className={`absolute bg-gradient-to-br from-red-500 via-red-600 to-red-900 rounded-full border-[3px] sm:border-[5px] border-red-800 shadow-[0_10px_20px_rgba(0,0,0,0.6),inset_-4px_-4px_10px_rgba(0,0,0,0.5),inset_3px_3px_10px_rgba(255,255,255,0.6)] flex items-center justify-center ${
                                    isMaximized ? '-right-6 sm:-right-10 w-16 sm:w-24 h-16 sm:h-24' : '-right-4 sm:-right-8 w-12 sm:w-16 h-12 sm:h-16'
                                }`}>
                                   {/* Detalhe reflexivo da bola */}
                                   <div className="absolute top-[10%] left-[15%] w-[30%] h-[30%] bg-white/40 rounded-full blur-[2px]"></div>
                                </div>
                            </div>
                        </div>

                        </div>
                    </div>
                    
                    {/* ACTION PANEL (Rodapé com Botão Principal e Controles de Equipe) */}
                    <div className="w-full flex flex-col items-center shrink-0 z-20 pt-4 mt-2 max-w-xl mx-auto">
                        {/* Seletor de Modo de Giro para Equipes */}
                        {gameMode === 'groups' && (
                            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => setGroupSpinMode('single')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                                        groupSpinMode === 'single'
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                            : 'text-slate-500 hover:text-slate-700 border border-transparent'
                                    }`}
                                >
                                    🎯 1 Equipe
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGroupSpinMode('all')}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 ${
                                        groupSpinMode === 'all'
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                            : 'text-slate-500 hover:text-slate-700 border border-transparent'
                                    }`}
                                >
                                    ⚡ Todas Simultâneas
                                </button>
                            </div>
                        )}

                        {/* Botão de Sortear Convencional removido (substituído pela alavanca) */}

                        {/* Diálogo de confirmação: rodada com pendentes */}
                        {showGroupRoundConfirm && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
                                <div className="bg-slate-900 border border-amber-500/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 mx-4">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                                        <h3 className="font-black text-white text-sm">Rodada com equipes pendentes</h3>
                                    </div>
                                    <p className="text-slate-300 text-xs leading-relaxed">
                                        Ainda há <strong className="text-amber-300">{groupRoundSlots?.filter(s => s.result === null).length} equipe(s)</strong> sem resultado registrado nesta rodada.
                                        Deseja iniciar uma nova rodada mesmo assim e descartar os pendentes?
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowGroupRoundConfirm(false)}
                                            className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowGroupRoundConfirm(false);
                                                setGroupRoundSlots(null);
                                                setActiveGroupTab(0);
                                                setSpinning(true);
                                                setShowCard(false);
                                                setWinner(null);
                                                setTimeout(() => {
                                                    setSpinning(false);
                                                    startGroupRound();
                                                }, 1200);
                                                gameAudio.playTick();
                                            }}
                                            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer transition-all"
                                        >
                                            Sim, nova rodada
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Seletor Manual Rápido no Palco */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 w-full">
                            {gameMode === 'groups' ? (
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleSelectGroupManually(e.target.value);
                                        }
                                    }}
                                    disabled={spinning || activeGroupItems.length === 0}
                                    className="text-xs sm:text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:text-indigo-700 rounded-xl px-4 py-2.5 outline-none cursor-pointer transition-all shadow-sm focus:ring-2 focus:ring-indigo-100"
                                    title="Escolher manualmente uma equipe específica para responder agora"
                                >
                                    <option value="" disabled>🎯 Escolher Equipe Manualmente...</option>
                                    {activeGroupItems.map(g => (
                                        <option key={g.id} value={g.id}>
                                            {g.name} ({g.members?.length || 0} alunos)
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleSelectStudentManually(e.target.value);
                                        }
                                    }}
                                    disabled={spinning || combinedItems.length === 0}
                                    className="text-xs sm:text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:text-indigo-700 rounded-xl px-4 py-2.5 outline-none cursor-pointer transition-all shadow-sm focus:ring-2 focus:ring-indigo-100"
                                    title="Escolher manualmente um aluno específico para responder agora"
                                >
                                    <option value="" disabled>🎯 Escolher Aluno Manualmente...</option>
                                    <option value="todos_respondem" className="font-black text-indigo-700 bg-indigo-50">⚡ Todos Respondem (Turma Toda)</option>
                                    {combinedItems
                                        .filter(s => s.status !== 'absent')
                                        .map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.status === 'removed' ? '(Fora da Roleta)' : ''}
                                            </option>
                                        ))
                                    }
                                </select>
                            )}
                            
                            {/* Seletor Manual de Pergunta */}
                            <select
                                value={selectedManualQuestionId || ""}
                                onChange={(e) => setSelectedManualQuestionId(e.target.value || null)}
                                disabled={spinning || uniqueQuestions.length === 0}
                                className="text-xs sm:text-sm font-bold bg-white text-slate-700 border border-slate-200 hover:border-indigo-400 hover:text-indigo-700 rounded-xl px-4 py-2.5 outline-none cursor-pointer transition-all shadow-sm focus:ring-2 focus:ring-indigo-100 max-w-xs truncate"
                                title="Escolher uma pergunta específica para a próxima rodada"
                            >
                                <option value="">🎲 Pergunta Aleatória (Padrão)</option>
                                {uniqueQuestions.map(q => (
                                    <option key={q.id} value={q.id}>
                                        {q.question.slice(0, 50)}{q.question.length > 50 ? '...' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* CARD DO RESULTADO DO SORTEIO (portal próprio no body, camada z-[10000]) */}
                {showCard && winner && (
                    <RouletteCard 
                        winner={winner} 
                        allQuestions={uniqueQuestions}
                        usedQuestions={usedQuestions}
                        activeStudents={activeItems}
                        allStudents={combinedItems}
                        availableHelpers={availableHelpers}
                        onChangeQuestion={handleChangeWinnerQuestion}
                        onEditQuestionContent={handleEditQuestionContent}
                        onChangeStudent={handleChangeWinnerStudent}
                        onCorrect={() => handleResult('correct')} 
                        onIncorrect={() => handleResult('incorrect')} 
                        onSpinAgain={handleSpinAgain}
                        onAbsent={() => handleResult('absent')}
                        onBatchResult={handleBatchResult}
                        onHelpResult={handleHelpResult}
                        onGroupResult={handleGroupResult}
                        showDifficulty={showDifficulty}
                        onToggleDifficulty={handleToggleDifficulty}
                        onTimerExplode={handleTimerExplode}
                        onRevealAnswer={handleRevealAnswer}
                        onRevealHint={handleRevealHint}
                        onOpenSidebar={() => setIsSidebarOpen(true)}
                        onClose={() => {
                            setShowCard(false);
                            setWinner(null);
                        }}
                    />
                )}

                {/* CARD DA RODADA SIMULTÂNEA DE EQUIPES */}
                {groupRoundSlots && groupRoundSlots.length > 0 && !showCard && (
                    <GroupRoundCard
                        slots={groupRoundSlots}
                        activeTab={activeGroupTab}
                        onTabChange={setActiveGroupTab}
                        onSlotResult={handleGroupSlotResult}
                        onChangeQuestion={handleChangeGroupSlotQuestion}
                        onEditQuestionContent={handleEditGroupSlotQuestionContent}
                        onClear={handleClearGroupRound}
                        allQuestions={uniqueQuestions}
                        usedQuestions={usedQuestions}
                    />
                )}
            </div>

            {/* Botão Flutuante Criativo na Borda Direita para Abrir a Sidebar */}
            {!isSidebarOpen && !isMaximized && (
                <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-white/95 hover:bg-white text-slate-800 border border-r-0 border-indigo-200/90 shadow-xl hover:shadow-2xl rounded-l-2xl py-3 px-2 sm:px-2.5 flex flex-col items-center gap-2 group transition-all duration-300 hover:-translate-x-1 cursor-pointer backdrop-blur-md"
                    title="Abrir Painel Lateral de Alunos & Placar (Direita)"
                >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-700 tracking-wider [writing-mode:vertical-rl] rotate-180 flex items-center gap-1">
                        <ChevronLeft className="w-3 h-3 text-indigo-500 -rotate-90 group-hover:-translate-y-0.5 transition-transform" />
                        Placar & Alunos
                    </span>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-indigo-200">
                        {combinedItems.length}
                    </span>
                </button>
            )}

            {/* Modal Gerenciador de Perguntas (Quais saíram, Acertos, Remover da roleta) */}
            <QuestionManagerModal
                isOpen={showQuestionManagerModal}
                onClose={() => setShowQuestionManagerModal(false)}
                questions={activeActivity?.questions || []}
                usedQuestions={usedQuestions}
                interactionLogs={interactionLogs}
                onToggleQuestionActive={handleToggleQuestionActive}
                onResetUsedQuestions={handleResetUsedQuestions}
            />

            {/* Aviso caso tentar girar sem iniciar aula */}
            <StartClassWarningModal
                isOpen={showStartClassWarning}
                onClose={() => setShowStartClassWarning(false)}
                onStartAndSpin={confirmStartAndSpin}
                onTestSpin={confirmTestSpin}
            />

            {/* Sidebar Lateral de Alunos & Placar (Retrátil à Direita, abre para a esquerda e fecha somente pelo botão Fechar) */}
            <RouletteSidebar 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                placarTab={placarTab}
                setPlacarTab={setPlacarTab}
                combinedItems={combinedItems}
                currentGroups={currentGroups}
                currentClass={currentClass}
                studentToGroupMap={studentToGroupMap}
                spinning={spinning}
                studentDrawCounts={studentDrawCounts}
                studentProbabilityStats={studentProbabilityStats}
                studentCycleInfo={studentCycleInfo}
                onResetDrawCycle={handleResetDrawCycle}
                onAdjustPoints={handleAdjustPoints}
                onAdjustGroupPoints={handleAdjustGroupPoints}
                onSelectStudentManually={handleSelectStudentManually}
                onSelectGroupManually={handleSelectGroupManually}
                onToggleStudentActivityStatus={handleToggleStudentActivityStatus}
                onReactivate={handleReactivate}
                onActivateAll={handleActivateAll}
                onDeactivateAll={handleDeactivateAll}
                onOpenHistory={(student) => setHistoryStudent(student)}
                onOpenClassReport={() => setShowClassReportModal(true)}
                onOpenGroupsModal={() => setShowGroupsModal(true)}
                onOpenClassesModal={() => setShowClassesModal(true)}
            />


            <StudentHistoryModal 
                isOpen={!!historyStudent} 
                onClose={() => setHistoryStudent(null)} 
                student={historyStudent} 
                geminiService={geminiService}
                selectedModel={selectedModel}
                topic={activeActivity?.topic || activeActivity?.title}
                currentClass={currentClass}
                onUpdateStudent={handleUpdateStudentFull}
            />

            <ClassSessionReportModal 
                isOpen={showClassReportModal}
                onClose={() => setShowClassReportModal(false)}
                currentClass={currentClass}
                currentGroups={currentGroups}
                activeActivity={activeActivity}
                questions={uniqueQuestions}
                currentSessionId={currentSessionId}
                sessionStartTime={sessionStartTime}
                geminiService={geminiService}
                selectedModel={selectedModel}
                interactionLogs={interactionLogs}
                onToggleStudentAbsent={handleToggleStudentAbsent}
                tabs={tabs}
            />

            <RouletteQuestionsEditorModal 
                isOpen={showQuestionsEditor}
                onClose={() => setShowQuestionsEditor(false)}
                activeActivity={activeActivity}
                updateActivityData={updateActivityData}
            />

            <GoogleSheetsImportModal
                isOpen={showSheetsModal}
                onClose={() => setShowSheetsModal(false)}
                mode="import"
                onImport={handleSheetsImport}
                onCreateNew={handleCreateRouletteFromSheets}
            />

            <TransitionQuestionsModal
                isOpen={showTransitionModal}
                onClose={() => setShowTransitionModal(false)}
                mode="roulette_to_quiz"
                sourceQuestions={uniqueQuestions}
                sourceTopic={activeActivity?.topic || 'Roleta'}
                classes={classes}
                geminiService={geminiService}
                selectedModel={selectedModel}
                addActivityTab={addActivityTab}
            />

            {showClassesModal && (
                <ClassesManagerModal 
                    isOpen={showClassesModal}
                    onClose={() => setShowClassesModal(false)}
                    classes={classes || []}
                    setClasses={setClasses}
                    selectedClassId={classId || currentClass?.id}
                    setSelectedClassId={(newId) => {
                        const chosen = (classes || []).find(c => c.id === newId);
                        if (activeActivity?.id) {
                            updateActivityData(activeActivity.id, {
                                classId: newId,
                                classData: chosen || null
                            });
                        }
                    }}
                />
            )}

            <GroupsManagerModal 
                isOpen={showGroupsModal}
                onClose={() => setShowGroupsModal(false)}
                currentClass={currentClass}
                groups={currentGroups}
                students={combinedItems && combinedItems.length > 0 ? combinedItems : (currentClass?.students || [])}
                onSaveGroups={handleSaveGroups}
            />
        </div>
    );
};

export default RouletteActivity;
