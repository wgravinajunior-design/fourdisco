'use client';

import React, { useState } from 'react';
import { User, UserRole } from '@/types';
import { sound } from '@/lib/audio';
import { store } from '@/lib/storage';
import {
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  KeyRound,
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('GOUP');
  const [password, setPassword] = useState('GOUP226457');
  const [selectedRole, setSelectedRole] = useState<UserRole>('administrador');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const u = username.trim().toUpperCase();
    const p = password.trim();

    // Authenticate through store (checks registered users + master GOUP)
    const authenticated = store.authenticate(u, p);
    if (authenticated) {
      sound.playSuccess();
      onLogin(authenticated);
      return;
    }

    sound.playAlertBuzzer();
    setError('Credenciais incorretas! Usuário padrão: GOUP / Senha: GOUP226457');
  };

  const handleInstantLogin = (role: UserRole) => {
    sound.playSuccess();
    const user = store.authenticate('GOUP', 'GOUP226457') || {
      id: 'usr-goup',
      username: 'GOUP',
      password: 'GOUP226457',
      name: role === 'administrador' ? 'Administrador FourDisco' : 'Portaria FourDisco',
      role: role,
    };
    // Ensure role matches requested instant view
    user.role = role;
    onLogin(user);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#07060c]">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Logo & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400 p-[2px] shadow-2xl shadow-purple-900/60 mb-3 animate-bounce">
            <div className="w-full h-full bg-[#0d0c18] rounded-[22px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-pink-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            FOURDISCO
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Sistema Oficial de Portaria, Check-in & Auditoria Geral
          </p>
        </div>

        {/* Authentication Card */}
        <div className="w-full glass-panel-neon p-6 sm:p-7 rounded-3xl border border-purple-500/40 shadow-2xl bg-[#0f0e1f]/90">
          <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                Acesso Seguro
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
              PORTARIA & ADMIN
            </span>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Usuário</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="w-full bg-[#16152b] border border-white/10 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition-colors"
                placeholder="GOUP"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full bg-[#16152b] border border-white/10 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition-colors"
                placeholder="••••••••••"
              />
            </div>

            {/* Perfil Inicial Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">
                Perfil de Acesso:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('administrador')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    selectedRole === 'administrador'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md'
                      : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Administrador (Tudo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('portaria')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    selectedRole === 'portaria'
                      ? 'bg-purple-600/30 text-purple-300 border-purple-500 shadow-md'
                      : 'bg-white/5 text-slate-400 border-transparent hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Portaria (Só Portaria)</span>
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 active:scale-98 text-white font-black text-xs tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-purple-950/60 transition-all"
            >
              <span>ENTRAR NO SISTEMA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Fast Logins for User GOUP */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block text-center mb-2.5">
              Acesso Rápido 1-Clique (GOUP)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleInstantLogin('administrador')}
                className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold text-center transition-all"
              >
                Entrar como Admin
              </button>

              <button
                type="button"
                onClick={() => handleInstantLogin('portaria')}
                className="py-2 px-3 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[11px] font-bold text-center transition-all"
              >
                Entrar como Portaria
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-5 text-[11px] text-slate-500 text-center font-mono">
          Usuário Padrão: <strong className="text-slate-300">GOUP</strong> • Senha: <strong className="text-slate-300">GOUP226457</strong>
        </p>
      </div>
    </div>
  );
};
