'use client';

/**
 * Procedural SFX for phase transitions. We synthesize short tones via the Web
 * Audio API so no asset files are required and bundle size stays unchanged.
 *
 * The AudioContext is created lazily on first play because browsers require
 * a user gesture before they'll start audio. The first phase tick after the
 * host clicks Start counts as that gesture in practice.
 */

let ctxSingleton: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctxSingleton) return ctxSingleton;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctxSingleton = new AC();
  return ctxSingleton;
}

/**
 * Schedule a tone with an attack/decay envelope at `freq` Hz starting `delay`
 * seconds from now and lasting `duration` seconds. `gain` is peak amplitude.
 */
function tone(opts: {
  freq: number;
  duration: number;
  delay?: number;
  gain?: number;
  type?: OscillatorType;
}) {
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime + (opts.delay ?? 0);
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.value = opts.freq;
  const peak = opts.gain ?? 0.12;
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(peak, t0 + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.duration);
  osc.connect(env).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + opts.duration + 0.02);
}

export const sfx = {
  /** Low somber tone — start of a night phase. */
  nightFall() {
    tone({ freq: 196, duration: 0.6, type: 'sine' });
    tone({ freq: 130.8, duration: 1.0, delay: 0.2, gain: 0.08, type: 'sine' });
  },
  /** Bright chime — sun rises (day_recap). */
  dayBreak() {
    tone({ freq: 660, duration: 0.5, type: 'triangle' });
    tone({ freq: 880, duration: 0.4, delay: 0.12, gain: 0.1, type: 'triangle' });
  },
  /** Sharp gavel-ish clack — voting opens. */
  gavel() {
    tone({ freq: 240, duration: 0.18, type: 'square', gain: 0.16 });
  },
  /** Resolving chord — game end. */
  finale() {
    tone({ freq: 261.6, duration: 1.4, type: 'triangle' });
    tone({ freq: 329.6, duration: 1.4, delay: 0.05, gain: 0.09, type: 'triangle' });
    tone({ freq: 392, duration: 1.4, delay: 0.1, gain: 0.08, type: 'triangle' });
  },
};
