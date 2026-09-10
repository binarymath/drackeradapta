// Utilitário de Efeitos Sonoros Gamificados usando Web Audio API nativa
// Sem dependências externas de áudio e 100% offline

class GameAudioManager {
    constructor() {
        this.ctx = null;
    }

    getAudioContext() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    // Som de clique/tick suave para troca de perguntas e cronômetro
    playTick() {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch (e) {
            // Silencioso em caso de restrição do navegador
        }
    }

    // Som alegre de acerto/vitória (acorde ascendente C5 -> E5 -> G5 -> C6)
    playSuccess() {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const startTime = ctx.currentTime;

            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime + (idx * 0.08));

                gain.gain.setValueAtTime(0.12, startTime + (idx * 0.08));
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + (idx * 0.08) + 0.35);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime + (idx * 0.08));
                osc.stop(startTime + (idx * 0.08) + 0.35);
            });
        } catch (e) {}
    }

    // Som acolhedor para ajuda ou convocação de colega
    playHelp() {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const notes = [440, 554.37, 659.25]; // A4, C#5, E5
            const startTime = ctx.currentTime;

            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime + (idx * 0.09));

                gain.gain.setValueAtTime(0.1, startTime + (idx * 0.09));
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + (idx * 0.09) + 0.3);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime + (idx * 0.09));
                osc.stop(startTime + (idx * 0.09) + 0.3);
            });
        } catch (e) {}
    }

    // Som de sino/ding para quando o cronômetro do Todos Respondem finaliza
    playTimerEnd() {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.6);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        } catch (e) {}
    }
}

export const gameAudio = new GameAudioManager();
