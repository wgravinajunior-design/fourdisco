'use client';

import React, { useState } from 'react';
import { Party } from '@/types';
import { store, getTodayString } from '@/lib/storage';
import { sound } from '@/lib/audio';
import {
  Calendar,
  Plus,
  Sparkles,
  Users,
  CheckCircle2,
  Trash2,
  Edit2,
  Clock,
  Palette,
  Check,
} from 'lucide-react';

interface PartiesViewProps {
  parties: Party[];
  selectedPartyIds: string[];
  onTogglePartySelection: (partyId: string) => void;
  onPartiesUpdated: () => void;
}

export const PartiesView: React.FC<PartiesViewProps> = ({
  parties,
  selectedPartyIds,
  onTogglePartySelection,
  onPartiesUpdated,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [maxCapacity, setMaxCapacity] = useState(500);
  const [themeColor, setThemeColor] = useState('#8b5cf6');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'scheduled' | 'finished'>('active');

  const todayStr = getTodayString();

  const openCreateModal = () => {
    sound.playClick();
    setEditingParty(null);
    setName('');
    setDate(getTodayString());
    setMaxCapacity(500);
    setThemeColor('#8b5cf6');
    setDescription('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Party) => {
    sound.playClick();
    setEditingParty(p);
    setName(p.name);
    setDate(p.date);
    setMaxCapacity(p.maxCapacity);
    setThemeColor(p.themeColor || '#8b5cf6');
    setDescription(p.description || '');
    setStatus(p.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.playSuccess();
    store.saveParty({
      id: editingParty ? editingParty.id : `party-${Date.now()}`,
      name: name.trim(),
      date,
      maxCapacity: Number(maxCapacity) || 500,
      themeColor,
      description: description.trim() || undefined,
      status,
      createdAt: editingParty?.createdAt || new Date().toISOString(),
    });

    setIsModalOpen(false);
    onPartiesUpdated();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir a festa "${name}"?`)) {
      sound.playClick();
      store.deleteParty(id);
      onPartiesUpdated();
    }
  };

  // Pre-configured glowing themes
  const THEME_OPTIONS = [
    { label: 'Neon Roxo', hex: '#8b5cf6' },
    { label: 'Pink Glow', hex: '#ec4899' },
    { label: 'Cyan Laser', hex: '#06b6d4' },
    { label: 'Gold VIP', hex: '#eab308' },
    { label: 'Red Inferno', hex: '#f43f5e' },
    { label: 'Emerald Jungle', hex: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
            Gerenciamento de Eventos
          </span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
            <Calendar className="w-6 h-6 text-purple-400" />
            <span>Cadastro de Festas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Festas com a data de hoje ({todayStr}) são reconhecidas automaticamente na portaria.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Festa</span>
        </button>
      </div>

      {/* Grid of parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parties.map((party) => {
          const isToday = party.date === todayStr;
          const isSelected = selectedPartyIds.includes(party.id);
          const attendees = store
            .getCheckIns()
            .filter((c) => c.partyId === party.id && c.status === 'inside').length;

          return (
            <div
              key={party.id}
              className={`glass-panel p-5 rounded-3xl border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-purple-500/80 shadow-[0_0_25px_rgba(139,92,246,0.25)] bg-[#141228]'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {isToday ? (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 flex items-center gap-1.5 animate-pulse">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> Festa de Hoje
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> {party.date}
                    </span>
                  )}

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      party.status === 'active'
                        ? 'bg-purple-950 text-purple-300 border border-purple-700'
                        : party.status === 'scheduled'
                        ? 'bg-blue-950 text-blue-300 border border-blue-700'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {party.status === 'active'
                      ? 'Ativa'
                      : party.status === 'scheduled'
                      ? 'Agendada'
                      : 'Encerrada'}
                  </span>
                </div>

                {/* Party Color indicator & Name */}
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className="w-4 h-10 rounded-full shrink-0 shadow-lg"
                    style={{ backgroundColor: party.themeColor || '#8b5cf6' }}
                  />
                  <div>
                    <h3 className="text-base font-black text-white leading-tight">{party.name}</h3>
                    {party.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {party.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-black/30 p-3 rounded-2xl border border-white/5 my-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Lotação Atual:</span>
                    <strong className="text-cyan-300 font-mono text-sm">{attendees}</strong>
                    <span className="text-slate-500 text-[10px]"> dentro</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Capacidade Máx:</span>
                    <strong className="text-white font-mono text-sm">{party.maxCapacity}</strong>
                    <span className="text-slate-500 text-[10px]"> pessoas</span>
                  </div>
                </div>
              </div>

              {/* Bottom Multi-selection & Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onTogglePartySelection(party.id);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSelected ? 'Festa Selecionada' : 'Selecionar na Portaria'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(party)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                    title="Editar Festa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(party.id, party.name)}
                    className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors"
                    title="Excluir Festa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl glass-panel-neon bg-[#121124] border border-purple-500/40 p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span>{editingParty ? 'Editar Festa' : 'Cadastrar Nova Festa'}</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome da Festa / Evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: FourDisco Neon Glow Festival"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Data do Evento *</span>
                    <button
                      type="button"
                      onClick={() => setDate(getTodayString())}
                      className="text-[10px] text-purple-400 underline font-normal"
                    >
                      Hoje
                    </button>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Capacidade Máxima
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="10000"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Theme Color selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-pink-400" />
                  <span>Tema Visual / Cor Neon</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.hex}
                      type="button"
                      onClick={() => setThemeColor(t.hex)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        themeColor === t.hex
                          ? 'border-white text-white shadow-md'
                          : 'border-white/10 text-slate-400 hover:text-white'
                      }`}
                      style={{ backgroundColor: `${t.hex}30` }}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: t.hex }}
                      />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Descrição / Atrações (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Line-up, DJs convidados, informações de camarote..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as 'active' | 'scheduled' | 'finished')
                  }
                  className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="active">Ativa (Aparece na Portaria)</option>
                  <option value="scheduled">Agendada (Futura)</option>
                  <option value="finished">Encerrada</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/50"
                >
                  Salvar Festa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
