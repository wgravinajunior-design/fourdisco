'use client';

import React, { useState, useEffect } from 'react';
import { User, Party } from '@/types';
import { sound } from '@/lib/audio';
import {
  Sparkles,
  Users,
  QrCode,
  LogOut,
  Calendar,
  ShieldAlert,
  ChevronDown,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  UserCog,
  History,
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  parties: Party[];
  selectedPartyIds: string[];
  onTogglePartySelection: (partyId: string) => void;
  insideCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  activeTab,
  setActiveTab,
  parties,
  selectedPartyIds,
  onTogglePartySelection,
  insideCount,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);

  const isAdmin = currentUser.role === 'administrador';

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedParties = parties.filter((p) => selectedPartyIds.includes(p.id));

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-purple-900/30 bg-[#0c0c16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-purple-500/40 p-2 shadow-lg shadow-purple-900/40 overflow-hidden hover:scale-105 transition-transform cursor-pointer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="FOUR"
                className="w-full h-full object-contain brightness-0 invert drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                  FOURDISCO
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-purple-950/80 text-purple-300 border border-purple-700/50 rounded-full">
                  {isAdmin ? 'ADMIN' : 'PORTARIA'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-cyan-300">{timeStr || '--:--:--'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-medium">Online</span>
              </p>
            </div>
          </div>

          {/* Selector: Festa do Dia */}
          <div className="hidden md:flex items-center relative">
            <div
              onClick={() => setIsPartyDropdownOpen(!isPartyDropdownOpen)}
              className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 cursor-pointer transition-all duration-200"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                    Festa Ativa do Dia
                  </span>
                  {selectedParties.length > 1 && (
                    <span className="text-[10px] bg-pink-500 text-white font-bold px-1.5 rounded-full">
                      +{selectedParties.length - 1}
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-slate-200 truncate max-w-[200px] lg:max-w-[240px]">
                  {selectedParties.length > 0
                    ? selectedParties.map((p) => p.name).join(' & ')
                    : 'Nenhuma festa selecionada'}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-purple-300 transition-transform ${isPartyDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu for Party Switch / Multi-select */}
            {isPartyDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 rounded-2xl glass-panel-neon bg-[#100f24] p-3 shadow-2xl z-50 border border-purple-500/40">
                <div className="text-xs font-semibold text-purple-300 mb-2 px-1 flex items-center justify-between">
                  <span>Festas Disponíveis</span>
                  <span className="text-[10px] text-slate-400">(Selecione uma ou mais)</span>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {parties.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">
                      Nenhuma festa cadastrada ainda.
                    </div>
                  ) : (
                    parties.map((party) => {
                      const isSelected = selectedPartyIds.includes(party.id);
                      return (
                        <div
                          key={party.id}
                          onClick={() => {
                            sound.playClick();
                            onTogglePartySelection(party.id);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-600/30 border border-purple-500/60 text-white'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-transparent'
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="text-xs font-bold truncate">{party.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{party.date}</span>
                              <span>•</span>
                              <span>Cap. {party.maxCapacity}</span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-purple-500 border-purple-400 text-white'
                                : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 bg-[#141424] p-1.5 rounded-2xl border border-white/10">
            {/* Portaria & Admin: Check-in */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('checkin');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'checkin'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Check-in</span>
            </button>

            {/* Portaria & Admin: Check-out */}
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('checkout');
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'checkout'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>Check-out</span>
              {insideCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 rounded-full font-mono">
                  {insideCount}
                </span>
              )}
            </button>

            {/* Admin only views (Completely hidden for Portaria role) */}
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('clients');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'clients'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-900/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Cadastros</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('parties');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'parties'
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-900/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Festas</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('blacklist');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'blacklist'
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-900/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Blacklist</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('users');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'users'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <UserCog className="w-4 h-4" />
                  <span>Usuários</span>
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveTab('audit');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'audit'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-900/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Auditoria</span>
                </button>
              </>
            )}
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isAdmin
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                }`}
              >
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold text-slate-200">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                  {isAdmin ? 'Administrador Geral' : 'Operador Portaria'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onLogout();
              }}
              title="Sair do Sistema"
              className="p-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
