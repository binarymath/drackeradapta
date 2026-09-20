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

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
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

                gain.gain.setValueAtTime(0.3, startTime + (idx * 0.08));
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

                gain.gain.setValueAtTime(0.25, startTime + (idx * 0.09));
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

            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.6);
        } catch (e) {}
    }

    // Som de explosão colossal e cinematográfica (Impacto triplo + Sub-grave sísmico + Eco de trovão)
    playExplosion() {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const duration = 3.5;

            // Compressor / Limiter para maximizar o estrondo e impacto sonoro sem distorção indesejada
            const compressor = ctx.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-4, now);
            compressor.knee.setValueAtTime(8, now);
            compressor.ratio.setValueAtTime(18, now);
            compressor.attack.setValueAtTime(0.001, now);
            compressor.release.setValueAtTime(0.35, now);
            compressor.connect(ctx.destination);

            // ========================================================
            // 1. IMPACTO INICIAL: Estalo ultra-rápido de choque (Detonation Crack)
            // ========================================================
            const snapBufferSize = Math.floor(ctx.sampleRate * 0.18);
            const snapBuffer = ctx.createBuffer(1, snapBufferSize, ctx.sampleRate);
            const snapData = snapBuffer.getChannelData(0);
            for (let i = 0; i < snapBufferSize; i++) {
                snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
            }
            const snapSource = ctx.createBufferSource();
            snapSource.buffer = snapBuffer;

            const snapFilter = ctx.createBiquadFilter();
            snapFilter.type = 'highpass';
            snapFilter.frequency.setValueAtTime(900, now);

            const snapGain = ctx.createGain();
            snapGain.gain.setValueAtTime(1.5, now);
            snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            snapSource.connect(snapFilter);
            snapFilter.connect(snapGain);
            snapGain.connect(compressor);
            snapSource.start(now);

            // ========================================================
            // 2. CORPO DA EXPLOSÃO: Ruído denso com estilhaços e queda dinâmica
            // ========================================================
            const noiseBufferSize = Math.floor(ctx.sampleRate * duration);
            const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
            const noiseData = noiseBuffer.getChannelData(0);
            for (let i = 0; i < noiseBufferSize; i++) {
                // Adiciona micro-estalos e estilhaços pontuais
                const crackle = Math.random() > 0.985 ? (Math.random() * 2 - 1) : 0;
                noiseData[i] = ((Math.random() * 2 - 1) * 0.85 + crackle) * Math.exp(-i / (ctx.sampleRate * 1.1));
            }
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(2800, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(70, now + 2.8);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(1.8, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(compressor);
            noiseSource.start(now);

            // ========================================================
            // 3. SUB-GRAVE SÍSMICO (Earthquake Sub-Bass 160Hz -> 18Hz)
            // ========================================================
            const subOsc = ctx.createOscillator();
            subOsc.type = 'sawtooth';
            subOsc.frequency.setValueAtTime(160, now);
            subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.4);
            subOsc.frequency.exponentialRampToValueAtTime(18, now + 2.2);

            const subFilter = ctx.createBiquadFilter();
            subFilter.type = 'lowpass';
            subFilter.frequency.setValueAtTime(200, now);
            subFilter.frequency.exponentialRampToValueAtTime(45, now + 2.2);

            const subGain = ctx.createGain();
            subGain.gain.setValueAtTime(2.2, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.3);

            subOsc.connect(subFilter);
            subFilter.connect(subGain);
            subGain.connect(compressor);
            subOsc.start(now);
            subOsc.stop(now + 2.3);

            // ========================================================
            // 4. ONDA DE CHOQUE SECUNDÁRIA (Segundo Baque / Trovoada Estrondosa)
            // ========================================================
            const rumbleOsc = ctx.createOscillator();
            rumbleOsc.type = 'triangle';
            rumbleOsc.frequency.setValueAtTime(95, now + 0.08);
            rumbleOsc.frequency.exponentialRampToValueAtTime(24, now + 3.0);

            const rumbleGain = ctx.createGain();
            rumbleGain.gain.setValueAtTime(0.001, now);
            rumbleGain.gain.setValueAtTime(1.4, now + 0.08);
            rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

            rumbleOsc.connect(rumbleGain);
            rumbleGain.connect(compressor);
            rumbleOsc.start(now + 0.08);
            rumbleOsc.stop(now + 3.0);

        } catch (e) {
            console.warn("Erro ao reproduzir áudio da explosão:", e);
        }
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

            gain.gain.setValueAtTime(isUrgent ? 0.4 : 0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.04);
        } catch (e) {}
    }
}

export const gameAudio = new GameAudioManager();
