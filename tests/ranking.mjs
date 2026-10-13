// Ranking (orden, validación, tope) y estadísticas agregadas.
// Uso desde la raíz: node tests/ranking.mjs
import {
  esRegistroValido, topRanking, MAX_RANKING,
} from '../js/almacenamiento.js';
import { calcularStats } from '../js/estadisticas.js';

let pass = 0, fail = 0;
function t(nombre, cond, extra = '') {
  if (cond) { pass += 1; console.log(`OK  ${nombre}`); }
  else { fail += 1; console.log(`X   ${nombre} ${extra}`); }
}
const R = (o) => ({
  nombre: 'A', puntos: 100, categorias: ['todas'], dificultad: 'medio',
  fecha: '2026-10-01T10:00:00.000Z', aciertos: 5, errores: 5,
  noRespondidas: 0, tiempo: 120, total: 10, ...o,
});

/* validación */
t('válido', esRegistroValido(R()) === true);
t('sin nombre', esRegistroValido(R({ nombre: '  ' })) === false);
t('puntos negativos', esRegistroValido(R({ puntos: -5 })) === false);
t('dificultad mala', esRegistroValido(R({ dificultad: 'extremo' })) === false);
t('fecha mala', esRegistroValido(R({ fecha: 'ayer' })) === false);
t('null', esRegistroValido(null) === false);

/* orden: puntos desc → tiempo asc → fecha reciente */
{
  const a = R({ nombre: 'A', puntos: 300, tiempo: 120, fecha: '2026-10-01T10:00:00.000Z' });
  const b = R({ nombre: 'B', puntos: 500, tiempo: 200, fecha: '2026-10-01T10:00:00.000Z' });
  const c = R({ nombre: 'C', puntos: 300, tiempo: 90, fecha: '2026-10-01T10:00:00.000Z' });
  const d = R({ nombre: 'D', puntos: 300, tiempo: 90, fecha: '2026-10-05T10:00:00.000Z' });
  const ord = topRanking([a, b, c, d]).map((r) => r.nombre);
  t('puntos mandan, luego tiempo, luego fecha', ord.join('') === 'BDCA', ord.join(''));
}
/* tope 10 e inválidos fuera */
{
  const muchos = Array.from({ length: 12 }, (_, i) => R({ nombre: `J${i}`, puntos: 100 + i * 10 }));
  const top = topRanking([...muchos, null, R({ nombre: '', puntos: 9999 })]);
  t('máximo 10', top.length === MAX_RANKING && top.length === 10);
  t('primero es el mayor', top[0].puntos === 210);
}

/* estadísticas */
{
  const h = [
    R({ aciertos: 8, total: 10, dificultad: 'facil', detalleCategoria: { geografia: { ok: 8, total: 10 } } }),
    R({ aciertos: 5, total: 10, dificultad: 'medio', detalleCategoria: { historia: { ok: 5, total: 10 } } }),
    R({ aciertos: 2, total: 10, dificultad: 'dificil', detalleCategoria: { geografia: { ok: 2, total: 10 } } }),
  ];
  const s = calcularStats(h);
  t('partidas=3', s.partidas === 3);
  t('correctas=15 de 30 → 50%', s.correctas === 15 && s.porcentaje === 50);
  t('geo 10/20 = 50%', s.porCategoria.geografia.pct === 50 && s.porCategoria.geografia.total === 20);
  t('historia 5/10 = 50%', s.porCategoria.historia.pct === 50);
  t('fácil 8/10 = 80%', s.porDificultad.facil.pct === 80);
  t('mejor categoría con datos', ['geografia', 'historia'].includes(s.mejorCategoria));
  const v = calcularStats([]);
  t('vacío: ceros y sin mejor', v.partidas === 0 && v.porcentaje === 0 && v.mejorCategoria === null);
}

console.log(`\n${pass} OK · ${fail} FALLIDOS`);
process.exit(fail ? 1 : 0);
