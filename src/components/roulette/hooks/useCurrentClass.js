import { useMemo } from 'react';

export const useCurrentClass = (classes, classId, activeActivity) => {
    return useMemo(() => {
        // 1. Se existir turma vinculada na lista global de turmas do professor
        if (classes && classes.length > 0) {
            const found = classes.find(c => c.id === classId);
            if (found) {
                return { ...found, groups: Array.isArray(found.groups) ? found.groups : [] };
            }

            // 2. Se a aba ativa tiver classData próprio salvo nela, prioriza ela antes de dar fallback para classes[0]
            if (activeActivity?.classData && (activeActivity.classData.id === classId || !classId)) {
                return {
                    ...activeActivity.classData,
                    groups: Array.isArray(activeActivity.classData.groups) ? activeActivity.classData.groups : []
                };
            }
            if (activeActivity?.classData && activeActivity.classData.students?.length > 0) {
                return {
                    ...activeActivity.classData,
                    groups: Array.isArray(activeActivity.classData.groups) ? activeActivity.classData.groups : []
                };
            }

            // 3. Fallback para a primeira turma cadastrada caso classId não seja encontrado
            const first = classes[0];
            return { ...first, groups: Array.isArray(first.groups) ? first.groups : [] };
        }

        // Se não houver turmas no navegador mas a atividade possui classData anexada
        if (activeActivity?.classData && (activeActivity.classData.students?.length > 0 || activeActivity.classData.name)) {
            return {
                ...activeActivity.classData,
                groups: Array.isArray(activeActivity.classData.groups) ? activeActivity.classData.groups : []
            };
        }

        // Se não houver turmas cadastradas no navegador (ex: Vercel ou cache limpo),
        // constrói uma turma automática para que a roleta possa ser visualizada e jogada imediatamente
        const questionsList = activeActivity?.questions || [];
        let studentsList = [];
        if (activeActivity?.items && activeActivity.items.length > 0) {
            studentsList = activeActivity.items.map((item, idx) => ({
                id: item.id || `std_auto_${idx}_${Date.now()}`,
                name: item.name || `Aluno ${idx + 1}`,
                status: item.active !== false ? 'active' : 'removed',
                hits: item.hits || 0,
                misses: item.misses || 0,
                history: []
            }));
        } else if (questionsList.length > 0) {
            studentsList = questionsList.map((q, idx) => ({
                id: `std_auto_${idx}_${Date.now()}`,
                name: q.name || `Aluno ${idx + 1}`,
                status: 'active',
                hits: 0,
                misses: 0,
                history: []
            }));
        } else {
            studentsList = ['Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda'].map((name, idx) => ({
                id: `std_auto_${idx}_${Date.now()}`,
                name,
                status: 'active',
                hits: 0,
                misses: 0,
                history: []
            }));
        }

        return {
            id: classId || 'class_auto_' + (activeActivity?.id || Date.now()),
            name: activeActivity?.topic ? `Turma: ${activeActivity.topic}` : (activeActivity?.title || 'Turma da Roleta'),
            students: studentsList,
            groups: []
        };
    }, [classes, classId, activeActivity]);
};
