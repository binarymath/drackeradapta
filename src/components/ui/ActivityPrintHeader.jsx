import React from 'react';

export const ActivityPrintHeader = ({
    title,
    subtitle = "ATIVIDADE DE AVALIAÇÃO",
    introText,
    pills = [],
    className = ""
}) => {
    return (
        <div className={`w-full bg-white mb-4 font-sans text-left ${className}`}>
            <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <img
                        src="/dracker_character.png"
                        alt="Drácker"
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                        <div className="text-[9px] sm:text-[10px] font-extrabold tracking-[0.25em] uppercase text-amber-800 mb-0.5">
                            {subtitle}
                        </div>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-black uppercase text-slate-900 m-0 leading-tight">
                            {title || 'Atividade'}
                        </h1>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 min-w-[250px] sm:min-w-[280px] pt-1 w-full sm:w-auto flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                        <span className="whitespace-nowrap">Aluno(a):</span>
                        <div className="flex-1 border-b border-slate-600 h-3.5 min-w-[100px]"></div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                        <span className="whitespace-nowrap">Data:</span>
                        <div className="flex-1 border-b border-slate-600 h-3.5 min-w-[40px]"></div>
                        <span className="ml-1 whitespace-nowrap">Turma:</span>
                        <div className="flex-1 border-b border-slate-600 h-3.5 min-w-[40px]"></div>
                    </div>
                </div>
            </div>

            {introText && (
                <p className="text-[11.5px] text-slate-600 font-medium my-2 pl-2.5 border-l-[3px] border-amber-600 italic leading-relaxed text-left">
                    {introText}
                </p>
            )}

            {pills && pills.length > 0 && (
                <div className="flex gap-1.5 flex-wrap my-2">
                    {pills.map((pill, idx) => (
                        <span key={idx} className="text-[10.5px] font-bold text-amber-900 bg-amber-50/50 border border-amber-400 rounded-full px-2.5 py-0.5">
                            {pill}
                        </span>
                    ))}
                </div>
            )}

            <div className="border-t-2 border-slate-900 w-full mt-2 mb-0" />
        </div>
    );
};
