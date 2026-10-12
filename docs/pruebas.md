# Pruebas — Trivia Colombia

> Documento vivo. Solo se marca ✅ lo ejecutado de verdad (§13). Fase 1: base navegable, sin motor de juego.

| # | Caso (§13) | Esperado | Obtenido | Estado |
|---|-----------|----------|----------|--------|
| 1 | Iniciar sin nombre | Bloquea con error | (pendiente Fase 3: validación ya implementada en inicio, por verificar) | ⏳ |
| 2 | Partida válida 1 categoría + dificultad | Entra a juego | — | ⏳ |
| 3 | 10 preguntas sin repetición | 10 IDs únicos | — | ⏳ |
| 4 | 4 opciones por pregunta | 4 botones | — | ⏳ |
| 5 | Acierto calcula puntos | Fórmula §7 | — | ⏳ |
| 6 | Fallo | 0 pts + feedback rojo | — | ⏳ |
| 7 | Timeout a cero | No respondida + feedback | — | ⏳ |
| 8 | Responder tras timeout | Bloqueado | — | ⏳ |
| 9 | Comodín 50/50 | Quita 2, 1 uso, −30 | — | ⏳ |
| 10 | Comodín +10s | Suma 10s, 1 uso, −30 | — | ⏳ |
| 11 | Racha ×3 | +50 cada 3 seguidas | — | ⏳ |
| 12 | Multiplicadores ×1/×1.5/×2 | Enteros, sin decimales | — | ⏳ |
| 13 | Completar 10 preguntas | Va a resultados | — | ⏳ |
| 14 | Resultados + falladas | Resumen + repaso | — | ⏳ |
| 15 | Recarga persiste ranking | localStorage | — | ⏳ |
| 16 | Orden top 10 | pts → tiempo → fecha | — | ⏳ |
| 17 | Borrar ranking con confirmación | Pide confirmar | — | ⏳ |
| 18 | 360px y escritorio | Sin scroll-X, táctil | — | ⏳ |
| 19 | Sin errores de consola | 0 errores | — | ⏳ |
| 20 | Todas rutas/botones | Navegan | Navegación SPA verificada en Fase 1 | ⏳ |

## Evidencia Fase 1
- [ ] Navegación Inicio→Instrucciones→Config→Juego→Feedback→Resultados→Ranking sin errores.
- [ ] Validación de nombre vacío.
- [ ] Tema claro/oscuro persiste.
