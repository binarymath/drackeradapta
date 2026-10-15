import React, { useState, useEffect } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { StudentActivityTrackerModal } from '../modals/StudentActivityTrackerModal';

export const StudentActivityHeaderButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Escuta evento global caso outro local do sistema solicite a abertura do modal
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('dracker_open_student_activity_modal', handleOpen);
        return () => window.removeEventListener('dracker_open_student_activity_modal', handleOpen);
    }, []);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-800 text-xs font-bold transition-all shadow-2xs cursor-pointer group shrink-0 select-none active:scale-95"
                title="Cadastrar / Marcar atividades realizadas pelos alunos (online, impressas ou no caderno)"
            >
                <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform shrink-0" />
                <span>Atividade</span>
            </button>

            <StudentActivityTrackerModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
};
