'use client';

import React, { useState } from 'react';
import { AuditLog, AuditAction } from '@/types';
import { store } from '@/lib/storage';
import { sound } from '@/lib/audio';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  Download,
  AlertCircle,
} from 'lucide-react';

interface AuditViewProps {
  logs: AuditLog[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const filtered = logs.filter((log) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      log.details.toLowerCase().includes(term) ||
      log.userName.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      (log.targetName && log.targetName.toLowerCase().includes(term));

    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CHECKIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-600">CHECK-IN</span>;
      case 'CHECKOUT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-600">CHECK-OUT</span>;
      case 'ADD_BLACKLIST':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-950 text-red-300 border border-red-600">BLACKLIST</span>;
      case 'REVOKE_BLACKLIST':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-600">DESBLOQUEIO</span>;
      case 'CREATE_CLIENT':
      case 'UPDATE_CLIENT':
      case 'DELETE_CLIENT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-950 text-purple-300 border border-purple-600">CLIENTES</span>;
      case 'CREATE_PARTY':
      case 'UPDATE_PARTY':
      case 'DELETE_PARTY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-950 text-pink-300 border border-pink-600">FESTAS</span>;
      case 'CREATE_USER':
      case 'UPDATE_USER':
      case 'DELETE_USER':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-950 text-indigo-300 border border-indigo-600">USUÁRIOS</span>;
      case 'LOGIN':
      case 'LOGOUT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-600">ACESSO</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-300">{action}</span>;
    }
  };

  const exportCSV = () => {
    sound.playClick();
    const rows = [
      ['Data/Hora', 'Usuário', 'Perfil', 'Ação', 'Detalhes'],
      ...filtered.map((l) => [
        new Date(l.timestamp).toLocaleString('pt-BR'),
        l.userName,
        l.userRole,
        l.action,
        `"${l.details.replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_fourdisco_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
            Registro de Segurança & Compliance
          </span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Auditoria do Sistema ({logs.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Histórico imutável de todas as ações executadas no sistema (check-ins, check-outs, inclusões na blacklist, cadastros e logins).
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs border border-white/10 transition-all"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Exportar Relatório (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Pesquisar nos registros de auditoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121124] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Filtrar Ação:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-[#121124] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 w-full sm:w-auto"
          >
            <option value="all">Todas as Ações</option>
            <option value="CHECKIN">Check-ins</option>
            <option value="CHECKOUT">Check-outs</option>
            <option value="ADD_BLACKLIST">Inclusões Blacklist</option>
            <option value="REVOKE_BLACKLIST">Desbloqueios Blacklist</option>
            <option value="CREATE_CLIENT">Cadastro Clientes</option>
            <option value="CREATE_PARTY">Cadastro Festas</option>
            <option value="CREATE_USER">Criação Usuários</option>
            <option value="LOGIN">Acessos / Logins</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-10 rounded-3xl border border-white/10 text-center">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-300">Nenhum registro de auditoria</h4>
          <p className="text-xs text-slate-500 mt-1">
            As ações realizadas pelos operadores e administradores serão gravadas aqui em tempo real.
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#141228] text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Perfil</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Detalhes da Operação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedTime = dateObj.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const formattedDate = dateObj.toLocaleDateString('pt-BR');

                  return (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <span className="text-white font-bold">{formattedTime}</span>
                        <span className="text-slate-500 block text-[10px]">{formattedDate}</span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        {log.userName}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            log.userRole === 'administrador'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                              : 'bg-purple-950 text-purple-300 border border-purple-600'
                          }`}
                        >
                          {log.userRole}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      <td className="py-3 px-4 text-slate-200">
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
