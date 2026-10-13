// Trivia Colombia — Puntuación central (Fase 3).
// ÚNICA función de puntuación del proyecto: toda la partida la usa.
// Fórmula oficial (§7):
//   Puntos = max(0, [(100 + rapidez + racha) × multiplicador − penalización])
// - Base acierto: 100 · Rapidez: +5 por segundo restante (máx +100)
// - Racha: +50 al completar 3 aciertos seguidos (3.º, 6.º, 9.º…)
// - Fallo o timeout: 0 puntos base (la penalización no resta del acumulado
//   ni puede dejar negativos: el suelo max(0, …) aplica en todos los caminos).
// - Multiplicador: facil ×1, medio ×1.5, dificil ×2. Siempre entero (sin decimales).
export const PTS_BASE = 100;
export const PTS_POR_SEGUNDO = 5;
export const PTS_RAPIDEZ_MAX = 100;
export const PTS_RACHA = 50;
export const PTS_COMODIN = 30;
export const MULT = { facil: 1, medio: 1.5, dificil: 2 };

/** Bonificación por rapidez según segundos restantes (0-30). */
export function bonusRapidez(segundosRestantes) {
  const s = Math.max(0, Math.min(30, Math.floor(segundosRestantes ?? 0)));
  return Math.min(PTS_RAPIDEZ_MAX, s * PTS_POR_SEGUNDO);
}

export function multiplicador(dificultad) {
  return MULT[dificultad] ?? 1;
}

/**
 * Calcula los puntos de UNA pregunta.
 * @param {object} p
 * @param {boolean} p.correcta — ¿acertó?
 * @param {number} p.segundosRestantes — tiempo restante al responder
 * @param {boolean} p.rachaCompleta — ¿esta respuesta completa una racha de 3?
 * @param {string} p.dificultad — 'facil' | 'medio' | 'dificil'
 * @param {number} p.comodines — n.º de comodines usados en esta pregunta (0-2)
 * @returns {number} entero ≥ 0 (nunca negativo, aun con penalización)
 */
export function calcularPuntos({ correcta, segundosRestantes = 0, rachaCompleta = false, dificultad = 'medio', comodines = 0 } = {}) {
  const nCom = Number.isInteger(comodines) && comodines > 0 ? comodines : 0;
  const bruto = correcta
    ? (PTS_BASE + bonusRapidez(segundosRestantes) + (rachaCompleta ? PTS_RACHA : 0)) * multiplicador(dificultad)
    : 0; // §7: incorrecta o no respondida = 0 puntos base
  return Math.max(0, Math.round(bruto - nCom * PTS_COMODIN));
}
