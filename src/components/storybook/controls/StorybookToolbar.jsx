import { 
    BookOpen, 
    Printer, 
    Maximize2, 
    Minimize2, 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    AlignJustify, 
    Check, 
    Edit3 
} from 'lucide-react';

export const StorybookToolbar = ({
    book,
    targetTextPart,
    setTargetTextPart,
    currentFontScales,
    currentAlignment,
    adjustFontScale,
    setAlignmentForTarget,
    isEditingText,
    setIsEditingText,
    printLayoutMode,
    setPrintLayoutMode,
    handlePrint,
    isFullscreen,
    setIsFullscreen
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 bg-white/95 backdrop-blur-md px-3 sm:px-4 py-2.5 rounded-2xl border border-amber-200/80 shadow-xs no-print w-full shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-white shadow-2xs shrink-0">
                    <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm md:text-base font-black text-brown-950 truncate">
                        {book.title || 'Livro Infantil do Drácker'}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-2 min-w-0 max-w-full sm:shrink-0 overflow-x-auto">
                {/* Barra de Formatação e Edição Rápida */}
                <div className="flex items-center gap-2 bg-stone-50 border border-stone-200/90 rounded-xl p-1 shadow-2xs">
                    {/* Seletor de Elemento Textual + Controle de Fonte */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold text-stone-700">
                        <span className="text-stone-400 font-semibold text-[11px] hidden sm:inline">Parte:</span>
                        <select
                            value={targetTextPart}
                            onChange={(e) => setTargetTextPart(e.target.value)}
                            className="bg-white border border-stone-200 text-stone-800 text-[11px] font-bold rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
                            title="Escolha qual parte textual deseja redimensionar"
                        >
                            <option value="text">📖 Narrativa / Texto</option>
                            <option value="title">🏷️ Título</option>
                            <option value="dialogue">💬 Falas dos Personagens</option>
                            <option value="question">❓ Desafio de Atenção</option>
                            <option value="image">🖼️ Logo / Imagem</option>
                            <option value="all">✨ Todos os Textos</option>
                        </select>

                        <div className="w-px h-3.5 bg-stone-200 mx-0.5 hidden sm:block" />

                        <button
                            type="button"
                            onClick={() => adjustFontScale(-10)}
                            className="px-1.5 py-0.5 rounded hover:bg-white text-stone-800 font-black cursor-pointer transition-colors"
                            title="Diminuir tamanho da fonte ou imagem selecionada"
                        >
                            A-
                        </button>
                        <span className="text-indigo-600 font-mono font-extrabold text-xs min-w-[36px] text-center" title="Percentual da fonte ou imagem selecionada">
                            {targetTextPart === 'all' ? `${currentFontScales.text}%` : `${currentFontScales[targetTextPart] || 100}%`}
                        </span>
                        <button
                            type="button"
                            onClick={() => adjustFontScale(10)}
                            className="px-1.5 py-0.5 rounded hover:bg-white text-stone-800 font-black cursor-pointer transition-colors"
                            title="Aumentar tamanho da fonte selecionada"
                        >
                            A+
                        </button>
                    </div>

                    {/* Alinhamentos conforme parte selecionada */}
                    <div className="flex items-center gap-0.5 border-l border-stone-200 pl-1">
                        <button
                            type="button"
                            onClick={() => setAlignmentForTarget('left')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentAlignment === 'left' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                            title={`Alinhar ${targetTextPart === 'all' ? 'todos os textos' : 'elemento selecionado'} à esquerda`}
                        >
                            <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setAlignmentForTarget('center')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentAlignment === 'center' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                            title={`Centralizar ${targetTextPart === 'all' ? 'todos os textos' : 'elemento selecionado'}`}
                        >
                            <AlignCenter className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setAlignmentForTarget('right')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentAlignment === 'right' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                            title={`Alinhar ${targetTextPart === 'all' ? 'todos os textos' : 'elemento selecionado'} à direita`}
                        >
                            <AlignRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setAlignmentForTarget('justify')}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentAlignment === 'justify' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                            title={`Justificar ${targetTextPart === 'all' ? 'todos os textos' : 'elemento selecionado'}`}
                        >
                            <AlignJustify className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Botão de Edição Lápis */}
                    <div className="border-l border-stone-200 pl-1">
                        <button
                            type="button"
                            onClick={() => setIsEditingText(prev => !prev)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${isEditingText ? 'bg-amber-500 text-white shadow-2xs' : 'text-indigo-600 hover:bg-indigo-50'}`}
                            title={isEditingText ? 'Concluir edição' : 'Editar texto da história'}
                        >
                            {isEditingText ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                {/* Seletor do Modo de Impressão */}
                <div className="flex items-center gap-1 bg-stone-50 border border-stone-200/90 rounded-xl p-1 shadow-2xs">
                    <select
                        value={printLayoutMode}
                        onChange={(e) => setPrintLayoutMode(e.target.value)}
                        className="bg-white border border-stone-200 text-stone-800 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
                        title="Escolha o modo de montagem da folha de impressão"
                    >
                        <option value="booklet">📖 Modo Livreto (Dobra Frente/Verso)</option>
                        <option value="sequential">📄 Modo Sequencial (Página por Página)</option>
                    </select>
                </div>

                {/* Botão de Impressão Discreto (Apenas Ícone) */}
                <button
                    onClick={handlePrint}
                    className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
                    title={printLayoutMode === 'booklet' 
                        ? 'Imprimir Livreto Frente e Verso (A4)' 
                        : 'Imprimir Páginas Sequenciais (A4 Paisagem)'}
                    aria-label="Imprimir livro"
                >
                    <Printer className="w-4 h-4 text-stone-700" />
                </button>

                {/* Símbolo de Tela Cheia discreto */}
                <button
                    onClick={() => setIsFullscreen(prev => !prev)}
                    className="p-2 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
                    title={isFullscreen ? 'Restaurar visualização normal (Esc)' : 'Ocupar 100% da tela'}
                    aria-label={isFullscreen ? 'Restaurar visualização' : 'Tela cheia'}
                >
                    {isFullscreen ? (
                        <Minimize2 className="w-4 h-4 text-stone-700" />
                    ) : (
                        <Maximize2 className="w-4 h-4 text-stone-700" />
                    )}
                </button>
            </div>
        </div>
    );
};
