// Trivia Colombia — Perfil local (nombre + icono).
// Se guarda en localStorage (tc_perfil_v1). Sin storage, el perfil vive solo
// en memoria durante la sesión. No contiene información sensible.
import { KEYS } from './almacenamiento.js';

export const ICONOS = ['👤', '🦜', '🐆', '🦋', '🐢', '🌻', '☕', '⚽', '🎭', '🐬'];
export const ICONO_DEFAULT = '👤';

export function perfilVacio() {
  return { nombre: '', icono: ICONO_DEFAULT };
}

/** Nombre válido: 2-24 caracteres sin espacios de más (igual que el inicio). */
export function nombreValido(raw) {
  const nombre = String(raw ?? '').trim().replace(/\s+/g, ' ');
  return nombre.length >= 2 && nombre.length <= 24 ? nombre : '';
}

export function iconoValido(icono) {
  return ICONOS.includes(icono) ? icono : ICONO_DEFAULT;
}

export function cargarPerfil() {
  try {
    const raw = localStorage.getItem(KEYS.perfil);
    if (!raw) return perfilVacio();
    const p = JSON.parse(raw);
    return {
      nombre: nombreValido(p?.nombre) || '',
      icono: iconoValido(p?.icono),
    };
  } catch {
    return perfilVacio();
  }
}

/** Guarda el perfil. Devuelve true si quedó persistido. */
export function guardarPerfil(perfil) {
  const limpio = {
    nombre: nombreValido(perfil?.nombre) || '',
    icono: iconoValido(perfil?.icono),
  };
  try {
    localStorage.setItem(KEYS.perfil, JSON.stringify(limpio));
    return true;
  } catch {
    return false;
  }
}
