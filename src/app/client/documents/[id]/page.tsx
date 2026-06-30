'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ClientDocumentsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [signature, setSignature] = useState('');

  const totalSteps = 4;

  const handleNext = async () => {
    setError('');

    if (step === 1 && !understood) {
      setError('Trebuie să confirmați că ați citit și înțeles informațiile.');
      return;
    }

    if ((step === 2 || step === 3 || step === 4) && !signature) {
      setError('Trebuie să semnați documentul.');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);

    if (step === totalSteps) {
      // Salvăm documentul în baza de date
      const { error } = await supabase
        .from('client_documents')
        .insert({
          client_id: id,
          psychologist_id: null,
          document_name: 'Pachet complet documente semnate',
          document_url: '/documents/rodo/',
          signed_at: new Date().toISOString(),
          sent_to_email: false,
        });

      if (error) {
        setError('Eroare la salvarea documentului: ' + error.message);
      } else {
        alert('✅ Toate documentele au fost semnate cu succes!');
        setStep(1);
      }
    } else {
      setStep(step + 1);
      setSignature('');
      setUnderstood(false);
    }
  };

  if (!id) {
    return <div className="p-8 text-center">Link invalid</div>;
  }

  return (
    <div className="min-h-screen bg-beige-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-blue-800">📄 Documente</h1>
            <span className="text-sm text-gray-500">Pas {step} din {totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pasul 1: Informacja RODO</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-64 overflow-y-auto text-sm text-gray-700">
              <p className="font-bold">Informacja o przetwarzaniu danych osobowych</p>
              <p className="mt-2">Administratorem danych jest [Numele tău], adresa: [adresa], telefon: [telefon], email: [email].</p>
              <p className="mt-2">Dane są przetwarzane w celu realizacji usług psychoterapeutycznych na podstawie art. 6 ust. 1 lit. b i art. 9 ust. 2 lit. a RODO.</p>
              <p className="mt-2">Dane będą przechowywane przez okres 5 lat od ostatniej wizyty.</p>
              <p className="mt-2">Masz prawo do: dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, wniesienia skargi do Prezesa UODO.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={understood}
                onChange={(e) => setUnderstood(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Am citit și am înțeles informațiile de mai sus.</span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pasul 2: Zgoda na przetwarzanie danych wrażliwych</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-48 overflow-y-auto text-sm text-gray-700">
              <p>Przez niniejszym wyrażam zgodę na przetwarzanie przez [Numele tău] moich danych osobowych dotyczących stanu zdrowia psychicznego, w tym informacji o symptomach, diagnozach i przebiegu terapii, w celu realizacji usług psychoterapeutycznych.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Semnătura digitală</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50">
                <span>✍️ Click aici pentru a semna (desenează cu mouse-ul)</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pasul 3: Zgoda na objęcie psychoterapią</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-48 overflow-y-auto text-sm text-gray-700">
              <p>Wyrażam zgodę na objęcie psychoterapią. Zostałem poinformowany o charakterze terapii, jej celu, czasie trwania, możliwych ryzykach i korzyściach. Mam świadomość, że mogę zrezygnować z terapii w dowolnym momencie.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Semnătura digitală</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50">
                <span>✍️ Click aici pentru a semna (desenează cu mouse-ul)</span>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pasul 4: Contractul terapeutic</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-48 overflow-y-auto text-sm text-gray-700">
              <p><strong>Contract terapeutic</strong></p>
              <p className="mt-2">Preț: 200 PLN / ședință</p>
              <p>Politică de anulare: anulare cu 24h înainte</p>
              <p>Frecvență: săptămânal</p>
              <p className="mt-2">Prin semnarea acestui contract, confirmați că sunteți de acord cu termenii și condițiile de mai sus.</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Semnătura digitală</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50">
                <span>✍️ Click aici pentru a semna (desenează cu mouse-ul)</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Se procesează...' : step === totalSteps ? 'Finalizează' : 'Continuă →'}
          </button>
        </div>
      </div>
    </div>
  );
}