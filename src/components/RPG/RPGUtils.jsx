
import React from 'react';
import { Shield, PenTool, Mic, Search, Brain, Heart, Compass } from 'lucide-react';

export const CLASS_ROLES = [
    { id: 1, name: "Guardião", role: "Líder", description: "Lidera o grupo, mantém o foco e garante a participação de todos.", icon: <Shield size={20} className="text-red-500" />, color: "bg-red-50 border-red-200 text-red-900" },
    { id: 2, name: "Escriba", role: "Escritor", description: "Registra as ideias principais e organiza a entrega escrita da guilda.", icon: <PenTool size={20} className="text-yellow-600" />, color: "bg-yellow-50 border-yellow-200 text-yellow-900" },
    { id: 3, name: "Bardo", role: "Orador", description: "Porta-voz do grupo, responsável por apresentar as ideias para a turma.", icon: <Mic size={20} className="text-blue-500" />, color: "bg-blue-50 border-blue-200 text-blue-900" },
    { id: 4, name: "Sábio", role: "Pesquisador", description: "Pesquisador oficial, busca informações e tira dúvidas com o professor.", icon: <Search size={20} className="text-purple-500" />, color: "bg-purple-50 border-purple-200 text-purple-900" },
    { id: 5, name: "Ladino", role: "Estrategista", description: "Estrategista, encontra atalhos e soluções criativas para os problemas.", icon: <Brain size={20} className="text-indigo-500" />, color: "bg-indigo-50 border-indigo-200 text-indigo-900" },
    { id: 6, name: "Druida", role: "Mediador", description: "Mediador, cuida do clima da equipe e resolve conflitos internos.", icon: <Heart size={20} className="text-pink-500" />, color: "bg-pink-50 border-pink-200 text-pink-900" },
    { id: 7, name: "Explorador", role: "Logística", description: "Logística, organiza os materiais e controla o tempo das atividades.", icon: <Compass size={20} className="text-green-600" />, color: "bg-green-50 border-green-200 text-green-900" }
];

export const generateGuildNames = (count) => {
    const pre = ["Ordem", "Guardiões", "Legião", "Mestres", "Clã", "Sábios"];
    const suf = ["do Saber", "da Luz", "do Trovão", "da Caneta", "do Dragão", "da Floresta"];
    const names = [];
    for (let i = 0; i < count; i++) {
        names.push(`${pre[Math.floor(Math.random() * pre.length)]} ${suf[Math.floor(Math.random() * suf.length)]}`);
    }
    return names;
};

// Componente Avatar do Drácker compartilhado ou importado se necessário
// Se quisermos manter simples, exportamos apenas dados.
