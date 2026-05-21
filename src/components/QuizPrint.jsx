import React from 'react';

/**
 * QuizPrint – Layout de impressão/PDF do Quiz em cards estilizados.
 * Cabeçalho: branco, econômico de tinta.
 * Cards: estilizados com bordas âmbar/dourado, números e letras com identidade visual.
 * Props:
 *   quizData    – { intro_text, questions: [{ statement, correct_answer, distractors }] }
 *   title       – Título da atividade
 *   showAnswers – Se true, destaca a alternativa correta
 */
export const QuizPrint = ({ quizData, title, showAnswers = false }) => {
    if (!quizData?.questions?.length) return null;

    const LETTERS = ['A', 'B', 'C', 'D', 'E'];

    const buildOptions = (q) =>
        [q.correct_answer, ...(q.distractors || [])].slice(0, 5);

    return (
        <div className="qp-wrap">

            {/* ===== CABEÇALHO – branco, sem fundo colorido ===== */}
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
                    <span className="qp-pill">📋 {quizData.questions.length} questões</span>
                </div>

                <div className="qp-divider" />
            </div>

            {/* ===== QUESTÕES – cards estilizados âmbar ===== */}
            <div className="qp-questions">
                {quizData.questions.map((q, idx) => {
                    const options = buildOptions(q);
                    return (
                        <div key={idx} className="qp-card">
                            {/* Número e enunciado */}
                            <div className="qp-card-head">
                                <span className="qp-num">{idx + 1}</span>
                                <p className="qp-statement">
                                    {q.statement.replace(/^\d+[\.\)]\s*/, '')}
                                </p>
                            </div>

                            {/* Alternativas */}
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
                    max-width: 740px;
                    margin: 0 auto;
                    padding: 2px;
                    background: #fff;
                    color: #1a1a2e;
                    font-family: 'Nunito', 'Verdana', Arial, sans-serif;
                }

                /* ══════════════════════════════
                   CABEÇALHO – sem fundo colorido
                ══════════════════════════════ */
                .qp-header {
                    margin-bottom: 16px;
                }
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
                    width: 80px;
                    height: 80px;
                    object-fit: contain;
                    flex-shrink: 0;
                }
                .qp-tag {
                    font-size: 9px;
                    font-weight: 800;
                    letter-spacing: 2.5px;
                    text-transform: uppercase;
                    color: #92400e;
                    margin-bottom: 3px;
                }
                .qp-title {
                    font-size: 21px;
                    font-weight: 900;
                    color: #111;
                    margin: 0;
                    line-height: 1.15;
                }

                /* Campos de nome/data/turma */
                .qp-meta-col {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                    flex-shrink: 0;
                    min-width: 250px;
                }
                .qp-meta-line {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11px;
                    color: #333;
                    font-weight: 700;
                }
                .qp-meta-label { white-space: nowrap; }
                .qp-meta-blank {
                    flex: 1;
                    border-bottom: 1px solid #555;
                    height: 14px;
                    display: inline-block;
                }
                .qp-meta-blank--sm { flex: 0 0 58px; }

                /* Texto introdutório */
                .qp-intro {
                    font-size: 11.5px;
                    color: #555;
                    line-height: 1.5;
                    margin: 6px 0 8px;
                    border-left: 3px solid #d97706;
                    padding-left: 10px;
                    font-style: italic;
                }

                /* Pill de contagem */
                .qp-meta-pills { margin-bottom: 8px; }
                .qp-pill {
                    font-size: 10.5px;
                    font-weight: 700;
                    color: #92400e;
                    border: 1px solid #fbbf24;
                    border-radius: 20px;
                    padding: 2px 10px;
                }

                /* Linha divisória */
                .qp-divider {
                    border: none;
                    border-top: 2px solid #1c1c1c;
                    margin-bottom: 0;
                }

                /* ══════════════════════════════
                   CARDS – estilo âmbar/dourado
                ══════════════════════════════ */
                .qp-questions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px 14px;
                    margin-top: 14px;
                }

                .qp-card {
                    background: #fff;
                    border: 2px solid #fde68a;
                    border-radius: 12px;
                    padding: 12px 14px;
                    box-shadow: 0 2px 8px rgba(217,119,6,0.10);
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                .qp-card-head {
                    display: flex;
                    align-items: flex-start;
                    gap: 9px;
                    margin-bottom: 10px;
                }

                /* Número: círculo preenchido âmbar */
                .qp-num {
                    flex-shrink: 0;
                    width: 26px;
                    height: 26px;
                    background: linear-gradient(135deg, #78350f, #d97706);
                    color: #fff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 900;
                    line-height: 1;
                    box-shadow: 0 2px 5px rgba(120,53,15,0.28);
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .qp-statement {
                    font-size: 12.5px;
                    font-weight: 700;
                    color: #1c0e03;
                    line-height: 1.4;
                    margin: 0;
                    flex: 1;
                }

                /* ── Alternativas ── */
                .qp-options {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .qp-option {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    background: #fffbeb;
                    border: 1.5px solid #fde68a;
                    border-radius: 7px;
                    padding: 5px 9px;
                    font-size: 11.5px;
                    color: #44230a;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* Gabarito: destaque verde sem fundo pesado */
                .qp-option--correct {
                    background: #f0fdf4;
                    border-color: #4ade80;
                    color: #14532d;
                }

                /* Letra: badge amarelo */
                .qp-letter {
                    flex-shrink: 0;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #fde68a;
                    color: #78350f;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 900;
                    line-height: 1;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* Letra do gabarito */
                .qp-letter--correct {
                    background: #4ade80;
                    color: #14532d;
                }

                .qp-opt-text {
                    flex: 1;
                    font-weight: 600;
                    line-height: 1.3;
                }

                .qp-check {
                    color: #16a34a;
                    font-size: 13px;
                    font-weight: 900;
                }

                /* ── Rodapé ── */
                .qp-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 18px;
                    padding-top: 10px;
                    border-top: 1.5px dashed #fbbf24;
                    font-size: 10.5px;
                    color: #92400e;
                    font-weight: 600;
                }

                /* ── Impressão ── */
                @media print {
                    .qp-wrap { max-width: 100%; padding: 0; }
                    .qp-questions { grid-template-columns: 1fr 1fr; }
                    .qp-card { break-inside: avoid; page-break-inside: avoid; }
                    .qp-num,
                    .qp-letter,
                    .qp-letter--correct,
                    .qp-option,
                    .qp-option--correct {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }

                /* ── Tela pequena ── */
                @media (max-width: 580px) {
                    .qp-questions { grid-template-columns: 1fr; }
                    .qp-header-top { flex-direction: column; }
                    .qp-meta-col { min-width: unset; width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default QuizPrint;
