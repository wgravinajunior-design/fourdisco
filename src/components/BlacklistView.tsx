'use client';

import React, { useState } from 'react';
import { BlacklistEntry, BanType, Client } from '@/types';
import { store, getTodayString } from '@/lib/storage';
import { sound } from '@/lib/audio';
import { formatDocument, cleanDocument } from '@/lib/ocr';
import {
  ShieldAlert,
  Search,
  Plus,
  Calendar,
  Clock,
  UserX,
  Trash2,
  CheckCircle,
  AlertOctagon,
  Lock,
  Unlock,
} from 'lucide-react';

interface BlacklistViewProps {
  blacklist: BlacklistEntry[];
  onBlacklistUpdated: () => void;
  prefillClient?: Client | null;
  onClearPrefill?: () => void;
}

export const BlacklistView: React.FC<BlacklistViewProps> = ({
  blacklist,
  onBlacklistUpdated,
  prefillClient,
  onClearPrefill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'indefinite' | 'period'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(!!prefillClient);

  // Form State
  const [name, setName] = useState(prefillClient?.name || '');
  const [document, setDocument] = useState(prefillClient?.document || '');
  const [reason, setReason] = useState('');
  const [banType, setBanType] = useState<BanType>('indefinite');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [addedBy, setAddedBy] = useState('Gerência de Segurança');

  const todayStr = getTodayString();

  const filtered = blacklist.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    const cleanTerm = cleanDocument(term);
    const matchesSearch =
      !term ||
      item.name.toLowerCase().includes(term) ||
      cleanDocument(item.document).includes(cleanTerm) ||
      item.reason.toLowerCase().includes(term);

    const matchesType =
      filterType === 'all' || item.banType === filterType;

    return matchesSearch && matchesType;
  });

  const handleOpenAdd = () => {
    sound.playClick();
    setName(prefillClient?.name || '');
    setDocument(prefillClient?.document || '');
    setReason('');
    setBanType('indefinite');
    setStartDate(getTodayString());
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !document.trim() || !reason.trim()) {
      alert('Preencha o Nome, Documento e Motivo do bloqueio.');
      return;
    }

    sound.playAlertBuzzer();
    store.addToBlacklist({
      clientId: prefillClient?.id || undefined,
      name: name.trim(),
      document: formatDocument(document.trim()),
      photoUrl: prefillClient?.photoUrl,
      reason: reason.trim(),
      banType,
      startDate,
      endDate: banType === 'period' ? endDate : undefined,
      addedBy: addedBy.trim() || 'Gerência de Segurança',
    });

    setIsAddModalOpen(false);
    onClearPrefill?.();
    onBlacklistUpdated();
  };

  const handleRevoke = (id: string, name: string) => {
    if (confirm(`Deseja revogar o bloqueio de ${name}? A pessoa poderá entrar novamente.`)) {
      sound.playClick();
      store.revokeBlacklist(id);
      onBlacklistUpdated();
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Excluir permanentemente o registro de blacklist de ${name}?`)) {
      sound.playClick();
      store.deleteBlacklist(id);
      onBlacklistUpdated();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-red-900/40 bg-[#160a0f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold">
            Módulo de Segurança e Restrição
          </span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            <span>Blacklist ({blacklist.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Controle de indivíduos proibidos de entrar na FourDisco por período determinado ou indeterminado.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-xs shadow-lg shadow-red-950/60 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar à Blacklist</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por Nome, Documento ou Motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121124] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({blacklist.length})
          </button>
          <button
            onClick={() => setFilterType('indefinite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'indefinite'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Indeterminado
          </button>
          <button
            onClick={() => setFilterType('period')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'period'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Por Período
          </button>
        </div>
      </div>

      {/* Grid of Blacklisted individuals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isIndefinite = item.banType === 'indefinite';
          const isExpired =
            !isIndefinite && item.endDate ? todayStr > item.endDate : false;
          const isRevoked = item.status === 'revoked';

          return (
            <div
              key={item.id}
              className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isRevoked || isExpired
                  ? 'border-slate-800 bg-slate-900/30 opacity-70'
                  : 'border-red-500/50 bg-[#19090d] shadow-[0_0_20px_rgba(239,68,68,0.15)]'
              }`}
            >
              <div>
                {/* Header Profile Photo & Badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800/60 flex items-center justify-center font-bold text-lg text-red-300 overflow-hidden shrink-0">
                      {item.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserX className="w-7 h-7 text-red-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white leading-tight">{item.name}</h4>
                      <span className="text-xs font-mono text-red-300 block mt-0.5">
                        {item.document}
                      </span>
                    </div>
                  </div>

                  {/* Ban Type Pill */}
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isRevoked
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : isExpired
                        ? 'bg-amber-950 text-amber-300 border border-amber-700'
                        : isIndefinite
                        ? 'bg-red-600 text-white shadow-[0_0_8px_#ef4444]'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    {isRevoked
                      ? 'Revogado'
                      : isExpired
                      ? 'Expirado'
                      : isIndefinite
                      ? 'Indeterminado'
                      : `Até ${item.endDate}`}
                  </span>
                </div>

                {/* Reason */}
                <div className="bg-black/40 p-3 rounded-xl border border-red-900/30 text-xs text-slate-200 mb-3">
                  <span className="text-[10px] text-red-400 uppercase font-bold block mb-1">
                    Motivo do Bloqueio:
                  </span>
                  <p className="italic text-slate-300">&quot;{item.reason}&quot;</p>
                </div>

                {/* Audit details */}
                <div className="space-y-1 text-[11px] text-slate-400 mb-2">
                  <div className="flex justify-between">
                    <span>Bloqueado por:</span>
                    <strong className="text-slate-300">{item.addedBy}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Início do bloqueio:</span>
                    <span className="font-mono text-slate-300">{item.startDate}</span>
                  </div>
                  {!isIndefinite && item.endDate && (
                    <div className="flex justify-between">
                      <span>Término do bloqueio:</span>
                      <span className="font-mono text-amber-400">{item.endDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                {item.status === 'active' && !isExpired ? (
                  <button
                    type="button"
                    onClick={() => handleRevoke(item.id, item.name)}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Unlock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Revogar Bloqueio</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500 italic">Bloqueio inativo</span>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(item.id, item.name)}
                  className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors"
                  title="Excluir Registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add to Blacklist Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl glass-panel-neon bg-[#160a0f] border-2 border-red-500/50 p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span>Adicionar à Blacklist (Bloquear Pessoa)</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do indivíduo a ser inserido na BlackList"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1f0e15] border border-red-900/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Documento (CPF ou RG) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00 ou RG"
                  value={document}
                  onChange={(e) => setDocument(formatDocument(e.target.value))}
                  className="w-full bg-[#1f0e15] border border-red-900/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Motivo do Bloqueio *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva detalhadamente o incidente (ex: briga física, tentativa de golpe, desacato, drogas, etc.)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#1f0e15] border border-red-900/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {/* Ban Type selector: Indefinite vs Period */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tipo de Bloqueio (Duração) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBanType('indefinite')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      banType === 'indefinite'
                        ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-900/50'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Indeterminado (Permanente)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBanType('period')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      banType === 'period'
                        ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-900/50'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Por Período Específico</span>
                  </button>
                </div>
              </div>

              {/* Dates if period selected */}
              {banType === 'period' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-red-900/40">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#1f0e15] border border-red-900/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Data Término (Expiração)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#1f0e15] border border-red-900/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Responsável pelo Registro
                </label>
                <input
                  type="text"
                  value={addedBy}
                  onChange={(e) => setAddedBy(e.target.value)}
                  className="w-full bg-[#1f0e15] border border-red-900/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    onClearPrefill?.();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/50"
                >
                  Confirmar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
