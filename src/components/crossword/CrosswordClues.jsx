import React from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const CrosswordClues = ({ words }) => {
    const horizontalWords = words.filter(w => w.dir === 'H').sort((a, b) => a.num - b.num);
    const verticalWords = words.filter(w => w.dir === 'V').sort((a, b) => a.num - b.num);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full print:grid print:grid-cols-2 print:gap-4">
            <Card className="print:shadow-none print:border-none print:p-0 print:m-0 print:break-inside-avoid">
                <h3 className="font-bold text-brown-900 mb-2 flex items-center gap-2 text-md border-b border-brown-200 pb-1">
                    <Badge variant="secondary" className="print:border print:border-brown-400">HORIZONTAIS</Badge>
                </h3>
                <ul className="space-y-1.5 text-sm print:text-xs">
                    {horizontalWords.map(w => (
                        <li key={w.num} className="flex items-start gap-2">
                            <span className="font-black text-brown-600 min-w-[1.2rem] text-right">{w.num}.</span>
                            <span className="text-brown-700 font-medium flex-1 whitespace-normal break-normal hyphens-none leading-tight">{w.clue}</span>
                        </li>
                    ))}
                </ul>
            </Card>

            <Card className="print:shadow-none print:border-none print:p-0 print:m-0 print:break-inside-avoid">
                <h3 className="font-bold text-brown-900 mb-2 flex items-center gap-2 text-md border-b border-brown-200 pb-1">
                    <Badge className="bg-brown-800 text-white print:border print:border-brown-400 print:bg-white print:text-brown-900">VERTICAIS</Badge>
                </h3>
                <ul className="space-y-1.5 text-sm print:text-xs">
                    {verticalWords.map(w => (
                        <li key={w.num} className="flex items-start gap-2">
                            <span className="font-black text-brown-800 min-w-[1.2rem] text-right">{w.num}.</span>
                            <span className="text-brown-700 font-medium flex-1 whitespace-normal break-normal hyphens-none leading-tight">{w.clue}</span>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};
