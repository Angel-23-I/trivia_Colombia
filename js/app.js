// Trivia Colombia — Fase 4: SPA completa con ranking y persistencia.
// Flujo: inicio → config → juego (10 preguntas, 20 s, racha, comodines) →
// feedback → resultados (guardado único) → ranking y estadísticas.
import { $, $$, showScreen, toast, validateName, setUserChip } from './ui.js';
import {
  KEYS, storageOK, guardarPartida, cargarRanking, cargarHistorial,
  cargarBest, borrarDatos,
} from './almacenamiento.js';
import { calcularStats } from './estadisticas.js';
import {
  contarDisponibles, crearPartida, preguntaActual, esUltima,
  usar5050, usarExtra, responder, siguiente, resumen,
  TIEMPO_POR_PREGUNTA,
} from './juego.js';
import { crearTemporizador } from './temporizador.js';

export const state = {
  jugador: '',
  categorias: ['todas'],
  dificultad: 'medio',
  tema: 'light',
  partida: null,
  timer: null,
  gen: 0, // generación UI: invalida timeouts/timers de preguntas anteriores
  pending: null,
};

const CAT_LABEL = {
  todas: 'Todas las categorías', geografia: 'Geografía', historia: 'Historia',
  cultura: 'Cultura y tradiciones', deportes: 'Deportes', ciencia: 'Ciencia y naturaleza',
};
const DIFF_LABEL = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };
const LETRAS = ['A', 'B', 'C', 'D'];

function fmtTiempo(totalSeg) {
  const s = Math.max(0, Math.floor(totalSeg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function fmtPts(n) {
  return Number(n || 0).toLocaleString('es-CO');
}

/* ---------- tema / mejor puntuación / storage ---------- */

function applyTheme(t) {
  state.tema = t;
  document.documentElement.dataset.theme = t;
  const btn = $('#themeToggle');
  if (btn) { btn.textContent = t === 'light' ? '🌙' : '☀️'; btn.setAttribute('aria-pressed', String(t === 'dark')); }
  try { localStorage.setItem(KEYS.theme, t); } catch { /* sin persistencia */ }
}

function loadTheme() {
  let t = 'light';
  try { t = localStorage.getItem(KEYS.theme) || 'light'; } catch { /* noop */ }
  if (t !== 'light' && t !== 'dark') t = 'light';
  applyTheme(t);
}

function loadBest() {
  const b = cargarBest();
  if (!b) return;
  const pts = $('#heroBestPts'); if (pts) pts.textContent = `${fmtPts(b.pts)} pts`;
  const n = $('#bestCardName'); if (n) n.textContent = b.nombre || '—';
  const p = $('#bestCardPts'); if (p) p.textContent = fmtPts(b.pts);
}

function resetBestCard() {
  const pts = $('#heroBestPts'); if (pts) pts.textContent = '— pts';
  const n = $('#bestCardName'); if (n) n.textContent = 'Sin partidas aún';
  const p = $('#bestCardPts'); if (p) p.textContent = '—';
}

function checkStorage() {
  if (!storageOK()) {
    const w = $('#storageWarning');
    if (w) {
      w.hidden = false;
      w.textContent = 'Tu navegador bloquea el almacenamiento local: podrás jugar, pero el ranking no se guardará.';
    }
  }
}

/* ---------- configuración ---------- */

function updateSummary() {
  const cats = state.categorias.includes('todas')
    ? 'Todas las categorías'
    : state.categorias.map((c) => CAT_LABEL[c]).join(' · ');
  const el = $('#configSummary');
  if (el) el.textContent = `${cats} · ${DIFF_LABEL[state.dificultad]}`;
  const n = contarDisponibles(state.categorias, state.dificultad);
  const count = $('#configCount');
  if (count) count.textContent = String(Math.min(n, 10));
  const err = $('#configError');
  if (err) {
    if (n < 10) {
      err.hidden = false;
      err.textContent = `Hay ${n} preguntas para esta combinación y se necesitan 10. Elige «Todas las categorías» o mezcla más temas.`;
    } else {
      err.hidden = true;
      err.textContent = '';
    }
  }
}

/* ---------- partida ---------- */

function actualizarMarcador() {
  const p = state.partida;
  const pts = p ? p.puntos : 0;
  const gp = $('#gamePts'); if (gp) gp.textContent = fmtPts(pts);
  const pill = $('#scorePill');
  if (pill) {
    pill.hidden = false;
    const v = $('#scorePillValue'); if (v) v.textContent = fmtPts(pts);
  }
  const st = $('#streakNum'); if (st) st.textContent = `× ${p ? p.racha : 0}`;
}

function pintarTiempo(s) {
  const num = $('#timerNum');
  if (num) num.textContent = String(s);
  const ring = num?.closest('.timer-ring');
  if (ring) ring.classList.toggle('danger', s <= 5);
  const timerSec = $('#screen-juego');
  if (timerSec) timerSec.setAttribute('aria-label', `Tiempo restante: ${s} segundos`);
}

function syncComodines() {
  const p = state.partida;
  const b50 = $('#btn5050');
  const bEx = $('#btnExtra');
  if (b50) b50.disabled = !p || p.fiftyUsado || p.actual.respondida;
  if (bEx) bEx.disabled = !p || p.extraUsado || p.actual.respondida;
}

function mostrarPregunta() {
  const p = state.partida;
  if (!p) return;
  const q = preguntaActual(p);
  const total = p.preguntas.length;
  const idx = p.indice;
  state.gen += 1;
  const g = state.gen;

  const counter = $('#qCounter');
  if (counter) counter.textContent = `Pregunta ${idx + 1} de ${total}`;
  const pct = Math.round(((idx + 1) / total) * 100);
  const pctEl = $('#qPct');
  if (pctEl) pctEl.textContent = `${pct}% completado`;
  const bar = $('#qProgress');
  if (bar) {
    bar.setAttribute('aria-valuemax', String(total));
    bar.setAttribute('aria-valuenow', String(idx + 1));
    const fill = bar.querySelector('span');
    if (fill) fill.style.width = `${pct}%`;
  }

  const cat = $('#qCat');
  if (cat) cat.textContent = (CAT_LABEL[q.categoria] || q.categoria).toUpperCase();
  const dif = $('#qDiff');
  if (dif) dif.textContent = `DIFICULTAD ${DIFF_LABEL[p.dificultad].toUpperCase()}`;
  const h = $('#game-q');
  if (h) h.textContent = q.enunciado;

  const group = $('#optsGroup');
  if (group) {
    group.innerHTML = '';
    q.opciones.forEach((texto, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      b.dataset.opt = String(i);
      const key = document.createElement('span');
      key.className = 'opt-key';
      key.textContent = LETRAS[i];
      b.append(key, document.createTextNode(` ${texto}`));
      b.addEventListener('click', () => elegir(i));
      group.append(b);
    });
  }

  syncComodines();
  actualizarMarcador();

  state.timer?.detener();
  state.timer = crearTemporizador({
    duracion: TIEMPO_POR_PREGUNTA,
    onTick: pintarTiempo,
    onFin: () => { if (g === state.gen) agotarTiempo(); },
  });
  state.timer.iniciar(TIEMPO_POR_PREGUNTA);
}

function botonesOpcion() {
  return $$('#optsGroup .opt');
}

function bloquearOpciones(res) {
  const q = res.pregunta;
  botonesOpcion().forEach((b) => {
    const i = Number(b.dataset.opt);
    b.disabled = true;
    b.classList.toggle('is-ok', i === q.correcta);
    b.classList.toggle('is-bad', res.elegido !== null && i === res.elegido && !res.acierto);
    if (state.partida?.actual.eliminadas.includes(i)) b.classList.add('is-dim');
  });
  syncComodines();
}

function programarFeedback(res) {
  const g = state.gen;
  clearTimeout(state.pending);
  state.pending = setTimeout(() => {
    if (g === state.gen) mostrarFeedback(res);
  }, 700);
}

function elegir(i) {
  const p = state.partida;
  if (!p || p.terminada || p.actual.respondida) return; // anticoncurrencia
  const restantes = state.timer?.restante ?? 0;
  state.timer?.detener();
  const res = responder(p, { elegido: i, segundosRestantes: restantes });
  if (!res) return;
  bloquearOpciones(res);
  programarFeedback(res);
}

function agotarTiempo() {
  const p = state.partida;
  if (!p || p.terminada || p.actual.respondida) return;
  const res = responder(p, { elegido: null, segundosRestantes: 0 });
  if (!res) return;
  bloquearOpciones(res);
  toast('Se acabó el tiempo.');
  programarFeedback(res);
}

function mostrarFeedback(res) {
  const p = state.partida;
  const q = res.pregunta;
  const icon = $('#fbIcon');
  if (icon) {
    icon.className = `fb-icon ${res.acierto ? 'ok' : 'bad'}`;
    icon.textContent = res.acierto ? '✓' : '✕';
  }
  const kicker = $('#fbKicker');
  if (kicker) kicker.textContent = res.acierto ? '¡MUY BIEN!' : 'SIGUE INTENTANDO';
  const title = $('#fb-title');
  if (title) title.textContent = res.acierto ? 'Respuesta correcta' : 'Respuesta incorrecta';
  const sub = $('#fbSub');
  if (sub) sub.textContent = res.acierto
    ? 'Tu conocimiento de Colombia está creciendo.'
    : 'Cada respuesta es una oportunidad para aprender.';

  const box = $('.fb-pts');
  if (box) box.classList.toggle('bad', res.puntos <= 0);
  const pts = $('#fbPts');
  if (pts) pts.textContent = `+${fmtPts(res.puntos)}`;
  const note = $('#fbNote');
  if (note) {
    note.textContent = res.rachaCompleta
      ? 'Incluye +50 de racha ×3'
      : (res.puntos > 0 ? 'Bono por rapidez incluido' : (res.timeout ? 'Tiempo agotado · sin puntos' : 'Sin puntos en esta pregunta'));
  }

  const mine = $('#fbMine');
  if (mine) {
    if (res.elegido === null) {
      mine.className = 'bad-text';
      mine.textContent = res.timeout ? '✕ Sin respuesta (tiempo agotado)' : '✕ Sin respuesta';
    } else {
      mine.className = res.acierto ? 'ok-text' : 'bad-text';
      mine.textContent = `${res.acierto ? '✓' : '✕'} ${LETRAS[res.elegido]}) ${q.opciones[res.elegido]}`;
    }
  }
  const right = $('#fbRight');
  if (right) {
    right.className = 'ok-text';
    right.textContent = `✓ ${q.opciones[q.correcta]}`;
  }
  const why = $('#fbWhy');
  if (why) why.textContent = q.explicacion;

  const next = $('#btnNext');
  if (next) next.textContent = p && esUltima(p) ? 'Ver resultados ›' : 'Siguiente pregunta ›';

  actualizarMarcador();
  showScreen('feedback');
}

function avanzar() {
  const p = state.partida;
  if (!p) { showScreen('juego'); return; }
  if (esUltima(p)) { finalizar(); return; }
  siguiente(p);
  mostrarPregunta();
  showScreen('juego');
}

function renderResultados(r) {
  const title = $('#res-title');
  if (title) title.textContent = `¡Gran partida, ${r.jugador}!`;
  const score = $('#resScore');
  if (score) score.textContent = fmtPts(r.puntos);
  const pct = $('#resPct');
  if (pct) pct.textContent = `${r.porcentaje}% de aciertos · ${fmtTiempo(r.tiempoTotal)} de juego`;
  const ok = $('#resOk');
  if (ok) ok.innerHTML = `${r.aciertos}<small>/${r.total}</small>`;
  const bad = $('#resBad');
  if (bad) bad.innerHTML = `${r.errores}<small>/${r.total}</small>${r.noRespondidas ? `<small> +${r.noRespondidas} sin responder</small>` : ''}`;
  const time = $('#resTime');
  if (time) time.textContent = fmtTiempo(r.tiempoTotal);
  const best = $('#resBest');
  if (best) best.textContent = r.mejorCategoria ? CAT_LABEL[r.mejorCategoria] : '—';

  const list = $('#reviewList');
  if (list) {
    list.innerHTML = '';
    const head = document.createElement('p');
    head.className = 'muted';
    head.textContent = r.falladas.length
      ? `${r.falladas.length} para repasar · ${r.porcentaje}% de aciertos`
      : '¡Perfección! No fallaste ninguna. 🎉';
    list.append(head);
    r.falladas.forEach((f) => {
      const q = f.pregunta;
      const item = document.createElement('article');
      item.className = 'card review-item';
      const x = document.createElement('span');
      x.className = 'review-x';
      x.textContent = '✕';
      const body = document.createElement('div');
      const cat = document.createElement('small');
      cat.textContent = (CAT_LABEL[q.categoria] || q.categoria).toUpperCase();
      const en = document.createElement('p');
      en.innerHTML = `<strong>${q.enunciado}</strong>`;
      const det = document.createElement('p');
      det.className = 'muted';
      const tuya = f.elegido === null ? 'sin responder' : q.opciones[f.elegido];
      det.textContent = `Tu respuesta: ${tuya} · Correcta: ${q.opciones[q.correcta]} · ${q.explicacion}`;
      body.append(cat, en, det);
      item.append(x, body);
      list.append(item);
    });
  }
}

function finalizar() {
  const p = state.partida;
  if (!p) return;
  state.timer?.detener();
  clearTimeout(state.pending);
  p.terminada = true;
  const r = resumen(p);
  // Guardado único: aunque se re-renderice o se pulse "Ver resultados" otra
  // vez, la partida solo entra al ranking una vez (flag en memoria).
  if (!p.guardada) {
    p.guardada = true;
    const registro = {
      nombre: r.jugador,
      puntos: r.puntos,
      categorias: r.categorias,
      dificultad: r.dificultad,
      fecha: new Date().toISOString(),
      aciertos: r.aciertos,
      errores: r.errores,
      noRespondidas: r.noRespondidas,
      tiempo: r.tiempoTotal,
      total: r.total,
      detalleCategoria: r.porCategoria,
    };
    if (guardarPartida(registro)) loadBest();
    else if (storageOK()) toast('No se pudo guardar la partida.');
  }
  renderResultados(r);
  const pill = $('#scorePill');
  if (pill) pill.hidden = true;
  showScreen('resultados');
}

function salirPartida() {
  state.timer?.detener();
  clearTimeout(state.pending);
  state.gen += 1;
  state.partida = null;
  const pill = $('#scorePill');
  if (pill) pill.hidden = true;
  toast('Partida cancelada.');
  showScreen('inicio');
}

function iniciarJuego() {
  if (!state.jugador) {
    toast('Primero escribe tu nombre en el inicio.');
    showScreen('inicio');
    setTimeout(() => $('#playerName')?.focus(), 300);
    return;
  }
  const sel = crearPartida({ jugador: state.jugador, categorias: state.categorias, dificultad: state.dificultad });
  const err = $('#configError');
  if (!sel.ok) {
    if (err) {
      err.hidden = false;
      err.textContent = `Solo hay ${sel.disponibles} preguntas para esa combinación y se necesitan 10. Elige «Todas las categorías» o mezcla más temas.`;
    }
    toast('No hay suficientes preguntas para esa combinación.');
    return;
  }
  if (err) { err.hidden = true; err.textContent = ''; }
  state.partida = sel.partida;
  clearTimeout(state.pending);
  mostrarPregunta();
  toast(`¡Suerte, ${state.jugador}!`);
  showScreen('juego');
}

/* ---------- ranking y estadísticas ---------- */

const BAR_COLORS = { geografia: '#1f5cff', historia: '#ffbe2e', cultura: '#7c5cff', deportes: '#e5484d', ciencia: '#1aa65c' };
const DIFF_COLORS = { facil: '#1aa65c', medio: '#1f5cff', dificil: '#e5484d' };
const CATS_ORDER = ['geografia', 'historia', 'cultura', 'deportes', 'ciencia'];
const DIFFS_ORDER = ['facil', 'medio', 'dificil'];

function setText(sel, t) {
  const el = $(sel);
  if (el) el.textContent = t;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fechaRelativa(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dia = new Date(d); dia.setHours(0, 0, 0, 0);
  const diff = Math.round((hoy - dia) / 86400000);
  if (diff <= 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function etiquetaCats(cats) {
  if (!cats || !cats.length || cats.includes('todas')) return 'Todas';
  if (cats.length <= 2) return cats.map((c) => CAT_LABEL[c] || c).join(' + ');
  return `${cats.length} temas`;
}

function renderRanking() {
  const ranking = cargarRanking();
  const stats = calcularStats(cargarHistorial());

  setText('#stGames', String(stats.partidas));
  setText('#stAcc', stats.partidas ? `${stats.porcentaje}%` : '—');
  setText('#stBest', stats.mejorCategoria ? CAT_LABEL[stats.mejorCategoria] : '—');

  const bc = $('#barsCat');
  if (bc) {
    bc.innerHTML = '';
    bc.setAttribute('role', 'img');
    bc.setAttribute('aria-label', 'Porcentaje de aciertos por categoría');
    for (const c of CATS_ORDER) {
      const v = stats.porCategoria[c];
      const wrap = document.createElement('div');
      wrap.className = 'bar';
      wrap.title = `${CAT_LABEL[c]}: ${v.ok}/${v.total} (${v.pct}%)`;
      const pct = document.createElement('small');
      pct.textContent = `${v.pct}%`;
      const col = document.createElement('i');
      col.style.height = `${Math.max(6, Math.round((v.pct / 100) * 120))}px`;
      col.style.background = BAR_COLORS[c];
      const lab = document.createElement('span');
      lab.textContent = CAT_LABEL[c].split(' ')[0];
      wrap.append(pct, col, lab);
      bc.append(wrap);
    }
  }

  const bd = $('#barsDiff');
  if (bd) {
    bd.innerHTML = '';
    for (const d of DIFFS_ORDER) {
      const v = stats.porDificultad[d];
      const row = document.createElement('div');
      const head = document.createElement('div');
      head.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:4px';
      const lab = document.createElement('span');
      lab.textContent = DIFF_LABEL[d];
      const pct = document.createElement('strong');
      pct.textContent = `${v.pct}%`;
      head.append(lab, pct);
      const track = document.createElement('div');
      track.className = 'hbar';
      const fill = document.createElement('span');
      fill.style.width = `${v.pct}%`;
      fill.style.background = DIFF_COLORS[d];
      track.append(fill);
      row.append(head, track);
      row.title = `${DIFF_LABEL[d]}: ${v.ok}/${v.total}`;
      bd.append(row);
    }
  }

  const tb = document.querySelector('#rankTable tbody');
  if (tb) {
    tb.innerHTML = '';
    if (!ranking.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
      td.className = 'muted';
      td.textContent = 'Juega tu primera partida y aparecerá aquí.';
      tr.append(td);
      tb.append(tr);
    }
    ranking.forEach((r, i) => {
      const tr = document.createElement('tr');
      const inicial = escapeHtml((r.nombre.trim()[0] || '?').toUpperCase());
      const pillCls = r.dificultad === 'dificil' ? 'red' : (r.dificultad === 'facil' ? 'green' : 'yellow');
      tr.innerHTML = `<td><span class="pos${i === 0 ? ' gold' : ''}">${i + 1}</span></td>`
        + `<td><span class="user-avatar" aria-hidden="true">${inicial}</span> ${escapeHtml(r.nombre)}</td>`
        + `<td><strong>${fmtPts(r.puntos)}</strong> <small class="muted">${r.aciertos}✓ ${r.errores}✕</small></td>`
        + `<td>${escapeHtml(etiquetaCats(r.categorias))}</td>`
        + `<td><span class="pill ${pillCls}">${DIFF_LABEL[r.dificultad]}</span></td>`
        + `<td class="muted">${fechaRelativa(r.fecha)}</td>`;
      tb.append(tr);
    });
  }
}

let clearArmed = false;
let clearTimer = null;

function bindRanking() {
  $('#btnClearRank')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (!clearArmed) {
      // Confirmación explícita en dos pasos (sin diálogos nativos).
      clearArmed = true;
      btn.dataset.label = btn.textContent;
      btn.textContent = '¿Seguro? Clic de nuevo para borrar todo';
      clearTimeout(clearTimer);
      clearTimer = setTimeout(() => {
        clearArmed = false;
        btn.textContent = btn.dataset.label || '🗑 Borrar ranking';
      }, 4000);
      toast('Se borrarán ranking, estadísticas y mejor puntuación.');
      return;
    }
    clearTimeout(clearTimer);
    clearArmed = false;
    btn.textContent = btn.dataset.label || '🗑 Borrar ranking';
    if (borrarDatos()) {
      resetBestCard();
      renderRanking();
      toast('Ranking borrado.');
    } else {
      toast('No se pudo borrar (storage no disponible).');
    }
  });
}

/* ---------- bindings ---------- */

function bindNav() {
  $$('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      // Ojo: un <button> sin type declara .type === 'submit' en el DOM por
      // defecto. Solo se omite si el botón enviaría realmente un formulario.
      if (el.tagName === 'BUTTON' && el.type !== 'button' && el.form) return;
      e.preventDefault();
      showScreen(el.dataset.nav);
      if (el.dataset.nav === 'ranking') renderRanking();
    });
  });
}

function bindStart() {
  const form = $('#startForm');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#playerName');
    const err = $('#nameError');
    const name = validateName(input?.value);
    if (!name) {
      if (err) err.hidden = false;
      input?.focus();
      input?.setAttribute('aria-invalid', 'true');
      return;
    }
    if (err) err.hidden = true;
    input?.removeAttribute('aria-invalid');
    state.jugador = name;
    setUserChip(name);
    toast(`¡Hola, ${name}! Configura tu partida.`);
    showScreen('config');
  });
}

function bindConfig() {
  const catGroup = $('#catGroup');
  catGroup?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    const cat = btn.dataset.cat;
    if (cat === 'todas') {
      state.categorias = ['todas'];
    } else {
      let sel = state.categorias.filter((c) => c !== 'todas');
      if (sel.includes(cat)) sel = sel.filter((c) => c !== cat);
      else sel.push(cat);
      state.categorias = sel.length ? sel : ['todas'];
    }
    $$('[data-cat]', catGroup).forEach((b) => {
      const on = state.categorias.includes(b.dataset.cat);
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const err = $('#catError'); if (err) err.hidden = true;
    updateSummary();
  });

  const diffGroup = $('#diffGroup');
  diffGroup?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-diff]');
    if (!btn) return;
    state.dificultad = btn.dataset.diff;
    $$('[data-diff]', diffGroup).forEach((b) => {
      const on = b.dataset.diff === state.dificultad;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-checked', String(on));
    });
    updateSummary();
  });

  $('#btnStartGame')?.addEventListener('click', iniciarJuego);
}

function bindGame() {
  $('#btnQuit')?.addEventListener('click', salirPartida);
  $('#btnNext')?.addEventListener('click', avanzar);

  $('#btn5050')?.addEventListener('click', () => {
    const p = state.partida;
    if (!p || p.terminada || p.actual.respondida) return;
    const r = usar5050(p);
    if (!r.ok) { toast('El comodín 50/50 ya se usó en esta partida.'); return; }
    botonesOpcion().forEach((b) => {
      if (r.eliminadas.includes(Number(b.dataset.opt))) {
        b.disabled = true;
        b.classList.add('is-dim');
      }
    });
    syncComodines();
    toast('50/50 aplicado: quedan dos opciones (−30 pts).');
  });

  $('#btnExtra')?.addEventListener('click', () => {
    const p = state.partida;
    if (!p || p.terminada || p.actual.respondida) return;
    const r = usarExtra(p, state.timer);
    if (!r.ok) { toast('El tiempo extra ya se usó en esta partida.'); return; }
    syncComodines();
    toast('+10 segundos (−30 pts).');
  });

  // Teclado: 1-4 / A-D para responder sin ratón.
  document.addEventListener('keydown', (e) => {
    const scr = document.querySelector('.screen.is-active');
    if (!scr || scr.dataset.screen !== 'juego') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    const k = e.key.toLowerCase();
    const map = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
    if (k in map) {
      const btns = botonesOpcion();
      const b = btns[map[k]];
      if (b && !b.disabled) { e.preventDefault(); elegir(map[k]); }
    }
  });
}

function bindTheme() {
  $('#themeToggle')?.addEventListener('click', () => {
    applyTheme(state.tema === 'light' ? 'dark' : 'light');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadBest();
  bindNav();
  bindStart();
  bindConfig();
  bindGame();
  bindRanking();
  bindTheme();
  checkStorage();
  updateSummary();
  showScreen('inicio');
});
