'use client';

import React, { useState } from 'react';
import { User, UserRole } from '@/types';
import { store } from '@/lib/storage';
import { sound } from '@/lib/audio';
import {
  UserCog,
  Plus,
  ShieldCheck,
  Building2,
  Lock,
  Trash2,
  Edit2,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UsersViewProps {
  currentUser: User;
  onUsersUpdated: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ currentUser, onUsersUpdated }) => {
  const [users, setUsers] = useState<User[]>(store.getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('portaria');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const refreshList = () => {
    setUsers(store.getUsers());
    onUsersUpdated();
  };

  const openCreateModal = () => {
    sound.playClick();
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('portaria');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    sound.playClick();
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password || '');
    setRole(user.role);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || (!editingUser && !password.trim())) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    sound.playSuccess();
    store.saveUser({
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: name.trim(),
      username: username.trim().toUpperCase(),
      password: password.trim() || editingUser?.password,
      role,
      active: true,
      createdAt: editingUser?.createdAt || new Date().toISOString(),
    });

    setIsModalOpen(false);
    refreshList();
  };

  const handleDelete = (id: string, username: string) => {
    if (confirm(`Excluir permanentemente o usuário "${username}"?`)) {
      sound.playClick();
      store.deleteUser(id);
      refreshList();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
            Controle de Acessos & Permissões
          </span>
          <h2 className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
            <UserCog className="w-6 h-6 text-purple-400" />
            <span>Cadastro de Usuários ({users.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            <strong>Administrador</strong> tem acesso total ao sistema. <strong>Portaria</strong> visualiza exclusivamente a tela de entrada/saída.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs shadow-lg shadow-purple-900/50 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* Roles Legend Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <strong className="text-amber-300 block text-sm">Perfil Administrador</strong>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              Acesso irrestrito: Portaria, Check-in/Check-out, Cadastros de Clientes, Festas, Blacklist, Cadastro de Usuários e Auditoria Geral.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <strong className="text-purple-300 block text-sm">Perfil Portaria</strong>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              Acesso exclusivo à tela operacional da portaria (Check-in rápido com foto/OCR e Check-out). Todas as demais abas permanecem ocultas.
            </p>
          </div>
        </div>
      </div>

      {/* Users List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const isAdmin = u.role === 'administrador';
          const isMaster = u.username.toUpperCase() === 'GOUP';

          return (
            <div
              key={u.id}
              className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isAdmin
                  ? 'border-amber-500/40 bg-[#14101e]'
                  : 'border-purple-500/30 bg-[#100f22]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                        isAdmin
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                      }`}
                    >
                      {isAdmin ? <ShieldCheck className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white">{u.name}</h4>
                      <span className="text-xs font-mono text-purple-300">@{u.username}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isAdmin
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'bg-purple-950 text-purple-300 border border-purple-600'
                    }`}
                  >
                    {isAdmin ? 'Administrador' : 'Portaria'}
                  </span>
                </div>

                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1 text-[11px] text-slate-400 mb-3">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <strong className="text-emerald-400">Ativo</strong>
                  </div>
                  {u.lastLogin && (
                    <div className="flex justify-between">
                      <span>Último Acesso:</span>
                      <span className="font-mono text-slate-300">
                        {new Date(u.lastLogin).toLocaleTimeString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(u)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                {!isMaster && (
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id, u.username)}
                    className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors"
                    title="Excluir Usuário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar / Editar Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl glass-panel-neon bg-[#121124] border border-purple-500/40 p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-purple-400" />
              <span>{editingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo (Recepção)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Login / Usuário *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PORTARIA1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Senha {editingUser ? '(Deixe em branco para manter a atual)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    placeholder="Senha de acesso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#18172e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-purple-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Perfil Selection: Portaria vs Administrador */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Perfil de Acesso *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('portaria')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      role === 'portaria'
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/50'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span>Portaria (Só Portaria)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('administrador')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      role === 'administrador'
                        ? 'bg-amber-500 text-black border-amber-300 shadow-md shadow-amber-900/50'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>Administrador (Tudo)</span>
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}

              <div className="pt-2 flex justify-end gap-2">
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
                  Salvar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
