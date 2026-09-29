import React from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { Briefcase, MapPin, Building, DollarSign, CheckCircle2, ChevronRight } from 'lucide-react';

interface JobsNursingViewProps {
  onBack: () => void;
  onApplyJob: (jobTitle: string) => void;
}

export const JobsNursingView: React.FC<JobsNursingViewProps> = ({ onBack, onApplyJob }) => {
  const jobs = [
    {
      id: 'j_1',
      title: 'Auszubildende/r Pflegefachmann/-frau',
      clinic: 'Universitätsklinikum Freiburg',
      city: 'Fribourg-en-Brisgau (Bade-Wurtemberg)',
      salary: '1 340 € / mois',
      requirement: 'Niveau B2 certifié + Baccalauréat',
      housing: 'Logement soignant réservé',
      tags: ['Soins généraux', 'Hôpital universitaire']
    },
    {
      id: 'j_2',
      title: 'Altenpflegefachkraft (Soins gériatriques)',
      clinic: 'Seniorenresidenz Bayerischer Wald',
      city: 'Passau (Bavière)',
      salary: '1 290 € / mois',
      requirement: 'Niveau B1 Goethe validé',
      housing: 'Chambre meublée 250 €/mois',
      tags: ['Gériatrie', 'Prise en charge visa']
    },
    {
      id: 'j_3',
      title: 'Fachkraft für Intensivpflege',
      clinic: 'Klinikum Stuttgart',
      city: 'Stuttgart',
      salary: '1 420 € / mois',
      requirement: 'Diplôme infirmier IDE + B2',
      housing: 'Aide à l\'installation',
      tags: ['Soins intensifs', 'Reconnaissance accélérée']
    }
  ];

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Accueil" />
        </div>

        {/* Hero emploi — noir d'encre de la charte (l'ancien vert n'était pas homologué) */}
        <div className="p-5 rounded-2xl bg-[#241F18] text-white mb-5 border border-[#3A3226]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F9E6E] bg-[#2F9E6E]/15 px-2 py-0.5 rounded">
            OPPORTUNITÉS RECRUTEMENT
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#FAF7F2] mt-2 mb-1">
            Trouver un contrat de travail
          </h2>
          <p className="text-xs text-[#E4DCCB]/85 leading-relaxed">
            Offres d'apprentissage (Ausbildung) et postes soignants avec prise en charge de la procédure de visa par l'employeur.
          </p>
        </div>

        {/* Liste des postes */}
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] transition-all flex flex-col gap-2.5"
            >
              <div>
                <span className="text-[10px] font-bold text-[#C0512F] bg-[#FBEDE6] px-2 py-0.5 rounded">
                  {job.clinic}
                </span>
                <h3 className="font-serif font-bold text-sm text-[#241F18] mt-1.5 leading-snug">
                  {job.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-[#8A8173] mt-1">
                  <MapPin size={13} /> {job.city}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#EFE9DC]">
                <div className="flex items-center gap-1 text-[#1F6B47] font-semibold">
                  <DollarSign size={14} /> {job.salary}
                </div>
                <div className="text-[#8A8173] text-[11px] truncate">
                  {job.housing}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-[#8A8173] font-medium">
                  {job.requirement}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApplyJob(job.title)}
                >
                  Postuler
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
