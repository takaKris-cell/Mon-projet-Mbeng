/**
 * « Paramètres généraux » — audit §6.
 * Le sous-titre promettait « Sécurité 2FA, clés d'API et notifications
 * système » alors que le formulaire ne contenait que 3 champs. Les trois volets
 * existent désormais réellement, plus le journal d'audit.
 */
import React, { useEffect, useState } from 'react';
import { KeyRound, RotateCw, ShieldCheck, Trash2 } from 'lucide-react';
import { Button, IconButton } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Select } from './AdminContent';
import { PageHeader, StatusBadge, TableShell, Td, Th, Tr } from '../../shared/primitives';
import { Pagination } from '../../shared/Pagination';
import { EmptyState, ErrorState, Skeleton, SkeletonTable } from '../../shared/states';
import { useApi, useMutation } from '../../../lib/hooks';
import { getSettings, listAuditLog, revokeApiKey, rotateApiKey, updateSettings } from '../../../lib/api/admin';
import { dateTime, shortDate } from '../../../lib/format';
import { useToast } from '../../shared/Toast';
import type { SystemSettings } from '../../../lib/data/types';

export const AdminSettingsView: React.FC = () => {
  const toast = useToast();
  const state = useApi(getSettings);
  const save = useMutation(updateSettings);
  const rotate = useMutation(rotateApiKey);
  const revoke = useMutation(revokeApiKey);

  const [draft, setDraft] = useState<SystemSettings | null>(null);
  useEffect(() => {
    if (state.data) setDraft(state.data.settings);
  }, [state.data]);

  if (state.initialLoading || !draft) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Paramètres généraux" subtitle="Chargement…" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Paramètres généraux" />
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      </div>
    );
  }

  const set = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const persist = async () => {
    if (await save.run(draft)) {
      toast.success('Paramètres enregistrés.');
      state.reload();
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl">
      <PageHeader
        title="Paramètres généraux"
        subtitle="Sécurité 2FA, clés d'API, notifications système et journal d'audit."
        actions={
          <Button variant="primary" size="sm" isLoading={save.pending} loadingLabel="Enregistrement…" onClick={persist}>
            Enregistrer les modifications
          </Button>
        }
      />

      {save.error && <ErrorState message={save.error.message} code={save.error.code} compact />}

      {/* 1. Général */}
      <Panel title="Général" description="Coordonnées publiques et devises affichées.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email officiel du support" type="email" value={draft.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} />
          <Input label="Numéro WhatsApp Business" value={draft.whatsappBusinessNumber} onChange={(e) => set('whatsappBusinessNumber', e.target.value)} />
          <Input label="Devise principale" value={draft.currency} disabled helperText="Le franc CFA est arrimé à l'euro : la parité est fixe." />
          <Input label="Devise secondaire (affichage)" value={draft.secondaryCurrency} disabled />
        </div>
      </Panel>

      {/* 2. Sécurité — volet absent du live */}
      <Panel title="Sécurité" description="Double authentification et canaux de vérification.">
        <div className="flex flex-col gap-3">
          <Toggle
            label="2FA obligatoire pour tout rôle ayant accès aux finances"
            description="Contrainte imposée par le backend : un rôle marqué « requires_2fa » n'obtient pas de session complète sans second facteur."
            checked={draft.require2faForFinance}
            onChange={(v) => set('require2faForFinance', v)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Select
              label="Canal OTP principal"
              value={draft.otpPrimaryChannel}
              onChange={(v) => set('otpPrimaryChannel', v as SystemSettings['otpPrimaryChannel'])}
              options={[{ value: 'whatsapp', label: 'WhatsApp Business' }, { value: 'sms', label: 'SMS' }]}
            />
            <Select
              label="Canal de secours"
              value={draft.otpFallbackChannel}
              onChange={(v) => set('otpFallbackChannel', v as SystemSettings['otpFallbackChannel'])}
              options={[{ value: 'sms', label: 'SMS (fournisseur africain)' }, { value: 'aucun', label: 'Aucun' }]}
            />
          </div>
          <p className="text-[11.5px] text-[#8A8173] leading-relaxed">
            Le SMS n'est utilisé qu'en secours : c'est le poste de coût à surveiller. Le taux de bascule est journalisé
            à chaque envoi.
          </p>
        </div>
      </Panel>

      {/* 3. Clés d'API — volet absent du live */}
      <Panel
        title="Clés d'API"
        description="Rotation et révocation des clés WhatsApp Business et Mobile Money."
      >
        <TableShell>
          <table className="w-full min-w-[680px] text-left">
            <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
              <tr>
                <Th>Intégration</Th>
                <Th>Fournisseur</Th>
                <Th>Clé</Th>
                <Th>Dernière rotation</Th>
                <Th>Statut</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9DC]">
              {state.data.apiKeys.map((k) => (
                <Tr key={k.id}>
                  <Td className="font-bold text-[#241F18] whitespace-nowrap">{k.label}</Td>
                  <Td className="text-[#8A8173]">{k.provider}</Td>
                  <Td className="font-mono text-[#8A8173]">{k.maskedKey}</Td>
                  <Td className="text-[#8A8173] whitespace-nowrap">{shortDate(k.lastRotatedAt)}</Td>
                  <Td>
                    <StatusBadge tone={k.status === 'active' ? 'success' : 'danger'}>
                      {k.status === 'active' ? 'Active' : 'Révoquée'}
                    </StatusBadge>
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-0.5">
                      <IconButton
                        label={`Faire tourner la clé ${k.label}`}
                        tone="accent"
                        disabled={k.status === 'revoked' || rotate.pending}
                        onClick={async () => {
                          if (await rotate.run(k.id)) {
                            toast.success(`Clé « ${k.label} » renouvelée.`, 'Rotation journalisée.');
                            state.reload();
                          }
                        }}
                      >
                        <RotateCw size={15} />
                      </IconButton>
                      <IconButton
                        label={`Révoquer la clé ${k.label}`}
                        tone="danger"
                        disabled={k.status === 'revoked' || revoke.pending}
                        onClick={async () => {
                          if (await revoke.run(k.id)) {
                            toast.info(`Clé « ${k.label} » révoquée.`);
                            state.reload();
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        {(rotate.error || revoke.error) && (
          <div className="mt-3">
            <ErrorState message={(rotate.error ?? revoke.error)!.message} code={(rotate.error ?? revoke.error)!.code} compact />
          </div>
        )}
      </Panel>

      {/* 4. Notifications — volet absent du live */}
      <Panel title="Notifications système" description="Ce qui déclenche une alerte pour le Super-Admin.">
        <div className="flex flex-col gap-3">
          <Toggle
            label="Un commercial atteint son seuil et demande un virement"
            checked={draft.notifyOnPayoutRequest}
            onChange={(v) => set('notifyOnPayoutRequest', v)}
          />
          <Toggle
            label="Chute anormale du nombre d'utilisateurs actifs"
            checked={draft.notifyOnActiveUsersDrop}
            onChange={(v) => set('notifyOnActiveUsersDrop', v)}
          />
          <Toggle
            label="Nouvelle demande d'accès administratif"
            checked={draft.notifyOnNewAccessRequest}
            onChange={(v) => set('notifyOnNewAccessRequest', v)}
          />
          <Toggle
            label="Résumé hebdomadaire par email"
            checked={draft.weeklyDigestByEmail}
            onChange={(v) => set('weeklyDigestByEmail', v)}
          />
        </div>
      </Panel>

      <AuditLogPanel />
    </div>
  );
};

const Panel: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title, description, children,
}) => (
  <section className="p-5 rounded-2xl bg-white border border-[#E4DCCB]">
    <h3 className="font-serif font-bold text-base text-[#241F18]">{title}</h3>
    {description && <p className="text-[11.5px] text-[#8A8173] mt-0.5 mb-4">{description}</p>}
    {children}
  </section>
);

const Toggle: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9DC] cursor-pointer hover:border-[#E4DCCB] transition-colors">
    <span className="min-w-0">
      <span className="block text-xs font-bold text-[#241F18]">{label}</span>
      {description && <span className="block text-[11px] text-[#8A8173] mt-0.5 leading-relaxed">{description}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`shrink-0 w-11 h-6 rounded-full transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
        checked ? 'bg-[#2F9E6E]' : 'bg-[#D8CEBC]'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  </label>
);

const AuditLogPanel: React.FC = () => {
  const [page, setPage] = useState(1);
  const state = useApi(() => listAuditLog({ page, pageSize: 8 }), [page]);

  return (
    <Panel
      title="Journal d'audit"
      description="Connexions, virements, accès délégués, contenus : toute action sensible laisse une trace horodatée."
    >
      {state.initialLoading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : state.error || !state.data ? (
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} compact />
      ) : (
        <TableShell
          footer={state.data.total > 0 ? <Pagination page={state.data} onPageChange={setPage} itemLabel="entrées" /> : undefined}
        >
          {state.data.total === 0 ? (
            <EmptyState icon={<KeyRound size={22} />} title="Aucune entrée pour l'instant" />
          ) : (
            <table className="w-full min-w-[620px] text-left">
              <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                <tr>
                  <Th>Action</Th>
                  <Th>Auteur</Th>
                  <Th>Portail</Th>
                  <Th>Cible</Th>
                  <Th align="right">Horodatage</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9DC]">
                {state.data.rows.map((a) => (
                  <Tr key={a.id}>
                    <Td className="font-mono font-bold text-[#241F18] whitespace-nowrap">{a.action}</Td>
                    <Td className="text-[#241F18]">{a.actorName}</Td>
                    <Td className="text-[#8A8173]">{a.portal}</Td>
                    <Td className="font-mono text-[#8A8173] truncate max-w-[180px]">{a.targetTable ?? '—'}</Td>
                    <Td align="right" className="text-[#8A8173] whitespace-nowrap">{dateTime(a.createdAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </TableShell>
      )}
      <p className="text-[11px] text-[#8A8173] mt-3 flex items-center gap-1.5">
        <ShieldCheck size={12} className="text-[#2F9E6E]" />
        Rétention : indéfinie pour les entrées Finances et Sécurité, 2 ans minimum pour le reste.
      </p>
    </Panel>
  );
};
