/**
 * Coquille de l'Espace Commercial : barre latérale, sections, déconnexion.
 * Ce composant n'est monté QUE derrière une session `commercial` valide
 * (voir App.tsx / PortalGuard).
 */
import React, { useState } from 'react';
import {
  Gift, LayoutDashboard, LineChart, LogOut, Menu, Settings, TrendingUp, Users, X,
} from 'lucide-react';
import { useRouter, useSegments } from '../../lib/router';
import { useApi } from '../../lib/hooks';
import { getAgentDashboard } from '../../lib/api/agent';
import type { Session } from '../../lib/auth/session';
import { fcfa, initials } from '../../lib/format';
import { CommercialDashboard } from './views/CommercialDashboard';
import { CommercialClients } from './views/CommercialClients';
import { CommercialEarnings } from './views/CommercialEarnings';
import { CommercialDeferred } from './views/CommercialDeferred';
import { CommercialPromoCode } from './views/CommercialPromoCode';
import { CommercialSettings } from './views/CommercialSettings';

const SECTIONS = [
  { slug: 'tableau-de-bord', label: 'Tableau de bord', icon: LayoutDashboard },
  { slug: 'mes-clients', label: 'Mes clients', icon: Users },
  { slug: 'mes-gains', label: 'Mes gains', icon: LineChart },
  { slug: 'conversions-differees', label: 'Conversions différées', icon: TrendingUp },
  { slug: 'mon-code-promo', label: 'Mon code promo', icon: Gift },
  { slug: 'parametres', label: 'Paramètres & RIB', icon: Settings },
] as const;

type Slug = (typeof SECTIONS)[number]['slug'];

export const CommercialPortal: React.FC<{ session: Session; onSignOut: () => void }> = ({
  session,
  onSignOut,
}) => {
  const { navigate } = useRouter();
  const segments = useSegments();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const slug = (SECTIONS.find((s) => s.slug === segments[1])?.slug ?? 'tableau-de-bord') as Slug;

  // Un seul appel pour les compteurs de la barre latérale : les badges affichés
  // proviennent des mêmes données que les écrans, jamais de valeurs en dur.
  const overview = useApi(getAgentDashboard, [slug === 'tableau-de-bord']);

  const go = (next: Slug) => {
    navigate(`/commercial/${next}`);
    setMobileNavOpen(false);
  };

  const badges: Partial<Record<Slug, string>> = overview.data
    ? {
        'mes-clients': String(overview.data.kpis.totalClients),
        'conversions-differees': fcfa(overview.data.balances.deferred.earnings, { compact: true }),
      }
    : {};

  return (
    <div className="min-h-screen bg-[#EDE7DD] flex flex-col md:flex-row text-left">
      {/* En-tête mobile */}
      <header className="md:hidden sticky top-0 z-30 bg-[#241F18] text-white px-4 py-3 flex items-center justify-between border-b border-[#3A3226]">
        <div className="flex items-center gap-2.5">
          <img src="/assets/logos/logo_terracotta.jpg" alt="" className="h-7 w-auto object-contain" />
          <span className="font-serif font-bold text-sm">Espace Commercial</span>
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

      {/* Barre latérale */}
      <aside
        className={`
          bg-[#241F18] text-[#FAF7F2] md:w-64 shrink-0 flex-col justify-between border-r border-[#3A3226]
          ${mobileNavOpen ? 'flex' : 'hidden md:flex'}
          md:sticky md:top-0 md:h-screen p-5
        `}
      >
        <div>
          <div className="hidden md:flex items-center gap-3 pb-5 border-b border-white/10">
            <img src="/assets/logos/logo_terracotta.jpg" alt="" className="h-9 w-auto object-contain" />
            <div>
              <span className="font-serif font-bold text-sm text-white block leading-tight">Espace Commercial</span>
              <span className="text-[10px] text-[#2F9E6E] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F9E6E]" /> Agent certifié
              </span>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C0512F] text-white flex items-center justify-center font-bold text-sm shrink-0">
              {initials(session.fullName)}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#FAF7F2] truncate">{session.fullName}</h4>
              <p className="text-[10.5px] text-[#8A8173] truncate">
                {overview.data ? `Code : ${overview.data.agent.affiliateCode}` : 'Chargement…'}
              </p>
            </div>
          </div>

          <nav className="mt-6 flex flex-col gap-1.5" aria-label="Sections de l'espace commercial">
            {SECTIONS.map((item) => {
              const active = slug === item.slug;
              const Icon = item.icon;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => go(item.slug)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F] ${
                    active
                      ? 'bg-[#C0512F] text-white shadow-sm'
                      : 'text-[#8A8173] hover:text-white hover:bg-white/5 active:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={16} />
                    {item.label}
                  </span>
                  {badges[item.slug] && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md ${
                        active ? 'bg-black/30 text-white' : 'bg-white/10 text-[#C7BDA8]'
                      }`}
                    >
                      {badges[item.slug]}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 mt-6 border-t border-white/10">
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#8A8173] hover:text-[#FAF7F2] hover:bg-white/5 active:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#B3261E]"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-x-hidden">
        {slug === 'tableau-de-bord' && <CommercialDashboard onNavigate={go} />}
        {slug === 'mes-clients' && <CommercialClients />}
        {slug === 'mes-gains' && <CommercialEarnings />}
        {slug === 'conversions-differees' && <CommercialDeferred />}
        {slug === 'mon-code-promo' && <CommercialPromoCode />}
        {slug === 'parametres' && <CommercialSettings />}
      </main>
    </div>
  );
};
