import React from 'react';
import { UserProfile, UserScreen } from '../../../types';
import { 
  Bell, 
  ChevronRight, 
  BookOpen, 
  GraduationCap, 
  Users, 
  Gift, 
  Calendar, 
  Briefcase, 
  Compass, 
  HeartHandshake, 
  Building2, 
  Play, 
  Sparkles,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface HomeViewProps {
  user: UserProfile;
  onNavigate: (screen: UserScreen) => void;
  onOpenMessages: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, onNavigate, onOpenMessages }) => {
  return (
    <div className="pb-8 animate-fade-in text-left">
      {/*
        En-tête — audit §4 (régression).
        Le message « Bonjour, <prénom> » avait été réintroduit alors qu'il avait
        été explicitement demandé de le retirer, et le logo avait disparu.
        Corrigé dans les deux sens : le logo seul, pas de salutation.
      */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <img
            src="/assets/logos/logo_terracotta.jpg"
            alt="Mon Projet Mbeng"
            className="h-8 w-auto object-contain"
          />
          <span className="text-[10px] font-bold text-[#C0512F] bg-[#FBEDE6] px-1.5 py-0.5 rounded">
            {user.level}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenMessages}
          aria-label="Messagerie et tuteurs"
          className="w-9 h-9 rounded-full bg-white border border-[#E4DCCB] flex items-center justify-center text-[#241F18] hover:text-[#C0512F] hover:border-[#C0512F] active:bg-[#F5F1EA] relative transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40"
        >
          <Bell size={18} />
          <span className="w-2 h-2 rounded-full bg-[#C0512F] absolute top-2 right-2 ring-2 ring-white" />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-3.5">
        {/* CARTE REPRENDRE (Noir d'encre #241F18) */}
        <div 
          onClick={() => onNavigate('exam_simulation')}
          className="p-4 rounded-xl bg-[#241F18] text-white cursor-pointer hover:opacity-95 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#8A8173] mb-1">
            <span>REPRENDRE</span>
            <span className="text-[#C0512F] flex items-center gap-1">En cours <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></span>
          </div>
          <h3 className="font-serif font-bold text-lg text-[#FAF7F2]">
            Goethe B1 — Modelltest 3
          </h3>
          <p className="text-xs text-[#E4DCCB]/80 mt-0.5">
            Lesen • Hören en cours
          </p>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 bg-white/20 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#C0512F] h-full rounded-full" style={{ width: '62%' }} />
            </div>
            <span className="text-xs font-semibold text-[#FAF7F2]">62%</span>
          </div>
        </div>

        {/* BOUTON "JE NE SAIS PAS PAR OÙ COMMENCER" (Terracotta plein) */}
        <button
          type="button"
          onClick={() => onNavigate('guide_orientation')}
          className="w-full p-3.5 rounded-xl bg-[#C0512F] text-white flex items-center justify-between shadow-sm hover:bg-[#A8452A] transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <HelpCircle size={18} />
            </div>
            <div>
              <h4 className="font-bold text-xs">Je ne sais pas par où commencer</h4>
              <p className="text-[11px] text-white/80">Découvrir la procédure pas à pas vers l'Allemagne</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-white group-hover:translate-x-1 transition-transform" />
        </button>

        {/* BOUTON "MOTS DU JOUR" (Orange pastel / Terracotta clair) */}
        <button
          type="button"
          onClick={() => onNavigate('words_of_day')}
          className="w-full p-3.5 rounded-xl bg-[#FBEDE6] border border-[#C0512F]/20 text-[#241F18] flex items-center justify-between hover:border-[#C0512F] transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#C0512F] text-white flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="font-bold text-xs text-[#241F18]">Tes mots du jour t'attendent</h4>
              <p className="text-[11px] text-[#8A8173]">10 nouveaux mots • 1 règle de grammaire</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#C0512F] group-hover:translate-x-1 transition-transform" />
        </button>

        {/* SECTION ACCÈS RAPIDE */}
        <div className="pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8173] block mb-2.5">
            ACCÈS RAPIDE
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E4DCCB] text-[#241F18] group-hover:text-[#C0512F] flex items-center justify-center mb-2">
                <BookOpen size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#241F18]">Bibliothèque</h4>
                <p className="text-[10px] text-[#8A8173] mt-0.5">Livres, audios, fiches</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('exams_intro')}
              className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E4DCCB] text-[#241F18] group-hover:text-[#C0512F] flex items-center justify-center mb-2">
                <GraduationCap size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#241F18]">Examens blancs</h4>
                <p className="text-[10px] text-[#8A8173] mt-0.5">Goethe B1 • telc • ECL</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('betreuer_marketplace')}
              className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E4DCCB] text-[#241F18] group-hover:text-[#C0512F] flex items-center justify-center mb-2">
                <Users size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#241F18]">Betreuer</h4>
                <p className="text-[10px] text-[#8A8173] mt-0.5">Trouver un tuteur privé</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('referral')}
              className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] transition-all text-left flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E4DCCB] text-[#241F18] group-hover:text-[#C0512F] flex items-center justify-center mb-2">
                <Gift size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#241F18]">Parrainage</h4>
                <p className="text-[10px] text-[#8A8173] mt-0.5">Mon code, mes gains</p>
              </div>
            </button>
          </div>
        </div>

        {/* BOUTON "SE RÉSERVER POUR UN EXAMEN" */}
        <button
          type="button"
          onClick={() => onNavigate('book_exam')}
          className="w-full p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] flex items-center justify-between transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] border border-[#E4DCCB] text-[#241F18] flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#241F18]">Se réserver pour un examen</h4>
              <p className="text-[10px] text-[#8A8173]">ECL, telc, Goethe ou ÖSD</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[#8A8173] group-hover:text-[#C0512F] group-hover:translate-x-1 transition-all" />
        </button>

        {/* SECTION APRÈS TON B2 */}
        <div className="pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8173] block mb-2.5">
            APRÈS TON B2
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('jobs_nursing')}
              className="p-3.5 rounded-xl bg-[#241F18] text-white hover:bg-[#3A3226] transition-all text-left flex flex-col justify-between group h-24"
            >
              <Briefcase size={18} className="text-[#2F9E6E]" />
              <div>
                <h4 className="text-xs font-bold text-[#FAF7F2] leading-tight">Trouver un contrat de travail</h4>
                <p className="text-[9.5px] text-[#E4DCCB]/70 mt-0.5">Soignants & techniciens</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('germany_integration')}
              className="p-3.5 rounded-xl bg-[#241F18] text-white hover:bg-[#3A3226] transition-all text-left flex flex-col justify-between group h-24"
            >
              <Compass size={18} className="text-[#2F9E6E]" />
              <div>
                <h4 className="text-xs font-bold text-[#FAF7F2] leading-tight">S'intégrer en Allemagne</h4>
                <p className="text-[9.5px] text-[#E4DCCB]/70 mt-0.5">Logement, Anmeldung, banque</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('nursing_training')}
              className="p-3.5 rounded-xl bg-[#241F18] text-white hover:bg-[#3A3226] transition-all text-left flex flex-col justify-between group h-24"
            >
              <HeartHandshake size={18} className="text-[#2F9E6E]" />
              <div>
                <h4 className="text-xs font-bold text-[#FAF7F2] leading-tight">Programme Pflege</h4>
                <p className="text-[9.5px] text-[#E4DCCB]/70 mt-0.5">Formation soignant 3 ans</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('post_b2')}
              className="p-3.5 rounded-xl bg-[#241F18] text-white hover:bg-[#3A3226] transition-all text-left flex flex-col justify-between group h-24"
            >
              <Building2 size={18} className="text-[#2F9E6E]" />
              <div>
                <h4 className="text-xs font-bold text-[#FAF7F2] leading-tight">Ausbildung & Studium</h4>
                <p className="text-[9.5px] text-[#E4DCCB]/70 mt-0.5">Ambassade & VFS Global</p>
              </div>
            </button>
          </div>
        </div>

        {/* SECTION CONTINUER D'ÉCOUTER */}
        <div className="pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8173] block mb-2.5">
            CONTINUER D'ÉCOUTER
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <div
              onClick={() => onNavigate('audio_player')}
              className="p-3 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] cursor-pointer transition-all"
            >
              <div className="h-16 rounded-lg bg-[#EDE7DD] flex items-center justify-center text-[#C0512F] mb-2 relative overflow-hidden">
                <Play size={22} className="fill-[#C0512F]" />
              </div>
              <h5 className="text-xs font-bold text-[#241F18] truncate">Nachrichten — 12.09</h5>
              <p className="text-[10px] text-[#8A8173]">Actualités • 4 min</p>
            </div>

            <div
              onClick={() => onNavigate('audio_player')}
              className="p-3 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] cursor-pointer transition-all"
            >
              <div className="h-16 rounded-lg bg-[#FBEDE6] flex items-center justify-center text-[#C0512F] mb-2 relative overflow-hidden">
                <Play size={22} className="fill-[#C0512F]" />
              </div>
              <h5 className="text-xs font-bold text-[#241F18] truncate">Alltag: Beim Arzt</h5>
              <p className="text-[10px] text-[#8A8173]">Podcast • Niveau A2</p>
            </div>
          </div>
        </div>

        {/* BANDEAU "TOI-MÊME B2 ?" */}
        <div 
          onClick={() => onNavigate('become_betreuer_intro')}
          className="mt-2 p-3.5 rounded-xl bg-gradient-to-r from-[#FAF7F2] to-[#FBEDE6] border border-[#E4DCCB] flex items-center justify-between cursor-pointer hover:border-[#C0512F] transition-all"
        >
          <div>
            <h4 className="text-xs font-bold text-[#241F18]">Tu as déjà validé ton B2 ?</h4>
            <p className="text-[11px] text-[#8A8173]">Deviens Betreuer rémunéré sur Mon Projet Mbeng.</p>
          </div>
          <span className="text-xs font-bold text-[#C0512F] flex items-center gap-0.5">
            Postuler <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};
