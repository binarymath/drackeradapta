import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Users, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { fetchSheetStudents, extractSheetInfo } from '../../services/googleSheetsService';

export const ClassesManagerModal = ({ isOpen, onClose, classes, setClasses, selectedClassId, setSelectedClassId }) => {
    const [rows, setRows] = useState([]);
    const [activeTab, setActiveTab] = useState('Geral');
    
    // Sheets Import State
    const [isImporting, setIsImporting] = useState(false);
    const [sheetUrl, setSheetUrl] = useState('');
    const [sheetTab, setSheetTab] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState('');

    useEffect(() => {
        if (isOpen) {
            const initialRows = classes.flatMap(c => 
                (c.students || []).map(s => ({
                    id: s.id,
                    name: s.name,
                    className: c.name,
                    groupName: s.groupName || '',
                    hits: s.hits || 0,
                    misses: s.misses || 0,
                    history: s.history || [],
                    status: s.status || 'active'
                }))
            );
            if (initialRows.length === 0) {
                setRows([{ id: 'new_1', name: '', className: '', groupName: '' }]);
            } else {
                setRows(initialRows);
            }
        }
    }, [isOpen, classes]);

    const uniqueClasses = Array.from(new Set(rows.map(r => (r.className || '').trim()).filter(Boolean)));
    const allTabs = ['Geral', ...uniqueClasses];

    useEffect(() => {
        if (activeTab !== 'Geral' && !uniqueClasses.includes(activeTab)) {
            setActiveTab('Geral');
        }
    }, [rows, activeTab]);

    const handleSave = () => {
        const grouped = {};
        rows.forEach(r => {
            if (!r.name.trim()) return;
            const cName = r.className.trim() || 'Turma Única';
            if (!grouped[cName]) grouped[cName] = [];
            grouped[cName].push({
                id: r.id.startsWith('new_') ? Date.now().toString() + Math.random().toString(36).substr(2, 5) : r.id,
                name: r.name.trim(),
                groupName: r.groupName.trim() || undefined,
                hits: r.hits || 0,
                misses: r.misses || 0,
                status: r.status || 'active',
                history: r.history || []
            });
        });

        const newClasses = Object.keys(grouped).map((cName, idx) => {
            const existingC = classes.find(c => c.name === cName);
            return {
                ...(existingC || {}),
                id: existingC ? existingC.id : Date.now().toString() + idx,
                name: cName,
                students: grouped[cName]
            };
        });

        setClasses(newClasses);
        onClose();
    };

    const handleAddRow = () => {
        setRows([...rows, { 
            id: 'new_' + Date.now() + Math.random().toString(36).substr(2, 5), 
            name: '', 
            className: activeTab === 'Geral' ? '' : activeTab, 
            groupName: '' 
        }]);
    };

    const updateRowById = (id, field, value) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const deleteRowById = (id) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const handleImportSheets = async () => {
        setImportError('');
        setImportLoading(true);
        try {
            const { sheetId, gid } = extractSheetInfo(sheetUrl);
            if (!sheetId) throw new Error('Link da planilha inválido.');
            
            const options = {};
            if (gid) options.gid = gid;
            if (sheetTab) options.sheetName = sheetTab;

            const importedStudents = await fetchSheetStudents(sheetId, options);
            if (importedStudents.length === 0) {
                throw new Error('Nenhum aluno encontrado nas colunas da planilha.');
            }

            const newRows = importedStudents.map(s => ({
                id: s.id,
                name: s.name,
                className: s.className,
                groupName: s.groupName || '',
                hits: 0,
                misses: 0,
                history: [],
                status: 'active'
            }));

            if (rows.length === 1 && !rows[0].name.trim()) {
                setRows(newRows);
            } else {
                setRows([...rows, ...newRows]);
            }
            
            setIsImporting(false);
            setSheetUrl('');
            setSheetTab('');
        } catch (err) {
            setImportError(err.message);
        } finally {
            setImportLoading(false);
        }
    };

    if (!isOpen) return null;

    const visibleRows = activeTab === 'Geral' ? rows : rows.filter(r => (r.className || '').trim() === activeTab);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gerenciador de Alunos e Turmas" maxWidth="max-w-4xl">
            {isImporting ? (
                <div className="space-y-4">
                    <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
                        <h3 className="font-bold text-sky-900 flex items-center gap-2 mb-2">
                            <FileSpreadsheet className="w-5 h-5" /> Importar do Google Sheets
                        </h3>
                        <p className="text-sm text-sky-700 mb-4">
                            Sua planilha precisa estar configurada como <strong>"Qualquer pessoa com o link pode visualizar"</strong>.<br/>
                            Estrutura esperada: <strong>Coluna A (Nome)</strong>, <strong>Coluna B (Turma)</strong> e <strong>Coluna C (Equipe/Grupo)</strong>. A linha 1 (cabeçalho) é ignorada.
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Link Público da Planilha</label>
                                <input
                                    type="url"
                                    value={sheetUrl}
                                    onChange={(e) => setSheetUrl(e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Aba (Opcional - útil se tiver várias turmas em abas diferentes)</label>
                                <input
                                    type="text"
                                    value={sheetTab}
                                    onChange={(e) => setSheetTab(e.target.value)}
                                    placeholder="Ex: 5º Ano A"
                                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                                />
                            </div>
                        </div>

                        {importError && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-2 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span>{importError}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setIsImporting(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                            Cancelar
                        </button>
                        <button 
                            onClick={handleImportSheets} 
                            disabled={!sheetUrl || importLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all"
                        >
                            {importLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                            Importar Dados
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100 gap-4">
                        <div className="flex items-center gap-3 text-indigo-900">
                            <Users className="w-8 h-8 text-indigo-500 bg-white p-1.5 rounded-xl shadow-sm" />
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Seu Diário de Classe</h3>
                                <p className="text-sm text-indigo-700 mt-0.5">Adicione alunos, separe por turmas e grupos. Digite direto ou importe.</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsImporting(true)}
                            className="bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Importar Planilha
                        </button>
                    </div>

                    {/* TABS DE TURMAS */}
                    {allTabs.length > 1 && (
                        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                            {allTabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-colors border ${
                                        activeTab === tab 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                                >
                                    {tab === 'Geral' ? 'Todos os Alunos' : tab}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col h-[55vh]">
                        <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-200 p-3 text-xs font-black text-slate-500 uppercase tracking-wider shrink-0">
                            <div className="col-span-5 pl-2">Nome do Aluno</div>
                            <div className="col-span-3">Turma</div>
                            <div className="col-span-3">Equipe/Grupo</div>
                            <div className="col-span-1 text-center">Ação</div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                            {visibleRows.map((row) => (
                                <div key={row.id} className="grid grid-cols-12 gap-2 items-center hover:bg-slate-50 p-1 rounded-xl transition-colors group border border-transparent hover:border-slate-200">
                                    <div className="col-span-5">
                                        <input 
                                            value={row.name}
                                            onChange={(e) => updateRowById(row.id, 'name', e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddRow(); }}
                                            placeholder="Nome completo..."
                                            className="w-full px-3 py-2 text-sm font-bold text-slate-800 bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input 
                                            value={row.className}
                                            onChange={(e) => updateRowById(row.id, 'className', e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddRow(); }}
                                            placeholder="Ex: 5º Ano A"
                                            className="w-full px-3 py-2 text-sm font-medium text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input 
                                            value={row.groupName}
                                            onChange={(e) => updateRowById(row.id, 'groupName', e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddRow(); }}
                                            placeholder="Ex: Equipe Azul"
                                            className="w-full px-3 py-2 text-sm font-medium text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded-lg outline-none transition-all"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button 
                                            onClick={() => deleteRowById(row.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100"
                                            title="Remover linha"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
                            <button 
                                onClick={handleAddRow}
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-3 py-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Adicionar nova linha
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 mt-2 border-t border-slate-100">
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 shadow-md"
                        >
                            <Check className="w-4 h-4" /> Salvar Diário
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
