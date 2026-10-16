import { Party, Client, BlacklistEntry, CheckInRecord, BlacklistCheckResult, User } from '@/types';
import { cleanDocument } from './ocr';

const STORAGE_KEYS = {
  USER: 'fourdisco_auth_user',
  PARTIES: 'fourdisco_parties',
  CLIENTS: 'fourdisco_clients',
  BLACKLIST: 'fourdisco_blacklist',
  CHECKINS: 'fourdisco_checkins',
  SELECTED_PARTY_IDS: 'fourdisco_selected_parties',
};

// Today's date string YYYY-MM-DD
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate realistic seed data
function getDefaultParties(): Party[] {
  const today = getTodayString();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return [
    {
      id: 'party-1',
      name: 'FourDisco Neon Glow - Sexta Premium',
      date: today,
      description: 'A maior festa eletrônica da cidade com line-up internacional, lasers e open bar VIP.',
      themeColor: '#8b5cf6',
      maxCapacity: 600,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'party-2',
      name: 'FourDisco Sunset Lounge (Área VIP Rooftop)',
      date: today,
      description: 'Lounge exclusivo no rooftop com vista panorâmica, drinks especiais e deep house.',
      themeColor: '#ec4899',
      maxCapacity: 250,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'party-3',
      name: 'Black & Gold Saturday Night',
      date: tomorrow,
      description: 'Noite de gala com os melhores DJs de Funk e Trap da cena nacional.',
      themeColor: '#eab308',
      maxCapacity: 800,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    },
  ];
}

function getDefaultClients(): Client[] {
  return [
    {
      id: 'cli-1',
      name: 'Rodrigo Silva Alcantara',
      document: '123.456.789-00',
      documentType: 'CPF',
      phone: '(11) 98765-4321',
      email: 'rodrigo.alcantara@email.com',
      isVip: true,
      totalVisits: 14,
      createdAt: '2026-01-10T22:00:00Z',
    },
    {
      id: 'cli-2',
      name: 'Beatriz Ferreira Lima',
      document: '987.654.321-11',
      documentType: 'CPF',
      phone: '(11) 97654-3210',
      email: 'beatriz.lima@email.com',
      isVip: false,
      totalVisits: 5,
      createdAt: '2026-02-14T21:30:00Z',
    },
    {
      id: 'cli-3',
      name: 'Lucas Gabriel Oliveira',
      document: '456.789.012-33',
      documentType: 'CPF',
      phone: '(21) 99887-1122',
      email: 'lucas.gabriel@email.com',
      isVip: false,
      totalVisits: 1,
      createdAt: '2026-03-01T23:15:00Z',
    },
    {
      id: 'cli-4',
      name: 'Marcos Vinicius Santos (Exemplo Barrado)',
      document: '111.222.333-44',
      documentType: 'CPF',
      phone: '(11) 91122-3344',
      email: 'marcos.santos@email.com',
      isVip: false,
      totalVisits: 2,
      createdAt: '2025-11-20T20:00:00Z',
    },
  ];
}

function getDefaultBlacklist(): BlacklistEntry[] {
  const today = getTodayString();
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  return [
    {
      id: 'bl-1',
      clientId: 'cli-4',
      document: '111.222.333-44',
      name: 'Marcos Vinicius Santos (Exemplo Barrado)',
      reason: 'Envolvimento em briga física na pista principal e dano ao patrimônio da boate.',
      banType: 'indefinite',
      startDate: '2025-12-01',
      addedBy: 'Gerência de Segurança FourDisco',
      status: 'active',
      createdAt: '2025-12-01T03:30:00Z',
    },
    {
      id: 'bl-2',
      document: '555.666.777-88',
      name: 'Fernando Souza Mendes',
      reason: 'Tentativa de utilizar documento falso de terceiro na portaria.',
      banType: 'period',
      startDate: today,
      endDate: nextMonth,
      addedBy: 'Coordenação FourDisco',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];
}

function getDefaultCheckIns(): CheckInRecord[] {
  const today = getTodayString();
  return [
    {
      id: 'chk-1',
      partyId: 'party-1',
      partyName: 'FourDisco Neon Glow - Sexta Premium',
      clientId: 'cli-1',
      clientName: 'Rodrigo Silva Alcantara',
      clientDocument: '123.456.789-00',
      checkinTime: new Date(Date.now() - 3600000 * 2.5).toISOString(),
      status: 'inside',
      operatorName: 'Portaria Principal',
    },
    {
      id: 'chk-2',
      partyId: 'party-1',
      partyName: 'FourDisco Neon Glow - Sexta Premium',
      clientId: 'cli-2',
      clientName: 'Beatriz Ferreira Lima',
      clientDocument: '987.654.321-11',
      checkinTime: new Date(Date.now() - 3600000 * 1.2).toISOString(),
      status: 'inside',
      operatorName: 'Portaria Principal',
    },
  ];
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
      // If no party for today, return any active ones as fallback
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

  // Selected Parties (for multi-selection of today's parties)
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
    const list = this.getItem<Client[]>(STORAGE_KEYS.CLIENTS, []);
    if (!list || list.length === 0) {
      const defaults = getDefaultClients();
      this.setItem(STORAGE_KEYS.CLIENTS, defaults);
      return defaults;
    }
    return list;
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
    const list = this.getItem<BlacklistEntry[]>(STORAGE_KEYS.BLACKLIST, []);
    if (!list || list.length === 0) {
      const defaults = getDefaultBlacklist();
      this.setItem(STORAGE_KEYS.BLACKLIST, defaults);
      return defaults;
    }
    return list;
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

    // Check if ban is indefinite
    if (entry.banType === 'indefinite') {
      return {
        isBlacklisted: true,
        entry,
        reason: entry.reason,
        banType: 'indefinite',
      };
    }

    // Check if within period
    if (entry.banType === 'period') {
      if (entry.endDate && today > entry.endDate) {
        // Expired period
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
    const list = this.getItem<CheckInRecord[]>(STORAGE_KEYS.CHECKINS, []);
    if (!list || list.length === 0) {
      const defaults = getDefaultCheckIns();
      this.setItem(STORAGE_KEYS.CHECKINS, defaults);
      return defaults;
    }
    return list;
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

    // Update client total visits
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
