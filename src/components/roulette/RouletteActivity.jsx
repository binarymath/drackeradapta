import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import { RouletteSidebar } from './RouletteSidebar';
import { ClassSessionReportModal } from './ClassSessionReportModal';
import { GoogleSheetsImportModal } from './GoogleSheetsImportModal';
import { RouletteEmptyState } from './RouletteEmptyState';
import { CheckCircle, XCircle, RotateCcw, List, Download, UserX, Edit3, RotateCw, RefreshCw, Eye, EyeOff, HeartHandshake, Award, Maximize2, Minimize2, Users, Plus, Minus, Target, UserMinus, Sparkles, AlertTriangle, User, Trophy, ChevronRight, ChevronLeft, BarChart3, Play, Square } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

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
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto py-8 relative min-h-[600px] gap-8 animate-in fade-in zoom-in-95 duration-500">
            
            {/* Header da Turma */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
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
                            className="max-w-[200px] xs:max-w-xs sm:max-w-sm md:max-w-md truncate text-xl sm:text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                            title={currentClass?.name || "Trocar Turma para esta atividade"}
                        >
                            {(classes && classes.length > 0 ? classes : (currentClass ? [currentClass] : [])).map(c => (
                                <option key={c.id} value={c.id} title={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <p className="text-slate-500 font-medium text-sm truncate">
                        {currentClass?.students?.length || 0} alunos • Tema: {activeActivity?.topic || 'Geral'}
                    </p>
                </div>

                {/* ── BARRA DE AÇÕES ─────────────────────────────────────── */}
                <div className="flex items-center gap-2 flex-wrap justify-end shrink-0 overflow-x-auto no-scrollbar">
                    {/* Contador de perguntas */}
                    {uniqueQuestions.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap">
                            <span>❓ {usedQuestions.size}/{uniqueQuestions.length} perguntas</span>
                            {usedQuestions.size > 0 && (
                                <button
                                    onClick={handleResetUsedQuestions}
                                    className="text-amber-600 hover:text-amber-900 transition-colors ml-0.5"
                                    title="Resetar perguntas usadas"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Toggle dificuldade */}
                    <button
                        onClick={handleToggleDifficulty}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border whitespace-nowrap ${
                            showDifficulty
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={showDifficulty ? 'Ocultar dificuldade' : 'Mostrar dificuldade'}
                    >
                        {showDifficulty ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{showDifficulty ? 'Dificuldade visível' : 'Dificuldade oculta'}</span>
                    </button>

                    {/* Grupo: Questões */}
                    <div className="flex items-center gap-px bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                        <button
                            onClick={() => setShowQuestionsEditor(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:bg-white text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                            title="Editar perguntas e gabaritos"
                        >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            Editar
                        </button>
                        <div className="w-px h-5 bg-slate-300" />
                        <button
                            type="button"
                            onClick={() => setShowSheetsModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                            title="Importar questões do Google Sheets"
                        >
                            <span className="text-sm leading-none">📊</span>
                            Planilha
                        </button>
                    </div>

                    {/* Separador visual */}
                    <div className="w-px h-5 bg-slate-200 shrink-0 hidden sm:block" />

                    {/* Grupo: Transformar */}
                    <button
                        onClick={() => setShowTransitionModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-white rounded-xl font-bold text-xs transition-all shadow-sm shrink-0 whitespace-nowrap active:scale-95 cursor-pointer"
                        title="Transformar em Quiz"
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Quiz
                    </button>
                </div>

            </div>

            {/* Palco central com arena temática da roleta */}
            <div className="w-full flex justify-center items-center">
                {/* Arena Imersiva da Roleta */}
                <div 
                    ref={arenaRef}
                    className={`transition-all duration-500 ${
                        isMaximized 
                            ? `fixed inset-0 z-40 w-full h-[100dvh] max-h-[100dvh] m-0 rounded-none border-0 p-3 sm:p-5 md:p-6 flex flex-col justify-between overflow-hidden ${currentTheme.container}`
                            : `w-full max-w-5xl relative flex flex-col items-center justify-center p-5 sm:p-7 rounded-3xl border overflow-hidden ${currentTheme.container}`
                    }`}
                >
                    {/* Spotlight de Iluminação Cênica de Fundo */}
                    <div 
                        className="absolute inset-0 pointer-events-none rounded-3xl transition-all duration-500" 
                        style={{ background: currentTheme.spotlight }}
                    />
                    {/* Textura sutil de arena */}
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none rounded-3xl opacity-50" />

                    {/* Header da Arena */}
                    <div className="flex flex-wrap items-center justify-between w-full mb-1.5 sm:mb-2 z-10 relative gap-2 shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <h2 className={`${isMaximized ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-black text-white tracking-wide flex items-center gap-2`}>
                                <span>Roleta</span>
                                {isMaximized && (
                                    <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-widest hidden sm:inline">
                                        100% Tela Cheia
                                    </span>
                                )}
                            </h2>
                            <span className="text-xs font-bold text-slate-400 hidden md:inline">
                                | Arena de Sorteio
                            </span>
                        </div>

                        {/* Seletor de Modo: Individual vs Equipes */}
                        <div className="flex items-center bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-inner">
                            <button
                                type="button"
                                onClick={() => {
                                    if (gameMode !== 'individual') {
                                        logTeacherAction('mode_change', 'Modo Alterado: Individual', 'Professor mudou a dinâmica da roleta para Modo Individual.');
                                    }
                                    setGameMode('individual');
                                    setPlacarTab('students');
                                    if (activeActivity && updateActivityData) updateActivityData(activeActivity.id, { gameMode: 'individual' });
                                }}
                                disabled={spinning}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    gameMode === 'individual'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <User className="w-3.5 h-3.5" />
                                <span>Individual</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (gameMode !== 'groups') {
                                        logTeacherAction('mode_change', 'Modo Alterado: Equipes', `Professor mudou a dinâmica da roleta para Modo em Equipes (${currentGroups.length} equipes).`);
                                    }
                                    setGameMode('groups');
                                    setPlacarTab('groups');
                                    if (activeActivity && updateActivityData) updateActivityData(activeActivity.id, { gameMode: 'groups' });
                                }}
                                disabled={spinning}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    gameMode === 'groups'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>Equipes ({currentGroups.length})</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs sm:text-sm font-bold text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20 flex items-center gap-1.5 shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                {gameMode === 'groups' ? `${activeGroupItems.length} equipes na roda` : `${activeItems.length} alunos na roda`}
                            </span>

                            {/* Botão para abrir o painel lateral de alunos diretamente da arena */}
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                                title="Abrir Painel Lateral de Alunos & Placar"
                            >
                                <Users className="w-3.5 h-3.5 text-indigo-300" />
                                <span className="hidden sm:inline">Placar</span>
                                <span className="bg-indigo-500/40 text-indigo-200 text-2xs font-black px-1.5 py-0.2 rounded-full border border-indigo-400/30">
                                    {combinedItems.length}
                                </span>
                            </button>

                            {/* Símbolo / Botão de Maximizar e Minimizar */}
                            <button
                                onClick={toggleMaximize}
                                className={`flex items-center gap-1.5 text-xs sm:text-sm font-black px-3 sm:px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-md active:scale-95 ${
                                    isMaximized 
                                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200 ring-2 ring-amber-400/30' 
                                        : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40'
                                }`}
                                title={isMaximized ? "Minimizar Roleta (Esc)" : "Maximizar Roleta (Ocupar 100% da tela)"}
                            >
                                {isMaximized ? (
                                    <>
                                        <Minimize2 className="w-4 h-4 text-slate-950" />
                                        <span className="hidden sm:inline">Minimizar</span>
                                    </>
                                ) : (
                                    <>
                                        <Maximize2 className="w-4 h-4 text-amber-400" />
                                        <span className="hidden sm:inline">Maximizar</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Alerta / Convite amigável quando Modo Grupos estiver ativo mas sem grupos */}
                    {gameMode === 'groups' && currentGroups.length === 0 && (
                        <div className="z-20 my-2 max-w-md w-full bg-purple-950/80 border border-purple-500/50 backdrop-blur-md rounded-2xl p-4 text-center shadow-xl animate-in fade-in shrink-0">
                            <Users className="w-8 h-8 text-purple-300 mx-auto mb-1.5" />
                            <h4 className="text-white font-bold text-sm mb-1">Nenhuma equipe cadastrada ainda</h4>
                            <p className="text-purple-200 text-xs mb-2.5">Organize os alunos em grupos para girar a roleta por equipes e pontuar juntos!</p>
                            <button
                                type="button"
                                onClick={() => setShowGroupsModal(true)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> Criar Equipes Agora
                            </button>
                        </div>
                    )}

                    {/* Seletor dos 6 Estilos de Roleta */}
                    <div className={`w-full z-10 relative shrink-0 ${isMaximized ? 'max-w-4xl mx-auto' : ''}`}>
                        <RouletteStyleSelector 
                            selectedStyle={rouletteStyle}
                            onSelectStyle={handleSelectStyle}
                            disabled={spinning}
                            compact={isMaximized}
                        />
                    </div>
                    
                    {/* Roda / Chassi de Roleta Central */}
                    <div className={`z-10 relative w-full flex items-center justify-center min-h-0 ${isMaximized ? 'flex-1 my-0.5' : 'my-2'}`}>
                        <RouletteWheel 
                            style={rouletteStyle}
                            items={gameMode === 'groups' ? (winner?.id === 'simultaneous' ? [...activeGroupItems, winner] : activeGroupItems) : activeItems} 
                            spinning={spinning} 
                            winner={winner} 
                            onSpinComplete={handleSpinComplete} 
                            isMaximized={isMaximized}
                        />
                    </div>

                    {/* TabCard de Rodada Simult\u00e2nea de Equipes — Fullscreen-capable com cronômetro, fonte e reveal */}
                    {gameMode === 'groups' && groupRoundSlots && !spinning && (() => {
                        const slot = groupRoundSlots[activeGroupTab];
                        const isDone = slot?.result !== null;
                        // Estados do card — mantidos como refs para n\u00e3o resetar ao trocar de aba
                        return (
                            <GroupRoundCard
                                key="group-round-card"
                                slots={groupRoundSlots}
                                activeTab={activeGroupTab}
                                onTabChange={setActiveGroupTab}
                                onSlotResult={handleGroupSlotResult}
                                onEditQuestionContent={handleEditGroupSlotQuestionContent}
                                allQuestions={uniqueQuestions}
                                usedQuestions={usedQuestions}
                                onChangeQuestion={(idx, specificQ = null) => {
                                    if (specificQ) {
                                        handleChangeGroupSlotQuestion(idx, specificQ);
                                        return;
                                    }
                                    const available = uniqueQuestions.filter(
                                        q => !groupRoundSlots.some(s => s.question === q.question)
                                    );
                                    const newQ = available.length > 0
                                        ? available[Math.floor(Math.random() * available.length)]
                                        : uniqueQuestions[Math.floor(Math.random() * uniqueQuestions.length)];
                                    if (newQ) handleChangeGroupSlotQuestion(idx, newQ);
                                }}
                                onClear={handleClearGroupRound}
                                onClose={handleClearGroupRound}
                            />
                        );
                    })()}

                    {/* Botão de Giro Temático e Seletor Manual */}
                    <div className={`z-10 relative flex flex-col items-center shrink-0 ${isMaximized ? 'gap-1.5 sm:gap-2 mb-1 sm:mb-1.5' : 'gap-3 mt-6 sm:mt-8'}`}>
                        
                        {/* Aviso amigável quando todos os alunos foram retirados da roleta */}
                        {gameMode !== 'groups' && activeItems.length === 0 && (
                            <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-amber-500/25 border border-amber-400/60 backdrop-blur-md px-4 py-2.5 rounded-2xl text-amber-100 text-xs font-bold shadow-xl animate-fade-in mb-3">
                                <span>⚠️ Todos os alunos estão fora da roleta.</span>
                                <button
                                    type="button"
                                    onClick={handleActivateAll}
                                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5 text-xs"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Colocar Todos na Roleta
                                </button>
                            </div>
                        )}

                        {/* Botão Iniciar/Encerrar Aula Tematizado */}
                        <button
                            type="button"
                            onClick={toggleClassStatus}
                            className={`mb-3 whitespace-nowrap inline-flex items-center gap-2 px-6 py-2 rounded-2xl font-black text-sm border-2 shadow-2xl transition-all cursor-pointer transform hover:scale-105 active:scale-95 ${
                                isClassActive 
                                    ? 'bg-rose-600/90 text-white hover:bg-rose-700 border-rose-400/50 backdrop-blur-md shadow-rose-900/30' 
                                    : `${currentTheme.button} opacity-90 hover:opacity-100 scale-95`
                            }`}
                            title={isClassActive ? "Encerrar a Aula" : "Iniciar a Aula e registrar atividades na Linha do Tempo"}
                        >
                            {isClassActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            <span>{isClassActive ? 'ENCERRAR AULA' : 'INICIAR AULA OFICIAL'}</span>
                        </button>

                        {/* Seletor de Modo de Giro para Equipes */}
                        {gameMode === 'groups' && (
                            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner mb-3 w-full max-w-sm sm:max-w-md relative z-10">
                                <button
                                    type="button"
                                    onClick={() => setGroupSpinMode('single')}
                                    className={`flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                                        groupSpinMode === 'single'
                                            ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-white/30 scale-[1.02]'
                                            : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    🎯 1 Equipe
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGroupSpinMode('all')}
                                    className={`flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                                        groupSpinMode === 'all'
                                            ? 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-white/30 scale-[1.02]'
                                            : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    ⚡ Todas Simultâneas
                                </button>
                            </div>
                        )}

                        <button 
                            onClick={handleSpin}
                            disabled={spinning || (gameMode === 'groups' ? activeGroupItems.length === 0 : activeItems.length === 0)}
                            className={`rounded-2xl font-black transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2.5 sm:gap-3 cursor-pointer shadow-xl ${
                                isMaximized
                                    ? 'px-6 sm:px-8 lg:px-10 py-2.5 lg:py-3 text-base sm:text-lg lg:text-xl'
                                    : 'px-8 sm:px-12 py-4 sm:py-5 text-xl sm:text-2xl'
                            } ${
                                spinning || (gameMode === 'groups' ? activeGroupItems.length === 0 : activeItems.length === 0)
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60 shadow-none'
                                : currentTheme.button
                            }`}
                        >
                            {spinning 
                                ? currentTheme.spinningLabel 
                                : (gameMode === 'groups' 
                                    ? (activeGroupItems.length === 0 ? 'NENHUMA EQUIPE ATIVA' : (
                                        groupRoundSlots && groupRoundSlots.some(s => s.result === null)
                                            ? '⚡ NOVA RODADA (pendentes!)'
                                            : 'GIRAR EQUIPES! 🏆'
                                    ))
                                    : (activeItems.length === 0 ? 'NENHUM ALUNO NA ROLETA ⚠️' : currentTheme.label)
                                  )
                            }
                        </button>

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
                        <div className="flex items-center gap-2">
                            {gameMode === 'groups' ? (
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleSelectGroupManually(e.target.value);
                                        }
                                    }}
                                    disabled={spinning || activeGroupItems.length === 0}
                                    className="text-xs sm:text-sm font-bold bg-black/40 hover:bg-black/60 text-white/90 border border-white/20 hover:border-amber-400/50 rounded-xl px-3 py-1.5 outline-none cursor-pointer transition-all shadow-md backdrop-blur-sm"
                                    title="Escolher manualmente uma equipe específica para responder agora"
                                >
                                    <option value="" disabled className="text-slate-900 bg-white">🎯 Escolher Equipe Manualmente...</option>
                                    {activeGroupItems.map(g => (
                                        <option key={g.id} value={g.id} className="text-slate-900 bg-white">
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
                                    className="text-xs sm:text-sm font-bold bg-black/40 hover:bg-black/60 text-white/90 border border-white/20 hover:border-amber-400/50 rounded-xl px-3 py-1.5 outline-none cursor-pointer transition-all shadow-md backdrop-blur-sm"
                                    title="Escolher manualmente um aluno específico para responder agora"
                                >
                                    <option value="" disabled className="text-slate-900 bg-white">🎯 Escolher Aluno Manualmente...</option>
                                    <option value="todos_respondem" className="text-slate-900 font-black bg-indigo-100">⚡ Todos Respondem (Turma Toda)</option>
                                    {combinedItems
                                        .filter(s => s.status !== 'absent')
                                        .map(s => (
                                            <option key={s.id} value={s.id} className="text-slate-900 bg-white">
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
                                className="text-xs sm:text-sm font-bold bg-black/40 hover:bg-black/60 text-white/90 border border-white/20 hover:border-purple-400/50 rounded-xl px-3 py-1.5 outline-none cursor-pointer transition-all shadow-md backdrop-blur-sm max-w-xs truncate"
                                title="Escolher uma pergunta específica para a próxima rodada"
                            >
                                <option value="" className="text-slate-900 bg-white">🎲 Pergunta Aleatória (Padrão)</option>
                                {uniqueQuestions.map(q => (
                                    <option key={q.id} value={q.id} className="text-slate-900 bg-white">
                                        {q.question.slice(0, 50)}{q.question.length > 50 ? '...' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* CARD DO RESULTADO DO SORTEIO (DENTRO DA ARENA PARA SUPORTE A FULLSCREEN NATIVO) */}
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
            </div>

            {/* Botão Flutuante Criativo na Borda Direita para Abrir a Sidebar */}
            {!isSidebarOpen && (
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
