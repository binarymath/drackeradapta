
import React from 'react';
import { Gamepad2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const GameToggleCard = ({
    title,
    description,
    isGameMode,
    onToggle,
    color = "brown", // brown, amber, blue, green, purple
    children
}) => {
    const colorStyles = {
        brown: {
            bg: "bg-brown-50",
            border: "border-brown-200",
            iconBg: "bg-brown-100",
            iconText: "text-brown-600",
            title: "text-brown-900",
            desc: "text-brown-700",
            btnActive: "bg-brown-100 text-brown-900 hover:bg-brown-200 border-brown-300",
            btnInactive: "bg-brown-600 text-white hover:bg-brown-700"
        },
        amber: {
            bg: "bg-amber-50",
            border: "border-amber-200",
            iconBg: "bg-amber-100",
            iconText: "text-amber-600",
            title: "text-amber-900",
            desc: "text-amber-700",
            btnActive: "bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300",
            btnInactive: "bg-amber-600 text-white hover:bg-amber-700"
        },
        blue: {
            bg: "bg-blue-50",
            border: "border-blue-200",
            iconBg: "bg-blue-100",
            iconText: "text-blue-600",
            title: "text-blue-900",
            desc: "text-blue-700",
            btnActive: "bg-blue-100 text-blue-900 hover:bg-blue-200 border-blue-300",
            btnInactive: "bg-blue-600 text-white hover:bg-blue-700"
        },
        green: {
            bg: "bg-green-50",
            border: "border-green-200",
            iconBg: "bg-green-100",
            iconText: "text-green-600",
            title: "text-green-900",
            desc: "text-green-700",
            btnActive: "bg-green-100 text-green-900 hover:bg-green-200 border-green-300",
            btnInactive: "bg-green-600 text-white hover:bg-green-700"
        },
        purple: {
            bg: "bg-purple-50",
            border: "border-purple-200",
            iconBg: "bg-purple-100",
            iconText: "text-purple-600",
            title: "text-purple-900",
            desc: "text-purple-700",
            btnActive: "bg-purple-100 text-purple-900 hover:bg-purple-200 border-purple-300",
            btnInactive: "bg-purple-600 text-white hover:bg-purple-700"
        }
    };

    const s = colorStyles[color] || colorStyles.brown;

    return (
        <Card className={`mb-6 ${s.bg} ${s.border} no-print flex items-center justify-between p-4`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${s.iconBg} flex items-center justify-center ${s.iconText}`}>
                    <Gamepad2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className={`font-bold ${s.title}`}>{title}</h3>
                    <p className={`text-xs ${s.desc}`}>{description}</p>
                </div>
            </div>
            <div className="flex gap-2">
                {children}
                <Button
                    onClick={onToggle}
                    className={`transition-all shadow-sm ${isGameMode ? s.btnActive : s.btnInactive}`}
                >
                    {isGameMode ? 'Voltar para Impressão' : 'Jogar Agora'}
                </Button>
            </div>
        </Card>
    );
};
