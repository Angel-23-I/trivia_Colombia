# Pruebas — Trivia Colombia

> Regla del proyecto: solo se marca ✅ lo ejecutado de verdad (§13, §16).
> Leyenda: **✅ LÓGICA** = verificado en Node con asserts · **✅ ESTÁTICO** =
> verificado por script sobre el código · **⏳ NAVEGADOR** = requiere juego
> manual en navegador (guía en la sección D).
> Última ejecución automatizada: 2026-10-13 (auditoría final), 0 fallos.

## Cómo reproducir

Desde la raíz del proyecto, con Node.js 18+ (sin dependencias):

```powershell
node tests/run.mjs        # batería completa
node tests/juego.mjs      # una suite (igual con las demás)
```

Cada script imprime `OK`/`X` por caso y sale con código 1 si algo falla.

## A. Batería automatizada

| Suite | Qué verifica | Resultado |
|---|---|---|
| `tests/banco.mjs` | 225 preguntas, 15 por combinación, 4 opciones distintas, `correcta` 0-3, IDs únicos, 0 enunciados duplicados, explicación, pools ≥ 15 | ✅ 225 OK |
| `tests/juego.mjs` (48) | Puntuación §7 (200/300/400, 225, 270/240, 375, sin decimales), penalización en todos los caminos (incorrecta+comodines = 0, saturación en 0, mínimo 40), selección 10 únicas con filtro, pool insuficiente, racha/reset, doble respuesta nula, comodines 1 uso, timeout, resumen, timer | ✅ 48/48 |
| `tests/ranking.mjs` (16) | Validación de registros, orden puntos→tiempo→fecha, tope 10, agregados y vacío | ✅ 16/16 |
| `tests/tiempo.mjs` (4) | Respuesta rápida ≥ 1 s (fix 0:00), fallback intacto, `transcurrido()` real, total > 0 | ✅ 4/4 |
| `tests/perfil.mjs` (8) | Nombre 2-24 válido/inválido, 10 iconos únicos, icono inválido → default | ✅ 8/8 |
| `tests/sonido.mjs` (8) | 4 secuencias con tonos válidos, desconocido → `[]`/`false`, sin WebAudio no lanza, on/off persiste en memoria | ✅ 8/8 |
| `tests/estructura.mjs` (11) | 7 pantallas, 5+1 categorías, 3 niveles, 10 preguntas, top-10, banco 225, IDs clave (`rankTable`, `profileModal`, `soundToggle`, `optsGroup`, `qProgress`) | ✅ 11/11 |
| `node --check js/*.js` | Sintaxis de los 11 módulos | ✅ sin errores |

## B. Casos §13 — estado

| # | Caso | Esperado | Obtenido / evidencia | Estado |
|---|---|---|---|---|
| 1 | Iniciar sin nombre | Bloquea con error | `validateName` + `tests/perfil.mjs` (lógica); falta clic real | ⏳ NAVEGADOR |
| 2 | Partida 1 categoría + dificultad | Entra a juego | `seleccionarPreguntas` 10 únicas + pools ≥ 15 | ✅ LÓGICA |
| 3 | 10 sin repetición | 10 IDs únicos | `new Set(...) === 10` en 3 filtros | ✅ LÓGICA |
| 4 | 4 opciones | 4 botones | Banco validado (225×4) + render con 4 `.opt` (código) | ✅ LÓGICA |
| 5 | Acierto y puntos | Fórmula §7 | 200/300/400, 225, 270/240, 375 verificados | ✅ LÓGICA |
| 6 | Fallo | 0 + feedback rojo | `responder` 0 pts, racha 0; pantalla existe | ✅ LÓGICA |
| 7 | Timeout a cero | No respondida + feedback | `onFin` ×1, registro `timeout`, tiempo completo | ✅ LÓGICA |
| 8 | Responder tras fin | Bloqueado | Doble respuesta → `null`; guardas en `elegir`/`agotarTiempo` | ✅ LÓGICA |
| 9 | 50/50 | Quita 2, 1 uso, −30 | Eliminadas ⊆ incorrectas; 2.º uso → false; 300−30 = 270 | ✅ LÓGICA |
| 10 | +10 s | Suma 10 s, 1 uso, −30 | `agregar` 20→30; 2.º uso → false; ambos = 240 | ✅ LÓGICA |
| 11 | Racha ×3 | +50 cada 3 seguidas | 300/300/375 y reset tras fallo | ✅ LÓGICA |
| 12 | Multiplicadores | ×1/×1.5/×2 enteros | 200/300/400; 292.5→293; incorrecta+comodines = 0, nunca negativo | ✅ LÓGICA |
| 13 | Completar 10 | Va a resultados | Simulación 10 + `resumen`; falta clic ×10 real | ✅ LÓGICA |
| 14 | Resultados + falladas | Resumen + repaso | `resumen` (%, mejor cat., 5 falladas); falta vista real | ✅ LÓGICA |
| 15 | Recarga persiste ranking | localStorage | Guardado/carga validados (lógica); falta recarga real | ⏳ NAVEGADOR |
| 16 | Orden top 10 | pts → tiempo → fecha | `topRanking` B-D-C-A + tope 10 | ✅ LÓGICA |
| 17 | Borrar con confirmación | Pide confirmar | `borrarDatos` + confirmación en 2 pasos (falta clic) | ⏳ NAVEGADOR |
| 18 | 360 px y escritorio | Sin scroll-X, táctil | CSS (sticky, clip, táctil) + llaves OK; falta vista real | ⏳ NAVEGADOR |
| 19 | Consola sin errores | 0 errores | Sintaxis OK; falta jugar con DevTools abierto | ⏳ NAVEGADOR |
| 20 | Rutas/botones/pantallas | Todo navega | `tests/estructura.mjs` 11/11 + rutas/`type` verificados; falta recorrido real | ✅ LÓGICA* |

\* La navegación declarativa y los IDs están verificados; el recorrido con clics
y el sonido audible quedan en la sección D.

## C. Correcciones aplicadas (con test)

1. **Navegación muerta**: guarda `el.type === 'submit'` ignoraba los 10 botones
   `data-nav`. Fix + `type="button"` (barrido estático).
2. **Tiempo total 0:00**: resolución de 1 s → `transcurrido()` real y
   `tiempoUsado` explícito (mín. 1 s). `tests/tiempo.mjs` 4/4.
3. **Fuga de timer**: navegar fuera del juego dejaba el timer vivo y abría
   feedback fantasma. `abandonarPartida()` en `bindNav` (verificación: caso 20).
4. **Auditoría — penalización**: `calcularPuntos()` aplica la fórmula en todos
   los caminos; incorrecta/timeout = 0 base, `max(0,…)` impide negativos y el
   acumulado nunca baja (6 pruebas nuevas en `tests/juego.mjs`).
5. **Auditoría — sonido**: control exigido en configuración (`js/sonido.js`,
   `role="switch"`, `tc_sonido_v1`). `tests/sonido.mjs` 8/8.
6. **Auditoría — reproducibilidad**: los scripts vivían fuera del repo; ahora
   están en `tests/` con imports relativos + `tests/estructura.mjs` nuevo.
