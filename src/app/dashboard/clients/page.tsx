'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  ChevronRight, 
  Loader2,
  X,
  Copy,
  Check
} from 'lucide-react';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at?: string;
  status?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Stări pentru Modalul "Client Nou"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Încărcare clienți via API (Bypass RLS)
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clients/list');
      const result = await res.json();

      if (!res.ok || result.error) {
        console.error('Eroare la încărcare clienți:', result.error);
      } else if (result.clients) {
        setClients(result.clients);
      }
    } catch (err) {
      console.error('Eroare rețea la încărcare clienți:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Funcția de generare link din Modal
  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) {
      alert('Completează numele și emailul clientului');
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch('/api/clients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, clientEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Eroare: ${data.error || 'Nu s-a putut genera linkul.'}`);
        setGenerating(false);
        return;
      }

      const link = `${window.location.origin}/client/onboarding?token=${data.token}`;
      setGeneratedLink(link);
      fetchClients();
    } catch (err) {
      console.error('Eroare la conectare server:', err);
      alert('A apărut o eroare la conectarea cu serverul.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setClientName('');
    setClientEmail('');
    setGeneratedLink('');
    setCopied(false);
  };

  const filteredClients = clients.filter((c) => {
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const query = searchTerm.toLowerCase();
    return (
      fullName.includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clienți</h1>
            <p className="text-slate-500 text-sm mt-1">Gestionează fișele pacienților și generarea de invitații</p>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
          >
            <UserPlus size={18} />
            <span>Client Nou</span>
          </button>
        </div>

        {/* Căutare */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Caută după nume, email sau telefon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
            />
          </div>
        </div>

        {/* Lista Clienti */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={24} />
            <span>Se încarcă clienții...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
            <p className="text-slate-600 font-medium">Nu există niciun client găsiți.</p>
            <p className="text-slate-400 text-xs mt-1">Apasă pe "+ Client Nou" pentru a genera un link.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client) => {
              const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client În Așteptare';
              const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div 
                  key={client.id}
                  onClick={() => window.location.href = `/dashboard/clients/${client.id}`}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{fullName}</h3>
                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full mt-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {client.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <span className="truncate">{client.email || 'Fără email'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* MODAL CLIENT NOU (Caseta) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-5 relative">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Adaugă Client Nou</h3>
              <button 
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {!generatedLink ? (
              <form onSubmit={handleGenerateLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nume și Prenume Client
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Popescu Ion"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Client
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="client@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Anulează
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    {generating && <Loader2 className="animate-spin" size={16} />}
                    <span>Generează Link</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  Linkul a fost generat cu succes! Trimite-l clientului pentru a parcurge onboarding-ul.
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition flex items-center justify-center shrink-0"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition"
                  >
                    Închide
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}