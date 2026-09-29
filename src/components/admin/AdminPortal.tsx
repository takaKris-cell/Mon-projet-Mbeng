/**
 * Coquille de la Super-Administration : barre latérale des 10 sections,
 * montée uniquement derrière une session `admin` 2FA validée.
 */
import React, { useState } from 'react';
import {
  BarChart3, CreditCard, FileText, Key, LayoutDashboard, LogOut, Megaphone, Menu,
  Receipt, Settings, UserCheck, Users, X,
} from 'lucide-react';
import { useRouter, useSegments } from '../../lib/router';
import type { Session } from '../../lib/auth/session';
import { human, initials } from '../../lib/format';
import { AdminOverviewView } from './views/AdminOverview';
import { AdminAgentsView } from './views/AdminAgents';
import { AdminUsersView } from './views/AdminUsers';
import { AdminAccountingView } from './views/AdminAccounting';
import { AdminPaymentsView } from './views/AdminPayments';
import { AdminContentView } from './views/AdminContent';
import { AdminMarketingView } from './views/AdminMarketing';
import { AdminChargesView } from './views/AdminCharges';
import { AdminAccessView } from './views/AdminAccess';
import { AdminSettingsView } from './views/AdminSettings';

const SECTIONS = [
  { slug: 'vue-ensemble', label: "Vue d'ensemble", icon: LayoutDashboard },
  { slug: 'commerciaux', label: 'Commerciaux', icon: UserCheck },
  { slug: 'utilisateurs', label: 'Utilisateurs', icon: Users },
  { slug: 'comptabilite', label: 'Comptabilité', icon: BarChart3 },
  { slug: 'paiements', label: 'Paiements', icon: CreditCard },
  { slug: 'contenu', label: 'Contenu (CMS)', icon: FileText },
  { slug: 'marketing', label: 'Marketing digital', icon: Megaphone },
  { slug: 'charges', label: 'Charges', icon: Receipt },
  { slug: 'acces-roles', label: 'Accès & rôles', icon: Key },
  { slug: 'parametres', label: 'Paramètres', icon: Settings },
] as const;

type Slug = (typeof SECTIONS)[number]['slug'];

export const AdminPortal: React.FC<{ session: Session; onSignOut: () => void }> = ({ session, onSignOut }) => {
  const { navigate } = useRouter();
  const segments = useSegments();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const slug = (SECTIONS.find((s) => s.slug === segments[1])?.slug ?? 'vue-ensemble') as Slug;

  const go = (next: Slug) => {
    navigate(`/admin/${next}`);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#EDE7DD] flex flex-col md:flex-row text-left">
      <header className="md:hidden sticky top-0 z-30 bg-[#241F18] text-white px-4 py-3 flex items-center justify-between border-b border-[#3A3226]">
        <div className="flex items-center gap-2.5">
          <img src="/assets/logos/logo_terracotta.jpg" alt="" className="h-7 w-auto object-contain" />
          <span className="font-serif font-bold text-sm">Administration</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen((o) => !o)}
          aria-label={mobileNavOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileNavOpen}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          {mobileNavOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </header>

      <aside
        className={`bg-[#241F18] text-[#FAF7F2] md:w-60 shrink-0 flex-col justify-between border-r border-[#3A3226] p-4
          ${mobileNavOpen ? 'flex' : 'hidden md:flex'} md:sticky md:top-0 md:h-screen md:overflow-y-auto`}
      >
        <div>
          <div className="hidden md:flex items-center gap-3 pb-4 border-b border-white/10">
            <img src="/assets/logos/logo_terracotta.jpg" alt="" className="h-8 w-auto object-contain" />
            <div>
              <span className="font-serif font-bold text-sm text-white block leading-tight">Administration</span>
              <span className="text-[10px] text-[#C0512F] font-bold uppercase tracking-wider">
                {human(session.role)}
              </span>
            </div>
          </div>

          <nav className="mt-4 flex flex-col gap-1" aria-label="Sections de l'administration">
            {SECTIONS.map((item) => {
              const active = slug === item.slug;
              const Icon = item.icon;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => go(item.slug)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F] ${
                    active
                      ? 'bg-[#C0512F] text-white shadow-sm'
                      : 'text-[#8A8173] hover:text-white hover:bg-white/5 active:bg-white/10'
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 mt-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-1 pb-3">
            <div className="w-8 h-8 rounded-lg bg-[#C0512F] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
              {initials(session.fullName)}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white truncate">{session.fullName}</p>
              <p className="text-[10px] text-[#2F9E6E]">2FA validée</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#8A8173] hover:text-[#FAF7F2] hover:bg-white/5 active:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#B3261E]"
          >
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-x-hidden">
        {slug === 'vue-ensemble' && <AdminOverviewView onNavigate={go} />}
        {slug === 'commerciaux' && <AdminAgentsView />}
        {slug === 'utilisateurs' && <AdminUsersView />}
        {slug === 'comptabilite' && <AdminAccountingView />}
        {slug === 'paiements' && <AdminPaymentsView />}
        {slug === 'contenu' && <AdminContentView />}
        {slug === 'marketing' && <AdminMarketingView />}
        {slug === 'charges' && <AdminChargesView />}
        {slug === 'acces-roles' && <AdminAccessView />}
        {slug === 'parametres' && <AdminSettingsView />}
      </main>
    </div>
  );
};
