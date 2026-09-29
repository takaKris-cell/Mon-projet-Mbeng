import React, { useState } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { ShieldCheck, FileText, Bell, AlertTriangle, Calendar, ExternalLink } from 'lucide-react';

interface EmbassyGuideViewProps {
  onBack: () => void;
  onGoPremium: () => void;
}

export const EmbassyGuideView: React.FC<EmbassyGuideViewProps> = ({ onBack, onGoPremium }) => {
  const [activeTab, setActiveTab] = useState<'vfs' | 'news'>('vfs');

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Retour" />
        </div>

        <div className="mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#FBEDE6] px-2.5 py-0.5 rounded">
            GUIDE VISA OFFICIEL
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-1.5">
            Ambassade & VFS Global
          </h2>
          <p className="text-xs text-[#8A8173]">
            Préparation du dépôt physique à Yaoundé et actualités des délais de traitement.
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('vfs')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'vfs'
                ? 'bg-[#241F18] text-white shadow-sm'
                : 'bg-white border border-[#E4DCCB] text-[#8A8173]'
            }`}
          >
            Guide VFS Global
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'news'
                ? 'bg-[#241F18] text-white shadow-sm'
                : 'bg-white border border-[#E4DCCB] text-[#8A8173]'
            }`}
          >
            Actualités Ambassade
          </button>
        </div>

        {activeTab === 'vfs' ? (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-xl bg-white border border-[#E4DCCB]">
              <h4 className="font-serif font-bold text-sm text-[#241F18] mb-1">Qu'est-ce que VFS Global ?</h4>
              <p className="text-xs text-[#8A8173] leading-relaxed">
                Le centre de collecte externe mandaté par l'Ambassade d'Allemagne à Yaoundé. C'est là que tu déposes tes empreintes et ton dossier papier complet.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4DCCB]">
              <h4 className="font-serif font-bold text-sm text-[#241F18] mb-2">Composer son dossier sans faute</h4>
              <div className="flex flex-col gap-1.5 text-xs text-[#3A3226]">
                <p>• Formulaire VIDEX imprimé avec code-barres net.</p>
                <p>• Deux photos biométriques fond gris clair 35x45mm.</p>
                <p>• Originaux + 2 séries complètes de photocopies non agrafées.</p>
                <p>• Justificatif de ressources ou contrat signé ZAV.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FBF0DC] border border-[#F0D9A8]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#A8710A] mb-1">
                <AlertTriangle size={15} />
                <span>Le jour du rendez-vous</span>
              </div>
              <p className="text-xs text-[#3A3226]">
                Arrive 30 minutes avant l'heure. Téléphones éteints obligatoires dès le sas de sécurité.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="p-3.5 rounded-xl bg-white border border-[#E4DCCB]">
              <span className="text-[10px] text-[#2F9E6E] font-bold">18 Septembre 2026</span>
              <h4 className="font-serif font-bold text-xs text-[#241F18] mt-1">
                Ouverture de nouveaux créneaux pour visas soignants (Pflege)
              </h4>
              <p className="text-[11px] text-[#8A8173] mt-0.5">
                Priorité accordée aux candidats titulaires d'une promesse d'embauche et du B2.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#E4DCCB]">
              <span className="text-[10px] text-[#C0512F] font-bold">04 Septembre 2026</span>
              <h4 className="font-serif font-bold text-xs text-[#241F18] mt-1">
                Délais de traitement moyens actuels
              </h4>
              <p className="text-[11px] text-[#8A8173] mt-0.5">
                Comptez entre 6 et 10 semaines entre le dépôt à VFS Yaoundé et le retour du passeport.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onGoPremium}
        >
          Débloquer le guide PDF officiel & checklist VFS
        </Button>
      </div>
    </div>
  );
};
