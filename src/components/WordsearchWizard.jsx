import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, ChevronRight, FileText, MousePointerClick, Play, X, Settings2 } from 'lucide-react';
import { generateWordSearch, extractWords } from '../utils/wordsearchGenerator';

// UI Components
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

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
  defaultTitle,
  mode = 'create',
  initialData
}) {
  const isEditSession = React.useMemo(
    () => mode === 'edit' || (initialData && Object.keys(initialData).length > 0),
    [mode, initialData]
  );

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [editableText, setEditableText] = useState('');
  const [availableWords, setAvailableWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [rows, setRows] = useState(16);
  const [cols, setCols] = useState(16);

  const maxSelectableWords = (rows >= 18 || cols >= 18) ? 10 : 15;

  const steps = [
    { id: 1, label: 'História', icon: <FileText className="w-4 h-4" /> },
    { id: 2, label: 'Configurar', icon: <Settings2 className="w-4 h-4" /> },
    { id: 3, label: 'Pronto!', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  // Inicia quando o botão Gerar é pressionado (triggerStart muda)
  React.useEffect(() => {
    if (!triggerStart) return;

    // Reset wizard state so reopens cleanly even after previous runs
    setGeneratedText('');
    setEditableText('');
    setAvailableWords([]);
    setSelectedWords([]);
    setIsLoading(false);

    if (isEditSession) {
      if (initialData) {
        const baseStory = (initialData.story || '').trim();
        setGeneratedText(baseStory);
        setEditableText(baseStory);

        const presetWords = (initialData.words || []).map(w => w.toUpperCase());
        setAvailableWords(presetWords);
        setSelectedWords(presetWords.slice(0, Math.min(maxSelectableWords, presetWords.length)));

        if (initialData.rows) setRows(initialData.rows);
        if (initialData.cols) setCols(initialData.cols);
        if (initialData.directions) setDirections(initialData.directions);
      }

      setStep(1);
      return;
    }

    setStep('INTRO');
  }, [triggerStart, isEditSession, initialData, maxSelectableWords, setDirections]);

  const handleStartWordsearch = async () => {
    if (isEditSession) {
      setStep(1);
      return;
    }

    if (!geminiService || !apiKey) {
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
    setSelectedWords(words.slice(0, Math.min(maxSelectableWords, words.length)));
    setStep(2);
  };

  const handleRandomWords = () => {
    const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
    setSelectedWords(shuffled.slice(0, Math.min(maxSelectableWords, shuffled.length)));
  };

  const handleWordToggle = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      if (selectedWords.length < maxSelectableWords) {
        setSelectedWords([...selectedWords, word]);
      }
    }
  };

  React.useEffect(() => {
    setSelectedWords(prev => prev.slice(0, maxSelectableWords));
  }, [maxSelectableWords]);

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

      onComplete({
        content: finalContent,
        words: placedWords,
        placements: placements || [],
        title,
        story: editableText,
        rows,
        cols,
        directions
      });
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

  // --- Footer Logic ---
  let footer = null;

  if (step > 0 && step < 3) {
    footer = (
      <div className="flex justify-between gap-4 w-full">
        <Button onClick={handleClose} variant="secondary">Cancelar</Button>

        {step === 1 && (
          <Button
            onClick={handleTextConfirm}
            disabled={!editableText.trim()}
            className="flex-1"
            icon={ChevronRight}
          >
            Próximo
          </Button>
        )}

        {step === 2 && (
          <Button
            onClick={handleGenerateGrid}
            disabled={selectedWords.length < 3 || isLoading}
            className="flex-1"
            icon={isLoading ? Loader2 : Play}
            isLoading={isLoading}
          >
            {isLoading ? 'Montando...' : 'Gerar Jogo'}
          </Button>
        )}
      </div>
    );
  }

  const modalTitle = step === 'INTRO' ? '✨ Nova História' : step === 1 ? '✏️ Ajustar História' : step === 2 ? '⚙️ Configurar Jogo' : step === 3 ? '🎉 Sucesso!' : 'Criando...';

  // --- RENDER MODAL ---
  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={modalTitle}
      icon={step === 'LOADING' ? Loader2 : undefined}
      size="lg"
      footer={footer}
    >
      <div className="space-y-6">

        {/* INTRO: Confirmação Inicial */}
        {step === 'INTRO' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
            <div className="w-24 h-24 bg-brown-100 rounded-full flex items-center justify-center mb-2 animate-bounce">
              <div className="text-4xl">🔮</div>
            </div>
            <div className="space-y-3 max-w-md">
              <h3 className="text-2xl font-black text-brown-900">Vamos criar uma história?</h3>
              <p className="text-brown-700 text-lg">
                O tema será: <span className="font-bold text-brown-600">"{topic}"</span>
              </p>
              {lessonDetails && (
                <p className="text-sm text-brown-500 bg-white p-3 rounded-lg border border-brown-200 mx-auto italic">
                  "{lessonDetails.slice(0, 100)}{lessonDetails.length > 100 ? '...' : ''}"
                </p>
              )}
            </div>

            <Button
              onClick={() => handleStartWordsearch()}
              className="px-8 py-4 text-lg font-bold shadow-xl hover:scale-105"
              icon={Play}
            >
              Criar História Mágica
            </Button>
          </div>
        )}

        {/* Loading Inicial */}
        {(step === 'LOADING' || (step === 0 && isLoading)) && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-brown-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-white p-4 rounded-full shadow-lg border border-brown-100">
                <Loader2 className="w-12 h-12 text-brown-600 animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-bold text-brown-900">Criando sua história...</p>
              <p className="text-brown-500">A IA está escrevendo algo divertido sobre "{topic}"</p>
            </div>
          </div>
        )}

        {/* Step 1: Editor de Texto */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-brown-50 border border-brown-100 p-4 rounded-xl text-brown-800 text-sm">
              Aqui está a história base. Você pode reescrever ou corrigir o que quiser antes de gerarmos o jogo!
            </div>
            <TextArea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value.slice(0, 1000))}
              className="h-64 text-base leading-relaxed"
              placeholder="Edite seu texto aqui..."
            />
            <div className="text-right text-xs text-brown-400 font-medium">
              {editableText.length}/1000 caracteres
            </div>
          </div>
        )}

        {/* Step 2: Configuração */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Seleção de Palavras */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-brown-700 flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-brown-500" /> Palavras Escondidas
                </h3>
                <Button
                  onClick={handleRandomWords}
                  variant="secondary"
                  className="text-xs h-auto py-1 px-3"
                >
                  🎲 Misturar
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {availableWords.map((word, idx) => (
                  <label key={idx} className={`
                                    flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all select-none
                                    ${selectedWords.includes(word)
                      ? 'bg-brown-500 border-brown-600 text-white shadow-md transform scale-[1.02]'
                      : 'bg-brown-50 border-brown-100 text-brown-600 hover:bg-brown-100'
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
              <p className="text-xs text-brown-400 mt-2 text-center">{selectedWords.length} palavras selecionadas</p>
              {rows >= 18 && (
                <p className="text-[11px] text-brown-500 text-center mt-1">
                  Limite de 10 palavras para caber na mesma página com a grade 18x18.
                </p>
              )}
            </Card>

            {/* Configurações de Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <h3 className="text-sm font-bold text-brown-700 mb-3">Tamanho</h3>
                <div className="flex flex-wrap gap-2">
                  {[12, 14, 16, 18].map(size => (
                    <button
                      key={size}
                      onClick={() => { setRows(size); setCols(size); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${rows === size
                        ? 'bg-brown-800 text-white border-brown-800 shadow-md'
                        : 'bg-white text-brown-500 border-brown-200 hover:bg-brown-50'
                        } `}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-brown-700 mb-3">Direções</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'horizontal', label: '→ Deitada' },
                    { id: 'vertical', label: '↓ Em Pé' },
                    { id: 'diagonal', label: '↘ Inclinada' },
                    { id: 'reverse', label: '← Invertida' }
                  ].map(dir => (
                    <label key={dir.id} className="flex items-center gap-2 text-xs font-semibold text-brown-600 cursor-pointer p-1.5 hover:bg-brown-50 rounded">
                      <input
                        type="checkbox"
                        checked={directions[dir.id]}
                        onChange={(e) => setDirections({ ...directions, [dir.id]: e.target.checked })}
                        className="rounded border-brown-300 text-brown-800 focus:ring-brown-800 accent-brown-600"
                      />
                      {dir.label}
                    </label>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Step 3: Sucesso */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center h-full">
            <div className="w-20 h-20 bg-brown-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-brown-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-brown-900">Tudo Pronto!</h3>
              <p className="text-brown-600 max-w-sm mx-auto">
                Seu caça-palavras foi gerado com sucesso e já está disponível na área de visualização.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="px-8 py-3 text-lg font-bold shadow-lg hover:translate-y-1"
            >
              Ver Atividade
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
