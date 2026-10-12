// Trivia Colombia — Fase 1: estado global, router SPA, tema, validación y config.
import { $, $$, showScreen, toast, validateName, setUserChip } from './ui.js';
import { KEYS, storageOK } from './almacenamiento.js';

export const state = {
  jugador: '',
  categorias: ['todas'],
  dificultad: 'medio',
  tema: 'light',
};

const CAT_LABEL = {
  todas: 'Todas las categorías', geografia: 'Geografía', historia: 'Historia',
  cultura: 'Cultura y tradiciones', deportes: 'Deportes', ciencia: 'Ciencia y naturaleza',
};
const DIFF_LABEL = { facil: 'Fácil', medio: 'Medio', dificil: 'Difícil' };

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
  try {
    const raw = localStorage.getItem(KEYS.best);
    if (!raw) return;
    const b = JSON.parse(raw);
    if (typeof b?.pts === 'number') {
      const pts = $('#heroBestPts'); if (pts) pts.textContent = `${b.pts.toLocaleString('es-CO')} pts`;
      const n = $('#bestCardName'); if (n) n.textContent = b.nombre || '—';
      const p = $('#bestCardPts'); if (p) p.textContent = b.pts.toLocaleString('es-CO');
    }
  } catch { /* datos inválidos: se ignoran */ }
}

function updateSummary() {
  const cats = state.categorias.includes('todas')
    ? 'Todas las categorías'
    : state.categorias.map((c) => CAT_LABEL[c]).join(' · ');
  const el = $('#configSummary');
  if (el) el.textContent = `${cats} · ${DIFF_LABEL[state.dificultad]}`;
}

function bindNav() {
  $$('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (el.tagName === 'BUTTON' && el.type === 'submit') return;
      e.preventDefault();
      showScreen(el.dataset.nav);
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

  $('#btnStartGame')?.addEventListener('click', () => {
    if (!state.jugador) {
      toast('Primero escribe tu nombre en el inicio.');
      showScreen('inicio');
      setTimeout(() => $('#playerName')?.focus(), 300);
      return;
    }
    // Fase 3 validará el banco real (10 preguntas). En Fase 1 solo mostramos el tablero.
    $('#qCounter').textContent = 'Pregunta 1 de 10';
    $('#gamePts').textContent = '0';
    toast(`Suerte, ${state.jugador} — motor del juego llega en Fase 3.`);
    showScreen('juego');
  });

  $('#btnNext')?.addEventListener('click', () => showScreen('juego'));
}

function bindTheme() {
  $('#themeToggle')?.addEventListener('click', () => {
    applyTheme(state.tema === 'light' ? 'dark' : 'light');
  });
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

document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadBest();
  bindNav();
  bindStart();
  bindConfig();
  bindTheme();
  checkStorage();
  updateSummary();
  showScreen('inicio');
});
