import React from 'react';
import { NumberLineRenderer } from './NumberLineRenderer';

export const NumberLinePrint = ({ data, showAnswers = true }) => {
    const {
        title = "Atividade de Reta Numérica",
        description = "Analise a reta numérica abaixo e responda às questões.",
        questions = []
    } = data || {};

    return (
        <div className="bg-white p-8 rounded-xl shadow-none border border-transparent print:p-0">
            {/* School Header */}
            <div className="border-2 border-brown-800 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center border-b-2 border-brown-800 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-brown-900 tracking-wider">DRÁCKER ADAPTA</span>
                        <span className="text-xs bg-brown-800 text-white px-2 py-0.5 rounded font-bold uppercase">Atividade Pedagógica</span>
                    </div>
                    <span className="text-sm font-bold text-brown-800">RETA NUMÉRICA</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-brown-900 font-medium">
                    <div><strong>Escola:</strong> _________________________________________________</div>
                    <div><strong>Data:</strong> ____/____/202___</div>
                    <div><strong>Estudante:</strong> ______________________________________________</div>
                    <div><strong>Turma:</strong> ___________ <strong>Professor(a):</strong> ______________________</div>
                </div>
            </div>

            {/* Title and Instruction */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-brown-900 mb-1">{title}</h2>
                <p className="text-sm text-brown-700">{description}</p>
            </div>

            {/* Number Line Visual */}
            <div className="border-2 border-brown-200 rounded-xl p-6 mb-8 bg-white">
                <NumberLineRenderer
                    data={data}
                    showAnswers={showAnswers}
                    isPrint={true}
                />
            </div>

            {/* Questions Section */}
            {questions && questions.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-base font-bold text-brown-900 border-b border-brown-200 pb-2">
                        Exercícios e Interpretação:
                    </h3>
                    <div className="space-y-5">
                        {questions.map((q, idx) => (
                            <div key={idx} className="space-y-2">
                                <p className="text-sm font-bold text-brown-900">
                                    {idx + 1}. {q}
                                </p>
                                <div className="border-b border-dotted border-brown-400 h-6 w-full" />
                                <div className="border-b border-dotted border-brown-400 h-6 w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
