'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function validatePesel(pesel: string): { valid: boolean; error: string } {
  if (pesel.length !== 11) {
    return { valid: false, error: 'PESEL-ul trebuie să aibă exact 11 cifre.' };
  }
  if (!/^\d{11}$/.test(pesel)) {
    return { valid: false, error: 'PESEL-ul trebuie să conțină doar cifre.' };
  }
  const year = parseInt(pesel.substring(0, 2));
  const month = parseInt(pesel.substring(2, 4));
  const day = parseInt(pesel.substring(4, 6));
  let fullYear = 1900 + year;
  let adjustedMonth = month;
  if (month >= 81 && month <= 92) {
    fullYear = 1800 + year;
    adjustedMonth = month - 80;
  } else if (month >= 21 && month <= 32) {
    fullYear = 2000 + year;
    adjustedMonth = month - 20;
  } else if (month >= 41 && month <= 52) {
    fullYear = 2100 + year;
    adjustedMonth = month - 40;
  } else if (month >= 61 && month <= 72) {
    fullYear = 2200 + year;
    adjustedMonth = month - 60;
  }
  if (adjustedMonth < 1 || adjustedMonth > 12) {
    return { valid: false, error: 'Luna nașterii este invalidă.' };
  }
  const daysInMonth = new Date(fullYear, adjustedMonth, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { valid: false, error: 'Ziua nașterii este invalidă.' };
  }
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(pesel[i]) * weights[i];
  }
  let controlDigit = (10 - (sum % 10)) % 10;
  const lastDigit = parseInt(pesel[10]);
  if (controlDigit !== lastDigit) {
    return { valid: false, error: 'Cifra de control este invalidă. Verifică PESEL-ul.' };
  }
  return { valid: true, error: '' };
}

export default function ClientPage() {
  const params = useParams();
  const id = params?.id as string;
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    pesel: '',
    address: '',
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (clientData.pesel) {
      const validation = validatePesel(clientData.pesel);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: clientData.name,
        email: clientData.email,
        pesel: clientData.pesel,
        address: clientData.address,
        link_token: id,
        psychologist_id: null,
      });

    setLoading(false);

    if (error) {
      setError(error.message);
      console.error('Eroare salvare:', error);
    } else {
      console.log('Client salvat:', data);
      setStep(2);
    }
  };

  if (!id) {
    return <div className="p-8 text-center">Link invalid</div>;
  }

  return (
    <div className="min-h-screen bg-beige-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">🌊 Sesflow</h1>
          <div className="w-12 h-1 bg-blue-400 mx-auto mt-2 rounded-full"></div>
          <p className="text-gray-600 mt-2">Completează datele tale</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nume complet
              </label>
              <input
                type="text"
                value={clientData.name}
                onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ana Popescu"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={clientData.email}
                onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="ana@email.ro"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PESEL / CNP
              </label>
              <input
                type="text"
                value={clientData.pesel}
                onChange={(e) => setClientData({ ...clientData, pesel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="44051401458"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresă
              </label>
              <input
                type="text"
                value={clientData.address}
                onChange={(e) => setClientData({ ...clientData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Str. Florilor 5, Cluj"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Se salvează...' : 'Continuă →'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Date salvate!</h2>
            <p className="text-gray-600 mb-6">
              Urmează semnarea consimțământului RODO și a contractului.
            </p>
            <a
              href={`/client/documents/${id}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              📄 Continuă cu semnarea documentelor →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}