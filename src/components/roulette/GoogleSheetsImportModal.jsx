import React, { useState, useCallback } from 'react';
import {
    Link, Search, ChevronRight, ArrowLeft,
    AlertCircle, Loader2, CheckCircle,
    Image as ImageIcon, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { extractSheetInfo, fetchSheetQuestions } from '../../services/googleSheetsService';

const DIFFICULTY_STYLE = {
    'Fácil':   { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'Média':   { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
    'Difícil': { bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500'     },
};

const ERROR_MESSAGES = {
    PLANILHA_PRIVADA: {
        title: 'Planilha privada 🔒',
        desc: 'Mude o acesso para "Qualquer pessoa com o link pode visualizar" no Google Sheets e tente novamente.',
    },
    ABA_NAO_ENCONTRADA: {
        title: 'Aba não encontrada 📂',
        desc: 'Verifique se o nome da aba está correto (atenção a letras maiúsculas e acentos).',
    },
};

function TutorialSection() {
    const [open, setOpen] = useState(false);
    return (
        <div className="border border-sky-200 rounded-xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-sky-50 hover:bg-sky-100 transition-colors text-sky-800"
            >
                <span className="flex items-center gap-2 text-xs font-bold">
                    <Info className="w-4 h-4 text-sky-600" />
                    Como preparar sua planilha?
                </span>
                {open ? <ChevronUp className="w-4 h-4 text-sky-500" /> : <ChevronDown className="w-4 h-4 text-sky-500" />}
            </button>
            {open && (
                <div className="bg-white px-4 py-3 text-xs text-slate-700 space-y-3">
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                        {['A — Pergunta ✅', 'B — Resposta ✅', 'C — Imagem 🖼', 'D — Dificuldade 🎯'].map(h => (
                            <div key={h} className="bg-slate-100 rounded p-1 leading-tight">{h}</div>
                        ))}
                        <div className="bg-white border rounded p-1 text-slate-600">Qual é a capital do Brasil?</div>
                        <div className="bg-white border rounded p-1 text-slate-600">Brasília</div>
                        <div className="bg-white border rounded p-1 text-slate-400 text-[9px]">https://drive…</div>
                        <div className="bg-white border rounded p-1 text-slate-600">Fácil</div>
                    </div>
                    <ol className="space-y-1.5 list-none">
                        {[
                            'Crie as colunas na ordem acima. A linha 1 é o cabeçalho.',
                            'Para imagem do Google Drive: clique direito na imagem → "Compartilhar" → copie o link.',
                            'Na planilha: "Compartilhar" → Acesso geral → "Qualquer pessoa com o link" → Visualizador.',
                            'Cole o link da planilha (ou da aba específica, incluindo o #gid= da URL) aqui.',
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
 *
 * Props:
 *   isOpen        — boolean
 *   onClose       — () => void
 *   mode          — 'import' (adiciona a atividade existente) | 'create' (cria nova aba de Roleta)
 *   onImport      — (questions: Question[]) => void        (usado em mode='import')
 *   onCreateNew   — (questions: Question[], label: string) => void  (usado em mode='create')
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
    const [sheetNameInput, setSheetNameInput] = useState('');
    const [sheetId, setSheetId] = useState(null);
    const [detectedGid, setDetectedGid] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [error, setError] = useState(null); // { title, desc } | null
    const [sheetLabel, setSheetLabel] = useState('');

    // ── helpers ──────────────────────────────────────────────────────────────
    const reset = useCallback(() => {
        setStep('url');
        setUrlInput('');
        setSheetNameInput('');
        setSheetId(null);
        setDetectedGid(null);
        setQuestions([]);
        setSelectedIds(new Set());
        setError(null);
        setSheetLabel('');
    }, []);

    const handleClose = () => { reset(); onClose(); };

    const doFetch = useCallback(async (sid, opts, label) => {
        setStep('loading');
        setError(null);
        try {
            const result = await fetchSheetQuestions(sid, opts);
            if (result.length === 0) {
                setError({
                    title: 'Nenhuma questão encontrada 📭',
                    desc: 'A aba existe mas não tem linhas com perguntas. Verifique se a coluna A está preenchida.',
                });
                setStep('error');
                return;
            }
            setQuestions(result);
            setSelectedIds(new Set(result.map(q => q.id)));
            setSheetLabel(label);
            setStep('preview');
        } catch (err) {
            const known = ERROR_MESSAGES[err.message];
            setError(known || {
                title: 'Erro ao buscar questões ⚠️',
                desc: err.message || 'Tente novamente.',
            });
            setStep('error');
        }
    }, []);

    // ── Step 1: URL ──────────────────────────────────────────────────────────
    const handleUrlNext = () => {
        const { sheetId: sid, gid } = extractSheetInfo(urlInput.trim());
        if (!sid) {
            setError({
                title: 'Link inválido 🔗',
                desc: 'Cole o link completo do Google Sheets (deve conter /spreadsheets/d/).',
            });
            setStep('error');
            return;
        }
        setSheetId(sid);
        setDetectedGid(gid);
        setError(null);

        if (gid) {
            // GID detectado na URL — busca direto, sem perguntar nome da aba
            doFetch(sid, { gid }, `Aba (gid=${gid})`);
        } else {
            setStep('sheet');
        }
    };

    // ── Step 2: Nome da aba ──────────────────────────────────────────────────
    const handleSheetFetch = () => {
        const name = sheetNameInput.trim();
        doFetch(sheetId, name ? { sheetName: name } : {}, name || 'Primeira aba');
    };

    // ── Step 3: Preview — seleção de questões ────────────────────────────────
    const toggleAll = () => {
        if (selectedIds.size === questions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(questions.map(q => q.id)));
        }
    };

    const toggleOne = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleConfirm = () => {
        const selected = questions.filter(q => selectedIds.has(q.id));
        if (selected.length === 0) return;

        if (mode === 'create' && onCreateNew) {
            onCreateNew(selected, sheetLabel);
        } else if (onImport) {
            onImport(selected);
        }
        handleClose();
    };

    const confirmLabel = mode === 'create'
        ? `Criar Roleta com ${selectedIds.size} questão(ões) ✓`
        : `Importar ${selectedIds.size} questão(ões) ✓`;

    if (!isOpen) return null;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={mode === 'create' ? '📊 Nova Roleta via Google Sheets' : '📊 Importar do Google Sheets'}
            maxWidth="max-w-3xl"
        >
            <div className="space-y-4">

                {/* ── STEP INDICATOR ────────────────────────────────────────── */}
                <div className="flex items-center gap-1 text-xs font-bold">
                    {[
                        { key: 'url',     label: '1. Link' },
                        { key: 'sheet',   label: '2. Aba' },
                        { key: 'preview', label: '3. Questões' },
                    ].map(({ key, label }, idx) => {
                        const order = ['url', 'sheet', 'loading', 'preview', 'error'];
                        const currentIdx = order.indexOf(step);
                        const stepIdx = order.indexOf(key);
                        const isDone = currentIdx > stepIdx && step !== 'error';
                        const isCurrent = key === 'preview'
                            ? (step === 'loading' || step === 'preview')
                            : currentIdx === stepIdx;
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

                {/* ── STEP 1: URL ───────────────────────────────────────────── */}
                {step === 'url' && (
                    <div className="space-y-4">
                        <TutorialSection />
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                Link da planilha do Google Sheets
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="url"
                                        value={urlInput}
                                        onChange={e => setUrlInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleUrlNext()}
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUrlNext}
                                    disabled={!urlInput.trim()}
                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                                >
                                    Próximo <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5">
                                💡 Cole a URL com <code className="bg-slate-100 px-1 rounded text-[10px]">#gid=</code> para detectar a aba automaticamente.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: NOME DA ABA ───────────────────────────────────── */}
                {step === 'sheet' && (
                    <div className="space-y-4">
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-sm text-sky-800 flex items-start gap-2">
                            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                            <div>
                                <strong>Planilha encontrada!</strong> Agora escolha qual aba buscar.<br />
                                <span className="text-xs text-sky-700">
                                    O nome da aba fica na parte inferior da planilha. Deixe em branco para usar a primeira aba.
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                Nome da aba <span className="text-slate-400 font-normal">(opcional)</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={sheetNameInput}
                                    onChange={e => setSheetNameInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSheetFetch()}
                                    placeholder='Ex: "Matemática 8°A", "Biologia", "Bimestre 2"'
                                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={handleSheetFetch}
                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                                >
                                    <Search className="w-4 h-4" />
                                    Buscar
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setStep('url')}
                            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                            <ArrowLeft className="w-3 h-3" /> Trocar planilha
                        </button>
                    </div>
                )}

                {/* ── LOADING ───────────────────────────────────────────────── */}
                {step === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                <span className="text-2xl">📊</span>
                            </div>
                            <Loader2 className="absolute -bottom-1 -right-1 w-5 h-5 text-indigo-600 animate-spin" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-700">Buscando questões...</p>
                            <p className="text-xs text-slate-400 mt-1">Conectando ao Google Sheets</p>
                        </div>
                    </div>
                )}

                {/* ── ERROR ─────────────────────────────────────────────────── */}
                {step === 'error' && error && (
                    <div className="space-y-4">
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-2">
                            <h4 className="font-black text-rose-700 text-base">{error.title}</h4>
                            <p className="text-sm text-rose-600">{error.desc}</p>
                        </div>
                        <div className="flex gap-2 justify-center flex-wrap">
                            <button
                                type="button"
                                onClick={() => { setError(null); setStep('url'); }}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" /> Trocar planilha
                            </button>
                            {detectedGid === null && sheetId && (
                                <button
                                    type="button"
                                    onClick={() => { setError(null); setStep('sheet'); }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    Tentar outra aba
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── PREVIEW ───────────────────────────────────────────────── */}
                {step === 'preview' && (
                    <div className="space-y-3">
                        {/* Cabeçalho do preview */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm font-bold text-slate-700">
                                    {questions.length} questão(ões) em{' '}
                                    <em className="text-indigo-600 not-italic font-black">"{sheetLabel}"</em>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={toggleAll}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                                >
                                    {selectedIds.size === questions.length ? 'Desmarcar tudo' : 'Marcar tudo'}
                                </button>
                                <span className="text-xs text-slate-400">{selectedIds.size} selecionada(s)</span>
                            </div>
                        </div>

                        {/* Tabela de preview */}
                        <div className="max-h-[45vh] overflow-y-auto custom-scrollbar border border-slate-200 rounded-2xl divide-y divide-slate-100">
                            {questions.map((q, idx) => {
                                const diff = DIFFICULTY_STYLE[q.difficulty] ?? DIFFICULTY_STYLE['Média'];
                                const checked = selectedIds.has(q.id);
                                return (
                                    <label
                                        key={q.id}
                                        className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                                            checked ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'bg-white hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleOne(q.id)}
                                            className="mt-1 shrink-0 accent-indigo-600"
                                        />
                                        <span className="text-[10px] font-black text-slate-400 shrink-0 mt-1 w-5 text-right">
                                            {idx + 1}
                                        </span>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-sm font-semibold text-slate-800 leading-snug">{q.question}</p>
                                            {q.answer && (
                                                <p className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 inline-block max-w-full truncate">
                                                    ✓ {q.answer}
                                                </p>
                                            )}
                                        </div>

                                        {/* Miniatura da imagem */}
                                        {q.imageUrl ? (
                                            <div className="w-12 h-12 shrink-0 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
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
                                            <div className="w-12 h-12 shrink-0 rounded-lg border border-dashed border-slate-200 flex items-center justify-center">
                                                <ImageIcon className="w-4 h-4 text-slate-300" />
                                            </div>
                                        )}

                                        {/* Dificuldade */}
                                        <span className={`shrink-0 text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 ${diff.bg} ${diff.text}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                                            {q.difficulty}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        {/* Link para voltar e buscar outra aba */}
                        <button
                            type="button"
                            onClick={() => setStep(detectedGid ? 'url' : 'sheet')}
                            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                            <ArrowLeft className="w-3 h-3" /> Buscar outra aba
                        </button>
                    </div>
                )}

                {/* ── RODAPÉ ────────────────────────────────────────────────── */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    {step === 'preview' && (
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={selectedIds.size === 0}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                        >
                            <CheckCircle className="w-4 h-4" />
                            {confirmLabel}
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
