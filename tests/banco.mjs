// Validador del banco de preguntas. Uso desde la raíz: node tests/banco.mjs
import { PREGUNTAS, CATEGORIAS, DIFICULTADES } from '../js/preguntas.js';

const errors = [];
const ids = new Set();
const seenEnunciado = new Map(); // normalizado -> id
const dist = {};

for (const q of PREGUNTAS) {
  const where = q?.id ?? '(sin id)';
  if (!q.id || typeof q.id !== 'string') errors.push(`${where}: id faltante`);
  else if (ids.has(q.id)) errors.push(`${where}: id duplicado`);
  ids.add(q.id);
  if (!CATEGORIAS.includes(q.categoria)) errors.push(`${where}: categoria inválida (${q.categoria})`);
  if (!DIFICULTADES.includes(q.dificultad)) errors.push(`${where}: dificultad inválida (${q.dificultad})`);
  if (typeof q.enunciado !== 'string' || q.enunciado.trim().length < 10) errors.push(`${where}: enunciado muy corto o ausente`);
  if (!Array.isArray(q.opciones) || q.opciones.length !== 4) errors.push(`${where}: debe tener exactamente 4 opciones`);
  else q.opciones.forEach((o, i) => {
    if (typeof o !== 'string' || o.trim().length < 1) errors.push(`${where}: opción ${i} vacía`);
  });
  if (new Set((q.opciones || []).map((o) => String(o).trim().toLowerCase())).size !== 4) errors.push(`${where}: opciones duplicadas entre sí`);
  if (!Number.isInteger(q.correcta) || q.correcta < 0 || q.correcta > 3) errors.push(`${where}: correcta debe ser 0-3`);
  if (typeof q.explicacion !== 'string' || q.explicacion.trim().length < 10) errors.push(`${where}: explicación muy corta o ausente`);
  const norm = String(q.enunciado || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (seenEnunciado.has(norm)) errors.push(`${where}: enunciado duplicado de ${seenEnunciado.get(norm)}`);
  else seenEnunciado.set(norm, q.id);
  const key = `${q.categoria}/${q.dificultad}`;
  dist[key] = (dist[key] || 0) + 1;
}

console.log('TOTAL:', PREGUNTAS.length);
for (const c of CATEGORIAS) {
  console.log(c, ':', DIFICULTADES.map((d) => `${d}=${dist[`${c}/${d}`] || 0}`).join(' '));
}
let poolsOk = true;
for (const c of CATEGORIAS) {
  for (const d of DIFICULTADES) {
    const n = PREGUNTAS.filter((q) => q.categoria === c && q.dificultad === d).length;
    if (n < 10) { poolsOk = false; console.log(`X pool ${c}/${d}: ${n} (<10 para una partida)`);
    }
  }
}
if (!poolsOk) errors.push('pools insuficientes para partidas de 10');
if (errors.length) {
  console.log(`--- ERRORES (${errors.length}) ---`);
  errors.forEach((e) => console.log('X ' + e));
  process.exit(1);
} else {
  console.log('VALIDACIÓN OK: sin errores.');
}
