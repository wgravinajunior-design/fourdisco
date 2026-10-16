import { Party, Client, BlacklistEntry, CheckInRecord, BlacklistCheckResult, User } from '@/types';
import { cleanDocument } from './ocr';

const STORAGE_KEYS = {
  USER: 'fourdisco_v2_auth_user',
  PARTIES: 'fourdisco_v2_parties',
  CLIENTS: 'fourdisco_v2_clients',
  BLACKLIST: 'fourdisco_v2_blacklist',
  CHECKINS: 'fourdisco_v2_checkins',
  SELECTED_PARTY_IDS: 'fourdisco_v2_selected_parties',
};

// Today's date string YYYY-MM-DD
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Clean initial data (zero fake clients / zero fake checkins / zero fake blacklist)
function getDefaultParties(): Party[] {
  const today = getTodayString();
  return [
    {
      id: 'party-1',
      name: 'FourDisco Nightclub - Noite Oficial',
      date: today,
      description: 'Evento Oficial FourDisco com recepção e portaria ativa',
      themeColor: '#8b5cf6',
      maxCapacity: 500,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];
}

function getDefaultClients(): Client[] {
  return [];
}

function getDefaultBlacklist(): BlacklistEntry[] {
  return [];
}

function getDefaultCheckIns(): CheckInRecord[] {
  return [];
}

// Client-side local storage utilities with safe window checks
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

  // Auth
  getCurrentUser(): User | null {
    return this.getItem<User | null>(STORAGE_KEYS.USER, null);
  }

  setCurrentUser(user: User | null): void {
    this.setItem(STORAGE_KEYS.USER, user);
  }

  // Parties
  getParties(): Party[] {
    const list = this.getItem<Party[]>(STORAGE_KEYS.PARTIES, []);
    if (!list || list.length === 0) {
      const defaults = getDefaultParties();
      this.setItem(STORAGE_KEYS.PARTIES, defaults);
      return defaults;
    }
    return list;
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
    if (existingIndex >= 0) {
      parties[existingIndex] = party;
    } else {
      parties.unshift(party);
    }
    this.setItem(STORAGE_KEYS.PARTIES, parties);
    return party;
  }

  deleteParty(id: string): void {
    const parties = this.getParties().filter((p) => p.id !== id);
    this.setItem(STORAGE_KEYS.PARTIES, parties);
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
    return this.getItem<Client[]>(STORAGE_KEYS.CLIENTS, getDefaultClients());
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
      return newClient;
    }
  }

  deleteClient(id: string): void {
    const clients = this.getClients().filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CLIENTS, clients);
  }

  // Blacklist
  getBlacklist(): BlacklistEntry[] {
    return this.getItem<BlacklistEntry[]>(STORAGE_KEYS.BLACKLIST, getDefaultBlacklist());
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
    return newEntry;
  }

  revokeBlacklist(id: string): void {
    const blacklist = this.getBlacklist().map((b) =>
      b.id === id ? { ...b, status: 'revoked' as const } : b
    );
    this.setItem(STORAGE_KEYS.BLACKLIST, blacklist);
  }

  deleteBlacklist(id: string): void {
    const blacklist = this.getBlacklist().filter((b) => b.id !== id);
    this.setItem(STORAGE_KEYS.BLACKLIST, blacklist);
  }

  // Check-ins & Check-outs
  getCheckIns(): CheckInRecord[] {
    return this.getItem<CheckInRecord[]>(STORAGE_KEYS.CHECKINS, getDefaultCheckIns());
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

    return newRecord;
  }

  performCheckOut(checkinId: string): CheckInRecord | null {
    const checkins = this.getCheckIns();
    const index = checkins.findIndex((c) => c.id === checkinId);
    if (index >= 0) {
      checkins[index].status = 'checked_out';
      checkins[index].checkoutTime = new Date().toISOString();
      this.setItem(STORAGE_KEYS.CHECKINS, checkins);
      return checkins[index];
    }
    return null;
  }
}

export const store = new DataStore();
