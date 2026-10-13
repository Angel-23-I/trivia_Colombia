// Ejecuta toda la batería. Uso desde la raíz: node tests/run.mjs
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = ['banco.mjs', 'juego.mjs', 'ranking.mjs', 'tiempo.mjs', 'perfil.mjs', 'sonido.mjs', 'estructura.mjs'];
let fail = 0;
for (const f of files) {
  console.log(`\n===== ${f} =====`);
  try {
    execFileSync(process.execPath, [path.join(dir, f)], { stdio: 'inherit' });
  } catch {
    fail += 1;
  }
}
console.log(fail ? `\nFALLARON ${fail} SUITES` : '\nTODA LA BATERÍA OK');
process.exit(fail ? 1 : 0);
