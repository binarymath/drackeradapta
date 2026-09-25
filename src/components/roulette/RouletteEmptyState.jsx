import React from 'react';
import { GoogleSheetsImportModal } from './GoogleSheetsImportModal';

export const RouletteEmptyState = ({
    showSheetsModal,
    setShowSheetsModal,
    handleSheetsImport,
    classes
}) => {
    return (
        <>
            <GoogleSheetsImportModal
                isOpen={showSheetsModal}
                onClose={() => setShowSheetsModal(false)}
                mode="import"
                onImport={handleSheetsImport}
            />
            <div className="flex flex-col items-center justify-center w-full min-h-[600px] text-center p-8 animate-in fade-in duration-500">
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-12 max-w-2xl shadow-sm space-y-6">
                    <h2 className="text-3xl font-black text-indigo-900">Pronto para girar?</h2>
                    <p className="text-lg text-indigo-700 font-medium">
                        Para criar a sua roleta, siga estes passos na <strong className="font-black text-indigo-800">Barra Lateral à esquerda</strong>:
                    </p>
                    <ul className="text-left space-y-3 text-indigo-800 font-medium bg-white/60 p-6 rounded-2xl">
                        <li><strong>1.</strong> Selecione a <strong>Turma</strong> (crie uma se não tiver).</li>
                        <li><strong>2.</strong> Digite o <strong>Tema</strong> da aula.</li>
                        <li><strong>3.</strong> Clique no botão vermelho <strong>Gerar Atividade</strong>.</li>
                    </ul>

                    <div className="pt-2 border-t border-indigo-200">
                        <p className="text-sm text-indigo-600 font-semibold mb-3">Ou importe questões diretamente de uma planilha:</p>
                        <button
                            type="button"
                            onClick={() => setShowSheetsModal(true)}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg cursor-pointer text-base"
                        >
                            <span className="text-lg">📊</span>
                            Importar do Google Sheets
                        </button>
                        <p className="text-xs text-indigo-500 mt-2">Sem precisar de IA — direto da sua planilha</p>
                    </div>
                </div>
            </div>
        </>
    );
};
