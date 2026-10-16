'use client';

import React, { useState } from 'react';
import { Client, DocumentType } from '@/types';
import { store } from '@/lib/storage';
import { sound } from '@/lib/audio';
import { formatDocument, cleanDocument } from '@/lib/ocr';
import {
  Users,
  Search,
  Plus,
  Crown,
  ShieldAlert,
  FileText,
  Phone,
  Mail,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  X,
} from 'lucide-react';

interface ClientsViewProps {
  clients: Client[];
  onClientsUpdated: () => void;
  onOpenBlacklistModal: (client: Client) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onClientsUpdated,
  onOpenBlacklistModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State for manual creation
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('CPF');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [notes, setNotes] = useState('');

  const filtered = clients.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const cleanTerm = cleanDocument(term);
    return (
      c.name.toLowerCase().includes(term) ||
      cleanDocument(c.document).includes(cleanTerm) ||
      c.document.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term))
    );
  });

  const handleToggleVip = (client: Client) => {
    sound.playClick();
    store.saveClient({
      ...client,
      isVip: !client.isVip,
    });
    onClientsUpdated();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o cadastro de ${name}?`)) {
      sound.playClick();
      store.deleteClient(id);
      onClientsUpdated();
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !document.trim()) return;

    sound.playSuccess();
    store.saveClient({
      id: `cli-${Date.now()}`,
      name: name.trim(),
      document: formatDocument(document.trim()),
      documentType,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      isVip,
      notes: notes.trim() || undefined,
      totalVisits: 0,
      createdAt: new Date().toISOString(),
    });

    setIsCreateModalOpen(false);
    setName('');
    setDocument('');
    setPhone('');
    setEmail('');
    setIsVip(false);
    setNotes('');
    onClientsUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
            Base de Dados FourDisco
          </span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Cadastro das Pessoas ({clients.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Histórico completo de clientes, biometria facial, fotos de documentos e estatísticas de visitas.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-xs shadow-lg shadow-amber-950/40 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cadastro Manual</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-7 top-7" />
        <input
          type="text"
          placeholder="Filtrar por Nome, CPF, RG ou Telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#121124] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Clients Table / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => {
          const blCheck = store.checkBlacklist(client.document);
          const isBlacklisted = blCheck.isBlacklisted;

          return (
            <div
              key={client.id}
              className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isBlacklisted
                  ? 'border-red-500/50 bg-red-950/20'
                  : client.isVip
                  ? 'border-amber-500/40 hover:border-amber-400/80 bg-[#141220]'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                {/* Header Profile Photo & Badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center font-black text-xl text-purple-300 overflow-hidden shrink-0 shadow-md">
                      {client.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={client.photoUrl}
                          alt={client.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        client.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white leading-tight">
                        {client.name}
                      </h4>
                      <span className="text-xs font-mono text-cyan-300 block mt-0.5">
                        {client.document}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {client.documentType}
                      </span>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-col items-end gap-1">
                    {isBlacklisted && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-900/80 text-red-200 border border-red-600 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-red-400" /> Barrado
                      </span>
                    )}

                    {client.isVip && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/60 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" /> VIP
                      </span>
                    )}
                  </div>
                </div>

                {/* Details & Visits */}
                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1 text-xs mb-3">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400 text-[11px]">Total de Visitas:</span>
                    <strong className="text-purple-300 font-mono">{client.totalVisits || 0} noites</strong>
                  </div>

                  {client.phone && (
                    <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}

                  {client.documentPhotoUrl && (
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1 border-t border-white/5">
                      <FileText className="w-3 h-3" /> Foto do Documento salva
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedClient(client)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Ficha</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleVip(client)}
                  title={client.isVip ? 'Remover VIP' : 'Promover a VIP'}
                  className={`p-2 rounded-xl transition-colors ${
                    client.isVip
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-white/5 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <Crown className="w-4 h-4" />
                </button>

                {!isBlacklisted && (
                  <button
                    type="button"
                    onClick={() => onOpenBlacklistModal(client)}
                    title="Adicionar à Blacklist (Bloquear entrada)"
                    className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(client.id, client.name)}
                  title="Excluir Cadastro"
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-950/40 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Client Profile Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl glass-panel-neon bg-[#121124] border border-purple-500/40 p-6 shadow-2xl text-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedClient(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-950 border border-purple-700/60 overflow-hidden flex items-center justify-center font-bold text-2xl text-purple-300 shrink-0">
                {selectedClient.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedClient.photoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedClient.name.charAt(0)
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{selectedClient.name}</h3>
                <div className="text-xs font-mono text-cyan-300">{selectedClient.document}</div>
                <div className="text-[11px] text-slate-400">
                  Visitas: <strong className="text-white">{selectedClient.totalVisits || 0}</strong>
                </div>
              </div>
            </div>

            {/* Document Photo viewer */}
            {selectedClient.documentPhotoUrl ? (
              <div className="mb-4">
                <span className="text-xs font-bold text-purple-300 block mb-1">
                  Foto Original do Documento Capturada:
                </span>
                <div className="rounded-2xl overflow-hidden border border-purple-500/40 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedClient.documentPhotoUrl}
                    alt="Documento do Cliente"
                    className="w-full max-h-60 object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white/5 text-xs text-slate-400 mb-4">
                Nenhuma foto de documento armazenada para este cliente.
              </div>
            )}

            {/* Notes */}
            {selectedClient.notes && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-300 mb-4">
                <strong className="text-amber-400 block mb-1">Observações:</strong>
                {selectedClient.notes}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Client Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl glass-panel-neon bg-[#121124] border border-amber-500/40 p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>Novo Cadastro de Cliente</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Documento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={document}
                    onChange={(e) => setDocument(formatDocument(e.target.value))}
                    className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tipo</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="CPF">CPF</option>
                    <option value="RG">RG</option>
                    <option value="CNH">CNH</option>
                    <option value="PASSAPORTE">Passaporte</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVip}
                  onChange={(e) => setIsVip(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> Marcar como Cliente VIP
                </span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
