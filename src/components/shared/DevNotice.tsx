/**
 * Encart d'aide au développement.
 *
 * Manuel §11 : « Tout outil de test doit être conditionné par une variable
 * d'environnement qui ne peut jamais être vraie en production ». `DEV_TOOLS_ENABLED`
 * est une constante remplacée au build : ce composant ne rend rien et son
 * contenu est éliminé du bundle de production.
 */
import React from 'react';
import { FlaskConical } from 'lucide-react';
import { DEV_TOOLS_ENABLED } from '../../lib/env';

export const DevNotice: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  if (!DEV_TOOLS_ENABLED) return null;
  return (
    <div className="rounded-xl border border-dashed border-[#A8710A]/50 bg-[#FBF0DC]/60 p-3 text-left">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A8710A]">
        <FlaskConical size={12} /> {title} — développement uniquement
      </span>
      <div className="text-[11.5px] text-[#6B4A08] mt-1.5 leading-relaxed">{children}</div>
    </div>
  );
};
