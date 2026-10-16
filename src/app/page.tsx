'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, Party, Client, BlacklistEntry } from '@/types';
import { store, getTodayString } from '@/lib/storage';
import { Header } from '@/components/Header';
import { LoginView } from '@/components/LoginView';
import { CheckInView } from '@/components/CheckInView';
import { CheckOutView } from '@/components/CheckOutView';
import { ClientsView } from '@/components/ClientsView';
import { PartiesView } from '@/components/PartiesView';
import { BlacklistView } from '@/components/BlacklistView';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('checkin');

  // Core Data
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedPartyIds, setSelectedPartyIds] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [insideCount, setInsideCount] = useState<number>(0);

  // Client to prefill into blacklist modal
  const [blacklistPrefillClient, setBlacklistPrefillClient] = useState<Client | null>(null);

  // Load all initial state
  const refreshData = useCallback(() => {
    const p = store.getParties();
    setParties(p);

    const c = store.getClients();
    setClients(c);

    const bl = store.getBlacklist();
    setBlacklist(bl);

    const inside = store.getActiveInside().length;
    setInsideCount(inside);

    // Selected parties
    const sel = store.getSelectedPartyIds();
    setSelectedPartyIds(sel);
  }, []);

  useEffect(() => {
    // Check if user was saved in session
    const savedUser = store.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      if (savedUser.role === 'admin') {
        setActiveTab('clients');
      } else {
        setActiveTab('checkin');
      }
    }
    refreshData();
  }, [refreshData]);

  // Handle Login: auto-detect party of the day
  const handleLogin = (user: User) => {
    store.setCurrentUser(user);
    setCurrentUser(user);

    // Auto-detect party of the day
    const todayParties = store.getTodayParties();
    if (todayParties.length > 0) {
      // Auto select the first or all today's parties
      const todayIds = todayParties.map((tp) => tp.id);
      store.setSelectedPartyIds(todayIds);
      setSelectedPartyIds(todayIds);
    }

    if (user.role === 'admin') {
      setActiveTab('clients'); // Opens site with client database directly
    } else {
      setActiveTab('checkin'); // Gatekeeper mode
    }
    refreshData();
  };

  const handleLogout = () => {
    store.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleTogglePartySelection = (partyId: string) => {
    let updated: string[];
    if (selectedPartyIds.includes(partyId)) {
      if (selectedPartyIds.length === 1) {
        // Keep at least one selected
        return;
      }
      updated = selectedPartyIds.filter((id) => id !== partyId);
    } else {
      updated = [...selectedPartyIds, partyId];
    }
    store.setSelectedPartyIds(updated);
    setSelectedPartyIds(updated);
  };

  const handleOpenBlacklistFromClient = (client: Client) => {
    setBlacklistPrefillClient(client);
    setActiveTab('blacklist');
  };

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#08080d]">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        parties={parties}
        selectedPartyIds={selectedPartyIds}
        onTogglePartySelection={handleTogglePartySelection}
        insideCount={insideCount}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'checkin' && (
          <CheckInView
            currentUser={currentUser}
            parties={parties}
            selectedPartyIds={selectedPartyIds}
            onCheckInCompleted={refreshData}
          />
        )}

        {activeTab === 'checkout' && (
          <CheckOutView parties={parties} onCheckOutCompleted={refreshData} />
        )}

        {activeTab === 'clients' && currentUser.role === 'admin' && (
          <ClientsView
            clients={clients}
            onClientsUpdated={refreshData}
            onOpenBlacklistModal={handleOpenBlacklistFromClient}
          />
        )}

        {activeTab === 'parties' && currentUser.role === 'admin' && (
          <PartiesView
            parties={parties}
            selectedPartyIds={selectedPartyIds}
            onTogglePartySelection={handleTogglePartySelection}
            onPartiesUpdated={refreshData}
          />
        )}

        {activeTab === 'blacklist' && currentUser.role === 'admin' && (
          <BlacklistView
            blacklist={blacklist}
            onBlacklistUpdated={refreshData}
            prefillClient={blacklistPrefillClient}
            onClearPrefill={() => setBlacklistPrefillClient(null)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 border-t border-white/5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            FourDisco Nightclub OS • FourDisco 2026 • Sistema de Portaria e Biometria
          </span>
          <span className="text-slate-600">
            MySQL 8.0 Conectado • Pronto para Vercel
          </span>
        </div>
      </footer>
    </div>
  );
}
