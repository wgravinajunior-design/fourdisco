'use client';

import React, { useState } from 'react';
import { User, UserRole } from '@/types';
import { sound } from '@/lib/audio';
import {
  Sparkles,
  QrCode,
  Users,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  ShieldAlert,
  Calendar,
  CheckCircle,
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Quick 1-click Preset Logins
  const handleQuickLogin = (role: UserRole) => {
    sound.playSuccess();
    if (role === 'operator') {
      onLogin({
        id: 'usr-operator-1',
        username: 'operador',
        name: 'Operador de Portaria (Gate 1)',
        role: 'operator',
      });
    } else {
      onLogin({
        id: 'usr-admin-1',
        username: 'admin',
        name: 'Administrador Geral',
        role: 'admin',
      });
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Informe o usuário');
      return;
    }

    sound.playSuccess();
    const isAdmin = username.toLowerCase().includes('admin') || username.toLowerCase().includes('gerente');
    onLogin({
      id: `usr-${Date.now()}`,
      username: username.trim(),
      name: isAdmin ? 'Gerente FourDisco' : 'Operador Portaria',
      role: isAdmin ? 'admin' : 'operator',
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#07060c]">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
        {/* Brand Logo & Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400 p-[2px] shadow-2xl shadow-purple-900/60 mb-4 animate-bounce">
            <div className="w-full h-full bg-[#0d0c18] rounded-[22px] flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-pink-400" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            FOURDISCO
          </h1>
          <p className="text-sm sm:text-base text-slate-400 mt-2 font-medium">
            Sistema Integrado de Portaria, Check-in Inteligente e Gestão VIP
          </p>
        </div>

        {/* 2 Roles Entry Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Option 1: Portaria / Check-in & Check-out */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-purple-500/30 hover:border-purple-500/70 transition-all flex flex-col justify-between group hover:shadow-[0_0_35px_rgba(139,92,246,0.3)] bg-[#110f22]/80">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-400 shadow-md">
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-700">
                  Acesso Operacional
                </span>
              </div>

              <h2 className="text-xl font-black text-white">Login Portaria</h2>
              <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                Terminal dedicado para a recepção e entrada do evento com foco em velocidade.
              </p>

              <div className="space-y-2 mb-6 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Check-in com foto do documento e OCR</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Check-out rápido e contador de lotação</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Alerta sonoro imediato de Blacklist</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Reconhecimento automático da festa de hoje</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleQuickLogin('operator')}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 transition-all active:scale-[0.98]"
            >
              <span>ACESSAR COMO OPERADOR PORTARIA</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Option 2: Gerência Geral / Administração (Cadastros & Festas & Blacklist) */}
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-amber-500/30 hover:border-amber-500/70 transition-all flex flex-col justify-between group hover:shadow-[0_0_35px_rgba(245,158,11,0.25)] bg-[#17131a]/80">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400 shadow-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700">
                  Acesso Total
                </span>
              </div>

              <h2 className="text-xl font-black text-white">Login Gerência Geral</h2>
              <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                Acesso completo ao site para gestão de cadastros, eventos e segurança.
              </p>

              <div className="space-y-2 mb-6 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong>Cadastros das pessoas:</strong> histórico e fotos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong>Cadastro de festas:</strong> multi-seleção de eventos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong>Blacklist:</strong> por período ou indeterminado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Acesso irrestrito a Check-in e Check-out</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-950/60 transition-all active:scale-[0.98]"
            >
              <span>ACESSAR GERÊNCIA & CADASTROS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Custom Credential Form Accordion */}
        <div className="w-full max-w-md glass-panel p-5 rounded-2xl border border-white/10 text-center">
          <p className="text-xs text-slate-400 mb-3 font-semibold">
            Ou acesse com suas credenciais personalizadas:
          </p>
          <form onSubmit={handleManualLogin} className="space-y-3">
            <input
              type="text"
              placeholder="Usuário (ex: admin ou operador)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#121124] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#121124] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            {error && <p className="text-[11px] text-red-400">{error}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all"
            >
              Entrar
            </button>
          </form>
        </div>

        {/* Database & Vercel Info Footer */}
        <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <p>FourDisco Nightclub OS • Banco MySQL configurado & pronto para deploy na Vercel</p>
        </div>
      </div>
    </div>
  );
};
