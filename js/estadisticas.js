// Trivia Colombia — Estadísticas agregadas (Fase 4).
// Funciones puras sobre el historial: testeables en Node sin DOM ni storage.
export const CATS = ['geografia', 'historia', 'cultura', 'deportes', 'ciencia'];
export const DIFFS = ['facil', 'medio', 'dificil'];

/**
 * Agrega estadísticas del historial de partidas.
 * @param {Array} historial — registros válidos (ver almacenamiento.js)
 * @param {number} ultimas — n.º de partidas recientes para el desempeño por categoría
 * @returns {{partidas, correctas, totalPreguntas, porcentaje, porCategoria, porDificultad, mejorCategoria}}
 * porCategoria: {cat: {ok, total, pct}} · porDificultad: {dif: {ok, total, pct}}
 */
export function calcularStats(historial = [], ultimas = 10) {
  const vacio = () => ({ ok: 0, total: 0, pct: 0 });
  const porCategoria = Object.fromEntries(CATS.map((c) => [c, vacio()]));
  const porDificultad = Object.fromEntries(DIFFS.map((d) => [d, vacio()]));
  let partidas = 0;
  let correctas = 0;
  let totalPreguntas = 0;

  const recientes = historial.slice(-Math.max(1, ultimas));
  for (const r of recientes) {
    for (const [cat, v] of Object.entries(r.detalleCategoria || {})) {
      if (!porCategoria[cat]) continue;
      porCategoria[cat].ok += v.ok || 0;
      porCategoria[cat].total += v.total || 0;
    }
  }
  for (const r of historial) {
    partidas += 1;
    correctas += r.aciertos || 0;
    totalPreguntas += r.total || 0;
    const d = porDificultad[r.dificultad];
    if (d) {
      d.ok += r.aciertos || 0;
      d.total += r.total || 0;
    }
  }
  for (const v of [...Object.values(porCategoria), ...Object.values(porDificultad)]) {
    v.pct = v.total ? Math.round((v.ok / v.total) * 100) : 0;
  }

  let mejorCategoria = null;
  let mejorPct = -1;
  let mejorTotal = 0;
  for (const [c, v] of Object.entries(porCategoria)) {
    if (v.total === 0) continue;
    if (v.pct > mejorPct || (v.pct === mejorPct && v.total > mejorTotal)) {
      mejorPct = v.pct;
      mejorTotal = v.total;
      mejorCategoria = c;
    }
  }

  return {
    partidas,
    correctas,
    totalPreguntas,
    porcentaje: totalPreguntas ? Math.round((correctas / totalPreguntas) * 100) : 0,
    porCategoria,
    porDificultad,
    mejorCategoria,
  };
}
