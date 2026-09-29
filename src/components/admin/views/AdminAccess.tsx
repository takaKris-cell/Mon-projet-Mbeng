/**
 * « Accès & rôles » — audit §6.
 * Rétablit : le bouton « Nommer quelqu'un » (invitation d'un associé /
 * partenaire), l'action « Modifier » par ligne, la colonne d'accès STRUCTURÉE
 * par section (et éditable), et le statut « Invitation envoyée ».
 * La colonne 2FA devient une obligation active : tout accès touchant une
 * section financière est automatiquement marqué `requires_2fa` (Manuel §3.3).
 */
import React, { useState } from 'react';
import { Ban, Pencil, ShieldCheck, UserPlus } from 'lucide-react';
import { Button, IconButton } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../shared/Modal';
import { PageHeader, StatusBadge, TableShell, Td, Th, Tr } from '../../shared/primitives';
import { EmptyState, ErrorState, SkeletonTable } from '../../shared/states';
import { useApi, useMutation } from '../../../lib/hooks';
import { inviteAccess, listAccesses, updateAccess } from '../../../lib/api/admin';
import { human, shortDate } from '../../../lib/format';
import { useToast } from '../../shared/Toast';
import {
  ADMIN_SECTIONS, ADMIN_SECTION_LABELS,
  type AdminAccess, type AdminSection, type PermissionLevel,
} from '../../../lib/data/types';

const FINANCIAL: AdminSection[] = ['comptabilite', 'paiements', 'commerciaux', 'charges'];
const LEVELS: PermissionLevel[] = ['aucun', 'lecture', 'ecriture'];

export const AdminAccessView: React.FC = () => {
  const toast = useToast();
  const state = useApi(listAccesses);
  const invite = useMutation(inviteAccess);
  const update = useMutation(updateAccess);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAccess | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [permissions, setPermissions] = useState<Partial<Record<AdminSection, PermissionLevel>>>({});

  const touchesFinance = FINANCIAL.some((s) => (permissions[s] ?? 'aucun') !== 'aucun');

  const openInvite = () => {
    setEditing(null);
    setFullName(''); setEmail(''); setRoleLabel(''); setPermissions({});
    invite.clearError(); update.clearError();
    setOpen(true);
  };

  const openEdit = (row: AdminAccess) => {
    setEditing(row);
    setFullName(row.fullName); setEmail(row.email); setRoleLabel(row.roleLabel);
    setPermissions({ ...row.permissions });
    invite.clearError(); update.clearError();
    setOpen(true);
  };

  const submit = async () => {
    const result = editing
      ? await update.run(editing.id, { permissions, roleLabel })
      : await invite.run({ fullName, email, roleLabel, permissions });
    if (result) {
      toast.success(
        editing ? 'Permissions mises à jour.' : `Invitation envoyée à ${email}.`,
        editing
          ? 'Changement journalisé dans audit_log.'
          : "L'accès reste sans aucune capacité tant que l'invitation n'est pas acceptée.",
      );
      setOpen(false);
      state.reload();
    }
  };

  const revoke = async (row: AdminAccess) => {
    if (await update.run(row.id, { status: 'revoked' })) {
      toast.info(`Accès de ${row.fullName} révoqué.`);
      state.reload();
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Accès & rôles"
        subtitle="Permissions granulaires par section pour les associés, investisseurs et partenaires. Le Super-Admin conserve un accès total non paramétrable."
        actions={
          <Button variant="primary" size="sm" leftIcon={<UserPlus size={14} />} onClick={openInvite}>
            Nommer quelqu'un
          </Button>
        }
      />

      {update.error && <ErrorState message={update.error.message} code={update.error.code} compact />}

      {state.initialLoading ? (
        <SkeletonTable rows={4} columns={5} />
      ) : state.error || !state.data ? (
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      ) : (
        <TableShell>
          {state.data.length === 0 ? (
            <EmptyState title="Aucun accès délégué" description="Invite un associé pour lui ouvrir des sections précises." />
          ) : (
            <table className="w-full min-w-[920px] text-left">
              <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                <tr>
                  <Th>Titulaire</Th>
                  <Th>Rôle</Th>
                  <Th>Accès résumé</Th>
                  <Th>2FA</Th>
                  <Th>Statut</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9DC]">
                {state.data.map((a) => {
                  const granted = ADMIN_SECTIONS.filter((s) => (a.permissions[s] ?? 'aucun') !== 'aucun');
                  const isOwner = a.roleLabel === 'Root / Owner';
                  return (
                    <Tr key={a.id}>
                      <Td className="font-bold text-[#241F18] whitespace-nowrap">
                        {a.fullName}
                        <span className="block text-[10.5px] font-normal text-[#8A8173]">{a.email}</span>
                      </Td>
                      <Td>
                        <StatusBadge tone={isOwner ? 'accent' : 'info'}>{a.roleLabel}</StatusBadge>
                      </Td>
                      <Td>
                        {isOwner ? (
                          <span className="text-[#8A8173]">Toutes les sections (écriture)</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[380px]">
                            {granted.map((s) => (
                              <span
                                key={s}
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E4DCCB] text-[#3A3226] whitespace-nowrap"
                              >
                                {ADMIN_SECTION_LABELS[s]} ({human(a.permissions[s])})
                              </span>
                            ))}
                            {granted.length === 0 && <span className="text-[#8A8173]">Aucune section</span>}
                          </div>
                        )}
                      </Td>
                      <Td>
                        {a.requires2fa ? (
                          <StatusBadge tone={a.twoFactorActive ? 'success' : 'danger'}>
                            {a.twoFactorActive ? 'Obligatoire · active' : 'Obligatoire · à activer'}
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">Non requise</StatusBadge>
                        )}
                      </Td>
                      <Td>
                        <StatusBadge tone={a.status === 'active' ? 'success' : a.status === 'invited' ? 'warning' : 'danger'}>
                          {human(a.status)}
                        </StatusBadge>
                        <span className="block text-[10px] text-[#8A8173] mt-0.5">
                          {a.status === 'invited' ? `Envoyée le ${shortDate(a.grantedAt)}` : `Par ${a.grantedBy}`}
                        </span>
                      </Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-0.5">
                          <IconButton
                            label={`Modifier les permissions de ${a.fullName}`}
                            tone="accent"
                            disabled={isOwner}
                            onClick={() => openEdit(a)}
                          >
                            <Pencil size={15} />
                          </IconButton>
                          <IconButton
                            label={`Révoquer l'accès de ${a.fullName}`}
                            tone="danger"
                            disabled={isOwner || a.status === 'revoked' || update.pending}
                            onClick={() => revoke(a)}
                          >
                            <Ban size={15} />
                          </IconButton>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TableShell>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Modifier l'accès de ${editing.fullName}` : 'Nommer un associé ou un partenaire'}
        description="Choisis section par section ce que cette personne pourra consulter ou modifier."
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setOpen(false)}>Annuler</Button>
            <Button variant="primary" size="md" isLoading={invite.pending || update.pending} loadingLabel="Enregistrement…" onClick={submit}>
              {editing ? 'Enregistrer les permissions' : "Envoyer l'invitation"}
            </Button>
          </>
        }
      >
        {(invite.error || update.error) && (
          <div className="mb-4"><ErrorState message={(invite.error ?? update.error)!.message} code={(invite.error ?? update.error)!.code} compact /></div>
        )}

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Nom complet" placeholder="Ex. Paul Nkoulou" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={Boolean(editing)} autoFocus={!editing} />
            <Input label="Email" type="email" placeholder="associe@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={Boolean(editing)} />
            <Input label="Intitulé du rôle" placeholder="Ex. Investisseur" value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} />
          </div>

          <div>
            <span className="text-xs font-semibold text-[#8A8173] block mb-2">Permissions par section</span>
            <div className="rounded-2xl border border-[#E4DCCB] overflow-hidden">
              {ADMIN_SECTIONS.map((section, i) => {
                const current = permissions[section] ?? 'aucun';
                return (
                  <div
                    key={section}
                    className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 ${
                      i % 2 ? 'bg-[#FAF7F2]' : 'bg-white'
                    }`}
                  >
                    <span className="text-xs font-semibold text-[#241F18] flex items-center gap-2">
                      {ADMIN_SECTION_LABELS[section]}
                      {FINANCIAL.includes(section) && (
                        <span className="text-[9.5px] font-bold uppercase tracking-wide text-[#C0512F]">financier</span>
                      )}
                    </span>
                    <div className="flex gap-1">
                      {LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          aria-pressed={current === level}
                          onClick={() => setPermissions((p) => ({ ...p, [section]: level }))}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
                            current === level
                              ? 'bg-[#241F18] text-white'
                              : 'bg-white border border-[#E4DCCB] text-[#8A8173] hover:border-[#C7BDA8] hover:text-[#241F18]'
                          }`}
                        >
                          {human(level)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              touchesFinance ? 'bg-[#FBEDE6] border-[#C0512F]/25' : 'bg-[#FAF7F2] border-[#EFE9DC]'
            }`}
          >
            <ShieldCheck size={16} className={`shrink-0 mt-0.5 ${touchesFinance ? 'text-[#C0512F]' : 'text-[#8A8173]'}`} />
            <p className="text-[11.5px] leading-relaxed text-[#3A3226]">
              {touchesFinance ? (
                <>
                  Cet accès touche au moins une section financière : la{' '}
                  <strong>double authentification sera obligatoire</strong> pour ce compte. Ce n'est pas une option
                  activable, c'est une contrainte imposée par le backend.
                </>
              ) : (
                <>Aucune section financière sélectionnée : la 2FA reste recommandée mais non imposée.</>
              )}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
