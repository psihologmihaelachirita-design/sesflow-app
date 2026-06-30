import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-b from-blue-50 to-beige-100">
      <div className="max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-blue-800 mb-2">🌊 Sesflow</h1>
          <div className="w-24 h-1 bg-blue-400 mx-auto rounded-full"></div>
        </div>
        
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">
          Back-office pentru psihologii din Polonia
        </h2>
        
        <p className="text-lg text-gray-600 mb-8">
          Gestionează clienți, programări, contracte și facturi într-un singur loc.
          Conform cu Legea Psihologilor 2026.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intră în cont
          </Link>
          <Link 
            href="/register"
            className="px-6 py-3 bg-beige-200 text-gray-800 rounded-lg hover:bg-beige-300 transition-colors"
          >
            Înregistrează-te
          </Link>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          🔒 Datele tale sunt sigure și conforme GDPR
        </div>
      </div>
    </div>
  );
}