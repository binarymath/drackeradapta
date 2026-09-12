import React from 'react';
import { SlotMachineWheel } from './styles/SlotMachineWheel';
import { MarqueeTickerWheel } from './styles/MarqueeTickerWheel';
import { ClassicVegasWheel } from './styles/ClassicVegasWheel';
import { CyberpunkWheel } from './styles/CyberpunkWheel';
import { ArcadeRetroWheel } from './styles/ArcadeRetroWheel';
import { CosmicWheel } from './styles/CosmicWheel';
import { MinimalistGlassWheel } from './styles/MinimalistGlassWheel';

export const RouletteWheel = ({
    style = 'slot_machine',
    items = [],
    spinning = false,
    winner = null,
    onSpinComplete
}) => {
    switch (style) {
        case 'slot_machine':
            return (
                <SlotMachineWheel
                    items={items}
                    spinning={spinning}
                    winner={winner}
                    onSpinComplete={onSpinComplete}
                />
            );
        case 'marquee':
            return (
                <MarqueeTickerWheel
                    items={items}
                    spinning={spinning}
                    winner={winner}
                    onSpinComplete={onSpinComplete}
                />
            );
        case 'cyberpunk':
            return (
                <CyberpunkWheel
                    items={items}
                    spinning={spinning}
                    winner={winner}
                    onSpinComplete={onSpinComplete}
                />
            );
        case 'arcade':
            return (
                <ArcadeRetroWheel
                    items={items}
                    spinning={spinning}
                    winner={winner}
                    onSpinComplete={onSpinComplete}
                />
            );
        case 'cosmic':
            return (
                <CosmicWheel
                    items={items}
                    spinning={spinning}
                    winner={winner}
                    onSpinComplete={onSpinComplete}
                />
            );
        case 'minimalist':
            return (
                <MinimalistGlassWheel
                    items={items}
                    spinning={spinning}
                    winner={winner}
                    onSpinComplete={onSpinComplete}
                />
            );
        case 'classic':
        default:
            return (
                <ClassicVegasWheel
                    items={items}
                    spinning={spinning}
                    winner={winner}
                    onSpinComplete={onSpinComplete}
                />
            );
    }
};

export {
    SlotMachineWheel,
    MarqueeTickerWheel,
    ClassicVegasWheel,
    CyberpunkWheel,
    ArcadeRetroWheel,
    CosmicWheel,
    MinimalistGlassWheel
};
