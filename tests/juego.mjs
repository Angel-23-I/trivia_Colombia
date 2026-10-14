// Puntuación (§7), selección, motor y temporizador.
// Uso desde la raíz: node tests/juego.mjs (código 1 si algo falla)
import {
  calcularPuntos, bonusRapidez, multiplicador,
} from '../js/puntuacion.js';
import {
  seleccionarPreguntas, crearPartida, preguntaActual, esUltima,
  usar5050, usarExtra, responder, siguiente, resumen, contarDisponibles,
  TOTAL_PREGUNTAS,
} from '../js/juego.js';
import { crearTemporizador } from '../js/temporizador.js';

let pass = 0, fail = 0;
function t(nombre, cond, extra = '') {
  if (cond) { pass += 1; console.log(`OK  ${nombre}`); }
  else { fail += 1; console.log(`X   ${nombre} ${extra}`); }
}

/* --- puntuación (§7) --- */
t('base fácil tiempo lleno: (100+100)*1=200', calcularPuntos({ correcta: true, segundosRestantes: 20, dificultad: 'facil' }) === 200);
t('medio tiempo lleno: (100+100)*1.5=300', calcularPuntos({ correcta: true, segundosRestantes: 20, dificultad: 'medio' }) === 300);
t('difícil tiempo lleno: (100+100)*2=400', calcularPuntos({ correcta: true, segundosRestantes: 20, dificultad: 'dificil' }) === 400);
t('rapidez parcial: 10s medio → (100+50)*1.5=225', calcularPuntos({ correcta: true, segundosRestantes: 10, dificultad: 'medio' }) === 225);
t('racha: (100+100+50)*1.5=375', calcularPuntos({ correcta: true, segundosRestantes: 20, rachaCompleta: true, dificultad: 'medio' }) === 375);
t('comodín: 300-30=270', calcularPuntos({ correcta: true, segundosRestantes: 20, dificultad: 'medio', comodines: 1 }) === 270);
t('dos comodines: 300-60=240', calcularPuntos({ correcta: true, segundosRestantes: 20, dificultad: 'medio', comodines: 2 }) === 240);
t('fallo = 0 aunque haya comodín', calcularPuntos({ correcta: false, segundosRestantes: 15, dificultad: 'dificil', comodines: 1 }) === 0);
t('sin decimales (292.5→293)', Number.isInteger(calcularPuntos({ correcta: true, segundosRestantes: 19, dificultad: 'medio' })));
t('rapidez tope 100 (30s extra → cap)', bonusRapidez(30) === 100);
t('mult desconocido → 1', multiplicador('x') === 1);

/* --- penalización en todos los caminos (auditoría: nunca negativa) --- */
t('incorrecta + 1 comodín = 0', calcularPuntos({ correcta: false, segundosRestantes: 15, dificultad: 'medio', comodines: 1 }) === 0);
t('incorrecta + 2 comodines = 0', calcularPuntos({ correcta: false, segundosRestantes: 0, dificultad: 'dificil', comodines: 2 }) === 0);
t('penalización extrema se satura en 0', calcularPuntos({ correcta: true, segundosRestantes: 20, dificultad: 'facil', comodines: 10 }) === 0);
t('comodines negativos se ignoran', calcularPuntos({ correcta: true, segundosRestantes: 20, dificultad: 'facil', comodines: -2 }) === 200);
t('caso mínimo positivo: 100×1−60=40', calcularPuntos({ correcta: true, segundosRestantes: 0, dificultad: 'facil', comodines: 2 }) === 40);

/* --- selección --- */
const sel = seleccionarPreguntas(['todas'], 'medio');
t('todas/medio: 10 únicas', sel.ok && new Set(sel.preguntas.map((q) => q.id)).size === 10);
t('todas/medio: todas dificultad medio', sel.ok && sel.preguntas.every((q) => q.dificultad === 'medio'));
const s1 = seleccionarPreguntas(['geografia'], 'facil');
t('1 categoría: 10 únicas', s1.ok && new Set(s1.preguntas.map((q) => q.id)).size === 10);
t('1 categoría: todas geografía', s1.ok && s1.preguntas.every((q) => q.categoria === 'geografia'));
const multi = seleccionarPreguntas(['geografia', 'historia'], 'dificil');
t('2 categorías: respeta filtro', multi.ok && multi.preguntas.every((q) => ['geografia', 'historia'].includes(q.categoria)));
const corta = seleccionarPreguntas(['geografia'], 'facil', 16);
t('pool insuficiente → ok:false', corta.ok === false && corta.disponibles === 15);
t('contarDisponibles todas/facil = 75', contarDisponibles(['todas'], 'facil') === 75);
t('TOTAL_PREGUNTAS = 10', TOTAL_PREGUNTAS === 10);

/* --- motor: racha, comodines, resumen --- */
function partidaRapida(dificultad = 'medio') {
  const r = crearPartida({ jugador: 'Test', categorias: ['todas'], dificultad });
  if (!r.ok) throw new Error('sin pool');
  return r.partida;
}
{
  const p = partidaRapida();
  // 3 aciertos seguidos con 20s → 3.ª da racha (+50)
  const a = responder(p, { elegido: preguntaActual(p).correcta, segundosRestantes: 20 });
  siguiente(p);
  const b = responder(p, { elegido: preguntaActual(p).correcta, segundosRestantes: 20 });
  siguiente(p);
  const c = responder(p, { elegido: preguntaActual(p).correcta, segundosRestantes: 20 });
  t('racha: 1.ª=300 2.ª=300 3.ª=375', a.puntos === 300 && b.puntos === 300 && c.puntos === 375, JSON.stringify([a.puntos, b.puntos, c.puntos]));
  t('racha estado = 3', p.racha === 3);
  // fallo resetea
  siguiente(p);
  const q = preguntaActual(p);
  const mal = (q.correcta + 1) % 4;
  const d = responder(p, { elegido: mal, segundosRestantes: 15 });
  t('fallo = 0 y racha vuelve a 0', d.puntos === 0 && p.racha === 0);
  // doble respuesta bloqueada
  const dup = responder(p, { elegido: q.correcta, segundosRestantes: 15 });
  t('doble respuesta → null', dup === null);
}
{
  const p = partidaRapida();
  const r5050 = usar5050(p);
  t('50/50: 2 eliminadas incorrectas', r5050.ok && r5050.eliminadas.length === 2 && !r5050.eliminadas.includes(preguntaActual(p).correcta));
  const r5050b = usar5050(p);
  t('50/50 repetido en misma pregunta → false', r5050b.ok === false);
  const fakeT = { agregar: (s) => s };
  const rEx = usarExtra(p, fakeT);
  t('extra: ok con ambos comodines', rEx.ok === true);
  const res = responder(p, { elegido: preguntaActual(p).correcta, segundosRestantes: 20 });
  t('ambos comodines: 300-60=240', res.puntos === 240, `obtenido ${res.puntos}`);
  siguiente(p);
  t('50/50 en otra pregunta → false (1 uso)', usar5050(p).ok === false);
  t('extra en otra pregunta → false (1 uso)', usarExtra(p, fakeT).ok === false);
}
{
  const p = partidaRapida();
  const r5050 = usar5050(p);
  const res = responder(p, { elegido: preguntaActual(p).correcta, segundosRestantes: 20 });
  void r5050;
  t('solo 50/50: 300-30=270', res.puntos === 270, `obtenido ${res.puntos}`);
}
{
  // Comparativa directa: misma respuesta y tiempo, con y sin comodín.
  const a = partidaRapida();
  const ra = responder(a, { elegido: preguntaActual(a).correcta, segundosRestantes: 20 });
  const b = partidaRapida();
  usar5050(b);
  const rb = responder(b, { elegido: preguntaActual(b).correcta, segundosRestantes: 20 });
  t('comodín resta 30 frente a no usarlo (300→270)', ra.puntos === 300 && rb.puntos === 270 && ra.puntos - rb.puntos === 30, `${ra.puntos} vs ${rb.puntos}`);
}
{
  // timeout
  const p = partidaRapida();
  const res = responder(p, { elegido: null, segundosRestantes: 0 });
  t('timeout: 0 pts y racha 0', res.puntos === 0 && res.timeout && p.racha === 0);
}
{
  // fallo con comodín: el total no baja
  const p = partidaRapida();
  usar5050(p);
  const q = preguntaActual(p);
  const res = responder(p, { elegido: (q.correcta + 1) % 4, segundosRestantes: 8 });
  t('fallo con comodín: 0 y total intacto (≥0)', res.puntos === 0 && p.puntos === 0 && p.puntos >= 0);
}
{
  // partida completa simulada + resumen
  const p = partidaRapida('facil');
  for (let i = 0; i < 10; i += 1) {
    const q = preguntaActual(p);
    if (i % 2 === 0) responder(p, { elegido: q.correcta, segundosRestantes: 18 });
    else responder(p, { elegido: (q.correcta + 1) % 4, segundosRestantes: 5 });
    if (i < 9) siguiente(p);
  }
  const r = resumen(p);
  t('resumen: 5 aciertos 5 errores', r.aciertos === 5 && r.errores === 5 && r.noRespondidas === 0);
  t('resumen: 50% y 10 falladas=5', r.porcentaje === 50 && r.falladas.length === 5);
  t('resumen: tiempoTotal > 0', r.tiempoTotal > 0);
  t('resumen: mejorCategoria válida', typeof r.mejorCategoria === 'string');
  t('esUltima al final', esUltima(p) === true);
}

/* --- temporizador --- */
{
  const tt = crearTemporizador({ duracion: 20, onTick: () => {}, onFin: () => {} });
  tt.iniciar(20);
  t('timer activo tras iniciar', tt.activo === true && tt.restante === 20);
  tt.agregar(10);
  t('extra suma: 20→30', tt.restante === 30);
  tt.iniciar(20); // reinicio no duplica
  t('reinicio limpia y vuelve a 20', tt.restante === 20 && tt.activo === true);
  tt.detener();
  t('detener libera', tt.activo === false);
  const v = tt.agregar(10);
  t('agregar detenido no cambia', v === 20);
}
await new Promise((resolve) => {
  let fin = 0;
  const tt = crearTemporizador({ duracion: 1, onTick: () => {}, onFin: () => { fin += 1; } });
  tt.iniciar(1);
  setTimeout(() => {
    t('onFin se dispara una vez', fin === 1, `fin=${fin}`);
    resolve();
  }, 1600);
});

console.log(`\n${pass} OK · ${fail} FALLIDOS`);
process.exit(fail ? 1 : 0);
