import React from 'react';
import { toDirectImageUrl, handleDriveImageError } from '../utils/urlUtils';

/**
 * QuizPrint – Layout de impressão/PDF do Quiz em cards estilizados.
 * Props:
 *   quizData         – { intro_text, questions: [{ statement, correct_answer, distractors, difficulty?, image_url? }] }
 *   title            – Título da atividade
 *   showAnswers      – Se true, destaca a alternativa correta
 *   printMode        – 'full' (cards com alternativas, padrão) | 'text-only' (sem alternativas, compacto)
 *   showDifficulty   – Se true, mostra badge de dificuldade em cada questão
 *   selectedIndexes  – Set ou Array de índices das questões selecionadas (undefined = todas)
 *   imageMaxHeight   – Altura máxima das imagens em px (padrão 160). 0 = automático (sem limite)
 */
export const QuizPrint = ({
    quizData,
    title,
    showAnswers = false,
    printMode = 'full',
    showDifficulty = true,
    selectedIndexes,
    imageMaxHeight = 160,
    questionRepeats,
    imageBgColor = 'transparent',
}) => {
    if (!quizData?.questions?.length) return null;

    const isTextOnly = printMode === 'text-only';
    const LETTERS = ['A', 'B', 'C', 'D', 'E'];

    // Resolve quais questões mostrar
    const selectedSet = selectedIndexes
        ? new Set(Array.from(selectedIndexes).map(Number))
        : null;

    // Questões filtradas com seu índice original preservado
    const filteredQuestions = quizData.questions
        .map((q, idx) => ({ q, originalIdx: idx }))
        .filter(({ originalIdx }) => !selectedSet || selectedSet.has(originalIdx));

    // Expande questões conforme o repeat count (padrão = 1)
    const visibleQuestions = filteredQuestions.flatMap(({ q, originalIdx }) => {
        const count = (questionRepeats instanceof Map
            ? (questionRepeats.get(originalIdx) ?? 1)
            : 1);
        return Array.from({ length: Math.max(1, count) }, (_, copyIdx) => ({
            q, originalIdx, copyIdx
        }));
    });

    const buildOptions = (q) =>
        [q.correct_answer, ...(q.distractors || [])].slice(0, 5);

    const difficultyMeta = {
        easy:   { label: 'Fácil',   cls: 'qp-diff--easy' },
        medium: { label: 'Médio',   cls: 'qp-diff--medium' },
        hard:   { label: 'Difícil', cls: 'qp-diff--hard' },
    };

    // Detecta se alguma questão visível tem imagem (para ajustar grid)
    const hasAnyImage = visibleQuestions.some(({ q }) => !!q.image_url);

    // Grid: se houver imagens, preservar layout de colunas mais amplo para que as figuras não encolham no modo sem alternativas
    const gridClass = hasAnyImage
        ? 'qp-questions--with-img'
        : isTextOnly
            ? 'qp-questions--text-only'
            : '';

    // Estilo inline para a imagem (respeita prop imageMaxHeight)
    const imgStyle = imageMaxHeight > 0
        ? { maxHeight: `${imageMaxHeight}px`, width: '100%', objectFit: 'contain', display: 'block' }
        : { width: '100%', objectFit: 'contain', display: 'block' };

    return (
        <div className="qp-wrap">

            {/* ===== CABEÇALHO ===== */}
            <div className="qp-header">
                <div className="qp-header-top">
                    <div className="qp-header-left">
                        <img
                            src="/dracker_character.png"
                            alt="Drácker"
                            className="qp-dragon-img"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div>
                            <div className="qp-tag">ATIVIDADE DE AVALIAÇÃO</div>
                            <h1 className="qp-title">{title || 'Quiz'}</h1>
                        </div>
                    </div>
                    <div className="qp-meta-col">
                        <div className="qp-meta-line">
                            <span className="qp-meta-label">Aluno(a):</span>
                            <span className="qp-meta-blank" />
                        </div>
                        <div className="qp-meta-line">
                            <span className="qp-meta-label">Data:</span>
                            <span className="qp-meta-blank qp-meta-blank--sm" />
                            <span className="qp-meta-label">Turma:</span>
                            <span className="qp-meta-blank qp-meta-blank--sm" />
                        </div>
                    </div>
                </div>

                {quizData.intro_text && (
                    <p className="qp-intro">{quizData.intro_text}</p>
                )}

                <div className="qp-meta-pills">
                    <span className="qp-pill">📋 {visibleQuestions.length} questões</span>
                    {isTextOnly && <span className="qp-pill qp-pill--info">✏️ Resposta dissertativa</span>}
                </div>

                <div className="qp-divider" />
            </div>

            {/* ===== QUESTÕES ===== */}
            <div className={`qp-questions ${gridClass}`}>
                {visibleQuestions.length === 0 && (
                    <div className="qp-card p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 my-6 no-print col-span-full">
                        <p className="text-base font-bold mb-1 text-slate-700">Nenhuma questão selecionada</p>
                        <p className="text-sm">Abra o painel de configuração acima ("Selecionar Questões") e marque as questões que deseja incluir ou clique em "Selecionar todas".</p>
                    </div>
                )}
                {visibleQuestions.map(({ q, originalIdx }, printNum) => {
                    const options = buildOptions(q);
                    const diff = q.difficulty ? difficultyMeta[q.difficulty] : null;
                    const imgSrc = q.image_url ? toDirectImageUrl(q.image_url) : null;

                    return (
                        <div key={originalIdx} className={`qp-card${isTextOnly ? ' qp-card--text-only' : ''}${imgSrc ? ' qp-card--has-img' : ''}`}>
                            {/* Número + badge dificuldade + enunciado */}
                            <div className="qp-card-head">
                                <span className="qp-num">{printNum + 1}</span>
                                <div className="qp-card-head-text">
                                    {showDifficulty && diff && (
                                        <span className={`qp-diff ${diff.cls}`}>{diff.label}</span>
                                    )}
                                    <p className="qp-statement">
                                        {q.statement.replace(/^\d+[.)]\s*/, '')}
                                    </p>
                                </div>
                            </div>

                            {/* Imagem opcional da questão — sem overflow hidden, altura natural */}
                            {imgSrc && (() => {
                                // Prioridade: cor da própria questão → prop global → transparent
                                const bg = q.image_bg_color && q.image_bg_color !== 'transparent'
                                    ? q.image_bg_color
                                    : (imageBgColor && imageBgColor !== 'transparent' ? imageBgColor : 'transparent');
                                return (
                                    <div className="qp-question-img-wrap" style={{ background: bg }}>
                                        <img
                                            src={imgSrc}
                                            alt="Imagem da questão"
                                            style={imgStyle}
                                            referrerPolicy="no-referrer"
                                            onError={handleDriveImageError}
                                        />
                                    </div>
                                );
                            })()}

                            {/* Alternativas (apenas no modo full) */}
                            {!isTextOnly && (
                                <div className="qp-options">
                                    {options.map((opt, oi) => {
                                        const isCorrect = showAnswers && opt === q.correct_answer;
                                        return (
                                            <div
                                                key={oi}
                                                className={`qp-option${isCorrect ? ' qp-option--correct' : ''}`}
                                            >
                                                <span className={`qp-letter${isCorrect ? ' qp-letter--correct' : ''}`}>
                                                    {LETTERS[oi]}
                                                </span>
                                                <span className="qp-opt-text">{opt}</span>
                                                {isCorrect && <span className="qp-check">✓</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Modo só enunciado: linhas para resposta ou gabarito */}
                            {isTextOnly && (
                                <div className="qp-answer-lines">
                                    {showAnswers ? (
                                        /* Gabarito: exibe a resposta correta destacada */
                                        <div className="qp-answer-correct">
                                            <span className="qp-answer-correct-label">✓ Resposta:</span>
                                            <span className="qp-answer-correct-text">{q.correct_answer}</span>
                                        </div>
                                    ) : (
                                        /* Sem gabarito: linhas para o aluno escrever */
                                        <>
                                            <div className="qp-answer-line" />
                                            <div className="qp-answer-line" />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ===== RODAPÉ ===== */}
            <div className="qp-footer">
                <span>DrackerAdapta · Gerado por IA educacional</span>
                <span>Boa sorte! 🌟</span>
            </div>

            {/* ===== ESTILOS ===== */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

                /* ── BASE ── */
                .qp-wrap {
                    max-width: 960px;
                    margin: 0 auto;
                    padding: 2px;
                    background: #fff;
                    color: #1a1a2e;
                    font-family: 'Nunito', 'Verdana', Arial, sans-serif;
                }

                /* ══════════════════════════════
                   CABEÇALHO
                ══════════════════════════════ */
                .qp-header { margin-bottom: 16px; }
                .qp-header-top {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 16px;
                    margin-bottom: 8px;
                }
                .qp-header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .qp-dragon-img {
                    width: 80px; height: 80px;
                    object-fit: contain; flex-shrink: 0;
                }
                .qp-tag {
                    font-size: 9px; font-weight: 800;
                    letter-spacing: 2.5px; text-transform: uppercase;
                    color: #92400e; margin-bottom: 3px;
                }
                .qp-title {
                    font-size: 21px; font-weight: 900;
                    color: #111; margin: 0; line-height: 1.15;
                }

                /* Campos de nome/data/turma */
                .qp-meta-col {
                    display: flex; flex-direction: column;
                    gap: 7px; flex-shrink: 0; min-width: 250px;
                }
                .qp-meta-line {
                    display: flex; align-items: center;
                    gap: 5px; font-size: 11px; color: #333; font-weight: 700;
                }
                .qp-meta-label { white-space: nowrap; }
                .qp-meta-blank {
                    flex: 1; border-bottom: 1px solid #555;
                    height: 14px; display: inline-block;
                }
                .qp-meta-blank--sm { flex: 0 0 58px; }

                /* Texto introdutório */
                .qp-intro {
                    font-size: 11.5px; color: #555; line-height: 1.5;
                    margin: 6px 0 8px;
                    border-left: 3px solid #d97706; padding-left: 10px;
                    font-style: italic;
                }

                /* Pills */
                .qp-meta-pills { margin-bottom: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
                .qp-pill {
                    font-size: 10.5px; font-weight: 700; color: #92400e;
                    border: 1px solid #fbbf24; border-radius: 20px; padding: 2px 10px;
                }
                .qp-pill--info { color: #1d4ed8; border-color: #93c5fd; }

                /* Linha divisória */
                .qp-divider {
                    border: none; border-top: 2px solid #1c1c1c; margin-bottom: 0;
                }

                /* ══════════════════════════════
                   QUESTÕES — grid base (2 colunas)
                ══════════════════════════════ */
                .qp-questions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px 14px;
                    margin-top: 14px;
                }

                /* Modo somente texto — 3 colunas mais compactas */
                .qp-questions--text-only {
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 8px 10px;
                }

                /* Quando há imagens — 1 coluna para não cortar */
                .qp-questions--with-img {
                    grid-template-columns: 1fr 1fr;
                }

                /* ── Card base ── */
                .qp-card {
                    background: #fff;
                    border: 2px solid #fde68a;
                    border-radius: 12px;
                    padding: 12px 14px;
                    box-shadow: 0 2px 8px rgba(217,119,6,0.10);
                    break-inside: avoid;
                    page-break-inside: avoid;
                    /* Sem overflow:hidden para a imagem não ser cortada */
                }

                /* Card que tem imagem ocupa a coluna inteira */
                .qp-card--has-img {
                    grid-column: span 1;
                }
                .qp-questions--text-only .qp-card--has-img {
                    grid-column: span 2;
                }

                /* Card compacto (text-only) */
                .qp-card--text-only {
                    padding: 8px 10px;
                    border-radius: 9px;
                }

                .qp-card-head {
                    display: flex;
                    align-items: flex-start;
                    gap: 9px;
                    margin-bottom: 8px;
                }
                .qp-card-head-text {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }

                /* Número: círculo âmbar */
                .qp-num {
                    flex-shrink: 0;
                    width: 26px; height: 26px;
                    background: linear-gradient(135deg, #78350f, #d97706);
                    color: #fff; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 12px; font-weight: 900; line-height: 1;
                    box-shadow: 0 2px 5px rgba(120,53,15,0.28);
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* Badge de dificuldade */
                .qp-diff {
                    display: inline-block;
                    font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px;
                    text-transform: uppercase; padding: 1px 7px;
                    border-radius: 20px; width: fit-content;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .qp-diff--easy   { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
                .qp-diff--medium { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
                .qp-diff--hard   { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

                .qp-statement {
                    font-size: 12.5px; font-weight: 700;
                    color: #1c0e03; line-height: 1.4; margin: 0;
                }
                .qp-card--text-only .qp-statement { font-size: 11px; }

                /* ── Imagem da questão ── */
                .qp-question-img-wrap {
                    margin: 6px 0 8px;
                    border-radius: 8px;
                    border: 1px solid #fde68a;
                    background: #fffbeb;
                    /* SEM overflow:hidden e SEM max-height fixo aqui — controlado inline via prop */
                    break-inside: avoid;
                    page-break-inside: avoid;
                    text-align: center;
                }

                /* ── Alternativas ── */
                .qp-options {
                    display: flex; flex-direction: column; gap: 5px;
                }
                .qp-option {
                    display: flex; align-items: center; gap: 7px;
                    background: #fffbeb; border: 1.5px solid #fde68a;
                    border-radius: 7px; padding: 5px 9px;
                    font-size: 11.5px; color: #44230a;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .qp-option--correct {
                    background: #f0fdf4; border-color: #4ade80; color: #14532d;
                }
                .qp-letter {
                    flex-shrink: 0; width: 20px; height: 20px;
                    border-radius: 50%; background: #fde68a; color: #78350f;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 10px; font-weight: 900; line-height: 1;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .qp-letter--correct { background: #4ade80; color: #14532d; }
                .qp-opt-text { flex: 1; font-weight: 600; line-height: 1.3; }
                .qp-check { color: #16a34a; font-size: 13px; font-weight: 900; }

                /* ── Linhas de resposta dissertativa ── */
                .qp-answer-lines {
                    display: flex; flex-direction: column; gap: 5px; margin-top: 6px;
                }
                .qp-answer-line {
                    border-bottom: 1px dashed #bbb; height: 16px; width: 100%;
                }

                /* ── Gabarito no modo só enunciado ── */
                .qp-answer-correct {
                    display: flex; align-items: baseline; gap: 6px;
                    background: #eff6ff; border: 1.5px solid #60a5fa;
                    border-radius: 7px; padding: 5px 9px; margin-top: 2px;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .qp-answer-correct-label {
                    font-size: 10px; font-weight: 900;
                    color: #1d4ed8; white-space: nowrap; flex-shrink: 0;
                }
                .qp-answer-correct-text {
                    font-size: 11.5px; font-weight: 700;
                    color: #1e3a8a; line-height: 1.3;
                }

                /* ── Rodapé ── */
                .qp-footer {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-top: 18px; padding-top: 10px;
                    border-top: 1.5px dashed #fbbf24;
                    font-size: 10.5px; color: #92400e; font-weight: 600;
                }

                /* ── Impressão ── */
                @media print {
                    .qp-wrap { max-width: 100%; padding: 0; }
                    .qp-questions { grid-template-columns: 1fr 1fr; }
                    .qp-questions--text-only { grid-template-columns: 1fr 1fr 1fr; }
                    .qp-questions--with-img { grid-template-columns: 1fr 1fr; }
                    .qp-card, .qp-num, .qp-letter, .qp-letter--correct,
                    .qp-option, .qp-option--correct, .qp-diff {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    .qp-question-img-wrap {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }

                /* ── Tela pequena ── */
                @media (max-width: 580px) {
                    .qp-questions, .qp-questions--text-only, .qp-questions--with-img { grid-template-columns: 1fr; }
                    .qp-header-top { flex-direction: column; }
                    .qp-meta-col { min-width: unset; width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default QuizPrint;
