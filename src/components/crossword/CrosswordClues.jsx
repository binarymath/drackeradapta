import React from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const CrosswordClues = ({ words }) => {
    const horizontalWords = words.filter(w => w.dir === 'H').sort((a, b) => a.num - b.num);
    const verticalWords = words.filter(w => w.dir === 'V').sort((a, b) => a.num - b.num);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full print:block print:break-inside-avoid">
            <Card className="print:shadow-none print:border print:mb-6 print:break-inside-avoid">
                <h3 className="font-bold text-brown-900 mb-4 flex items-center gap-2 text-lg border-b border-brown-100 pb-2">
                    <Badge variant="secondary">HORIZONTAIS</Badge>
                </h3>
                <ul className="space-y-3 text-sm">
                    {horizontalWords.map(w => (
                        <li key={w.num} className="flex items-start gap-3">
                            <span className="font-black text-brown-600 min-w-[1.5rem] text-right">{w.num}.</span>
                            <span className="text-brown-700 font-medium flex-1 whitespace-normal break-normal hyphens-none">{w.clue}</span>
                        </li>
                    ))}
                </ul>
            </Card>

            <Card className="print:shadow-none print:border print:break-inside-avoid">
                <h3 className="font-bold text-brown-900 mb-4 flex items-center gap-2 text-lg border-b border-brown-100 pb-2">
                    <Badge className="bg-brown-800 text-white border-none">VERTICAIS</Badge>
                </h3>
                <ul className="space-y-3 text-sm">
                    {verticalWords.map(w => (
                        <li key={w.num} className="flex items-start gap-3">
                            <span className="font-black text-brown-800 min-w-[1.5rem] text-right">{w.num}.</span>
                            <span className="text-brown-700 font-medium flex-1 whitespace-normal break-normal hyphens-none">{w.clue}</span>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};
