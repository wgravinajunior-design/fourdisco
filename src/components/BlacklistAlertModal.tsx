'use client';

import React, { useEffect, useState } from 'react';
import { BlacklistEntry } from '@/types';
import { sound } from '@/lib/audio';
import { ShieldAlert, AlertTriangle, XCircle, CheckCircle, Lock, Calendar, UserX } from 'lucide-react';

interface BlacklistAlertModalProps {
  entry: BlacklistEntry;
  onDismiss: () => void;
  onManagerBypass: () => void;
}

export const BlacklistAlertModal: React.FC<BlacklistAlertModalProps> = ({
  entry,
  onDismiss,
  onManagerBypass,
}) => {
  const [managerPin, setManagerPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinError, setPinError] = useState('');

  // Play buzzer sound upon mounting
  useEffect(() => {
    sound.playAlertBuzzer();
    const interval = setInterval(() => {
      sound.playAlertBuzzer();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleBypassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (managerPin === '1234' || managerPin === 'admin' || managerPin === '9999') {
      sound.playSuccess();
      onManagerBypass();
    } else {
      sound.playAlertBuzzer();
      setPinError('Senha de gerência incorreta! Tente 1234.');
    }
  };

  const isIndefinite = entry.banType === 'indefinite';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl glass-panel-alert bg-[#1d080c] border-2 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)] animate-pulse-alarm p-6 relative overflow-hidden text-slate-100">
        {/* Top Warning Banner */}
        <div className="flex items-center gap-3 border-b border-red-500/30 pb-4 mb-4">
          <div className="p-3 rounded-2xl bg-red-600 text-white animate-bounce shadow-lg shadow-red-900/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-700">
              ALERTA DE SEGURANÇA
            </span>
            <h2 className="text-xl font-black text-red-400 tracking-wide mt-1 neon-text-red">
              INDIVÍDUO NA BLACKLIST
            </h2>
          </div>
        </div>

        {/* Person details */}
        <div className="space-y-3.5 bg-black/40 p-4 rounded-2xl border border-red-900/50 mb-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-red-950/80 border border-red-700/60 flex items-center justify-center shrink-0 overflow-hidden">
              {entry.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.photoUrl} alt={entry.name} className="w-full h-full object-cover" />
              ) : (
                <UserX className="w-8 h-8 text-red-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-black text-white truncate">{entry.name}</div>
              <div className="text-xs font-mono text-red-300 mt-0.5">
                DOC: <span className="text-white font-bold">{entry.document}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                    isIndefinite
                      ? 'bg-red-600 text-white'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  {isIndefinite
                    ? 'Bloqueio Indeterminado (Permanente)'
                    : `Bloqueado até ${entry.endDate || 'Data Futura'}`}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-red-900/40 text-xs">
            <span className="text-red-400 font-bold block mb-1">Motivo do Bloqueio:</span>
            <p className="text-slate-200 bg-red-950/40 p-2.5 rounded-xl border border-red-900/40 italic">
              &quot;{entry.reason}&quot;
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Registrado por: <strong className="text-slate-300">{entry.addedBy}</strong></span>
            <span>Desde: <strong className="text-slate-300">{entry.startDate}</strong></span>
          </div>
        </div>

        {/* Manager Bypass option */}
        {showPinInput ? (
          <form onSubmit={handleBypassSubmit} className="mb-4 bg-black/60 p-3.5 rounded-2xl border border-amber-500/40">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-2">
              <Lock className="w-4 h-4" />
              <span>Liberação Excepcional de Gerência</span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Digite o PIN (ex: 1234)"
                value={managerPin}
                onChange={(e) => {
                  setManagerPin(e.target.value);
                  setPinError('');
                }}
                className="flex-1 bg-black/80 border border-amber-500/40 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all"
              >
                Autorizar
              </button>
            </div>
            {pinError && <p className="text-[11px] text-red-400 mt-1.5">{pinError}</p>}
          </form>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-red-900/60"
          >
            <XCircle className="w-5 h-5" />
            <span>RECUSAR ENTRADA (BARRAR)</span>
          </button>

          {!showPinInput && (
            <button
              type="button"
              onClick={() => setShowPinInput(true)}
              className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-semibold text-xs transition-all border border-white/10 flex items-center justify-center gap-1.5"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Liberar com Gerente</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
