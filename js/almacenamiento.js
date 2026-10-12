// Persistencia localStorage — FASE 4 (stub de Fase 1).
export const KEYS = { ranking: 'tc_ranking_v1', best: 'tc_best_v1', theme: 'tc_theme_v1' };
export function storageOK() {
  try { localStorage.setItem('__tc', '1'); localStorage.removeItem('__tc'); return true; }
  catch { return false; }
}
