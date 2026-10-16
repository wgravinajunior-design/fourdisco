import { Party, Client, BlacklistEntry, CheckInRecord, BlacklistCheckResult, User, AuditLog, AuditAction } from '@/types';
import { cleanDocument } from './ocr';

const STORAGE_KEYS = {
  USER: 'fourdisco_v4_auth_user',
  SYSTEM_USERS: 'fourdisco_v4_system_users',
  AUDIT_LOGS: 'fourdisco_v4_audit_logs',
  PARTIES: 'fourdisco_v4_parties',
  CLIENTS: 'fourdisco_v4_clients',
  BLACKLIST: 'fourdisco_v4_blacklist',
  CHECKINS: 'fourdisco_v4_checkins',
  SELECTED_PARTY_IDS: 'fourdisco_v4_selected_parties',
};

// Today's date string YYYY-MM-DD
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Initial System Users (Standard Master Administrator GOUP)
function getDefaultUsers(): User[] {
  return [
    {
      id: 'usr-goup',
      username: 'GOUP',
      password: 'GOUP226457',
      name: 'Administrador Master',
      role: 'administrador',
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

class DataStore {
  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return defaultValue;
      return JSON.parse(saved);
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage set error:', e);
    }
  }

  // ==========================================
  // AUDITORIA (LOG DE TUDO)
  // ==========================================
  getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  logAudit(action: AuditAction, details: string, targetId?: string, targetName?: string): AuditLog {
    const logs = this.getAuditLogs();
    const currentUser = this.getCurrentUser();

    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sistema',
      userName: currentUser?.name || 'Sistema / Portaria',
      userRole: currentUser?.role || 'portaria',
      action,
      details,
      targetId,
      targetName,
    };

    logs.unshift(newLog);
    // Keep last 1000 logs to prevent memory bloat
    if (logs.length > 1000) logs.pop();
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  }

  // ==========================================
  // USUÁRIOS & PERFIS (PORTARIA / ADMINISTRADOR)
  // ==========================================
  getUsers(): User[] {
    const list = this.getItem<User[]>(STORAGE_KEYS.SYSTEM_USERS, []);
    if (!list || list.length === 0) {
      const defaults = getDefaultUsers();
      this.setItem(STORAGE_KEYS.SYSTEM_USERS, defaults);
      return defaults;
    }
    return list;
  }

  saveUser(user: User): User {
    const users = this.getUsers();
    const existingIndex = users.findIndex(
      (u) => u.id === user.id || u.username.toUpperCase() === user.username.toUpperCase()
    );

    const isNew = existingIndex < 0;
    if (!isNew) {
      users[existingIndex] = {
        ...users[existingIndex],
        ...user,
      };
      this.setItem(STORAGE_KEYS.SYSTEM_USERS, users);
      this.logAudit(
        'UPDATE_USER',
        `Usuário "${user.username}" atualizado (Perfil: ${user.role})`,
        user.id,
        user.name
      );
      return users[existingIndex];
    } else {
      const newUser: User = {
        ...user,
        id: user.id || `usr-${Date.now()}`,
        active: user.active ?? true,
        createdAt: new Date().toISOString(),
      };
      users.unshift(newUser);
      this.setItem(STORAGE_KEYS.SYSTEM_USERS, users);
      this.logAudit(
        'CREATE_USER',
        `Novo usuário criado: "${newUser.username}" (${newUser.name}) com perfil de ${newUser.role.toUpperCase()}`,
        newUser.id,
        newUser.name
      );
      return newUser;
    }
  }

  deleteUser(id: string): void {
    const users = this.getUsers();
    const user = users.find((u) => u.id === id);
    if (user?.username.toUpperCase() === 'GOUP') {
      alert('O usuário mestre GOUP não pode ser excluído.');
      return;
    }
    const filtered = users.filter((u) => u.id !== id);
    this.setItem(STORAGE_KEYS.SYSTEM_USERS, filtered);
    if (user) {
      this.logAudit('DELETE_USER', `Usuário "${user.username}" (${user.name}) foi excluído`, id, user.name);
    }
  }

  authenticate(usernameInput: string, passwordInput: string): User | null {
    const u = usernameInput.trim().toUpperCase();
    const p = passwordInput.trim();

    // Check against registered users
    const users = this.getUsers();
    const found = users.find(
      (user) => user.username.toUpperCase() === u && user.password === p && user.active !== false
    );

    if (found) {
      found.lastLogin = new Date().toISOString();
      this.setItem(STORAGE_KEYS.SYSTEM_USERS, users);
      this.setCurrentUser(found);
      this.logAudit('LOGIN', `Login realizado com sucesso pelo usuário "${found.username}" (${found.name} - ${found.role})`);
      return found;
    }

    // Direct GOUP master failsafe
    if (u === 'GOUP' && p === 'GOUP226457') {
      const masterUser: User = {
        id: 'usr-goup',
        username: 'GOUP',
        password: 'GOUP226457',
        name: 'Administrador Master',
        role: 'administrador',
        active: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      this.setCurrentUser(masterUser);
      this.logAudit('LOGIN', `Login realizado com sucesso pelo usuário mestre GOUP (administrador)`);
      return masterUser;
    }

    return null;
  }

  // Auth Session
  getCurrentUser(): User | null {
    return this.getItem<User | null>(STORAGE_KEYS.USER, null);
  }

  setCurrentUser(user: User | null): void {
    if (!user) {
      const current = this.getCurrentUser();
      if (current) {
        this.logAudit('LOGOUT', `Usuário "${current.username}" encerrou a sessão`);
      }
    }
    this.setItem(STORAGE_KEYS.USER, user);
  }

  // Parties
  getParties(): Party[] {
    return this.getItem<Party[]>(STORAGE_KEYS.PARTIES, []);
  }

  getTodayParties(): Party[] {
    const today = getTodayString();
    const all = this.getParties();
    const matching = all.filter((p) => p.date === today && p.status !== 'finished');
    if (matching.length === 0) {
      return all.filter((p) => p.status === 'active');
    }
    return matching;
  }

  saveParty(party: Party): Party {
    const parties = this.getParties();
    const existingIndex = parties.findIndex((p) => p.id === party.id);
    const isNew = existingIndex < 0;

    if (!isNew) {
      parties[existingIndex] = party;
      this.logAudit('UPDATE_PARTY', `Festa atualizada: "${party.name}" (Data: ${party.date})`, party.id, party.name);
    } else {
      parties.unshift(party);
      this.logAudit('CREATE_PARTY', `Nova festa cadastrada: "${party.name}" (Data: ${party.date}, Capacidade: ${party.maxCapacity})`, party.id, party.name);
    }
    this.setItem(STORAGE_KEYS.PARTIES, parties);
    return party;
  }

  deleteParty(id: string): void {
    const parties = this.getParties();
    const party = parties.find((p) => p.id === id);
    const filtered = parties.filter((p) => p.id !== id);
    this.setItem(STORAGE_KEYS.PARTIES, filtered);
    if (party) {
      this.logAudit('DELETE_PARTY', `Festa excluída: "${party.name}"`, id, party.name);
    }
  }

  getSelectedPartyIds(): string[] {
    const saved = this.getItem<string[]>(STORAGE_KEYS.SELECTED_PARTY_IDS, []);
    if (saved && saved.length > 0) return saved;
    const today = this.getTodayParties();
    if (today.length > 0) {
      const ids = [today[0].id];
      this.setItem(STORAGE_KEYS.SELECTED_PARTY_IDS, ids);
      return ids;
    }
    return [];
  }

  setSelectedPartyIds(ids: string[]): void {
    this.setItem(STORAGE_KEYS.SELECTED_PARTY_IDS, ids);
  }

  // Clients
  getClients(): Client[] {
    return this.getItem<Client[]>(STORAGE_KEYS.CLIENTS, []);
  }

  findClientByDocument(doc: string): Client | undefined {
    const clean = cleanDocument(doc);
    return this.getClients().find((c) => cleanDocument(c.document) === clean);
  }

  saveClient(client: Client): Client {
    const clients = this.getClients();
    const clean = cleanDocument(client.document);
    const existingIndex = clients.findIndex(
      (c) => c.id === client.id || cleanDocument(c.document) === clean
    );
    if (existingIndex >= 0) {
      clients[existingIndex] = {
        ...clients[existingIndex],
        ...client,
        updatedAt: new Date().toISOString(),
      };
      this.setItem(STORAGE_KEYS.CLIENTS, clients);
      this.logAudit('UPDATE_CLIENT', `Cadastro de cliente atualizado: ${client.name} (Doc: ${client.document})`, client.id, client.name);
      return clients[existingIndex];
    } else {
      const newClient = {
        ...client,
        id: client.id || `cli-${Date.now()}`,
        totalVisits: client.totalVisits || 1,
        createdAt: new Date().toISOString(),
      };
      clients.unshift(newClient);
      this.setItem(STORAGE_KEYS.CLIENTS, clients);
      this.logAudit('CREATE_CLIENT', `Novo cliente cadastrado: ${newClient.name} (Doc: ${newClient.document})`, newClient.id, newClient.name);
      return newClient;
    }
  }

  deleteClient(id: string): void {
    const clients = this.getClients();
    const client = clients.find((c) => c.id === id);
    const filtered = clients.filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CLIENTS, filtered);
    if (client) {
      this.logAudit('DELETE_CLIENT', `Cliente excluído da base: ${client.name} (Doc: ${client.document})`, id, client.name);
    }
  }

  // Blacklist
  getBlacklist(): BlacklistEntry[] {
    return this.getItem<BlacklistEntry[]>(STORAGE_KEYS.BLACKLIST, []);
  }

  checkBlacklist(document: string): BlacklistCheckResult {
    const clean = cleanDocument(document);
    const all = this.getBlacklist();
    const today = getTodayString();

    const entry = all.find(
      (b) => cleanDocument(b.document) === clean && b.status === 'active'
    );

    if (!entry) {
      return { isBlacklisted: false };
    }

    if (entry.banType === 'indefinite') {
      return {
        isBlacklisted: true,
        entry,
        reason: entry.reason,
        banType: 'indefinite',
      };
    }

    if (entry.banType === 'period') {
      if (entry.endDate && today > entry.endDate) {
        return { isBlacklisted: false };
      }
      return {
        isBlacklisted: true,
        entry,
        reason: entry.reason,
        banType: 'period',
        endDate: entry.endDate,
      };
    }

    return { isBlacklisted: false };
  }

  addToBlacklist(entry: Omit<BlacklistEntry, 'id' | 'createdAt' | 'status'>): BlacklistEntry {
    const blacklist = this.getBlacklist();
    const newEntry: BlacklistEntry = {
      ...entry,
      id: `bl-${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    blacklist.unshift(newEntry);
    this.setItem(STORAGE_KEYS.BLACKLIST, blacklist);
    this.logAudit(
      'ADD_BLACKLIST',
      `INCLUSÃO NA BLACKLIST: ${newEntry.name} (Doc: ${newEntry.document}) - Motivo: "${newEntry.reason}" - Tipo: ${newEntry.banType === 'indefinite' ? 'Indeterminado' : `Até ${newEntry.endDate}`}`,
      newEntry.id,
      newEntry.name
    );
    return newEntry;
  }

  revokeBlacklist(id: string): void {
    const blacklist = this.getBlacklist();
    const entry = blacklist.find((b) => b.id === id);
    const updated = blacklist.map((b) =>
      b.id === id ? { ...b, status: 'revoked' as const } : b
    );
    this.setItem(STORAGE_KEYS.BLACKLIST, updated);
    if (entry) {
      this.logAudit(
        'REVOKE_BLACKLIST',
        `BLOQUEIO REVOGADO: Bloqueio de ${entry.name} (Doc: ${entry.document}) foi revogado. Entrada liberada.`,
        id,
        entry.name
      );
    }
  }

  deleteBlacklist(id: string): void {
    const blacklist = this.getBlacklist();
    const entry = blacklist.find((b) => b.id === id);
    const filtered = blacklist.filter((b) => b.id !== id);
    this.setItem(STORAGE_KEYS.BLACKLIST, filtered);
    if (entry) {
      this.logAudit('DELETE_BLACKLIST', `Registro de blacklist de ${entry.name} foi excluído`, id, entry.name);
    }
  }

  // Check-ins & Check-outs
  getCheckIns(): CheckInRecord[] {
    return this.getItem<CheckInRecord[]>(STORAGE_KEYS.CHECKINS, []);
  }

  getActiveInside(partyId?: string): CheckInRecord[] {
    const all = this.getCheckIns();
    return all.filter((c) => {
      if (c.status !== 'inside') return false;
      if (partyId && c.partyId !== partyId) return false;
      return true;
    });
  }

  isClientInside(document: string, partyId?: string): CheckInRecord | undefined {
    const clean = cleanDocument(document);
    return this.getActiveInside(partyId).find(
      (c) => cleanDocument(c.clientDocument) === clean
    );
  }

  performCheckIn(record: Omit<CheckInRecord, 'id' | 'status' | 'checkinTime'>): CheckInRecord {
    const checkins = this.getCheckIns();
    const newRecord: CheckInRecord = {
      ...record,
      id: `chk-${Date.now()}`,
      status: 'inside',
      checkinTime: new Date().toISOString(),
    };
    checkins.unshift(newRecord);
    this.setItem(STORAGE_KEYS.CHECKINS, checkins);

    const clients = this.getClients();
    const client = clients.find((c) => c.id === record.clientId);
    if (client) {
      client.totalVisits = (client.totalVisits || 0) + 1;
      client.lastVisit = new Date().toISOString();
      this.setItem(STORAGE_KEYS.CLIENTS, clients);
    }

    this.logAudit(
      'CHECKIN',
      `CHECK-IN realizado: ${record.clientName} (Doc: ${record.clientDocument}) na festa "${record.partyName}" - Operador: ${record.operatorName}`,
      newRecord.id,
      record.clientName
    );

    return newRecord;
  }

  performCheckOut(checkinId: string): CheckInRecord | null {
    const checkins = this.getCheckIns();
    const index = checkins.findIndex((c) => c.id === checkinId);
    if (index >= 0) {
      checkins[index].status = 'checked_out';
      checkins[index].checkoutTime = new Date().toISOString();
      this.setItem(STORAGE_KEYS.CHECKINS, checkins);

      this.logAudit(
        'CHECKOUT',
        `CHECK-OUT realizado: ${checkins[index].clientName} (Doc: ${checkins[index].clientDocument}) liberado da festa "${checkins[index].partyName}"`,
        checkinId,
        checkins[index].clientName
      );

      return checkins[index];
    }
    return null;
  }
}

export const store = new DataStore();
