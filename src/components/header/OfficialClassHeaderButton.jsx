import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Users, Clock, ChevronDown, Check, GraduationCap, X, ClipboardCheck } from 'lucide-react';
import { useActivity } from '../../contexts/ActivityContext';
import { toast } from '../ui/Toast';
import { gameAudio } from '../../utils/gameAudio';

export const OfficialClassHeaderButton = () => {
    const {
        classes,
        officialSession,
        startOfficialClass,
        endOfficialClass,
        updateActiveSessionClass
    } = useActivity();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(50);
    const [elapsedTime, setElapsedTime] = useState('00:00');

    const popoverRef = useRef(null);

    const isClassActive = !!officialSession?.isClassActive;

    // Atualiza turma selecionada no formulário inicial
    useEffect(() => {
        if (officialSession?.classId) {
            setSelectedClassId(officialSession.classId);
        } else if (classes && classes.length > 0 && !selectedClassId) {
            const firstWithStudents = classes.find(c => c.students && c.students.length > 0);
            setSelectedClassId(firstWithStudents ? firstWithStudents.id : classes[0].id);
        }
    }, [officialSession?.classId, classes]);

    // Timer calmo em tempo real enquanto a aula estiver ativa (sem animações piscantes)
    useEffect(() => {
        if (!isClassActive || !officialSession?.sessionStartTime) {
            setElapsedTime('00:00');
            return;
        }

        const tick = () => {
            const now = Date.now();
            const elapsedMs = Math.max(0, now - officialSession.sessionStartTime);
            const totalMinutes = Math.floor(elapsedMs / 60000);
            const totalSeconds = Math.floor((elapsedMs % 60000) / 1000);
            setElapsedTime(`${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [isClassActive, officialSession?.sessionStartTime]);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStart = () => {
        const targetId = selectedClassId || (classes[0]?.id || null);
        const started = startOfficialClass(targetId, durationMinutes);
        gameAudio?.playSuccess?.();
        toast(`Aula Oficial iniciada com a turma "${started.className}"!`);
        setIsMenuOpen(false);
    };

    const handleEnd = () => {
        endOfficialClass();
        toast('Aula Oficial encerrada.');
        setIsMenuOpen(false);
    };

    const handleClassChange = (newCId) => {
        setSelectedClassId(newCId);
        if (isClassActive) {
            updateActiveSessionClass(newCId);
            const target = (classes || []).find(c => String(c.id) === String(newCId));
            toast(`Turma da aula alterada para "${target?.name || 'Geral'}".`);
        }
    };

    return (
        <div className="relative inline-block text-left" ref={popoverRef}>
            {/* BOTÃO PRINCIPAL NO HEADER */}
            {!isClassActive ? (
                /* Estado Inativo: Discreto e Convidativo */
                <button
                    type="button"
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs cursor-pointer group shrink-0"
                    title="Iniciar Aula Oficial para registrar tempo, presença e avaliações em todas as atividades"
                >
                    <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600/20 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Iniciar Aula</span>
                    <span className="sm:hidden">Aula</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
            ) : (
                /* Estado Ativo: Estático, Sóbrio e Elegante (SEM PULSO) */
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-xl px-2.5 py-1 text-xs font-bold text-emerald-950 shadow-2xs shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(prev => !prev)}
                        className="flex items-center gap-1 hover:text-emerald-800 transition-colors cursor-pointer"
                        title="Ver opções da aula oficial em andamento"
                    >
                        <span className="max-w-[110px] sm:max-w-[150px] truncate">{officialSession?.className || 'Aula Ativa'}</span>
                        <span className="font-mono text-emerald-800 font-extrabold text-[11px] sm:text-xs">
                            ({elapsedTime})
                        </span>
                        <ChevronDown className={`w-3 h-3 text-emerald-600 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                        type="button"
                        onClick={handleEnd}
                        className="ml-1 px-1.5 py-0.5 rounded-md bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 text-[10px] font-black transition-colors cursor-pointer"
                        title="Encerrar aula oficial e consolidar registros"
                    >
                        Encerrar
                    </button>
                </div>
            )}

            {/* POPOVER / MODAL SUSPENSO */}
            {isMenuOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-[60] animate-in fade-in zoom-in-95 duration-150 text-slate-800">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${isClassActive ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-700'}`}>
                                <GraduationCap className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                    {isClassActive ? 'Aula Oficial em Andamento' : 'Iniciar Aula Oficial'}
                                </h3>
                                <p className="text-[10px] text-slate-500 font-medium">
                                    {isClassActive ? 'Sincronizada em todo o sistema' : 'Vincule a turma e registre atividades'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* SELEÇÃO DE TURMA */}
                    <div className="space-y-1.5 mb-3">
                        <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            Turma da Aula:
                        </label>
                        {classes && classes.length > 0 ? (
                            <select
                                value={selectedClassId}
                                onChange={(e) => handleClassChange(e.target.value)}
                                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.students?.length || 0} alunos)
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium">
                                Nenhuma turma cadastrada. A aula será registrada no perfil geral.
                            </div>
                        )}
                    </div>

                    {/* SE ESTIVER INATIVO: SELEÇÃO DE TEMPO PLANEJADO */}
                    {!isClassActive && (
                        <div className="space-y-1.5 mb-4">
                            <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Duração Prevista:
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {[
                                    { mins: 50, label: '1 Aula (50m)' },
                                    { mins: 100, label: '2 Aulas (100m)' },
                                    { mins: 0, label: 'Livre' }
                                ].map(item => (
                                    <button
                                        key={item.mins}
                                        type="button"
                                        onClick={() => setDurationMinutes(item.mins)}
                                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                                            durationMinutes === item.mins
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SE ESTIVER ATIVO: DETALHES DE TEMPO E FINALIZAÇÃO */}
                    {isClassActive && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Tempo decorrido:</span>
                                <span className="font-mono font-black text-slate-900">{elapsedTime}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Duração prevista:</span>
                                <span className="font-semibold text-slate-800">
                                    {officialSession.plannedDurationMinutes ? `${officialSession.plannedDurationMinutes} min` : 'Sem limite'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* BOTÕES DE AÇÃO */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsMenuOpen(false);
                                window.dispatchEvent(new CustomEvent('dracker_open_student_activity_modal'));
                            }}
                            className="w-full py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                            <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />
                            Registrar Atividades da Turma
                        </button>

                        <div className="flex items-center gap-2">
                            {!isClassActive ? (
                                <button
                                    type="button"
                                    onClick={handleStart}
                                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    Iniciar Aula Agora
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleEnd}
                                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                >
                                    <Square className="w-3.5 h-3.5 fill-current" />
                                    Encerrar Aula Oficial
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
