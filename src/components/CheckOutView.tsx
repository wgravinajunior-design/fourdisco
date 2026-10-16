'use client';

import React, { useState } from 'react';
import { CheckInRecord, Party } from '@/types';
import { store } from '@/lib/storage';
import { sound } from '@/lib/audio';
import { cleanDocument } from '@/lib/ocr';
import {
  LogOut,
  Search,
  Users,
  Clock,
  Sparkles,
  CheckCircle,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface CheckOutViewProps {
  parties: Party[];
  onCheckOutCompleted: () => void;
}

export const CheckOutView: React.FC<CheckOutViewProps> = ({
  parties,
  onCheckOutCompleted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartyId, setFilterPartyId] = useState<string>('all');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Active records inside
  const activeRecords = store.getActiveInside(
    filterPartyId === 'all' ? undefined : filterPartyId
  );

  // Filtered by search
  const filtered = activeRecords.filter((rec) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const cleanTerm = cleanDocument(term);
    return (
      rec.clientName.toLowerCase().includes(term) ||
      cleanDocument(rec.clientDocument).includes(cleanTerm) ||
      rec.clientDocument.toLowerCase().includes(term)
    );
  });

  // Calculate elapsed time formatted
  const getElapsed = (isoTime: string) => {
    const diffMs = Date.now() - new Date(isoTime).getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  };

  const handleCheckout = (record: CheckInRecord) => {
    sound.playCheckout();
    store.performCheckOut(record.id);
    setSuccessNotice(`Saída de ${record.clientName} registrada com sucesso!`);
    setTimeout(() => setSuccessNotice(null), 3500);
    onCheckOutCompleted();
  };

  const totalCapacity = parties.reduce((acc, p) => acc + (p.maxCapacity || 500), 0);
  const occupancyPercentage = Math.min(
    100,
    Math.round((activeRecords.length / (totalCapacity || 1)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Real-time Venue Occupancy Gauge */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-900/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/60">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Lotação Atual da Boate
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-white font-mono">
                  {activeRecords.length}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  pessoas dentro / capacidade ~{totalCapacity}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
              <span>Ocupação</span>
              <span className="text-cyan-400 font-mono">{occupancyPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancyPercentage > 90
                    ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'
                    : occupancyPercentage > 75
                    ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b]'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_#06b6d4]'
                }`}
                style={{ width: `${Math.max(5, occupancyPercentage)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successNotice && (
        <div className="p-4 rounded-2xl bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-between text-cyan-200 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-cyan-400" />
            <span className="font-bold text-sm">{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-xs text-cyan-400 hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Search & Party Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por Nome ou CPF/RG para saída..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121124] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Filtrar Festa:</span>
          <select
            value={filterPartyId}
            onChange={(e) => setFilterPartyId(e.target.value)}
            className="bg-[#121124] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 w-full sm:w-auto"
          >
            <option value="all">Todas as Festas Ativas</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List of People Inside */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-white/10 text-center">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhuma pessoa encontrada</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Não encontramos nenhum cliente com esses dados dentro da boate.'
              : 'Não há clientes dentro da boate no momento nesta seleção.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((record) => (
            <div
              key={record.id}
              className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center font-bold text-lg text-purple-300 shrink-0 overflow-hidden">
                    {record.clientPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={record.clientPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      record.clientName.charAt(0)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{record.clientName}</h4>
                    <div className="text-xs font-mono text-cyan-300 mt-0.5">
                      {record.clientDocument}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-1">
                      {record.partyName}
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1 mb-3 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-cyan-400" /> Entrada:
                    </span>
                    <strong className="font-mono text-white">
                      {new Date(record.checkinTime).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Tempo no local:</span>
                    <span className="font-bold text-cyan-300">{getElapsed(record.checkinTime)}</span>
                  </div>

                  {record.notes && (
                    <div className="text-[10px] text-amber-300/90 pt-1 border-t border-white/5">
                      Obs: {record.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                type="button"
                onClick={() => handleCheckout(record)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition-all active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                <span>CONFIRMAR CHECK-OUT</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
