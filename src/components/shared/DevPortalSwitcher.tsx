/**
 * Bascule de portail réservée au développement.
 *
 * Audit §1.3.3 : « Retirer complètement la barre de sélection de portail et ses
 * liens en pied de page de tout build destiné à la production. S'il faut un
 * outil de bascule pour les tests internes, le placer derrière une variable
 * d'environnement qui ne doit jamais être vraie sur l'environnement public. »
 *
 * `DEV_TOOLS_ENABLED` dérive de `import.meta.env.DEV`, que Vite remplace
 * littéralement par `false` lors d'un `npm run build` : la condition devient
 * `if (false)` et tout ce composant est supprimé du bundle de production.
 *
 * Cet outil ne contourne AUCUN contrôle d'accès : il ne fait que naviguer vers
 * l'écran de connexion du portail choisi, qui exige toujours des identifiants.
 */
import React, { useState } from 'react';
import { FlaskConical, X } from 'lucide-react';
import { DEV_TOOLS_ENABLED } from '../../lib/env';
import { Link, ROUTES, useRouter } from '../../lib/router';

const TARGETS = [
  { to: ROUTES.landing, label: 'Site public' },
  { to: ROUTES.user.root, label: 'Portail Élève' },
  { to: ROUTES.commercial.login, label: 'Espace Commercial' },
  { to: ROUTES.admin.login, label: 'Administration' },
];

export const DevPortalSwitcher: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { path } = useRouter();

  if (!DEV_TOOLS_ENABLED) return null;

  return (
    <div className="fixed z-[70] left-3 bottom-3 print:hidden">
      {open ? (
        <div className="bg-[#241F18] text-white rounded-2xl border border-[#3A3226] shadow-elevation p-3 w-60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8710A] flex items-center gap-1.5">
              <FlaskConical size={11} /> Bascule dev
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer la bascule de développement"
              className="text-[#8A8173] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {TARGETS.map((t) => {
              const active = path === t.to || path.startsWith(`${t.to}/`);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  onClick={() => setOpen(false)}
                  className={`px-2.5 py-2 rounded-lg text-[11.5px] font-semibold transition-colors ${
                    active ? 'bg-[#C0512F] text-white' : 'text-[#C7BDA8] hover:bg-white/10'
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
          <p className="text-[10px] text-[#8A8173] mt-2 leading-snug">
            Chaque portail redemande une connexion : cet outil ne contourne aucun contrôle d'accès.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Bascule de portail (développement)"
          className="w-9 h-9 rounded-full bg-[#241F18] text-[#A8710A] border border-[#3A3226] shadow-elevation flex items-center justify-center hover:text-white transition-colors"
        >
          <FlaskConical size={15} />
        </button>
      )}
    </div>
  );
};
