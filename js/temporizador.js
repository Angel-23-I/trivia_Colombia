// Trivia Colombia — Temporizador (Fase 3).
// Garantías: un solo interval activo por instancia, `detener()` antes de cada
// `iniciar()` (sin duplicados), token de generación contra callbacks tardíos
// y limpieza total de recursos. El comodín suma +10 s sin reiniciar.
export function crearTemporizador({ duracion = 20, onTick = null, onFin = null } = {}) {
  let id = null;
  let restante = duracion;
  let gen = 0; // generación: invalida ticks de inicios anteriores
  let finished = false;
  let inicioTs = 0; // marca real de inicio: mide tiempo con precisión < 1 s

  function limpiar() {
    if (id !== null) { clearInterval(id); id = null; }
  }

  function tick(g) {
    if (g !== gen || finished) return;
    restante -= 1;
    if (restante <= 0) {
      restante = 0;
      finished = true;
      limpiar();
      try { onTick?.(0); } catch { /* noop */ }
      try { onFin?.(); } catch { /* noop */ }
      return;
    }
    try { onTick?.(restante); } catch { /* noop */ }
  }

  return {
    /** Inicia (o reinicia) la cuenta desde `segundos`. Detiene lo anterior. */
    iniciar(segundos = duracion) {
      gen += 1;
      limpiar();
      finished = false;
      restante = Math.max(0, Math.floor(segundos));
      inicioTs = Date.now();
      try { onTick?.(restante); } catch { /* noop */ }
      if (restante <= 0) {
        finished = true;
        try { onFin?.(); } catch { /* noop */ }
        return;
      }
      const g = gen;
      id = setInterval(() => tick(g), 1000);
    },
    /** Detiene el temporizador y libera el interval. */
    detener() {
      gen += 1;
      finished = true;
      limpiar();
    },
    /** Suma segundos (comodín tiempo extra). No reinicia ni duplica. */
    agregar(segundos) {
      if (finished || id === null) return restante;
      restante = Math.max(0, restante + Math.floor(segundos));
      try { onTick?.(restante); } catch { /* noop */ }
      return restante;
    },
    get restante() { return restante; },
    get activo() { return id !== null && !finished; },
    /** Segundos reales (decimales) desde `iniciar()`. Para medir tiempo usado. */
    transcurrido() {
      if (!inicioTs) return 0;
      return Math.max(0, (Date.now() - inicioTs) / 1000);
    },
  };
}
