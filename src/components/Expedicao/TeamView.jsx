import React from 'react';
import { ArrowLeft, UserPlus, FileSpreadsheet, Smile, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

import { ARCHETYPES_CONFIG } from './ArchetypesConfig.jsx';

const TeamView = ({ expedition, allMembers = [], onBack, onNewMember, onOpenMember }) => {
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-slide-in-right pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 p-6 rounded-3xl shadow-sm border-2 border-brown-100 backdrop-blur-sm">
                <div className="flex items-center gap-4 w-full">
                    <Button variant="ghost" onClick={onBack} className="rounded-full w-12 h-12 p-0 border-2 border-transparent hover:border-brown-200 text-brown-600">
                        <ArrowLeft size={24} />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-extrabold text-brown-800 font-handwritten tracking-wide" title={expedition?.name}>{expedition?.name?.length > 30 ? expedition?.name?.substring(0, 30) + '...' : expedition?.name}</h2>
                        <div className="flex items-center gap-2 text-brown-500 font-bold bg-brown-50 px-3 py-1 rounded-lg self-start text-sm mt-1 w-max">
                            <Users size={16} />
                            <span>{expedition?.memberIds?.length || 0} Exploradores</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">

                {/* Add New Member Card - Only for Principal Expeditions */}
                {(expedition?.type === 'principal' || !expedition?.type) && (
                    <div
                        onClick={onNewMember}
                        className="
                            group relative flex flex-col items-center justify-center aspect-square rounded-3xl border-2 border-dashed border-brown-300 
                            bg-brown-50/50 hover:bg-white hover:border-brown-500 hover:shadow-xl cursor-pointer transition-all duration-300
                        "
                    >
                        <div className="w-16 h-16 rounded-full bg-brown-100 flex items-center justify-center text-brown-400 group-hover:text-brown-700 group-hover:scale-110 transition-transform mb-4">
                            <UserPlus size={32} />
                        </div>
                        <span className="font-bold text-brown-500 group-hover:text-brown-800 text-lg">Novo Recruta</span>
                    </div>
                )}

                {/* Info Message for Diversified Expeditions */}
                {expedition?.type === 'diversificada' && expedition?.memberIds?.length === 0 && (
                    <div className="col-span-2 md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-purple-300 bg-purple-50/50">
                        <div className="text-purple-600 font-bold text-lg mb-2">🌟 Turma Diversificada</div>
                        <p className="text-purple-600 text-center text-sm">
                            Esta turma recebe membros das Turmas Principais. Adicione exploradores da turma principal para aqui!
                        </p>
                    </div>
                )}

                {/* Member Cards */}
                {expedition?.memberIds?.map((memberId) => {
                    const member = allMembers.find(m => m.id === memberId);
                    if (!member) return null;

                    const ArchIcon = ARCHETYPES_CONFIG[member.archetype.title]?.icon || Smile;
                    const archColor = ARCHETYPES_CONFIG[member.archetype.title]?.color || 'bg-gray-100 text-gray-700';

                    return (
                        <Card
                            key={member.id}
                            onClick={() => onOpenMember(member)}
                            className="
                                group cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 
                                border-2 border-brown-100 hover:border-brown-400 bg-white overflow-hidden relative rounded-3xl
                                flex flex-col aspect-square
                            "
                        >
                            {/* Photo Area */}
                            <div className="relative flex-1 bg-brown-50 overflow-hidden">
                                {member.photo ? (
                                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover object-[center_20%] transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-brown-200 bg-brown-50">
                                        <ArchIcon size={80} opacity={0.5} />
                                    </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                            </div>

                            {/* Content */}
                            <div className="relative p-2 bg-white z-10 -mt-3 mx-3 rounded-lg shadow-xl border border-brown-50 flex flex-col items-center text-center">
                                <h3 className="font-bold text-brown-900 w-full text-base leading-snug mb-1 line-clamp-1 flex items-center justify-center">
                                    {member.name}
                                </h3>

                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider w-full justify-center ${archColor.split(' ')[0]} ${archColor.split(' ')[1]}`}>
                                    <ArchIcon size={10} />
                                    <span className="truncate">{member.archetype.title}</span>
                                </div>
                            </div>

                            {/* Top Right Icon Badge */}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-md text-brown-600 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                                <Smile size={20} />
                            </div>
                        </Card>
                    );
                }) || null}
            </div>
        </div>
    );
};

export default TeamView;
