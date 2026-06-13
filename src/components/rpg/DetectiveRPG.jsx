import React, { useState, useEffect } from 'react';
import { Users, Plus, Play, ChevronRight, ChevronLeft, CheckCircle, HelpCircle, XCircle, RefreshCw, Award, BookOpen, Map, Sparkles, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

import { useGemini } from '../../contexts/GeminiContext';
import { useActivity } from '../../contexts/ActivityContext';

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
            const data = await geminiService.generateRPGPart1(topic, context, teams, questionType);
            setCurrentData(data);
            setGameStatus('playing');
            saveState({ currentData: data, gameStatus: 'playing' });
        } catch (error) {
            console.error('Start Game Error:', error);
            alert('Erro ao iniciar o jogo: ' + (error.message || 'Erro desconhecido'));
            setGameStatus('setup');
        }
    };

    // Carregamento de Fundo (Parte 2)
    useEffect(() => {
        let isMounted = true;
        const loadPart2 = async () => {
            if (gameStatus === 'playing' && currentData && currentData.etapas && currentData.etapas.length < 4 && !currentData.isLoadingPart2 && !currentData.part2Error) {
                try {
                    setCurrentData(prev => ({ ...prev, isLoadingPart2: true }));
                    
                    const part2 = await geminiService.generateRPGPart2(
                        topic, context, teams, questionType, 
                        currentData.historia_abertura
                    );
                    
                    if (!isMounted) return;

                    setCurrentData(prev => {
                        const newData = {
                            ...prev,
                            etapas: [...prev.etapas, ...part2.etapas],
                            reforco_pedagogico: part2.reforco_pedagogico,
                            finais: part2.finais,
                            isLoadingPart2: false
                        };
                        saveState({ currentData: newData });
                        return newData;
                    });
                } catch (err) {
                    console.error("Failed to load Part 2 in background:", err);
                    if (!isMounted) return;
                    setCurrentData(prev => ({ ...prev, isLoadingPart2: false, part2Error: true }));
                }
            }
        };
        loadPart2();
        return () => { isMounted = false; };
    }, [gameStatus, currentData, topic, context, teams, questionType]);

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
            
            // Verifica se a próxima etapa já foi baixada no background
            if (!currentData.etapas || !currentData.etapas[nextRoundNum - 1]) {
                if (currentData.part2Error) {
                   return alert('Ocorreu um erro de conexão ao tentar carregar a próxima etapa. O Mestre pode precisar reiniciar a partida quando a internet voltar.');
                }
                return alert('A magia da floresta ainda está revelando o próximo cenário! Aguarde alguns instantes (carregando em segundo plano)...');
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
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                {otherPlayingTab && (
                    <div className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 shadow-sm">
                        <div>
                            <h4 className="font-bold text-indigo-800 text-lg flex items-center gap-2"><Map className="w-5 h-5"/> Investigação em Andamento</h4>
                            <p className="text-indigo-600 font-medium">Você já possui um jogo pausado em outra aba.</p>
                        </div>
                        <Button onClick={() => setActiveTabId(otherPlayingTab.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md w-full sm:w-auto px-6">
                            Continuar Jogo Salvo
                        </Button>
                    </div>
                )}
                
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-brown-100 rounded-full flex items-center justify-center mx-auto shadow-inner border-4 border-brown-200">
                        <Map className="w-10 h-10 text-brown-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-brown-800 font-display">Mistérios da Floresta Encantada</h2>
                    <p className="text-brown-700 max-w-lg mx-auto">
                        Junte-se ao dragãozinho detetive Drácker e seus amigos para uma investigação mágica sobre <b>{topic || 'um grande mistério'}</b>.
                    </p>
                </div>

                <Card className="border-brown-200 shadow-xl bg-white/80 backdrop-blur-sm p-6">
                    <h3 className="text-xl font-bold text-brown-900 mb-4 flex items-center gap-2">
                        <Users className="w-6 h-6 text-brown-600" />
                        Equipes de Detetives
                    </h3>
                    
                    <div className="flex gap-2 mb-6">
                        <Input 
                            placeholder="Nome da nova equipe..." 
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                            className="border-brown-300 focus:border-brown-500"
                        />
                        <Button onClick={handleAddTeam} variant="primary" icon={Plus} className="bg-brown-600 hover:bg-brown-700">Adicionar</Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                        {teams.map(team => (
                            <div key={team.id} className="bg-brown-50 border border-brown-200 rounded-xl p-3 flex justify-between items-center group shadow-sm">
                                <span className="font-bold text-brown-800 text-sm truncate">{team.name}</span>
                                <button onClick={() => handleRemoveTeam(team.id)} className="text-brown-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mb-8 space-y-3 p-4 bg-brown-50/50 rounded-xl border border-brown-100">
                        <label className="text-sm font-bold text-brown-800 uppercase tracking-wider block">Tipo de Pergunta</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer bg-white border border-brown-200 p-3 rounded-xl flex-1 hover:border-brown-400 transition-colors">
                                <input type="radio" checked={questionType === 'multiple_choice'} onChange={() => setQuestionType('multiple_choice')} className="w-5 h-5 text-brown-600 focus:ring-brown-500" />
                                <span className="font-medium text-brown-800">Múltipla Escolha</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-white border border-brown-200 p-3 rounded-xl flex-1 hover:border-brown-400 transition-colors">
                                <input type="radio" checked={questionType === 'essay'} onChange={() => setQuestionType('essay')} className="w-5 h-5 text-brown-600 focus:ring-brown-500" />
                                <span className="font-medium text-brown-800">Dissertativa</span>
                            </label>
                        </div>
                    </div>

                    <Button onClick={startGame} disabled={teams.length === 0} className="w-full py-4 text-lg bg-brown-600 hover:bg-brown-700 shadow-lg shadow-brown-200" icon={Play}>
                        Iniciar Aventura
                    </Button>
                </Card>
            </div>
        );
    }

    if (gameStatus === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
                <div className="relative">
                    <Map className="w-16 h-16 text-brown-300 animate-pulse" />
                    <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-brown-800">
                    {round === 1 ? 'Abrindo o mapa mágico...' : round === 5 ? 'Preparando o grande final...' : 'Avançando na floresta...'}
                </h3>
                <p className="text-brown-600 animate-pulse">O Drácker está usando a lupa...</p>
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
                            <img src={currentMedia} alt="Ilustração da História" className="w-full h-full object-cover" />
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
            <div className={`mx-auto space-y-6 animate-fade-in ${isStorybookMode ? 'max-w-[1400px]' : 'max-w-4xl'}`}>
                <div className="flex justify-between items-center bg-brown-100 text-brown-800 px-4 py-2 rounded-full font-bold shadow-sm border border-brown-200">
                    <div className="flex items-center gap-3">
                        <Map className="w-5 h-5" /> <span className="hidden sm:inline">Investigação em Andamento</span>
                        <button onClick={restartMatch} className="ml-2 text-xs md:text-sm text-brown-600 hover:text-red-600 font-bold flex items-center gap-1 transition-colors bg-white/60 hover:bg-white px-3 py-1 rounded-full shadow-sm border border-brown-200">
                            <RefreshCw className="w-3 h-3 md:w-4 md:h-4" /> Reiniciar
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="bg-white px-3 py-1 rounded-full shadow-inner text-brown-700">Etapa {round} de 4</span>
                    </div>
                </div>

                {currentData.showHelpOnNextRound && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl shadow-md flex gap-4 animate-fade-in">
                        <div className="bg-amber-100 p-3 rounded-full h-fit">
                            <Sparkles className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800 text-lg mb-2">Atenção! Drácker Explica:</h3>
                            <p className="text-amber-700 font-medium italic">{currentData.reforco_pedagogico}</p>
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
                                                                <span className="text-sm font-bold text-amber-700 uppercase block mb-3 tracking-wider flex items-center gap-2"><HelpCircle className="w-5 h-5"/> Gabarito do Mestre</span>
                                                                <span className="font-bold text-amber-900 text-2xl">{enigma.correct_answer}</span>
                                                            </div>
                                                            
                                                            <div className="flex flex-col p-6 bg-slate-50 rounded-3xl border-2 border-slate-200 gap-4">
                                                                <span className="font-bold text-slate-700 uppercase text-sm tracking-wider">Avaliar Desempenho</span>
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    <button onClick={() => handleEvaluate(team.id, 'success')} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl font-bold transition-all ${evaluations[team.id] === 'success' ? 'bg-green-500 text-white shadow-xl scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-600'}`}>
                                                                        <CheckCircle className="w-8 h-8 md:w-10 md:h-10" /> <span className="text-lg">Dominou</span>
                                                                    </button>
                                                                    <button onClick={() => handleEvaluate(team.id, 'partial')} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl font-bold transition-all ${evaluations[team.id] === 'partial' ? 'bg-yellow-500 text-white shadow-xl scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-yellow-400 hover:text-yellow-600'}`}>
                                                                        <HelpCircle className="w-8 h-8 md:w-10 md:h-10" /> <span className="text-lg">Com Ajuda</span>
                                                                    </button>
                                                                    <button onClick={() => handleEvaluate(team.id, 'fail')} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl font-bold transition-all ${evaluations[team.id] === 'fail' ? 'bg-red-500 text-white shadow-xl scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-red-400 hover:text-red-600'}`}>
                                                                        <XCircle className="w-8 h-8 md:w-10 md:h-10" /> <span className="text-lg">Dificuldade</span>
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
                                            icon={currentData.isLoadingPart2 ? RefreshCw : ChevronRight}
                                            className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3 shadow-md text-white border-transparent"
                                        >
                                            {currentData.isLoadingPart2 && round === 1 ? 'Forjando História...' : (round === 4 ? 'Avançar para o Final' : 'Avançar História')}
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
                        <Card className="border-brown-300 shadow-xl bg-[#fffdf5] overflow-hidden">
                            <div className="bg-brown-100 p-4 border-b border-brown-200 flex items-center gap-3">
                                <BookOpen className="w-6 h-6 text-brown-600" />
                                <h2 className="text-2xl font-bold text-brown-900 font-display">
                                    {round === 1 ? 'O Início do Mistério' : `Avançando na Etapa ${round}`}
                                </h2>
                            </div>
                            <div className="p-6 md:p-8 space-y-6">
                                {renderStoryColumn()}
                                
                                {enigmas.map((enigma, index) => {
                                    const team = teams.find(t => enigma.team.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(enigma.team.toLowerCase())) || teams[index];
                                    if (!team) return null;

                                    return (
                                        <div key={index} className="bg-brown-50 border-2 border-brown-200 rounded-2xl p-6 shadow-sm relative mt-8">
                                            <HelpCircle className="w-8 h-8 text-brown-500 absolute -top-4 -left-4 bg-[#fffdf5] rounded-full p-1" />
                                            <h3 className="text-xl font-bold text-brown-900 mb-2">Desafio: <span className="text-indigo-600">{enigma.team}</span></h3>
                                            <p className="text-lg text-brown-800 mb-4">{enigma.question}</p>
                                            
                                            {enigma.options && enigma.options.length > 0 && (
                                                <div className="space-y-2 mb-4">
                                                    {enigma.options.map((opt, i) => (
                                                        <button 
                                                            key={i} 
                                                            onClick={() => handleSelectOption(team.id, i)}
                                                            className={`w-full text-left border p-3 rounded-lg font-medium transition-all ${selectedOptions[team.id] === i ? 'bg-indigo-100 border-indigo-400 text-indigo-900 shadow-inner' : 'bg-white border-brown-100 text-brown-700 hover:bg-brown-50 hover:border-brown-300'}`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {questionType === 'essay' && (
                                                <>
                                                    <div className="bg-brown-100/50 p-3 rounded-lg border border-brown-200 mb-6">
                                                        <span className="text-xs font-bold text-brown-600 uppercase block mb-1">Gabarito para o Professor:</span>
                                                        <span className="font-medium text-brown-900">{enigma.correct_answer}</span>
                                                    </div>
                                                    
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-slate-200 gap-4 shadow-sm">
                                                        <span className="font-bold text-slate-700">Avaliar Desempenho:</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            <button 
                                                                onClick={() => handleEvaluate(team.id, 'success')}
                                                                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${evaluations[team.id] === 'success' ? 'bg-green-500 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-green-50 hover:text-green-700'}`}
                                                            >
                                                                <CheckCircle className="w-4 h-4" /> Dominou
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEvaluate(team.id, 'partial')}
                                                                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${evaluations[team.id] === 'partial' ? 'bg-yellow-500 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-yellow-50 hover:text-yellow-700'}`}
                                                            >
                                                                <HelpCircle className="w-4 h-4" /> Com Ajuda
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEvaluate(team.id, 'fail')}
                                                                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${evaluations[team.id] === 'fail' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700'}`}
                                                            >
                                                                <XCircle className="w-4 h-4" /> Dificuldade
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
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
                            <Button onClick={nextRound} className="px-8 py-3 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200" icon={currentData.isLoadingPart2 ? RefreshCw : ChevronRight} disabled={questionType === 'multiple_choice' ? Object.keys(selectedOptions).length !== teams.length : Object.keys(evaluations).length !== teams.length}>
                                {currentData.isLoadingPart2 && round === 1 ? 'Forjando História...' : (round === 4 ? 'Avançar para o Grande Final' : 'Avançar História')}
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
                                                        <span className="text-xl font-bold text-amber-700 uppercase block mb-4 tracking-wider flex items-center gap-3"><HelpCircle className="w-8 h-8"/> Gabarito Exclusivo do Professor</span>
                                                        <span className="font-bold text-amber-900 text-3xl">{enigma.correct_answer}</span>
                                                    </div>
                                                    
                                                    <div className="flex flex-col p-8 bg-slate-50 rounded-3xl border-4 border-slate-200 gap-6">
                                                        <span className="font-bold text-slate-700 uppercase text-xl tracking-wider">Avaliar Desempenho</span>
                                                        <div className="grid grid-cols-3 gap-6">
                                                            <button onClick={() => handleEvaluate(team.id, 'success')} className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl font-bold transition-all ${evaluations[team.id] === 'success' ? 'bg-green-500 text-white shadow-xl scale-105' : 'bg-white border-4 border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-600'}`}>
                                                                <CheckCircle className="w-12 h-12" /> <span className="text-2xl">Dominou</span>
                                                            </button>
                                                            <button onClick={() => handleEvaluate(team.id, 'partial')} className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl font-bold transition-all ${evaluations[team.id] === 'partial' ? 'bg-yellow-500 text-white shadow-xl scale-105' : 'bg-white border-4 border-slate-200 text-slate-600 hover:border-yellow-400 hover:text-yellow-600'}`}>
                                                                <HelpCircle className="w-12 h-12" /> <span className="text-2xl">Com Ajuda</span>
                                                            </button>
                                                            <button onClick={() => handleEvaluate(team.id, 'fail')} className={`flex flex-col items-center justify-center gap-4 p-6 rounded-3xl font-bold transition-all ${evaluations[team.id] === 'fail' ? 'bg-red-500 text-white shadow-xl scale-105' : 'bg-white border-4 border-slate-200 text-slate-600 hover:border-red-400 hover:text-red-600'}`}>
                                                                <XCircle className="w-12 h-12" /> <span className="text-2xl">Dificuldade</span>
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
                                    icon={currentData.isLoadingPart2 ? RefreshCw : ChevronRight}
                                    className="text-2xl px-8 py-4 bg-green-600 hover:bg-green-700 shadow-xl text-white border-transparent"
                                >
                                    {currentData.isLoadingPart2 && round === 1 ? 'Forjando História...' : (round === 4 ? 'Avançar para o Final' : 'Avançar História')}
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
                <div className="flex justify-between items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold shadow-sm border border-yellow-200">
                    <div className="flex items-center gap-3">
                        <Award className="w-5 h-5" /> <span className="hidden sm:inline">Mistério Resolvido</span>
                        <button onClick={restartMatch} className="ml-2 text-xs md:text-sm text-yellow-700 hover:text-red-600 font-bold flex items-center gap-1 transition-colors bg-white/60 hover:bg-white px-3 py-1 rounded-full shadow-sm border border-yellow-300">
                            <RefreshCw className="w-3 h-3 md:w-4 md:h-4" /> Reiniciar
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="bg-white px-3 py-1 rounded-full shadow-inner text-yellow-700">Etapa Final</span>
                    </div>
                </div>

                <Card className="border-yellow-300 shadow-2xl bg-gradient-to-b from-[#fffdf5] to-yellow-50 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500"></div>
                    <div className="p-8 text-center border-b border-yellow-200">
                        <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-4xl font-black text-yellow-800 font-display mb-2">O Mistério foi Resolvido!</h2>
                        <p className="text-yellow-700 font-medium text-lg mb-4">Os detetives salvaram a Floresta Encantada.</p>
                        <div className="inline-block bg-white border-2 border-yellow-400 rounded-xl px-6 py-3 shadow-md mt-2">
                            <span className="text-sm uppercase font-bold text-yellow-600 block mb-1">Equipe Vencedora</span>
                            <span className="text-2xl font-black text-yellow-800">{currentData?.finalHistory?.winner || 'Todos Nós!'}</span>
                        </div>
                    </div>
                    
                    <div className="p-8">
                        <p className="text-xl leading-relaxed text-slate-800 mb-8 italic text-center">
                            {currentData?.finalHistory?.finalStoryText}
                        </p>

                        {/* Gabarito e Resumo Final */}
                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mt-8">
                            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                                <Award className="w-8 h-8 text-slate-500" />
                                Gabarito e Pontuações
                            </h3>
                            
                            <div className="space-y-6">
                                {currentData?.finalHistory?.rounds?.map((roundData, rIndex) => (
                                    <div key={rIndex} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <h4 className="font-bold text-slate-700 mb-4 bg-slate-200 px-3 py-1 rounded-lg inline-block">Etapa {roundData.round}</h4>
                                        <div className="space-y-4">
                                            {roundData.enigmas?.map((enigma, eIndex) => {
                                                const team = teams.find(t => enigma.team.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(enigma.team.toLowerCase())) || teams[eIndex];
                                                const chosenOptIndex = roundData.selectedOptions?.[team?.id];
                                                const chosenText = chosenOptIndex !== undefined ? enigma.options?.[chosenOptIndex] : null;
                                                const evalStatus = roundData.evaluations?.[team?.id];

                                                return (
                                                    <div key={eIndex} className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                                                        <div className="flex justify-between items-start gap-4 mb-2">
                                                            <p className="font-bold text-slate-800 flex-1"><span className="text-indigo-600">{enigma.team}:</span> {enigma.question}</p>
                                                            {evalStatus === 'success' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">ACERTOU</span>}
                                                            {evalStatus === 'partial' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">COM AJUDA</span>}
                                                            {evalStatus === 'fail' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">ERROU</span>}
                                                        </div>
                                                        <div className="text-sm space-y-1">
                                                            {chosenText && (
                                                                <p className="text-slate-600"><span className="font-medium">Resposta Escolhida:</span> {chosenText}</p>
                                                            )}
                                                            <p className="text-slate-800 bg-green-50 px-2 py-1 rounded border border-green-100 inline-block mt-1">
                                                                <span className="font-bold text-green-700">Gabarito:</span> {enigma.correct_answer}
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
                    
                    <div className="p-6 bg-yellow-100 border-t border-yellow-200 flex justify-center">
                        <Button onClick={restartMatch} variant="outline" icon={RefreshCw} className="border-yellow-400 text-yellow-800 hover:bg-yellow-200 bg-white">
                            Nova Investigação
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return null;
};

export default DetectiveRPG;
