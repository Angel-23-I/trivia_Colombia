// Trivia Colombia — Motor del juego (Fase 3).
// Responsabilidades: selección aleatoria sin repetición, estado de la partida,
// racha, comodines (50/50 y +10 s, un uso por partida, −30 c/u), registro de
// resultados por pregunta y resumen final. La puntuación delega SIEMPRE en
// puntuacion.js (función central). Sin acceso al DOM: testeable en Node.
import { PREGUNTAS, CATEGORIAS } from './preguntas.js';
import { calcularPuntos } from './puntuacion.js';

export const TOTAL_PREGUNTAS = 10;
export const TIEMPO_POR_PREGUNTA = 20;
export const EXTRA_SEGUNDOS = 10;

/** Mezcla Fisher-Yates; devuelve copia nueva (no muta el original). */
export function mezclar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** N.º de preguntas disponibles para una configuración (sin iniciar partida). */
export function contarDisponibles(categorias = ['todas'], dificultad = 'medio') {
  const cats = categorias.includes('todas') ? CATEGORIAS : categorias;
  return PREGUNTAS.filter((q) => cats.includes(q.categoria) && q.dificultad === dificultad).length;
}

/**
 * Selecciona 10 preguntas aleatorias sin repetición.
 * @returns {{ok:true, preguntas} | {ok:false, disponibles}}
 */
export function seleccionarPreguntas(categorias = ['todas'], dificultad = 'medio', total = TOTAL_PREGUNTAS) {
  const cats = categorias.includes('todas') ? CATEGORIAS : categorias;
  const pool = PREGUNTAS.filter((q) => cats.includes(q.categoria) && q.dificultad === dificultad);
  if (pool.length < total) return { ok: false, disponibles: pool.length };
  return { ok: true, preguntas: mezclar(pool).slice(0, total) };
}

/**
 * Crea el estado de una partida. No inicia UI ni temporizador.
 * @returns {{ok:true, partida} | {ok:false, disponibles}}
 */
export function crearPartida({ jugador, categorias = ['todas'], dificultad = 'medio' } = {}) {
  const sel = seleccionarPreguntas(categorias, dificultad);
  if (!sel.ok) return sel;
  return {
    ok: true,
    partida: {
      jugador, categorias: [...categorias], dificultad,
      preguntas: sel.preguntas,
      indice: 0,
      puntos: 0,
      racha: 0,
      fiftyUsado: false, // 50/50: una vez por partida
      extraUsado: false, // +10 s: una vez por partida
      actual: nuevaPregunta(),
      resultados: [],
      terminada: false,
    },
  };
}

function nuevaPregunta() {
  return { eliminadas: [], fifty: false, extra: false, respondida: false };
}

export function preguntaActual(partida) {
  return partida.preguntas[partida.indice];
}

export function esUltima(partida) {
  return partida.indice >= partida.preguntas.length - 1;
}

/**
 * Comodín 50/50: elimina 2 incorrectas. Solo 1 vez por partida y solo
 * antes de responder. Registra la penalización (−30) para esta pregunta.
 * @returns {{ok:true, eliminadas:[i,i]} | {ok:false, motivo}}
 */
export function usar5050(partida) {
  const act = partida.actual;
  if (partida.terminada) return { ok: false, motivo: 'partida terminada' };
  if (act.respondida) return { ok: false, motivo: 'pregunta ya respondida' };
  if (partida.fiftyUsado || act.fifty) return { ok: false, motivo: 'comodín ya usado' };
  const q = preguntaActual(partida);
  const incorrectas = mezclar(q.opciones.map((_, i) => i).filter((i) => i !== q.correcta));
  const eliminadas = incorrectas.slice(0, 2).sort((a, b) => a - b);
  partida.fiftyUsado = true;
  act.fifty = true;
  act.eliminadas = eliminadas;
  return { ok: true, eliminadas };
}

/**
 * Comodín +10 s: suma tiempo al temporizador dado. Solo 1 vez por partida
 * y solo antes de responder. La penalización (−30) queda registrada.
 * @returns {{ok:true} | {ok:false, motivo}}
 */
export function usarExtra(partida, temporizador = null) {
  const act = partida.actual;
  if (partida.terminada) return { ok: false, motivo: 'partida terminada' };
  if (act.respondida) return { ok: false, motivo: 'pregunta ya respondida' };
  if (partida.extraUsado || act.extra) return { ok: false, motivo: 'comodín ya usado' };
  partida.extraUsado = true;
  act.extra = true;
  temporizador?.agregar(EXTRA_SEGUNDOS);
  return { ok: true };
}

/** Tiempo asignado a la pregunta actual (20 s, +10 si usó tiempo extra). */
export function tiempoAsignado(partida) {
  return TIEMPO_POR_PREGUNTA + (partida.actual.extra ? EXTRA_SEGUNDOS : 0);
}

/**
 * Registra la respuesta. `elegido`: índice 0-3 o null (timeout).
 * Idempotente: si la pregunta ya se respondió, devuelve null (anticoncurrencia).
 */
export function responder(partida, { elegido = null, segundosRestantes = 0 } = {}) {
  const act = partida.actual;
  if (partida.terminada || act.respondida) return null;
  act.respondida = true;

  const q = preguntaActual(partida);
  const valida = Number.isInteger(elegido) && elegido >= 0 && elegido < q.opciones.length
    && !act.eliminadas.includes(elegido);
  const sel = valida ? elegido : null; // clic en eliminada o índice raro = sin respuesta
  const acierto = sel !== null && sel === q.correcta;

  const nuevaRacha = acierto ? partida.racha + 1 : 0;
  const rachaCompleta = acierto && nuevaRacha % 3 === 0;
  const comodines = (act.fifty ? 1 : 0) + (act.extra ? 1 : 0);
  const puntos = calcularPuntos({
    correcta: acierto,
    segundosRestantes: Math.max(0, segundosRestantes),
    rachaCompleta,
    dificultad: partida.dificultad,
    comodines,
  });

  partida.puntos += puntos;
  partida.racha = nuevaRacha;

  const res = {
    pregunta: q,
    elegido: sel,
    timeout: elegido === null,
    acierto,
    puntos,
    rachaCompleta,
    segundosRestantes: Math.max(0, segundosRestantes),
    tiempoUsado: tiempoAsignado(partida) - Math.max(0, segundosRestantes),
    comodines,
  };
  partida.resultados.push(res);
  return res;
}

/** Avanza a la siguiente pregunta. Devuelve false si la partida terminó. */
export function siguiente(partida) {
  if (partida.indice >= partida.preguntas.length - 1) {
    partida.terminada = true;
    return false;
  }
  partida.indice += 1;
  partida.actual = nuevaPregunta();
  return true;
}

/** Resumen final: totales, tiempos, mejor categoría y preguntas falladas. */
export function resumen(partida) {
  const aciertos = partida.resultados.filter((r) => r.acierto).length;
  const noRespondidas = partida.resultados.filter((r) => r.elegido === null).length;
  const errores = partida.resultados.length - aciertos - noRespondidas;
  const tiempoTotal = partida.resultados.reduce((a, r) => a + r.tiempoUsado, 0);

  // Desempeño por categoría: {categoria: {ok, total}}
  const porCat = {};
  for (const r of partida.resultados) {
    const c = r.pregunta.categoria;
    porCat[c] = porCat[c] || { ok: 0, total: 0 };
    porCat[c].total += 1;
    if (r.acierto) porCat[c].ok += 1;
  }
  let mejorCategoria = null;
  let mejorTasa = -1;
  for (const [c, v] of Object.entries(porCat)) {
    const tasa = v.ok / v.total;
    if (tasa > mejorTasa || (tasa === mejorTasa && v.total > (porCat[mejorCategoria]?.total ?? 0))) {
      mejorTasa = tasa;
      mejorCategoria = c;
    }
  }

  return {
    jugador: partida.jugador,
    categorias: [...partida.categorias],
    dificultad: partida.dificultad,
    puntos: partida.puntos,
    aciertos,
    errores,
    noRespondidas,
    total: partida.resultados.length,
    porcentaje: partida.resultados.length ? Math.round((aciertos / partida.resultados.length) * 100) : 0,
    tiempoTotal,
    mejorCategoria,
    porCategoria: porCat,
    falladas: partida.resultados.filter((r) => !r.acierto),
  };
}
