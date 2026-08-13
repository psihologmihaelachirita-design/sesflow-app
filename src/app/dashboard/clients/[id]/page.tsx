'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  FileText, 
  MessageSquare, 
  Files, 
  Phone, 
  Mail, 
  Calendar, 
  AlertCircle, 
  Plus, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id;

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'journal' | 'documents'>('overview');

  // Date simulate pentru vizualizare
  const clientData = {
    name: 'Maria Popescu',
    phone: '+40 722 123 456',
    email: 'maria.popescu@email.com',
    dob: '1990-05-14',
    emergencyContact: 'Ion Popescu (Soț) - +40 722 987 654',
    status: 'Activ'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <div>
        <button
          onClick={() => router.push('/dashboard/clients')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition mb-4"
        >
          <ArrowLeft size={16} /> Înapoi la lista de clienți
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center text-xl font-bold">
              {clientData.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{clientData.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                <span>{clientData.phone}</span>
                <span>•</span>
                <span>{clientData.email}</span>
              </div>
            </div>
          </div>

          <span className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full font-medium">
            Status: {clientData.status}
          </span>
        </div>
      </div>

      {/* Navigare Tab-uri */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User size={18} /> Date Generale
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
            activeTab === 'notes'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={18} /> Note Clinice (SOAP)
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`pb-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
            activeTab === 'journal'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare size={18} /> Between Sessions
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 text-sm font-medium transition flex items-center gap-2 border-b-2 ${
            activeTab === 'documents'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Files size={18} /> Documente & RODO
        </button>
      </div>

      {/* Continut Tab-uri */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[300px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Informații Personale</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 font-medium">Data Nașterii</span>
                <p className="text-sm font-semibold text-gray-800">{clientData.dob}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                <span className="text-xs text-gray-400 font-medium">Contact Urgență</span>
                <p className="text-sm font-semibold text-gray-800">{clientData.emergencyContact}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Istoric Note Ședințe</h3>
              <button className="flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition">
                <Plus size={16} /> Notă Nouă
              </button>
            </div>
            <p className="text-sm text-gray-500">Aici vor fi afișate notele clinice generate sau scrise manual.</p>
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <Sparkles size={18} />
              <h3 className="text-lg font-bold text-gray-900">Jurnal & Interacțiuni AI</h3>
            </div>
            <p className="text-sm text-gray-500">Vizualizează rezumatul oferit de AI pentru starea clientului între ședințe.</p>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <ShieldCheck size={18} />
              <h3 className="text-lg font-bold text-gray-900">Acorduri & GDPR (RODO)</h3>
            </div>
            <p className="text-sm text-gray-500">Documentele semnate și contractele de prestări servicii.</p>
          </div>
        )}
      </div>
    </div>
  );
}