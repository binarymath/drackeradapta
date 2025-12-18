import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, ChevronRight, FileText, MousePointerClick, Play, X, Settings2 } from 'lucide-react';
import { generateWordSearch, extractWords } from '../utils/wordsearchGenerator';

/**
 * Componente para gerenciar o fluxo em etapas do caça-palavras
 * Agora em formato MODAL para não poluir a sidebar
 */
export default function WordsearchWizard({
  apiKey,
  topic,
  lessonDetails,
  difficulty,
  directions,
  setDirections,
  onComplete,
  onError,
  geminiService,
  triggerStart,
  defaultTitle
}) {
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [editableText, setEditableText] = useState('');
  const [availableWords, setAvailableWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [rows, setRows] = useState(16);
  const [cols, setCols] = useState(16);

  const steps = [
    { id: 1, label: 'História', icon: <FileText className="w-4 h-4" /> },
    { id: 2, label: 'Configurar', icon: <Settings2 className="w-4 h-4" /> },
    { id: 3, label: 'Pronto!', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  // Inicia quando o botão Gerar é pressionado (triggerStart muda)
  // Inicia quando o botão Gerar é pressionado (triggerStart muda)
  React.useEffect(() => {
    // Agora apenas ABRE o modal, mas não inicia a geração
    if (triggerStart && step === 0) {
      setStep('INTRO');
    }
  }, [triggerStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartWordsearch = async () => {
    if (!apiKey) {
      onError('Configure sua API Key');
      return;
    }
    if (!topic) {
      onError('Informe um tema');
      return;
    }

    setStep('LOADING');
    setIsLoading(true);

    try {
      const safeTopic = (topic || '').slice(0, 60);
      const safeDetails = (lessonDetails || '').slice(0, 80);
      const difficultyGuide = {
        easy: 'muito simples, com palavras fáceis, poucas frases curtas',
        medium: 'normal, palavras comuns, frases curtas e claras',
        hard: 'um pouco mais desafiador, palavras novas, frases um pouco maiores'
      };

      const prompt = `Escreva um texto educativo SUPER DIVERTIDO e FÁCIL sobre "${safeTopic}".

  REGRAS:
- Escreva 3 parágrafos curtos.
- Use linguagem simples para crianças.
- ${safeDetails || 'Fale coisas interessantes.'}
- Destaque palavras legais.
- O texto deve estar completo.

Texto divertido: `;

      // Usa o serviço Gemini
      let text = await geminiService.generateText(prompt, {
        model: 'gemini-2.5-flash',
        maxOutputTokens: 2500,
        temperature: 0.7
      });

      // Remove formatação markdown se houver
      text = text.replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').trim();

      // Limita a 3 parágrafos e verifica completude
      const paras = text.split(/\n+/).map(t => t.trim()).filter(Boolean);
      let limitedText = paras.slice(0, 3).join('\n\n');

      // Verifica se o último parágrafo termina com pontuação adequada
      if (limitedText && !/[.!?]$/.test(limitedText)) {
        limitedText += '.';
      }

      setGeneratedText(limitedText);
      setEditableText(limitedText);
      setStep(1);

    } catch (err) {
      console.error('Erro ao gerar texto:', err);
      onError(`Erro: ${err.message} `);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextConfirm = () => {
    const words = extractWords(editableText, 25);
    setAvailableWords(words);
    setSelectedWords(words.slice(0, Math.min(10, words.length)));
    setStep(2);
  };

  const handleRandomWords = () => {
    const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
    setSelectedWords(shuffled.slice(0, Math.min(10, shuffled.length)));
  };

  const handleWordToggle = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      if (selectedWords.length < 15) {
        setSelectedWords([...selectedWords, word]);
      }
    }
  };

  const handleGenerateGrid = () => {
    if (selectedWords.length < 3) {
      onError('Selecione pelo menos 3 palavras');
      return;
    }

    setIsLoading(true);
    try {
      const { grid, words: placedWords, placements } = generateWordSearch(
        selectedWords,
        rows,
        cols,
        directions
      );

      const gridText = grid.map(row => row.join(' ')).join('\n');
      const title = topic.toUpperCase();

      // Agrupa palavras em linhas
      const wordsPerLine = 4;
      const wordLines = [];
      for (let i = 0; i < placedWords.length; i += wordsPerLine) {
        const chunk = placedWords.slice(i, i + wordsPerLine);
        wordLines.push(chunk.join('  •  '));
      }
      const wordsList = `**🕵️ Palavras para encontrar:**\n${wordLines.join('\n')} `;

      const textContent = editableText.toUpperCase();
      const finalContent = `${gridText} \n\n${wordsList} \n\n________________\n\n${textContent} `;

      onComplete(finalContent, placedWords, placements || [], title);
      setStep(3);

    } catch (err) {
      onError(`Erro ao gerar grade: ${err.message} `);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setGeneratedText('');
    setEditableText('');
    setAvailableWords([]);
    setSelectedWords([]);
    setIsLoading(false);
  };

  // Se não estiver ativo (step 0), não renderiza nada
  if (step === 0) return null;

  // --- RENDER MODAL ---
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">

        {/* Header do Modal */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {step === 'LOADING' ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : null}
            {step === 'INTRO' ? '✨ Nova História' : step === 1 ? '✏️ Ajustar História' : step === 2 ? '⚙️ Configurar Jogo' : step === 3 ? '🎉 Sucesso!' : 'Criando...'}
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Corpo do Modal (Scrollável) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">

          {/* INTRO: Confirmação Inicial */}
          {step === 'INTRO' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-2 animate-bounce">
                <div className="text-4xl">🔮</div>
              </div>
              <div className="space-y-3 max-w-md">
                <h3 className="text-2xl font-black text-slate-800">Vamos criar uma história?</h3>
                <p className="text-slate-600 text-lg">
                  O tema será: <span className="font-bold text-blue-600">"{topic}"</span>
                </p>
                {lessonDetails && (
                  <p className="text-sm text-slate-500 bg-white p-3 rounded-lg border border-slate-200 mx-auto italic">
                    "{lessonDetails.slice(0, 100)}{lessonDetails.length > 100 ? '...' : ''}"
                  </p>
                )}
              </div>

              <button
                onClick={() => handleStartWordsearch()}
                className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-3"
              >
                <Play className="w-6 h-6 fill-current" />
                Criar História Mágica
              </button>
            </div>
          )}

          {/* Loading Inicial */}
          {(step === 'LOADING' || (step === 0 && isLoading)) && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white p-4 rounded-full shadow-lg border border-blue-100">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-bold text-slate-800">Criando sua história...</p>
                <p className="text-slate-500">A IA está escrevendo algo divertido sobre "{topic}"</p>
              </div>
            </div>
          )}

          {/* Step 1: Editor de Texto */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-sm">
                Aqui está a história base. Você pode reescrever ou corrigir o que quiser antes de gerarmos o jogo!
              </div>
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value.slice(0, 1000))}
                className="w-full h-64 p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all resize-none text-base leading-relaxed shadow-sm bg-white"
                placeholder="Edite seu texto aqui..."
              />
              <div className="text-right text-xs text-slate-400 font-medium">
                {editableText.length}/1000 caracteres
              </div>
            </div>
          )}

          {/* Step 2: Configuração */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Seleção de Palavras */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-blue-500" /> Palavras Escondidas
                  </h3>
                  <button onClick={handleRandomWords} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors">
                    🎲 Misturar
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {availableWords.map((word, idx) => (
                    <label key={idx} className={`
                                    flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all select-none
                                    ${selectedWords.includes(word)
                        ? 'bg-blue-500 border-blue-600 text-white shadow-md transform scale-[1.02]'
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                      }
`}>
                      <input
                        type="checkbox"
                        checked={selectedWords.includes(word)}
                        onChange={() => handleWordToggle(word)}
                        className="hidden" // Esconde checkbox nativo e usa estilo do card
                      />
                      {selectedWords.includes(word) && <CheckCircle2 className="w-3 h-3" />}
                      <span className="text-sm font-bold truncate">{word}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">{selectedWords.length} palavras selecionadas</p>
              </div>

              {/* Configurações de Grade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Tamanho</h3>
                  <div className="flex flex-wrap gap-2">
                    {[12, 14, 16, 18].map(size => (
                      <button
                        key={size}
                        onClick={() => { setRows(size); setCols(size); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${rows === size
                          ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          } `}
                      >
                        {size}x{size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Direções</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'horizontal', label: '→ Deitada' },
                      { id: 'vertical', label: '↓ Em Pé' },
                      { id: 'diagonal', label: '↘ Inclinada' },
                      { id: 'reverse', label: '← Invertida' }
                    ].map(dir => (
                      <label key={dir.id} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer p-1.5 hover:bg-slate-50 rounded">
                        <input
                          type="checkbox"
                          checked={directions[dir.id]}
                          onChange={(e) => setDirections({ ...directions, [dir.id]: e.target.checked })}
                          className="rounded border-slate-300 text-slate-800 focus:ring-slate-800"
                        />
                        {dir.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Sucesso */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center h-full">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800">Tudo Pronto!</h3>
                <p className="text-slate-600 max-w-sm mx-auto">
                  Seu caça-palavras foi gerado com sucesso e já está disponível na área de visualização.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Ver Atividade
              </button>
            </div>
          )}

        </div>

        {/* Footer com Ações */}
        {step > 0 && step < 3 && (
          <div className="p-4 border-t border-slate-100 bg-white flex justify-between gap-4">
            <button
              onClick={handleClose}
              className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>

            {step === 1 && (
              <button
                onClick={handleTextConfirm}
                disabled={!editableText.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
              >
                Próximo <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleGenerateGrid}
                disabled={selectedWords.length < 3 || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-bold shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Play className="fill-current w-5 h-5" />}
                {isLoading ? 'Montando...' : 'Gerar Jogo'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
