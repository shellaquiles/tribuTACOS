'use client';

import { useState } from 'react';
import { login } from '../auth';

// Pantalla de inicio de sesión. Se muestra cuando el backend exige autenticación
// (AUTH_ENABLED) y todavía no hay un token válido, o cuando la sesión expira.
export default function LoginScreen({ onSuccess }) {
  const [rfc, setRfc] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(rfc, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err?.response?.data?.detail || 'RFC o contraseña incorrectos');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-900 font-mono">
      <div className="text-2xl font-black tracking-tight mb-1">tribuTACOS</div>
      <div className="text-[11px] text-zinc-400 uppercase tracking-widest mb-8">
        SISTEMA DE INTELIGENCIA FISCAL • SHELLAQUILES.ORG
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs flex flex-col gap-3 border border-zinc-300 p-6 bg-white"
      >
        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          RFC
          <input
            type="text"
            value={rfc}
            onChange={(e) => setRfc(e.target.value)}
            autoComplete="username"
            autoFocus
            className="mt-1 w-full bg-white text-zinc-900 text-xs font-mono px-2.5 py-2 border border-zinc-300 focus:outline-none focus:border-zinc-900 uppercase"
          />
        </label>

        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full bg-white text-zinc-900 text-xs font-mono px-2.5 py-2 border border-zinc-300 focus:outline-none focus:border-zinc-900"
          />
        </label>

        {error && (
          <div className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full px-3 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider border border-zinc-900 transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? 'Verificando…' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="text-[10px] text-zinc-400 mt-6 max-w-xs text-center uppercase tracking-wider">
        Cada contribuyente solo accede a su propia información fiscal.
      </p>
    </div>
  );
}
