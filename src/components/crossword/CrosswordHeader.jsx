import React from 'react';
import { Sparkles, Edit2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const CrosswordHeader = ({
    topic,
    wordsCount,
    showSolution,
    toggleSolution,
    onOpenEditor,
    isGameMode
}) => {
    return (
        <Card className="flex flex-wrap justify-between items-center p-4 print:hidden">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-brown-900 flex items-center gap-2">
                    <Sparkles className="text-brown-500" />
                    {topic || "Palavras Cruzadas"}
                </h2>
                <Badge variant="outline">{wordsCount} Palavras</Badge>
            </div>
            <div className="flex gap-2 no-print flex-wrap sm:flex-nowrap">
                {!isGameMode && (
                    <>
                        <Button onClick={onOpenEditor} icon={Edit2} className="whitespace-nowrap">
                            Editar / Adicionar
                        </Button>
                        <Button
                            onClick={toggleSolution}
                            variant={showSolution ? "primary" : "secondary"}
                            className={`whitespace-nowrap min-w-[170px] text-center ${showSolution ? 'bg-green-600 text-white' : ''}`}
                        >
                            {showSolution ? 'Ocultar Solução' : 'Mostrar Solução'}
                        </Button>
                    </>
                )}
            </div>
        </Card>
    );
};
