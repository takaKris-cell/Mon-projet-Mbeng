/**
 * Types d'INTERFACE du Portail Utilisateur (machine à états des écrans).
 *
 * Les types de DONNÉES (profils, agents, paiements, commissions…) vivent dans
 * `lib/data/types.ts`, aux côtés du store et de l'API : il n'existe qu'une
 * seule définition par entité métier.
 */

export type UserScreen =
  | 'welcome'
  | 'login'
  | 'register'
  | 'otp'
  | 'placement_test'
  | 'home'
  | 'messages'
  | 'chat'
  | 'guide_orientation'
  | 'guide_step'
  | 'contact_custom'
  | 'words_of_day'
  | 'library'
  | 'exams_intro'
  | 'exam_simulation'
  | 'betreuer_marketplace'
  | 'betreuer_profile'
  | 'betreuer_filter_modal'
  | 'become_betreuer_intro'
  | 'become_betreuer_form'
  | 'become_betreuer_pending'
  | 'become_betreuer_rejected'
  | 'become_betreuer_approved'
  | 'become_betreuer_create_offer'
  | 'referral'
  | 'book_exam'
  | 'jobs_nursing'
  | 'germany_integration'
  | 'germany_integration_detail'
  | 'nursing_training'
  | 'nursing_vocab'
  | 'post_b2'
  | 'embassy_guide'
  | 'audio_player'
  | 'account'
  | 'account_settings'
  | 'account_phone_change'
  | 'account_support'
  | 'premium_paywall'
  | 'payment_method'
  | 'payment_loading'
  | 'payment_success'
  | 'payment_failure'
  | 'payment_insufficient_funds';

export type PaymentProvider = 'orange' | 'mtn' | 'paypal' | 'card';

/** Vue simplifiée du profil connecté, telle que la consomment les écrans élève. */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  isPremium: boolean;
  avatarUrl?: string;
  referralCode: string;
  referralEarnings: number;
  referralCount: number;
  city: string;
  targetGoal: string;
}
