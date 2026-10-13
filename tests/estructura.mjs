// Estructura: 7 pantallas, 5 categorías, 3 niveles, 10 preguntas, top-10.
// Uso desde la raíz: node tests/estructura.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOTAL_PREGUNTAS } from '../js/juego.js';
import { MAX_RANKING } from '../js/almacenamiento.js';
import { PREGUNTAS } from '../js/preguntas.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

let fail = 0;
const t = (n, c, x = '') => {
  if (c) console.log(`OK  ${n}`);
  else { console.log(`X   ${n} ${x}`); fail += 1; }
};
const screens = ['inicio', 'instrucciones', 'config', 'juego', 'feedback', 'resultados', 'ranking'];
t('7 pantallas SPA', screens.every((s) => html.includes(`data-screen="${s}"`)));
t('5 categorías + todas', ['todas', 'geografia', 'historia', 'cultura', 'deportes', 'ciencia'].every((c) => html.includes(`data-cat="${c}"`)));
t('3 niveles', ['facil', 'medio', 'dificil'].every((d) => html.includes(`data-diff="${d}"`)));
t('10 preguntas por partida', TOTAL_PREGUNTAS === 10);
t('ranking top-10', MAX_RANKING === 10);
t('banco 225 (≥50 exigidas)', PREGUNTAS.length === 225 && PREGUNTAS.length >= 50);
for (const id of ['rankTable', 'profileModal', 'soundToggle', 'optsGroup', 'qProgress']) {
  t(`existe #${id}`, html.includes(`id="${id}"`));
}
process.exit(fail ? 1 : 0);
