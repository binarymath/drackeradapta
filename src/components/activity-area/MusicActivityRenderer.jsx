import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Copy, Gamepad2, FileText, HelpCircle, Sparkles, Music, ChevronDown, Dices, Radio, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';
import { useActivity } from '../../contexts/ActivityContext';
import { exportActivityToPdf } from '../../utils/pdfExportHelper';
import { PrintFontSizeControl } from '../ui/PrintFontSizeControl';

export const MusicActivityRenderer = ({
    musicData,
    printMode,
    isGameMode,
    setIsGameMode,
    pdfShowAlternatives,
    setPdfShowAlternatives,
    handleDirectDownload,
    onPlayInRoulette,
    openManualMusicEditor
}) => {
    const { tabs, selectActivityTab, addActivityTab, reopenTab } = useActivity();
    const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const [musicFontSize, setMusicFontSize] = useState(16);

    // Identifica se já existe uma atividade na Roleta gerada a partir desta música
    const existingRouletteTab = useMemo(() => {
        if (!tabs || !musicData) return null;
        const currentSongTitle = (musicData.title || '').trim().toLowerCase();
        const currentSongId = musicData.id;

        return tabs.find(t => {
            if (t.type !== 'roulette') return false;

            // 1. Verificação por ID da música de origem
            if (currentSongId && t.sourceSongId && t.sourceSongId === currentSongId) {
                return true;
            }

            // 2. Verificação por título explícito da canção de origem
            if (t.sourceSongTitle && t.sourceSongTitle.trim().toLowerCase() === currentSongTitle) {
                return true;
            }

            // 3. Verificação por correspondência de título da aba (ex: "Roleta: [Título]")
            const cleanRouletteTitle = (t.title || '')
                .replace(/^Roleta:\s*/i, '')
                .replace(/\s+#\d+$/, '')
                .trim()
                .toLowerCase();
            if (currentSongTitle && cleanRouletteTitle === currentSongTitle) {
                return true;
            }

            // 4. Verificação por tópico da roleta
            if (t.topic && t.topic.trim().toLowerCase() === currentSongTitle) {
                return true;
            }

            // 5. Verificação por correspondência de enunciados das questões
            if (Array.isArray(t.questions) && Array.isArray(musicData.questions) && musicData.questions.length > 0) {
                const musicStatements = new Set(
                    musicData.questions
                        .map(q => (q.question || q.statement || '').trim().toLowerCase())
                        .filter(Boolean)
                );
                if (musicStatements.size > 0) {
                    const matchCount = t.questions.filter(rq => {
                        const rStatement = (rq.question || rq.statement || '').trim().toLowerCase();
                        return musicStatements.has(rStatement);
                    }).length;
                    if (matchCount >= Math.min(2, musicStatements.size)) {
                        return true;
                    }
                }
            }

            return false;
        }) || null;
    }, [tabs, musicData]);

    const handleRouletteClick = () => {
        if (existingRouletteTab) {
            // Se já foi criada, leva diretamente para a atividade na Roleta
            if (existingRouletteTab.hidden && reopenTab) {
                reopenTab(existingRouletteTab.id);
            } else {
                selectActivityTab(existingRouletteTab.id);
            }
            toast(`Abrindo atividade na Roleta: "${existingRouletteTab.title}"`);
        } else {
            // Ainda não criada: abre o modal de transformação
            if (onPlayInRoulette) {
                onPlayInRoulette();
            }
        }
    };

    const handleCreateNewMusic = () => {
        if (openManualMusicEditor) {
            openManualMusicEditor();
        } else {
            window.dispatchEvent(new CustomEvent('dracker_open_new_modal_activity', {
                detail: { type: 'simplify' }
            }));
        }
    };

    const copyMenuRef = useRef(null);
    const downloadMenuRef = useRef(null);

    const handleBackToRadio = () => {
        const radioTab = (tabs || []).find(t => t.type === 'simplify' && !t.musicData && !t.hidden);
        if (radioTab) {
            selectActivityTab(radioTab.id);
        } else if (addActivityTab) {
            addActivityTab({
                title: "Rádio Drácker",
                type: 'simplify',
                content: 'Rádio Drácker - Músicas e Ritmos Pedagógicos',
                data: {}
            });
        }
    };

    // Fechar dropdowns ao clicar fora
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

    if (!musicData) return null;

    // Tratamento de texto limpo
    const cleanLyrics = (musicData.lyrics || '')
        .replace(/^(Letra da M[uú]sica|T[ií]tulo|M[uú]sica):?.*(\n|$)/im, '')
        .trim();

    const formatQuestionsForCopy = () => {
        return (musicData.questions || []).map((q, idx) => {
            const questionText = typeof q === 'string' ? q : (q.text || q.question || `Pergunta ${idx + 1}`);
            const cleanText = questionText.replace(/^\d+[.)]\s*/, '').trim();
            const options = Array.from(new Set(
                (((typeof q === 'object' && (q.options || q.alternatives)) || [])).map(o => o.trim()).filter(Boolean)
            ));
            const LETTERS = ['A', 'B', 'C', 'D', 'E'];
            let out = `${idx + 1}. ${cleanText}`;
            if (options.length > 0) {
                options.forEach((opt, i) => {
                    out += `\n   ${LETTERS[i]}) ${opt}`;
                });
            }
            return out;
        }).join('\n\n');
    };

    const handleCopy = (type) => {
        try {
            if (type === 'lyrics') {
                const text = `${musicData.title}\n\n${cleanLyrics}`;
                navigator.clipboard.writeText(text);
                toast('Letra da música copiada!');
            } else if (type === 'questions') {
                const text = `${musicData.title} - Questões de Interpretação\n\n${formatQuestionsForCopy()}`;
                navigator.clipboard.writeText(text);
                toast('Questões copiadas!');
            } else if (type === 'both') {
                const text = `${musicData.title}\n\n[LETRA DA MÚSICA]\n${cleanLyrics}\n\n[QUESTÕES DE INTERPRETAÇÃO]\n${formatQuestionsForCopy()}`;
                navigator.clipboard.writeText(text);
                toast('Letra e questões copiadas!');
            } else if (type === 'style') {
                navigator.clipboard.writeText(musicData.style || '');
                toast('Estilo musical copiado!');
            }
        } catch (err) {
            console.error('Falha ao copiar:', err);
            toast('Erro ao copiar texto');
        }
        setIsCopyMenuOpen(false);
    };

    const filenameTitle = (musicData.title || 'Musica_Dracker')
        .replace(/[^a-zA-Z0-9À-ÿ\s_-]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .slice(0, 40) || 'Musica_Dracker';

    return (
        <div className="space-y-4">
            {/* Barra Superior Discreta de Ações (Jogar Online, Copiar, Baixar) */}
            <div className="no-print flex flex-wrap items-center justify-between gap-2.5 bg-stone-50/90 hover:bg-stone-50 border border-stone-200/90 rounded-2xl px-3.5 py-2.5 shadow-2xs transition-all">
                {/* Lado Esquerdo: Navegação e Modos */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={handleBackToRadio}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50/90 hover:bg-rose-100 border border-rose-200/90 shadow-2xs transition-all cursor-pointer group"
                        title="Voltar para a Rádio Drácker (Estúdio & Acervo Musical)"
                    >
                        <Radio className="w-3.5 h-3.5 text-rose-600 transition-transform group-hover:scale-110" />
                        <span>Rádio Drácker</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsGameMode(!isGameMode)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs group border ${
                            isGameMode
                                ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
                                : 'bg-white text-stone-700 hover:text-indigo-700 border-stone-200 hover:border-indigo-200 hover:bg-indigo-50/60'
                        }`}
                        title="Jogar quiz de interpretação musical interativo online"
                    >
                        <Gamepad2 className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isGameMode ? 'text-white' : 'text-indigo-500'}`} />
                        <span>{isGameMode ? 'Voltar para Folha' : 'Jogar Online'}</span>
                    </button>

                    {(onPlayInRoulette || existingRouletteTab) && (musicData.questions?.length > 0) && (
                        <button
                            type="button"
                            onClick={handleRouletteClick}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer group shadow-2xs ${
                                existingRouletteTab
                                    ? 'bg-amber-100 hover:bg-amber-200/90 text-amber-950 border border-amber-400 ring-1 ring-amber-400/30'
                                    : 'bg-amber-50 hover:bg-amber-100/90 text-amber-900 hover:text-amber-950 border border-amber-300/80'
                            }`}
                            title={
                                existingRouletteTab
                                    ? `Atividade já criada na Roleta ("${existingRouletteTab.title}"). Clique para abrir diretamente.`
                                    : 'Compartilhar estas questões na Roleta Pedagógica para sortear alunos e acionar a bomba'
                            }
                        >
                            <Dices className={`w-3.5 h-3.5 group-hover:rotate-12 transition-transform ${existingRouletteTab ? 'text-amber-800' : 'text-amber-700'}`} />
                            <span>{existingRouletteTab ? 'Ver na Roleta' : 'Jogar na Roleta'}</span>
                            {existingRouletteTab && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs shrink-0" title="Atividade na Roleta já gerada e pronta" />
                            )}
                        </button>
                    )}
                </div>

                {/* Lado Direito: Ações Discretas (Alternativas, Copiar, Baixar) */}
                <div className="flex items-center gap-2 ml-auto flex-wrap sm:flex-nowrap">
                    {/* Toggle Alternativas */}
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-800 cursor-pointer select-none rounded-xl hover:bg-white/80 transition-colors">
                        <input
                            type="checkbox"
                            checked={pdfShowAlternatives}
                            onChange={(e) => setPdfShowAlternatives(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-stone-300 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                        />
                        <span className="hidden sm:inline">Incluir</span> Alternativas
                    </label>

                    {/* Controle de Tamanho de Fonte para Impressão/PDF */}
                    <PrintFontSizeControl
                        value={musicFontSize}
                        onChange={setMusicFontSize}
                        min={13}
                        max={28}
                        step={1.5}
                    />

                    {/* Separador sutil */}
                    <div className="h-4 w-px bg-stone-200 hidden sm:block"></div>

                    {/* Botão Novo idêntico a Editar e Gabarito */}
                    <Button
                        type="button"
                        onClick={handleCreateNewMusic}
                        variant="secondary"
                        className="h-8 text-sm px-3 font-bold cursor-pointer shrink-0"
                        icon={Plus}
                        title="Compor Nova Música Didática (+ Novo)"
                        aria-label="+ Novo"
                    >
                        Novo
                    </Button>

                    {/* Menu Discreto: Copiar */}
                    <div className="relative" ref={copyMenuRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsCopyMenuOpen(prev => !prev);
                                setIsDownloadMenuOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100/80 border border-stone-200 shadow-2xs transition-all cursor-pointer"
                            title="Copiar texto da letra ou das questões"
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
                                    onClick={() => handleCopy('lyrics')}
                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-amber-900 hover:bg-amber-50/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Somente Letra</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCopy('questions')}
                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-blue-900 hover:bg-blue-50/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Somente Questões</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCopy('both')}
                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-purple-900 hover:bg-purple-50/70 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-stone-100 mt-1 pt-1.5"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Letra e Questões</span>
                                </button>
                                {musicData.style && (
                                    <button
                                        type="button"
                                        onClick={() => handleCopy('style')}
                                        className="w-full text-left px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-emerald-900 hover:bg-emerald-50/70 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-stone-100"
                                    >
                                        <Music className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Somente Estilo</span>
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
                            title="Baixar em formato PDF"
                        >
                            <Download className="w-3.5 h-3.5 text-stone-500" />
                            <span>Baixar PDF</span>
                            <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDownloadMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-stone-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-stone-400">
                                    Baixar em PDF
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDownloadMenuOpen(false);
                                        exportActivityToPdf('lyrics-card', `${filenameTitle}_Letra`);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-amber-900 hover:bg-amber-50/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Somente Letra</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDownloadMenuOpen(false);
                                        exportActivityToPdf('questions-card', `${filenameTitle}_Questoes`);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-blue-900 hover:bg-blue-50/70 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Somente Questões</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDownloadMenuOpen(false);
                                        exportActivityToPdf('music-complete-content', `${filenameTitle}_Completo`);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-purple-900 hover:bg-purple-50/70 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-stone-100 mt-1 pt-1.5"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Letra e Questões</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Container Completo da Atividade (Letra + Questões) */}
            <div id="music-complete-content" className="space-y-6">
                {/* Card 1: Letra da Música */}
                <div className={printMode === 'questions' ? 'no-print' : ''}>
                    <Card id="lyrics-card" className="p-8 relative group border border-brown-100 shadow-sm print:shadow-none print:border-4 print:border-brown-200 print:p-10">
                        <div className="absolute top-0 right-0 p-4 opacity-10 print:opacity-5">
                            <span className="text-6xl print:text-8xl">🎵</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-brown-100 pb-4 mb-6 print:border-b-2 print:border-brown-800 print:mb-8 relative z-10">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <img
                                    src="/dracker_character.png"
                                    alt="Drácker"
                                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 drop-shadow-md"
                                />
                                <h2 className="text-2xl sm:text-3xl font-black text-brown-900 leading-tight">
                                    {musicData.title}
                                </h2>
                            </div>
                        </div>

                        <div 
                            className="font-sans text-brown-800 leading-relaxed print:font-serif print:leading-loose whitespace-pre-wrap print:block"
                            style={{ fontSize: `${musicFontSize * 1.15}px`, lineHeight: 1.6 }}
                        >
                            {cleanLyrics.split('\n').map((line, idx) => {
                                const parts = line.split(/(\*\*.*?\*\*)/g);
                                return (
                                    <div key={idx} className={`${line.trim() === '' ? 'h-6' : ''} break-inside-avoid`}>
                                        {parts.map((part, i) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <strong key={i} className="font-extrabold text-brown-900 print:text-black">{part.slice(2, -2)}</strong>;
                                            }
                                            return part;
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Rodapé impresso da Letra */}
                        <div className="hidden print:flex mt-auto pt-8 border-t border-brown-200 justify-between text-xs text-brown-600">
                            <span className="flex items-center gap-1 font-bold">
                                <img src="/dracker_character.png" alt="Logo" className="w-4 h-4 opacity-50 grayscale" />
                                Letra da Música - Drácker
                            </span>
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                    </Card>
                </div>

                {/* Quebra de página para impressão / PDF */}
                <div className="html2pdf__page-break page-break print:break-before-page"></div>

                {/* Card 2: Questões de Interpretação */}
                <div className={printMode === 'lyrics' ? 'no-print' : ''}>
                    <Card id="questions-card" className="p-8 relative print:border-4 print:border-brown-200 print:p-10 print:shadow-none">
                        <div className="absolute top-0 right-0 p-4 opacity-10 print:opacity-5">
                            <span className="text-6xl print:text-8xl">📝</span>
                        </div>
                        <div className="flex justify-between items-center mb-6 border-b border-brown-100 pb-4 print:border-brown-800 print:mb-8 relative z-10">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <img
                                    src="/dracker_character.png"
                                    alt="Drácker"
                                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 drop-shadow-md"
                                />
                                <h2 className="text-2xl sm:text-3xl font-black text-brown-900 leading-tight">
                                    Questões de Interpretação: {musicData.title}
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6" style={{ '--qp-font-size': `${musicFontSize}px` }}>
                            {(musicData.questions || []).map((q, idx) => {
                                const questionText = typeof q === 'string' ? q : (q.text || q.question || `Pergunta ${idx + 1}`);
                                const options = Array.from(new Set(
                                    (((typeof q === 'object' && (q.options || q.alternatives)) || [])).map(o => o.trim()).filter(Boolean)
                                ));
                                const LETTERS = ['A', 'B', 'C', 'D', 'E'];

                                return (
                                    <div key={idx} className="dracker-print-card bg-white border-2 border-amber-200 rounded-xl p-4 sm:p-5 shadow-sm break-inside-avoid print:border-brown-400 print:shadow-none flex flex-col">
                                        <div className="dracker-card-head flex items-start gap-3 mb-3 break-inside-avoid">
                                            <span className="dracker-card-num shrink-0 w-7 h-7 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-full flex items-center justify-center font-black text-sm shadow-md print:bg-black print:text-white print:shadow-none">
                                                {idx + 1}
                                            </span>
                                            <p 
                                                className="dracker-card-statement text-brown-900 font-bold print:text-black leading-snug pt-0.5"
                                                style={{ fontSize: `${musicFontSize}px` }}
                                            >
                                                {questionText.replace(/^\d+[.)]\s*/, '')}
                                            </p>
                                        </div>

                                        {options.length > 0 && pdfShowAlternatives ? (
                                            <div className="dracker-card-options space-y-2 mt-auto">
                                                {options.map((opt, i) => (
                                                    <div key={i} className="dracker-card-option flex items-center gap-3 bg-amber-50/50 border border-amber-100 rounded-lg p-2.5 print:bg-white print:border-brown-200">
                                                        <span className="dracker-option-letter shrink-0 w-5 h-5 rounded-full border-2 border-amber-300 bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black print:border-brown-500 print:bg-white print:text-black">
                                                            {LETTERS[i]}
                                                        </span>
                                                        <span 
                                                            className="text-brown-700 font-medium leading-tight print:text-black"
                                                            style={{ fontSize: `${Math.round(musicFontSize * 0.9)}px` }}
                                                        >
                                                            {opt}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="dracker-answer-lines space-y-2.5 mt-auto pt-2">
                                                <div className="dracker-answer-line border-b border-dashed border-stone-300 h-4.5 w-full"></div>
                                                <div className="dracker-answer-line border-b border-dashed border-stone-300 h-4.5 w-full"></div>
                                                <div className="dracker-answer-line border-b border-dashed border-stone-300 h-4.5 w-full"></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Rodapé impresso das Questões */}
                        <div className="hidden print:flex mt-16 pt-8 border-t border-brown-200 justify-between text-xs text-brown-600">
                            <span className="flex items-center gap-1 font-bold">
                                <img src="/dracker_character.png" alt="Logo" className="w-4 h-4 opacity-50 grayscale" />
                                Interpretação Musical - Drácker
                            </span>
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Card de Estilo Musical (Apenas para visualização em tela; 100% excluído de PDF e Impressão) */}
            {musicData.style && (
                <div className="no-print no-pdf">
                    <Card className="p-4 relative group border border-brown-100/80 shadow-2xs bg-amber-50/20">
                        <div className="flex items-center gap-2 border-b border-brown-100/60 pb-2 mb-2">
                            <span className="text-base">🎨</span>
                            <h3 className="text-xs font-bold text-brown-800 uppercase tracking-wide">Estilo Musical Sugerido (Apenas consulta em tela)</h3>
                        </div>
                        <div className="font-sans text-brown-700 text-xs leading-relaxed whitespace-pre-wrap">
                            {musicData.style}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
