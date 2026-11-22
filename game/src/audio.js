// Tiny WebAudio synth for the heist: no audio files, just oscillators.
// One file, one job: the pickup chime, the alarm tick, the caught sting,
// the escape arpeggio and the EMP zap.

export function createAudio() {
  let ctx = null;
  function ensure() {
    if (ctx) return ctx;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
    } catch {
      return null;
    }
    return ctx;
  }

  function tone(freq, seconds, type, gainValue, when = 0) {
    const ac = ensure();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(gainValue, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  return {
    pickup() {
      tone(880, 0.12, 'sine', 0.12);
      tone(1318, 0.16, 'sine', 0.1, 0.07);
    },
    alarm() {
      tone(220, 0.18, 'square', 0.06);
      tone(196, 0.18, 'square', 0.06, 0.2);
    },
    caught() {
      tone(311, 0.35, 'sawtooth', 0.12);
      tone(233, 0.5, 'sawtooth', 0.12, 0.22);
    },
    escaped() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.09));
    },
    emp() {
      tone(1200, 0.3, 'sawtooth', 0.08);
      tone(300, 0.35, 'sawtooth', 0.08, 0.05);
    },
  };
}
