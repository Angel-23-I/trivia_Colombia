// Perfil: validaciones puras (sin DOM ni storage).
// Uso desde la raíz: node tests/perfil.mjs
import { ICONOS, nombreValido, iconoValido, perfilVacio } from '../js/perfil.js';

let fail = 0;
const t = (n, c, x = '') => {
  if (c) console.log(`OK  ${n}`);
  else { console.log(`X   ${n} ${x}`); fail += 1; }
};

t('nombre ok', nombreValido('  Ana María  ') === 'Ana María');
t('nombre corto', nombreValido('A') === '');
t('nombre vacío', nombreValido('   ') === '');
t('nombre largo', nombreValido('x'.repeat(25)) === '');
t('10 iconos únicos', new Set(ICONOS).size === 10);
t('icono válido pasa', iconoValido('estrella') === 'estrella');
t('icono malo → default', iconoValido('zzz') === 'viajero');
t('vacío', JSON.stringify(perfilVacio()) === JSON.stringify({ nombre: '', icono: 'viajero' }));
process.exit(fail ? 1 : 0);
