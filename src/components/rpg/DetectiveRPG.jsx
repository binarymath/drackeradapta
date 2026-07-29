import React, { useState, useEffect } from 'react';
import { Users, Plus, Play, ChevronRight, ChevronLeft, CheckCircle, HelpCircle, XCircle, RefreshCw, Award, BookOpen, Map, Sparkles, AlertTriangle, Maximize2, Minimize2, Search, Wand2, Tent, ShieldCheck, Target, Flag } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

import { useGemini } from '../../contexts/GeminiContext';
import { useActivity } from '../../contexts/ActivityContext';
import { toDirectImageUrl, handleDriveImageError } from '../../utils/urlUtils';

const DetectiveRPG = ({ topic, context, isFullWidth }) => {
    const { geminiService } = useGemini();
    const { activeActivity, updateActivityData, activeTabId, tabs, setActiveTabId } = useActivity();
    
    const savedData = activeActivity?.rpgData || {};

    const [gameStatus, setGameStatus] = useState(savedData.gameStatus || 'setup'); // setup, loading, playing, finished
    const [teams, setTeams] = useState(savedData.teams || [{ id: 1, name: 'Equipe Lupa de Ouro' }, { id: 2, name: 'Equipe Pegada Oculta' }]);
    const [newTeamName, setNewTeamName] = useState('');
    const [questionType, setQuestionType] = useState(savedData.questionType || 'multiple_choice');
    
    const [round, setRound] = useState(savedData.round || 1);
    const [history, setHistory] = useState(savedData.history || []);
    const [currentData, setCurrentData] = useState(savedData.currentData || null);
    const [evaluations, setEvaluations] = useState(savedData.evaluations || {}); 
    const [selectedOptions, setSelectedOptions] = useState(savedData.selectedOptions || {});
    const [mediaUrls, setMediaUrls] = useState(savedData.mediaUrls || {}); // { round: url }
    
    // UI States for Carousel
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    const saveState = (updates) => {
        if (!activeTabId) return;
        updateActivityData(activeTabId, {
            rpgData: {
                gameStatus, teams, questionType, round, history, currentData, evaluations, selectedOptions, mediaUrls,
                ...updates
            }
        });
    };
    
    const renderMarkdown = (text) => {
        if (!text) return null;
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/- (.*)/g, '<li class="ml-4 list-disc">$1</li>')
            .replace(/\n/g, '<br/>');
        return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1" />;
    };
    


    const handleAddTeam = () => {
        if (newTeamName.trim() && teams.length < 8) {
            const newTeams = [...teams, { id: Date.now(), name: newTeamName.trim() }];
            setTeams(newTeams);
            setNewTeamName('');
            saveState({ teams: newTeams });
        }
    };

    const handleRemoveTeam = (id) => {
        const newTeams = teams.filter(t => t.id !== id);
        setTeams(newTeams);
        saveState({ teams: newTeams });
    };

    const startGame = async () => {
        if (teams.length === 0) return alert('Adicione pelo menos uma equipe!');
        setGameStatus('loading');
        try {
            const data = await geminiService.generateFullRPG(topic, context, teams, questionType);
            setCurrentData(data);
            setGameStatus('playing');
            saveState({ currentData: data, gameStatus: 'playing' });
        } catch (error) {
            console.error('Start Game Error:', error);
            alert('Erro ao iniciar o jogo: ' + (error.message || 'Erro desconhecido'));
            setGameStatus('setup');
        }
    };

    // No background loading needed, everything is generated upfront.

    const handleEvaluate = (teamId, status) => {
        const newEvals = { ...evaluations, [teamId]: status };
        setEvaluations(newEvals);
        saveState({ evaluations: newEvals });
    };

    const handleSelectOption = (teamId, optIndex) => {
        const newOpts = { ...selectedOptions, [teamId]: optIndex };
        setSelectedOptions(newOpts);
        saveState({ selectedOptions: newOpts });
    };

    const nextRound = async () => {
        let finalEvaluations = { ...evaluations };

        const currentEtapa = currentData.etapas[round - 1];

        // Validação e auto-avaliação para múltipla escolha
        if (questionType === 'multiple_choice') {
            if (Object.keys(selectedOptions).length !== teams.length) {
                return alert('Por favor, selecione a resposta de todas as equipes antes de continuar.');
            }
            
            currentEtapa.enigmas.forEach((enigma, index) => {
                const team = teams.find(t => enigma.team.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(enigma.team.toLowerCase())) || teams[index];
                if (team) {
                    const chosenOptText = enigma.options[selectedOptions[team.id]];
                    const isCorrect = chosenOptText && enigma.correct_answer && (chosenOptText.charAt(0) === enigma.correct_answer.charAt(0) || enigma.correct_answer.includes(chosenOptText));
                    finalEvaluations[team.id] = isCorrect ? 'success' : 'fail';
                }
            });
        } else {
            // Validação para dissertativa
            if (Object.keys(evaluations).length !== teams.length) {
                return alert('Por favor, avalie todas as equipes antes de continuar.');
            }
        }

        const currentHistoryLog = {
            round,
            enigmas: currentEtapa.enigmas,
            evaluations: finalEvaluations,
            selectedOptions: { ...selectedOptions }
        };

        const newHistory = [...history, currentHistoryLog];
        setHistory(newHistory);
        
        // Verifica se houve muitas falhas (para mostrar reforço pedagógico)
        const fails = Object.values(finalEvaluations).filter(v => v === 'fail').length;
        const total = Object.values(finalEvaluations).length;
        const needsHelp = fails > (total / 2);
        
        // Em vez de chamar API, apenas avançamos localmente
        if (round < 4) { // Next rounds 2 to 4
            const nextRoundNum = round + 1;
            
            // Verifica se a próxima etapa existe (deve existir pois foi gerada toda de uma vez)
            if (!currentData.etapas || !currentData.etapas[nextRoundNum - 1]) {
                return alert('Erro: A próxima etapa não foi gerada corretamente.');
            }

            setRound(nextRoundNum);
            setEvaluations({});
            setSelectedOptions({});
            setCarouselIndex(0);
            setIsExpanded(false);
            
            const updatedData = { ...currentData, showHelpOnNextRound: needsHelp };
            setCurrentData(updatedData);
            
            saveState({ 
                round: nextRoundNum, 
                history: newHistory, 
                evaluations: {}, 
                selectedOptions: {},
                currentData: updatedData 
            });
            
            // Transição instantânea
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else { // Finale (Round 5)
            // Calculate winner
            const scores = {};
            newHistory.forEach(log => {
                Object.keys(log.evaluations).forEach(teamId => {
                    const status = log.evaluations[teamId];
                    const pts = status === 'success' ? 3 : status === 'partial' ? 1 : 0;
                    scores[teamId] = (scores[teamId] || 0) + pts;
                });
            });
            let maxScore = -1;
            let winnerNames = [];
            let totalPointsAll = 0;
            
            Object.keys(scores).forEach(teamId => {
                totalPointsAll += scores[teamId];
                if (scores[teamId] > maxScore) {
                    maxScore = scores[teamId];
                    const t = teams.find(x => x.id.toString() === teamId.toString());
                    winnerNames = [t ? t.name : "Equipe"];
                } else if (scores[teamId] === maxScore) {
                    const t = teams.find(x => x.id.toString() === teamId.toString());
                    winnerNames.push(t ? t.name : "Equipe");
                }
            });
            
            let winner = winnerNames[0];
            if (winnerNames.length > 1) {
                winner = winnerNames.length === teams.length ? "Empate Geral!" : "Empate: " + winnerNames.join(" e ");
            }
            
            // Lógica de qual final escolher baseada na pontuação
            const maxPossiblePoints = teams.length * 4 * 3; // 4 rounds, 3 pts max
            const averageScore = totalPointsAll / maxPossiblePoints;
            const finalStoryText = averageScore > 0.5 ? currentData.finais.vitoria_epica : currentData.finais.vitoria_com_ajuda;
            
            const finalHistoryObj = { rounds: newHistory, winner, finalStoryText };
            setCurrentData(prev => ({ ...prev, finalHistory: finalHistoryObj }));
            setRound(5);
            setGameStatus('finished');
            saveState({ 
                round: 5, 
                gameStatus: 'finished', 
                history: newHistory, 
                evaluations: {}, 
                selectedOptions: {},
                currentData: { ...currentData, finalHistory: finalHistoryObj }
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const restartMatch = () => {
        setRound(1);
        setHistory([]);
        setEvaluations({});
        setSelectedOptions({});
        const updatedData = { ...currentData };
        delete updatedData.finalHistory;
        setCurrentData(updatedData);
        setGameStatus('playing');
        saveState({ gameStatus: 'playing', round: 1, history: [], currentData: updatedData, evaluations: {}, selectedOptions: {} });
    };

    const clearGame = () => {
        setGameStatus('setup');
        setRound(1);
        setHistory([]);
        setCurrentData(null);
        setEvaluations({});
        setSelectedOptions({});
        setMediaUrls({});
        saveState({ gameStatus: 'setup', round: 1, history: [], currentData: null, evaluations: {}, selectedOptions: {}, mediaUrls: {} });
    };

    if (gameStatus === 'setup') {
        const otherPlayingTab = tabs?.find(t => t.type === 'rpg' && t.id !== activeTabId && t.rpgData && t.rpgData.gameStatus !== 'setup');

        return (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
                {otherPlayingTab && (
                    <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 shadow-md">
                        <div>
                            <h4 className="font-bold text-amber-900 text-lg flex items-center gap-2"><Map className="w-5 h-5"/> Acampamento Salvo!</h4>
                            <p className="text-amber-800 font-medium">Você já possui uma expedição pausada em outra aba.</p>
                        </div>
                        <Button onClick={() => setActiveTabId(otherPlayingTab.id)} className="bg-amber-600 hover:bg-amber-700 text-white shadow-md w-full sm:w-auto px-6">
                            Continuar Aventura
                        </Button>
                    </div>
                )}
                
                <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-brown-100 to-brown-200 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-brown-300 relative">
                        <Search className="w-12 h-12 text-brown-700 relative z-10" />
                        <Sparkles className="w-6 h-6 text-amber-400 absolute top-0 right-0 animate-bounce" />
                    </div>
                    <h2 className="text-4xl font-black text-brown-800 font-display tracking-tight">Mestre RPG: Floresta Encantada 🌲</h2>
                    <p className="text-brown-700 max-w-lg mx-auto text-lg font-medium">
                        Junte-se ao dragãozinho Drácker e seus amigos para desvendar os mistérios de <b>{topic || 'um grande enigma'}</b>.
                    </p>
                </div>

                <Card className="border-brown-300 shadow-2xl bg-[#f4fcf6] border-4 p-8 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-brown-400 via-brown-400 to-brown-500 rounded-t-2xl"></div>
                    
                    <h3 className="text-2xl font-black text-brown-900 mb-6 flex items-center gap-3">
                        <Tent className="w-8 h-8 text-amber-600" />
                        Tenda das Equipes
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row gap-3 mb-8">
                        <Input 
                            placeholder="Nome do esquadrão..." 
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                            className="border-brown-200 focus:border-brown-500 bg-white shadow-inner text-lg py-3 rounded-xl"
                        />
                        <Button onClick={handleAddTeam} variant="primary" icon={Plus} className="bg-brown-600 hover:bg-brown-700 shadow-md text-lg rounded-xl whitespace-nowrap">Convocar Equipe</Button>
                    </div>

                    {teams.length === 0 ? (
                        <div className="text-center py-8 bg-brown-50/50 rounded-2xl border-2 border-dashed border-brown-200 mb-8">
                            <Users className="w-12 h-12 text-brown-300 mx-auto mb-2 opacity-50" />
                            <p className="text-brown-600 font-bold">Nenhum esquadrão convocado ainda...</p>
                            <p className="text-brown-500 text-sm">Adicione os times para iniciar o jogo!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            {teams.map((team, idx) => (
                                <div key={team.id} className="bg-white border-2 border-brown-100 rounded-xl p-4 flex justify-between items-center group shadow-sm hover:border-brown-300 transition-all hover:-translate-y-1">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="w-8 h-8 bg-brown-100 rounded-full flex items-center justify-center font-bold text-brown-700 text-xs shrink-0">{idx + 1}</div>
                                        <span className="font-bold text-slate-700 truncate">{team.name}</span>
                                    </div>
                                    <button onClick={() => handleRemoveTeam(team.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mb-10 space-y-4 p-6 bg-amber-50 rounded-2xl border-2 border-amber-200 shadow-sm relative overflow-hidden">
                        <Wand2 className="w-32 h-32 text-amber-100 absolute -right-10 -bottom-10 opacity-50 transform -rotate-45" />
                        <label className="text-sm font-black text-amber-800 uppercase tracking-wider block relative z-10 flex items-center gap-2">
                            <Target className="w-4 h-4"/> Tipo de Feitiço (Pergunta)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                            <label className={`flex items-center gap-3 cursor-pointer bg-white border-2 p-4 rounded-xl flex-1 transition-all ${questionType === 'multiple_choice' ? 'border-amber-500 shadow-md ring-2 ring-amber-200' : 'border-slate-200 hover:border-amber-300'}`}>
                                <input type="radio" checked={questionType === 'multiple_choice'} onChange={() => setQuestionType('multiple_choice')} className="w-6 h-6 text-amber-600 focus:ring-amber-500" />
                                <div>
                                    <span className="font-bold text-slate-800 block">Múltipla Escolha</span>
                                    <span className="text-sm text-slate-500 font-medium">Alternativas A, B, C, D</span>
                                </div>
                            </label>
                            <label className={`flex items-center gap-3 cursor-pointer bg-white border-2 p-4 rounded-xl flex-1 transition-all ${questionType === 'essay' ? 'border-amber-500 shadow-md ring-2 ring-amber-200' : 'border-slate-200 hover:border-amber-300'}`}>
                                <input type="radio" checked={questionType === 'essay'} onChange={() => setQuestionType('essay')} className="w-6 h-6 text-amber-600 focus:ring-amber-500" />
                                <div>
                                    <span className="font-bold text-slate-800 block">Dissertativa</span>
                                    <span className="text-sm text-slate-500 font-medium">Avaliação livre do Mestre</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <Button onClick={startGame} disabled={teams.length === 0} className="w-full py-5 text-2xl font-black bg-gradient-to-r from-brown-500 to-brown-500 hover:from-brown-600 hover:to-brown-600 shadow-xl shadow-brown-200 text-white rounded-2xl transform transition-transform active:scale-95" icon={Sparkles}>
                        ✨ Abrir o Portal Mágico!
                    </Button>
                </Card>
            </div>
        );
    }

    if (gameStatus === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6">
                <div className="relative">
                    <div className="w-24 h-24 bg-brown-100 rounded-full flex items-center justify-center animate-pulse border-4 border-brown-300">
                        <Map className="w-12 h-12 text-brown-600" />
                    </div>
                    <Sparkles className="w-10 h-10 text-amber-400 absolute -top-4 -right-4 animate-bounce" />
                    <Search className="w-8 h-8 text-amber-500 absolute -bottom-2 -left-2 animate-spin-slow" style={{animationDuration: '3s'}} />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-brown-800">
                        {round === 1 ? '🪄 Conjurando a Aventura...' : round === 5 ? '🏆 Preparando o Grande Final...' : '🌲 Explorando a Floresta...'}
                    </h3>
                    <p className="text-brown-600 font-medium animate-pulse text-lg">
                        {round === 1 ? 'O Drácker está vestindo o casaco de detetive 🕵️‍♂️' : 'Procurando pegadas mágicas na lama 🐾'}
                    </p>
                </div>
            </div>
        );
    }

    if (gameStatus === 'playing') {
        const etapaAtual = currentData?.etapas?.[round - 1];
        const storyText = round === 1 ? currentData?.historia_abertura : etapaAtual?.narrativa_avanco;
        const enigmas = etapaAtual?.enigmas || [];
        const isStorybookMode = isFullWidth;
        const currentMedia = mediaUrls[round] || '';

        const handleRemoveMedia = () => {
            const newMediaUrls = {...mediaUrls};
            delete newMediaUrls[round];
            setMediaUrls(newMediaUrls);
            saveState({ mediaUrls: newMediaUrls });
        };

        const renderMedia = () => {
            if (!currentMedia) return null;
            const isYoutube = currentMedia.includes('youtube.com') || currentMedia.includes('youtu.be');
            
            let videoId = '';
            if (isYoutube) {
                if (currentMedia.includes('v=')) {
                    videoId = currentMedia.split('v=')[1]?.split('&')[0];
                } else if (currentMedia.includes('youtu.be/')) {
                    videoId = currentMedia.split('youtu.be/')[1]?.split('?')[0];
                }
            }

            return (
                <div className="relative group w-full mb-6">
                    {isYoutube && videoId ? (
                        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-brown-200 bg-black">
                            <iframe 
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=0`} 
                                className="w-full h-full"
                                allowFullScreen
                                title="Story Video"
                            ></iframe>
                        </div>
                    ) : (
                        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-brown-200 bg-brown-50 flex items-center justify-center">
                            <img src={toDirectImageUrl(currentMedia)} alt="Ilustração da História" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleDriveImageError} />
                        </div>
                    )}
                    
                    {/* Botão de Remover Mídia */}
                    <button 
                        onClick={handleRemoveMedia}
                        className="absolute top-4 right-4 bg-white/90 text-red-500 hover:text-red-700 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all no-print transform hover:scale-110"
                        title="Remover Mídia"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
            );
        };

        const renderStoryColumn = () => (
            <div className="prose prose-lg prose-brown max-w-none text-slate-800 leading-relaxed space-y-6">
                {isStorybookMode && renderMedia()}
                {isStorybookMode && !currentMedia && (
                    <div className="mb-6 p-4 bg-brown-50 rounded-xl border-2 border-dashed border-brown-200 flex flex-col items-center justify-center gap-2 no-print">
                        <Input 
                            placeholder="URL de Imagem ou Vídeo (YouTube) para esta cena..." 
                            value={mediaUrls[round] || ''}
                            onChange={(e) => {
                                const newMediaUrls = {...mediaUrls, [round]: e.target.value};
                                setMediaUrls(newMediaUrls);
                                saveState({ mediaUrls: newMediaUrls });
                            }}
                            className="w-full max-w-md bg-white text-center"
                        />
                        <span className="text-xs text-brown-500 font-medium">Opcional: Cole uma imagem ou vídeo para as crianças</span>
                    </div>
                )}
                {renderMarkdown(storyText)}
            </div>
        );

        return (
            <div className={`mx-auto space-y-6 animate-fade-in pb-16 ${isStorybookMode ? 'max-w-[1400px]' : 'max-w-4xl'}`}>
                <div className="flex justify-between items-center bg-brown-100 text-brown-900 px-4 py-3 rounded-2xl font-bold shadow-md border-2 border-brown-300 relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10"><Wand2 className="w-32 h-32" /></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <Map className="w-6 h-6 text-brown-600" /> <span className="hidden sm:inline text-lg">Aventura Mágica Ativa</span>
                        <button onClick={restartMatch} className="ml-2 text-xs md:text-sm text-brown-700 hover:text-red-600 font-bold flex items-center gap-1 transition-colors bg-white hover:bg-red-50 px-3 py-2 rounded-xl shadow-sm border border-brown-200">
                            <Flag className="w-4 h-4 text-red-500" /> Recuar (Reiniciar)
                        </button>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <span className="bg-white px-4 py-2 rounded-xl shadow-inner text-brown-800 border border-brown-200">📍 Acampamento {round} de 4</span>
                    </div>
                </div>

                {currentData.showHelpOnNextRound && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-8 border-amber-500 p-6 rounded-r-2xl shadow-lg flex flex-col md:flex-row gap-6 animate-fade-in relative overflow-hidden">
                        <div className="bg-amber-500 p-4 rounded-full h-fit shadow-inner shrink-0 relative z-10">
                            <Sparkles className="w-10 h-10 text-white animate-pulse" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="font-black text-amber-900 text-2xl mb-2 flex items-center gap-2">🐉 O Mestre Drácker diz:</h3>
                            <p className="text-amber-800 font-medium text-lg italic bg-white/60 p-4 rounded-xl border border-amber-200">{currentData.reforco_pedagogico}</p>
                        </div>
                    </div>
                )}

                {isStorybookMode ? (
                    <div className="flex justify-center w-full">
                        <div className="w-full max-w-5xl flex flex-col gap-6">
                            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl overflow-hidden relative flex flex-col min-h-[600px]">
                                
                                {/* Cabeçalho do Carrossel (Aba de Navegação) */}
                                <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center relative z-10">
                                    <div className="flex gap-2 items-center">
                                        <button 
                                            onClick={() => setCarouselIndex(0)}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-sm transition-all ${carouselIndex === 0 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                        >
                                            <BookOpen className="w-4 h-4" /> História
                                        </button>
                                        <span className="text-slate-300 mx-1">|</span>
                                        {enigmas.map((_, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setCarouselIndex(idx + 1)}
                                                className={`w-4 h-4 rounded-full transition-all flex items-center justify-center font-bold text-[10px] ${carouselIndex === idx + 1 ? 'bg-indigo-600 text-white scale-125 shadow-md' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                                                title={`Ir para equipe ${idx + 1}`}
                                            >
                                                {idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <Button 
                                        onClick={() => setIsExpanded(true)} 
                                        variant="ghost" 
                                        icon={Maximize2} 
                                        className="text-slate-600 hover:bg-slate-200 hover:text-slate-900 px-3 py-1 rounded-lg"
                                    >
                                        Expandir Lousa
                                    </Button>
                                </div>

                                {/* Conteúdo do Slide Atual */}
                                <div className="flex-grow flex flex-col relative animate-fade-in">
                                    {carouselIndex === 0 ? (
                                        <div className="p-8 md:p-12 xl:p-16 flex flex-col items-center w-full max-w-4xl mx-auto">
                                            <h3 className="text-3xl md:text-4xl font-black text-brown-800 font-display mb-10 text-center w-full border-b border-brown-100 pb-6">
                                                {round === 1 ? 'O Mistério Começa...' : 'A Investigação Continua...'}
                                            </h3>
                                            <div className="w-full text-xl md:text-2xl leading-relaxed">
                                                {renderStoryColumn()}
                                            </div>
                                        </div>
                                    ) : (
                                        (() => {
                                            const enigmaIdx = carouselIndex - 1;
                                            const enigma = enigmas[enigmaIdx];
                                            const team = teams.find(t => enigma.team.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(enigma.team.toLowerCase())) || teams[enigmaIdx];
                                            if (!team) return null;

                                            return (
                                                <div className="p-8 md:p-12 xl:p-16 flex flex-col w-full max-w-4xl mx-auto">
                                                    <div className="flex items-center gap-6 mb-10">
                                                        <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black text-2xl shadow-inner border-4 border-indigo-200">
                                                            {enigmaIdx + 1}
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider block">Desafio da Equipe</span>
                                                            <h4 className="text-3xl md:text-4xl font-black text-slate-800">{team.name}</h4>
                                                        </div>
                                                    </div>
                                                    
                                                    <p className="text-2xl md:text-3xl font-medium text-slate-800 mb-10 leading-relaxed">
                                                        {enigma.question}
                                                    </p>
                                                    
                                                    {enigma.options && enigma.options.length > 0 && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                                            {enigma.options.map((opt, i) => (
                                                                <button 
                                                                    key={i} 
                                                                    onClick={() => handleSelectOption(team.id, i)}
                                                                    className={`w-full text-left border-2 p-6 rounded-2xl font-bold transition-all text-xl md:text-2xl ${selectedOptions[team.id] === i ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-md scale-[1.02]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {questionType === 'essay' && (
                                                        <div className="space-y-6 mt-8">
                                                            <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200">
                                                                <span className="text-sm font-black text-amber-700 uppercase block mb-3 tracking-wider flex items-center gap-2"><Search className="w-5 h-5"/> Gabarito Oculto do Mestre</span>
                                                                <span className="font-bold text-amber-900 text-2xl">{enigma.correct_answer}</span>
                                                            </div>
                                                            
                                                            <div className="flex flex-col p-6 bg-slate-50 rounded-3xl border-2 border-slate-200 gap-4">
                                                                <span className="font-black text-slate-700 uppercase text-sm tracking-wider">Avaliar Resposta:</span>
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    <button onClick={() => handleEvaluate(team.id, 'success')} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl font-black transition-all ${evaluations[team.id] === 'success' ? 'bg-green-500 text-white shadow-xl scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-600'}`}>
                                                                        <CheckCircle className="w-8 h-8 md:w-10 md:h-10" /> <span className="text-lg">Na Mosca!</span>
                                                                    </button>
                                                                    <button onClick={() => handleEvaluate(team.id, 'partial')} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl font-black transition-all ${evaluations[team.id] === 'partial' ? 'bg-amber-500 text-white shadow-xl scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600'}`}>
                                                                        <HelpCircle className="w-8 h-8 md:w-10 md:h-10" /> <span className="text-lg">Quase Lá</span>
                                                                    </button>
                                                                    <button onClick={() => handleEvaluate(team.id, 'fail')} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl font-black transition-all ${evaluations[team.id] === 'fail' ? 'bg-rose-500 text-white shadow-xl scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-rose-400 hover:text-rose-600'}`}>
                                                                        <XCircle className="w-8 h-8 md:w-10 md:h-10" /> <span className="text-lg">Escorregou</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>

                                {/* Controles de Navegação (Anterior / Próximo) */}
                                <div className="bg-slate-50 border-t border-slate-200 p-4 md:p-6 flex justify-between items-center mt-auto">
                                    <Button 
                                        onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                                        disabled={carouselIndex === 0}
                                        variant="outline"
                                        icon={ChevronLeft}
                                        className="bg-white text-lg px-6 py-3"
                                    >
                                        Anterior
                                    </Button>
                                    {carouselIndex === enigmas.length ? (
                                        <Button 
                                            onClick={nextRound}
                                            disabled={questionType === 'multiple_choice' ? Object.keys(selectedOptions).length !== teams.length : Object.keys(evaluations).length !== teams.length}
                                            variant="primary"
                                            icon={ChevronRight}
                                            className="bg-brown-600 hover:bg-green-700 text-lg px-6 py-3 shadow-md text-white border-transparent"
                                        >
                                            {round === 4 ? 'Avançar para o Final' : 'Avançar História'}
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={() => setCarouselIndex(prev => Math.min(enigmas.length, prev + 1))}
                                            variant="primary"
                                            className="bg-slate-800 hover:bg-slate-900 text-lg px-6 py-3"
                                        >
                                            Próximo <ChevronRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <Card className="border-brown-300 shadow-xl bg-[#f4fcf6] overflow-hidden rounded-3xl">
                            <div className="bg-gradient-to-r from-brown-100 to-green-100 p-6 border-b-4 border-brown-200 flex items-center gap-4">
                                <div className="bg-white p-2 rounded-full shadow-sm"><BookOpen className="w-8 h-8 text-brown-600" /></div>
                                <h2 className="text-3xl font-black text-brown-900 font-display">
                                    {round === 1 ? 'O Início do Mistério' : `Capítulo ${round}: A Investigação`}
                                </h2>
                            </div>
                            <div className="p-6 md:p-8 space-y-6">
                                {renderStoryColumn()}
                                
                                {enigmas.map((enigma, index) => {
                                    const team = teams.find(t => enigma.team.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(enigma.team.toLowerCase())) || teams[index];
                                    if (!team) return null;

                                    return (
                                        <div key={index} className="bg-white border-2 border-brown-100 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative mt-10">
                                            <div className="absolute -top-6 -left-2 bg-brown-500 text-white rounded-full p-3 shadow-lg flex items-center justify-center">
                                                <Target className="w-6 h-6" />
                                            </div>
                                            <div className="ml-10 mb-4">
                                                <span className="text-xs font-bold text-brown-500 uppercase tracking-wider block mb-1">Desafio do Esquadrão</span>
                                                <h3 className="text-2xl font-black text-slate-800">{team.name}</h3>
                                            </div>
                                            
                                            <p className="text-xl font-medium text-slate-700 mb-6 leading-relaxed bg-brown-50/50 p-4 rounded-xl border border-brown-50">{enigma.question}</p>
                                            
                                            {enigma.options && enigma.options.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                                    {enigma.options.map((opt, i) => (
                                                        <button 
                                                            key={i} 
                                                            onClick={() => handleSelectOption(team.id, i)}
                                                            className={`text-left border-2 p-4 rounded-2xl font-bold transition-all text-lg ${selectedOptions[team.id] === i ? 'bg-brown-50 border-brown-500 text-brown-900 shadow-md transform scale-[1.02]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {questionType === 'essay' && (
                                                <div className="space-y-6">
                                                    <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200">
                                                        <span className="text-sm font-black text-amber-700 uppercase block mb-2 flex items-center gap-2"><Search className="w-4 h-4"/> Gabarito Oculto (Professor):</span>
                                                        <span className="font-bold text-amber-900 text-xl">{enigma.correct_answer}</span>
                                                    </div>
                                                    
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 gap-4">
                                                        <span className="font-black text-slate-700 uppercase text-sm tracking-wider">Avaliar Resposta:</span>
                                                        <div className="flex flex-wrap gap-3">
                                                            <button 
                                                                onClick={() => handleEvaluate(team.id, 'success')}
                                                                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all ${evaluations[team.id] === 'success' ? 'bg-green-500 text-white shadow-lg scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-600'}`}
                                                            >
                                                                <CheckCircle className="w-5 h-5" /> Na Mosca!
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEvaluate(team.id, 'partial')}
                                                                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all ${evaluations[team.id] === 'partial' ? 'bg-amber-500 text-white shadow-lg scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600'}`}
                                                            >
                                                                <HelpCircle className="w-5 h-5" /> Quase Lá
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEvaluate(team.id, 'fail')}
                                                                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-black transition-all ${evaluations[team.id] === 'fail' ? 'bg-rose-500 text-white shadow-lg scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-rose-400 hover:text-rose-600'}`}
                                                            >
                                                                <XCircle className="w-5 h-5" /> Escorregou
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </>
                )}

                {!isStorybookMode && (
                    <Card className="border-slate-200 shadow-lg p-6 bg-slate-50">
                        <div className="flex justify-between items-center">
                            <Button onClick={restartMatch} variant="outline" icon={RefreshCw} className="border-brown-400 text-brown-700 hover:bg-brown-100 bg-white">
                                Reiniciar Partida
                            </Button>
                            <Button onClick={nextRound} className="px-8 py-3 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200" icon={ChevronRight} disabled={questionType === 'multiple_choice' ? Object.keys(selectedOptions).length !== teams.length : Object.keys(evaluations).length !== teams.length}>
                                {round === 4 ? 'Avançar para o Grande Final' : 'Avançar História'}
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Modal de Tela Cheia para Leitura */}
                {isExpanded && (
                    <div className="fixed inset-0 z-50 bg-white flex flex-col p-8 md:p-16 overflow-y-auto animate-fade-in no-print">
                        <div className="flex justify-between items-center mb-12">
                            <div className="flex items-center gap-6">
                                {carouselIndex === 0 ? (
                                    <>
                                        <div className="w-16 h-16 bg-brown-100 text-brown-700 rounded-full flex items-center justify-center shadow-inner border-4 border-brown-200">
                                            <BookOpen className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-black text-brown-800">
                                            {round === 1 ? 'O Mistério Começa' : 'A História Continua'}
                                        </h2>
                                    </>
                                ) : (
                                    (() => {
                                        const enigma = enigmas[carouselIndex - 1];
                                        const team = teams.find(t => enigma.team.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(enigma.team.toLowerCase())) || teams[carouselIndex - 1];
                                        return (
                                            <>
                                                <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black text-3xl shadow-inner border-4 border-indigo-200">
                                                    {carouselIndex}
                                                </div>
                                                <h2 className="text-4xl md:text-5xl font-black text-slate-800">
                                                    {team?.name || enigma.team}
                                                </h2>
                                            </>
                                        );
                                    })()
                                )}
                            </div>
                            <Button 
                                onClick={() => setIsExpanded(false)} 
                                variant="outline" 
                                icon={Minimize2}
                                className="text-2xl px-6 py-4"
                            >
                                Fechar
                            </Button>
                        </div>

                        <div className="max-w-6xl mx-auto w-full flex-grow flex flex-col justify-center">
                            {carouselIndex === 0 ? (
                                <div className="text-3xl md:text-4xl lg:text-5xl leading-relaxed text-slate-800 font-medium flex flex-col gap-8">
                                    {renderMedia()}
                                    {renderMarkdown(storyText)}
                                </div>
                            ) : (
                                (() => {
                                    const enigmaIdx = carouselIndex - 1;
                                    const enigma = enigmas[enigmaIdx];
                                    const team = teams.find(t => enigma.team.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(enigma.team.toLowerCase())) || teams[enigmaIdx];
                                    
                                    return (
                                        <>
                                            <p className="text-4xl md:text-5xl lg:text-6xl font-medium text-slate-800 mb-16 leading-relaxed">
                                                {enigma.question}
                                            </p>

                                            {enigma.options && enigma.options.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {enigma.options.map((opt, i) => (
                                                        <button 
                                                            key={i} 
                                                            onClick={() => handleSelectOption(team.id, i)}
                                                            className={`text-left border-4 p-8 rounded-3xl text-3xl font-bold transition-all ${selectedOptions[team.id] === i ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {questionType === 'essay' && (
                                                <div className="mt-12 space-y-8">
                                                    <div className="bg-amber-50 p-8 rounded-3xl border-4 border-amber-200">
                                                        <span className="text-xl font-black text-amber-700 uppercase block mb-4 tracking-wider flex items-center gap-3"><Search className="w-8 h-8"/> Gabarito Oculto do Mestre</span>
                                                        <span className="font-bold text-amber-900 text-3xl">{enigma.correct_answer}</span>
                                                    </div>
                                                    
                                                    <div className="flex flex-col p-8 bg-slate-50 rounded-3xl border-4 border-slate-200 gap-6">
                                                        <span className="font-black text-slate-700 uppercase text-xl tracking-wider">Avaliar Resposta:</span>
                                                        <div className="grid grid-cols-3 gap-6">
                                                            <button onClick={() => handleEvaluate(team.id, 'success')} className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl font-black transition-all ${evaluations[team.id] === 'success' ? 'bg-green-500 text-white shadow-xl scale-105' : 'bg-white border-4 border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-600'}`}>
                                                                <CheckCircle className="w-12 h-12" /> <span className="text-2xl">Na Mosca!</span>
                                                            </button>
                                                            <button onClick={() => handleEvaluate(team.id, 'partial')} className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl font-black transition-all ${evaluations[team.id] === 'partial' ? 'bg-amber-500 text-white shadow-xl scale-105' : 'bg-white border-4 border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600'}`}>
                                                                <HelpCircle className="w-12 h-12" /> <span className="text-2xl">Quase Lá</span>
                                                            </button>
                                                            <button onClick={() => handleEvaluate(team.id, 'fail')} className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl font-black transition-all ${evaluations[team.id] === 'fail' ? 'bg-rose-500 text-white shadow-xl scale-105' : 'bg-white border-4 border-slate-200 text-slate-600 hover:border-rose-400 hover:text-rose-600'}`}>
                                                                <XCircle className="w-12 h-12" /> <span className="text-2xl">Escorregou</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()
                            )}
                        </div>
                        
                        <div className="flex justify-center gap-8 mt-12">
                            <Button 
                                onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                                disabled={carouselIndex === 0}
                                variant="outline"
                                icon={ChevronLeft}
                                className="text-2xl px-8 py-4"
                            >
                                Anterior
                            </Button>
                            {carouselIndex === enigmas.length ? (
                                <Button 
                                    onClick={nextRound}
                                    disabled={questionType === 'multiple_choice' ? Object.keys(selectedOptions).length !== teams.length : Object.keys(evaluations).length !== teams.length}
                                    variant="primary"
                                    icon={ChevronRight}
                                    className="text-2xl px-8 py-4 bg-brown-600 hover:bg-green-700 shadow-xl text-white border-transparent"
                                >
                                    {round === 4 ? 'Avançar para o Final' : 'Avançar História'}
                                </Button>
                            ) : (
                                <Button 
                                    onClick={() => setCarouselIndex(prev => Math.min(enigmas.length, prev + 1))}
                                    variant="primary"
                                    className="text-2xl px-8 py-4 bg-slate-800 hover:bg-slate-900"
                                >
                                    Próximo <ChevronRight className="w-8 h-8 ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (gameStatus === 'finished') {
        return (
            <div className={`mx-auto space-y-6 animate-fade-in ${isFullWidth ? 'max-w-[1400px]' : 'max-w-4xl'}`}>
                <div className="flex justify-between items-center bg-gradient-to-r from-amber-200 to-yellow-300 text-amber-900 px-6 py-3 rounded-2xl font-bold shadow-md border-2 border-amber-400">
                    <div className="flex items-center gap-3">
                        <Award className="w-6 h-6" /> <span className="hidden sm:inline text-lg">Mistério Solucionado! 🎉</span>
                        <button onClick={restartMatch} className="ml-2 text-xs md:text-sm text-amber-800 hover:text-red-600 font-bold flex items-center gap-1 transition-colors bg-white/60 hover:bg-white px-3 py-2 rounded-xl shadow-sm border border-amber-300">
                            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" /> Nova Missão
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="bg-white px-4 py-2 rounded-xl shadow-inner text-amber-700">Tenda Final</span>
                    </div>
                </div>

                <Card className="border-amber-300 shadow-2xl bg-gradient-to-b from-[#fffdf5] to-amber-50 overflow-hidden relative rounded-3xl">
                    <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500"></div>
                    <div className="p-10 text-center border-b-2 border-amber-200 relative overflow-hidden">
                        <Sparkles className="w-32 h-32 text-amber-200 absolute -right-10 -top-10 animate-pulse" />
                        <ShieldCheck className="w-24 h-24 text-amber-500 mx-auto mb-6 relative z-10" />
                        <h2 className="text-5xl font-black text-amber-800 font-display mb-4 relative z-10 tracking-tight">O Mistério foi Resolvido! 🎊</h2>
                        <p className="text-amber-700 font-bold text-xl mb-6 relative z-10">Os bravos detetives salvaram o dia na Floresta Encantada!</p>
                        <div className="inline-block bg-white border-4 border-amber-400 rounded-3xl px-8 py-4 shadow-xl mt-4 relative z-10 transform hover:scale-105 transition-transform">
                            <span className="text-sm uppercase font-black text-amber-600 block mb-2 tracking-widest">🎖️ Esquadrão Campeão</span>
                            <span className="text-3xl font-black text-amber-900">{currentData?.finalHistory?.winner || 'Todos Nós!'}</span>
                        </div>
                    </div>
                    
                    <div className="p-8 md:p-12">
                        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-md border-2 border-slate-100 mb-10">
                            <h3 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2"><BookOpen className="w-6 h-6 text-green-500"/> Relatório Oficial da Missão</h3>
                            <p className="text-xl leading-relaxed text-slate-700 italic">
                                {currentData?.finalHistory?.finalStoryText}
                            </p>
                        </div>

                        {/* Gabarito e Resumo Final */}
                        <div className="bg-white border-4 border-slate-200 rounded-3xl p-6 md:p-10 shadow-lg mt-8">
                            <h3 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-4 border-b-2 border-slate-100 pb-6">
                                <Search className="w-10 h-10 text-brown-500" />
                                Arquivos Confidenciais (Gabarito)
                            </h3>
                            
                            <div className="space-y-8">
                                {currentData?.finalHistory?.rounds?.map((roundData, rIndex) => (
                                    <div key={rIndex} className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200">
                                        <h4 className="font-black text-slate-700 mb-6 bg-slate-200 px-4 py-2 rounded-xl inline-block shadow-sm">📍 Acampamento {roundData.round}</h4>
                                        <div className="space-y-6">
                                            {roundData.enigmas?.map((enigma, eIndex) => {
                                                const team = teams.find(t => enigma.team.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(enigma.team.toLowerCase())) || teams[eIndex];
                                                const chosenOptIndex = roundData.selectedOptions?.[team?.id];
                                                const chosenText = chosenOptIndex !== undefined ? enigma.options?.[chosenOptIndex] : null;
                                                const evalStatus = roundData.evaluations?.[team?.id];

                                                return (
                                                    <div key={eIndex} className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                                                            <p className="font-bold text-slate-800 flex-1 text-lg"><span className="text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100 mr-2">{enigma.team}</span> {enigma.question}</p>
                                                            <div className="shrink-0 mt-2 md:mt-0">
                                                                {evalStatus === 'success' && <span className="bg-green-100 text-green-700 px-3 py-2 rounded-xl text-sm font-black whitespace-nowrap shadow-sm border border-green-200">🎯 NA MOSCA</span>}
                                                                {evalStatus === 'partial' && <span className="bg-amber-100 text-amber-700 px-3 py-2 rounded-xl text-sm font-black whitespace-nowrap shadow-sm border border-amber-200">🤝 QUASE LÁ</span>}
                                                                {evalStatus === 'fail' && <span className="bg-rose-100 text-rose-700 px-3 py-2 rounded-xl text-sm font-black whitespace-nowrap shadow-sm border border-rose-200">🤕 ESCORREGOU</span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-base space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                            {chosenText && (
                                                                <p className="text-slate-700"><span className="font-bold text-slate-500">Ação Escolhida:</span> {chosenText}</p>
                                                            )}
                                                            <p className="text-green-900 bg-green-100/50 px-3 py-2 rounded-lg border border-green-200 inline-block">
                                                                <span className="font-black text-green-700">Resposta Correta:</span> {enigma.correct_answer}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8 bg-gradient-to-t from-amber-100 to-amber-50 border-t-2 border-amber-200 flex justify-center">
                        <Button onClick={restartMatch} variant="primary" icon={RefreshCw} className="bg-amber-600 hover:bg-amber-700 text-white shadow-xl px-8 py-4 text-xl rounded-2xl font-black">
                            Começar Nova Investigação
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return null;
};

export default DetectiveRPG;
