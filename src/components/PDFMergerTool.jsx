import React, { useState, useEffect, useRef } from 'react';
import { theme } from '../styles/theme';
import { Button } from './ui/Button';
import {
    Upload,
    Trash2,
    Merge,
    Download,
    AlertCircle,
    Loader2
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- PdfThumbnail Component ---
const PdfThumbnail = ({ file }) => {
    const canvasRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;

        const renderThumbnail = async () => {
            try {
                // Import pdfjs-dist
                const pdfJS = await import('pdfjs-dist');

                // --- Worker Configuration for v5.x ---
                // Version 5 switched to module workers by default and changed the build output structure.
                // We point to the unpkg module version which is robust for pure ESM usage (like Vite).
                const version = pdfJS.version || '5.4.530';

                if (!pdfJS.GlobalWorkerOptions.workerSrc) {
                    // Use module worker (.mjs) for version 5+ to ensure compatibility
                    pdfJS.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
                }

                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfJS.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);

                if (!active) return;

                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = canvasRef.current;

                if (canvas) {
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                    };
                    await page.render(renderContext).promise;
                    setLoading(false);
                }
            } catch (err) {
                console.warn("Thumbnail render error:", err);
                if (active) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        renderThumbnail();

        return () => { active = false; };
    }, [file]);

    if (error) {
        return (
            <div className="w-full aspect-[3/4] bg-brown-50 rounded-lg flex flex-col items-center justify-center text-brown-400 border border-brown-100">
                <span className="text-[10px] font-bold opacity-75">PDF</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-brown-100 rounded-lg overflow-hidden flex items-center justify-center relative border border-brown-200 shadow-inner min-h-[160px]">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 z-10">
                    <Loader2 className="w-6 h-6 text-brown-400 animate-spin" />
                </div>
            )}
            <canvas ref={canvasRef} className="w-full h-auto object-contain" />
        </div>
    );
};

// --- Sortable Item Component ---
const SortablePdfCard = ({ id, file, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative bg-white rounded-xl border ${isDragging ? 'border-brown-400 ring-2 ring-brown-200 opacity-75 z-50 scale-105' : 'border-brown-200 hover:border-brown-400'} p-3 flex flex-col gap-3 transition-all cursor-grab active:cursor-grabbing hover:shadow-lg h-full`}
            {...attributes}
            {...listeners}
        >
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(id);
                    }}
                    className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-500 hover:text-white shadow-sm transition-all border border-red-200"
                    title="Remover arquivo"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Thumbnail */}
            <PdfThumbnail file={file} />

            {/* Info */}
            <div className="w-full px-1 flex flex-col gap-1">
                {/* File Title */}
                <p className="font-bold text-brown-900 text-xs leading-tight break-words" title={file.name}>
                    {file.name}
                </p>
                <div className="flex items-center gap-2 mt-auto pt-2">
                    <span className="text-[10px] text-brown-500 bg-brown-50 px-2 py-0.5 rounded-full border border-brown-100 whitespace-nowrap">
                        {(file.size / 1024).toFixed(0)} KB
                    </span>
                </div>
            </div>
        </div>
    );
};

export const PDFMergerTool = () => {
    const [files, setFiles] = useState([]); // Array of { id, file }
    const [isMerging, setIsMerging] = useState(false);
    const [error, setError] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleFileChange = (e) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
                .filter(f => f.type === 'application/pdf')
                .map(f => ({
                    file: f,
                    id: Math.random().toString(36).substr(2, 9)
                }));

            setFiles(prev => [...prev, ...newFiles]);
            setError(null);
            e.target.value = null;
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setFiles((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const removeFile = (id) => {
        setFiles(files.filter(f => f.id !== id));
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            setError('Selecione pelo menos 2 arquivos para unir.');
            return;
        }

        setIsMerging(true);
        setError(null);

        try {
            let PDFDocument;
            try {
                const pdfLib = await import('pdf-lib');
                PDFDocument = pdfLib.PDFDocument;
            } catch (err) {
                throw new Error("Biblioteca 'pdf-lib' não encontrada.");
            }

            const mergedPdf = await PDFDocument.create();

            for (const fileObj of files) {
                const arrayBuffer = await fileObj.file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `arquivos_unidos_${new Date().getTime()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (err) {
            setError(err.message || 'Erro ao unir PDFs.');
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow border border-brown-200 overflow-hidden">

                {/* Header Section */}
                <div className="bg-white px-6 py-5 border-b border-brown-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brown-600 flex items-center justify-center text-white shadow-md transform -rotate-2">
                            <Merge className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-brown-900">Unir Documentos PDF</h2>
                            <p className="text-sm text-brown-600">Junte seus arquivos (thumbnail disponível)</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    {/* Error Message */}
                    {error && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm ${theme.status.error}`}>
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Upload Area */}
                    <div className="mb-8">
                        {files.length === 0 ? (
                            <label className="block w-full h-40 border-2 border-dashed border-brown-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-brown-50 transition-all group relative overflow-hidden">
                                <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform relative z-10">
                                    <Upload className="w-6 h-6 text-brown-600" />
                                </div>
                                <span className="text-brown-700 font-bold text-sm relative z-10">Clique para selecionar PDFs</span>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    multiple
                                    onChange={handleFileChange}
                                    onClick={(e) => e.target.value = null}
                                    className="hidden"
                                />
                            </label>
                        ) : (
                            <div className="flex justify-between items-center bg-brown-50 p-4 rounded-lg border border-brown-100">
                                <p className="text-sm font-bold text-brown-700">{files.length} arquivos selecionados</p>
                                <div className="flex gap-2">
                                    <label className="cursor-pointer bg-white border border-brown-200 hover:bg-brown-50 text-brown-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                                        <Upload className="w-4 h-4" /> Adicionar
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            multiple
                                            onChange={handleFileChange}
                                            onClick={(e) => e.target.value = null}
                                            className="hidden"
                                        />
                                    </label>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setFiles([])}
                                        className="text-red-500 hover:bg-red-50 text-sm px-3 h-auto"
                                    >
                                        Limpar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Grid Sortable List */}
                    {files.length > 0 && (
                        <div className="mb-8 p-4 bg-brown-50/50 rounded-xl border border-brown-100">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={files.map(f => f.id)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                                        {files.map((fileObj) => (
                                            <SortablePdfCard
                                                key={fileObj.id}
                                                id={fileObj.id}
                                                file={fileObj.file}
                                                onRemove={removeFile}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {/* Actions */}
                    {files.length > 0 && (
                        <div className="flex justify-end pt-4 border-t border-brown-100">
                            <Button
                                onClick={handleMerge}
                                disabled={files.length < 2 || isMerging}
                                className="bg-brown-600 hover:bg-brown-700 text-white min-w-[200px] shadow-md py-2.5"
                                icon={isMerging ? Loader2 : Download}
                                isLoading={isMerging}
                            >
                                {isMerging ? 'Unindo Arquivos...' : 'Baixar PDF Unificado'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
