'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar,
  ChevronRight,
  Loader2
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
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Preluăm clienții din Supabase
  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Eroare Supabase:', error);
        } else if (data) {
          setClients(data);
        }
      } catch (err) {
        console.error('Eroare la încărcare:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, []);

  // Filtrare după căutare
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
        
        {/* Header cu acțiuni */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clienți</h1>
            <p className="text-slate-500 text-sm mt-1">Gestionează fișele pacienților și istoricul ședințelor</p>
          </div>

          <button 
            onClick={() => router.push('/dashboard/clients/new')}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
          >
            <UserPlus size={18} />
            <span>Client Nou</span>
          </button>
        </div>

        {/* Bara de Căutare */}
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

        {/* Conținut: Loader, Lista sau Mesaj Fără Date */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={24} />
            <span>Se încarcă clienții din baza de date...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
            <p className="text-slate-600 font-medium">Nu există niciun client găsit.</p>
            <p className="text-slate-400 text-xs mt-1">Adaugă primul tău client din butonul de mai sus.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client) => {
              const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client Fără Nume';
              const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div 
                  key={client.id}
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  className="group bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition">
                          {fullName}
                        </h3>
                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full mt-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {client.status || 'Activ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <span className="truncate">{client.email || 'Fără email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span>{client.phone || 'Fără telefon'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end text-xs font-medium text-emerald-700 pt-1 group-hover:translate-x-1 transition-transform">
                    <span>Deschide fișa</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}