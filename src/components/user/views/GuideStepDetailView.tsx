import React from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { CheckCircle2, AlertTriangle, FileText, Download, ArrowRight } from 'lucide-react';

interface GuideStepDetailViewProps {
  stepNumber: number;
  onBack: () => void;
  onGoPremium: () => void;
  isPremium: boolean;
}

export const GuideStepDetailView: React.FC<GuideStepDetailViewProps> = ({
  stepNumber,
  onBack,
  onGoPremium,
  isPremium,
}) => {
  const stepContents: Record<number, { title: string; subtitle: string; content: string[]; docs: string[]; tip: string }> = {
    1: {
      title: 'Étape 1 — Traduire tes diplômes et documents',
      subtitle: 'Les exigences strictes des autorités allemandes (Apostille & Assermentation)',
      content: [
        'Fais légaliser tes actes d\'état civil au Ministère des Relations Extérieures (MINREX) à Yaoundé.',
        'Seuls les traducteurs assermentés reconnus par l\'Ambassade d\'Allemagne sont acceptés.',
        'Ne traduis jamais toi-même tes documents : un rejet pour traduction non conforme retarde le dossier de 6 mois.',
        'Conserve toujours au moins 3 jeux de copies certifiées conformes.'
      ],
      docs: ['Baccalauréat / GCE A-Level', 'Relevés de notes des 3 dernières années', 'Acte de naissance légalisé MINREX', 'Certificat de célibat'],
      tip: 'Fais scanner tous tes documents en haute résolution (300 DPI minimum) au format PDF.'
    },
    2: {
      title: 'Étape 2 — Attestation de stage / expérience',
      subtitle: 'Valider ses compétences avant l\'entretien',
      content: [
        'Pour la filière soins (Pflege), effectue au moins 1 à 3 mois de stage en milieu clinique au Cameroun.',
        'L\'attestation doit obligatoirement mentionner les actes infirmiers pratiqués et le nombre d\'heures.',
        'Elle doit être signée par le médecin-chef ou le directeur de l\'hôpital avec cachet officiel.'
      ],
      docs: ['Convention de stage', 'Rapport de stage validé', 'Attestation de service avec appréciations'],
      tip: 'Même un stage court de 4 semaines fait une différence décisive lors du visa.'
    },
    3: {
      title: 'Étape 3 — Trouver un contrat de travail / Ausbildung',
      subtitle: 'Postuler auprès des cliniques et employeurs partenaires',
      content: [
        'Prépare un CV au format Europass / Tabellarischer Lebenslauf en allemand.',
        'Rédige une Anschreiben (lettre de motivation) personnalisée pour chaque établissement.',
        'Utilise le réseau d\'offres vérifiées dans l\'application Mon Projet Mbeng.'
      ],
      docs: ['Contrat d\'apprentissage (Ausbildungsvertrag)', 'Plan de formation pratique (Ausbildungsplan)', 'Accord de la Bundesagentur für Arbeit (ZAV)'],
      tip: 'Les employeurs allemands demandent désormais quasi-systématiquement le niveau B2 certifié.'
    },
    4: {
      title: 'Étape 4 — Vorstellungsgespräch (Entretien d\'embauche)',
      subtitle: 'Réussir son entretien visio avec les recruteurs allemands',
      content: [
        'Prépare tes réponses aux questions clés : "Erzählen Sie etwas über sich", "Warum Pflege in Deutschland?".',
        'Soigne ton cadre, ton éclairage et utilise une connexion Internet fibre ou 4G stable.',
        'Fais des simulations orales préalables avec un Betreuer Mbeng.'
      ],
      docs: ['Checklist des questions fréquentes', 'Fiche de présentation personnelle rédigée'],
      tip: 'Les recruteurs valorisent la motivation et la franchise plus que la perfection grammaticale.'
    },
    5: {
      title: 'Étape 5 — Dossier VFS Global & Ambassade',
      subtitle: 'Constitution du classeur de visa sans faille',
      content: [
        'Prends ton rendez-vous dès réception de la promesse d\'embauche.',
        'Classe tes documents exactement dans l\'ordre imposé par le mémento de l\'ambassade.',
        'Prévois les frais de visa en monnaie exacte (environ 50 000 FCFA selon le taux).'
      ],
      docs: ['Formulaire Videx complété et signé', 'Passeport valide + 2 photos biométriques', 'Contrat + ZAV original', 'Certificat de langue Goethe/telc'],
      tip: 'Aucun document agrafé. Tous les originaux doivent être accompagnés de 2 copies recto-verso.'
    },
    6: {
      title: 'Étape 6 — Documents du voyage et départ',
      subtitle: 'Derniers préparatifs avant le décollage',
      content: [
        'Réservation du billet d\'avion (Douala/Yaoundé vers Francfort/Munich/Berlin).',
        'Souscription d\'une assurance santé voyage temporaire couvrant les premières semaines.',
        'Préparation du logement d\'accueil ou résidence mise à disposition par l\'hôpital.'
      ],
      docs: ['Billet d\'avion électronique', 'Attestation d\'assurance voyage', 'Justificatif d\'hébergement initial'],
      tip: 'Télécharge d\'avance le plan des trains DB Navigator et un moyen de paiement international.'
    }
  };

  const current = stepContents[stepNumber] || stepContents[1];

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Retour aux étapes" />
        </div>

        <div className="mb-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#FBEDE6] px-2.5 py-0.5 rounded">
            Détail officiel
          </span>
          <h2 className="font-serif font-bold text-xl text-[#241F18] mt-1.5 leading-snug">
            {current.title}
          </h2>
          <p className="text-xs text-[#8A8173] mt-1">
            {current.subtitle}
          </p>
        </div>

        {/* Recommandations clés */}
        <div className="p-4 rounded-xl bg-white border border-[#E4DCCB] mb-4">
          <h4 className="text-xs font-bold text-[#241F18] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-[#2F9E6E]" />
            Points obligatoires
          </h4>
          <ul className="flex flex-col gap-2">
            {current.content.map((c, i) => (
              <li key={i} className="text-xs text-[#3A3226] flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C0512F] shrink-0 mt-1.5" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Documents à fournir */}
        <div className="p-4 rounded-xl bg-white border border-[#E4DCCB] mb-4">
          <h4 className="text-xs font-bold text-[#241F18] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <FileText size={16} className="text-[#C0512F]" />
            Pièces justificatives
          </h4>
          <div className="flex flex-col gap-1.5">
            {current.docs.map((d, i) => (
              <div key={i} className="p-2 rounded-lg bg-[#FAF7F2] text-xs font-medium text-[#241F18] border border-[#EFE9DC] flex items-center justify-between">
                <span>{d}</span>
                <span className="text-[10px] text-[#8A8173] font-bold">PDF / Original</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conseil d'or Mbeng */}
        <div className="p-3.5 rounded-xl bg-[#FBF0DC] border border-[#F0D9A8] text-left">
          <div className="flex items-center gap-1.5 text-[#A8710A] text-xs font-bold mb-1">
            <AlertTriangle size={15} />
            <span>Point de vigilance</span>
          </div>
          <p className="text-xs text-[#3A3226]">
            {current.tip}
          </p>
        </div>
      </div>

      <div className="pt-6">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onGoPremium}
        >
          {isPremium ? "Télécharger les modèles de documents" : "Débloquer l'accompagnement complet"}
        </Button>
      </div>
    </div>
  );
};
