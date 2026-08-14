'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function OnboardingContent() {
  const searchParams = useSearchParams();
  const psychologistId = searchParams.get('psychologist_id');

  const [step, setStep] = useState<'upload' | 'confirm_and_sign' | 'success'>('upload');
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [hasSigned, setHasSigned] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Ajustăm rezoluția internă a canvas-ului pentru afișare corectă pe mobil
  useEffect(() => {
    if (step === 'confirm_and_sign' && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#0f172a';
      }
    }
  }, [step]);

  // 1. Upload Poză Buletin
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!psychologistId) {
      alert('Atenție: Linkul folosit nu conține ID-ul psihologului. Te rugăm să soliciți un link valid.');
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    if (psychologistId) {
      formData.append('psychologist_id', psychologistId);
    }

    try {
      const res = await fetch('/api/extract-id', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Eroare la procesarea buletinului.');
        setLoading(false);
        return;
      }

      setClientData(data.extractedData || data);
      setClientId(data.client?.id || 'temp-' + Date.now());
      setStep('confirm_and_sign');
    } catch (err) {
      console.error(err);
      alert('Eroare la conectarea cu serverul.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Logică Desenare Semnătură pe Mobil / Desktop
  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    setHasSigned(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSigned(false);
    }
  };

  // 3. Salvare Semnătură & Consimțământ în Supabase
  const handleSaveSignature = async () => {
    if (!hasSigned) {
      alert('Te rugăm să semnezi în casetă înainte de a continua.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !clientId) return;

    const signatureBase64 = canvas.toDataURL('image/png');

    setLoading(true);
    try {
      const { error } = await supabase.from('documents').insert([
        {
          client_id: clientId,
          type: 'consent_pre',
          country: clientData?.country_code || 'RO',
          status: 'signed',
          signature_data: signatureBase64,
          signed_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        alert('Eroare la salvarea semnăturii: ' + error.message);
      } else {
        setStep('success');
      }
    } catch (err) {
      console.error(err);
      alert('Eroare la salvarea documentului.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-1">SesFlow</h1>
        <p className="text-xs text-slate-500 text-center mb-6 font-medium">Formular Onboarding Pacient</p>

        {/* PASUL 1: UPLOAD BULETIN */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center bg-indigo-50/30">
              <p className="text-slate-800 font-semibold mb-1">Fotografiază sau încarcă C.I.</p>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Datele vor fi prelucrate securizat prin AI pentru completarea automată a consimțământului.
              </p>

              <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold py-3.5 px-6 rounded-xl transition-all inline-block shadow-md w-full text-center">
                {loading ? 'Se analizează AI...' : '📸 Adaugă Poză Buletin'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </label>
            </div>
          </div>
        )}

        {/* PASUL 2: CONFIRMARE DATE & SEMNARE */}
        {step === 'confirm_and_sign' && clientData && (
          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl text-xs border border-slate-200 space-y-1.5">
              <p className="font-bold text-slate-800 border-b pb-1 mb-2 text-sm">Date Identificate:</p>
              <p><span className="text-slate-500">Nume:</span> <strong className="text-slate-800">{clientData.last_name} {clientData.first_name}</strong></p>
              <p><span className="text-slate-500">CNP / ID:</span> <strong className="text-slate-800">{clientData.national_id}</strong></p>
              <p><span className="text-slate-500">Serie/Nr:</span> <strong className="text-slate-800">{clientData.id_card_series}</strong></p>
              <p><span className="text-slate-500">Adresă:</span> <strong className="text-slate-800">{clientData.address || '-'}</strong></p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold text-slate-800 mb-1 text-sm">Consimțământ Informat</h3>
              <div className="h-28 overflow-y-auto text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed mb-3">
                Subsemnatul/a confirm că am fost informat/ă cu privire la condițiile de desfășurare a ședințelor de psihologie/psihoterapie, confidențialitatea datelor conform normelor în vigoare și acordul privind prelucrarea datelor cu caracter personal (GDPR).
              </div>

              <p className="text-xs font-semibold text-slate-700 mb-1.5">Semnează cu degetul sau mouse-ul mai jos:</p>
              <div className="border-2 border-slate-300 rounded-xl bg-white touch-none flex justify-center overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair w-full h-36 bg-slate-50/50"
                />
              </div>

              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={clearCanvas}
                  type="button"
                  className="text-xs text-rose-600 hover:underline font-medium"
                >
                  Șterge semnătura
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveSignature}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-sm"
            >
              {loading ? 'Se salvează...' : 'Confirmă și Semnează'}
            </button>
          </div>
        )}

        {/* PASUL 3: SUCCES */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-sm">
              ✓
            </div>
            <h2 className="text-lg font-bold text-slate-800">Proces Finalizat!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consimțământul informat a fost înregistrat cu succes. Psihologul tău a fost notificat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientOnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Se încarcă...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}