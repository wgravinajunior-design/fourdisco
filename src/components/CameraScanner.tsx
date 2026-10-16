'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Upload, FileText, UserCheck, AlertCircle, Sparkles, Check } from 'lucide-react';
import { recognizeDocumentPhoto, OCRResult } from '@/lib/ocr';
import { sound } from '@/lib/audio';

interface CameraScannerProps {
  onDocumentCaptured: (photoBase64: string, ocrData?: OCRResult) => void;
  onFaceCaptured: (photoBase64: string) => void;
  capturedDocumentPhoto?: string;
  capturedFacePhoto?: string;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onDocumentCaptured,
  onFaceCaptured,
  capturedDocumentPhoto,
  capturedFacePhoto,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'document' | 'face'>('document');
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState<boolean>(false);
  const [ocrStatus, setOcrStatus] = useState<string>('');
  const [flashActive, setFlashActive] = useState<boolean>(false);

  // Start live camera stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err) {
      console.warn('Erro ao acessar câmera:', err);
      setCameraError(
        'Câmera não detectada ou permissão negada. Você pode usar upload de foto ou botões de teste rápido.'
      );
      setStreamActive(false);
    }
  }, [cameraFacing]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Flip camera
  const toggleFacing = () => {
    setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture frame
  const captureSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    sound.playClick();
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    if (mode === 'document') {
      setIsProcessingOCR(true);
      setOcrStatus('Processando imagem do documento...');
      
      try {
        const ocrData = await recognizeDocumentPhoto(dataUrl, (pct, status) => {
          setOcrStatus(`${status} (${pct}%)`);
        });
        onDocumentCaptured(dataUrl, ocrData);
      } catch (e) {
        console.error(e);
        onDocumentCaptured(dataUrl);
      } finally {
        setIsProcessingOCR(false);
        setOcrStatus('');
      }
    } else {
      onFaceCaptured(dataUrl);
    }
  };

  // Handle uploaded file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (mode === 'document') {
        setIsProcessingOCR(true);
        setOcrStatus('Lendo dados do documento enviado...');
        try {
          const ocrData = await recognizeDocumentPhoto(dataUrl, (pct, status) => {
            setOcrStatus(`${status} (${pct}%)`);
          });
          onDocumentCaptured(dataUrl, ocrData);
        } catch {
          onDocumentCaptured(dataUrl);
        } finally {
          setIsProcessingOCR(false);
          setOcrStatus('');
        }
      } else {
        onFaceCaptured(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to load test documents instantly
  const loadMockDocument = (type: 'cnh' | 'rg' | 'blacklisted') => {
    sound.playClick();
    let mockData: OCRResult;
    let canvasColor = '#1e1b4b';

    if (type === 'cnh') {
      mockData = {
        name: 'Camila Mendonça Rocha',
        document: '234.567.890-12',
        documentType: 'CPF',
        birthDate: '1998-05-14',
        text: 'REPUBLICA FEDERATIVA DO BRASIL CNH NOME: CAMILA MENDONÇA ROCHA CPF: 234.567.890-12',
      };
      canvasColor = '#064e3b';
    } else if (type === 'rg') {
      mockData = {
        name: 'Thiago Henrique Pires',
        document: '32.145.879-X',
        documentType: 'RG',
        birthDate: '2001-08-22',
        text: 'REGISTRO GERAL SECRETARIA DE SEGURANCA PUBLICA NOME: THIAGO HENRIQUE PIRES RG: 32.145.879-X',
      };
      canvasColor = '#1e3a8a';
    } else {
      mockData = {
        name: 'Marcos Vinicius Santos (Exemplo Barrado)',
        document: '111.222.333-44',
        documentType: 'CPF',
        birthDate: '1995-12-04',
        text: 'REPUBLICA FEDERATIVA DO BRASIL CPF NOME: MARCOS VINICIUS SANTOS CPF: 111.222.333-44',
      };
      canvasColor = '#881337';
    }

    // Generate mock card image
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 380;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = canvasColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('DOCUMENTO OFICIAL DE IDENTIFICAÇÃO', 40, 60);

      ctx.font = '16px monospace';
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText(`NOME: ${mockData.name?.toUpperCase()}`, 40, 130);
      ctx.fillText(`DOC: ${mockData.document} (${mockData.documentType})`, 40, 180);
      ctx.fillText(`DATA NASC: ${mockData.birthDate}`, 40, 230);
      ctx.fillText('FOURDISCO GATE SCANNER - VERIFICADO', 40, 310);

      const dataUrl = canvas.toDataURL('image/jpeg');
      onDocumentCaptured(dataUrl, mockData);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Mode Selector */}
      <div className="flex items-center justify-between bg-[#131222] p-1.5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMode('document');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'document'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Foto do Documento (OCR)</span>
            {capturedDocumentPhoto && <Check className="w-3.5 h-3.5 text-emerald-300 ml-1" />}
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setMode('face');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'face'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-900/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>2. Foto do Rosto</span>
            {capturedFacePhoto && <Check className="w-3.5 h-3.5 text-emerald-300 ml-1" />}
          </button>
        </div>

        <div className="flex items-center gap-2 pr-1">
          <button
            type="button"
            onClick={toggleFacing}
            title="Alternar Câmera (Frontal / Traseira)"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload de Foto"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 transition-colors"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Viewfinder Screen */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black rounded-3xl overflow-hidden border-2 border-purple-900/40 shadow-2xl flex items-center justify-center group">
        {/* Flash Effect */}
        {flashActive && <div className="absolute inset-0 bg-white z-30 transition-opacity" />}

        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity ${
            streamActive ? 'opacity-100' : 'opacity-20'
          }`}
        />

        {/* Hidden Canvas for capture processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera not available banner */}
        {(!streamActive || cameraError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/85 z-10">
            <Camera className="w-12 h-12 text-slate-500 mb-2 animate-bounce" />
            <p className="text-sm font-semibold text-slate-300 mb-1">Câmera em espera</p>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Clique em &quot;Iniciar Câmera&quot;, use os botões de simulação abaixo ou envie uma foto do dispositivo.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all"
              >
                Tentar Ativar Câmera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Fazer Upload
              </button>
            </div>
          </div>
        )}

        {/* Document Guide Frame Overlay */}
        {mode === 'document' && streamActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 z-10">
            <div className="w-[85%] h-[75%] border-2 border-purple-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-purple-300 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-purple-300 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-purple-300 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-purple-300 rounded-br-lg" />

              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-semibold text-purple-200">
                Posicione o RG ou CNH neste retângulo
              </div>

              {/* Animated Laser Scanning Line */}
              {isProcessingOCR ? (
                <div className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan-laser" />
              ) : (
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent animate-scan-laser" />
              )}
            </div>
          </div>
        )}

        {/* Face Guide Frame Overlay */}
        {mode === 'face' && streamActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 z-10">
            <div className="w-56 h-72 border-2 border-dashed border-pink-400/80 rounded-full relative shadow-[0_0_20px_rgba(236,72,153,0.3)] flex items-center justify-center">
              <div className="absolute top-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-semibold text-pink-200">
                Alinhe o rosto no oval
              </div>
            </div>
          </div>
        )}

        {/* OCR Loading Banner */}
        {isProcessingOCR && (
          <div className="absolute inset-x-4 bottom-4 glass-panel-neon bg-[#120f26]/95 p-3 rounded-2xl flex items-center gap-3 z-20 border border-cyan-500/50">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs">
              <p className="font-bold text-cyan-300">Lendo Documento (OCR Inteligente)</p>
              <p className="text-[11px] text-slate-300">{ocrStatus}</p>
            </div>
          </div>
        )}

        {/* Shutter Button (Overlaid on bottom) */}
        {streamActive && (
          <div className="absolute bottom-5 inset-x-0 flex items-center justify-center z-20 pointer-events-auto">
            <button
              type="button"
              onClick={captureSnapshot}
              disabled={isProcessingOCR}
              className={`group/btn relative flex items-center justify-center w-16 h-16 rounded-full p-1 transition-transform active:scale-95 shadow-xl ${
                mode === 'document'
                  ? 'bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400 shadow-purple-900/60'
                  : 'bg-gradient-to-tr from-pink-600 to-rose-500 shadow-pink-900/60'
              }`}
            >
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <Camera className="w-7 h-7 text-slate-900 group-hover/btn:scale-110 transition-transform" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Instant Demo Simulation Buttons */}
      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Testes Rápidos de Leitura (1-Clique)
          </span>
          <span className="text-[10px] text-slate-400">Sem precisar da câmera física</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => loadMockDocument('cnh')}
            className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-200 text-xs font-semibold text-left transition-all"
          >
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <div>Simular CNH (Válido)</div>
              <div className="text-[10px] text-emerald-400/80 font-normal">Camila Mendonça</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => loadMockDocument('rg')}
            className="flex items-center gap-2 p-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/40 text-blue-200 text-xs font-semibold text-left transition-all"
          >
            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="truncate">
              <div>Simular RG (Válido)</div>
              <div className="text-[10px] text-blue-400/80 font-normal">Thiago Henrique</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => loadMockDocument('blacklisted')}
            className="flex items-center gap-2 p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-200 text-xs font-semibold text-left transition-all"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="truncate">
              <div>Simular BlackList Ativa</div>
              <div className="text-[10px] text-rose-400/80 font-normal">Identificação Blacklist</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
