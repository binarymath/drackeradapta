import React, { useState } from 'react';
import { 
  Loader2, AlertCircle, CheckCircle2, ChevronRight, FileText, MousePointerClick, 
  Play, X, Settings2, Plus, Trash2, Sparkles, HelpCircle, Calculator, BookOpen, Target, Key
} from 'lucide-react';
import { generateWordSearch, extractWords, generateMathProblems } from '../utils/wordsearchGenerator';

// UI Components
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { shuffle } from '../utils/array';

/**
 * Componente para gerenciar o fluxo em etapas do caça-palavras
 * Suporta 3 Modos Universais:
 * 1. 'text': História / Texto (Leitura e Interpretação)
 * 2. 'clues': Perguntas & Pistas (Qualquer Disciplina)
 * 3. 'math': Desafios Matemáticos Gerais (Equações 1º/2º grau, Decimais, Operações, Porcentagem, Geometria)
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

  // Modos de Jogo Universais
  const [gameModeType, setGameModeType] = useState('text'); // 'text' | 'clues' | 'math'
  const [mathSubtopic, setMathSubtopic] = useState('equacoes1'); // 'equacoes1' | 'equacoes2' | 'decimais' | 'operacoes' | 'custom_ai'
  const [mathAnswerFormat, setMathAnswerFormat] = useState('text_words'); // 'text_words' (por extenso) | 'numeric' (dígitos 0-9)

  // Configurações de Operações para Modo de Operações Numéricas
  const [mathOperations, setMathOperations] = useState(['+', '-']);
  const [mathMaxOrder, setMathMaxOrder] = useState(2);
  const [mathMultMaxOrder, setMathMultMaxOrder] = useState(1);
  const [mathDivMaxOrder, setMathDivMaxOrder] = useState(1);
  const lastTriggerRef = React.useRef(null);

  const maxSelectableWords = (rows >= 18 || cols >= 18) ? 10 : 15;

  // Inicia quando o botão Gerar é pressionado (triggerStart muda)
  React.useEffect(() => {
    if (!triggerStart || triggerStart === lastTriggerRef.current) return;
    lastTriggerRef.current = triggerStart;

    // Reset wizard state so reopens cleanly
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

        const presetWords = (initialData.words || []).map(w => {
          if (typeof w === 'object' && w !== null) {
            return { clue: w.clue || w.word || '', word: (w.word || '').toUpperCase() };
          }
          return typeof w === 'string' ? w.toUpperCase() : w;
        });
        setAvailableWords(presetWords);
        setSelectedWords(presetWords.slice(0, Math.min(maxSelectableWords, presetWords.length)));

        let detectedMode = initialData.gameModeType;
        let detectedMathFormat = initialData.mathAnswerFormat;
        let detectedMathSubtopic = initialData.mathSubtopic;
        
        // Auto-detect legacy activities that didn't save gameModeType
        if (!detectedMode && initialData.words && initialData.words.length > 0) {
            const hasObjects = typeof initialData.words[0] === 'object';
            if (hasObjects) {
                if (baseStory.toLowerCase().includes('matemátic') || baseStory.toLowerCase().includes('operaç')) {
                    detectedMode = 'math';
                    detectedMathFormat = 'numeric'; // Safe default
                } else {
                    detectedMode = 'clues';
                }
            } else {
                detectedMode = 'text';
            }
        }
        
        if (initialData.rows) setRows(initialData.rows);
        if (initialData.cols) setCols(initialData.cols);
        if (initialData.directions) setDirections(initialData.directions);
        
        setGameModeType(detectedMode || 'text');
        if (detectedMathSubtopic) setMathSubtopic(detectedMathSubtopic);
        if (detectedMathFormat) setMathAnswerFormat(detectedMathFormat);
      }

      if (initialData && (initialData.gameModeType === 'math' || initialData.gameModeType === 'clues' || (typeof initialData.words?.[0] === 'object'))) {
        setStep(2);
      } else {
        setStep(1);
      }
      return;
    }

    setStep('INTRO');
  }, [triggerStart, isEditSession, initialData, maxSelectableWords, setDirections]);

  // Função principal de geração conforme o modo selecionado
  const handleStartWordsearch = async () => {
    if (isEditSession) {
      setStep(1);
      return;
    }

    // 1. MODO MATEMÁTICA (OPERAÇÕES ARITMÉTICAS BÁSICAS)
    if (gameModeType === 'math' && mathSubtopic === 'operacoes') {
      if (mathOperations.length === 0) {
        onError('Selecione pelo menos uma operação matemática');
        return;
      }
      setStep('LOADING');
      setIsLoading(true);
      setTimeout(() => {
        const problems = generateMathProblems(20, mathMaxOrder, mathOperations, mathMultMaxOrder, mathDivMaxOrder);
        const mappedWords = problems.map(p => ({ 
            word: mathAnswerFormat === 'numeric' 
                ? p.problem.replace(' ?', p.answer).replace(/\s+/g, '') // e.g. "2+2=4"
                : String(p.answer), 
            clue: p.problem 
        }));
        setAvailableWords(mappedWords);
        setSelectedWords(mappedWords.slice(0, Math.min(maxSelectableWords, mappedWords.length)));
        setEditableText(`Resolva as operações e encontre a conta completa no caça-palavras!`);
        setStep(2);
        setIsLoading(false);
      }, 400);
      return;
    }

    // 2. MODO MATEMÁTICA GERAL (EQUAÇÕES 1º/2º GRAU, DECIMAIS OU TEMA CUSTOMIZADO)
    if (gameModeType === 'math' && mathSubtopic !== 'operacoes') {
      if (!geminiService || !apiKey) {
        onError('Configure sua API Key para gerar desafios de matemática com IA');
        return;
      }

      setStep('LOADING');
      setIsLoading(true);

      try {
        const formatGuide = mathAnswerFormat === 'numeric'
          ? 'As respostas DEVEM SER A EQUAÇÃO OU OPERAÇÃO COMPLETA resolvida, sem espaços, contendo NO MÍNIMO 4 caracteres (ex: "2x+4=10", "x=3,14", "2+3=5", "10/2=5", "50%de10=5"). NUNCA retorne apenas um número sozinho (ex: "3"), pois ele não serve para um caça-palavras de números!'
          : 'As respostas devem ser palavras escritas POR EXTENSO em letras maiúsculas de 1 única palavra sem espaços (ex: "TRES", "DEZ", "UM", "CINQUENTA", "DELTA", "RAIZ", "HIPOTENUSA").';

        let subtopicText = '';
        if (mathSubtopic === 'equacoes1') {
          subtopicText = 'Crie 10 problemas e equações do 1º grau (ex: 2x + 4 = 10 ➔ x = ?).';
        } else if (mathSubtopic === 'equacoes2') {
          subtopicText = 'Crie 10 perguntas e desafios sobre Equações do 2º Grau e Fórmula de Bhaskara (ex: calcular valor do Delta Δ, raízes x1/x2 ou coeficientes).';
        } else if (mathSubtopic === 'decimais') {
          subtopicText = 'Crie 10 desafios e problemas sobre Números Decimais, Frações e Porcentagens (ex: 0,25 + 0,75 = ? ou 50% de 200).';
        } else {
          subtopicText = `Crie 10 desafios matemáticos pedagógicos sobre o tema "${topic || 'Matemática'}".`;
        }

        const prompt = `Você é um professor de matemática especialista. ${subtopicText}
${formatGuide}
Dica do plano de aula: "${lessonDetails || 'Foque nos conceitos essenciais.'}"

SEJA EXTREMAMENTE RIGOROSO NO FORMATO JSON E RETORNE APENAS O JSON EM TEXTO PURO:
[
  {"clue": "Enunciado do problema ou equação 1", "word": "RESPOSTA1"},
  {"clue": "Enunciado do problema ou equação 2", "word": "RESPOSTA2"}
]`;

        let rawResponse = await geminiService.generateText(prompt, {
          model: 'gemini-2.5-flash',
          maxOutputTokens: 2500,
          temperature: 0.6
        });

        let cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        // Improve JSON parsing robustness
        const startIndex = cleanedJson.indexOf('[');
        const endIndex = cleanedJson.lastIndexOf(']');
        if (startIndex !== -1 && endIndex !== -1) {
            cleanedJson = cleanedJson.substring(startIndex, endIndex + 1);
        }
        
        const parsed = JSON.parse(cleanedJson);

        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map(p => ({
            clue: p.clue || p.question || 'Desafio',
            word: (p.word || p.answer || 'RESPOSTA').toString().toUpperCase().replace(/[^A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ,\.\-=+*xX÷\/%]/g, '')
          })).filter(p => p.word.length >= (mathAnswerFormat === 'numeric' ? 3 : 2));

          setAvailableWords(mapped);
          setSelectedWords(mapped.slice(0, Math.min(maxSelectableWords, mapped.length)));
          setEditableText(`Resolva os desafios matemáticos e encontre a resposta completa no caça-palavras!`);
          setStep(2);
        } else {
          throw new Error('Formato inválido retornado pela IA');
        }
      } catch (err) {
        console.error('Erro ao gerar desafios matemáticos:', err);
        onError('Não foi possível gerar os desafios matemáticos por IA. Tente novamente ou insira manualmente.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 3. MODO PERGUNTAS & PISTAS (MULTIDISCIPLINAR / QUALQUER MATÉRIA)
    if (gameModeType === 'clues') {
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

        const prompt = `Você é um professor experiente. Crie exatamente 10 perguntas pedagógicas inteligentes, claras e educativas com respostas diretas sobre o tema "${safeTopic}".
Contexto: "${safeDetails || 'Aborde conceitos principais.'}"

REGRAS RÍGIDAS:
- Cada resposta ("word") deve ter APENAS UMA PALAVRA (sem espaços, de 3 a 12 letras).
- Retorne EXCLUSIVAMENTE um JSON estrito no formato:
[
  {"clue": "Pergunta ou pista 1?", "word": "RESPOSTA1"},
  {"clue": "Pergunta ou pista 2?", "word": "RESPOSTA2"}
]`;

        let rawResponse = await geminiService.generateText(prompt, {
          model: 'gemini-2.5-flash',
          maxOutputTokens: 2500,
          temperature: 0.7
        });

        const cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map(p => ({
            clue: p.clue || p.question || 'Pergunta',
            word: (p.word || p.answer || 'RESPOSTA').toString().toUpperCase().replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, '')
          })).filter(p => p.word.length >= 2);

          setAvailableWords(mapped);
          setSelectedWords(mapped.slice(0, Math.min(maxSelectableWords, mapped.length)));
          setEditableText(`Responda às perguntas e encontre as respostas no caça-palavras sobre ${topic}!`);
          setStep(2);
        } else {
          throw new Error('Formato JSON inválido');
        }
      } catch (err) {
        console.error('Erro ao gerar perguntas:', err);
        onError('Não foi possível gerar as perguntas automaticamente. Tente novamente ou cadastre manualmente.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 4. MODO HISTÓRIA / TEXTO (PADRÃO)
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

      const prompt = `Escreva um texto educativo SUPER DIVERTIDO e FÁCIL sobre "${safeTopic}".

  REGRAS:
- Escreva 3 parágrafos curtos.
- Use linguagem simples para crianças.
- Baseie-se ESTRITAMENTE neste contexto: "${safeDetails || 'Fale coisas interessantes.'}"
- O texto DEVE incorporar o contexto acima de forma muito clara.
- Destaque palavras legais.
- O texto deve estar completo.

Texto divertido: `;

      let text = await geminiService.generateText(prompt, {
        model: 'gemini-2.5-flash',
        maxOutputTokens: 2500,
        temperature: 0.7
      });

      text = text.replace(/\*\*/g, '').replace(/#{1,6}\s/g, '').trim();
      const paras = text.split(/\n+/).map(t => t.trim()).filter(Boolean);
      let limitedText = paras.slice(0, 3).join('\n\n');

      if (limitedText && !/[.!?]$/.test(limitedText)) {
        limitedText += '.';
      }

      setGeneratedText(limitedText);
      setEditableText(limitedText);
      setStep(1);

    } catch (err) {
      console.error('Erro ao gerar texto:', err);
      onError(`Erro: ${err.message}`);
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
    const shuffled = shuffle(availableWords);
    setSelectedWords(shuffled.slice(0, Math.min(maxSelectableWords, shuffled.length)));
  };

  const handleWordToggle = (wordObj) => {
    const wordKey = typeof wordObj === 'object' ? wordObj.word : wordObj;
    const isSelected = selectedWords.some(sw => (typeof sw === 'object' ? sw.word : sw) === wordKey);

    if (isSelected) {
      setSelectedWords(selectedWords.filter(sw => (typeof sw === 'object' ? sw.word : sw) !== wordKey));
    } else {
      if (selectedWords.length < maxSelectableWords) {
        setSelectedWords([...selectedWords, wordObj]);
      }
    }
  };

  // Gerenciamento de Pares de Pergunta / Resposta
  const handleAddPair = () => {
    const isNumericGrid = (gameModeType === 'math' && mathAnswerFormat === 'numeric');
    const defaultWord = isNumericGrid ? '1+1=2' : 'RESPOSTA';
    const newPair = { clue: `Pergunta ${selectedWords.length + 1}`, word: defaultWord };
    
    // In Clues/Math mode, we only care about selectedWords
    setSelectedWords(prev => [...prev, newPair]);
  };

  const handleEditPair = (idx, field, value) => {
    setSelectedWords(prev => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], [field]: value };
      }
      return next;
    });
  };

  const handleDeletePair = (idx) => {
    setSelectedWords(prev => prev.filter((_, i) => i !== idx));
  };

  React.useEffect(() => {
    if (gameModeType === 'text') {
      setSelectedWords(prev => prev.slice(0, maxSelectableWords));
    }
  }, [maxSelectableWords, gameModeType]);

  const handleGenerateGrid = () => {
    if (selectedWords.length < 3) {
      onError('Selecione ou cadastre pelo menos 3 palavras/desafios');
      return;
    }

    setIsLoading(true);
    try {
      const isObjectMode = gameModeType === 'clues' || gameModeType === 'math';
      const isNumericGrid = (gameModeType === 'math' && mathAnswerFormat === 'numeric');

      const wordsToGenerate = isObjectMode 
        ? selectedWords.map(sw => (typeof sw === 'object' ? sw.word : sw)) 
        : selectedWords;

      const { grid, words: placedWords, placements } = generateWordSearch(
        wordsToGenerate,
        rows,
        cols,
        directions,
        isNumericGrid ? 'numeric' : 'text'
      );

      const gridText = grid.map(row => row.join(' ')).join('\n');
      const title = (topic ? topic.toUpperCase() : 'CAÇA-PALAVRAS');

      const finalWordsObj = isObjectMode
        ? placedWords.map(pw => {
            const match = selectedWords.find(sw => (typeof sw === 'object' ? sw.word : sw) === pw);
            return { word: pw, clue: match && typeof match === 'object' ? match.clue : pw };
          })
        : placedWords;

      const wordsPerLine = 4;
      const wordLines = [];

      for (let i = 0; i < finalWordsObj.length; i += wordsPerLine) {
        const chunk = finalWordsObj.slice(i, i + wordsPerLine);
        if (isObjectMode) {
          wordLines.push(chunk.map(c => typeof c === 'object' ? c.clue : c).join('  •  '));
        } else {
          wordLines.push(chunk.join('  •  '));
        }
      }

      const wordsListHeader = isObjectMode ? '**🕵️ Desafios & Pistas para encontrar:**' : '**🕵️ Palavras para encontrar:**';
      const wordsList = `${wordsListHeader}\n${wordLines.join('\n')}`;

      const textContent = (editableText || '').toUpperCase();
      let finalContent = '';
      if (isObjectMode) {
        finalContent = `[[TITULO]] ${title}\n\n${gridText}\n\n${wordsList}`;
      } else {
        finalContent = `[[TITULO]] ${title}\n\n${gridText}\n\n${wordsList}\n\n________________\n\n${textContent}`;
      }

      onComplete({
        content: finalContent,
        words: finalWordsObj,
        placements: placements || [],
        title,
        story: editableText,
        rows,
        cols,
        directions,
        gameModeType,
        mathSubtopic,
        mathAnswerFormat
      });
      setStep(3);

    } catch (err) {
      onError(`Erro ao gerar grade: ${err.message}`);
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
            {isLoading ? 'Montando Grade...' : isEditSession ? 'Concluir Edição' : 'Gerar Jogo'}
          </Button>
        )}
      </div>
    );
  }

  const introTitle = isEditSession ? '✏️ Ajustar Atividade' : '✨ Criar Caça-Palavras';
  const modalTitle = step === 'INTRO' 
    ? introTitle 
    : step === 1 
      ? '✏️ Ajustar História' 
      : step === 2 
        ? '⚙️ Configurar Desafios & Grade' 
        : step === 3 
          ? '🎉 Sucesso!' 
          : 'Criando...';

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

        {/* INTRO: Escolha do Modo Universal */}
        {step === 'INTRO' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-6 text-center">
            <div className="w-20 h-20 bg-brown-100 rounded-full flex items-center justify-center mb-1 animate-bounce">
              <div className="text-4xl">🔮</div>
            </div>
            <div className="space-y-4 max-w-lg w-full">
              <h3 className="text-2xl font-black text-brown-900">Como você quer montar o jogo?</h3>
              
              {/* Seletor de Modo Universal (3 Grandes Cards Animados) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div 
                  onClick={() => setGameModeType('text')}
                  className={`relative p-5 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col items-center gap-3 overflow-hidden group ${
                    gameModeType === 'text' 
                      ? 'bg-gradient-to-br from-amber-50 to-orange-100 shadow-xl ring-4 ring-orange-400 scale-105' 
                      : 'bg-white border-2 border-slate-100 hover:border-orange-200 hover:shadow-md'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${gameModeType === 'text' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'}`}>
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <h4 className={`font-black text-sm mb-1 ${gameModeType === 'text' ? 'text-orange-950' : 'text-slate-700'}`}>📖 História / Texto</h4>
                    <p className={`text-[10px] font-bold leading-tight ${gameModeType === 'text' ? 'text-orange-700' : 'text-slate-400'}`}>O aluno lê uma historinha e procura as palavras nela.</p>
                  </div>
                </div>

                <div 
                  onClick={() => setGameModeType('clues')}
                  className={`relative p-5 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col items-center gap-3 overflow-hidden group ${
                    gameModeType === 'clues' 
                      ? 'bg-gradient-to-br from-indigo-50 to-blue-100 shadow-xl ring-4 ring-indigo-400 scale-105' 
                      : 'bg-white border-2 border-slate-100 hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${gameModeType === 'clues' ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-500'}`}>
                    <Target className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <h4 className={`font-black text-sm mb-1 ${gameModeType === 'clues' ? 'text-indigo-950' : 'text-slate-700'}`}>🎯 Perguntas</h4>
                    <p className={`text-[10px] font-bold leading-tight ${gameModeType === 'clues' ? 'text-indigo-700' : 'text-slate-400'}`}>O aluno lê uma pergunta e procura a resposta na grade.</p>
                  </div>
                </div>

                <div 
                  onClick={() => setGameModeType('math')}
                  className={`relative p-5 rounded-3xl cursor-pointer transition-all duration-300 flex flex-col items-center gap-3 overflow-hidden group ${
                    gameModeType === 'math' 
                      ? 'bg-gradient-to-br from-purple-50 to-fuchsia-100 shadow-xl ring-4 ring-purple-400 scale-105' 
                      : 'bg-white border-2 border-slate-100 hover:border-purple-200 hover:shadow-md'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${gameModeType === 'math' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-500'}`}>
                    <Calculator className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <h4 className={`font-black text-sm mb-1 ${gameModeType === 'math' ? 'text-purple-950' : 'text-slate-700'}`}>🔢 Desafios Math</h4>
                    <p className={`text-[10px] font-bold leading-tight ${gameModeType === 'math' ? 'text-purple-700' : 'text-slate-400'}`}>O aluno resolve uma conta e procura o resultado!</p>
                  </div>
                </div>
              </div>

              {/* MODO 1: TEXTO / HISTÓRIA */}
              {gameModeType === 'text' && (
                <div className="bg-white p-4 rounded-xl border border-brown-200 text-left space-y-2">
                  <p className="text-brown-700 text-sm font-medium">
                    Tema da Aula: <span className="font-bold text-brown-900">"{topic || 'Geral'}"</span>
                  </p>
                  {lessonDetails && (
                    <p className="text-xs text-brown-500 italic bg-brown-50 p-2.5 rounded-lg border border-brown-100">
                      "{lessonDetails.slice(0, 120)}{lessonDetails.length > 120 ? '...' : ''}"
                    </p>
                  )}
                  <p className="text-xs text-brown-400">A IA criará um pequeno texto narrativo e extrairá as palavras chaves.</p>
                </div>
              )}

              {/* MODO 2: PERGUNTAS & PISTAS (MULTIDISCIPLINAR) */}
              {gameModeType === 'clues' && (
                <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 text-left space-y-2">
                  <p className="text-indigo-900 text-sm font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Caça-Palavras Investigativo de Perguntas
                  </p>
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    A IA criará perguntas curtas sobre <strong>"{topic || 'o tema da aula'}"</strong>. O estudante lê a pergunta, descobre a resposta e a procura na grade!
                  </p>
                </div>
              )}

              {/* MODO 3: DESAFIOS MATEMÁTICOS GERAIS */}
              {gameModeType === 'math' && (
                <div className="space-y-4 text-left">
                  {/* Sub-tópico de Matemática */}
                  <div className="bg-white p-4 rounded-xl border border-purple-200 space-y-3">
                    <label className="text-xs font-black text-purple-900 uppercase tracking-wider block">Tópico de Matemática</label>
                    <select
                      value={mathSubtopic}
                      onChange={(e) => setMathSubtopic(e.target.value)}
                      className="w-full bg-purple-50/60 border border-purple-300 rounded-xl p-2.5 text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      <option value="equacoes1">Equações do 1º Grau (ex: 2x + 4 = 10 ➔ x = ?)</option>
                      <option value="equacoes2">Equações do 2º Grau & Bhaskara (ex: Delta Δ, raízes x1/x2)</option>
                      <option value="decimais">Números Decimais, Frações & Porcentagens (ex: 0,25 + 0,75 ou 50%)</option>
                      <option value="operacoes">Operações Numéricas Básicas (+, -, x, ÷)</option>
                      <option value="custom_ai">Outro Tópico / Gerar via IA sobre "{topic || 'Matemática'}"</option>
                    </select>

                    {/* Opção de Formato da Resposta */}
                    <div className="pt-2 border-t border-purple-100 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-purple-900">Formato das Respostas no Grid:</span>
                      <div className="flex bg-purple-100 p-1 rounded-lg gap-1">
                        <button
                          type="button"
                          onClick={() => setMathAnswerFormat('text_words')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                            mathAnswerFormat === 'text_words' 
                              ? 'bg-purple-600 text-white shadow-2xs font-black' 
                              : 'text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          Por Extenso (Letras)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMathAnswerFormat('numeric')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                            mathAnswerFormat === 'numeric' 
                              ? 'bg-purple-600 text-white shadow-2xs font-black' 
                              : 'text-purple-700 hover:bg-purple-200'
                          }`}
                        >
                          Dígitos (0-9)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Opções específicas se operacoes */}
                  {mathSubtopic === 'operacoes' && (
                    <div className="bg-white p-4 rounded-xl border border-brown-200 space-y-3">
                      <label className="text-xs font-bold text-brown-700 block">Operações Incluídas</label>
                      <div className="flex flex-wrap gap-2">
                        {[{id: '+', label: 'Adição (+)'}, {id: '-', label: 'Subtração (-)'}, {id: '*', label: 'Multiplicação (x)'}, {id: '/', label: 'Divisão (÷)'}].map(op => (
                          <label key={op.id} className="flex items-center gap-2 bg-brown-50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-brown-100 border border-brown-200 transition-colors text-xs font-semibold text-brown-800">
                            <input 
                              type="checkbox"
                              checked={mathOperations.includes(op.id)}
                              onChange={(e) => {
                                if (e.target.checked) setMathOperations([...mathOperations, op.id]);
                                else setMathOperations(mathOperations.filter(o => o !== op.id));
                              }}
                              className="rounded border-brown-300 text-brown-600 focus:ring-brown-500"
                            />
                            <span>{op.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={() => handleStartWordsearch()}
              className="px-8 py-3.5 text-base font-bold shadow-xl hover:scale-105"
              icon={Play}
            >
              Criar Caça-Palavras
            </Button>
          </div>
        )}

        {/* Loading Inicial */}
        {(step === 'LOADING' || (step === 0 && isLoading)) && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-white p-4 rounded-full shadow-lg border border-indigo-100">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-bold text-brown-900">Elaborando desafios...</p>
              <p className="text-sm text-brown-500">A Inteligência Artificial está preparando as perguntas e respostas sobre "{topic || 'o tema'}"</p>
            </div>
          </div>
        )}

        {/* Step 1: Editor de Texto (Modo História) */}
        {step === 1 && gameModeType === 'text' && (
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

        {/* Step 2: Configuração e Gerenciamento de Palavras/Perguntas */}
        {step === 2 && (
          <div className="space-y-6">

            {/* MODO A & B: GERENCIADOR INTERATIVO DE PERGUNTAS E RESPOSTAS */}
            {(gameModeType === 'clues' || gameModeType === 'math') ? (
              <Card>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-indigo-950 flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span>{gameModeType === 'math' ? 'Desafios Matemáticos & Respostas' : 'Perguntas / Pistas & Respostas'}</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Você pode editar o enunciado e a palavra resposta diretamente abaixo:
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleStartWordsearch}
                      variant="secondary"
                      className="text-xs py-1 px-2.5 h-auto text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                      icon={Sparkles}
                    >
                      Regerar IA
                    </Button>
                    <Button
                      onClick={handleAddPair}
                      className="text-xs py-1 px-2.5 h-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                      icon={Plus}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedWords.map((item, idx) => {
                    const isObj = typeof item === 'object';
                    const clueVal = isObj ? item.clue : item;
                    const wordVal = isObj ? item.word : item;

                    return (
                      <div key={idx} className="flex flex-col gap-2 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm relative group hover:border-indigo-200 transition-all">
                        
                        {/* Clue Input (Question) */}
                        <div className="flex gap-2 w-full items-start">
                          <div className="bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-700 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-inner">
                            {idx + 1}
                          </div>
                          <input 
                            type="text"
                            value={clueVal}
                            onChange={(e) => handleEditPair(idx, 'clue', e.target.value)}
                            placeholder="Digite a pista ou desafio..."
                            className="flex-1 bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-colors"
                          />
                        </div>

                        {/* Answer Input */}
                        <div className="flex justify-end gap-2 w-full pl-9 relative">
                          {/* Connection line */}
                          <div className="absolute left-5 top-0 bottom-4 w-4 border-l-2 border-b-2 border-slate-200 rounded-bl-xl"></div>
                          <div className="relative">
                            <input 
                              type="text"
                              value={wordVal}
                              onChange={(e) => handleEditPair(idx, 'word', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                              placeholder="RESPOSTA"
                              className="w-48 bg-emerald-50/50 border border-emerald-200 rounded-xl pl-8 pr-3 py-2 text-sm font-mono font-black text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-wider transition-colors placeholder-emerald-300/50"
                            />
                            <div className="absolute left-2.5 top-2.5 text-emerald-400">
                              <Key className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeletePair(idx)}
                          className="absolute right-2 top-2 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">{selectedWords.length} desafios preparados para a grade</p>
              </Card>
            ) : (
              /* MODO HISTÓRIA: SELEÇÃO DE PALAVRAS TRADICIONAL */
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
                  {availableWords.map((wordObj, idx) => {
                    const wordValue = typeof wordObj === 'object' ? wordObj.word : wordObj;
                    const displayValue = typeof wordObj === 'object' ? wordObj.clue : wordObj;
                    const isSelected = selectedWords.some(sw => (typeof sw === 'object' ? sw.word : sw) === wordValue);
                    
                    return (
                      <label key={idx} className={`
                        flex flex-col p-2 rounded-lg cursor-pointer border transition-all select-none
                        ${isSelected
                          ? 'bg-brown-500 border-brown-600 text-white shadow-md transform scale-[1.02]'
                          : 'bg-brown-50 border-brown-100 text-brown-600 hover:bg-brown-100'
                        }
                      `}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleWordToggle(wordObj)}
                          className="hidden"
                        />
                        <div className="flex items-center gap-1">
                          {isSelected && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
                          <span className="text-sm font-bold truncate" title={displayValue}>{displayValue}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-brown-400 mt-2 text-center">{selectedWords.length} palavras selecionadas</p>
              </Card>
            )}

            {/* Configurações de Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <h3 className="text-sm font-bold text-brown-700 mb-3">Tamanho da Grade</h3>
                <div className="flex flex-wrap gap-2">
                  {[12, 14, 16, 18].map(size => (
                    <button
                      key={size}
                      onClick={() => { setRows(size); setCols(size); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer ${
                        rows === size
                          ? 'bg-brown-800 text-white border-brown-800 shadow-md'
                          : 'bg-white text-brown-500 border-brown-200 hover:bg-brown-50'
                      }`}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-bold text-brown-700 mb-3">Direções das Palavras</h3>
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
              <h3 className="text-2xl font-black text-brown-900">Atividade Pronta!</h3>
              <p className="text-brown-600 max-w-sm mx-auto text-sm">
                Seu caça-palavras foi gerado com sucesso e já está disponível para jogabilidade digital ou impressão.
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
