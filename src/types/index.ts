export type UserRole = 'operator' | 'admin';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
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
