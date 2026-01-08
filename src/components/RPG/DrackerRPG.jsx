
import React, { useState } from 'react';
import { AdventureScreen } from './AdventureScreen';
import { RulesScreen } from './RulesScreen';
import { ManagementScreen } from './ManagementScreen';
import { RPGGameMode } from './RPGGameMode';

export default function DrackerRPG({ data }) {
    // View state: 'adventure', 'rules', 'management' (default: adventure)
    // Data comes from the generation logic, so we start directly in 'adventure' view
    // unless there is no data, but typically this component is only rendered if activeActivity exists.

    const [view, setView] = useState('adventure');

    // If we wanted to allow "New Adventure" from within this component, we would need 
    // to bubble up triggers to the parent or context. For now, the user uses the Sidebar to generate.

    // The 'data' prop contains { title, theme, villain, intro, encounters: [...] }

    return (
        <div className="min-h-full font-sans text-brown-800 pb-12">
            <div className="max-w-5xl mx-auto">
                {view === 'adventure' && data && (
                    <AdventureScreen adventureData={data} setView={setView} />
                )}

                {view === 'rules' && (
                    <RulesScreen onBack={() => setView('adventure')} />
                )}

                {view === 'management' && (
                    <ManagementScreen onBack={() => setView('adventure')} />
                )}

                {view === 'game' && data && (
                    <RPGGameMode adventureData={data} onExit={() => setView('adventure')} />
                )}
            </div>
        </div>
    );
}
