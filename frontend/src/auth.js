'use client';

// Capa de autenticación del frontend.
//
// El backend protege las rutas de datos (/api/*) cuando AUTH_ENABLED=true y
// espera un encabezado `Authorization: Bearer <token>`. Todos los componentes
// usan la instancia global de axios, así que basta con instalar interceptores
// una sola vez: uno adjunta el token a cada petición y otro reacciona a un 401
// limpiando la sesión y pidiendo iniciar sesión de nuevo.

import axios from 'axios';

const TOKEN_KEY = 'tributacos_token';
let onUnauthorized = null;

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export function logout() {
  setToken(null);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

// Permite que la app registre qué hacer cuando el backend responde 401
// (típicamente: mostrar la pantalla de inicio de sesión).
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export async function login(rfc, password) {
  const res = await axios.post('/auth/login', {
    rfc: (rfc || '').trim().toUpperCase(),
    password: password || '',
  });
  const token = res?.data?.access_token;
  if (!token) {
    throw new Error('El servidor no devolvió un token de acceso.');
  }
  setToken(token);
  return token;
}

// Interceptores globales: se instalan una única vez al importar el módulo,
// antes de que cualquier componente dispare su primera petición.
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    // El propio login devuelve 401 con credenciales inválidas; eso lo maneja la
    // pantalla de acceso, no el flujo global de "sesión expirada".
    if (status === 401 && !url.endsWith('/auth/login')) {
      setToken(null);
      if (typeof onUnauthorized === 'function') {
        onUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);
