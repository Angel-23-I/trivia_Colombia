# Pruebas — Trivia Colombia

> Regla del proyecto: solo se marca ✅ lo ejecutado de verdad (§13, §16).
> Leyenda: **✅ LÓGICA** = verificado en Node con asserts · **✅ ESTÁTICO** =
> verificado por script sobre el código · **⏳ NAVEGADOR** = requiere juego
> manual en navegador (pasos abajo) · Fecha de última ejecución: 2026-10-13.

## A. Batería automatizada (ejecutada 2026-10-13, 0 fallos)

| Script | Qué verifica | Resultado |
|---|---|---|
| `check_preguntas.mjs` | 150 preguntas, 10 por cada combinación categoría×dificultad, 4 opciones distintas, `correcta` 0-3, IDs únicos, 0 enunciados duplicados, explicación presente | ✅ 150 OK, pools ≥ 10 |
| `test_fase3.mjs` (42) | Puntuación §7 (200/300/400, rapidez 225, racha 375, −30/−60, fallo 0, sin decimales), selección 10 únicas con filtro, pool insuficiente, racha/reset, doble respuesta nula, comodines 1 uso, timeout, resumen, timer (activo/reinicio/detener/+10s/`onFin` ×1) | ✅ 42/42 |
| `test_fase4.mjs` (16) | Validación de registros, orden puntos→tiempo→fecha, tope 10, agregados (partidas, %, por categoría/dificultad, mejor categoría, vacío) | ✅ 16/16 |
| `test_tiempo.mjs` (4) | Respuesta rápida cuenta ≥ 1 s (fix 0:00), fallback intacto, `transcurrido()` real ≈ 0.35 s, total > 0 | ✅ 4/4 |
| `test_perfil.mjs` (8) | Nombre 2-24 válido/inválido, 10 iconos únicos, icono inválido → default | ✅ 8/8 |
| `node --check` | Sintaxis de los 9 módulos JS | ✅ sin errores |
| `check_ids.mjs` | Los 64 IDs usados en `app.js` existen en `index.html` | ✅ 64/64 |
| `check_nav.py` | Todo `data-nav` tiene su `data-screen` | ✅ sin rutas rotas |
| Barrido `type=` | Los 10 botones `data-nav` llevan `type="button"` (fix navegación muerta) | ✅ 0 sin tipo |
| `check_css.py` | Llaves/paréntesis balanceados en `styles.css` (232) y `responsive.css` (48) | ✅ OK |

## B. Casos §13 — estado

| # | Caso | Esperado | Obtenido / evidencia | Estado |
|---|---|---|---|---|
| 1 | Iniciar sin nombre | Bloquea con error | `validateName` + `test_perfil` (lógica); falta clic real | ⏳ NAVEGADOR |
| 2 | Partida 1 categoría + dificultad | Entra a juego | `seleccionarPreguntas` 10 únicas + pool ≥ 10 verificado | ✅ LÓGICA |
| 3 | 10 sin repetición | 10 IDs únicos | `new Set(...) === 10` en 3 filtros | ✅ LÓGICA |
| 4 | 4 opciones | 4 botones | Banco validado (150×4) + render con 4 `.opt` (código) | ✅ LÓGICA |
| 5 | Acierto y puntos | Fórmula §7 | 200/300/400, 225, 270/240, 375 verificados | ✅ LÓGICA |
| 6 | Fallo | 0 + feedback rojo | `responder` 0 pts, racha 0; pantalla existe | ✅ LÓGICA |
| 7 | Timeout a cero | No respondida + feedback | `onFin` ×1, registro `timeout`, `tiempoUsado` completo | ✅ LÓGICA |
| 8 | Responder tras fin | Bloqueado | Doble respuesta → `null`; guardas en `elegir`/`agotarTiempo` | ✅ LÓGICA |
| 9 | 50/50 | Quita 2, 1 uso, −30 | Eliminadas ⊆ incorrectas; 2.º uso → false; 300−30 = 270 | ✅ LÓGICA |
| 10 | +10 s | Suma 10 s, 1 uso, −30 | `agregar` 20→30; 2.º uso → false; ambos = 240 | ✅ LÓGICA |
| 11 | Racha ×3 | +50 cada 3 seguidas | 300/300/375 y reset tras fallo | ✅ LÓGICA |
| 12 | Multiplicadores | ×1/×1.5/×2 enteros | 200/300/400; 292.5→293 (Math.round) | ✅ LÓGICA |
| 13 | Completar 10 | Va a resultados | Simulación 10 + `resumen`; falta clic ×10 real | ✅ LÓGICA |
| 14 | Resultados + falladas | Resumen + repaso | `resumen` (%, mejor cat., 5 falladas); falta vista real | ✅ LÓGICA |
| 15 | Recarga persiste ranking | localStorage | `guardarPartida`/`cargarRanking` (lógica); falta recarga real | ⏳ NAVEGADOR |
| 16 | Orden top 10 | pts → tiempo → fecha | `topRanking` B-D-C-A + tope 10 | ✅ LÓGICA |
| 17 | Borrar con confirmación | Pide confirmar | Lógica `borrarDatos`; confirmación en 2 pasos (falta clic) | ⏳ NAVEGADOR |
| 18 | 360 px y escritorio | Sin scroll-X, táctil | CSS (sticky, clip, táctil) + llaves OK; falta vista real | ⏳ NAVEGADOR |
| 19 | Consola sin errores | 0 errores | Sintaxis OK; falta jugar con DevTools abierto | ⏳ NAVEGADOR |
| 20 | Rutas/botones/pantallas | Todo navega | IDs/rutas/`type` verificados; fix fugas al salir del juego; falta recorrido real | ⏳ NAVEGADOR |

## C. Correcciones aplicadas tras revisión (con test)

1. **Navegación muerta** (reporte usuario): guarda `el.type === 'submit'` ignoraba
   los 10 botones `data-nav` (el DOM declara `submit` por defecto). Fix + `type="button"`.
2. **Tiempo total 0:00** (reporte usuario): resolución de 1 s → `transcurrido()`
   real y `tiempoUsado` explícito (mín. 1 s). Tests `test_tiempo.mjs` 4/4.
3. **Fuga de timer** (auditoría Fase 6): navegar fuera del juego (logo/🏆) dejaba
   el timer vivo y abría feedback fantasma. Nueva `abandonarPartida()` en `bindNav`.

## D. Checklist de navegador (15-20 min, pendiente)

1. Live Server → jugar partida completa respondiendo rápido: total `> 0:00`. ✅/❌
2. Nombre vacío / espacios → error visible, no inicia. ✅/❌
3. Timeout real (esperar 20 s) → feedback rojo + continuar. ✅/❌
4. Comodines: usar ambos en una pregunta, verificar 1 uso y puntos menores. ✅/❌
5. Completar 10 → resultados con repaso → Ver ranking (registro visible). ✅/❌
6. Recargar → ranking y récord persisten; orden correcto con 2+ partidas. ✅/❌
7. Borrar ranking → pide 2.º clic y limpia todo. ✅/❌
8. Logo/🏆 en mitad del juego → cancela sin pantallas fantasma. ✅/❌
9. Perfil: cambiar nombre/icono, recargar, revisar recientes. ✅/❌
10. 360 px + escritorio, claro/oscuro, Tab/Enter, DevTools sin errores. ✅/❌
