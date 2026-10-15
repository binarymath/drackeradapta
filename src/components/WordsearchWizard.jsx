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
import { GlobalAIGeneratorPanel } from './common/GlobalAIGeneratorPanel';

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

  // Configurações Pedagógicas e de IA Locais
  const [topicInput, setTopicInput] = useState(topic || defaultTitle || (initialData?.title || ''));
  const [lessonDetailsInput, setLessonDetailsInput] = useState(lessonDetails || '');
  const [gradeLevel, setGradeLevel] = useState('Ensino Fundamental I - 1º ao 3º Ano (6 a 8 anos)');
  const [itemCount, setItemCount] = useState(10);
  const [difficultyDist, setDifficultyDist] = useState({ easy: 40, medium: 40, hard: 20 });

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

  const handleManualMode = () => {
    if (gameModeType === 'text') {
      const defaultStory = editableText || `Era uma vez uma incrível jornada de aprendizado sobre ${topicInput || topic || 'o tema'}...\n\nOs alunos exploraram conceitos fantásticos e descobriram novos saberes.\n\nTodos comemoraram com muita alegria e conhecimento!`;
      setEditableText(defaultStory);
      setGeneratedText(defaultStory);
      setStep(1);
    } else {
      const sample = [
        { clue: 'Exemplo de Pergunta 1', word: 'APRENDER' },
        { clue: 'Exemplo de Pergunta 2', word: 'ESTUDO' },
        { clue: 'Exemplo de Pergunta 3', word: 'CONHECIMENTO' }
      ];
      setAvailableWords(sample);
      setSelectedWords(sample);
      setEditableText('Responda às perguntas e encontre as respostas na grade!');
      setStep(2);
    }
  };

  // Função principal de geração conforme o modo selecionado
  const handleStartWordsearch = async () => {
    if (isEditSession) {
      setStep(1);
      return;
    }

    const countToGen = Number(itemCount) || 10;
    const easyP = Math.round((countToGen * (difficultyDist?.easy || 40)) / 100);
    const medP = Math.round((countToGen * (difficultyDist?.medium || 40)) / 100);
    const hardP = Math.max(0, countToGen - easyP - medP);

    // 1. MODO MATEMÁTICA (OPERAÇÕES ARITMÉTICAS BÁSICAS)
    if (gameModeType === 'math' && mathSubtopic === 'operacoes') {
      if (mathOperations.length === 0) {
        onError('Selecione pelo menos uma operação matemática');
        return;
      }
      setStep('LOADING');
      setIsLoading(true);
      setTimeout(() => {
        const problems = generateMathProblems(countToGen * 2, mathMaxOrder, mathOperations, mathMultMaxOrder, mathDivMaxOrder);
        const mappedWords = problems.map(p => ({ 
            word: mathAnswerFormat === 'numeric' 
                ? p.problem.replace(' ?', p.answer).replace(/\s+/g, '') // e.g. "2+2=4"
                : String(p.answer), 
            clue: p.problem 
        }));
        setAvailableWords(mappedWords);
        setSelectedWords(mappedWords.slice(0, Math.min(countToGen, maxSelectableWords, mappedWords.length)));
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
          subtopicText = `Crie ${countToGen} problemas e equações do 1º grau (ex: 2x + 4 = 10 ➔ x = ?).`;
        } else if (mathSubtopic === 'equacoes2') {
          subtopicText = `Crie ${countToGen} perguntas e desafios sobre Equações do 2º Grau e Fórmula de Bhaskara (ex: calcular valor do Delta Δ, raízes x1/x2 ou coeficientes).`;
        } else if (mathSubtopic === 'decimais') {
          subtopicText = `Crie ${countToGen} desafios e problemas sobre Números Decimais, Frações e Porcentagens (ex: 0,25 + 0,75 = ? ou 50% de 200).`;
        } else {
          subtopicText = `Crie ${countToGen} desafios matemáticos pedagógicos sobre o tema "${topicInput || topic || 'Matemática'}".`;
        }

        const prompt = `Você é um professor de matemática especialista. ${subtopicText}
Nível/Ano Escolar dos alunos: ${gradeLevel}.
${formatGuide}
${lessonDetailsInput || lessonDetails ? `Dica do plano de aula / Contexto: "${lessonDetailsInput || lessonDetails}"` : ''}

Distribuição de dificuldade pedagógica:
- Fácil (~${easyP} desafios): operações diretas e números menores.
- Médio (~${medP} desafios): problemas com raciocínio intermediário.
- Difícil (~${hardP} desafios): desafios que exigem raciocínio crítico ou múltiplos passos.

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
          setSelectedWords(mapped.slice(0, Math.min(countToGen, maxSelectableWords, mapped.length)));
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
      if (!topicInput && !topic) {
        onError('Informe um tema');
        return;
      }

      setStep('LOADING');
      setIsLoading(true);

      try {
        const safeTopic = (topicInput || topic || '').slice(0, 80);
        const safeDetails = (lessonDetailsInput || lessonDetails || '').slice(0, 200);

        const prompt = `Você é um professor experiente e criativo. Crie EXATAMENTE ${countToGen} perguntas pedagógicas inteligentes, claras e educativas com respostas diretas sobre o tema "${safeTopic}".
Nível/Ano Escolar dos alunos: ${gradeLevel}.
${safeDetails ? `Contexto pedagógico & delimitação: "${safeDetails}"` : ''}

Distribuição de dificuldade pedagógica das perguntas:
- Fácil (~${easyP} perguntas): perguntas introdutórias com respostas conhecidas e diretas.
- Médio (~${medP} perguntas): conceitos essenciais do currículo escolar.
- Difícil (~${hardP} perguntas): perguntas instigantes, raciocínio dedutivo ou termos técnicos.

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
          setSelectedWords(mapped.slice(0, Math.min(countToGen, maxSelectableWords, mapped.length)));
          setEditableText(`Responda às perguntas e encontre as respostas no caça-palavras sobre ${topicInput || topic}!`);
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
    if (!topicInput && !topic) {
      onError('Informe um tema');
      return;
    }

    setStep('LOADING');
    setIsLoading(true);

    try {
      const safeTopic = (topicInput || topic || '').slice(0, 80);
      const safeDetails = (lessonDetailsInput || lessonDetails || '').slice(0, 200);

      const prompt = `Escreva um texto educativo SUPER DIVERTIDO, envolvente e pedagógico sobre "${safeTopic}".
Nível/Ano Escolar dos alunos: ${gradeLevel}.
${safeDetails ? `Contexto pedagógico obrigatório: "${safeDetails}"` : ''}

REGRAS:
- Escreva 3 parágrafos curtos com linguagem cativante.
- O texto DEVE conter vocabulário balanceado (~${easyP} termos simples, ~${medP} intermediários e ~${hardP} enriquecedores) adequados ao ${gradeLevel}.
- O texto DEVE incorporar o contexto acima de forma muito clara.
- Destaque termos importantes para as crianças encontrarem depois no caça-palavras.
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
    const words = extractWords(editableText, 30);
    setAvailableWords(words);
    const countToGen = Number(itemCount) || 10;
    setSelectedWords(words.slice(0, Math.min(countToGen, maxSelectableWords, words.length)));
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
      const chosenTopic = topicInput || topic || 'CAÇA-PALAVRAS';
      const title = chosenTopic.toUpperCase();

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
        topic: chosenTopic,
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
      size="xl"
      footer={footer}
    >
      <div className="space-y-6">

        {/* INTRO: Escolha do Modo Universal */}
        {step === 'INTRO' && (
          <div className="w-full space-y-6 text-left">
            {/* Cabeçalho Compacto & Elegante */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-slate-200/80 p-4 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                  ✨
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Como você quer montar o jogo?</h3>
                  <p className="text-xs text-slate-500 font-medium">Escolha a dinâmica pedagógica do seu caça-palavras</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-bold text-slate-600 bg-white/90 px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
                  Passo 1 de 2 • Modo de Criação
                </span>
              </div>
            </div>

            {/* Seletor de Modo Universal (3 Grandes Cards Elegantes e Compactos) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full">
              {/* Modo 1: História / Texto */}
              <div 
                onClick={() => setGameModeType('text')}
                className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex items-start gap-3.5 border-2 ${
                  gameModeType === 'text' 
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-orange-500 shadow-md ring-2 ring-orange-400/20' 
                    : 'bg-white border-slate-200/80 hover:border-orange-300 hover:bg-orange-50/20'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  gameModeType === 'text' ? 'bg-orange-500 text-white shadow-xs' : 'bg-orange-100 text-orange-600'
                }`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-black text-sm ${gameModeType === 'text' ? 'text-orange-950' : 'text-slate-800'}`}>
                      História / Texto
                    </h4>
                    {gameModeType === 'text' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
                    )}
                  </div>
                  <p className={`text-[11px] font-medium leading-snug mt-1 ${gameModeType === 'text' ? 'text-orange-900/80' : 'text-slate-500'}`}>
                    O aluno lê uma historinha temática e encontra as palavras-chave no caça-palavras.
                  </p>
                </div>
              </div>

              {/* Modo 2: Perguntas / Pistas */}
              <div 
                onClick={() => setGameModeType('clues')}
                className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex items-start gap-3.5 border-2 ${
                  gameModeType === 'clues' 
                    ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-500 shadow-md ring-2 ring-indigo-400/20' 
                    : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  gameModeType === 'clues' ? 'bg-indigo-500 text-white shadow-xs' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <Target className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-black text-sm ${gameModeType === 'clues' ? 'text-indigo-950' : 'text-slate-800'}`}>
                      Perguntas & Pistas
                    </h4>
                    {gameModeType === 'clues' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
                    )}
                  </div>
                  <p className={`text-[11px] font-medium leading-snug mt-1 ${gameModeType === 'clues' ? 'text-indigo-900/80' : 'text-slate-500'}`}>
                    O aluno lê perguntas ou enigmas e procura as respostas escondidas na grade.
                  </p>
                </div>
              </div>

              {/* Modo 3: Desafios Math */}
              <div 
                onClick={() => setGameModeType('math')}
                className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex items-start gap-3.5 border-2 ${
                  gameModeType === 'math' 
                    ? 'bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-500 shadow-md ring-2 ring-purple-400/20' 
                    : 'bg-white border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/20'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  gameModeType === 'math' ? 'bg-purple-500 text-white shadow-xs' : 'bg-purple-100 text-purple-600'
                }`}>
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-black text-sm ${gameModeType === 'math' ? 'text-purple-950' : 'text-slate-800'}`}>
                      Desafios Matemáticos
                    </h4>
                    {gameModeType === 'math' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
                    )}
                  </div>
                  <p className={`text-[11px] font-medium leading-snug mt-1 ${gameModeType === 'math' ? 'text-purple-900/80' : 'text-slate-500'}`}>
                    O aluno resolve contas ou equações e procura o resultado na grade de números ou palavras.
                  </p>
                </div>
              </div>
            </div>

            {/* Opções Específicas do Modo Matemática */}
            {gameModeType === 'math' && (
              <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50/50 p-4 rounded-2xl border border-purple-200/90 shadow-2xs space-y-3.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tópico de Matemática */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-purple-900 uppercase tracking-wider block">
                      Tópico Matemático
                    </label>
                    <select
                      value={mathSubtopic}
                      onChange={(e) => setMathSubtopic(e.target.value)}
                      className="w-full bg-white border border-purple-300 rounded-xl p-2.5 text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
                    >
                      <option value="equacoes1">Equações do 1º Grau (ex: 2x + 4 = 10 ➔ x = ?)</option>
                      <option value="equacoes2">Equações do 2º Grau & Bhaskara (Delta, raízes)</option>
                      <option value="decimais">Números Decimais, Frações & Porcentagens (ex: 0,25 + 0,75)</option>
                      <option value="operacoes">Operações Numéricas Básicas (+, -, ×, ÷)</option>
                      <option value="custom_ai">Outro Tópico / Gerar via IA sobre "{topicInput || topic || 'Matemática'}"</option>
                    </select>
                  </div>

                  {/* Formato das Respostas */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-purple-900 uppercase tracking-wider block">
                      Formato das Respostas no Caça-Palavras
                    </label>
                    <div className="flex bg-white p-1 rounded-xl border border-purple-300 gap-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setMathAnswerFormat('text_words')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                          mathAnswerFormat === 'text_words' 
                            ? 'bg-purple-600 text-white shadow-xs font-black' 
                            : 'text-purple-800 hover:bg-purple-50'
                        }`}
                      >
                        ✍️ Por Extenso (Letras)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMathAnswerFormat('numeric')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                          mathAnswerFormat === 'numeric' 
                            ? 'bg-purple-600 text-white shadow-xs font-black' 
                            : 'text-purple-800 hover:bg-purple-50'
                        }`}
                      >
                        🔢 Dígitos (0-9)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Operações se operacoes básicas */}
                {mathSubtopic === 'operacoes' && (
                  <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs font-bold text-purple-900">Operações incluídas:</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: '+', label: '+ Adição' },
                        { id: '-', label: '− Subtração' },
                        { id: '*', label: '× Multiplicação' },
                        { id: '/', label: '÷ Divisão' }
                      ].map(op => {
                        const active = mathOperations.includes(op.id);
                        return (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() => {
                              if (active) setMathOperations(mathOperations.filter(o => o !== op.id));
                              else setMathOperations([...mathOperations, op.id]);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                              active
                                ? 'bg-purple-600 text-white border-purple-700 shadow-2xs font-black'
                                : 'bg-white border-purple-200 text-purple-800 hover:bg-purple-50'
                            }`}
                          >
                            {op.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PAINEL GLOBAL DE IA DRÁCKER */}
            <div className="w-full">
              <GlobalAIGeneratorPanel
                itemTypeLabel={
                  gameModeType === 'clues' 
                    ? 'perguntas e desafios' 
                    : gameModeType === 'math' 
                      ? 'desafios de matemática' 
                      : 'caça-palavras'
                }
                topic={topicInput}
                onTopicChange={setTopicInput}
                context={lessonDetailsInput}
                onContextChange={setLessonDetailsInput}
                gradeLevel={gradeLevel}
                onGradeLevelChange={setGradeLevel}
                itemCount={itemCount}
                onItemCountChange={setItemCount}
                itemCountOptions={[6, 8, 10, 12, 15]}
                difficultyDist={difficultyDist}
                onDifficultyDistChange={setDifficultyDist}
                onGenerate={handleStartWordsearch}
                isGenerating={isLoading}
                collapsible={true}
                defaultExpanded={true}
              />
            </div>

            {/* Opção Manual / Sem IA */}
            <div className="pt-1 flex justify-center">
              <button
                type="button"
                onClick={handleManualMode}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>✏️ Prefiro Montar Manualmente (Sem Inteligência Artificial)</span>
              </button>
            </div>
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
