// Sonido: secuencias puras y degradación sin WebAudio.
// Uso desde la raíz: node tests/sonido.mjs
import { SECUENCIAS, secuencia, reproducir, fijarSonido, sonidoHabilitado } from '../js/sonido.js';

let fail = 0;
const t = (n, c, x = '') => {
  if (c) console.log(`OK  ${n}`);
  else { console.log(`X   ${n} ${x}`); fail += 1; }
};
const tonosOk = (arr) => arr.length > 0 && arr.every((o) => o.freq > 0 && o.dur > 0);

t('4 eventos definidos', ['clic', 'ok', 'bad', 'fin'].every((k) => Array.isArray(SECUENCIAS[k])));
t('clic/ok/bad/fin con tonos válidos', ['clic', 'ok', 'bad', 'fin'].every((k) => tonosOk(secuencia(k))));
t('evento desconocido → []', secuencia('nope').length === 0);
t('reproducir desconocido → false', reproducir('nope') === false);
t('sin WebAudio (Node) → false sin lanzar', reproducir('clic') === false);
t('fijarSonido(false) → false', fijarSonido(false) === false);
t('apagado se refleja y no suena', sonidoHabilitado() === false && reproducir('ok') === false);
t('fijarSonido(true) → true', fijarSonido(true) === true && sonidoHabilitado() === true);
process.exit(fail ? 1 : 0);
