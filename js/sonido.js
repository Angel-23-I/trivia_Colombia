// Trivia Colombia — Sonido (Web Audio, sin archivos externos).
// Efectos generados por oscilador: funciona offline. La preferencia persiste
// en localStorage. Todo envuelto en try/catch: sin audio (o sin storage) el
// juego sigue funcionando en silencio. `secuencia()` es pura y testeable.
import { KEYS } from './almacenamiento.js';

let ctx = null;
let cache = null;

export function sonidoHabilitado() {
  if (cache !== null) return cache;
  try {
    const v = localStorage.getItem(KEYS.sonido);
    cache = v === null ? true : v === '1';
  } catch {
    cache = true;
  }
  return cache;
}

export function fijarSonido(on) {
  cache = !!on;
  try {
    localStorage.setItem(KEYS.sonido, cache ? '1' : '0');
  } catch { /* sin persistencia: vale por la sesión */ }
  return cache;
}

/** Secuencias [frecuencia Hz, duración s] por evento. */
export const SECUENCIAS = {
  clic: [[660, 0.06]],
  ok: [[523.25, 0.09], [783.99, 0.14]],
  bad: [[220, 0.12], [164.81, 0.18]],
  fin: [[523.25, 0.1], [659.25, 0.1], [783.99, 0.1], [1046.5, 0.22]],
};

export function secuencia(nombre) {
  const s = SECUENCIAS[nombre];
  return s ? s.map(([freq, dur]) => ({ freq, dur })) : [];
}

/** Reproduce un efecto si el sonido está activo. Nunca lanza. */
export function reproducir(nombre) {
  if (!sonidoHabilitado()) return false;
  if (!secuencia(nombre).length) return false;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    let t = ctx.currentTime;
    for (const { freq, dur } of secuencia(nombre)) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur + 0.03;
    }
    return true;
  } catch {
    return false;
  }
}
