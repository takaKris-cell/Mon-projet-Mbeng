import React from 'react';
import { Compass } from 'lucide-react';
import { Link, ROUTES } from '../../lib/router';

export const NotFound: React.FC = () => (
  <div className="min-h-screen bg-[#EDE7DD] flex flex-col items-center justify-center p-6 text-center">
    <div className="w-14 h-14 rounded-2xl bg-white border border-[#E4DCCB] flex items-center justify-center text-[#C0512F] mb-4">
      <Compass size={24} />
    </div>
    <h1 className="font-serif font-extrabold text-2xl text-[#241F18]">Page introuvable</h1>
    <p className="text-sm text-[#8A8173] mt-2 max-w-sm leading-relaxed">
      Cette adresse ne correspond à aucune page de Mon Projet Mbeng.
    </p>
    <Link
      to={ROUTES.landing}
      className="mt-6 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#C0512F] text-white text-sm font-bold hover:bg-[#A8452A] active:bg-[#8F3B24] transition-colors"
    >
      Retour à l'accueil
    </Link>
  </div>
);
