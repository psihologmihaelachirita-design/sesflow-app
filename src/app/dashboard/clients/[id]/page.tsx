'use client';

import { useState, useEffect, use } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;

  const [client, setClient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Stare pentru Ședință Nouă
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [useAI, setUseAI] = useState(false); // OPTIONAL: implicit pe Manual

  // Formular Ședință
  const [sessionData, setSessionData] = useState({
    session_date: new Date().toISOString().split('T')[0],
    raw_notes: '',
    structured_soap: {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    },
  });

  const [savingSession, setSavingSession] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    async function loadClientData() {
      if (!clientId) return;

      // 1. Încărcăm datele clientului
      const { data: clientData, error: clientErr } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientData) setClient(clientData);

      // 2. Încărcăm documentele (Consimțământ etc.)
      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId);

      if (docsData) setDocuments(docsData);

      // 3. Încărcăm ședințele anterioare
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('client_id', clientId)
        .order('session_date', { ascending: false });

      if (sessionsData) setSessions(sessionsData);

      setLoading(false);
    }

    loadClientData();
  }, [clientId]);

  // Generare Note AI (Doar la cererea expresă a psihologului)
  const handleGenerateAI = async () => {
    if (!sessionData.raw_notes.trim()) {
      alert('Introdu câteva notițe brute sau idei din ședință pentru a fi structurate de AI.');
      return;
    }

    setGeneratingAI(true);
    try {
      const res = await fetch('/api/ai-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: sessionData.raw_notes }),
      });

      const data = await res.json();
      if (res.ok && data.soap) {
        setSessionData((prev) => ({
          ...prev,
          structured_soap: data.soap,
        }));
      } else {
        alert(data.error || 'Eroare la generarea structurii AI.');
      }
    } catch (err) {
      console.error(err);
      alert('Eroare la conectarea cu modulul AI.');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Salvare Ședință în Supabase
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSession(true);

    try {
      const { data: newSession, error } = await supabase
        .from('sessions')
        .insert([
          {
            client_id: clientId,
            session_date: sessionData.session_date,
            notes_raw: sessionData.raw_notes,
            notes_soap: sessionData.structured_soap,
          },
        ])
        .select()
        .single();

      if (error) {
        alert('Eroare la salvarea ședinței: ' + error.message);
      } else {
        setSessions([newSession, ...sessions]);
        setShowNewSessionModal(false);
        // Resetare formular
        setSessionData({
          session_date: new Date().toISOString().split('T')[0],
          raw_notes: '',
          structured_soap: { subjective: '', objective: '', assessment: '', plan: '' },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSession(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Se încarcă fișa pacientului...</div>;
  }

  if (!client) {
    return <div className="p-10 text-center text-rose-500">Pacientul nu a fost găsit.</div>;
  }

  const consentDoc = documents.find((d) => d.type === 'consent_pre' && d.status === 'signed');

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* INAPOI & HEADER */}
        <div className="flex justify-between items-center">
          <Link href="/dashboard/clients" className="text-xs text-indigo-600 font-semibold hover:underline">
            ← Înapoi la Lista Pacienți
          </Link>
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            + Adaugă Ședință Nouă
          </button>
        </div>

        {/* PROFIL PACIENT */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">
              {client.last_name} {client.first_name}
            </h1>
            <p className="text-xs text-slate-500">
              CNP / PESEL: <strong className="text-slate-700">{client.national_id || '-'}</strong> | Serie: <strong className="text-slate-700">{client.id_card_series || '-'}</strong>
            </p>
            <p className="text-xs text-slate-500">
              Adresă: <strong className="text-slate-700">{client.address || '-'}</strong>
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
            <p className="text-xs text-slate-500 mb-1">Status Consimțământ:</p>
            {consentDoc ? (
              <div>
                <span className="inline-block bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-semibold mb-1">
                  ✓ Semnat Digital
                </span>
                <p className="text-[10px] text-slate-400">
                  Data: {new Date(consentDoc.signed_at).toLocaleDateString('ro-RO')}
                </p>
              </div>
            ) : (
              <span className="inline-block bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                Incomplet / În așteptare
              </span>
            )}
          </div>
        </div>

        {/* ISTORIC ȘEDINȚE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="font-bold text-slate-800 text-base">Istoric Ședințe & Note Clinice</h2>

          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Nu există nicio ședință înregistrată pentru acest pacient.</p>
          ) : (
            <div className="space-y-4 divide-y divide-slate-100">
              {sessions.map((session) => (
                <div key={session.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">
                      Ședință din {new Date(session.session_date).toLocaleDateString('ro-RO')}
                    </span>
                  </div>

                  {/* Afișare Note Clinice (SOAP sau Raw) */}
                  {session.notes_soap?.subjective ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs">
                      <div>
                        <strong className="text-indigo-700 block mb-0.5">Subiectiv (S):</strong>
                        <p className="text-slate-600">{session.notes_soap.subjective}</p>
                      </div>
                      <div>
                        <strong className="text-indigo-700 block mb-0.5">Obiectiv (O):</strong>
                        <p className="text-slate-600">{session.notes_soap.objective}</p>
                      </div>
                      <div>
                        <strong className="text-indigo-700 block mb-0.5">Evaluare (A):</strong>
                        <p className="text-slate-600">{session.notes_soap.assessment}</p>
                      </div>
                      <div>
                        <strong className="text-indigo-700 block mb-0.5">Plan (P):</strong>
                        <p className="text-slate-600">{session.notes_soap.plan}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                      {session.notes_raw || 'Fără note scrise.'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MODAL ADAUGARE ȘEDINȚĂ */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-5 border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Înregistrare Ședință Nouă</h3>
              <button onClick={() => setShowNewSessionModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>

            {/* TOGGLE OPȚIONAL AI */}
            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-900">Asistență AI pentru Structurare SOAP</p>
                <p className="text-[11px] text-indigo-600">Opțional. Poți scrie notele complet manual dacă dorești.</p>
              </div>
              <button
                type="button"
                onClick={() => setUseAI(!useAI)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                  useAI ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {useAI ? '✓ AI Activ' : 'Inactiv (Manual)'}
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Data Ședinței</label>
                <input
                  type="date"
                  value={sessionData.session_date}
                  onChange={(e) => setSessionData({ ...sessionData, session_date: e.target.value })}
                  className="w-full border rounded-lg p-2.5 bg-slate-50"
                  required
                />
              </div>

              {/* DACA AI-UL ESTE INACTIV (COMPLET MANUAL) */}
              {!useAI ? (
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Note Clinice (Scriere Liberă)</label>
                    <textarea
                      rows={6}
                      value={sessionData.raw_notes}
                      onChange={(e) => setSessionData({ ...sessionData, raw_notes: e.target.value })}
                      placeholder="Scrie aici notele tale clinice din timpul sau de după ședință..."
                      className="w-full border rounded-lg p-3 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              ) : (
                /* DACA AI-UL ESTE ACTIVAT OPȚIONAL */
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Idei / Note Brute din Ședință</label>
                    <textarea
                      rows={3}
                      value={sessionData.raw_notes}
                      onChange={(e) => setSessionData({ ...sessionData, raw_notes: e.target.value })}
                      placeholder="Ex: Pacientul raportează anxietate crescută la locul de muncă. A aplicat tehnica de respirație..."
                      className="w-full border rounded-lg p-3 bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={generatingAI}
                      className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition"
                    >
                      {generatingAI ? 'Se structurează AI...' : '✨ Structurează automat în format SOAP'}
                    </button>
                  </div>

                  {/* CÂMPURI STRUCTURATE (POT FI EDITATE MANUAL DUPĂ GENERARE) */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Subiectiv (S)</label>
                      <textarea
                        rows={2}
                        value={sessionData.structured_soap.subjective}
                        onChange={(e) =>
                          setSessionData({
                            ...sessionData,
                            structured_soap: { ...sessionData.structured_soap, subjective: e.target.value },
                          })
                        }
                        className="w-full border rounded-lg p-2 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Obiectiv (O)</label>
                      <textarea
                        rows={2}
                        value={sessionData.structured_soap.objective}
                        onChange={(e) =>
                          setSessionData({
                            ...sessionData,
                            structured_soap: { ...sessionData.structured_soap, objective: e.target.value },
                          })
                        }
                        className="w-full border rounded-lg p-2 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Evaluare (A)</label>
                      <textarea
                        rows={2}
                        value={sessionData.structured_soap.assessment}
                        onChange={(e) =>
                          setSessionData({
                            ...sessionData,
                            structured_soap: { ...sessionData.structured_soap, assessment: e.target.value },
                          })
                        }
                        className="w-full border rounded-lg p-2 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Plan (P)</label>
                      <textarea
                        rows={2}
                        value={sessionData.structured_soap.plan}
                        onChange={(e) =>
                          setSessionData({
                            ...sessionData,
                            structured_soap: { ...sessionData.structured_soap, plan: e.target.value },
                          })
                        }
                        className="w-full border rounded-lg p-2 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={savingSession}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl transition shadow-sm"
                >
                  {savingSession ? 'Se salvează...' : 'Salvează Ședința'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}