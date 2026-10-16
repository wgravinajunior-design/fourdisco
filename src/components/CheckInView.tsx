'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { BlacklistAlertModal } from './BlacklistAlertModal';
import { OCRResult, formatDocument, cleanDocument, recognizeDocumentPhoto } from '@/lib/ocr';
import { store } from '@/lib/storage';
import { sound } from '@/lib/audio';
import { Party, User, BlacklistEntry } from '@/types';
import {
  Camera,
  Check,
  Crown,
  Search,
  Sparkles,
  AlertTriangle,
  Zap,
  RotateCcw,
  Upload,
  UserCheck,
  CheckCircle2,
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
  const [activePartyId, setActivePartyId] = useState<string>(
    selectedPartyIds[0] || parties[0]?.id || ''
  );

  // Form Fields
  const [documentInput, setDocumentInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [isVip, setIsVip] = useState<boolean>(false);
  const [documentPhoto, setDocumentPhoto] = useState<string | null>(null);

  // Status & Feedback
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [isAlreadyInside, setIsAlreadyInside] = useState<boolean>(false);
  const [blacklistAlert, setBlacklistAlert] = useState<BlacklistEntry | null>(null);
  const [lastCheckinName, setLastCheckinName] = useState<string | null>(null);

  // Camera references
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  // Keep party synced
  useEffect(() => {
    if (selectedPartyIds.length > 0 && !selectedPartyIds.includes(activePartyId)) {
      setActivePartyId(selectedPartyIds[0]);
    }
  }, [selectedPartyIds, activePartyId]);

  // Start live webcam
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
        }
      } catch (err) {
        console.warn('Câmera indisponível:', err);
        setStreamActive(false);
      }
    }
    initCamera();
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraFacing]);

  // Real-time verification when document is entered
  const verifyDocument = (docValue: string) => {
    const clean = cleanDocument(docValue);
    if (clean.length < 5) {
      setIsAlreadyInside(false);
      return;
    }

    // 1. Blacklist check
    const bl = store.checkBlacklist(clean);
    if (bl.isBlacklisted && bl.entry) {
      setBlacklistAlert(bl.entry);
      sound.playAlertBuzzer();
      return;
    } else {
      setBlacklistAlert(null);
    }

    // 2. Already inside
    const inside = store.isClientInside(clean, activePartyId);
    setIsAlreadyInside(!!inside);

    // 3. Existing client auto-fill
    const existing = store.findClientByDocument(clean);
    if (existing) {
      setNameInput(existing.name);
      if (existing.isVip) setIsVip(true);
      if (existing.documentPhotoUrl && !documentPhoto) {
        setDocumentPhoto(existing.documentPhotoUrl);
      }
    }
  };

  const handleDocumentChange = (val: string) => {
    const formatted = formatDocument(val);
    setDocumentInput(formatted);
    verifyDocument(formatted);
  };

  // Instant Camera Shutter -> Auto OCR -> Auto Fill
  const takeSnapshotAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    sound.playClick();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setDocumentPhoto(dataUrl);

    setIsProcessing(true);
    setOcrStatusText('Lendo documento...');

    try {
      const ocrData = await recognizeDocumentPhoto(dataUrl, (pct) => {
        setOcrStatusText(`Lendo dados (${pct}%)...`);
      });

      if (ocrData.document) {
        setDocumentInput(ocrData.document);
        verifyDocument(ocrData.document);
      }
      if (ocrData.name) {
        setNameInput(ocrData.name);
      }
    } catch {
      // ignore error
    } finally {
      setIsProcessing(false);
      setOcrStatusText('');
    }
  };

  // Quick 1-click test simulation
  const applyQuickDemo = (type: 'valid' | 'blacklisted' | 'vip') => {
    sound.playClick();
    if (type === 'valid') {
      const doc = '234.567.890-12';
      setDocumentInput(doc);
      setNameInput('Camila Mendonça Rocha');
      setIsVip(false);
      verifyDocument(doc);
    } else if (type === 'vip') {
      const doc = '123.456.789-00';
      setDocumentInput(doc);
      setNameInput('Rodrigo Silva Alcantara');
      setIsVip(true);
      verifyDocument(doc);
    } else {
      const doc = '111.222.333-44';
      setDocumentInput(doc);
      setNameInput('Marcos Vinicius Santos');
      setIsVip(false);
      verifyDocument(doc);
    }
  };

  // Submit Fast Check-in
  const handleFastCheckIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!documentInput.trim()) {
      alert('Informe o documento (CPF ou RG).');
      docInputRef.current?.focus();
      return;
    }

    if (!nameInput.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }

    // Verify blacklist
    const bl = store.checkBlacklist(documentInput);
    if (bl.isBlacklisted && bl.entry) {
      setBlacklistAlert(bl.entry);
      sound.playAlertBuzzer();
      return;
    }

    // Verify inside
    if (store.isClientInside(documentInput, activePartyId)) {
      alert('Atenção: Cliente já está dentro da festa!');
      return;
    }

    const currentParty = parties.find((p) => p.id === activePartyId) || parties[0];

    // Save client
    const saved = store.saveClient({
      id: `cli-${Date.now()}`,
      name: nameInput.trim(),
      document: documentInput.trim(),
      documentType: 'CPF',
      isVip,
      documentPhotoUrl: documentPhoto || undefined,
      totalVisits: 1,
      createdAt: new Date().toISOString(),
    });

    // Register check-in
    store.performCheckIn({
      partyId: currentParty?.id || 'party-1',
      partyName: currentParty?.name || 'Festa FourDisco',
      clientId: saved.id,
      clientName: saved.name,
      clientDocument: saved.document,
      documentPhoto: documentPhoto || undefined,
      operatorName: currentUser.name,
    });

    // Sound & Confetti
    sound.playSuccess();
    confetti({
      particleCount: isVip ? 80 : 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: isVip ? ['#eab308', '#fbbf24'] : ['#8b5cf6', '#ec4899', '#10b981'],
    });

    setLastCheckinName(saved.name);
    setTimeout(() => setLastCheckinName(null), 3000);

    // Fast reset for next patron
    setDocumentInput('');
    setNameInput('');
    setIsVip(false);
    setDocumentPhoto(null);
    setIsAlreadyInside(false);
    onCheckInCompleted();

    // Auto-focus document input for next person
    setTimeout(() => {
      docInputRef.current?.focus();
    }, 100);
  };

  const currentParty = parties.find((p) => p.id === activePartyId) || parties[0];
  const insideCount = store.getActiveInside(activePartyId).length;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Blacklist Critical Modal */}
      {blacklistAlert && (
        <BlacklistAlertModal
          entry={blacklistAlert}
          onDismiss={() => {
            sound.playClick();
            setBlacklistAlert(null);
            setDocumentInput('');
            setNameInput('');
            setDocumentPhoto(null);
            docInputRef.current?.focus();
          }}
          onManagerBypass={() => {
            setBlacklistAlert(null);
          }}
        />
      )}

      {/* Top Quick Status Bar */}
      <div className="glass-panel px-5 py-3 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#111022]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold block">
              PORTARIA ATIVA
            </span>
            <span className="text-sm font-extrabold text-white">
              {currentParty?.name || 'FourDisco Club'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-purple-950/60 border border-purple-500/30 text-xs text-purple-200">
            Dentro agora: <strong className="text-white font-mono text-sm">{insideCount}</strong>
          </div>

          {parties.length > 1 && (
            <select
              value={activePartyId}
              onChange={(e) => setActivePartyId(e.target.value)}
              className="bg-black/60 text-xs font-bold text-slate-200 rounded-xl px-2.5 py-1.5 border border-white/10"
            >
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {lastCheckinName && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 flex items-center justify-between text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
            <span className="text-sm font-black">
              CHECK-IN CONFIRMADO: {lastCheckinName} • PODE ENTRAR!
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-300">Próximo da fila...</span>
        </div>
      )}

      {/* Already Inside Warning */}
      {isAlreadyInside && (
        <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500 flex items-center gap-2.5 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">
            ALERTA: Documento já registrado dentro da boate nesta festa!
          </span>
        </div>
      )}

      {/* Main Fast Gate Interface: 2 Balanced Columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: Live Document Scanner (5 cols) */}
        <div className="md:col-span-5 glass-panel p-4 rounded-3xl border border-purple-900/40 flex flex-col justify-between bg-[#0e0d1c]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-pink-400" /> Câmera / Leitor Documento
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setCameraFacing((p) => (p === 'user' ? 'environment' : 'user'))
                }
                title="Girar Câmera"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Carregar Foto"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (ev) => {
                    const dataUrl = ev.target?.result as string;
                    setDocumentPhoto(dataUrl);
                    setIsProcessing(true);
                    setOcrStatusText('Lendo foto...');
                    try {
                      const res = await recognizeDocumentPhoto(dataUrl);
                      if (res.document) {
                        setDocumentInput(res.document);
                        verifyDocument(res.document);
                      }
                      if (res.name) setNameInput(res.name);
                    } finally {
                      setIsProcessing(false);
                      setOcrStatusText('');
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </div>

          {/* Camera Viewfinder */}
          <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-purple-500/30 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${streamActive ? 'opacity-100' : 'opacity-20'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Document Guide Frame */}
            {streamActive && (
              <div className="absolute inset-3 border-2 border-dashed border-purple-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-[10px] font-bold text-purple-200 bg-black/60 px-2 py-0.5 rounded-full">
                  Enquadre o RG ou CNH
                </span>
                {isProcessing && (
                  <div className="absolute inset-x-2 h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-scan-laser" />
                )}
              </div>
            )}

            {!streamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-black/80">
                <Camera className="w-8 h-8 text-slate-500 mb-1" />
                <p className="text-[11px] text-slate-300">Câmera em espera</p>
                <p className="text-[10px] text-slate-500">Use os botões de simulação abaixo</p>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-x-2 bottom-2 bg-black/90 p-2 rounded-xl text-center border border-cyan-500">
                <span className="text-xs font-bold text-cyan-300">{ocrStatusText}</span>
              </div>
            )}
          </div>

          {/* Shutter Button */}
          <button
            type="button"
            onClick={takeSnapshotAndProcess}
            disabled={isProcessing}
            className="mt-3 w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>TIRAR FOTO DO DOCUMENTO (OCR)</span>
          </button>

          {/* 1-Click Fast Simulators */}
          <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Simular:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => applyQuickDemo('valid')}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 text-[11px] font-bold border border-emerald-800/40"
              >
                CNH Normal
              </button>
              <button
                type="button"
                onClick={() => applyQuickDemo('vip')}
                className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900 text-amber-300 text-[11px] font-bold border border-amber-800/40"
              >
                VIP
              </button>
              <button
                type="button"
                onClick={() => applyQuickDemo('blacklisted')}
                className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 text-[11px] font-bold border border-red-800/40"
              >
                Barrado
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Direct Fast Entry Form (7 cols) */}
        <div className="md:col-span-7 glass-panel p-5 rounded-3xl border border-purple-900/40 flex flex-col justify-between bg-[#110f22]">
          <form onSubmit={handleFastCheckIn} className="space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                ENTRADA RÁPIDA (PORTARIA)
              </span>
              <h3 className="text-xl font-black text-white leading-tight">
                Identificação do Cliente
              </h3>
            </div>

            {/* Document Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Documento (CPF ou RG) *
              </label>
              <div className="relative">
                <input
                  ref={docInputRef}
                  type="text"
                  required
                  autoFocus
                  placeholder="000.000.000-00 ou RG"
                  value={documentInput}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  className="w-full bg-[#18162e] border-2 border-purple-500/40 focus:border-purple-400 rounded-2xl px-4 py-3.5 text-lg font-mono font-bold text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <Search className="w-5 h-5 text-slate-500 absolute right-4 top-4" />
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Nome do cliente"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-[#18162e] border border-white/10 focus:border-purple-400 rounded-2xl px-4 py-3 text-base font-bold text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Fast VIP Toggle Card */}
            <div
              onClick={() => setIsVip(!isVip)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                isVip
                  ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    isVip ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">CLIENTE VIP / CAMAROTE</div>
                  <div className="text-[10px] text-slate-400">
                    {isVip ? 'Pulseira e acesso VIP concedidos' : 'Clique para marcar como VIP'}
                  </div>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center border font-bold ${
                  isVip ? 'bg-amber-500 border-amber-400 text-black' : 'border-slate-600'
                }`}
              >
                {isVip && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </div>

            {/* Document Thumbnail Preview if captured */}
            {documentPhoto && (
              <div className="flex items-center gap-3 p-2 rounded-xl bg-black/40 border border-emerald-500/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={documentPhoto}
                  alt="Doc"
                  className="w-12 h-10 object-cover rounded-lg border border-emerald-500/60"
                />
                <span className="text-[11px] font-bold text-emerald-300">
                  Foto do documento arquivada com sucesso
                </span>
              </div>
            )}

            {/* Big Action Button (ENTER) */}
            <button
              type="submit"
              disabled={isAlreadyInside}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base tracking-wider flex items-center justify-center gap-2.5 shadow-2xl transition-all active:scale-[0.98] ${
                isAlreadyInside
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : isVip
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black shadow-amber-950/60 hover:brightness-110'
                  : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-slate-950 shadow-emerald-950/60 hover:brightness-110'
              }`}
            >
              <Zap className="w-6 h-6 fill-current" />
              <span>CONFIRMAR ENTRADA (ENTER)</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
