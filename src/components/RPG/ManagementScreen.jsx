
import React, { useState } from 'react';
import { Users, Minus, Plus, RefreshCw, ArrowLeft, Shield, PenTool, Mic, Search, Brain, Heart, Compass } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CLASS_ROLES, generateGuildNames } from './RPGUtils.jsx';
import { useSystemState } from '../../contexts/SystemStateContext';
// Actually, ManagementScreen is for the teacher/RPG view. 
// Let's implement a specific view for RPG Guilds Management using the shared state.

export const ManagementScreen = ({ onBack }) => {
    const { drackerState } = useSystemState();
    const { expeditions, allMembers } = drackerState;

    // Toggle between "Calculator Mode" (Legacy) and "System Mode" (Real data)
    const [useRealData, setUseRealData] = useState(true);

    const [students, setStudents] = useState(38);
    const [targetSize, setTargetSize] = useState(6);
    const [generatedNames, setGeneratedNames] = useState([]);
    const [selectedRole, setSelectedRole] = useState(CLASS_ROLES[0]);
    const [selectedGuildId, setSelectedGuildId] = useState(null);

    const totalGroups = Math.max(1, Math.floor(students / targetSize));
    const countBig = students % totalGroups;
    const sizeBig = Math.floor(students / totalGroups) + 1;
    const countSmall = totalGroups - countBig;
    const sizeSmall = Math.floor(students / totalGroups);

    // Filter relevant expeditions (e.g., exclude "Diversificada" if needed, or include all?)
    const activeGuilds = expeditions || [];
    const selectedGuild = activeGuilds.find(g => g.id === selectedGuildId);

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-md border-t-8 border-blue-600 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                    <Users className="text-blue-600" /> Conselho de Guildas
                </h2>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setUseRealData(!useRealData)}
                        variant="ghost"
                        className="text-xs"
                    >
                        {useRealData ? "Usar Calculadora" : "Ver Guildas Reais"}
                    </Button>
                    <Button onClick={onBack} variant="secondary" className="gap-2">
                        <ArrowLeft size={16} /> Voltar
                    </Button>
                </div>
            </div>

            {useRealData ? (
                // REAL DATA VIEW
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left: Guild List */}
                    <div className="md:col-span-1 space-y-4">
                        <h3 className="font-bold text-brown-700 border-b border-brown-200 pb-2">Guildas Ativas</h3>
                        {activeGuilds.length === 0 && <p className="text-sm text-gray-500 italic">Nenhuma guilda criada no Conselho.</p>}

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {activeGuilds.map(guild => (
                                <div
                                    key={guild.id}
                                    onClick={() => setSelectedGuildId(guild.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedGuildId === guild.id ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-brown-100 hover:bg-gray-50'}`}
                                >
                                    <div className="font-bold text-brown-800">{guild.name}</div>
                                    <div className="text-xs text-gray-500">{guild.memberIds?.length || 0} Membros</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Guild Details & Members */}
                    <div className="md:col-span-2">
                        {selectedGuild ? (
                            <Card className="bg-white border-brown-200 min-h-[400px]">
                                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <Shield size={20} /> {selectedGuild.name}
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {selectedGuild.memberIds?.map(memberId => {
                                        const member = allMembers.find(m => m.id === memberId);
                                        if (!member) return null;
                                        const role = CLASS_ROLES.find(r => r.name === member.rpgClass);

                                        return (
                                            <div key={member.id} className="relative p-3 rounded-xl border border-brown-100 bg-brown-50/30 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow">
                                                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                                                    {member.photo ? (
                                                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">?</div>
                                                    )}
                                                </div>
                                                <div className="leading-tight">
                                                    <div className="font-bold text-sm text-brown-900">{member.name}</div>
                                                    <div className="text-[10px] text-brown-600 truncate max-w-[120px]">{member.archetype?.title || 'Sem Arquétipo'}</div>
                                                </div>

                                                {/* Role Badge */}
                                                {role ? (
                                                    <div className={`mt-1 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 ${role.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 ')}`}>
                                                        {role.icon}
                                                        <span>{role.name}</span>
                                                    </div>
                                                ) : (
                                                    <div className="mt-1 px-2 py-1 rounded-md text-[10px] bg-gray-100 text-gray-400 italic">
                                                        Sem Classe
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {(!selectedGuild.memberIds || selectedGuild.memberIds.length === 0) && (
                                        <div className="col-span-full text-center py-10 text-gray-400 italic">
                                            Nenhum membro nesta guilda.
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 italic p-10 border-2 border-dashed border-gray-200 rounded-xl">
                                Selecione uma guilda ao lado para ver os detalhes.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // CALCULATOR MODE (Legacy)
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-blue-50 border-blue-200">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                                <label className="font-bold text-brown-700">Total Alunos:</label>
                                <input
                                    type="number"
                                    value={students}
                                    onChange={(e) => setStudents(Math.max(1, Number(e.target.value)))}
                                    className="w-16 p-1 text-center font-bold border rounded outline-none text-blue-800"
                                />
                            </div>
                            <div className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                                <label className="font-bold text-brown-700">Meta por Grupo:</label>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setTargetSize(Math.max(2, targetSize - 1))} className="p-1 bg-brown-200 rounded hover:bg-brown-300"><Minus size={14} /></button>
                                    <span className="font-bold text-blue-800 w-6 text-center">{targetSize}</span>
                                    <button onClick={() => setTargetSize(targetSize + 1)} className="p-1 bg-brown-200 rounded hover:bg-brown-300"><Plus size={14} /></button>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded text-center border border-blue-100">
                                <div className="text-3xl font-bold text-blue-600">{totalGroups} Guildas</div>
                                <div className="text-xs text-brown-500 mt-1">
                                    {countBig > 0 && <span>{countBig}x de {sizeBig} alunos </span>}
                                    {countBig > 0 && countSmall > 0 && <span> e </span>}
                                    {countSmall > 0 && <span>{countSmall}x de {sizeSmall} alunos</span>}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white border-brown-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-brown-700">Batizar Guildas</h3>
                            <Button
                                onClick={() => setGeneratedNames(generateGuildNames(totalGroups))}
                                variant="primary"
                                className="text-xs px-3 py-1 gap-2 bg-amber-500 hover:bg-amber-600 border-amber-600"
                            >
                                <RefreshCw size={12} /> Gerar
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-brown-600">
                            {generatedNames.length > 0 ? (
                                generatedNames.map((n, i) => <div key={i} className="bg-brown-50 p-2 rounded border border-brown-100">{i + 1}. {n}</div>)
                            ) : (
                                <div className="col-span-2 text-center text-brown-400 py-4">Clique em gerar...</div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            <div>
                <h3 className="text-lg font-bold text-brown-800 mb-2">Painel de Classes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {CLASS_ROLES.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className={`p-2 rounded border transition-all ${selectedRole?.id === role.id ? 'ring-2 ring-offset-1 ring-blue-400 shadow-md transform scale-105' : 'hover:bg-gray-50'} ${role.color} flex flex-col items-center text-center`}
                        >
                            <div className="mb-1">{role.icon}</div>
                            <span className="font-bold text-xs">{role.name}</span>
                            <span className="text-[10px] opacity-80">{role.role}</span>
                        </button>
                    ))}
                </div>

                {selectedRole && (
                    <div className={`mt-4 p-4 rounded-lg border-l-4 shadow-sm animate-fade-in ${selectedRole.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 ')}`}>
                        <h4 className="font-bold text-lg flex items-center gap-2 mb-1">
                            {selectedRole.icon}
                            {selectedRole.name} - {selectedRole.role}
                        </h4>
                        <p className="text-sm text-gray-700 italic">
                            "{selectedRole.description}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
