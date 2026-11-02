import React, { useState, useCallback, useRef } from 'react';
import {
    Link, Search, ChevronRight, ArrowLeft,
    AlertCircle, Loader2, CheckCircle,
    Image as ImageIcon, ChevronDown, ChevronUp, Info,
    UploadCloud, FileSpreadsheet, Sparkles, Layers,
    Check, ArrowRight
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { 
    extractSheetInfo, 
    fetchSpreadsheetWorkbook, 
    parseXlsxBuffer 
} from '../../services/googleSheetsService';

const DIFFICULTY_STYLE = {
    'Fácil':   { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'Média':   { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
    'Difícil': { bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500'     },
};

const ERROR_MESSAGES = {
    PLANILHA_PRIVADA: {
        title: 'Planilha privada ou sem acesso 🔒',
        desc: 'Verifique se o link está como "Qualquer pessoa com o link pode visualizar" no Google Drive/Sheets. Dica: você também pode enviar o arquivo .xlsx diretamente pelo computador!',
    },
    ABA_NAO_ENCONTRADA: {
        title: 'Aba não encontrada 📂',
        desc: 'Não encontramos dados legíveis nessa aba. Tente escolher outra aba da lista.',
    },
};

function TutorialSection() {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-sky-200 rounded-xl overflow-hidden shadow-2xs">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-sky-50 hover:bg-sky-100 transition-colors text-sky-800"
            >
                <span className="flex items-center gap-2 text-xs font-bold">
                    <Info className="w-4 h-4 text-sky-600" />
                    Como preparar sua planilha ou link do Google Drive
                </span>
                {open ? <ChevronUp className="w-4 h-4 text-sky-500" /> : <ChevronDown className="w-4 h-4 text-sky-500" />}
            </button>
            {open && (
                <div className="bg-white px-4 py-3 text-xs text-slate-700 space-y-3">
                    <div className="space-y-1.5">
                        <p className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Formato de Avaliação/Tarefas (Matific, CMSP, LMS):
                        </p>
                        <p className="text-[11px] text-slate-600">
                            Reconhece automaticamente as colunas: <strong>Questão</strong>, <strong>Enunciado da Questão</strong>, <strong>Imagem do Enunciado</strong>, <strong>Alternativas</strong> e <strong>Imagem Alt. A / B / C / D</strong>. A coluna de acerto da turma é ignorada automaticamente!
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <p className="font-bold text-emerald-900 text-xs">
                            📋 Formato Clássico:
                        </p>
                        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                            {['A — Pergunta ✅', 'B — Resposta ✅', 'C — Imagem 🖼', 'D — Dificuldade 🎯'].map(h => (
                                <div key={h} className="bg-slate-100 rounded p-1 leading-tight">{h}</div>
                            ))}
                        </div>
                    </div>

                    <ol className="space-y-1.5 list-none pt-1 border-t border-slate-100">
                        {[
                            'Google Drive/Sheets: Compartilhar → "Qualquer pessoa com o link pode visualizar".',
                            'Cole o link completo no campo de URL.',
                            'As abas da planilha serão listadas automaticamente na tela seguinte para você escolher.',
                            'Se preferir, arraste o arquivo .xlsx do seu computador direto para o campo indicado!',
                        ].map((step, i) => (
                            <li key={i} className="flex gap-2 items-start">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-black text-[10px]">
                                    {i + 1}
                                </span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}

/**
 * GoogleSheetsImportModal
 */
export const GoogleSheetsImportModal = ({
    isOpen,
    onClose,
    mode = 'import',
    onImport,
    onCreateNew,
}) => {
    // ── estado ──────────────────────────────────────────────────────────────
    const [step, setStep] = useState('url'); // 'url' | 'sheet' | 'loading' | 'preview' | 'error'
    const [urlInput, setUrlInput] = useState('');
    const [sheetId, setSheetId] = useState(null);
    const [detectedGid, setDetectedGid] = useState(null);
    
    // Dados do workbook carregado
    const [workbookData, setWorkbookData] = useState(null); // { sheetNames: [], sheets: {}, defaultSheetName: '' }
    const [selectedSheetNames, setSelectedSheetNames] = useState(new Set());
    const [tabFilter, setTabFilter] = useState('');
    const [activePreviewTabFilter, setActivePreviewTabFilter] = useState('ALL');
    
    // Questões da aba selecionada
    const [questions, setQuestions] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [sheetLabel, setSheetLabel] = useState('');
    const [error, setError] = useState(null); // { title, desc } | null
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    // ── helpers ──────────────────────────────────────────────────────────────
    const reset = useCallback(() => {
        setStep('url');
        setUrlInput('');
        setSheetId(null);
        setDetectedGid(null);
        setWorkbookData(null);
        setSelectedSheetNames(new Set());
        setTabFilter('');
        setActivePreviewTabFilter('ALL');
        setQuestions([]);
        setSelectedIds(new Set());
        setError(null);
        setSheetLabel('');
        setIsDragging(false);
    }, []);

    const handleClose = () => { reset(); onClose(); };

    // Alternar seleção de aba (multi-seleção)
    const toggleSheetSelection = useCallback((tabName) => {
        setSelectedSheetNames(prev => {
            const next = new Set(prev);
            if (next.has(tabName)) {
                next.delete(tabName);
            } else {
                next.add(tabName);
            }
            return next;
        });
    }, []);

    const selectAllTabsWithQuestions = useCallback(() => {
        if (!workbookData) return;
        const withQuestions = workbookData.sheetNames.filter(name => (workbookData.sheets[name]?.count || 0) > 0);
        setSelectedSheetNames(new Set(withQuestions.length > 0 ? withQuestions : workbookData.sheetNames));
    }, [workbookData]);

    const clearSheetSelection = useCallback(() => {
        setSelectedSheetNames(new Set());
    }, []);

    // Avançar para preview carregando todas as abas marcadas
    const handleProceedToPreview = useCallback((overrideTabs = null) => {
        const targetTabs = Array.from(overrideTabs || selectedSheetNames);
        if (!workbookData || targetTabs.length === 0) return;

        const combinedQuestions = [];
        const taskTitles = [];

        targetTabs.forEach(tabName => {
            const sheet = workbookData.sheets[tabName];
            if (!sheet) return;
            if (sheet.taskTitle && !taskTitles.includes(sheet.taskTitle)) {
                taskTitles.push(sheet.taskTitle);
            }
            const qs = (sheet.questions || []).map((q, idx) => ({
                ...q,
                id: `tab_${tabName}_${q.id || idx}`,
                tabOrigin: tabName
            }));
            combinedQuestions.push(...qs);
        });

        setQuestions(combinedQuestions);
        setSelectedIds(new Set(combinedQuestions.map(q => q.id)));

        if (targetTabs.length === 1) {
            const singleSheet = workbookData.sheets[targetTabs[0]];
            setSheetLabel(singleSheet?.taskTitle || targetTabs[0]);
        } else {
            setSheetLabel(`Atividade Combinada (${targetTabs.length} abas — ${combinedQuestions.length} questões)`);
        }

        setActivePreviewTabFilter('ALL');
        setStep('preview');
    }, [workbookData, selectedSheetNames]);

    // Abrir somente uma aba diretamente
    const handleOpenSingleSheetDirectly = useCallback((tabName) => {
        const singleSet = new Set([tabName]);
        setSelectedSheetNames(singleSet);
        handleProceedToPreview(singleSet);
    }, [handleProceedToPreview]);

    // Processar dados do workbook
    const handleWorkbookLoaded = useCallback((wbData) => {
        setWorkbookData(wbData);
        if (!wbData.sheetNames || wbData.sheetNames.length === 0) {
            setError({
                title: 'Nenhuma aba encontrada 📭',
                desc: 'A planilha foi carregada, mas não contém abas válidas.',
            });
            setStep('error');
            return;
        }

        // Pré-seleciona a aba padrão
        const defaultTab = wbData.defaultSheetName || wbData.sheetNames[0];
        setSelectedSheetNames(new Set(defaultTab ? [defaultTab] : []));
        setStep('sheet');
    }, []);

    // ── Carregar do link (Google Sheets / Google Drive) ──────────────────────
    const handleUrlNext = async () => {
        const { sheetId: sid, gid, isDriveFile } = extractSheetInfo(urlInput.trim());
        if (!sid) {
            setError({
                title: 'Link não reconhecido 🔗',
                desc: 'Cole o link completo do Google Sheets ou link de arquivo do Google Drive.',
            });
            setStep('error');
            return;
        }
        setSheetId(sid);
        setDetectedGid(gid);
        setStep('loading');
        setError(null);

        try {
            const wbData = await fetchSpreadsheetWorkbook(sid, { gid, isDriveFile });
            handleWorkbookLoaded(wbData);
        } catch (err) {
            const known = ERROR_MESSAGES[err.message];
            setError(known || {
                title: 'Erro ao buscar planilha ⚠️',
                desc: err.message || 'Verifique se o link está correto e público.',
            });
            setStep('error');
        }
    };

    // ── Leitura de arquivo local (.xlsx, .csv) ──────────────────────────────
    const handleLocalFile = async (file) => {
        if (!file) return;
        setStep('loading');
        setError(null);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const wbData = parseXlsxBuffer(arrayBuffer);
            handleWorkbookLoaded(wbData);
        } catch (err) {
            setError({
                title: 'Erro ao ler arquivo 📄',
                desc: err.message || 'Não foi possível ler as colunas da planilha. Verifique o formato do arquivo.',
            });
            setStep('error');
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleLocalFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleLocalFile(file);
    };

    const displayedQuestions = activePreviewTabFilter === 'ALL'
        ? questions
        : questions.filter(q => q.tabOrigin === activePreviewTabFilter);

    const totalSelectedQuestionsCount = Array.from(selectedSheetNames).reduce((acc, tab) => {
        return acc + (workbookData?.sheets[tab]?.count || 0);
    }, 0);

    // ── Preview: seleção de questões ────────────────────────────────────────
    const toggleAll = () => {
        const allChecked = displayedQuestions.length > 0 && displayedQuestions.every(q => selectedIds.has(q.id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allChecked) {
                displayedQuestions.forEach(q => next.delete(q.id));
            } else {
                displayedQuestions.forEach(q => next.add(q.id));
            }
            return next;
        });
    };

    const toggleOne = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleConfirm = (actionType = mode) => {
        const selected = questions.filter(q => selectedIds.has(q.id));
        if (selected.length === 0) return;

        if (actionType === 'create' && onCreateNew) {
            onCreateNew(selected, sheetLabel);
        } else if (actionType === 'import' && onImport) {
            onImport(selected);
        }
        handleClose();
    };

    const confirmCreateLabel = `Nova Roleta (${selectedIds.size}) ✓`;
    const confirmImportLabel = `Inserir na Atual (${selectedIds.size}) ✓`;

    if (!isOpen) return null;

    // Filtrar abas pelo termo de busca
    const availableTabs = (workbookData?.sheetNames || []).filter(name => 
        name.toLowerCase().includes(tabFilter.toLowerCase())
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={mode === 'create' ? '📊 Nova Roleta via Planilha' : '📊 Importar Questões da Planilha'}
            maxWidth="max-w-3xl"
        >
            <div className="space-y-4">

                {/* ── STEP INDICATOR ────────────────────────────────────────── */}
                <div className="flex items-center gap-1 text-xs font-bold">
                    {[
                        { key: 'url',     label: '1. Link / Arquivo' },
                        { key: 'sheet',   label: '2. Escolher Aba' },
                        { key: 'preview', label: '3. Questões' },
                    ].map(({ key, label }, idx) => {
                        const order = ['url', 'sheet', 'loading', 'preview', 'error'];
                        const currentIdx = order.indexOf(step);
                        const stepIdx = order.indexOf(key);
                        const isDone = currentIdx > stepIdx && step !== 'error';
                        const isCurrent = key === 'preview'
                            ? (step === 'loading' || step === 'preview')
                            : (key === 'sheet' && step === 'sheet') || (key === 'url' && step === 'url');
                        return (
                            <React.Fragment key={key}>
                                {idx > 0 && <div className="flex-1 h-px bg-slate-200" />}
                                <span className={`px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${
                                    isDone    ? 'bg-emerald-100 text-emerald-700' :
                                    isCurrent ? 'bg-indigo-600 text-white' :
                                                'bg-slate-100 text-slate-400'
                                }`}>
                                    {isDone ? '✓ ' : ''}{label}
                                </span>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* ── STEP 1: URL OU UPLOAD ─────────────────────────────────── */}
                {step === 'url' && (
                    <div className="space-y-4">
                        <TutorialSection />

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                Link da Planilha do Google Sheets ou Google Drive
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="url"
                                        value={urlInput}
                                        onChange={e => setUrlInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleUrlNext()}
                                        placeholder="https://docs.google.com/spreadsheets/d/... ou drive.google.com/file/d/..."
                                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUrlNext}
                                    disabled={!urlInput.trim()}
                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
                                >
                                    Buscar <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Divisor "OU" */}
                        <div className="relative flex items-center justify-center my-3">
                            <div className="border-t border-slate-200 w-full" />
                            <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase tracking-widest absolute">
                                Ou envie o arquivo
                            </span>
                        </div>

                        {/* Área de Drag & Drop para arquivo Excel (.xlsx, .csv) */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                                isDragging 
                                    ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]' 
                                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-700">
                                    Arraste e solte o arquivo da planilha aqui
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Suporta arquivos <strong className="text-indigo-600">.xlsx</strong>, <strong className="text-indigo-600">.xls</strong> e <strong className="text-indigo-600">.csv</strong>
                                </p>
                            </div>
                            <span className="mt-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 shadow-2xs">
                                Selecionar do computador
                            </span>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: APRESENTAÇÃO E SELEÇÃO DE ABAS ───────────────── */}
                {step === 'sheet' && workbookData && (
                    <div className="space-y-4">
                        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-indigo-950">
                                        Planilha carregada! Selecione uma ou mais abas:
                                    </h3>
                                    <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
                                        Você pode marcar <strong>múltiplas abas</strong> para juntar todas as questões em uma única atividade!
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={selectAllTabsWithQuestions}
                                    className="text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                                >
                                    ✓ Marcar todas com questões
                                </button>
                                {selectedSheetNames.size > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearSheetSelection}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                                    >
                                        Desmarcar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Barra de busca de abas se houver mais de 3 */}
                        {workbookData.sheetNames.length > 3 && (
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={tabFilter}
                                    onChange={e => setTabFilter(e.target.value)}
                                    placeholder="Buscar aba por nome..."
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        )}

                        {/* Grade de Abas com Multi-seleção */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                            {availableTabs.map((name) => {
                                const sheet = workbookData.sheets[name];
                                const count = sheet?.count || 0;
                                const hasQuestions = count > 0;
                                const isSelected = selectedSheetNames.has(name);

                                return (
                                    <div
                                        key={name}
                                        onClick={() => toggleSheetSelection(name)}
                                        className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group select-none ${
                                            isSelected 
                                                ? 'border-indigo-600 bg-indigo-50/90 shadow-xs ring-2 ring-indigo-500/20' 
                                                : hasQuestions
                                                    ? 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 shadow-2xs'
                                                    : 'border-slate-100 bg-slate-50/70 opacity-75 hover:opacity-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Checkbox de seleção múltipla */}
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                                isSelected 
                                                    ? 'bg-indigo-600 text-white shadow-xs' 
                                                    : 'border-2 border-slate-300 bg-white group-hover:border-indigo-400'
                                            }`}>
                                                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-black text-slate-800 text-sm truncate leading-tight">
                                                    {name}
                                                </p>
                                                <p className="text-2xs mt-1">
                                                    {hasQuestions ? (
                                                        <span className={`font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                                                            isSelected 
                                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                                                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                                        }`}>
                                                            ✓ {count} questão(ões)
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 font-medium italic">
                                                            0 questões detectadas
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenSingleSheetDirectly(name);
                                                }}
                                                title="Abrir somente esta aba"
                                                className="text-2xs font-bold text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                            >
                                                Só esta →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Barra inferior de navegação do Step 2 */}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100 flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setStep('url')}
                                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1.5 cursor-pointer font-medium"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> Trocar link ou arquivo
                            </button>

                            <button
                                type="button"
                                disabled={selectedSheetNames.size === 0}
                                onClick={() => handleProceedToPreview()}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer ml-auto"
                            >
                                {selectedSheetNames.size === 0 ? (
                                    'Selecione ao menos 1 aba'
                                ) : selectedSheetNames.size === 1 ? (
                                    <>
                                        <span>Ver Questões de "{Array.from(selectedSheetNames)[0]}" ({totalSelectedQuestionsCount} questões)</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                ) : (
                                    <>
                                        <span>Ver Questões das {selectedSheetNames.size} Abas Selecionadas ({totalSelectedQuestionsCount} questões)</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── LOADING ───────────────────────────────────────────────── */}
                {step === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center shadow-xs">
                                <span className="text-2xl">📊</span>
                            </div>
                            <Loader2 className="absolute -bottom-1 -right-1 w-5 h-5 text-indigo-600 animate-spin" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-800 text-base">Carregando planilha...</p>
                            <p className="text-xs text-slate-500 mt-1">Lendo abas, enunciado, alternativas e imagens</p>
                        </div>
                    </div>
                )}

                {/* ── ERROR ─────────────────────────────────────────────────── */}
                {step === 'error' && error && (
                    <div className="space-y-4">
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-2">
                            <h4 className="font-black text-rose-700 text-base">{error.title}</h4>
                            <p className="text-sm text-rose-600 leading-relaxed">{error.desc}</p>
                        </div>
                        <div className="flex gap-2 justify-center flex-wrap">
                            <button
                                type="button"
                                onClick={() => { setError(null); setStep('url'); }}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" /> Tentar outro link ou arquivo
                            </button>
                            {workbookData && workbookData.sheetNames.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => { setError(null); setStep('sheet'); }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    Ver Lista de Abas
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── PREVIEW: QUESTÕES DAS ABAS ESCOLHIDAS ────────────────── */}
                {step === 'preview' && (
                    <div className="space-y-3">
                        {/* Barra de contexto da(s) aba(s) */}
                        <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-50 p-3 rounded-2xl border border-slate-200">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            {selectedSheetNames.size > 1 ? 'Abas Combinadas:' : 'Aba:'}
                                        </span>
                                        {Array.from(selectedSheetNames).map(tabName => (
                                            <span key={tabName} className="text-2xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                                {tabName}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-sm font-black text-slate-800 truncate mt-0.5">
                                        "{sheetLabel}"
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {workbookData?.sheetNames?.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setStep('sheet')}
                                        className="text-xs font-bold text-indigo-700 bg-indigo-100/70 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>Trocar Abas ({selectedSheetNames.size})</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={toggleAll}
                                    className="text-xs font-bold text-slate-600 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                                >
                                    {displayedQuestions.length > 0 && displayedQuestions.every(q => selectedIds.has(q.id)) ? 'Desmarcar' : 'Marcar tudo'}
                                </button>
                                <span className="text-xs text-slate-700 font-black bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                    {selectedIds.size} de {questions.length}
                                </span>
                            </div>
                        </div>

                        {/* Filtro rápido por aba quando houver múltiplas abas selecionadas */}
                        {selectedSheetNames.size > 1 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setActivePreviewTabFilter('ALL')}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                        activePreviewTabFilter === 'ALL'
                                            ? 'bg-indigo-600 text-white shadow-2xs'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Todas as Abas ({questions.length})
                                </button>
                                {Array.from(selectedSheetNames).map(tabName => {
                                    const count = questions.filter(q => q.tabOrigin === tabName).length;
                                    const isCurrent = activePreviewTabFilter === tabName;
                                    return (
                                        <button
                                            key={tabName}
                                            type="button"
                                            onClick={() => setActivePreviewTabFilter(tabName)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                                isCurrent
                                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {tabName} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Lista de Questões */}
                        <div className="max-h-[46vh] overflow-y-auto custom-scrollbar border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
                            {displayedQuestions.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 space-y-2">
                                    <p className="font-bold text-sm">Nenhuma questão encontrada nas abas selecionadas</p>
                                    <p className="text-xs">Verifique se as colunas estão preenchidas nesta aba ou escolha outras abas.</p>
                                    {workbookData?.sheetNames?.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setStep('sheet')}
                                            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                                        >
                                            Escolher outras abas
                                        </button>
                                    )}
                                </div>
                            ) : (
                                displayedQuestions.map((q, idx) => {
                                    const diff = DIFFICULTY_STYLE[q.difficulty] ?? DIFFICULTY_STYLE['Média'];
                                    const checked = selectedIds.has(q.id);
                                    const hasAltImages = q.options && q.options.some(o => o.imageUrl);

                                    return (
                                        <label
                                            key={q.id}
                                            className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors ${
                                                checked ? 'bg-indigo-50/40 hover:bg-indigo-50/70' : 'bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleOne(q.id)}
                                                className="mt-1.5 shrink-0 accent-indigo-600 w-4 h-4 cursor-pointer"
                                            />

                                            <span className="text-xs font-black text-indigo-600 shrink-0 mt-1 w-7 text-right">
                                                {q.questionNumber || `#${idx + 1}`}
                                            </span>

                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {selectedSheetNames.size > 1 && q.tabOrigin && (
                                                        <span className="text-3xs font-black bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-md">
                                                            📁 {q.tabOrigin}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-sm font-semibold text-slate-800 leading-snug">
                                                    {q.question}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    {q.isDiscursive ? (
                                                        <span className="text-2xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                                                            📝 Discursiva
                                                        </span>
                                                    ) : q.options && q.options.length > 0 ? (
                                                        <span className="text-2xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                                                            🎯 {q.options.length} Alternativas
                                                        </span>
                                                    ) : null}

                                                    {q.answer && (
                                                        <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate max-w-xs">
                                                            ✓ {q.answer}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Preview de Alternativas com Imagens se houver */}
                                                {hasAltImages && (
                                                    <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
                                                        <span className="text-3xs uppercase font-bold text-slate-400 shrink-0">Alts:</span>
                                                        {q.options.map((opt, oi) => (
                                                            <div key={oi} className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shrink-0 shadow-2xs">
                                                                <span className="w-4 h-4 rounded bg-indigo-600 text-white font-black text-[9px] flex items-center justify-center">
                                                                    {opt.letter}
                                                                </span>
                                                                {opt.imageUrl && (
                                                                    <img
                                                                        src={opt.imageUrl}
                                                                        alt=""
                                                                        className="w-6 h-6 object-cover rounded"
                                                                        onError={e => { e.target.style.display = 'none'; }}
                                                                    />
                                                                )}
                                                                {opt.text && <span className="text-[10px] text-slate-600 max-w-[60px] truncate">{opt.text}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Miniatura da imagem do enunciado */}
                                            {q.imageUrl ? (
                                                <div className="w-12 h-12 shrink-0 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shadow-2xs">
                                                    <img
                                                        src={q.imageUrl}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={e => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<span class="text-xl">🖼️</span>';
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 shrink-0 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-slate-300" title="Sem imagem no enunciado">
                                                    <ImageIcon className="w-4 h-4" />
                                                </div>
                                            )}

                                            <span className={`shrink-0 text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 ${diff.bg} ${diff.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                                                {q.difficulty}
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        {/* Botões de navegação */}
                        <div className="flex items-center justify-between pt-1">
                            <button
                                type="button"
                                onClick={() => setStep(workbookData?.sheetNames?.length > 1 ? 'sheet' : 'url')}
                                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer font-medium"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> {workbookData?.sheetNames?.length > 1 ? 'Voltar para lista de abas' : 'Trocar link / arquivo'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── RODAPÉ ────────────────────────────────────────────────── */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-sm"
                    >
                        Cancelar
                    </button>
                    {step === 'preview' && questions.length > 0 && (
                        <div className="flex items-center gap-2">
                            {onImport && (
                                <button
                                    type="button"
                                    onClick={() => handleConfirm('import')}
                                    disabled={selectedIds.size === 0}
                                    className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 disabled:opacity-40 font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer text-sm"
                                >
                                    {confirmImportLabel}
                                </button>
                            )}
                            {onCreateNew && (
                                <button
                                    type="button"
                                    onClick={() => handleConfirm('create')}
                                    disabled={selectedIds.size === 0}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer text-sm"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {confirmCreateLabel}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
