'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

const zile = ['Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri'];
const ore = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

type Slot = {
  status: 'liber' | 'rezervat' | 'gol';
  clientNume?: string;
  clientId?: string;
};

const gridMock: Record<string, Slot> = {
  'Luni-09:00': { status: 'liber' },
  'Luni-10:00': { status: 'rezervat', clientNume: 'Pawel Kowalski', clientId: 'c1' },
  'Vineri-09:00': { status: 'rezervat', clientNume: 'Maria Wojcik', clientId: 'c2' },
  'Miercuri-14:00': { status: 'rezervat', clientNume: 'Anna Nowak', clientId: 'c3' },
  'Marti-11:00': { status: 'liber' },
  'Joi-11:00': { status: 'liber' },
};

function getSlot(zi: string, ora: string): Slot {
  return gridMock[`${zi}-${ora}`] || { status: 'gol' };
}

export default function CalendarPage() {
  const [modalSlot, setModalSlot] = useState<{ zi: string; ora: string; slot: Slot } | null>(null);

  const handleSlotClick = (zi: string, ora: string) => {
    const slot = getSlot(zi, ora);
    setModalSlot({ zi, ora, slot });
  };

  const closeModal = () => setModalSlot(null);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-800">August 2026</h1>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Azi
            </button>
            <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + Adauga disponibilitate
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid" style={{ gridTemplateColumns: `70px repeat(${zile.length}, 1fr)` }}>
            <div className="border-b border-r border-gray-200 bg-gray-50" />
            {zile.map((zi) => (
              <div key={zi} className="border-b border-r border-gray-200 bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                {zi}
              </div>
            ))}

            {ore.map((ora) => (
              <>
                <div key={`ora-${ora}`} className="border-b border-r border-gray-200 p-2 text-xs text-gray-400">
                  {ora}
                </div>
                {zile.map((zi) => {
                  const slot = getSlot(zi, ora);
                  return (
                    <div
                      key={`${zi}-${ora}`}
                      onClick={() => handleSlotClick(zi, ora)}
                      className="border-b border-r border-gray-200 p-1 min-h-[48px] cursor-pointer hover:bg-gray-50"
                    >
                      {slot.status === 'rezervat' && (
                        <div className="bg-green-100 text-green-800 rounded px-2 py-1 text-xs h-full">
                          {slot.clientNume}
                        </div>
                      )}
                      {slot.status === 'liber' && (
                        <div className="bg-blue-50 text-blue-600 rounded px-2 py-1 text-xs h-full">
                          liber
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Click pe o casuta rezervata deschide fisa clientului. Click pe o casuta libera sau goala deschide editarea disponibilitatii.
        </p>
      </main>

      {modalSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            {modalSlot.slot.status === 'rezervat' ? (
              <>
                <h2 className="text-lg font-semibold mb-1">{modalSlot.slot.clientNume}</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {modalSlot.zi}, {modalSlot.ora}
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <a href={`/dashboard/clients/${modalSlot.slot.clientId}`} className="text-blue-600 hover:underline">
                    Vezi fisa completa a clientului →
                  </a>
                </div>
                <div className="flex gap-2 mt-5">
                  <button className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                    Sedinta finalizata
                  </button>
                  <button onClick={closeModal} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Inchide
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-1">
                  {modalSlot.slot.status === 'liber' ? 'Editeaza disponibilitatea' : 'Adauga disponibilitate'}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {modalSlot.zi}, {modalSlot.ora}
                </p>
                <label className="block text-sm text-gray-700 mb-1">Durata sedintei</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4">
                  <option>50 minute</option>
                  <option>60 minute</option>
                  <option>90 minute</option>
                </select>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    Salveaza
                  </button>
                  <button onClick={closeModal} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Anuleaza
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}