'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [generating, setGenerating] = useState(false);

  // Încarcă clienții la pornire
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setClients(data);
    }
    setLoading(false);
  };

  const generateLink = async () => {
    if (!clientName || !clientEmail) {
      alert('Completează numele și emailul clientului');
      return;
    }

    setGenerating(true);
    const token = Math.random().toString(36).substring(2, 10);
    const link = `${window.location.origin}/client/${token}`;
    setGeneratedLink(link);
    setGenerating(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-blue-800 mb-6">👥 Clienți</h1>

      {/* Formular generare link */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🔗 Generează link pentru client</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numele clientului</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: Ana Popescu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emailul clientului</label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="ana@email.ro"
            />
          </div>
          <button
            onClick={generateLink}
            disabled={generating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {generating ? 'Se generează...' : '🔗 Generează link'}
          </button>
        </div>

        {generatedLink && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">✅ Link generat:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  alert('Link copiat în clipboard!');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                📋 Copiază
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista clienților */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Clienții tăi</h2>
        
        {loading ? (
          <p className="text-gray-500">Se încarcă...</p>
        ) : clients.length === 0 ? (
          <p className="text-gray-500">Nu ai clienți încă. Generează un link pentru primul client.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Nume</th>
                  <th className="text-left py-2 px-3">Email</th>
                  <th className="text-left py-2 px-3">PESEL</th>
                  <th className="text-left py-2 px-3">Data creării</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{client.name}</td>
                    <td className="py-2 px-3">{client.email}</td>
                    <td className="py-2 px-3">{client.pesel || '-'}</td>
                    <td className="py-2 px-3">{new Date(client.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}