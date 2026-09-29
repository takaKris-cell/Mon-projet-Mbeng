/**
 * Page d'accueil marketing du site web (« LandingWeb »).
 *
 * Point 4 de la demande : cette page n'existait pas du tout dans le live.
 * Elle est servie sur écran large ; sur mobile, la racine redirige directement
 * vers l'écran d'accueil de l'application (voir App.tsx).
 *
 * Sections, dans l'ordre de la maquette : navbar, hero, fonctionnalités,
 * comment ça marche, témoignages, téléchargement de l'app, FAQ, tarifs, footer.
 *
 * ⚠️ Le pied de page ne contient AUCUN lien vers l'Espace Commercial ni vers
 * l'Administration : ces portails ne sont plus exposés publiquement (audit §1).
 */
import React, { useEffect, useState } from 'react';
import {
  ArrowRight, BookOpen, Building2, Check, ChevronDown, GraduationCap, HeartHandshake,
  Menu, Quote, Smartphone, Star, Users, X,
} from 'lucide-react';
import { Link, ROUTES, useRouter } from '../../lib/router';
import { PREMIUM_PLANS } from '../../lib/business/constants';
import { fcfa } from '../../lib/format';

const NAV = [
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#comment-ca-marche', label: 'Comment ça marche' },
  { href: '#temoignages', label: 'Témoignages' },
  { href: '#tarifs', label: 'Tarifs' },
  { href: '#faq', label: 'FAQ' },
];

const FEATURES = [
  {
    icon: GraduationCap,
    title: 'Examens blancs Goethe, telc, ÖSD & ECL',
    text: "Des Modelltests complets en conditions réelles, corrigés en détail, du A1 au B2, avec suivi de progression module par module.",
  },
  {
    icon: BookOpen,
    title: 'Bibliothèque audio et écrite',
    text: "Podcasts avec transcription allemande et traduction française, fiches de grammaire, vocabulaire du quotidien et du soin.",
  },
  {
    icon: Users,
    title: 'Betreuer certifiés',
    text: "Des tuteurs vérifiés au Cameroun et en Allemagne, en présentiel ou en ligne, réservables directement depuis l'application.",
  },
  {
    icon: HeartHandshake,
    title: 'Filière Pflege',
    text: "Vocabulaire hospitalier, préparation à l'entretien en clinique et programme de formation soignant sur trois ans.",
  },
  {
    icon: Building2,
    title: 'Démarches ambassade & VFS Global',
    text: "Traduction des diplômes, Ausbildungsvertrag, Vorstellungsgespräch, dossier de visa : chaque étape documentée.",
  },
  {
    icon: Smartphone,
    title: 'Paiement Mobile Money',
    text: "Orange Money, MTN MoMo, PayPal et carte bancaire. Aucun compte bancaire n'est nécessaire pour s'abonner.",
  },
];

const STEPS = [
  { n: 1, title: 'Crée ton compte', text: "Inscription en une minute avec ton numéro WhatsApp et ton pays. Un code de vérification confirme ton identité." },
  { n: 2, title: 'Situe ton niveau', text: "Un test de positionnement rapide place ton parcours au bon niveau, de A1 à B2, ou choisis-le toi-même." },
  { n: 3, title: 'Travaille chaque jour', text: "Mots du jour, examens blancs, podcasts et fiches : un programme cohérent au lieu d'une pile de PDF." },
  { n: 4, title: 'Prépare ton départ', text: "Betreuer, contrat de travail, Ausbildung, ambassade : l'après-B2 est accompagné jusqu'à l'arrivée en Allemagne." },
];

const TESTIMONIALS = [
  {
    name: 'Marceline A.',
    role: 'Infirmière — arrivée à Düsseldorf',
    text: "J'ai validé mon B2 telc en six mois avec les Modelltests et une Betreuer. L'accompagnement pour le dossier VFS m'a évité deux refus.",
    rating: 5,
  },
  {
    name: 'Yannick F.',
    role: 'Ausbildung mécatronique — Stuttgart',
    text: "Le guide « je ne sais pas par où commencer » m'a servi de feuille de route pendant un an. Chaque étape était claire, sans intermédiaire payant.",
    rating: 5,
  },
  {
    name: 'Priscille N.',
    role: 'Étudiante — Leipzig',
    text: "Les podcasts avec transcription m'ont débloqué la compréhension orale. Je révisais dans les embouteillages de Douala.",
    rating: 4,
  },
];

const FAQ = [
  {
    q: "Faut-il un compte bancaire pour s'abonner ?",
    a: "Non. Orange Money et MTN Mobile Money suffisent. PayPal et la carte bancaire restent disponibles pour les membres de la diaspora.",
  },
  {
    q: "L'application fonctionne-t-elle hors connexion ?",
    a: "Les contenus déjà ouverts restent consultables, et les podcasts se téléchargent pour être écoutés sans data.",
  },
  {
    q: 'Les Betreuer sont-ils vérifiés ?',
    a: "Oui. Chaque tuteur fournit son diplôme de langue et une pièce d'identité, vérifiés manuellement avant publication de son profil.",
  },
  {
    q: 'Puis-je gagner de l’argent en parrainant ?',
    a: "Oui. Chaque filleul qui passe Premium te crédite un bonus, utilisable pour ton propre abonnement ou retirable en Mobile Money.",
  },
  {
    q: 'Que se passe-t-il après mon B2 ?',
    a: "C'est là que le travail sérieux commence : recherche de contrat, Ausbildung ou Studium, préparation de l'entretien, dossier ambassade et installation en Allemagne.",
  },
];

export const LandingWeb: React.FC = () => {
  const { navigate } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jump = (href: string) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#EDE7DD] text-[#241F18]">
      {/* ------------------------------------------------------- NAVBAR */}
      <header
        className={`sticky top-0 z-40 transition-all ${
          scrolled ? 'bg-[#EDE7DD]/95 backdrop-blur border-b border-[#E4DCCB]' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-6">
          <Link to={ROUTES.landing} className="flex items-center gap-2.5 shrink-0">
            <img src="/assets/logos/logo_terracotta.jpg" alt="" className="h-9 w-auto object-contain" />
            <span className="font-serif font-extrabold text-base tracking-tight">
              Mon Projet <span className="text-[#C0512F]">MBENG</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7" aria-label="Navigation principale">
            {NAV.map((n) => (
              <button
                key={n.href}
                type="button"
                onClick={() => jump(n.href)}
                className="text-[13px] font-semibold text-[#3A3226] hover:text-[#C0512F] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 rounded px-1 py-1"
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              to={ROUTES.user.login}
              className="text-[13px] font-bold text-[#241F18] hover:text-[#C0512F] transition-colors px-3 py-2 rounded-lg"
            >
              Se connecter
            </Link>
            <Link
              to={ROUTES.user.register}
              className="text-[13px] font-bold text-white bg-[#C0512F] hover:bg-[#A8452A] active:bg-[#8F3B24] px-4 py-2.5 rounded-xl transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#E4DCCB] transition-colors"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-[#E4DCCB] bg-[#EDE7DD] px-5 py-4 flex flex-col gap-1 animate-fade-in">
            {NAV.map((n) => (
              <button
                key={n.href}
                type="button"
                onClick={() => jump(n.href)}
                className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#3A3226] hover:bg-white transition-colors"
              >
                {n.label}
              </button>
            ))}
            <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-[#E4DCCB]">
              <Link to={ROUTES.user.login} className="px-3 py-2.5 rounded-xl text-sm font-bold text-[#241F18] border border-[#E4DCCB] text-center">
                Se connecter
              </Link>
              <Link to={ROUTES.user.register} className="px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-[#C0512F] text-center">
                Commencer gratuitement
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ---------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden bg-[#241F18] text-white">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#C0512F]/12 border border-[#C0512F]/25 px-3 py-1.5 rounded-full">
              Cameroun → Allemagne
            </span>
            <h1 className="font-serif font-extrabold text-4xl lg:text-[52px] leading-[1.08] tracking-tight mt-5">
              Apprends l'allemand.<br />
              Prépare ton départ.<br />
              <span className="text-[#C0512F]">Réussis ton installation.</span>
            </h1>
            <p className="text-[15px] text-[#C7BDA8] mt-5 max-w-xl leading-relaxed">
              Une seule application pour passer de zéro au B2, réserver ton examen, trouver un tuteur certifié et monter
              ton dossier d'Ausbildung, de Studium ou de visa soignant — sans intermédiaire.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button
                type="button"
                onClick={() => navigate(ROUTES.user.register)}
                className="inline-flex items-center gap-2 bg-[#C0512F] hover:bg-[#A8452A] active:bg-[#8F3B24] text-white text-[15px] font-bold px-6 py-3.5 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241F18]"
              >
                Créer mon compte gratuit <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => jump('#comment-ca-marche')}
                className="inline-flex items-center gap-2 border-[1.5px] border-white/25 hover:border-white/50 hover:bg-white/5 active:bg-white/10 text-white text-[15px] font-bold px-6 py-3.5 rounded-xl transition-colors"
              >
                Comment ça marche
              </button>
            </div>

            <dl className="flex flex-wrap gap-x-10 gap-y-4 mt-12 pt-8 border-t border-white/10">
              <Stat value="4 800+" label="élèves inscrits" />
              <Stat value="A1 → B2" label="Goethe · telc · ÖSD · ECL" />
              <Stat value="24" label="conseillers sur le terrain" />
            </dl>
          </div>

          <div className="hidden lg:flex justify-center">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ FONCTIONNALITÉS */}
      <Section
        id="fonctionnalites"
        eyebrow="Ce que tu trouves dans l'application"
        title="Tout le parcours, au même endroit"
        subtitle="De la première leçon d'allemand jusqu'à ton premier mois en Allemagne."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className="p-6 rounded-2xl bg-white border border-[#E4DCCB] hover:border-[#C0512F]/40 hover:shadow-subtle transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[#FBEDE6] text-[#C0512F] flex items-center justify-center mb-4">
                  <Icon size={21} />
                </div>
                <h3 className="font-serif font-bold text-[17px] text-[#241F18] leading-snug">{f.title}</h3>
                <p className="text-[13px] text-[#8A8173] mt-2 leading-relaxed">{f.text}</p>
              </article>
            );
          })}
        </div>
      </Section>

      {/* ------------------------------------------- COMMENT ÇA MARCHE */}
      <Section
        id="comment-ca-marche"
        eyebrow="En quatre étapes"
        title="Comment ça marche"
        subtitle="Un ordre clair, pour ne plus improviser ton projet."
        tone="soft"
      >
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <li key={s.n} className="p-6 rounded-2xl bg-white border border-[#E4DCCB] relative">
              <span className="font-serif font-extrabold text-3xl text-[#C0512F]/25 absolute top-4 right-5">
                {s.n}
              </span>
              <h3 className="font-serif font-bold text-[17px] text-[#241F18] pr-8">{s.title}</h3>
              <p className="text-[13px] text-[#8A8173] mt-2 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ----------------------------------------------------- TÉMOIGNAGES */}
      <Section
        id="temoignages"
        eyebrow="Ils sont partis"
        title="Témoignages"
        subtitle="Des parcours réels, du premier cours jusqu'au vol."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="p-6 rounded-2xl bg-white border border-[#E4DCCB] flex flex-col">
              <Quote size={20} className="text-[#C0512F]/40" />
              <blockquote className="text-[13.5px] text-[#3A3226] leading-relaxed mt-3 flex-1">« {t.text} »</blockquote>
              <div className="flex gap-0.5 mt-4" aria-label={`Note : ${t.rating} sur 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < t.rating ? 'text-[#C0512F] fill-[#C0512F]' : 'text-[#E4DCCB]'}
                  />
                ))}
              </div>
              <figcaption className="mt-3 pt-3 border-t border-[#EFE9DC]">
                <span className="block text-[13px] font-bold text-[#241F18]">{t.name}</span>
                <span className="block text-[11.5px] text-[#8A8173]">{t.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------- TÉLÉCHARGEMENT APP */}
      <section className="px-5 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto rounded-3xl bg-[#241F18] text-white overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-10 p-8 lg:p-14 items-center">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C0512F]">
                Application mobile
              </span>
              <h2 className="font-serif font-extrabold text-3xl lg:text-4xl leading-tight mt-3">
                Emporte tes cours partout
              </h2>
              <p className="text-[14.5px] text-[#C7BDA8] mt-4 leading-relaxed max-w-lg">
                Podcasts téléchargeables, mots du jour, examens blancs et messagerie avec ton Betreuer : l'application
                fonctionne dans les transports, en veille de coupure, et consomme peu de données.
              </p>

              <div className="flex flex-wrap gap-3 mt-7">
                <StoreButton line1="Bientôt sur" line2="Google Play" />
                <StoreButton line1="Bientôt sur" line2="App Store" />
              </div>

              <p className="text-[12px] text-[#8A8173] mt-5">
                En attendant, l'application est déjà utilisable depuis ton navigateur mobile :{' '}
                <Link to={ROUTES.user.root} className="text-[#C0512F] font-bold hover:underline">
                  ouvrir l'application
                </Link>
                .
              </p>
            </div>

            <div className="flex justify-center">
              <PhoneMockup compact />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ FAQ */}
      <Section id="faq" eyebrow="Questions fréquentes" title="FAQ" tone="soft">
        <div className="max-w-3xl mx-auto flex flex-col gap-2.5">
          {FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className="rounded-2xl bg-white border border-[#E4DCCB] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-[#FAF7F2] active:bg-[#F5F1EA] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C0512F]/40"
                >
                  <span className="text-[14px] font-bold text-[#241F18]">{item.q}</span>
                  <ChevronDown
                    size={17}
                    className={`text-[#8A8173] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <p className="px-5 pb-5 text-[13.5px] text-[#8A8173] leading-relaxed animate-fade-in">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* --------------------------------------------------------- TARIFS */}
      <Section
        id="tarifs"
        eyebrow="Sans engagement"
        title="Tarifs"
        subtitle="Le socle est gratuit. Premium débloque les examens blancs illimités, les Betreuer et l'accompagnement complet."
      >
        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {PREMIUM_PLANS.map((plan) => {
            const highlight = 'popular' in plan && plan.popular;
            return (
              <article
                key={plan.id}
                className={`p-6 rounded-2xl border flex flex-col relative ${
                  highlight ? 'bg-[#241F18] text-white border-[#3A3226]' : 'bg-white border-[#E4DCCB]'
                }`}
              >
                {highlight && (
                  <span className="absolute -top-2.5 left-6 text-[10px] font-bold uppercase tracking-wider bg-[#C0512F] text-white px-2.5 py-1 rounded-full">
                    Le plus choisi
                  </span>
                )}
                <h3 className={`font-serif font-bold text-lg ${highlight ? 'text-white' : 'text-[#241F18]'}`}>
                  {plan.label}
                </h3>
                <p className={`text-[11.5px] mt-0.5 ${highlight ? 'text-[#C7BDA8]' : 'text-[#8A8173]'}`}>{plan.note}</p>
                <p className={`font-serif font-extrabold text-3xl mt-4 ${highlight ? 'text-white' : 'text-[#241F18]'}`}>
                  {fcfa(plan.price)}
                </p>

                <ul className={`flex flex-col gap-2 mt-5 flex-1 text-[12.5px] ${highlight ? 'text-[#C7BDA8]' : 'text-[#3A3226]'}`}>
                  {[
                    'Bibliothèque complète et examens blancs illimités',
                    'Contacter et réserver des cours avec un Betreuer',
                    'Accompagnement Ausbildung / Studium détaillé',
                    'Aucune publicité',
                    '20 % de réduction avec un code de parrainage',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={14} className="text-[#2F9E6E] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => navigate(ROUTES.user.register)}
                  className={`mt-6 w-full py-3 rounded-xl text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F] ${
                    highlight
                      ? 'bg-[#C0512F] text-white hover:bg-[#A8452A] active:bg-[#8F3B24]'
                      : 'border-[1.5px] border-[#E4DCCB] text-[#241F18] hover:bg-[#F5F1EA] active:bg-[#EFE4D5]'
                  }`}
                >
                  Choisir {plan.label.toLowerCase()}
                </button>
              </article>
            );
          })}
        </div>

        <p className="text-center text-[12px] text-[#8A8173] mt-6">
          Paiement par Orange Money, MTN Mobile Money, PayPal ou carte bancaire. Résiliable à tout moment.
        </p>
      </Section>

      {/* --------------------------------------------------------- FOOTER */}
      <footer className="bg-[#241F18] text-[#C7BDA8]">
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <img src="/assets/logos/logo_terracotta.jpg" alt="" className="h-9 w-auto object-contain" />
              <span className="font-serif font-extrabold text-base text-white">
                Mon Projet <span className="text-[#C0512F]">MBENG</span>
              </span>
            </div>
            <p className="text-[13px] mt-4 max-w-sm leading-relaxed">
              Préparation linguistique, accompagnement administratif et intégration professionnelle pour les projets
              camerounais vers l'Allemagne.
            </p>
          </div>

          <FooterColumn
            title="Produit"
            links={[
              { label: 'Fonctionnalités', onClick: () => jump('#fonctionnalites') },
              { label: 'Tarifs', onClick: () => jump('#tarifs') },
              { label: 'FAQ', onClick: () => jump('#faq') },
            ]}
          />

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white mb-3">Compte</h4>
            <ul className="flex flex-col gap-2 text-[13px]">
              <li>
                <Link to={ROUTES.user.login} className="hover:text-white transition-colors">Se connecter</Link>
              </li>
              <li>
                <Link to={ROUTES.user.register} className="hover:text-white transition-colors">Créer un compte</Link>
              </li>
              <li>
                <a href="mailto:support@monprojetmbeng.com" className="hover:text-white transition-colors">
                  Nous contacter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-5 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-3 text-[11.5px]">
            <p>© {new Date().getFullYear()} Mon Projet Mbeng. Tous droits réservés.</p>
            <p>Douala · Yaoundé · Cameroun</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ------------------------------------------------------------ morceaux */

const Section: React.FC<{
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone?: 'default' | 'soft';
  children: React.ReactNode;
}> = ({ id, eyebrow, title, subtitle, tone = 'default', children }) => (
  <section id={id} className={`px-5 lg:px-8 py-16 lg:py-20 ${tone === 'soft' ? 'bg-[#E6DED1]' : ''}`}>
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#C0512F]">{eyebrow}</span>
        <h2 className="font-serif font-extrabold text-3xl lg:text-[38px] text-[#241F18] leading-tight mt-2">{title}</h2>
        {subtitle && <p className="text-[14.5px] text-[#8A8173] mt-3 leading-relaxed">{subtitle}</p>}
      </div>
      {children}
    </div>
  </section>
);

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div>
    <dt className="font-serif font-extrabold text-2xl text-white">{value}</dt>
    <dd className="text-[12px] text-[#8A8173] mt-0.5">{label}</dd>
  </div>
);

const StoreButton: React.FC<{ line1: string; line2: string }> = ({ line1, line2 }) => (
  <span className="inline-flex items-center gap-3 border border-white/20 rounded-xl px-4 py-2.5 select-none">
    <Smartphone size={20} className="text-[#C0512F]" />
    <span className="text-left leading-tight">
      <span className="block text-[10px] text-[#8A8173]">{line1}</span>
      <span className="block text-[13.5px] font-bold text-white">{line2}</span>
    </span>
  </span>
);

const FooterColumn: React.FC<{ title: string; links: { label: string; onClick: () => void }[] }> = ({ title, links }) => (
  <div>
    <h4 className="text-[11px] font-bold uppercase tracking-wider text-white mb-3">{title}</h4>
    <ul className="flex flex-col gap-2 text-[13px]">
      {links.map((l) => (
        <li key={l.label}>
          <button type="button" onClick={l.onClick} className="hover:text-white transition-colors text-left">
            {l.label}
          </button>
        </li>
      ))}
    </ul>
  </div>
);

/** Aperçu de l'application, purement décoratif. */
const PhoneMockup: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div
    aria-hidden="true"
    className={`rounded-[36px] border-[8px] border-[#3A3226] bg-[#FAF7F2] shadow-elevation overflow-hidden ${
      compact ? 'w-[230px] h-[430px]' : 'w-[268px] h-[520px]'
    }`}
  >
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between text-[10px] font-bold text-[#241F18] border-b border-[#E4DCCB]/50">
        <span>09:41</span>
        <span className="w-16 h-3.5 bg-[#241F18] rounded-full" />
        <span>100%</span>
      </div>
      <div className="p-3.5 flex flex-col gap-2.5 overflow-hidden">
        <img src="/assets/logos/logo_terracotta.jpg" alt="" className="h-7 w-auto object-contain self-start" />
        <div className="p-3 rounded-xl bg-[#241F18] text-white">
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#8A8173] block">Reprendre</span>
          <span className="font-serif font-bold text-[13px] block mt-0.5">Goethe B1 — Modelltest 3</span>
          <div className="mt-2.5 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-[62%] bg-[#C0512F] rounded-full" />
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-[#C0512F] text-white text-[10.5px] font-bold">
          Je ne sais pas par où commencer
        </div>
        <div className="p-2.5 rounded-xl bg-[#FBEDE6] border border-[#C0512F]/20 text-[10.5px] font-bold text-[#241F18]">
          Tes mots du jour t'attendent
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['Bibliothèque', 'Examens blancs', 'Betreuer', 'Parrainage'].map((label) => (
            <div key={label} className="p-2.5 rounded-xl bg-white border border-[#E4DCCB] text-[10px] font-bold text-[#241F18]">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['Contrat de travail', "S'intégrer"].map((label) => (
            <div key={label} className="p-2.5 rounded-xl bg-[#241F18] text-[#FAF7F2] text-[10px] font-bold h-14 flex items-end">
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
