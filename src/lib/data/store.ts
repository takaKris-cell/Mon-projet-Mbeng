/**
 * Store applicatif — l'équivalent local de la base PostgreSQL.
 *
 * C'est le SEUL module qui détient l'état mutable des données métier. Aucun
 * composant React n'y accède directement : tout passe par `lib/api`, qui
 * impose au préalable session + rôle + journalisation. C'est aussi le point de
 * bascule unique vers Supabase : remplacer ce fichier et `lib/api/*` suffit,
 * sans toucher à un seul écran.
 */
import * as seed from './seed';
import type {
  AdminAccess,
  AgentClient,
  AgentProfile,
  ApiKeyRecord,
  AuditLogEntry,
  Charge,
  ContentResource,
  MarketingCampaign,
  PaymentTransaction,
  PayoutRequest,
  PortalScope,
  Profile,
  ReferralRedemption,
  SystemSettings,
} from './types';
import type { MonthlyLedgerRow } from '../business/accounting';

export interface Db {
  profiles: Profile[];
  agentProfiles: AgentProfile[];
  agentClients: AgentClient[];
  payoutRequests: PayoutRequest[];
  paymentTransactions: PaymentTransaction[];
  referralRedemptions: ReferralRedemption[];
  contentResources: ContentResource[];
  marketingCampaigns: MarketingCampaign[];
  charges: Charge[];
  adminAccesses: AdminAccess[];
  apiKeys: ApiKeyRecord[];
  auditLog: AuditLogEntry[];
  settings: SystemSettings;
  ledger: MonthlyLedgerRow[];
}

export const db: Db = {
  profiles: seed.profiles,
  agentProfiles: seed.agentProfiles,
  agentClients: seed.agentClients,
  payoutRequests: seed.payoutRequests,
  paymentTransactions: seed.paymentTransactions,
  referralRedemptions: seed.referralRedemptions,
  contentResources: seed.contentResources,
  marketingCampaigns: seed.marketingCampaigns,
  charges: seed.charges,
  adminAccesses: seed.adminAccesses,
  apiKeys: seed.apiKeys,
  auditLog: seed.auditLog,
  settings: { ...seed.systemSettings },
  ledger: seed.MONTHLY_LEDGER,
};

export const metrics = seed.productMetrics;
export const DEMO_STUDENT_ID = seed.DEMO_STUDENT.id;

let sequence = 1;
export function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}_${Date.now().toString(36)}${sequence.toString(36)}`;
}

/**
 * Manuel §7 — journalisation automatique. Toute action sensible (finance,
 * accès, sécurité, contenu) écrit ici, dans la même opération que la mutation,
 * jamais « dans un second temps ».
 */
export function writeAudit(entry: {
  actorId: string;
  actorName: string;
  portal: PortalScope;
  action: string;
  targetTable?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}): AuditLogEntry {
  const row: AuditLogEntry = {
    id: nextId('aud'),
    actorId: entry.actorId,
    actorName: entry.actorName,
    portal: entry.portal,
    action: entry.action,
    targetTable: entry.targetTable ?? null,
    targetId: entry.targetId ?? null,
    metadata: entry.metadata ?? {},
    createdAt: new Date().toISOString(),
  };
  db.auditLog.unshift(row);
  return row;
}

/**
 * Manuel §4.3 — idempotence obligatoire pour toute opération d'argent.
 * Une même clé rejouée ne produit aucun effet supplémentaire.
 */
const idempotencyRegistry = new Map<string, unknown>();

export function withIdempotency<T>(key: string, produce: () => T): T {
  if (idempotencyRegistry.has(key)) return idempotencyRegistry.get(key) as T;
  const result = produce();
  idempotencyRegistry.set(key, result);
  return result;
}
