'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CameraScanner } from './CameraScanner';
import { BlacklistAlertModal } from './BlacklistAlertModal';
import { OCRResult, formatDocument, cleanDocument } from '@/lib/ocr';
import { store } from '@/lib/storage';
import { sound } from '@/lib/audio';
import { Party, User, BlacklistEntry, DocumentType } from '@/types';
import {
  UserCheck,
  Crown,
  FileText,
  Search,
  Sparkles,
  AlertTriangle,
  History,
  CheckCircle2,
  Trash2,
  ArrowRight,
} from 'lucide-react';

interface CheckInViewProps {
  currentUser: User;
  parties: Party[];
  selectedPartyIds: string[];
  onCheckInCompleted: () => void;
}

export const CheckInView: React.FC<CheckInViewProps> = ({
  currentUser,
  parties,
  selectedPartyIds,
  onCheckInCompleted,
}) => {
  // Active party
  const [activePartyId, setActivePartyId] = useState<string>(
    selectedPartyIds[0] || parties[0]?.id || ''
  );

  // Form State
  const [documentInput, setDocumentInput] = useState<string>('');
  const [documentType, setDocumentType] = useState<DocumentType>('CPF');
  const [nameInput, setNameInput] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [isVip, setIsVip] = useState<boolean>(false);
  const [documentPhoto, setDocumentPhoto] = useState<string | undefined>();
  const [facePhoto, setFacePhoto] = useState<string | undefined>();

  // Feedback State
  const [existingClientId, setExistingClientId] = useState<string | null>(null);
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [isAlreadyInside, setIsAlreadyInside] = useState<boolean>(false);
  const [blacklistAlert, setBlacklistAlert] = useState<BlacklistEntry | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Keep active party synchronized
  useEffect(() => {
    if (selectedPartyIds.length > 0 && !selectedPartyIds.includes(activePartyId)) {
      setActivePartyId(selectedPartyIds[0]);
    }
  }, [selectedPartyIds, activePartyId]);

  // Real-time verification when document changes
  const verifyDocument = (docValue: string) => {
    const clean = cleanDocument(docValue);
    if (clean.length < 5) {
      setIsAlreadyInside(false);
      setExistingClientId(null);
      setTotalVisits(0);
      return;
    }

    // 1. Blacklist check
    const blCheck = store.checkBlacklist(clean);
    if (blCheck.isBlacklisted && blCheck.entry) {
      setBlacklistAlert(blCheck.entry);
    } else {
      setBlacklistAlert(null);
    }

    // 2. Already inside check for current party
    const insideRecord = store.isClientInside(clean, activePartyId);
    if (insideRecord) {
      setIsAlreadyInside(true);
    } else {
      setIsAlreadyInside(false);
    }

    // 3. Client registry lookup (auto-fill previously registered data)
    const existingClient = store.findClientByDocument(clean);
    if (existingClient) {
      setExistingClientId(existingClient.id);
      setNameInput(existingClient.name);
      setDocumentType(existingClient.documentType);
      if (existingClient.phone && !phoneInput) setPhoneInput(existingClient.phone);
      if (existingClient.isVip) setIsVip(true);
      if (existingClient.photoUrl && !facePhoto) setFacePhoto(existingClient.photoUrl);
      if (existingClient.documentPhotoUrl && !documentPhoto)
        setDocumentPhoto(existingClient.documentPhotoUrl);
      setTotalVisits(existingClient.totalVisits || 1);
    } else {
      setExistingClientId(null);
      setTotalVisits(0);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatDocument(val);
    setDocumentInput(formatted);
    verifyDocument(formatted);
  };

  // Callback from OCR camera snapshot
  const handleDocumentCaptured = (photoBase64: string, ocrData?: OCRResult) => {
    setDocumentPhoto(photoBase64);
    if (ocrData) {
      if (ocrData.document) {
        setDocumentInput(ocrData.document);
        verifyDocument(ocrData.document);
      }
      if (ocrData.name && !nameInput) {
        setNameInput(ocrData.name);
      }
      if (ocrData.documentType) {
        setDocumentType(ocrData.documentType);
      }
    }
  };

  const handleFaceCaptured = (photoBase64: string) => {
    setFacePhoto(photoBase64);
  };

  // Reset form
  const resetForm = () => {
    setDocumentInput('');
    setNameInput('');
    setPhoneInput('');
    setNotesInput('');
    setIsVip(false);
    setDocumentPhoto(undefined);
    setFacePhoto(undefined);
    setExistingClientId(null);
    setTotalVisits(0);
    setIsAlreadyInside(false);
    setBlacklistAlert(null);
  };

  // Submit check-in
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameInput.trim()) {
      alert('Por favor, informe o Nome Completo.');
      return;
    }

    if (!documentInput.trim()) {
      alert('Por favor, informe o Documento (CPF ou RG).');
      return;
    }

    // Re-check blacklist
    const blCheck = store.checkBlacklist(documentInput);
    if (blCheck.isBlacklisted && blCheck.entry) {
      setBlacklistAlert(blCheck.entry);
      return;
    }

    // Re-check if inside
    if (store.isClientInside(documentInput, activePartyId)) {
      alert('Atenção: Este cliente já está com Check-in ativo dentro desta festa!');
      return;
    }

    const currentParty = parties.find((p) => p.id === activePartyId) || parties[0];

    // 1. Save or update client in database
    const savedClient = store.saveClient({
      id: existingClientId || `cli-${Date.now()}`,
      name: nameInput.trim(),
      document: documentInput.trim(),
      documentType,
      phone: phoneInput.trim() || undefined,
      photoUrl: facePhoto,
      documentPhotoUrl: documentPhoto,
      notes: notesInput.trim() || undefined,
      isVip,
      totalVisits: (totalVisits || 0) + 1,
      createdAt: new Date().toISOString(),
    });

    // 2. Perform Check-in record
    store.performCheckIn({
      partyId: currentParty?.id || 'party-default',
      partyName: currentParty?.name || 'Festa FourDisco',
      clientId: savedClient.id,
      clientName: savedClient.name,
      clientDocument: savedClient.document,
      clientPhoto: facePhoto,
      documentPhoto,
      operatorName: currentUser.name,
      notes: notesInput || undefined,
    });

    // Sound and celebration
    sound.playSuccess();
    confetti({
      particleCount: isVip ? 100 : 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: isVip ? ['#eab308', '#f59e0b', '#fbbf24'] : ['#8b5cf6', '#ec4899', '#06b6d4'],
    });

    setSuccessMessage(`Check-in de ${savedClient.name} realizado com sucesso!`);
    setTimeout(() => setSuccessMessage(null), 4000);

    onCheckInCompleted();
    resetForm();
  };

  const currentParty = parties.find((p) => p.id === activePartyId) || parties[0];
  const recentCheckins = store.getCheckIns().slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Blacklist Critical Alert Modal */}
      {blacklistAlert && (
        <BlacklistAlertModal
          entry={blacklistAlert}
          onDismiss={() => {
            sound.playClick();
            setBlacklistAlert(null);
            resetForm();
          }}
          onManagerBypass={() => {
            setBlacklistAlert(null);
          }}
        />
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-between text-emerald-200 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-sm">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-400 hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Grid: Camera Scanner & Registration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera Scanner (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-3xl border border-purple-900/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-base text-slate-100">Leitor & Biometria</h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800">
              OCR Ativo
            </span>
          </div>

          <CameraScanner
            onDocumentCaptured={handleDocumentCaptured}
            onFaceCaptured={handleFaceCaptured}
            capturedDocumentPhoto={documentPhoto}
            capturedFacePhoto={facePhoto}
          />

          {/* Captured Photos Thumbnails Preview */}
          {(documentPhoto || facePhoto) && (
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
              {documentPhoto && (
                <div className="relative rounded-2xl overflow-hidden border border-purple-500/40 bg-black/50 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={documentPhoto}
                    alt="Documento"
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/80 px-2 py-1 text-[10px] font-bold text-purple-300 flex items-center justify-between">
                    <span>Foto Documento</span>
                    <button
                      type="button"
                      onClick={() => setDocumentPhoto(undefined)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {facePhoto && (
                <div className="relative rounded-2xl overflow-hidden border border-pink-500/40 bg-black/50 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={facePhoto}
                    alt="Rosto"
                    className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/80 px-2 py-1 text-[10px] font-bold text-pink-300 flex items-center justify-between">
                    <span>Foto Rosto</span>
                    <button
                      type="button"
                      onClick={() => setFacePhoto(undefined)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Check-in Form (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-purple-900/40">
          {/* Header & Party Choice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                Portaria FourDisco
              </span>
              <h2 className="text-xl font-black text-white">Dados para Entrada</h2>
            </div>

            {/* Select Party */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Festa:</span>
              <select
                value={activePartyId}
                onChange={(e) => setActivePartyId(e.target.value)}
                className="bg-[#191830] text-slate-100 text-xs font-bold rounded-xl px-3 py-2 border border-purple-600/40 focus:outline-none focus:border-purple-400"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Already Inside Warning */}
          {isAlreadyInside && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex items-center gap-3 text-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">Cliente já está dentro da boate nesta festa!</span>
                <p className="text-[11px] text-amber-300/80">
                  Verifique a aba de Check-out caso a pessoa deseje sair ou seja duplicidade de cadastro.
                </p>
              </div>
            </div>
          )}

          {/* Existing Patron Found Badge */}
          {existingClientId && (
            <div className="mb-4 p-3 rounded-2xl bg-purple-950/50 border border-purple-500/40 flex items-center justify-between text-purple-200">
              <div className="flex items-center gap-2 text-xs">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Cliente já cadastrado! Visitas anteriores:{' '}
                  <strong className="text-white font-mono">{totalVisits}</strong>
                </span>
              </div>
              {isVip && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> VIP
                </span>
              )}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleCheckInSubmit} className="space-y-4">
            {/* Document Field & Document Type */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Documento (CPF ou RG) *</span>
                  <span className="text-[11px] text-purple-400 font-normal">
                    Preenche automático pela foto
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00 ou RG"
                    value={documentInput}
                    onChange={handleDocumentChange}
                    className="w-full bg-[#121124] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-mono tracking-wide"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Tipo</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  className="w-full bg-[#121124] border border-white/10 rounded-2xl px-3.5 py-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="CPF">CPF</option>
                  <option value="RG">RG</option>
                  <option value="CNH">CNH</option>
                  <option value="PASSAPORTE">Passaporte</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: Gabriel Moreira Silva"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-[#121124] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Phone & VIP Checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Telefone / WhatsApp (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full bg-[#121124] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex items-center sm:pt-6">
                <label className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 cursor-pointer w-full transition-all">
                  <input
                    type="checkbox"
                    checked={isVip}
                    onChange={(e) => setIsVip(e.target.checked)}
                    className="w-5 h-5 rounded-lg accent-amber-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5" /> Cliente VIP / Camarote
                    </span>
                    <p className="text-[10px] text-slate-400">Acesso prioritário à área VIP</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Observations / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Observações / Pulseira (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Pulseira Vermelha, Convidado do DJ, Camarote 4"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full bg-[#121124] border border-white/10 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Submit & Clear Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isAlreadyInside}
                className={`flex-1 py-4 px-6 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-xl ${
                  isAlreadyInside
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : isVip
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black shadow-amber-900/50 hover:brightness-110 active:scale-[0.98]'
                    : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white shadow-purple-900/60 hover:brightness-110 active:scale-[0.98]'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>CONFIRMAR CHECK-IN NA BOATE</span>
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="py-4 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/10 transition-colors"
              >
                Limpar Campos
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent Activity Bar */}
      <div className="glass-panel p-5 rounded-3xl border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Últimos Check-ins Registrados
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Total recente: {recentCheckins.length}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {recentCheckins.map((chk) => (
            <div
              key={chk.id}
              className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/40 flex items-center justify-center font-bold text-xs text-purple-300 shrink-0 overflow-hidden">
                {chk.clientPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={chk.clientPhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  chk.clientName.charAt(0)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{chk.clientName}</div>
                <div className="text-[10px] text-slate-400 font-mono">{chk.clientDocument}</div>
                <div className="text-[9px] text-emerald-400 font-semibold">
                  {new Date(chk.checkinTime).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
