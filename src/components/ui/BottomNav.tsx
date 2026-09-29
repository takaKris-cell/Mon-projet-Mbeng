import React from 'react';
import { Home, BookOpen, Users, User, LucideIcon } from 'lucide-react';
import { UserScreen } from '../../types';

interface BottomNavProps {
  currentScreen: UserScreen;
  onNavigate: (screen: UserScreen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const items: { label: string; screen: UserScreen; icon: LucideIcon }[] = [
    { label: 'Accueil', screen: 'home', icon: Home },
    { label: 'Bibliothèque', screen: 'library', icon: BookOpen },
    { label: 'Betreuer', screen: 'betreuer_marketplace', icon: Users },
    { label: 'Compte', screen: 'account', icon: User },
  ];

  const isItemActive = (screen: UserScreen) => {
    if (currentScreen === screen) return true;
    if (screen === 'home' && ['words_of_day', 'exams_intro'].includes(currentScreen)) return true;
    if (screen === 'betreuer_marketplace' && ['betreuer_profile'].includes(currentScreen)) return true;
    if (screen === 'account' && ['account_settings', 'account_support'].includes(currentScreen)) return true;
    return false;
  };

  return (
    <nav className="w-full bg-[#FAF7F2]/95 backdrop-blur border-t border-[#E4DCCB] px-3 pt-3.5 pb-5 flex items-center justify-around select-none">
      {items.map((item) => {
        const active = isItemActive(item.screen);
        const IconComponent = item.icon;
        return (
          <button
            key={item.screen}
            type="button"
            onClick={() => onNavigate(item.screen)}
            className="flex flex-col items-center gap-1 group py-1 px-3 transition-transform active:scale-95"
          >
            <div className={`transition-colors ${active ? 'text-[#C0512F]' : 'text-[#8A8173] group-hover:text-[#241F18]'}`}>
              <IconComponent size={20} strokeWidth={active ? 2.5 : 2} />
            </div>
            <span
              className={`text-[11px] font-semibold transition-colors ${
                active ? 'text-[#C0512F] font-bold' : 'text-[#8A8173] group-hover:text-[#241F18]'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
