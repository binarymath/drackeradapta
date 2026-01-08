
import React, { useState } from 'react';
import { Users, Minus, Plus, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { CLASS_ROLES, generateGuildNames } from './RPGUtils.jsx';

export const ManagementScreen = ({ onBack }) => {
    const [students, setStudents] = useState(38);
    const [targetSize, setTargetSize] = useState(6);
    const [generatedNames, setGeneratedNames] = useState([]);

    const totalGroups = Math.max(1, Math.floor(students / targetSize));
    const countBig = students % totalGroups;
    const sizeBig = Math.floor(students / totalGroups) + 1;
    const countSmall = totalGroups - countBig;
    const sizeSmall = Math.floor(students / totalGroups);

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-md border-t-8 border-blue-600 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                    <Users className="text-blue-600" /> Conselho de Guildas
                </h2>
                <Button onClick={onBack} variant="secondary" className="gap-2">
                    <ArrowLeft size={16} /> Voltar
                </Button>
            </div>

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

            <div>
                <h3 className="text-lg font-bold text-brown-800 mb-2">Painel de Classes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {CLASS_ROLES.map((role) => (
                        <div key={role.id} className={`p-2 rounded border ${role.color} flex flex-col items-center text-center`}>
                            <div className="mb-1">{role.icon}</div>
                            <span className="font-bold text-xs">{role.name}</span>
                            <span className="text-[10px] opacity-80">{role.role}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
