import React, { useState } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { 
  Compass, 
  Home, 
  FileCheck, 
  Wifi, 
  CreditCard, 
  Heart, 
  Train, 
  AlertTriangle, 
  ChevronRight, 
  CheckCircle2 
} from 'lucide-react';

interface GermanyIntegrationViewProps {
  onBack: () => void;
  onOpenCustomContact: () => void;
}

export const GermanyIntegrationView: React.FC<GermanyIntegrationViewProps> = ({
  onBack,
  onOpenCustomContact,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const topics = [
    { id: 'housing', icon: Home, title: 'Trouver un logement', desc: 'WG (colocation), caution bancaire (Kaution) et pièges des faux baux', tag: 'Priorité 1' },
    { id: 'anmeldung', icon: FileCheck, title: 'L\'enregistrement (Anmeldung)', desc: 'Prendre rendez-vous au Bürgeramt dans les 14 jours obligatoires', tag: 'Légal' },
    { id: 'sim', icon: Wifi, title: 'Internet et téléphone portable', desc: 'Carte SIM prépayée vs forfait avec vérification d\'identité', tag: 'Quotidien' },
    { id: 'bank', icon: CreditCard, title: 'Ouvrir un compte bancaire', desc: 'Comptes en ligne sans frais (N26, Revolut, Sparkasse)', tag: 'Finances' },
    { id: 'health', icon: Heart, title: 'Assurance santé obligatoire', desc: 'Caisse publique (TK, AOK, Barmer) et carte vitale électronique', tag: 'Santé' },
    { id: 'transport', icon: Train, title: 'Deutschlandticket & transports', desc: 'Pass national mensuel à 49€ pour trains régionaux, bus et tram', tag: 'Mobilité' },
    { id: 'mistakes', icon: AlertTriangle, title: 'Erreurs critiques à éviter', desc: 'Retard d\'Anmeldung, arnaques en liquide, ignorance du courrier fiscal', tag: 'Vigilance' },
  ];

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Accueil" />
        </div>

        {/* Hero Card Sombre Vert Forêt */}
        <div className="p-5 rounded-2xl bg-[#241F18] text-white mb-5 border border-[#3A3226]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F9E6E] bg-[#2F9E6E]/15 px-2 py-0.5 rounded">
            GUIDE DES PREMIERS MOIS
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#FAF7F2] mt-2 mb-1">
            Bien arriver en Allemagne
          </h2>
          <p className="text-xs text-[#E4DCCB]/85 leading-relaxed">
            Toutes les démarches administratives, bancaires et de logement à accomplir dès ta descente d'avion.
          </p>
        </div>

        {/* Liste des modules d'intégration */}
        <div className="flex flex-col gap-2.5">
          {topics.map((t) => {
            const IconComponent = t.icon;
            const isMistake = t.id === 'mistakes';

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTopic(selectedTopic === t.id ? null : t.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isMistake
                    ? 'bg-[#FBF0DC] border-[#F0D9A8] hover:border-[#A8710A]' // Conforme section 1.2 & 5.4 : ambre d'avertissement, pas de rouge ni de terracotta
                    : 'bg-white border-[#E4DCCB] hover:border-[#C0512F]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isMistake 
                        ? 'bg-[#A8710A] text-white' 
                        : 'bg-[#FAF7F2] border border-[#E4DCCB] text-[#241F18]'
                    }`}>
                      <IconComponent size={17} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#241F18]">
                        {t.title}
                      </h4>
                      <p className="text-[10.5px] text-[#8A8173] mt-0.5 line-clamp-1">
                        {t.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`text-[#8A8173] transition-transform ${selectedTopic === t.id ? 'rotate-90 text-[#C0512F]' : ''}`} />
                </div>

                {/* Contenu déroulant */}
                {selectedTopic === t.id && (
                  <div className="mt-3 pt-3 border-t border-black/10 text-xs text-[#3A3226] leading-relaxed animate-fade-in">
                    {t.id === 'housing' && (
                      <p>
                        Cherche sur WG-Gesucht ou ImmobilienScout24. <strong>Attention :</strong> n'envoie jamais d'argent via Western Union avant d'avoir visité et signé le Wohnungsgeberbestätigung.
                      </p>
                    )}
                    {t.id === 'anmeldung' && (
                      <p>
                        Obligatoire dans les 14 jours suivant l'emménagement. Sans le certificat d'Anmeldung (Meldebestätigung), impossible d'avoir son numéro fiscal (Steuer-ID) ni d'ouvrir son compte en banque.
                      </p>
                    )}
                    {t.id === 'mistakes' && (
                      <div className="flex flex-col gap-1.5 text-[#8F5E00]">
                        <p>• Ne jamais ignorer les courriers officiels en papier jaune dans la boîte aux lettres.</p>
                        <p>• Ne pas télécharger illégalement de torrents (amendes de 900 à 1 500 € systématiques via avocats allemands).</p>
                        <p>• Payer à temps la redevance audiovisuelle obligatoire (Rundfunkbeitrag / GEZ - 18,36 €/mois).</p>
                      </div>
                    )}
                    {t.id === 'transport' && (
                      <p>
                        Le <strong>Deutschlandticket</strong> à 49€ est un abonnement mensuel résiliable. Il permet de voyager dans tous les trains RE, RB, S-Bahn, U-Bahn et bus de toute l'Allemagne (hors TGV ICE/IC).
                      </p>
                    )}
                    {t.id === 'bank' && (
                      <p>
                        Ouvre ton compte bancaire avec ton passeport et ton certificat de résidence. Une carte Girocard ou Debit Mastercard te sera postée sous 5 jours ouvrés.
                      </p>
                    )}
                    {t.id === 'sim' && (
                      <p>
                        Les cartes prépayées (Lidl Connect, Aldi Talk) sont très économiques (8 à 15 €/mois). L'activation nécessite une identification vidéo rapide (Video-Ident).
                      </p>
                    )}
                    {t.id === 'health' && (
                      <p>
                        Ton employeur hospitalier te demande de choisir une caisse maladie publique (TK ou AOK). Les cotisations sont directement prélevées sur ta fiche de paie mensuelle.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA contact */}
        <div className="mt-6 p-4 rounded-xl bg-white border border-[#E4DCCB] flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-[#241F18]">Tu viens d'atterrir en Allemagne ?</h4>
            <p className="text-[11px] text-[#8A8173]">Nos Betreuer sur place à Francfort et Munich t'aident.</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCustomContact}
          >
            Assistance arrivée
          </Button>
        </div>
      </div>
    </div>
  );
};
