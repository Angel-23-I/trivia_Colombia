// Trivia Colombia — Persistencia localStorage (Fase 4).
// Guarda: ranking top-10, historial (para estadísticas), mejor puntuación y
// preferencia de tema. Todo validado al leer; ante datos ausentes/inválidos
// o errores de E/S se usan valores vacíos y se avisa en consola. Sin
// localStorage, el juego sigue funcionando sin persistencia. Nada sensible.
export const KEYS = {
  ranking: 'tc_ranking_v1',
  historial: 'tc_historial_v1',
  best: 'tc_best_v1',
  theme: 'tc_theme_v1',
  perfil: 'tc_perfil_v1',
  sonido: 'tc_sonido_v1',
};
export const MAX_RANKING = 10;
export const MAX_HISTORIAL = 100;

export function storageOK() {
  try {
    localStorage.setItem('__tc', '1');
    localStorage.removeItem('__tc');
    return true;
  } catch {
    return false;
  }
}

function leerJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    console.warn(`[storage] Dato inválido en ${key}; se ignora.`);
    return fallback;
  }
}

function escribirJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    console.warn(`[storage] No se pudo guardar ${key}.`);
    return false;
  }
}

/**
 * ¿Es un registro de partida válido?
 * {nombre, puntos, categorias, dificultad, fecha, aciertos, errores,
 *  noRespondidas, tiempo, total}
 */
export function esRegistroValido(r) {
  if (!r || typeof r !== 'object') return false;
  if (typeof r.nombre !== 'string' || !r.nombre.trim()) return false;
  if (!Number.isFinite(r.puntos) || r.puntos < 0) return false;
  if (!Array.isArray(r.categorias) || r.categorias.length === 0) return false;
  if (!['facil', 'medio', 'dificil'].includes(r.dificultad)) return false;
  if (typeof r.fecha !== 'string' || Number.isNaN(Date.parse(r.fecha))) return false;
  for (const k of ['aciertos', 'errores', 'noRespondidas', 'tiempo', 'total']) {
    if (!Number.isInteger(r[k]) || r[k] < 0) return false;
  }
  return true;
}

/** Comparador: puntos desc → tiempo asc → fecha más reciente primero. */
export function compararRegistros(a, b) {
  if (b.puntos !== a.puntos) return b.puntos - a.puntos;
  if (a.tiempo !== b.tiempo) return a.tiempo - b.tiempo;
  return Date.parse(b.fecha) - Date.parse(a.fecha);
}

/** Ordena (sin mutar) y recorta al top-10. Función pura y testeable. */
export function topRanking(registros = []) {
  return registros.filter(esRegistroValido).sort(compararRegistros).slice(0, MAX_RANKING);
}

export function cargarRanking() {
  const datos = leerJSON(KEYS.ranking, []);
  return topRanking(Array.isArray(datos) ? datos : []);
}

export function cargarHistorial() {
  const datos = leerJSON(KEYS.historial, []);
  if (!Array.isArray(datos)) return [];
  return datos.filter(esRegistroValido).slice(-MAX_HISTORIAL);
}

/** Guarda un registro en ranking + historial. Devuelve false sin storage. */
export function guardarPartida(registro) {
  if (!esRegistroValido(registro)) return false;
  if (!storageOK()) return false;
  const ranking = topRanking([...cargarRanking(), registro]);
  const historial = [...cargarHistorial(), registro].slice(-MAX_HISTORIAL);
  escribirJSON(KEYS.ranking, ranking);
  escribirJSON(KEYS.historial, historial);
  // Mejor puntuación
  try {
    const best = leerJSON(KEYS.best, null);
    if (!best || typeof best.pts !== 'number' || registro.puntos > best.pts) {
      escribirJSON(KEYS.best, { nombre: registro.nombre, pts: registro.puntos });
    }
  } catch { /* noop */ }
  return true;
}

export function cargarBest() {
  const b = leerJSON(KEYS.best, null);
  if (b && typeof b.pts === 'number' && typeof b.nombre === 'string') return b;
  return null;
}

/** Borra ranking, historial y mejor puntuación (conserva el tema). */
export function borrarDatos() {
  if (!storageOK()) return false;
  try {
    localStorage.removeItem(KEYS.ranking);
    localStorage.removeItem(KEYS.historial);
    localStorage.removeItem(KEYS.best);
    return true;
  } catch {
    return false;
  }
}
