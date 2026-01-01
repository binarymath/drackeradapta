import React, { useState, useRef } from 'react';
import {
    Eye, Brain, Backpack, Heart, Flame, MessageCircle,
    Users, Zap, BookOpen, Music, Plus,
    X, Trash2, Camera, Download, Upload as UploadIcon,
    Pencil, Check, Map, Ghost, Anchor, Sun, Sparkles,
    Clock, Award, Star, ChevronRight, Calculator, ArrowLeft, ArrowRight,
    Layers, AlertCircle, Grid, ClipboardList, Send, Link
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { determineArchetype } from '../utils/drackerArchetypes';
import { Input, TextArea, Select } from './ui/Input';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';


// --- 1. CONFIGURAÇÕES E DADOS ESTÁTICOS ---
// ... (rest of imports/config)

// ... (previous components)

// Função auxiliar para gerar o HTML do PDF
const generatePDFHTML = (member) => {
    const trails = getTrails(member.gender);
    const selectTrails = trails.filter(t => t.type === 'select');
    const textTrails = trails.filter(t => t.type === 'text');

    // Updated styles for Native Print (A4)
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
        
        @page {
            size: A4;
            margin: 1cm 1.5cm 1cm 2cm; /* Top, Right, Bottom, Left */
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif; 
            color: #431407; 
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .pdf-wrapper { 
            width: 100%;
            max-width: 100%;
            padding: 20px; 
            box-sizing: border-box; 
            line-height: 1.5; 
            position: relative;
        }
        
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #78350f; padding-bottom: 15px; margin-bottom: 25px; }
        .header-left { display: flex; align-items: center; gap: 15px; }
        .logo { width: 60px; height: 60px; object-fit: contain; } 
        .title h1 { font-size: 26px; font-weight: 800; margin: 0; color: #431407; line-height: 1.3; } 
        .title p { font-size: 12px; color: #78350f; margin: 4px 0 0 0; line-height: 1.4; }
        .meta { text-align: right; }
        .label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2; }
        .value { font-size: 14px; font-weight: bold; line-height: 1.4; }
        
        .profile { display: flex; gap: 25px; margin-bottom: 30px; background-color: #fff7ed; padding: 25px; border-radius: 16px; border: 1px solid #fed7aa; align-items: flex-start; }
        .avatar { width: 90px; height: 90px; border-radius: 50%; overflow: hidden; border: 4px solid #78350f; flex-shrink: 0; background-color: #ddd; }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }
        .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
        .name { font-size: 28px; font-weight: 800; margin: 0; color: #431407; line-height: 1.2; }
        .badge { align-self: flex-start; background-color: #78350f; color: white; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: bold; line-height: 1; text-align: center; }
        .desc { font-size: 12px; line-height: 1.5; color: #52525b; font-style: italic; margin: 0; }
        
        h3 { font-size: 15px; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 15px; color: #78350f; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 5px; line-height: 1.4; page-break-after: avoid; }
        
        /* Table Styles for Stability */
        .attributes-table { width: 100%; border-collapse: separate; border-spacing: 6px; margin-bottom: 20px; page-break-inside: auto; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        .attr-cell { width: 33.33%; vertical-align: top; padding: 0; }
        .attr-cell.empty { border: none; background: transparent; }
        
        .card-inner { 
            display: flex; 
            gap: 6px; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 6px; 
            background: white; 
            align-items: center; 
            box-sizing: border-box; 
            page-break-inside: avoid;
        }
        
        .icon { width: 28px; height: 28px; border-radius: 6px; background-color: #fff7ed; display: flex; align-items: center; justify-content: center; color: #78350f; font-size: 14px; font-weight: bold; flex-shrink: 0; }
        .card-content { flex: 1; min-width: 0; }
        .card-label { font-size: 8px; text-transform: uppercase; font-weight: bold; color: #9ca3af; margin-bottom: 2px; display: block; line-height: 1.1; }
        .card-value { font-size: 11px; font-weight: bold; color: #431407; display: block; line-height: 1.2; padding-bottom: 2px; }
        .card-feedback { font-size: 9px; color: #6b7280; display: block; line-height: 1.2; margin-top: 2px; }
        
        .section-title { font-size: 14px; font-weight: bold; color: #78350f; text-transform: uppercase; margin-bottom: 5px; page-break-after: avoid; }
        .divider { border-bottom: 1px solid #d1d5db; margin-top: 5px; margin-bottom: 10px; }
        .log-content { font-size: 12px; color: #374151; white-space: pre-wrap; line-height: 1.4; }
        .obs-row { font-size: 11px; color: #374151; padding: 4px 0; border-bottom: 1px dashed #e5e7eb; display: flex; align-items: flex-start; gap: 5px; page-break-inside: avoid; }
        .obs-meta { font-weight: bold; color: #78350f; white-space: nowrap; }
        
        .page-break { page-break-before: always; margin-top: 30px; }
        .separator { margin-top: 30px; border-top: 1px dashed #d1d5db; padding-top: 20px; }
        
        /* Simulating footer with fixed position for print */
        @media print {
            .footer-placeholder { height: 80px; } /* Push content up */
            .footer { 
                position: fixed; 
                bottom: 0; 
                left: 0; 
                right: 0;
                height: 50px;
                background: white;
                z-index: 1000;
                display: flex; 
                justify-content: space-between; 
                align-items: flex-end; 
                padding-bottom: 10px;
            }
        }
        
        .sig-block { text-align: center; }
        .sig-line { width: 220px; border-bottom: 1px solid #000; margin-bottom: 5px; }
    `;

    // Extract specific answers
    const conquistas = member.answers['conquistas']?.label || 'Sem registro.';
    const destaques = member.answers['destaques']?.label || 'Sem registro.';

    // Generate HTML for stats using TABLE for stability
    const rows = [];
    for (let i = 0; i < selectTrails.length; i += 3) {
        rows.push(selectTrails.slice(i, i + 3));
    }

    const statsHTML = `
        <table class="attributes-table">
            ${rows.map(row => `
                <tr>
                    ${row.map(trail => {
        const ans = member.answers[trail.id];
        return `
                        <td class="attr-cell">
                            <div class="card-inner">
                                <div class="card-content">
                                    <div class="card-label">${trail.title}</div>
                                    <div class="card-value">${ans?.label || '-'}</div>
                                    <div class="card-feedback">${ans?.feedback || ''}</div>
                                </div>
                            </div>
                        </td>`;
    }).join('')}
                    ${row.length < 3 ? '<td class="attr-cell empty"></td>'.repeat(3 - row.length) : ''}
                </tr>
            `).join('')}
        </table>
    `;

    return `
        <html>
        <head><style>${styles}</style></head>
        <body>
            <div class="pdf-wrapper">
                <div class="header">
                    <div class="header-left">
                        <div class="logo"><img src="/dracker_expedition_logo.png" style="width:100%;height:100%;object-fit:contain;"></div>
                        <div class="title">
                            <h1>Ficha de Explorador</h1>
                            <p>Expedição Drácker • Registro Oficial</p>
                        </div>
                    </div>
                    <div class="meta">
                        <div class="label">Data do Registro</div>
                        <div class="value">${member.date}</div>
                    </div>
                </div>

                <div class="profile">
                    <div class="avatar">
                        ${member.photo ? `<img src="${member.photo}">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:40px;color:#78350f;">?</div>'}
                    </div>
                    <div class="info">
                        <h2 class="name">${member.name}</h2>
                        <div class="badge">${member.archetype.title}</div>
                        <p class="desc">"${member.archetype.desc}"</p>
                    </div>
                </div>

                <h3>Atributos e Habilidades</h3>
                ${statsHTML}

                <h3 style="margin-bottom:20px; margin-top: 30px;">Registros do Diário</h3>
                
                <div>
                    <div class="section-title">- CONQUISTAS:</div>
                    <div class="divider"></div>
                    <div class="log-content">${conquistas}</div>
                </div>
                
                <div class="separator"></div>

                <div>
                    <div class="section-title">- DESTAQUES:</div>
                    <div class="divider"></div>
                    <div class="log-content">${destaques}</div>
                </div>

                ${member.registry && member.registry.length > 0 ? `
                <div class="page-break"></div>
                <h3>Observações e Anotações</h3>
                <div class="divider"></div>
                <div style="display:flex; flex-direction:column;">
                    ${member.registry.map(log => `
                    <div class="obs-row">
                        <span class="obs-meta">${log.date} ${log.responsible ? `/ ${log.responsible}` : ''} ${log.subject ? `/ ${log.subject}` : ''}</span>
                        <span style="color:#9ca3af;">•</span>
                        <span>${log.text}</span>
                    </div>`).join('')}
                </div>
                ` : ''}

                <div class="footer-placeholder"></div>
                <div class="footer">
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <div style="font-size:10px; text-transform:uppercase;">Guia da Expedição</div>
                    </div>
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <div style="font-size:10px; text-transform:uppercase;">Pais ou Responsáveis</div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;
};

const ARCHETYPES_CONFIG = {
    'Águia Real': { icon: Star, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    'Lince Veloz': { icon: Zap, color: 'bg-orange-100 text-orange-800 border-orange-300' },
    'Coruja Sábia': { icon: BookOpen, color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    'Arara Festiva': { icon: Music, color: 'bg-pink-100 text-pink-800 border-pink-300' },
    'Raposa Astuta': { icon: Ghost, color: 'bg-brown-200 text-brown-800 border-brown-300' },
    'Panda Gentil': { icon: Heart, color: 'bg-green-100 text-green-800 border-green-300' },
    'Camaleão Criativo': { icon: Users, color: 'bg-teal-100 text-teal-800 border-teal-300' }, // Users as placeholder for Smile if missing
    'Tartaruga Zen': { icon: Anchor, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    'Tatu Viajante': { icon: Map, color: 'bg-brown-100 text-brown-800 border-brown-300' },
    'Vagalume Brilhante': { icon: Sun, color: 'bg-amber-100 text-amber-800 border-amber-300' },
    'Colibri Sonhador': { icon: Sparkles, color: 'bg-purple-100 text-purple-800 border-purple-300' }
};

const getTrails = (gender) => [
    {
        id: 'presenca', type: 'select', title: 'Nível de Presença', icon: <Clock className="w-4 h-4 text-cyan-700" />, color: 'bg-cyan-50 border-cyan-200 text-cyan-900',
        question: `Qual a frequência d${gender === 'F' ? 'a' : 'o'} explorador${gender === 'F' ? 'a' : ''} nas missões?`,
        options: [
            { label: `Explorador${gender === 'F' ? 'a' : ''} Assídu${gender === 'F' ? 'a' : 'o'}`, desc: 'Presente sempre.', value: 'lvl5', feedback: 'Aproveite a presença constante.' },
            { label: `Explorador${gender === 'F' ? 'a' : ''} Constante`, desc: 'Faltas raras.', value: 'lvl4', feedback: 'Mantém bom ritmo.' },
            { label: `Explorador${gender === 'F' ? 'a' : ''} Frequente`, desc: 'Faltas ocasionais.', value: 'lvl3', feedback: 'Atenção às lacunas.' },
            { label: `Explorador${gender === 'F' ? 'a' : ''} Intermitente`, desc: 'Faltas regulares.', value: 'lvl2', feedback: 'Resumos constantes necessários.' },
            { label: `Explorador${gender === 'F' ? 'a' : ''} Viajante`, desc: 'Faltas constantes.', value: 'lvl1', feedback: 'Plano de recuperação urgente.' }
        ]
    },
    {
        id: 'leitura', type: 'select', title: 'Nível de Leitura', icon: <BookOpen className="w-4 h-4 text-indigo-700" />, color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        question: 'Como está o nível de leitura?',
        options: [
            { label: `Guardi${gender === 'F' ? 'ã' : 'ão'} das Letras`, desc: 'Fluente e compreensiva.', value: 'lvl5', feedback: 'Estimule livros complexos.' },
            { label: `Narrador${gender === 'F' ? 'a' : ''} Habilidos${gender === 'F' ? 'a' : 'o'} `, desc: 'Lê bem, poucas dúvidas.', value: 'lvl4', feedback: 'Incentive leitura em voz alta.' },
            { label: 'Explorador de Palavras', desc: 'Frases simples, silaba.', value: 'lvl3', feedback: 'Textos curtos e rimas.' },
            { label: 'Decifrador de Símbolos', desc: 'Reconhece letras/sílabas.', value: 'lvl2', feedback: 'Consciência fonológica.' },
            { label: 'Ouvinte de Lendas', desc: 'Não lê autonomamente.', value: 'lvl1', feedback: 'Contação de histórias.' }
        ]
    },
    {
        id: 'matematica', type: 'select', title: 'Raciocínio Matemático', icon: <Calculator className="w-4 h-4 text-violet-700" />, color: 'bg-violet-50 border-violet-200 text-violet-900',
        question: 'Como resolve problemas lógicos?',
        options: [
            { label: 'Mestre da Lógica', desc: 'Abstração e cálculo mental.', value: 'lvl5', feedback: 'Desafios de lógica avançada.' },
            { label: 'Estrategista Numérico', desc: 'Resolve bem com rascunho.', value: 'lvl4', feedback: 'Explicação do raciocínio.' },
            { label: 'Alquimista dos Números', desc: 'Depende de material concreto.', value: 'lvl3', feedback: 'Transição concreto-abstrato.' },
            { label: 'Aprendiz de Contagem', desc: 'Conta nos dedos.', value: 'lvl2', feedback: 'Jogos de tabuleiro.' },
            { label: 'Iniciado nos Mistérios', desc: 'Dificuldade com quantidades.', value: 'lvl1', feedback: 'Pareamento e classificação.' }
        ]
    },
    {
        id: 'foco', type: 'select', title: 'Foco do Dragão', icon: <Eye className="w-4 h-4 text-amber-700" />, color: 'bg-amber-50 border-amber-200 text-amber-900',
        question: 'Comportamento durante explicação:',
        options: [
            { label: 'Olhar de Águia', desc: 'Foco total.', value: 'lvl5', feedback: 'Pode ajudar o grupo.' },
            { label: 'Voo Panorâmico', desc: 'Boa atenção.', value: 'lvl4', feedback: 'Autonomia ótima.' },
            { label: 'Voo Rasante', desc: 'Oscila, mas volta.', value: 'lvl3', feedback: 'Use palavras-chave.' },
            { label: 'Pouso Constante', desc: 'Interrompe ou levanta.', value: 'lvl2', feedback: 'Sentar perto do professor.' },
            { label: 'Cabeça nas Nuvens', desc: 'Dispersão total.', value: 'lvl1', feedback: 'Contato visual direto.' }
        ]
    },
    {
        id: 'saber', type: 'select', title: 'Estilo de Aprendizagem', icon: <Brain className="w-4 h-4 text-blue-700" />, color: 'bg-blue-50 border-blue-200 text-blue-900',
        question: 'Melhor via de aprendizado:',
        options: [
            { label: 'Ouvidos Atentos', desc: 'Auditivo.', value: 'audio', feedback: 'Debates e áudios.' },
            { label: 'Olhos Curiosos', desc: 'Visual.', value: 'visual', feedback: 'Mapas e imagens.' },
            { label: 'Mãos na Massa', desc: 'Cinestésico.', value: 'kinesthetic', feedback: 'Experimentos.' },
            { label: 'Espírito Lúdico', desc: 'Gamificação.', value: 'play', feedback: 'Jogos.' },
            { label: 'Mente Leitora', desc: 'Leitura/Escrita.', value: 'read', feedback: 'Resumos e livros.' }
        ]
    },
    {
        id: 'social', type: 'select', title: 'Círculo da Amizade', icon: <MessageCircle className="w-4 h-4 text-purple-700" />, color: 'bg-purple-50 border-purple-200 text-purple-900',
        question: 'Interação com a turma:',
        options: [
            { label: 'Liderança Natural', desc: 'Guia o grupo.', value: 'leader', feedback: 'Monitoria.' },
            { label: 'Diplomata', desc: 'Media conflitos.', value: 'mediator', feedback: 'Grupos heterogêneos.' },
            { label: 'Parceiro Leal', desc: 'Colabora bem.', value: 'partner', feedback: 'Trabalho em equipe.' },
            { label: 'Lobo Solitário', desc: 'Prefere sozinho.', value: 'lone', feedback: 'Respeito e incentivo.' },
            { label: 'Explorador Tímido', desc: 'Observa de longe.', value: 'shy', feedback: 'Mediação suave.' }
        ]
    },
    {
        id: 'conduta', type: 'select', title: 'Guardião da Conduta', icon: <AlertCircle className="w-4 h-4 text-red-700" />, color: 'bg-red-50 border-red-200 text-red-900',
        question: 'Organização e regras:',
        options: [
            { label: gender === 'F' ? 'Dama da Harmonia' : 'Cavaleiro da Harmonia', desc: 'Exemplar.', value: 'lvl5', feedback: 'Elogie a postura.' },
            { label: 'Escudeiro Fiel', desc: 'Segue regras bem.', value: 'lvl4', feedback: 'Confiável.' },
            { label: 'Vento da Mudança', desc: 'Questiona às vezes.', value: 'lvl3', feedback: 'Reforce combinados.' },
            { label: 'Trovão Distante', desc: 'Resistência passiva.', value: 'lvl2', feedback: 'Escolhas dirigidas.' },
            { label: 'Tempestade Indomável', desc: 'Desafio aberto.', value: 'lvl1', feedback: 'Diálogo individual.' }
        ]
    },
    {
        id: 'territorio', type: 'select', title: 'Domínio do Território', icon: <Layers className="w-4 h-4 text-brown-700" />, color: 'bg-brown-50 border-brown-200 text-brown-900',
        question: 'Gerenciamento do espaço (mesa):',
        options: [
            { label: `Arquitur${gender === 'F' ? 'a' : 'o'} do Espaço`, desc: 'Limpo e organizado.', value: 'lvl5', feedback: 'Referência.' },
            { label: 'Zelador do Ninho', desc: 'Acumula pouco.', value: 'lvl4', feedback: 'Bom gerenciamento.' },
            { label: 'Acumulador de Tesouros', desc: 'Bagunça produtiva.', value: 'lvl3', feedback: 'Pausas para arrumação.' },
            { label: 'Trilha de Rastros', desc: 'Atrapalha vizinhos.', value: 'lvl2', feedback: 'Seleção de material.' },
            { label: 'Ciclone em Ação', desc: 'Caos total.', value: 'lvl1', feedback: 'Delimitadores físicos.' }
        ]
    },
    {
        id: 'mochila', type: 'select', title: 'Mochila', icon: <Backpack className="w-4 h-4 text-green-700" />, color: 'bg-green-50 border-green-200 text-green-900',
        question: 'Materiais trazidos:',
        options: [
            { label: 'Inventário Completo', desc: 'Tudo pronto.', value: 'lvl5', feedback: 'Exemplar.' },
            { label: 'Bolsa do Mercador', desc: 'Quase tudo.', value: 'lvl4', feedback: 'Responsável.' },
            { label: 'Itens Misturados', desc: 'Desorganizado.', value: 'lvl3', feedback: 'Rotina de checagem.' },
            { label: 'Mochila Furada', desc: 'Esquece essenciais.', value: 'lvl2', feedback: 'Bilhete para casa.' },
            { label: 'Caos Mágico', desc: 'Perde tudo.', value: 'lvl1', feedback: 'Apoio familiar.' }
        ]
    },
    {
        id: 'emocoes', type: 'select', title: 'Emoções', icon: <Heart className="w-4 h-4 text-pink-700" />, color: 'bg-pink-50 border-pink-200 text-pink-900',
        question: 'Reação ao erro:',
        options: [
            { label: 'Escudo de Diamante', desc: 'Resiliência total.', value: 'lvl5', feedback: 'Liderança emocional.' },
            { label: 'Escudo de Madeira', desc: 'Recupera rápido.', value: 'lvl4', feedback: 'Boa estabilidade.' },
            { label: 'Espada Trêmula', desc: 'Reclama, frustra-se.', value: 'lvl3', feedback: 'Errar faz parte.' },
            { label: 'Névoa Cinzenta', desc: 'Isola-se/Triste.', value: 'lvl2', feedback: 'Acolhimento.' },
            { label: 'Vulcão Ativo', desc: 'Explosão imediata.', value: 'lvl1', feedback: 'Retire da tensão.' }
        ]
    },
    {
        id: 'motivacao', type: 'select', title: 'Motivação', icon: <Flame className="w-4 h-4 text-orange-700" />, color: 'bg-orange-50 border-orange-200 text-orange-900',
        question: 'Engajamento:',
        options: [
            { label: 'Fogo Eterno', desc: 'Intrínseca constante.', value: 'lvl5', feedback: 'Autonomia.' },
            { label: 'Tocha Guiada', desc: 'Motiva-se pelo grupo.', value: 'lvl4', feedback: 'Projetos em grupo.' },
            { label: 'Precisa de Lenha', desc: 'Elogio ou nota.', value: 'lvl3', feedback: 'Reforce o esforço.' },
            { label: 'Vela ao Vento', desc: 'Oscila, desiste.', value: 'lvl2', feedback: 'Micro-metas.' },
            { label: 'Brasa Fria', desc: 'Apatia total.', value: 'lvl1', feedback: 'Conexão pessoal.' }
        ]
    },
    {
        id: 'conquistas', type: 'text', title: 'Conquistas', icon: <Award className="w-4 h-4 text-amber-700" />, color: 'bg-amber-50 border-amber-200 text-amber-900',
        question: 'Medalhas e vitórias:', placeholder: 'Ex: Medalha de ouro, Ajudante do dia...'
    },
    {
        id: 'destaques', type: 'text', title: 'Destaques', icon: <Star className="w-4 h-4 text-indigo-700" />, color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        question: 'Disciplinas de destaque:', placeholder: 'Ex: Matemática, Artes, Liderança...'
    }
];



// --- 2. COMPONENTES VISUAIS ---

const DragonIcon = ({ size = 64, className = "", fit = "contain" }) => (
    <img
        src="/dracker_expedition_logo.png"
        alt="Expedição Drácker"
        className={`object - ${fit} drop - shadow - lg hover: scale - 105 transition - transform duration - 300 ${className} `}
        style={{ height: size, width: fit === 'cover' ? size : 'auto', maxWidth: '100%' }}
    />
);

const ArchetypeBadge = ({ type, size = "md", compact = false }) => {
    const config = ARCHETYPES_CONFIG[type] || ARCHETYPES_CONFIG['Colibri Sonhador'];
    const Icon = config.icon || Sparkles;
    const sizeClasses = size === "lg" ? "p-2 text-sm" : compact ? "px-2 py-0.5 text-[10px]" : "p-1.5 text-xs";
    const iconSize = size === "lg" ? 20 : compact ? 12 : 14;

    return (
        <div className={`flex items - center gap - 1.5 rounded - lg border ${config.color} ${sizeClasses} font - bold shadow - sm inline - flex`}>
            <Icon size={iconSize} /> <span>{type}</span>
        </div>
    );
};

// --- 3. SUB-COMPONENTES DE TELA ---

// Tela 1: Lobby (Saguão das Expedições)
const LobbyView = ({ expeditions, onCreate, onRename, onDelete, onSelect }) => {
    const [newName, setNewName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    const handleCreate = () => {
        if (newName.trim()) {
            onCreate(newName);
            setNewName('');
            setIsCreating(false);
        }
    };

    const handleSaveRename = (id) => {
        if (editName.trim()) {
            onRename(id, editName);
            setEditingId(null);
        }
    };

    return (
        <div className="min-h-screen font-sans text-brown-900">
            <div className="max-w-4xl mx-auto py-6 md:py-8 px-4">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 md:mb-10 gap-4 md:gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                        <div className="bg-white p-2 rounded-2xl shadow-md border border-brown-100 hidden md:block">
                            <DragonIcon size={100} />
                        </div>
                        <div className="bg-white p-2 rounded-2xl shadow-md border border-brown-100 md:hidden">
                            <DragonIcon size={60} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-4xl font-extrabold text-brown-800 tracking-tight">Saguão das Expedições</h1>
                            <p className="text-brown-500 font-medium text-sm md:text-lg">Gerencie suas turmas e aventureiros</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="bg-brown-700 rounded-2xl p-4 md:p-6 text-white shadow-xl flex flex-col justify-between min-h-[160px] md:min-h-[180px] hover:shadow-2xl transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
                            <DragonIcon size={200} className="grayscale brightness-200" />
                        </div>
                        <div className="relative z-10 w-full">
                            <h3 className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2"><Plus size={24} className="md:w-7 md:h-7" /> Nova Expedição</h3>
                            <p className="text-brown-200 text-sm mb-4 md:mb-6">Comece uma nova jornada com uma nova turma.</p>

                            {isCreating ? (
                                <div className="flex gap-2 w-full animate-in fade-in slide-in-from-bottom-2">
                                    <input autoFocus type="text" placeholder="Nome da Turma" className="flex-1 rounded-xl px-4 py-3 text-brown-900 font-bold focus:outline-none focus:ring-4 focus:ring-brown-500/50 shadow-inner" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
                                    <button onClick={handleCreate} className="bg-green-500 hover:bg-green-400 text-white p-3 rounded-xl shadow-lg transition-transform active:scale-95"><Check size={24} /></button>
                                    <button onClick={() => setIsCreating(false)} className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl transition-colors"><X size={24} /></button>
                                </div>
                            ) : (
                                <button onClick={() => setIsCreating(true)} className="w-full bg-white text-brown-800 font-extrabold py-3 md:py-4 rounded-xl hover:bg-brown-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-base md:text-lg">Criar Turma</button>
                            )}
                        </div>
                    </div>

                    {expeditions.map((exp) => (
                        <div key={exp.id} onClick={() => onSelect(exp.id)} className="bg-white rounded-2xl p-4 md:p-6 shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-brown-500 relative group min-h-[160px] md:min-h-[180px] flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-brown-100 p-3 rounded-2xl text-brown-600 group-hover:bg-brown-200 transition-colors">
                                    <Grid size={24} className="md:w-7 md:h-7" />
                                </div>
                                <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity translate-x-0 md:translate-x-2 md:group-hover:translate-x-0 duration-200 z-10">
                                    {editingId !== exp.id && (
                                        <button onClick={(e) => { e.stopPropagation(); setEditingId(exp.id); setEditName(exp.name); }} className="text-brown-400 hover:text-brown-600 p-2 rounded-xl hover:bg-brown-50 transition-colors"><Pencil size={18} /></button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(exp.id); }} className="text-brown-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors"><Trash2 size={18} /></button>
                                </div>
                            </div>

                            {editingId === exp.id ? (
                                <div className="flex gap-2 mb-1 items-center animate-in zoom-in" onClick={e => e.stopPropagation()}>
                                    <input
                                        autoFocus
                                        className="flex-1 border-2 border-brown-300 rounded-lg px-2 py-2 text-lg md:text-xl font-bold text-brown-800 focus:border-brown-500 outline-none"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSaveRename(exp.id)}
                                    />
                                    <button onClick={() => handleSaveRename(exp.id)} className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-lg"><Check size={20} /></button>
                                    <button onClick={() => setEditingId(null)} className="bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded-lg"><X size={20} /></button>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-xl md:text-2xl font-extrabold text-brown-800 mb-1 leading-tight group-hover:text-brown-600 transition-colors break-words">{exp.name}</h3>
                                    <p className="text-xs md:text-sm text-brown-400">Criado em {new Date().toLocaleDateString()}</p>
                                </div>
                            )}

                            <div className="mt-4 flex items-center gap-2">
                                <span className="bg-brown-100 text-brown-800 text-xs font-bold px-3 py-1 rounded-full">{exp.members.length} Exploradores</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Tela 2: Visão da Equipe (Turma)
const TeamView = ({ expedition, onBack, onNewMember, onOpenMember }) => (
    <div className="min-h-screen font-sans text-brown-900 bg-brown-50/50">
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="bg-white rounded-3xl shadow-sm border border-brown-100 p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <button onClick={onBack} className="bg-brown-100 p-3 rounded-2xl hover:bg-brown-200 text-brown-700 transition-colors shrink-0 group">
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-4">
                        <DragonIcon size={80} className="hidden sm:block" />
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-brown-800 leading-tight">{expedition?.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-brown-100 text-brown-700 text-xs font-bold px-2 py-0.5 rounded">Expedição Ativa</span>
                                <span className="text-brown-500 text-sm font-medium">{expedition?.members.length} Exploradores na equipe</span>
                            </div>
                        </div>
                    </div>
                </div>

                {expedition?.members.length > 0 && (
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={onNewMember} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brown-800 hover:bg-brown-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brown-900/10 hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                            <Plus size={20} /> Novo Explorador
                        </button>
                    </div>
                )}
            </div>

            {expedition?.members.length === 0 ? (
                <div className="text-center py-20 bg-brown-50 rounded-3xl border-2 border-dashed border-brown-300">
                    <Users size={48} className="mx-auto text-brown-300 mb-4" />
                    <h3 className="text-xl font-bold text-brown-600">Turma Vazia!</h3>
                    <div className="flex gap-4 justify-center mt-4"><button onClick={onNewMember} className="bg-brown-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-brown-600">Recrutar Primeiro Membro</button></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {expedition?.members.map((member) => (
                        <div key={member.id} onClick={() => onOpenMember(member)} className="bg-white rounded-xl p-0 shadow-md border border-brown-200 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden flex flex-col group">
                            <div className="bg-brown-800 p-4 flex items-center gap-3 relative overflow-hidden">
                                <div className="absolute inset-0 bg-brown-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                <div className="w-12 h-12 rounded-full border-2 border-white bg-brown-700 overflow-hidden shrink-0 relative z-10">{member.photo ? <img src={member.photo} className="w-full h-full object-cover" /> : <DragonIcon size="100%" fit="cover" />}</div>
                                <div className="overflow-hidden relative z-10"><h3 className="text-white font-bold truncate">{member.name}</h3><div className="text-brown-200 text-xs truncate">{member.archetype.title}</div></div>
                            </div>
                            <div className="p-3 grid grid-cols-2 gap-2 bg-brown-50 flex-1">
                                <div className="bg-white p-2 rounded border border-brown-100"><div className="text-[10px] text-brown-400 uppercase">Saber</div><div className="text-xs font-bold text-brown-700 truncate">{member.answers['saber']?.label}</div></div>
                                <div className="bg-white p-2 rounded border border-brown-100"><div className="text-[10px] text-brown-400 uppercase">Foco</div><div className="text-xs font-bold text-brown-700 truncate">{member.answers['foco']?.label}</div></div>
                                <div className="flex col-span-2 items-center justify-center text-xs text-brown-500 font-bold bg-brown-100 rounded border border-brown-200 py-1 opacity-60 group-hover:opacity-100">Ver Carta Completa</div>
                            </div>
                        </div>
                    ))}
                    <button onClick={onNewMember} className="rounded-xl border-2 border-dashed border-brown-300 hover:border-brown-400 hover:bg-brown-50 flex flex-col items-center justify-center p-6 text-brown-400 hover:text-brown-600 transition-all min-h-[160px]"><Plus size={40} className="mb-2" /><span className="font-bold">Adicionar</span></button>
                </div>
            )}
        </div>
    </div>
);

// Tela 3: Entrada de Nome e Gênero
const NameEntryView = ({ onStart, onCancel }) => {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('M');

    return (
        <div className="flex flex-col items-center justify-center min-h-screen font-sans p-4">
            <Card className="max-w-md w-full p-8 relative overflow-visible">
                <button onClick={onCancel} className="absolute -top-12 left-0 text-brown-600 hover:text-brown-800 flex items-center gap-2 font-bold mb-4">
                    <ArrowLeft size={20} /> Voltar
                </button>

                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-brown-100 rounded-full flex items-center justify-center border-4 border-brown-300 shadow-inner">
                        <Users size={48} className="text-brown-500" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-brown-800 mb-2 text-center">Novo Recruta</h2>
                <p className="text-brown-500 text-center mb-8 text-sm">Preencha os dados do pequeno explorador</p>

                <div className="flex gap-4 justify-center mb-6">
                    <button
                        onClick={() => setGender('M')}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${gender === 'M' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md ring-2 ring-blue-200' : 'bg-white border-brown-100 text-brown-400 hover:bg-brown-50'}`}
                    >
                        <span className="text-2xl">🎩</span>
                        <span className="text-xs uppercase tracking-wider">Cavalheiro</span>
                    </button>
                    <button
                        onClick={() => setGender('F')}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${gender === 'F' ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-md ring-2 ring-pink-200' : 'bg-white border-brown-100 text-brown-400 hover:bg-brown-50'}`}
                    >
                        <span className="text-2xl">👑</span>
                        <span className="text-xs uppercase tracking-wider">Dama</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Nome do Explorador"
                        placeholder="Digite o nome..."
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && name.trim() && onStart(name, gender)}
                        className="text-lg"
                    />

                    <Button
                        onClick={() => onStart(name, gender)}
                        disabled={!name.trim()}
                        className="w-full py-4 text-lg shadow-lg hover:translate-y-[-2px]"
                    >
                        Começar Avaliação <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </Card>
        </div>
    );
};

// Tela 4: Quiz
const QuizView = ({ currentStep, trails, answers, onAnswer, onNext, onPrev, onCancel }) => {
    const trail = trails[currentStep];
    const [textInput, setTextInput] = useState('');

    if (!trail) return null;
    const currentAnswer = answers[trail.id];

    const handleTextConfirm = () => {
        onAnswer(trail.id, { label: textInput || 'Não informado', value: 'text_entry', feedback: '' });
        onNext();
        setTextInput('');
    };

    return (
        <div className="min-h-screen font-sans">
            <div className="max-w-md mx-auto pb-24 pt-10 px-4">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onCancel} className="text-brown-400 hover:text-brown-600 flex items-center gap-1 text-sm font-bold"><X size={16} /> Sair</button>
                    <span className="font-bold text-brown-500 text-xs uppercase bg-brown-100 px-3 py-1 rounded-full">{currentStep + 1} / {trails.length}</span>
                </div>
                <div className="h-2 bg-brown-100 rounded-full mb-8 overflow-hidden"><div className="h-full bg-gradient-to-r from-brown-500 to-orange-500 transition-all duration-500" style={{ width: `${((currentStep + 1) / trails.length) * 100}%` }} /></div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-slide-up mb-6 border border-brown-100 relative">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${trail.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-4 rounded-2xl ${trail.color.split(' ')[0]} bg-opacity-20`}>
                                {React.cloneElement(trail.icon, { size: 32 })}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-brown-900">{trail.title}</h3>
                                <p className="text-sm text-brown-500 font-medium">Avaliação de Perfil</p>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-brown-800 mb-8 leading-relaxed min-h-[60px]">{trail.question}</h2>

                        {trail.type === 'text' ? (
                            <div className="space-y-4">
                                <TextArea
                                    className="h-32 text-lg resize-none"
                                    placeholder={trail.placeholder}
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    autoFocus
                                />
                                <Button onClick={handleTextConfirm} className="w-full py-3">
                                    Confirmar Resposta <Check className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {trail.options?.map((opt, idx) => (
                                    <button key={idx} onClick={() => {
                                        onAnswer(trail.id, opt);
                                        setTimeout(() => { onNext(); }, 350);
                                    }} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center group relative hover:shadow-md ${currentAnswer?.value === opt.value ? 'border-brown-600 bg-brown-50 ring-2 ring-brown-600/20' : 'border-brown-100 hover:border-brown-300 hover:bg-white bg-brown-50/50'}`}>
                                        <div className="pr-8">
                                            <span className={`block font-bold text-base ${currentAnswer?.value === opt.value ? 'text-brown-900' : 'text-brown-700'}`}>{opt.label}</span>
                                            <span className="text-xs text-brown-500 mt-1 block leading-snug">{opt.desc}</span>
                                        </div>
                                        <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${currentAnswer?.value === opt.value ? 'border-brown-600 bg-brown-600 scale-110' : 'border-brown-200'}`}>
                                            {currentAnswer?.value === opt.value && <Check size={14} className="text-white" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center px-2 mt-4">
                    <button onClick={onPrev} disabled={currentStep === 0} className={`flex items-center gap-2 font-bold px-4 py-2 rounded-lg transition-all text-sm ${currentStep === 0 ? 'opacity-0' : 'text-brown-400 hover:text-brown-600 hover:bg-brown-50'}`}><ArrowLeft size={16} /> Anterior</button>
                    <button onClick={() => { if (trail.type === 'select' && !currentAnswer) onAnswer(trail.id, { label: 'Não observado', value: 'skipped' }); onNext(); }} className="flex items-center gap-2 text-brown-400 hover:text-brown-600 font-bold px-4 py-2 hover:bg-brown-50 rounded-lg transition-all text-sm shrink-0">{currentStep === trails.length - 1 ? 'Finalizar' : 'Pular Questão'} <ArrowRight size={16} /></button>
                </div>
            </div>
        </div>
    );
};

// Tela 5: Resultado
const ResultView = ({ name, archetype, onSave, onDiscard, customDesc, setCustomDesc, photo, onPhotoUpload, onSetPhoto }) => {
    const fileRef = useRef(null);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [tempUrl, setTempUrl] = useState('');

    const handleUrlConfirm = () => {
        if (tempUrl.trim()) onSetPhoto(tempUrl);
        setShowUrlInput(false);
        setTempUrl('');
    };

    return (
        <div className="min-h-screen font-sans flex items-center justify-center p-6 bg-brown-50/50">
            <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-brown-200 animate-in zoom-in-95">
                <div className="bg-brown-900 p-8 text-center text-white relative">
                    <h2 className="relative z-10 text-lg text-brown-300 font-medium mb-1">Perfil Identificado</h2>
                    <h1 className="relative z-10 text-3xl font-bold mb-6">{name}</h1>

                    <div className="relative z-10 mb-6 flex flex-col items-center justify-center">
                        {showUrlInput ? (
                            <div className="w-full max-w-[200px] mb-2 animate-in fade-in">
                                <div className="bg-white rounded-lg p-1 flex gap-1 shadow-lg">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="https://..."
                                        className="w-full text-brown-900 text-sm px-2 py-1 outline-none rounded bg-transparent"
                                        value={tempUrl}
                                        onChange={(e) => setTempUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUrlConfirm()}
                                    />
                                    <button onClick={handleUrlConfirm} className="bg-green-500 hover:bg-green-600 text-white p-1 rounded transition-colors"><Check size={16} /></button>
                                    <button onClick={() => setShowUrlInput(false)} className="bg-red-400 hover:bg-red-500 text-white p-1 rounded transition-colors"><X size={16} /></button>
                                </div>
                                <p className="text-xs text-brown-300 mt-1">Cole o link da imagem</p>
                            </div>
                        ) : (
                            <div className="relative group">
                                <div onClick={() => fileRef.current?.click()} className="w-40 h-40 rounded-full bg-white/10 border-4 border-brown-400 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors overflow-hidden relative shadow-inner">
                                    {photo ? (<img src={photo} className="w-full h-full object-cover" />) : (<DragonIcon size="70%" fit="cover" />)}
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera size={32} className="mb-1" />
                                        <span className="text-sm font-bold text-white">Alterar Foto</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowUrlInput(true)}
                                    className="absolute bottom-0 right-0 bg-white text-brown-900 p-2 rounded-full shadow-lg border-2 border-brown-100 hover:bg-brown-100 transform translate-x-1/4 translate-y-1/4 transition-transform hover:scale-110"
                                    title="Usar URL da Imagem"
                                >
                                    <Link size={18} />
                                </button>
                            </div>
                        )}
                        <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) { const reader = new FileReader(); reader.onloadend = () => onSetPhoto(reader.result); reader.readAsDataURL(file); }
                        }} />
                    </div>

                    <div className="relative z-10 flex gap-2 justify-center">
                        <Badge className="bg-brown-700 text-brown-100 border-brown-600">Explorador</Badge>
                        <Badge className="bg-yellow-500 text-yellow-900 border-yellow-400 font-bold">Nível 1</Badge>
                    </div>

                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 pattern-dots pattern-white pattern-size-4 pattern-bg-transparent"></div>
                </div>

                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-brown-50 rounded-2xl border border-brown-100">
                            <ArchetypeBadge type={archetype.title} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-brown-800">{archetype.title}</h3>
                            <p className="text-sm text-brown-500">{archetype.subtitle}</p>
                        </div>
                    </div>

                    <div className="bg-brown-50 rounded-xl p-4 border border-brown-100 mb-8 relative group">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-brown-700 text-xs uppercase tracking-wider flex items-center gap-2">
                                <Sparkles size={14} className="text-yellow-500" /> Características
                            </h4>
                            <Pencil size={14} className="text-brown-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <TextArea
                            value={customDesc}
                            onChange={(e) => setCustomDesc(e.target.value)}
                            className="bg-transparent border-none p-0 text-brown-600 text-sm italic w-full resize-none focus:ring-0"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={onDiscard}
                            variant="secondary"
                            className="flex-1 border-2 border-brown-100 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-brown-400"
                        >
                            <Trash2 size={18} /> Descartar
                        </Button>
                        <Button
                            onClick={onSave}
                            className="flex-[2] shadow-lg shadow-brown-200/50"
                        >
                            <SaveIcon className="mr-2" size={18} /> Registrar Recruta
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modal: Ficha do Membro
const MemberModal = ({ member, onClose, onUpdate, onRemove }) => {
    const [modalTab, setModalTab] = useState('stats');
    const [editingTrailId, setEditingTrailId] = useState(null);
    const [editValue, setEditValue] = useState(null);
    const [newLogText, setNewLogText] = useState('');
    const [newLogResponsible, setNewLogResponsible] = useState('');
    const [newLogSubject, setNewLogSubject] = useState('');
    const fileRef = useRef(null);
    const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [tempUrl, setTempUrl] = useState('');

    const handleUrlConfirm = () => {
        if (tempUrl.trim()) onUpdate({ ...member, photo: tempUrl });
        setShowUrlInput(false);
        setTempUrl('');
    };

    if (!member) return null;

    const trails = getTrails(member.gender);
    const selectTrails = trails.filter(t => t.type === 'select');
    const textTrails = trails.filter(t => t.type === 'text');

    const handleDownloadPDF = async () => {
        setIsGeneratingMessage(true);
        const htmlContent = generatePDFHTML(member);
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;
        doc.open(); doc.write(htmlContent); doc.close();
        iframe.contentWindow.onload = () => {
            setIsGeneratingMessage(false);
            try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (e) { console.error("Print error:", e); } finally { setTimeout(() => document.body.removeChild(iframe), 1000); }
        };
    };

    const handleEditSave = (trailId) => {
        const trail = trails.find(t => t.id === trailId);
        let newAnswer;
        if (trail?.type === 'text') newAnswer = { label: editValue, value: 'text_entry', feedback: '' };
        else {
            const selectedOption = trail?.options?.find(opt => opt.value === editValue);
            newAnswer = selectedOption || { label: 'Não observado', value: 'skipped', feedback: '' };
        }
        const updatedAnswers = { ...member.answers, [trailId]: newAnswer };
        const newArch = determineArchetype(updatedAnswers, member.gender);
        onUpdate({ ...member, answers: updatedAnswers, archetype: { ...member.archetype, title: newArch.title } });
        setEditingTrailId(null);
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => onUpdate({ ...member, photo: reader.result }); reader.readAsDataURL(file); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brown-900/90 backdrop-blur-md animate-in fade-in duration-200 font-sans">
            {/* MemberPDFTemplate removed as it resides in a new window now */}
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border-4 border-brown-800 overflow-hidden flex flex-col md:flex-row relative h-[85vh]">
                <button onClick={onClose} className="absolute top-2 right-2 z-20 text-brown-400 hover:text-brown-800 p-1 bg-white/80 rounded-full shadow-sm"><X size={20} /></button>

                {/* Coluna Esquerda: Info */}
                <div className="bg-brown-900 w-full md:w-[30%] p-6 flex flex-col items-center justify-center text-center text-white relative shrink-0 border-b md:border-r border-brown-800">
                    {showUrlInput ? (
                        <div className="w-full max-w-[200px] mb-3 animate-in fade-in">
                            <div className="bg-white rounded-lg p-1 flex gap-1 shadow-lg">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="https://..."
                                    className="w-full text-brown-900 text-sm px-2 py-1 outline-none rounded"
                                    value={tempUrl}
                                    onChange={(e) => setTempUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUrlConfirm()}
                                />
                                <button onClick={handleUrlConfirm} className="bg-green-500 hover:bg-green-600 text-white p-1 rounded"><Check size={16} /></button>
                                <button onClick={() => setShowUrlInput(false)} className="bg-red-400 hover:bg-red-500 text-white p-1 rounded"><X size={16} /></button>
                            </div>
                            <p className="text-xs text-brown-300 mt-1">Cole o link da imagem</p>
                        </div>
                    ) : (
                        <div className="relative group mb-3">
                            <div onClick={() => fileRef.current?.click()} className="w-40 h-40 rounded-full border-4 border-brown-500 bg-brown-800 overflow-hidden shadow-2xl cursor-pointer relative">
                                {member.photo ? (<img src={member.photo} className="w-full h-full object-cover" />) : (<DragonIcon size="100%" fit="cover" />)}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={24} /></div>
                            </div>
                            <button
                                onClick={() => setShowUrlInput(true)}
                                className="absolute bottom-0 right-0 bg-white text-brown-900 p-2 rounded-full shadow-lg border-2 border-brown-100 hover:bg-brown-100 transform translate-x-1/4 translate-y-1/4 transition-transform hover:scale-110"
                                title="Usar URL da Imagem"
                            >
                                <Link size={16} />
                            </button>
                        </div>
                    )}
                    <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />

                    <h1 className="text-xl md:text-2xl font-extrabold leading-tight mb-1">{member.name}</h1>
                    <div className="scale-90"><ArchetypeBadge type={member.archetype.title} compact size="lg" /></div>

                    <div className="mt-4 w-full bg-brown-800 p-2 rounded border border-brown-700">
                        <TextArea
                            value={member.archetype.desc}
                            onChange={(e) => onUpdate({ ...member, archetype: { ...member.archetype, desc: e.target.value } })}
                            className="bg-brown-700 text-white text-xs border-brown-600 focus:border-brown-400 resize-none h-24"
                            placeholder="Descrição do arquétipo..."
                        />
                    </div>

                    <button onClick={handleDownloadPDF} disabled={isGeneratingMessage} className="w-full mt-4 bg-brown-700 hover:bg-brown-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:-translate-y-1 relative z-10 disabled:opacity-50">
                        {isGeneratingMessage ? <span className="animate-pulse">Gerando...</span> : <><Download size={16} /> Baixar PDF</>}
                    </button>
                    <button onClick={() => onRemove(member.id)} className="mt-auto pt-4 text-red-400 hover:text-red-300 text-xs flex items-center gap-1 opacity-50 hover:opacity-100"><Trash2 size={12} /> Excluir</button>
                </div>

                {/* Coluna Direita: Dados */}
                <div className="w-full md:w-[70%] bg-brown-50 flex flex-col h-full overflow-hidden">
                    <div className="flex border-b border-brown-200 bg-white shrink-0">
                        <button onClick={() => setModalTab('stats')} className={`flex-1 py-3 text-xs font-bold uppercase ${modalTab === 'stats' ? 'text-brown-700 border-b-2 border-brown-700' : 'text-brown-400'} `}><ClipboardList className="inline mr-1" size={14} /> Atributos</button>
                        <button onClick={() => setModalTab('registry')} className={`flex-1 py-3 text-xs font-bold uppercase ${modalTab === 'registry' ? 'text-brown-700 border-b-2 border-brown-700' : 'text-brown-400'} `}><BookOpen className="inline mr-1" size={14} /> Diário</button>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {modalTab === 'stats' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    {selectTrails.map(trail => {
                                        const ans = member.answers[trail.id];
                                        const isEditing = editingTrailId === trail.id;
                                        return (
                                            <div key={trail.id} className="bg-white border border-brown-200 rounded-lg p-3 shadow-sm hover:border-brown-300 transition-colors">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="flex items-center gap-2"><div className={`p-1 rounded ${trail.color.split(' ')[2]} bg-opacity-10`}>{trail.icon}</div><span className="text-[10px] font-bold uppercase text-brown-500">{trail.title}</span></div>
                                                    {!isEditing && <button onClick={() => { setEditingTrailId(trail.id); setEditValue(ans?.value); }} className="text-brown-300 hover:text-brown-500"><Pencil size={12} /></button>}
                                                </div>
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-2">
                                                        <Select value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-xs">
                                                            {trail.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                        </Select>
                                                        <div className="flex justify-end gap-1"><button onClick={() => handleEditSave(trail.id)} className="bg-green-100 p-1 rounded text-green-700"><Check size={12} /></button><button onClick={() => setEditingTrailId(null)} className="bg-red-100 p-1 rounded text-red-700"><X size={12} /></button></div>
                                                    </div>
                                                ) : (
                                                    <div><div className="font-bold text-brown-800 text-sm">{ans?.label || "Não observado"}</div><div className="text-[10px] text-brown-600 font-medium">💡 {ans?.feedback}</div></div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="space-y-3">
                                    {textTrails.map(trail => {
                                        const ans = member.answers[trail.id];
                                        const isEditing = editingTrailId === trail.id;
                                        return (
                                            <div key={trail.id} className="bg-white border border-brown-200 rounded-lg p-4 shadow-sm">
                                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-brown-100">
                                                    <div className="flex items-center gap-2"><div className={`p-1 rounded ${trail.color.split(' ')[2]} bg-opacity-10`}>{trail.icon}</div><span className="font-bold text-brown-600 text-xs uppercase">{trail.title}</span></div>
                                                    {!isEditing && <button onClick={() => { setEditingTrailId(trail.id); setEditValue(ans?.label); }} className="text-brown-300 hover:text-brown-500"><Pencil size={12} /></button>}
                                                </div>
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-2">
                                                        <TextArea className="text-xs p-2 h-24" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                                                        <div className="flex justify-end gap-2"><button onClick={() => handleEditSave(trail.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Salvar</button><button onClick={() => setEditingTrailId(null)} className="text-xs bg-brown-400 text-white px-2 py-1 rounded">Cancelar</button></div>
                                                    </div>
                                                ) : (<p className="text-sm text-brown-800 whitespace-pre-wrap">{ans?.label || "Sem registro."}</p>)}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="text-center text-xs text-brown-400 mt-4">Recrutado em: {member.date}</div>
                            </div>
                        )}

                        {modalTab === 'registry' && (
                            <div className="flex flex-col h-full">
                                <div className="bg-white border border-brown-200 rounded-xl p-3 shadow-sm mb-4 shrink-0">
                                    <div className="flex gap-2 mb-2">
                                        <input className="flex-1 text-xs border border-brown-200 rounded p-2 focus:outline-none focus:border-brown-400 text-brown-800 placeholder-brown-400" placeholder="Responsável (Ex: Prof. Silva)" value={newLogResponsible} onChange={(e) => setNewLogResponsible(e.target.value)} />
                                        <input className="flex-1 text-xs border border-brown-200 rounded p-2 focus:outline-none focus:border-brown-400 text-brown-800 placeholder-brown-400" placeholder="Disciplina (Ex: Matemática)" value={newLogSubject} onChange={(e) => setNewLogSubject(e.target.value)} />
                                    </div>
                                    <TextArea className="h-20 text-sm mb-2" placeholder="Adicionar nova observação..." value={newLogText} onChange={(e) => setNewLogText(e.target.value)} />
                                    <div className="flex justify-end"><button onClick={() => {
                                        const newLog = {
                                            id: Date.now(),
                                            date: new Date().toLocaleString('pt-BR'),
                                            text: newLogText,
                                            responsible: newLogResponsible,
                                            subject: newLogSubject
                                        };
                                        if (newLogText.trim()) {
                                            onUpdate({ ...member, registry: [newLog, ...(member.registry || [])] });
                                            setNewLogText('');
                                            setNewLogResponsible('');
                                            setNewLogSubject('');
                                        }
                                    }} className="bg-brown-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-brown-600"><Send size={12} /> Registrar</button></div>
                                </div>
                                <div className="space-y-3">
                                    {member.registry?.map((log) => (
                                        <div key={log.id} className="bg-white border border-brown-100 rounded-lg p-3 shadow-sm flex gap-3">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-brown-400 shrink-0" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-brown-400">{log.date}</span>
                                                        {(log.responsible || log.subject) && (
                                                            <div className="flex gap-2 text-[10px] text-brown-500 font-medium mt-0.5">
                                                                {log.responsible && <span>👤 {log.responsible}</span>}
                                                                {log.subject && <span>📚 {log.subject}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button onClick={() => onUpdate({ ...member, registry: member.registry.filter((l) => l.id !== log.id) })} className="text-brown-300 hover:text-red-400"><X size={12} /></button>
                                                </div>
                                                <p className="text-xs text-brown-700 mt-1 whitespace-pre-wrap">{log.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 4. HOOKS E ESTADO PRINCIPAL ---

const useDrackerState = () => {
    const [view, setView] = useState('lobby');
    const [expeditions, setExpeditions] = useState([{ id: 1, name: 'Turma Principal', members: [] }]);
    const [currentExpeditionId, setCurrentExpeditionId] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', gender: 'M', answers: {}, step: 0, photo: null, customDesc: '' });

    const currentExpedition = expeditions.find(e => e.id === currentExpeditionId);

    const actions = {
        // Navigation
        goHome: () => setView('lobby'),
        goTeam: (id) => { setCurrentExpeditionId(id); setView('team'); },

        // Expeditions
        createExpedition: (name) => setExpeditions([...expeditions, { id: Date.now(), name, members: [] }]),
        renameExpedition: (id, newName) => {
            setExpeditions(prev => prev.map(e => e.id === id ? { ...e, name: newName } : e));
        },
        deleteExpedition: (id) => setExpeditions(expeditions.filter(e => e.id !== id)),
        importData: (data) => setExpeditions(data),
        importExpedition: (newExp, merge) => {
            setExpeditions(prev => {
                const existing = prev.find(e => e.name === newExp.name);
                if (existing) {
                    if (merge) {
                        const mergedMembers = [...existing.members];
                        newExp.members.forEach(nm => {
                            if (!mergedMembers.find(m => m.name === nm.name)) {
                                mergedMembers.push({ ...nm, id: Date.now() + Math.random() });
                            }
                        });
                        return prev.map(e => e.id === existing.id ? { ...e, members: mergedMembers } : e);
                    } else {
                        return [...prev, { ...newExp, id: Date.now(), name: newExp.name + ' (Cópia)' }];
                    }
                } else {
                    return [...prev, { ...newExp, id: Date.now() }];
                }
            });
        },

        // Quiz Flow
        startQuiz: (name, gender) => { setFormData({ name, gender, answers: {}, step: 0, photo: null, customDesc: '' }); setView('quiz'); },
        answerQuiz: (trailId, answer) => setFormData(prev => ({ ...prev, answers: { ...prev.answers, [trailId]: answer } })),
        nextStep: () => setFormData(prev => ({ ...prev, step: prev.step + 1 })),
        prevStep: () => setFormData(prev => ({ ...prev, step: prev.step - 1 })),
        finishQuiz: (desc) => { setFormData(prev => ({ ...prev, customDesc: desc })); setView('result'); },
        setPhoto: (photo) => setFormData(prev => ({ ...prev, photo })),

        // Member CRUD
        addMember: () => {
            if (!currentExpeditionId) return;
            const arch = determineArchetype(formData.answers, formData.gender);
            const newMember = {
                id: Date.now(),
                name: formData.name,
                gender: formData.gender,
                answers: formData.answers,
                archetype: { ...arch, desc: formData.customDesc || arch.desc },
                date: new Date().toLocaleDateString('pt-BR'),
                photo: formData.photo,
                registry: []
            };
            setExpeditions(prev => prev.map(e => e.id === currentExpeditionId ? { ...e, members: [...e.members, newMember] } : e));
            setView('team');
        },
        updateMember: (updatedMember) => {
            setExpeditions(prev => prev.map(e => e.id === currentExpeditionId ? { ...e, members: e.members.map((m) => m.id === updatedMember.id ? updatedMember : m) } : e));
            setSelectedMember(updatedMember);
        },
        removeMember: (id) => {
            setExpeditions(prev => prev.map(e => e.id === currentExpeditionId ? { ...e, members: e.members.filter((m) => m.id !== id) } : e));
            setSelectedMember(null);
        }
    };

    return { view, expeditions, currentExpedition, selectedMember, setSelectedMember, formData, actions, setFormData, setView };
};

// --- 5. COMPONENTE PRINCIPAL ---

// Header com Ferramentas (Import/Export)
const ExpeditionToolsHeader = ({ onExport, onImport }) => {
    const fileInputRef = useRef(null);
    return (
        <div className="bg-brown-900 text-white px-6 py-3 flex justify-between items-center shadow-md no-print relative z-20">
            <div className="flex items-center gap-2 text-sm font-bold text-brown-200">
                <DragonIcon size={24} />
                <span>Expedição Drácker</span>
            </div>
            <div className="flex gap-2">
                <button onClick={onExport} title="Salvar dados das turmas" className="flex items-center gap-2 bg-brown-800 hover:bg-brown-700 text-brown-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-brown-700">
                    <Download size={14} /> Exportar Turmas
                </button>
                <button onClick={() => fileInputRef.current?.click()} title="Carregar turmas" className="flex items-center gap-2 bg-brown-800 hover:bg-brown-700 text-brown-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-brown-700">
                    <UploadIcon size={14} /> Importar Turmas
                </button>
                <input type="file" ref={fileInputRef} onChange={onImport} accept=".json" className="hidden" />
            </div>
        </div>
    );
};

export default function ExpedicaoDracker({ drackerState }) {
    const {
        view,
        expeditions,
        currentExpedition,
        selectedMember,
        setSelectedMember,
        formData,
        actions,
        setFormData,
        setView
    } = drackerState;

    // Handlers intermediários para conectar views e actions
    const handleQuizNext = () => {
        const trails = getTrails(formData.gender);
        if (formData.step < trails.length - 1) actions.nextStep();
        else actions.finishQuiz(determineArchetype(formData.answers, formData.gender).desc);
        window.scrollTo(0, 0);
    };

    const handleQuizPrev = () => {
        actions.prevStep();
        window.scrollTo(0, 0);
    };

    const handleExpertSystem = async () => {
        // ... (existing logic) ...
        setIsGeneratingMessage(true);
        // ...
        setIsGeneratingMessage(false);
    };

    // Exportação específica de turmas (json)
    const handleExportDrackerData = () => {
        const dataStr = JSON.stringify({ expeditions }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_turmas_dracker_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Importação específica de turmas
    const handleImportDrackerData = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                // Hook agora espera itens individuais via importExpedition, então iteramos aqui para poder perguntar
                const itemsStr = Array.isArray(json) ? json : (json.expeditions || []);

                if (itemsStr.length === 0) {
                    alert('Nenhuma turma encontrada no arquivo.');
                    return;
                }

                let mergedCount = 0;
                let newCount = 0;

                itemsStr.forEach(importedExp => {
                    const existingExp = expeditions.find(e => e.name === importedExp.name);
                    let shouldMerge = false;

                    if (existingExp) {
                        shouldMerge = window.confirm(`A turma "${importedExp.name}" já existe.\n\nDeseja MESCLAR com a existente ? (Clique em Cancelar para criar uma CÓPIA)`);
                        if (shouldMerge) mergedCount++;
                        else newCount++;
                    } else {
                        newCount++;
                    }

                    actions.importExpedition(importedExp, shouldMerge);
                });

                alert(`Importação concluída!\nMescladas: ${mergedCount} \nCriadas: ${newCount} `);

            } catch (err) {
                console.error(err);
                alert('Erro ao importar arquivo: Formato inválido.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="font-sans text-brown-900 bg-[#fdfbf7] min-h-screen">
            {/* Persistent Header for Tools */}
            <ExpeditionToolsHeader onExport={handleExportDrackerData} onImport={handleImportDrackerData} />

            {view === 'lobby' && (
                <LobbyView
                    expeditions={expeditions}
                    onCreate={actions.createExpedition}
                    onRename={actions.renameExpedition}
                    onDelete={actions.deleteExpedition}
                    onSelect={actions.goTeam}
                />
            )}

            {view === 'team' && (
                <TeamView expedition={currentExpedition} onBack={actions.goHome} onNewMember={() => setView('name_entry')} onOpenMember={setSelectedMember} />
            )}

            {view === 'name_entry' && <NameEntryView onStart={actions.startQuiz} onCancel={() => setView('team')} />}

            {view === 'quiz' && (
                <QuizView
                    currentStep={formData.step}
                    trails={getTrails(formData.gender)}
                    answers={formData.answers}
                    onAnswer={actions.answerQuiz}
                    onNext={handleQuizNext}
                    onPrev={actions.prevStep}
                    onCancel={() => setView('team')}
                />
            )}

            {view === 'result' && (
                <ResultView
                    name={formData.name}
                    archetype={determineArchetype(formData.answers, formData.gender)}
                    customDesc={formData.customDesc}
                    setCustomDesc={(val) => setFormData({ ...formData, customDesc: val })}
                    photo={formData.photo}
                    onPhotoUpload={(e) => {
                        const file = e.target.files[0];
                        if (file) { const r = new FileReader(); r.onload = (ev) => actions.setPhoto(ev.target?.result); r.readAsDataURL(file); }
                    }}
                    onSetPhoto={actions.setPhoto}
                    onSave={actions.addMember}
                    onDiscard={() => setView('team')}
                />
            )}

            <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} onUpdate={actions.updateMember} onRemove={actions.removeMember} />
        </div>
    );
}
