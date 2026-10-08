import React, { useState, useEffect } from 'react';
import { 
    History, 
    Save, 
    Upload, 
    Download, 
    Trash2, 
    CheckCircle, 
    AlertTriangle, 
    FileText, 
    Clock, 
    User, 
    Layers, 
    Plus, 
    Archive, 
    Sparkles, 
    CheckSquare, 
    Square, 
    X,
    Info,
    Play,
    FolderTree,
    Edit2,
    BookOpen
} from 'lucide-react';
import { useActivity } from '../contexts/ActivityContext';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Badge } from './ui/Badge';
import { VersionedBackupService } from '../services/VersionedBackupService';
import { IndexedDBService } from '../services/IndexedDBService';
import { toast } from './ui/Toast';
import { confirmDialog } from './ui/ConfirmDialog';

export const BackupVersionCenterModal = ({
    isOpen,
    onClose,
    currentTabs = [],
    classes = [],
    onRestoreTabs,
    onMergeTabs,
    onOpenSingleActivity,
    initialTab = 'timeline',
    initialFileContent = null
}) => {
    const { projectId, projectName } = useActivity();
    
    // activeTab will default to 'workspaces' if not specified otherwise
    const [activeTab, setActiveTab] = useState(initialTab === 'timeline' ? 'workspaces' : initialTab);
    const [checkpoints, setCheckpoints] = useState([]);
    
    // Estado para aba Workspaces
    const [workspaces, setWorkspaces] = useState([]);
    const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
    const [editingWsId, setEditingWsId] = useState(null);
    const [editWsName, setEditWsName] = useState('');
    
    // Form para novo checkpoint
    const [newTag, setNewTag] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newAuthor, setNewAuthor] = useState('Professor(a)');
    const [stripImages, setStripImages] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    const [saveMode, setSaveMode] = useState('all');
    const [selectedTabsToSave, setSelectedTabsToSave] = useState(new Set(currentTabs?.map(t => t.id) || []));

    // Estado para importação / inspeção de arquivo
    const [inspectedBackup, setInspectedBackup] = useState(null);
    const [selectedActivityIds, setSelectedActivityIds] = useState(new Set());
    const [importError, setImportError] = useState('');
    
    // Estado do painel expandido de importação na timeline
    const [expandedImportId, setExpandedImportId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadCheckpoints();
            loadWorkspaces();
            setActiveTab(initialTab === 'timeline' ? 'workspaces' : initialTab);
            if (initialFileContent) {
                handleParseContent(initialFileContent);
                setActiveTab('inspect');
            }
        }
    }, [isOpen, initialTab, initialFileContent, projectId]);

    const loadCheckpoints = async () => {
        try {
            const data = await IndexedDBService.getTimeline(projectId);
            setCheckpoints(data);
        } catch (err) {
            console.error('Erro ao carregar checkpoints:', err);
        }
    };

    const loadWorkspaces = async () => {
        setLoadingWorkspaces(true);
        try {
            const list = await IndexedDBService.listProjects();
            setWorkspaces(list);
        } catch (error) {
            console.error('Falha ao carregar workspaces', error);
        } finally {
            setLoadingWorkspaces(false);
        }
    };

    const handleCreateCheckpoint = async (e) => {
        if (e) e.preventDefault();
        if (!currentTabs || currentTabs.length === 0) {
            toast('Não há atividades na área de trabalho para criar um checkpoint.');
            return;
        }

        setIsCreating(true);
        try {
            const tabsToSave = saveMode === 'selective' 
                ? currentTabs.filter(tab => selectedTabsToSave.has(tab.id))
                : currentTabs;

            if (tabsToSave.length === 0) {
                toast('Selecione pelo menos uma atividade para salvar.');
                setIsCreating(false);
                return;
            }

            await IndexedDBService.saveCheckpoint(tabsToSave, classes || [], {
                versionTag: newTag || `Versão ${checkpoints.length + 1}.0 - ${new Date().toLocaleDateString('pt-BR')}`,
                description: newDesc || `Backup gerado pelo usuário com ${tabsToSave.length} atividade(s).`,
                author: newAuthor || 'Professor(a)',
                type: 'manual',
                isPartial: saveMode === 'selective'
            }, projectId);
            await loadCheckpoints();
            setNewTag('');
            setNewDesc('');
            setSaveMode('all');
        } catch (err) {
            console.error(err);
            toast('Erro ao criar checkpoint: ' + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteCheckpoint = async (id) => {
        if (await confirmDialog('Tem certeza que deseja excluir este checkpoint da linha do tempo local?')) {
            await IndexedDBService.deleteCheckpoint(id);
            await loadCheckpoints();
        }
    };

    const handleCreateNewProject = async (chk) => {
        try {
            const fullChk = await IndexedDBService.getCheckpointData(chk.id);
            const newProjectId = `proj_${Date.now()}`;
            await IndexedDBService.saveProjectState(newProjectId, {
                name: `Cópia de: ${chk.versionTag || 'Backup'}`,
                tabs: fullChk.tabs || [],
                classes: fullChk.classes && fullChk.classes.length > 0 ? fullChk.classes : classes
            });
            // Open in new tab
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?project_id=' + newProjectId;
            window.open(newUrl, '_blank');
        } catch (err) {
            console.error(err);
            toast('Falha ao ramificar este projeto.');
        }
    };

    // --- MÉTODOS DE WORKSPACE ---
    const handleOpenWorkspace = (wsId) => {
        if (wsId === projectId) {
            onClose();
            return;
        }
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?project_id=' + wsId;
        window.location.href = newUrl;
    };

    const handleDeleteWorkspace = async (wsId) => {
        if (wsId === projectId) {
            toast('Você não pode deletar o Workspace que está aberto no momento.');
            return;
        }
        if (await confirmDialog('Tem certeza que deseja excluir este workspace e TODOS os seus backups da linha do tempo? Isso é irreversível.')) {
            await IndexedDBService.deleteProject(wsId);
            loadWorkspaces();
        }
    };

    const handleDownloadWorkspace = async (wsId) => {
        try {
            const wsState = await IndexedDBService.getProject(wsId);
            if (!wsState || !wsState.tabs || wsState.tabs.length === 0) {
                toast('Este workspace está vazio ou não pôde ser carregado.');
                return;
            }
            VersionedBackupService.exportDrackerFile(wsState.tabs, {
                isRawTabs: true,
                classes: wsState.classes || [],
                metadata: {
                    versionTag: `Workspace Completo: ${wsState.name}`,
                    description: `Backup do workspace "${wsState.name}" baixado em ${new Date().toLocaleDateString('pt-BR')}.`,
                    stripImages: false,
                    author: 'Professor(a)',
                    classes: wsState.classes || []
                }
            });
        } catch (err) {
            console.error('Falha ao exportar workspace:', err);
            toast('Não foi possível exportar este workspace.');
        }
    };

    const handleCreateNewBlankWorkspace = async () => {
        const newProjectId = `proj_${Date.now()}`;
        await IndexedDBService.saveProjectState(newProjectId, {
            name: `Ex: Matemática - 6º Ano (1º Bim)`,
            tabs: [{ id: 'about_system', title: 'Nova Atividade', type: 'about_system', content: '' }],
            classes: []
        });
        handleOpenWorkspace(newProjectId);
    };

    const startRenameWs = (ws) => {
        setEditingWsId(ws.id);
        setEditWsName(ws.name);
    };

    const saveRenameWs = async (ws) => {
        if (!editWsName.trim()) {
            setEditingWsId(null);
            return;
        }
        await IndexedDBService.saveProjectState(ws.id, {
            ...ws,
            name: editWsName
        });
        setEditingWsId(null);
        loadWorkspaces();
    };

    const handleExportCurrent = () => {
        if (!currentTabs || currentTabs.length === 0) {
            toast('Não há atividades na área de trabalho para exportar.');
            return;
        }
        VersionedBackupService.exportDrackerFile(currentTabs, {
            isRawTabs: true,
            classes: classes || [],
            metadata: {
                versionTag: `Trabalho Atual (${new Date().toLocaleDateString('pt-BR')})`,
                description: `Backup contendo ${currentTabs.length} atividade(s).`,
                stripImages,
                author: newAuthor || 'Professor(a)',
                classes: classes || []
            }
        });
    };

    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            handleParseContent(e.target.result);
        };
        reader.readAsText(file);
        event.target.value = null;
    };

    const handleParseContent = async (contentStr) => {
        setImportError('');
        setInspectedBackup(null);
        setSelectedActivityIds(new Set());

        const parsed = VersionedBackupService.parseBackupFile(contentStr);
        if (!parsed.isValid) {
            setImportError(parsed.error || 'Arquivo inválido.');
            return;
        }

        if (parsed.isHistoryPack) {
            // Se for pacote de histórico, perguntar se quer importar para a linha do tempo local
            if (await confirmDialog(`Este arquivo é um Pacote de Histórico com ${parsed.totalCheckpoints} checkpoints. Deseja importá-los para sua Linha do Tempo local?`)) {
                const importAll = async () => {
                    for (const chk of parsed.checkpoints) {
                        const tabs = chk.tabs || chk.activitiesData || [];
                        await IndexedDBService.saveCheckpoint(tabs, chk.classes || parsed.classes || [], {
                            versionTag: chk.versionTag || chk.snapshot?.versionTag,
                            description: chk.description || chk.snapshot?.description,
                            author: chk.author || chk.snapshot?.author,
                            type: 'imported'
                        });
                    }
                    await loadCheckpoints();
                    setActiveTab('timeline');
                    toast('Histórico de checkpoints importado com sucesso!');
                };
                importAll();
            }
            return;
        }

        setInspectedBackup(parsed);
        // Seleciona todas as atividades por padrão
        if (parsed.tabs && Array.isArray(parsed.tabs)) {
            setSelectedActivityIds(new Set(parsed.tabs.map(t => t.id)));
        }
    };

    const toggleSelectAll = () => {
        if (!inspectedBackup || !inspectedBackup.tabs) return;
        if (selectedActivityIds.size === inspectedBackup.tabs.length) {
            setSelectedActivityIds(new Set());
        } else {
            setSelectedActivityIds(new Set(inspectedBackup.tabs.map(t => t.id)));
        }
    };

    const toggleSelectActivity = (id) => {
        const updated = new Set(selectedActivityIds);
        if (updated.has(id)) {
            updated.delete(id);
        } else {
            updated.add(id);
        }
        setSelectedActivityIds(updated);
    };

    const executeReplaceAll = async () => {
        if (!inspectedBackup || !inspectedBackup.tabs) return;
        if (await confirmDialog(`Atenção: Substituir tudo irá trocar suas atividades atuais pelas ${inspectedBackup.tabs.length} atividades deste backup. Confirmar Rollback Total?`)) {
            onRestoreTabs(inspectedBackup.tabs, inspectedBackup.classes);
            onClose();
        }
    };

    const executeMergeSelected = () => {
        if (!inspectedBackup || !inspectedBackup.tabs) return;
        const selected = inspectedBackup.tabs.filter(t => selectedActivityIds.has(t.id));
        if (selected.length === 0) {
            toast('Selecione pelo menos uma atividade para juntar.');
            return;
        }
        onMergeTabs(selected, inspectedBackup.classes);
        onClose();
    };

    const handleCreateNewProjectFromInspect = async () => {
        if (!inspectedBackup || !inspectedBackup.tabs) return;
        const selected = inspectedBackup.tabs.filter(t => selectedActivityIds.has(t.id));
        if (selected.length === 0) {
            toast('Selecione pelo menos uma atividade.');
            return;
        }

        try {
            const newProjectId = `proj_import_${Date.now()}`;
            await IndexedDBService.saveProjectState(newProjectId, {
                name: inspectedBackup.snapshot?.versionTag || `Projeto Importado`,
                tabs: selected,
                classes: inspectedBackup.classes && inspectedBackup.classes.length > 0 ? inspectedBackup.classes : classes
            });
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?project_id=' + newProjectId;
            window.open(newUrl, '_blank');
            onClose();
        } catch (err) {
            console.error(err);
            toast('Falha ao criar projeto importado.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-brown-950/40 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-[#FDFBF7] rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-brown-900/5">
                
                {/* Cabeçalho do Modal (Clean & Modern) */}
                <div className="px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <History className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-brown-900 tracking-tight">Histórico de Versões</h2>
                            <p className="text-sm text-brown-500 font-medium mt-0.5">
                                Linha do tempo local com IndexedDB • Restauração seletiva
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 rounded-full bg-brown-50 text-brown-600 hover:bg-brown-100 hover:text-brown-900 transition-colors cursor-pointer"
                        title="Fechar"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Abas de Navegação (Pills) */}
                <div className="flex bg-white/60 border-b border-slate-100 p-4 gap-3 shrink-0 justify-center">
                    <button
                        onClick={() => setActiveTab('workspaces')}
                        className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'workspaces'
                                ? 'bg-white text-amber-700 shadow-sm ring-1 ring-brown-100'
                                : 'text-brown-500 hover:bg-brown-100/50 hover:text-brown-800'
                        }`}
                    >
                        <BookOpen className={`w-4 h-4 ${activeTab === 'workspaces' ? 'text-amber-500' : ''}`} />
                        Workspaces
                        <span className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'workspaces' ? 'bg-amber-100 text-amber-800' : 'bg-brown-100 text-brown-600'}`}>
                            {workspaces.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'timeline'
                                ? 'bg-white text-amber-700 shadow-sm ring-1 ring-brown-100'
                                : 'text-brown-500 hover:bg-brown-100/50 hover:text-brown-800'
                        }`}
                    >
                        <History className={`w-4 h-4 ${activeTab === 'timeline' ? 'text-amber-500' : ''}`} />
                        Linha do Tempo
                        <span className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-black ${activeTab === 'timeline' ? 'bg-amber-100 text-amber-800' : 'bg-brown-100 text-brown-600'}`}>
                            {checkpoints.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('inspect')}
                        className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'inspect'
                                ? 'bg-white text-amber-700 shadow-sm ring-1 ring-brown-100'
                                : 'text-brown-500 hover:bg-brown-100/50 hover:text-brown-800'
                        }`}
                    >
                        <Upload className={`w-4 h-4 ${activeTab === 'inspect' ? 'text-amber-500' : ''}`} />
                        Inspecionar / Importar
                        {inspectedBackup && (
                            <span className="ml-1 w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        )}
                    </button>
                </div>

                {/* Corpo do Modal */}
                <div className="p-8 overflow-y-auto flex-1 space-y-10 relative">
                    
                    {/* --- ABA 0: WORKSPACES --- */}
                    {activeTab === 'workspaces' && (
                        <div className="space-y-6">
                            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-amber-200">
                                    <BookOpen className="w-8 h-8 text-amber-500" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-lg font-black text-brown-900">Como usar os Workspaces?</h3>
                                    <p className="text-sm text-brown-600 mt-1">
                                        Eles funcionam como "Cadernos de Planejamento". Crie Workspaces separados para suas <strong className="text-brown-900">Disciplinas</strong> ou <strong className="text-brown-900">Bimestres</strong> (Ex: Ciências 8º Ano - 2º Bimestre). Assim fica muito mais fácil aplicar as mesmas atividades em turmas diferentes!
                                    </p>
                                </div>
                                <button
                                    onClick={handleCreateNewBlankWorkspace}
                                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-md hover:-translate-y-0.5 transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer"
                                >
                                    <Plus className="w-5 h-5" />
                                    Criar Novo Workspace
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {loadingWorkspaces ? (
                                    <div className="col-span-full py-12 text-center text-brown-400 font-bold">Carregando seus workspaces...</div>
                                ) : (
                                    workspaces.map((proj) => {
                                        const isCurrent = proj.id === projectId;
                                        const isEditing = editingWsId === proj.id;
                                        return (
                                            <div 
                                                key={proj.id}
                                                className={`relative p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                                                    isCurrent 
                                                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 shadow-md shadow-amber-500/10' 
                                                        : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-sm'
                                                }`}
                                            >
                                                {isCurrent && (
                                                    <div className="absolute top-0 right-6 -translate-y-1/2">
                                                        <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> Aberto Agora
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCurrent ? 'bg-white text-amber-500 shadow-sm' : 'bg-brown-50 text-brown-400'}`}>
                                                        <FolderTree className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {isEditing ? (
                                                            <div className="flex gap-2">
                                                                <input
                                                                    autoFocus
                                                                    className="w-full px-3 py-1.5 text-sm font-bold text-brown-900 bg-white border border-amber-400 rounded-xl focus:outline-none"
                                                                    value={editWsName}
                                                                    onChange={e => setEditWsName(e.target.value)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') saveRenameWs(proj);
                                                                        if (e.key === 'Escape') setEditingWsId(null);
                                                                    }}
                                                                />
                                                                <button onClick={() => saveRenameWs(proj)} className="px-3 py-1 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 transition-colors cursor-pointer">OK</button>
                                                            </div>
                                                        ) : (
                                                            <div className="group flex items-start gap-2">
                                                                <h4 className="font-black text-brown-900 text-lg truncate leading-tight mt-0.5">{proj.name}</h4>
                                                                <button 
                                                                    onClick={() => startRenameWs(proj)}
                                                                    className="opacity-0 group-hover:opacity-100 text-brown-400 hover:text-amber-500 transition-all p-1 rounded-lg cursor-pointer shrink-0"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-brown-500 font-medium mt-1">
                                                            Último acesso: {new Date(proj.lastAccessed).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 mt-5">
                                                    {!isCurrent && (
                                                        <button 
                                                            onClick={() => handleOpenWorkspace(proj.id)}
                                                            className="flex-1 py-2 rounded-xl bg-brown-50 text-brown-700 font-bold text-sm hover:bg-amber-100 hover:text-amber-800 transition-colors cursor-pointer"
                                                        >
                                                            Entrar Workspace
                                                        </button>
                                                    )}
                                                    {isCurrent && (
                                                        <div className="flex-1 py-2 rounded-xl bg-white/50 text-amber-700 font-bold text-sm text-center opacity-80 cursor-default">
                                                            Você já está aqui
                                                        </div>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDownloadWorkspace(proj.id)}
                                                        className="p-2 rounded-xl transition-colors cursor-pointer text-brown-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                        title="Baixar Workspace"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteWorkspace(proj.id)}
                                                        disabled={isCurrent}
                                                        className={`p-2 rounded-xl transition-colors cursor-pointer ${isCurrent ? 'opacity-30' : 'text-brown-400 hover:text-red-500 hover:bg-red-50'}`}
                                                        title="Deletar Workspace"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- ABA 1: TIMELINE --- */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-10">
                            
                            {/* Card: Criar Checkpoint */}
                            <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
                                
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-brown-900 text-lg flex items-center gap-2">
                                        Novo Ponto de Restauração
                                    </h3>
                                    <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 font-bold text-xs flex items-center gap-1.5 ring-1 ring-green-600/10">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        {currentTabs.length} atividade(s) ativas agora
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-brown-500 uppercase tracking-wider ml-1">Nome da Versão</label>
                                        <input
                                            className="w-full bg-brown-50/50 border border-slate-100 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 rounded-2xl px-4 py-3 text-sm text-brown-900 font-medium transition-all outline-none"
                                            placeholder="Ex: v2.0 - Frações Pronta"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-brown-500 uppercase tracking-wider ml-1">Autor</label>
                                        <input
                                            className="w-full bg-brown-50/50 border border-slate-100 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 rounded-2xl px-4 py-3 text-sm text-brown-900 font-medium transition-all outline-none"
                                            placeholder="Professor(a)"
                                            value={newAuthor}
                                            onChange={(e) => setNewAuthor(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brown-500 uppercase tracking-wider ml-1">Notas (Opcional)</label>
                                    <textarea
                                        className="w-full bg-brown-50/50 border border-slate-100 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 rounded-2xl px-4 py-3 text-sm text-brown-900 font-medium transition-all outline-none resize-none h-20"
                                        placeholder="O que mudou desde o último backup?"
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-brown-500 uppercase tracking-wider ml-1">Escopo do Checkpoint</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <label className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${saveMode === 'all' ? 'bg-amber-50 border-amber-400 shadow-sm' : 'bg-white border-slate-100 hover:border-amber-200'}`}>
                                            <input type="radio" name="saveMode" className="hidden" checked={saveMode === 'all'} onChange={() => setSaveMode('all')} />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${saveMode === 'all' ? 'border-amber-500' : 'border-slate-300'}`}>
                                                {saveMode === 'all' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                                            </div>
                                            <div>
                                                <span className="font-bold text-brown-900 block text-sm">Backup Completo</span>
                                                <span className="text-xs text-brown-500">Salva todas as {currentTabs.length} atividades</span>
                                            </div>
                                        </label>
                                        <label className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${saveMode === 'selective' ? 'bg-amber-50 border-amber-400 shadow-sm' : 'bg-white border-slate-100 hover:border-amber-200'}`}>
                                            <input type="radio" name="saveMode" className="hidden" checked={saveMode === 'selective'} onChange={() => setSaveMode('selective')} />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${saveMode === 'selective' ? 'border-amber-500' : 'border-slate-300'}`}>
                                                {saveMode === 'selective' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                                            </div>
                                            <div>
                                                <span className="font-bold text-brown-900 block text-sm">Pacote Parcial</span>
                                                <span className="text-xs text-brown-500">Escolha o que salvar isoladamente</span>
                                            </div>
                                        </label>
                                    </div>
                                    
                                    {saveMode === 'selective' && (
                                        <div className="mt-4 p-4 bg-brown-50/50 rounded-2xl border border-slate-100 max-h-48 overflow-y-auto space-y-2">
                                            <div className="flex items-center justify-between px-1 mb-2">
                                                <span className="text-xs font-bold text-brown-600">Selecione as atividades:</span>
                                                <button 
                                                    onClick={() => setSelectedTabsToSave(selectedTabsToSave.size === currentTabs.length ? new Set() : new Set(currentTabs.map(t=>t.id)))}
                                                    className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                                                >
                                                    {selectedTabsToSave.size === currentTabs.length ? 'Desmarcar Tudo' : 'Marcar Tudo'}
                                                </button>
                                            </div>
                                            {currentTabs.map(tab => {
                                                const isSel = selectedTabsToSave.has(tab.id);
                                                return (
                                                    <label key={tab.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl transition-colors cursor-pointer group">
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSel ? 'bg-amber-500 border-amber-500' : 'border-slate-300 group-hover:border-amber-400'}`}>
                                                            {isSel && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <input type="checkbox" className="hidden" checked={isSel} onChange={(e) => {
                                                            const nSet = new Set(selectedTabsToSave);
                                                            if (e.target.checked) nSet.add(tab.id);
                                                            else nSet.delete(tab.id);
                                                            setSelectedTabsToSave(nSet);
                                                        }} />
                                                        <span className="text-sm font-bold text-brown-800 truncate">{tab.title || 'Sem título'}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${stripImages ? 'bg-amber-500' : 'bg-brown-200 group-hover:bg-brown-300'}`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${stripImages ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                        <input type="checkbox" checked={stripImages} onChange={(e) => setStripImages(e.target.checked)} className="hidden" />
                                        <div>
                                            <span className="font-bold text-sm text-brown-800">Modo Leve (.json)</span>
                                            <p className="text-xs text-brown-500">Remove imagens pesadas para otimizar</p>
                                        </div>
                                    </label>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleExportCurrent}
                                            className="px-5 py-3 rounded-2xl bg-brown-50 hover:bg-brown-100 text-brown-700 font-bold text-sm transition-colors flex items-center gap-2 cursor-pointer"
                                            title="Baixar trabalho atual como .json no seu PC"
                                        >
                                            <Download className="w-4 h-4" /> Exportar .json
                                        </button>
                                        <button
                                            onClick={handleCreateCheckpoint}
                                            disabled={isCreating || currentTabs.length === 0}
                                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-md shadow-orange-500/20 hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 cursor-pointer"
                                        >
                                            <Save className="w-4 h-4" />
                                            {isCreating ? 'Salvando...' : 'Criar Checkpoint'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Linha do Tempo Visual */}
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="font-black text-brown-900 text-xl flex items-center gap-2">
                                        <Clock className="w-6 h-6 text-amber-500" /> Histórico Local
                                    </h3>
                                    {checkpoints.length > 0 && (
                                        <button
                                            onClick={async () => {
                                                const allData = await IndexedDBService.getTimeline();
                                                const fullCheckpoints = await Promise.all(allData.map(async m => await IndexedDBService.getCheckpointData(m.id)));
                                                VersionedBackupService.getCheckpoints = () => fullCheckpoints;
                                                VersionedBackupService.exportHistoryPack(classes);
                                            }}
                                            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                                        >
                                            <Archive className="w-4 h-4" /> Baixar Pacote Completo
                                        </button>
                                    )}
                                </div>

                                {checkpoints.length === 0 ? (
                                    <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                                        <div className="w-16 h-16 bg-brown-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <History className="w-8 h-8 text-brown-300" />
                                        </div>
                                        <p className="font-bold text-brown-800 text-lg">Nenhum ponto de restauração</p>
                                        <p className="text-sm text-brown-500 mt-1 max-w-md mx-auto">
                                            Crie checkpoints antes de fazer alterações importantes para poder voltar no tempo se necessário.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="ml-3 sm:ml-6 pl-8 border-l-2 border-slate-100 space-y-6 relative">
                                        {checkpoints.map((chk, index) => (
                                            <div 
                                                key={chk.id} 
                                                className="relative bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group flex flex-col gap-4"
                                            >
                                                {/* Timeline Dot */}
                                                <div className="absolute -left-[41px] top-8 w-5 h-5 rounded-full bg-[#FDFBF7] border-[5px] border-amber-400 shadow-sm group-hover:scale-125 transition-transform"></div>

                                                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                                                    <div className="space-y-2.5 min-w-0 flex-1">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 text-amber-700 font-bold text-[10px] uppercase tracking-widest shadow-sm">
                                                                {chk.versionId || `ID: ${chk.id.split('_').pop().substring(0,6)}`}
                                                            </span>
                                                            <span className="font-black text-brown-900 text-lg truncate">
                                                                {chk.versionTag}
                                                            </span>
                                                            {chk.isPartial && (
                                                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                                                    <Layers className="w-3 h-3" /> Pacote Parcial
                                                                </span>
                                                            )}
                                                            {index === 0 && (
                                                                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/60 text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Atual
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {chk.description && (
                                                            <p className="text-sm text-brown-600 line-clamp-2">
                                                                {chk.description}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center gap-4 text-xs text-brown-500 font-medium pt-1 flex-wrap">
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5" /> {new Date(chk.createdAt).toLocaleString('pt-BR')}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <User className="w-3.5 h-3.5" /> {chk.author || 'Professor(a)'}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50/50 border border-amber-100 px-2.5 py-1 rounded-xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]">
                                                                <FileText className="w-3.5 h-3.5" /> {chk.stats?.totalActivities || (chk.tabs || []).length} estúdios
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 shrink-0 self-end xl:self-center">
                                                        <button
                                                            onClick={async () => {
                                                                const fullChk = await IndexedDBService.getCheckpointData(chk.id);
                                                                VersionedBackupService.exportJsonFile(fullChk, { classes: fullChk.classes || classes });
                                                            }}
                                                            className="px-4 py-2 rounded-xl bg-white text-brown-600 font-bold text-sm border border-slate-200 hover:bg-brown-50 hover:text-brown-900 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                                                        >
                                                            <Download className="w-4 h-4" /> .json
                                                        </button>
                                                        
                                                        <button
                                                            onClick={() => setExpandedImportId(expandedImportId === chk.id ? null : chk.id)}
                                                            className={`px-5 py-2 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${expandedImportId === chk.id ? 'bg-brown-100 text-brown-800' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/20 hover:shadow-lg hover:-translate-y-0.5'}`}
                                                        >
                                                            <Upload className="w-4 h-4" /> 
                                                            {expandedImportId === chk.id ? 'Cancelar' : 'Restaurar / Importar'}
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteCheckpoint(chk.id)}
                                                            className="p-2.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                            title="Excluir checkpoint"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Expanded Import Panel */}
                                                {expandedImportId === chk.id && (
                                                    <div className="mt-2 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                                                        <p className="text-sm font-bold text-brown-900 mb-3 text-center">Como você deseja importar este pacote?</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <button 
                                                                onClick={async () => {
                                                                    if (await confirmDialog('Atenção: O universo atual será limpo e substituído pelas atividades deste pacote. Confirmar?')) {
                                                                        const fullChk = await IndexedDBService.getCheckpointData(chk.id);
                                                                        onRestoreTabs(fullChk.tabs || [], fullChk.classes && fullChk.classes.length > 0 ? fullChk.classes : classes);
                                                                        setExpandedImportId(null);
                                                                        onClose();
                                                                    }
                                                                }}
                                                                className="text-left p-4 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all group cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-2 text-red-700 font-black mb-1">
                                                                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    Substituir Universo Atual
                                                                </div>
                                                                <p className="text-xs text-red-800 leading-tight">Limpa as atividades que estão abertas agora e carrega <strong>apenas</strong> as que estão neste pacote.</p>
                                                            </button>

                                                            <button
                                                                onClick={async () => {
                                                                    const fullChk = await IndexedDBService.getCheckpointData(chk.id);
                                                                    onMergeTabs(fullChk.tabs || [], fullChk.classes && fullChk.classes.length > 0 ? fullChk.classes : classes);
                                                                    setExpandedImportId(null);
                                                                    onClose();
                                                                }}
                                                                className="text-left p-4 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all group cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-2 text-green-700 font-black mb-1">
                                                                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                    </div>
                                                                    Adicionar (Mesclar)
                                                                </div>
                                                                <p className="text-xs text-green-800 leading-tight">As atividades deste pacote serão <strong>adicionadas</strong> junto com as que você já tem abertas.</p>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- ABA 2: INSPECIONAR --- */}
                    {activeTab === 'inspect' && (
                        <div className="space-y-8">
                            
                            <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-[2rem] p-10 text-center bg-white hover:bg-amber-50/30 transition-all cursor-pointer group relative">
                                <input type="file" accept=".json,.dracker" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <span className="font-black text-brown-900 text-xl">
                                            Arraste ou clique para selecionar
                                        </span>
                                        <p className="text-sm text-brown-500 mt-1">
                                            Suporta backups .json (otimizados) ou arquivos legados (.dracker)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {importError && (
                                <div className="p-5 rounded-2xl bg-red-50 border border-red-100 text-red-800 flex items-center gap-3">
                                    <AlertTriangle className="w-6 h-6 shrink-0 text-red-500" />
                                    <span className="text-sm font-bold">{importError}</span>
                                </div>
                            )}

                            {inspectedBackup && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    
                                    {/* Card Metadados */}
                                    <div className="bg-brown-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs">
                                                        {inspectedBackup.snapshot?.versionId || 'v3.0'}
                                                    </span>
                                                    <h4 className="text-2xl font-black tracking-tight">
                                                        {inspectedBackup.snapshot?.versionTag || 'Backup Inspecionado'}
                                                    </h4>
                                                </div>
                                                <p className="text-sm text-brown-300">
                                                    {inspectedBackup.snapshot?.description || 'Arquivo importado do computador.'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm bg-white/10 px-6 py-4 rounded-2xl backdrop-blur-sm border border-white/5">
                                                <div className="space-y-1 text-center">
                                                    <p className="text-brown-400 font-medium text-xs uppercase tracking-wider">Atividades</p>
                                                    <p className="font-black text-white text-lg">
                                                        {inspectedBackup.tabs?.length || 0}
                                                    </p>
                                                </div>
                                                <div className="h-10 w-px bg-white/10"></div>
                                                <div className="space-y-1 text-center">
                                                    <p className="text-brown-400 font-medium text-xs uppercase tracking-wider">Tamanho</p>
                                                    <p className="font-bold text-amber-300">
                                                        {inspectedBackup.snapshot?.stats?.sizeInKB || 0} KB
                                                    </p>
                                                </div>
                                                <div className="h-10 w-px bg-white/10"></div>
                                                <div className="space-y-1 text-center">
                                                    <p className="text-brown-400 font-medium text-xs uppercase tracking-wider">Data</p>
                                                    <p className="font-bold text-white">
                                                        {inspectedBackup.snapshot?.createdAt ? new Date(inspectedBackup.snapshot.createdAt).toLocaleDateString('pt-BR') : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lista para seleção */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <h4 className="font-black text-brown-900 flex items-center gap-2">
                                                <CheckSquare className="w-5 h-5 text-amber-500" /> Selecione o que deseja usar:
                                            </h4>
                                            <button onClick={toggleSelectAll} className="text-sm font-bold text-brown-500 hover:text-brown-800 transition-colors cursor-pointer">
                                                {selectedActivityIds.size === inspectedBackup.tabs?.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2 pb-2">
                                            {inspectedBackup.tabs?.map((tab, idx) => {
                                                const isSelected = selectedActivityIds.has(tab.id);
                                                return (
                                                    <div
                                                        key={tab.id || idx}
                                                        onClick={() => toggleSelectActivity(tab.id)}
                                                        className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                                                            isSelected ? 'bg-amber-50 border-amber-400 shadow-md scale-[1.01]' : 'bg-white border-slate-100 hover:border-amber-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-300'}`}>
                                                                {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-black text-brown-900 truncate">
                                                                    {tab.title || 'Atividade Sem Título'}
                                                                </p>
                                                                <p className="text-xs text-brown-500 font-bold uppercase tracking-wider mt-0.5">
                                                                    Estúdio: {tab.type || 'Padrão'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onOpenSingleActivity) onOpenSingleActivity(tab, inspectedBackup?.classes);
                                                                else if (onMergeTabs) onMergeTabs([tab], inspectedBackup?.classes);
                                                                onClose();
                                                            }}
                                                            className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-brown-700 font-bold text-xs hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-colors cursor-pointer"
                                                        >
                                                            Abrir Só Esta
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Ações Finais (Mais intuitivas) */}
                                    <div className="pt-6 border-t border-slate-200/50 flex flex-col gap-4">
                                        <p className="text-sm font-bold text-brown-900 text-center mb-2">O que você deseja fazer com as atividades selecionadas?</p>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Opção 1: Adicionar (Mesclar) */}
                                            <button
                                                onClick={executeMergeSelected}
                                                disabled={selectedActivityIds.size === 0}
                                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all text-green-900 text-center disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                    <Plus className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <span className="font-black block">Juntar com as Atuais</span>
                                                    <span className="text-xs text-green-700 mt-1 block leading-tight">Adiciona à sua tela atual sem apagar o que você já fez.</span>
                                                </div>
                                            </button>

                                            {/* Opção 2: Substituir */}
                                            <button
                                                onClick={executeReplaceAll}
                                                disabled={selectedActivityIds.size === 0}
                                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all text-red-900 text-center disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                                </div>
                                                <div>
                                                    <span className="font-black block">Apagar e Usar Estas</span>
                                                    <span className="text-xs text-red-700 mt-1 block leading-tight">Limpa sua tela e carrega apenas as selecionadas no lugar.</span>
                                                </div>
                                            </button>

                                            {/* Opção 3: Novo Projeto */}
                                            <button
                                                onClick={handleCreateNewProjectFromInspect}
                                                disabled={selectedActivityIds.size === 0}
                                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition-all text-amber-900 text-center disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                    <Layers className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <span className="font-black block">Abrir Novo Projeto</span>
                                                    <span className="text-xs text-amber-800 mt-1 block leading-tight">Abre estas atividades em uma aba isolada sem mexer no atual.</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
