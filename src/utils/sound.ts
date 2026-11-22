class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08) {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  playDiceRoll() {
    this.playTone(260, 0.06, 'triangle', 0.06);
    window.setTimeout(() => this.playTone(340, 0.06, 'triangle', 0.06), 70);
    window.setTimeout(() => this.playTone(420, 0.07, 'triangle', 0.07), 140);
  }

  playTokenHop() {
    this.playTone(520, 0.09, 'sine', 0.08);
  }

  playCapture() {
    this.playTone(220, 0.14, 'sawtooth', 0.08);
    window.setTimeout(() => this.playTone(150, 0.2, 'sawtooth', 0.09), 90);
  }

  playGoal() {
    this.playTone(523.25, 0.12, 'triangle', 0.1);
    window.setTimeout(() => this.playTone(659.25, 0.12, 'triangle', 0.1), 110);
    window.setTimeout(() => this.playTone(783.99, 0.2, 'triangle', 0.12), 220);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      window.setTimeout(() => this.playTone(n, 0.24, 'triangle', 0.12), idx * 120);
    });
  }
}

export const soundFX = new SoundEngine();
