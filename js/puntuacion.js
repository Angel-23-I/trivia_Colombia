// Puntuación central — FASE 3 (stub documentado de Fase 1).
// Fórmula oficial: max(0, [(100 + rapidez + racha) × multiplicador − penalización])
// rapidez = 5 × segundosRestantes (máx 100) · racha = 50 cada 3 aciertos seguidos
// multiplicador: facil ×1, medio ×1.5, dificil ×2 · penalización: 30 por comodín.
export const MULT = { facil: 1, medio: 1.5, dificil: 2 };
export function calcularPuntos() { return 0; }
