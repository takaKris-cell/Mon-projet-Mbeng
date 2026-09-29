import React, { useState } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { ChevronRight, FileCheck, CheckCircle2, PhoneCall, HelpCircle, ArrowRight } from 'lucide-react';

interface GuideOrientationViewProps {
  onBack: () => void;
  onSelectStep: (stepNumber: number) => void;
  onOpenContact: () => void;
}

export const GuideOrientationView: React.FC<GuideOrientationViewProps> = ({
  onBack,
  onSelectStep,
  onOpenContact,
}) => {
  const steps = [
    { number: 1, title: 'Traduire tes diplômes et documents', desc: 'Traducteurs assermentés reconnus par l\'ambassade à Yaoundé et Douala', done: true },
    { number: 2, title: 'Attestation de stage ou expérience', desc: 'Critères indispensables pour le visa soignant ou technique', done: true },
    { number: 3, title: 'Trouver un contrat d\'Ausbildung ou de travail', desc: 'Réseau d\'hôpitaux et d\'entreprises partenaires en Allemagne', done: false },
    { number: 4, title: 'Vorstellungsgespräch (Entretien)', desc: 'Simulations d\'entretien en visioconférence avec un tuteur B2', done: false },
    { number: 5, title: 'Rendez-vous VFS Global & Dépôt Visa', desc: 'Prise de rendez-vous et check-list officielle des originaux', done: false },
    { number: 6, title: 'Préparer les documents de voyage', desc: 'Billet d\'avion, assurance voyage, compte bloqué / caution', done: false },
  ];

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Accueil" />
        </div>

        {/* Hero Card procédure #241F18 */}
        <div className="p-5 rounded-2xl bg-[#241F18] text-white mb-5 border border-[#3A3226]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#C0512F]/15 px-2 py-0.5 rounded">
            GUIDE ÉTAPE PAR ÉTAPE
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#FAF7F2] mt-2 mb-1">
            Par où commencer ?
          </h2>
          <p className="text-xs text-[#E4DCCB]/85 leading-relaxed">
            La feuille de route chronologique et éprouvée pour partir sereinement au départ du Cameroun.
          </p>
        </div>

        {/* Liste des 6 étapes */}
        <div className="flex flex-col gap-2.5">
          {steps.map((st) => (
            <div
              key={st.number}
              onClick={() => onSelectStep(st.number)}
              className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  st.done 
                    ? 'bg-[#DDF0E6] text-[#2F9E6E]' 
                    : 'bg-[#FAF7F2] text-[#8A8173] border border-[#E4DCCB]'
                }`}>
                  {st.done ? <CheckCircle2 size={16} /> : st.number}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#241F18] group-hover:text-[#C0512F] transition-colors">
                    {st.title}
                  </h4>
                  <p className="text-[10.5px] text-[#8A8173] line-clamp-1 mt-0.5">
                    {st.desc}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#8A8173] group-hover:text-[#C0512F] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </div>
          ))}
        </div>

        {/* Encadré d'assistance personnalisée (Gestion contact personnalisée) */}
        <div className="mt-5 p-4 rounded-xl bg-[#FBEDE6] border border-[#C0512F]/30 text-left">
          <div className="flex items-center gap-2 mb-1 text-[#C0512F]">
            <PhoneCall size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Besoin d'un accompagnement personnalisé ?
            </h4>
          </div>
          <p className="text-xs text-[#3A3226] leading-relaxed mb-3">
            Un conseiller Mon Projet Mbeng examine ton dossier, tes diplômes et planifie tes étapes avec toi.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenContact}
            rightIcon={<ArrowRight size={14} />}
          >
            Demander un contact personnalisé
          </Button>
        </div>
      </div>
    </div>
  );
};
