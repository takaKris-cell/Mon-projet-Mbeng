/**
 * Portail Utilisateur (application élève).
 *
 * État par défaut : NON connecté. Les écrans Bienvenue / Connexion /
 * Inscription / Vérification sont des routes publiques ; tout le reste n'est
 * monté qu'une fois une session `user` valide obtenue.
 * Sur écran large l'application est présentée dans un cadre téléphone ; sur
 * mobile elle occupe tout l'écran.
 */
import React, { useEffect, useMemo, useState } from 'react';
import type { Session } from '../../lib/auth/session';
import type { UserProfile, UserScreen } from '../../types';
import type { Profile } from '../../lib/data/types';
import { useApi, useIsMobile } from '../../lib/hooks';
import { getProfile } from '../../lib/api/user';
import { useRouter, ROUTES } from '../../lib/router';
import { DEFAULT_COUNTRY, type CountryCode } from '../../lib/validation';
import type { OtpTicket } from '../../lib/api/otp';
import { ErrorState, Skeleton } from '../shared/states';

import { BottomNav } from '../ui/BottomNav';
import { WelcomeView } from './views/WelcomeView';
import { AuthView } from './views/AuthView';
import { OtpView } from './views/OtpView';
import { PlacementTestView } from './views/PlacementTestView';
import { HomeView } from './views/HomeView';
import { WordsOfDayView } from './views/WordsOfDayView';
import { LibraryView } from './views/LibraryView';
import { ExamsIntroView } from './views/ExamsIntroView';
import { ExamSimulationView } from './views/ExamSimulationView';
import { GuideOrientationView } from './views/GuideOrientationView';
import { GuideStepDetailView } from './views/GuideStepDetailView';
import { CustomContactModal } from './views/CustomContactModal';
import { BetreuerMarketplaceView } from './views/BetreuerMarketplaceView';
import { BetreuerProfileView } from './views/BetreuerProfileView';
import { BecomeBetreuerFlow } from './views/BecomeBetreuerFlow';
import { ReferralView } from './views/ReferralView';
import { BookExamView } from './views/BookExamView';
import { JobsNursingView } from './views/JobsNursingView';
import { GermanyIntegrationView } from './views/GermanyIntegrationView';
import { NursingTrainingView } from './views/NursingTrainingView';
import { NursingVocabView } from './views/NursingVocabView';
import { PostB2View } from './views/PostB2View';
import { EmbassyGuideView } from './views/EmbassyGuideView';
import { AudioPlayerView } from './views/AudioPlayerView';
import { AccountView } from './views/AccountView';
import { PaymentTunnelView } from './views/PaymentTunnelView';
import { MessagesView } from './views/MessagesView';
import { ChatView } from './views/ChatView';
import type { BetreuerRecord } from '../../data/content';
import { sampleBetreuers } from '../../data/content';

interface UserPortalProps {
  session: Session | null;
  onAuthenticated: () => void;
  onSignOut: () => void;
}

/** Adaptateur : le modèle de données interne vers la forme attendue par les écrans. */
function toLegacyProfile(p: Profile): UserProfile {
  return {
    id: p.id,
    name: p.fullName,
    email: p.email,
    phone: p.phone,
    level: p.level,
    isPremium: p.isPremium,
    referralCode: p.referralCode,
    referralEarnings: p.referralCredits,
    referralCount: p.referralCount,
    city: p.city,
    targetGoal: 'Projet Allemagne',
  };
}

export const UserPortal: React.FC<UserPortalProps> = ({ session, onAuthenticated, onSignOut }) => {
  const { path, navigate, query } = useRouter();
  const isMobile = useIsMobile();

  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [pendingPhone, setPendingPhone] = useState('');
  const [otpTicket, setOtpTicket] = useState<OtpTicket | null>(null);

  const referralFromUrl = query.get('code') ?? undefined;

  /* ---------------------------------------------------- non connecté */

  // Toute route protégée du portail renvoie vers l'écran Bienvenue.
  useEffect(() => {
    if (session) return;
    const publicRoutes: string[] = [
      ROUTES.user.welcome, ROUTES.user.login, ROUTES.user.register, ROUTES.user.otp,
    ];
    if (!publicRoutes.includes(path)) navigate(ROUTES.user.welcome, { replace: true });
  }, [session, path, navigate]);

  if (!session) {
    const authScreen =
      path === ROUTES.user.login ? 'login'
      : path === ROUTES.user.register ? 'register'
      : path === ROUTES.user.otp ? 'otp'
      : 'welcome';

    return (
      <DeviceFrame isMobile={isMobile}>
        {authScreen === 'welcome' && (
          <WelcomeView
            countryCode={countryCode}
            onCountryChange={setCountryCode}
            onContinue={() => navigate(referralFromUrl ? ROUTES.user.register : ROUTES.user.login)}
          />
        )}

        {(authScreen === 'login' || authScreen === 'register') && (
          <AuthView
            mode={authScreen}
            countryCode={countryCode}
            onCountryChange={setCountryCode}
            presetReferralCode={referralFromUrl}
            onSwitchMode={(next) => navigate(next === 'login' ? ROUTES.user.login : ROUTES.user.register)}
            onLoggedIn={() => { onAuthenticated(); navigate(ROUTES.user.root, { replace: true }); }}
            onOtpRequired={(phone, ticket) => {
              setPendingPhone(phone);
              setOtpTicket(ticket);
              navigate(ROUTES.user.otp);
            }}
            onBack={() => navigate(ROUTES.user.welcome)}
          />
        )}

        {authScreen === 'otp' && (
          <OtpView
            phone={pendingPhone}
            ticket={otpTicket}
            onVerified={() => { onAuthenticated(); navigate(ROUTES.user.root, { replace: true }); }}
            onBack={() => navigate(ROUTES.user.register)}
          />
        )}
      </DeviceFrame>
    );
  }

  return (
    <DeviceFrame isMobile={isMobile}>
      <AuthenticatedApp onSignOut={onSignOut} />
    </DeviceFrame>
  );
};

/* ------------------------------------------------- application connectée */

const AuthenticatedApp: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => {
  const profileState = useApi(getProfile);
  const [screen, setScreen] = useState<UserScreen>('home');
  const [selectedBetreuer, setSelectedBetreuer] = useState<BetreuerRecord>(sampleBetreuers[0]);
  const [selectedStep, setSelectedStep] = useState(1);

  const navigateTo = (next: UserScreen) => {
    setScreen(next);
    document.querySelector('[data-app-scroll]')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const user = useMemo(
    () => (profileState.data ? toLegacyProfile(profileState.data) : null),
    [profileState.data],
  );

  if (profileState.initialLoading) {
    return (
      <div className="p-5 flex flex-col gap-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (profileState.error || !user) {
    return (
      <div className="p-5">
        <ErrorState
          message={profileState.error?.message ?? 'Impossible de charger ton compte.'}
          code={profileState.error?.code}
          onRetry={profileState.reload}
        />
      </div>
    );
  }

  const showBottomNav = ['home', 'library', 'betreuer_marketplace', 'account'].includes(screen);

  const content = (() => {
    switch (screen) {
      case 'home':
        return <HomeView user={user} onNavigate={navigateTo} onOpenMessages={() => navigateTo('messages')} />;
      case 'messages':
        return <MessagesView onBack={() => navigateTo('home')} onOpenChatWithBetreuer={() => navigateTo('chat')} />;
      case 'chat':
        return (
          <ChatView
            onBack={() => navigateTo('messages')}
            onViewProfile={() => navigateTo('betreuer_profile')}
            onGoPremium={() => navigateTo('premium_paywall')}
            isPremium={user.isPremium}
          />
        );
      case 'words_of_day':
        return <WordsOfDayView onBack={() => navigateTo('home')} onFinish={() => navigateTo('home')} />;
      case 'library':
        return <LibraryView onOpenAudio={() => navigateTo('audio_player')} onOpenExam={() => navigateTo('exams_intro')} />;
      case 'exams_intro':
        return (
          <ExamsIntroView
            isPremium={user.isPremium}
            onBack={() => navigateTo('home')}
            onStartSimulation={() => navigateTo('exam_simulation')}
            onGoPremium={() => navigateTo('premium_paywall')}
          />
        );
      case 'exam_simulation':
        return <ExamSimulationView onBack={() => navigateTo('exams_intro')} onGoPremium={() => navigateTo('premium_paywall')} />;
      case 'guide_orientation':
        return (
          <GuideOrientationView
            onBack={() => navigateTo('home')}
            onSelectStep={(n) => { setSelectedStep(n); navigateTo('guide_step'); }}
            onOpenContact={() => navigateTo('contact_custom')}
          />
        );
      case 'guide_step':
        return (
          <GuideStepDetailView
            stepNumber={selectedStep}
            isPremium={user.isPremium}
            onBack={() => navigateTo('guide_orientation')}
            onGoPremium={() => navigateTo('premium_paywall')}
          />
        );
      case 'contact_custom':
        return <CustomContactModal onBack={() => navigateTo('guide_orientation')} defaultPhone={user.phone} defaultName={user.name} />;
      case 'betreuer_marketplace':
        return (
          <BetreuerMarketplaceView
            onSelectBetreuer={(b) => { setSelectedBetreuer(b); navigateTo('betreuer_profile'); }}
            onBecomeBetreuer={() => navigateTo('become_betreuer_intro')}
          />
        );
      case 'betreuer_profile':
        return (
          <BetreuerProfileView
            betreuer={selectedBetreuer}
            onBack={() => navigateTo('betreuer_marketplace')}
            onBookSession={() => navigateTo('payment_method')}
            onOpenChat={() => navigateTo('chat')}
          />
        );
      case 'become_betreuer_intro':
      case 'become_betreuer_form':
      case 'become_betreuer_pending':
      case 'become_betreuer_rejected':
      case 'become_betreuer_approved':
      case 'become_betreuer_create_offer':
        return <BecomeBetreuerFlow onBack={() => navigateTo('home')} onFinishPublished={() => navigateTo('betreuer_marketplace')} />;
      case 'referral':
        return (
          <ReferralView
            onBack={() => navigateTo('home')}
            onConvertToPremium={() => { profileState.reload(); navigateTo('home'); }}
          />
        );
      case 'book_exam':
        return <BookExamView onBack={() => navigateTo('home')} onProceedToPayment={() => navigateTo('payment_method')} />;
      case 'jobs_nursing':
        return <JobsNursingView onBack={() => navigateTo('home')} onApplyJob={() => navigateTo('contact_custom')} />;
      case 'germany_integration':
        return <GermanyIntegrationView onBack={() => navigateTo('home')} onOpenCustomContact={() => navigateTo('contact_custom')} />;
      case 'nursing_training':
        return (
          <NursingTrainingView
            onBack={() => navigateTo('home')}
            onOpenVocab={() => navigateTo('nursing_vocab')}
            onGoPremium={() => navigateTo('premium_paywall')}
          />
        );
      case 'nursing_vocab':
        return <NursingVocabView onBack={() => navigateTo('nursing_training')} />;
      case 'post_b2':
        return (
          <PostB2View
            onBack={() => navigateTo('home')}
            onOpenEmbassyGuide={() => navigateTo('embassy_guide')}
            onOpenCustomContact={() => navigateTo('contact_custom')}
          />
        );
      case 'embassy_guide':
        return <EmbassyGuideView onBack={() => navigateTo('post_b2')} onGoPremium={() => navigateTo('premium_paywall')} />;
      case 'audio_player':
        return <AudioPlayerView onBack={() => navigateTo('home')} />;
      case 'account':
        return (
          <AccountView
            user={user}
            onNavigate={navigateTo}
            onGoPremium={() => navigateTo('premium_paywall')}
            onLogout={onSignOut}
            onProfileChanged={profileState.reload}
          />
        );
      case 'premium_paywall':
      case 'payment_method':
        return (
          <PaymentTunnelView
            onBack={() => navigateTo('home')}
            onPaymentSuccess={() => { profileState.reload(); navigateTo('home'); }}
          />
        );
      default:
        return <HomeView user={user} onNavigate={navigateTo} onOpenMessages={() => navigateTo('messages')} />;
    }
  })();

  return (
    <>
      <div className="flex-1 overflow-y-auto" data-app-scroll>
        {content}
      </div>
      {showBottomNav && <BottomNav currentScreen={screen} onNavigate={navigateTo} />}
    </>
  );
};

/* ---------------------------------------------------------- présentation */

const DeviceFrame: React.FC<{ isMobile: boolean; children: React.ReactNode }> = ({ isMobile, children }) => {
  if (isMobile) {
    return <div className="min-h-screen bg-[#FAF7F2] flex flex-col">{children}</div>;
  }
  return (
    <div className="min-h-screen bg-[#EDE7DD] flex justify-center py-6 px-4">
      <div className="w-full max-w-[420px] bg-[#FAF7F2] flex flex-col overflow-hidden shadow-elevation rounded-[36px] border-[8px] border-[#241F18] ring-1 ring-[#3A3226] min-h-[840px]">
        <div className="w-full bg-[#FAF7F2] pt-2 pb-1 px-6 flex items-center justify-between text-[11px] font-bold text-[#241F18] select-none shrink-0 border-b border-[#E4DCCB]/40">
          <span>09:41</span>
          <span className="w-20 h-4 bg-[#241F18] rounded-full" />
          <span className="text-[10px]">100%</span>
        </div>
        {children}
      </div>
    </div>
  );
};
