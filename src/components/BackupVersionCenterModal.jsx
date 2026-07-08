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
    HardDrive,
    Info
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Badge } from './ui/Badge';
import { VersionedBackupService } from '../services/VersionedBackupService';

export const BackupVersionCenterModal = ({
    isOpen,
    onClose,
    currentTabs = [],
    onRestoreTabs,
    onMergeTabs,
    initialTab = 'timeline',
    initialFileContent = null
}) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [checkpoints, setCheckpoints] = useState([]);
    
    // Form para novo checkpoint
    const [newTag, setNewTag] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newAuthor, setNewAuthor] = useState('Professor(a)');
    const [stripImages, setStripImages] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Estado para importação / inspeção de arquivo
    const [inspectedBackup, setInspectedBackup] = useState(null);
    const [selectedActivityIds, setSelectedActivityIds] = useState(new Set());
    const [importError, setImportError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadCheckpoints();
            setActiveTab(initialTab);
            if (initialFileContent) {
                handleParseContent(initialFileContent);
                setActiveTab('inspect');
            }
        }
    }, [isOpen, initialTab, initialFileContent]);

    const loadCheckpoints = () => {
        setCheckpoints(VersionedBackupService.getCheckpoints());
    };

    const handleCreateCheckpoint = (e) => {
        if (e) e.preventDefault();
        if (!currentTabs || currentTabs.length === 0) {
            alert('Não há atividades na área de trabalho para criar um checkpoint.');
            return;
        }

        setIsCreating(true);
        try {
            VersionedBackupService.saveCheckpoint(currentTabs, {
                versionTag: newTag || `Versão ${checkpoints.length + 1}.0 - ${new Date().toLocaleDateString('pt-BR')}`,
                description: newDesc || `Backup gerado pelo usuário com ${currentTabs.length} atividade(s).`,
                stripImages,
                author: newAuthor || 'Professor(a)'
            });
            loadCheckpoints();
            setNewTag('');
            setNewDesc('');
        } catch (err) {
            console.error(err);
            alert('Erro ao criar checkpoint: ' + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteCheckpoint = (id) => {
        if (window.confirm('Tem certeza que deseja excluir este checkpoint da linha do tempo local?')) {
            VersionedBackupService.deleteCheckpoint(id);
            loadCheckpoints();
        }
    };

    const handleExportCurrent = () => {
        if (!currentTabs || currentTabs.length === 0) {
            alert('Não há atividades na área de trabalho para exportar.');
            return;
        }
        VersionedBackupService.exportDrackerFile(currentTabs, {
            isRawTabs: true,
            metadata: {
                versionTag: `Trabalho Atual (${new Date().toLocaleDateString('pt-BR')})`,
                description: `Backup contendo ${currentTabs.length} atividade(s).`,
                stripImages,
                author: newAuthor || 'Professor(a)'
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

    const handleParseContent = (contentStr) => {
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
            if (window.confirm(`Este arquivo é um Pacote de Histórico com ${parsed.totalCheckpoints} checkpoints. Deseja importá-los para sua Linha do Tempo local?`)) {
                parsed.checkpoints.forEach(chk => {
                    const tabs = chk.tabs || chk.activitiesData || [];
                    VersionedBackupService.saveCheckpoint(tabs, {
                        versionTag: chk.versionTag || chk.snapshot?.versionTag,
                        description: chk.description || chk.snapshot?.description,
                        stripImages: chk.stripImages ?? true,
                        author: chk.author || chk.snapshot?.author
                    });
                });
                loadCheckpoints();
                setActiveTab('timeline');
                alert('Histórico de checkpoints importado com sucesso!');
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

    const executeReplaceAll = () => {
        if (!inspectedBackup || !inspectedBackup.tabs) return;
        if (window.confirm(`Atenção: Substituir tudo irá trocar suas atividades atuais pelas ${inspectedBackup.tabs.length} atividades deste backup. Confirmar Rollback Total?`)) {
            onRestoreTabs(inspectedBackup.tabs);
            onClose();
        }
    };

    const executeMergeSelected = () => {
        if (!inspectedBackup || !inspectedBackup.tabs) return;
        const selected = inspectedBackup.tabs.filter(t => selectedActivityIds.has(t.id));
        if (selected.length === 0) {
            alert('Selecione pelo menos uma atividade para mesclar.');
            return;
        }
        onMergeTabs(selected);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-brown-200">
                
                {/* Cabeçalho do Modal */}
                <div className="px-6 py-5 bg-gradient-to-r from-brown-900 via-brown-850 to-brown-800 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-300 shadow-inner">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold tracking-tight">Central de Versões e Backups (`.dracker`)</h2>
                            <p className="text-xs text-amber-100/80 font-medium">
                                Sanitarização inteligente ultra-leve • Linha do tempo local • Restauração seletiva
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Abas de Navegação */}
                <div className="flex border-b border-brown-200 bg-brown-50/70 px-6 pt-2 gap-2 shrink-0">
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`px-4 py-3 rounded-t-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'timeline'
                                ? 'bg-white text-brown-900 border-x border-t border-brown-200 shadow-sm'
                                : 'text-brown-600 hover:bg-brown-100/60'
                        }`}
                    >
                        <Layers className="w-4 h-4 text-amber-600" />
                        Linha do Tempo (Snapshots)
                        <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-extrabold">
                            {checkpoints.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('inspect')}
                        className={`px-4 py-3 rounded-t-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                            activeTab === 'inspect'
                                ? 'bg-white text-brown-900 border-x border-t border-brown-200 shadow-sm'
                                : 'text-brown-600 hover:bg-brown-100/60'
                        }`}
                    >
                        <Upload className="w-4 h-4 text-amber-600" />
                        Inspecionar / Restaurar Arquivo
                        {inspectedBackup && (
                            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 font-extrabold animate-pulse">
                                Carregado
                            </span>
                        )}
                    </button>
                </div>

                {/* Corpo do Modal */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    
                    {/* --- ABA 1: LINHA DO TEMPO (CHECKPOINTS) --- */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-6">
                            
                            {/* Formulário para Novo Checkpoint e Exportação Rápida */}
                            <div className="bg-brown-50/80 p-5 rounded-2xl border border-brown-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-brown-900 flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-amber-600" /> Criar Checkpoint ou Baixar Trabalho Atual
                                    </h3>
                                    <Badge variant="warning" className="text-xs">
                                        <HardDrive className="w-3 h-3 mr-1" /> {currentTabs.length} atividade(s) ativas
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input
                                        label="🏷️ Nome / Tag da Versão"
                                        placeholder="Ex: v2.0 - Aula de Frações Pronta"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        className="bg-white"
                                    />
                                    <Input
                                        label="👤 Autor do Trabalho"
                                        placeholder="Professor(a)"
                                        value={newAuthor}
                                        onChange={(e) => setNewAuthor(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                                <TextArea
                                    label="📝 Descrição ou Anotações da Versão (Opcional)"
                                    placeholder="O que mudou desde o último backup?"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    rows={2}
                                    className="bg-white !resize-none"
                                />

                                {/* Toggle Modo Leve */}
                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-brown-800">
                                        <input
                                            type="checkbox"
                                            checked={stripImages}
                                            onChange={(e) => setStripImages(e.target.checked)}
                                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                        />
                                        <div>
                                            <span className="font-bold">✨ Modo Otimizado Leve (.dracker)</span>
                                            <p className="text-xs text-brown-600">
                                                Descarte automático de buffers temporários e mídias Base64 pesadas (redução de até 90% do peso).
                                            </p>
                                        </div>
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="secondary"
                                            onClick={handleExportCurrent}
                                            className="font-bold text-xs"
                                            title="Baixar arquivo .dracker direto no computador"
                                        >
                                            <Download className="w-4 h-4 mr-1.5 text-brown-700" />
                                            Baixar `.dracker` Atual
                                        </Button>
                                        <Button
                                            variant="primary"
                                            onClick={handleCreateCheckpoint}
                                            disabled={isCreating || currentTabs.length === 0}
                                            className="font-bold text-xs shadow-md"
                                        >
                                            <Save className="w-4 h-4 mr-1.5" />
                                            Salvar Checkpoint na Linha do Tempo
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de Checkpoints na Linha do Tempo */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-brown-900 text-sm flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-brown-600" /> Histórico de Snapshots Locais
                                    </h3>
                                    {checkpoints.length > 0 && (
                                        <button
                                            onClick={() => VersionedBackupService.exportHistoryPack()}
                                            className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1.5 cursor-pointer underline decoration-amber-400"
                                            title="Baixar todos os checkpoints em um único arquivo de backup"
                                        >
                                            <Archive className="w-3.5 h-3.5" /> Baixar Pacote Completo do Histórico (`.dracker-pack`)
                                        </button>
                                    )}
                                </div>

                                {checkpoints.length === 0 ? (
                                    <div className="p-8 text-center bg-brown-50/50 rounded-2xl border border-dashed border-brown-200">
                                        <Info className="w-8 h-8 text-brown-400 mx-auto mb-2" />
                                        <p className="font-bold text-brown-700">Nenhum checkpoint salvo ainda na linha do tempo.</p>
                                        <p className="text-xs text-brown-500 mt-1">
                                            Crie checkpoints antes de fazer alterações importantes para poder restaurá-las com 1 clique.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {checkpoints.map((chk, index) => (
                                            <div 
                                                key={chk.id} 
                                                className="bg-white p-4 rounded-2xl border border-brown-200 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                                            >
                                                <div className="space-y-1.5 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2.5 flex-wrap">
                                                        <span className="px-2.5 py-1 rounded-lg bg-brown-900 text-amber-200 font-extrabold text-xs tracking-wide">
                                                            {chk.versionId}
                                                        </span>
                                                        <span className="font-extrabold text-brown-900 text-[15px] truncate">
                                                            {chk.versionTag}
                                                        </span>
                                                        {index === 0 && (
                                                            <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-800 text-[11px] font-extrabold">
                                                                Mais recente
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {chk.description && (
                                                        <p className="text-xs text-brown-700 line-clamp-2">
                                                            {chk.description}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-4 text-xs text-brown-500 font-medium pt-0.5">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {new Date(chk.createdAt).toLocaleString('pt-BR')}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" /> {chk.author || 'Professor(a)'}
                                                        </span>
                                                        <span className="flex items-center gap-1 font-bold text-amber-800">
                                                            <FileText className="w-3 h-3" /> {chk.stats?.totalActivities || (chk.tabs || []).length} atividades
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded bg-brown-100 font-mono font-bold text-[11px] text-brown-800">
                                                            ⚖️ {chk.stats?.sizeInKB || VersionedBackupService.calculateSizeKB(chk)} KB
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => VersionedBackupService.exportDrackerFile(chk)}
                                                        className="text-xs font-bold text-brown-700 hover:bg-brown-100"
                                                        title="Baixar versão como .dracker"
                                                    >
                                                        <Download className="w-4 h-4 mr-1" /> Baixar `.dracker`
                                                    </Button>
                                                    
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => {
                                                            if (window.confirm(`Deseja restaurar sua área de trabalho para o checkpoint "${chk.versionTag}"?`)) {
                                                                onRestoreTabs(chk.tabs || []);
                                                                onClose();
                                                            }
                                                        }}
                                                        className="text-xs font-bold shadow-xs bg-amber-600 hover:bg-amber-700"
                                                        title="Restaurar instantaneamente"
                                                    >
                                                        ⚡ Restaurar
                                                    </Button>

                                                    <button
                                                        onClick={() => handleDeleteCheckpoint(chk.id)}
                                                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                                        title="Excluir checkpoint"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- ABA 2: INSPECIONAR / IMPORTAR ARQUIVO --- */}
                    {activeTab === 'inspect' && (
                        <div className="space-y-6">
                            
                            {/* Área de Seleção de Arquivo */}
                            <div className="border-2 border-dashed border-brown-300 hover:border-amber-500 rounded-3xl p-6 text-center bg-brown-50/50 hover:bg-amber-50/20 transition-all">
                                <label className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="font-extrabold text-brown-900 text-base underline decoration-amber-400">
                                            Clique aqui para selecionar seu arquivo
                                        </span>
                                        <p className="text-xs text-brown-600 mt-0.5">
                                            Suporta arquivos `.dracker` (versionados otimizados) ou `.json` de backups anteriores
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        accept=".dracker,.json"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {importError && (
                                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
                                    <span className="text-sm font-bold">{importError}</span>
                                </div>
                            )}

                            {/* Metadados e Lista de Atividades Inspecionadas */}
                            {inspectedBackup && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    
                                    {/* Cartão de Metadados da Versão */}
                                    <div className="bg-gradient-to-br from-brown-900 to-brown-950 text-white p-5 rounded-2xl shadow-md border border-brown-700">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-brown-950 font-extrabold text-xs">
                                                        {inspectedBackup.snapshot?.versionId || 'v3.0'}
                                                    </span>
                                                    <h4 className="text-lg font-extrabold text-white tracking-tight">
                                                        {inspectedBackup.snapshot?.versionTag || 'Backup Inspecionado'}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-brown-200">
                                                    {inspectedBackup.snapshot?.description || 'Nenhuma descrição adicional informada.'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs bg-white/10 px-4 py-2.5 rounded-xl border border-white/15">
                                                <div className="space-y-0.5">
                                                    <p className="text-brown-300 font-medium">Peso do Arquivo:</p>
                                                    <p className="font-mono font-bold text-amber-300 text-sm">
                                                        ⚖️ {inspectedBackup.snapshot?.stats?.sizeInKB || 0} KB
                                                    </p>
                                                </div>
                                                <div className="h-6 w-px bg-white/20"></div>
                                                <div className="space-y-0.5">
                                                    <p className="text-brown-300 font-medium">Atividades:</p>
                                                    <p className="font-bold text-white text-sm">
                                                        📦 {inspectedBackup.tabs?.length || 0} estúdios
                                                    </p>
                                                </div>
                                                <div className="h-6 w-px bg-white/20"></div>
                                                <div className="space-y-0.5">
                                                    <p className="text-brown-300 font-medium">Criado em:</p>
                                                    <p className="font-bold text-amber-200">
                                                        {inspectedBackup.snapshot?.createdAt ? new Date(inspectedBackup.snapshot.createdAt).toLocaleDateString('pt-BR') : 'Data n/d'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Seleção de Atividades para Mesclagem ou Restauração */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-brown-900 text-sm flex items-center gap-2">
                                                <CheckSquare className="w-4 h-4 text-amber-600" /> Selecione as Atividades que Deseja Restaurar ou Mesclar:
                                            </h4>
                                            <button
                                                onClick={toggleSelectAll}
                                                className="text-xs font-bold text-brown-700 hover:text-brown-900 cursor-pointer underline decoration-brown-400"
                                            >
                                                {selectedActivityIds.size === inspectedBackup.tabs?.length
                                                    ? 'Desmarcar Todas'
                                                    : 'Selecionar Todas (`' + inspectedBackup.tabs?.length + '`)'}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                                            {inspectedBackup.tabs?.map((tab, idx) => {
                                                const isSelected = selectedActivityIds.has(tab.id);
                                                return (
                                                    <div
                                                        key={tab.id || idx}
                                                        onClick={() => toggleSelectActivity(tab.id)}
                                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                            isSelected
                                                                ? 'bg-amber-50/60 border-amber-400 shadow-2xs'
                                                                : 'bg-white border-brown-200 hover:bg-brown-50 opacity-70'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            <div className="text-amber-600 shrink-0">
                                                                {isSelected ? (
                                                                    <CheckSquare className="w-5 h-5" />
                                                                ) : (
                                                                    <Square className="w-5 h-5 text-brown-400" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-extrabold text-brown-900 text-sm truncate">
                                                                    {tab.title || 'Atividade Sem Título'}
                                                                </p>
                                                                <p className="text-xs text-brown-500 font-medium uppercase tracking-wider">
                                                                    Estúdio: {tab.type || 'Padrão'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-brown-100 text-brown-700">
                                                            #{idx + 1}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Botões Finais de Restauração */}
                                    <div className="pt-4 border-t border-brown-200 flex flex-col md:flex-row items-center justify-between gap-3">
                                        <p className="text-xs text-brown-600 font-medium">
                                            💡 <strong className="text-brown-800">Dica:</strong> Mesclar preserva suas abas atuais, enquanto Substituir Tudo faz um rollback completo.
                                        </p>
                                        
                                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                            <Button
                                                variant="secondary"
                                                onClick={executeMergeSelected}
                                                disabled={selectedActivityIds.size === 0}
                                                className="font-bold text-xs shadow-xs"
                                            >
                                                ➕ Mesclar Selecionadas (`{selectedActivityIds.size}`)
                                            </Button>

                                            <Button
                                                variant="danger"
                                                onClick={executeReplaceAll}
                                                className="font-bold text-xs shadow-md bg-brown-900 hover:bg-brown-950 text-white"
                                            >
                                                ⚡ Substituir Sistema (`Rollback Total`)
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Rodapé do Modal */}
                <div className="px-6 py-4 bg-brown-100/60 border-t border-brown-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-xs text-brown-700 font-medium">
                        <CheckCircle className="w-4 h-4 text-green-600" /> Formato de Arquivo Garantido: <strong className="font-mono">.dracker</strong> (Compressão Sanitarizada)
                    </div>
                    <Button variant="ghost" onClick={onClose} className="font-bold text-xs">
                        Fechar Central
                    </Button>
                </div>
            </div>
        </div>
    );
};
