// Trivia Colombia — Iconografía SVG (sin emojis).
// Trazos estilo lucide: 24×24, currentColor, offline y nítidos en cualquier
// pantalla. `icon()` para la interfaz, `avatar()` para insignias de perfil.
const P = {
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  crown: '<path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.3l4.27-3.37a.5.5 0 0 1 .8.52l-2.83 10.24a1 1 0 0 1-.96.74H5.81a1 1 0 0 1-.96-.74L2.02 6.32a.5.5 0 0 1 .8-.52l4.27 3.66a1 1 0 0 0 1.52-.3z"/><path d="M5 21h14"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  map: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  landmark: '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A3.5 3.5 0 0 0 18.5 5c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A3.5 3.5 0 0 0 6 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
};

function svg(paths, tam, stroke) {
  return `<svg class="ic" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

/** Icono de interfaz en color heredado. */
export function icon(nombre, tam = 20) {
  return svg(P[nombre] || P.user, tam, 'currentColor');
}

/** Insignias de avatar: círculo de color + glifo blanco. */
export const AVATARES = [
  { id: 'viajero', nombre: 'Viajero', color: '#1f5cff', glyph: 'user' },
  { id: 'rayo', nombre: 'Rayo', color: '#d97706', glyph: 'bolt' },
  { id: 'estrella', nombre: 'Estrella', color: '#7c5cff', glyph: 'star' },
  { id: 'corazon', nombre: 'Corazón', color: '#e5484d', glyph: 'heart' },
  { id: 'sol', nombre: 'Sol', color: '#f97316', glyph: 'sun' },
  { id: 'hoja', nombre: 'Hoja', color: '#1aa65c', glyph: 'leaf' },
  { id: 'musica', nombre: 'Música', color: '#ec4899', glyph: 'music' },
  { id: 'trofeo', nombre: 'Trofeo', color: '#b8860b', glyph: 'trophy' },
  { id: 'aventura', nombre: 'Aventura', color: '#0e9f8a', glyph: 'map' },
  { id: 'corona', nombre: 'Corona', color: '#6366f1', glyph: 'crown' },
];

export function avatar(id, tam = 20) {
  const a = AVATARES.find((x) => x.id === id) || AVATARES[0];
  return `<span class="avatar-badge" style="background:${a.color}" aria-hidden="true">${svg(P[a.glyph], tam, '#fff')}</span>`;
}

export function nombreAvatar(id) {
  return (AVATARES.find((x) => x.id === id) || AVATARES[0]).nombre;
}
