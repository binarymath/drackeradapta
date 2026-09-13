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

    // Som de explosão dramática de bomba (Impacto de Ruído + Sub-grave estrondoso)
    playExplosion() {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const duration = 1.8;

            // 1. Ruído de impacto e estilhaços
            const bufferSize = Math.floor(ctx.sampleRate * duration);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.45));
            }

            const noiseNode = ctx.createBufferSource();
            noiseNode.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(900, now);
            filter.frequency.exponentialRampToValueAtTime(60, now + duration);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(1.0, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noiseNode.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            // 2. Onda de choque grave (Boom de 160Hz decaindo para 25Hz)
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(25, now + 1.3);

            oscGain.gain.setValueAtTime(0.95, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

            osc.connect(oscGain);
            oscGain.connect(ctx.destination);

            noiseNode.start(now);
            noiseNode.stop(now + duration);
            osc.start(now);
            osc.stop(now + 1.3);
        } catch (e) {}
    }

    // Som de tic-tac urgente de bomba (pavio aceso)
    playBombTick(isUrgent = false) {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = isUrgent ? 'sawtooth' : 'square';
            osc.frequency.setValueAtTime(isUrgent ? 1400 : 950, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

            gain.gain.setValueAtTime(isUrgent ? 0.18 : 0.09, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.04);
        } catch (e) {}
    }
}

export const gameAudio = new GameAudioManager();
