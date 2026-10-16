'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CheckInRecord, Party } from '@/types';
import { store } from '@/lib/storage';
import { sound } from '@/lib/audio';
import { cleanDocument } from '@/lib/ocr';
import {
  LogOut,
  Search,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
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
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const activeRecords = store.getActiveInside();

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
    setSuccessNotice(`Saída de ${record.clientName} liberada!`);
    setTimeout(() => setSuccessNotice(null), 3000);
    setSearchTerm('');
    onCheckOutCompleted();
    searchInputRef.current?.focus();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Banner with Total Count */}
      <div className="glass-panel px-6 py-4 rounded-3xl border border-cyan-500/30 flex items-center justify-between bg-[#0a111a]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
              SAÍDA DA BOATE (CHECK-OUT)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">
                {activeRecords.length}
              </span>
              <span className="text-xs text-slate-400">clientes no interior</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-semibold text-slate-400 block">Status da Porta</span>
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Catraca Liberada
          </span>
        </div>
      </div>

      {/* Success Alert */}
      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/90 border border-cyan-500 flex items-center justify-between text-cyan-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold">{successNotice}</span>
          </div>
        </div>
      )}

      {/* Search Input Bar (High-Contrast & Auto-Focused) */}
      <div className="glass-panel p-3 rounded-2xl border-2 border-cyan-500/40 relative bg-[#0e1624]">
        <Search className="w-5 h-5 text-cyan-400 absolute left-4 top-4" />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Digite o CPF ou Nome do cliente para saída rápida..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent pl-11 pr-4 py-2.5 text-base font-bold text-white placeholder-slate-500 focus:outline-none font-mono"
        />
      </div>

      {/* List of active people inside */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-300">Nenhum cliente encontrado</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {searchTerm
              ? 'Nenhum registro com esses dados ativo dentro da boate.'
              : 'Nenhum cliente dentro do clube no momento.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((record) => (
            <div
              key={record.id}
              className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-cyan-500/50 bg-[#101322] flex items-center justify-between gap-3 transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center font-bold text-base text-purple-300 shrink-0 overflow-hidden">
                  {record.clientPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={record.clientPhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    record.clientName.charAt(0)
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-black text-white truncate">{record.clientName}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span className="font-mono text-cyan-300">{record.clientDocument}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {getElapsed(record.checkinTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Checkout Button */}
              <button
                type="button"
                onClick={() => handleCheckout(record)}
                className="py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all shrink-0 active:scale-98"
              >
                <LogOut className="w-4 h-4" />
                <span>LIBERAR SAÍDA</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
