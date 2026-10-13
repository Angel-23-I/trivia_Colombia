// Tiempo real: override de tiempoUsado y transcurrido() (fix 0:00).
// Uso desde la raíz: node tests/tiempo.mjs
import { crearPartida, preguntaActual, responder, resumen } from '../js/juego.js';
import { crearTemporizador } from '../js/temporizador.js';

let fail = 0;
const t = (n, c, x = '') => {
  if (c) console.log(`OK  ${n}`);
  else { console.log(`X   ${n} ${x}`); fail += 1; }
};

const { partida } = crearPartida({ jugador: 'T', categorias: ['todas'], dificultad: 'medio' });
// Respuesta "rápida": restante 20 pero 0.4 s reales → debe contar ≥1 s, no 0.
const r1 = responder(partida, { elegido: preguntaActual(partida).correcta, segundosRestantes: 20, tiempoUsado: Math.max(1, Math.round(0.4)) });
t('respuesta rápida usa ≥1 s', r1.tiempoUsado >= 1, `usado=${r1.tiempoUsado}`);
// Sin override: fallback anterior intacto.
const { partida: p2 } = crearPartida({ jugador: 'T', categorias: ['todas'], dificultad: 'medio' });
const r2 = responder(p2, { elegido: preguntaActual(p2).correcta, segundosRestantes: 17 });
t('fallback asignado−restantes = 3', r2.tiempoUsado === 3, `usado=${r2.tiempoUsado}`);
// transcurrido mide tiempo real.
const tt = crearTemporizador({ duracion: 20, onTick: () => {}, onFin: () => {} });
tt.iniciar(20);
await new Promise((r) => setTimeout(r, 350));
const el = tt.transcurrido();
t('transcurrido ≈0.35 s (no 0)', el > 0.2 && el < 2, `transcurrido=${el}`);
tt.detener();
const tot = resumen(partida).tiempoTotal;
t('total partida > 0', tot > 0, `total=${tot}`);
process.exit(fail ? 1 : 0);
