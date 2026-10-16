export type UserRole = 'portaria' | 'administrador';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  active?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface Party {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  description?: string;
  themeColor?: string;
  bannerUrl?: string;
  maxCapacity: number;
  status: 'scheduled' | 'active' | 'finished';
  createdAt?: string;
}

export type DocumentType = 'CPF' | 'RG' | 'CNH' | 'PASSAPORTE' | 'OUTRO';

export interface Client {
  id: string;
  name: string;
  document: string; // Cleaned digits or formatted
  documentType: DocumentType;
  birthDate?: string;
  gender?: string;
  phone?: string;
  email?: string;
  photoUrl?: string; // Face photo Base64 / URL
  documentPhotoUrl?: string; // Document photo Base64 / URL
  notes?: string;
  isVip: boolean;
  totalVisits: number;
  lastVisit?: string;
  createdAt: string;
  updatedAt?: string;
}

export type BanType = 'indefinite' | 'period';

export interface BlacklistEntry {
  id: string;
  clientId?: string;
  document: string;
  name: string;
  photoUrl?: string;
  reason: string;
  banType: BanType;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (null if indefinite)
  addedBy: string;
  status: 'active' | 'revoked';
  createdAt: string;
}

export interface CheckInRecord {
  id: string;
  partyId: string;
  partyName: string;
  clientId: string;
  clientName: string;
  clientDocument: string;
  clientPhoto?: string;
  documentPhoto?: string;
  checkinTime: string; // ISO String
  checkoutTime?: string; // ISO String
  status: 'inside' | 'checked_out';
  operatorName: string;
  notes?: string;
}

export interface BlacklistCheckResult {
  isBlacklisted: boolean;
  entry?: BlacklistEntry;
  reason?: string;
  banType?: BanType;
  endDate?: string;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CHECKIN'
  | 'CHECKOUT'
  | 'CREATE_CLIENT'
  | 'UPDATE_CLIENT'
  | 'DELETE_CLIENT'
  | 'ADD_BLACKLIST'
  | 'REVOKE_BLACKLIST'
  | 'DELETE_BLACKLIST'
  | 'CREATE_PARTY'
  | 'UPDATE_PARTY'
  | 'DELETE_PARTY'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER';

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  details: string;
  targetId?: string;
  targetName?: string;
}
