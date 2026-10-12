// Utilidades de UI: navegación SPA, toast, validación de nombre.
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const SCREENS = ['inicio', 'instrucciones', 'config', 'juego', 'feedback', 'resultados', 'ranking'];

export function showScreen(name) {
  if (!SCREENS.includes(name)) name = 'inicio';
  $$('.screen').forEach((s) => {
    const on = s.dataset.screen === name;
    s.classList.toggle('is-active', on);
    if (on) s.hidden = false; else s.hidden = true;
  });
  $('#app')?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let toastTimer;
export function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

/** Valida nombre: no vacío ni solo espacios. Devuelve nombre recortado o '' */
export function validateName(raw) {
  const name = (raw ?? '').trim().replace(/\s+/g, ' ');
  if (!name || name.length < 2 || name.length > 24) return '';
  return name;
}

export function setUserChip(name) {
  const chip = $('#userChip');
  if (!name) { if (chip) chip.hidden = true; return; }
  if (chip) chip.hidden = false;
  const n = $('#userChipName');
  if (n) n.textContent = name;
}
