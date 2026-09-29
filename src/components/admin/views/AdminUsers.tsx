/**
 * « Utilisateurs » — audit §6.
 * Rétablit : filtre « Inactifs +30 j », colonnes Email et « Inscrit via »
 * (traçabilité d'une commission en cas de litige), action « Appeler ».
 * Ajoute les actions d'administration qui manquaient à la fois à la spec et au
 * live : suspendre, réactiver, réinitialiser l'OTP, anonymiser (droit à
 * l'effacement) — chacune journalisée.
 */
import React, { useState } from 'react';
import { Ban, KeyRound, Phone, Play, UserX } from 'lucide-react';
import { Button, IconButton } from '../../ui/Button';
import { Modal } from '../../shared/Modal';
import {
  FilterChips, KpiCard, PageHeader, SearchInput, StatusBadge, TableShell, Td, Th, Tr,
} from '../../shared/primitives';
import { Pagination } from '../../shared/Pagination';
import { EmptyState, ErrorState, RefreshingOverlay, SkeletonCards, SkeletonTable } from '../../shared/states';
import { useApi, useDebounced, useMutation } from '../../../lib/hooks';
import { applyUserAction, listAdminUsers, type UserFilter } from '../../../lib/api/admin';
import { human, relativeDay, shortDate } from '../../../lib/format';
import { useToast } from '../../shared/Toast';
import type { Profile } from '../../../lib/data/types';

const FILTERS: { value: UserFilter; label: string }[] = [
  { value: 'tous', label: 'Tous' },
  { value: 'premium', label: 'Premium' },
  { value: 'gratuit', label: 'Gratuit' },
  { value: 'betreuer', label: 'Betreuer' },
  { value: 'commercial', label: 'Commerciaux' },
  { value: 'inactifs_30j', label: 'Inactifs +30 j' },
];

export const AdminUsersView: React.FC = () => {
  const toast = useToast();
  const [filter, setFilter] = useState<UserFilter>('tous');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [toAnonymize, setToAnonymize] = useState<Profile | null>(null);
  const debounced = useDebounced(search);

  const state = useApi(
    () => listAdminUsers({ filter, search: debounced, page, pageSize }),
    [filter, debounced, page, pageSize],
  );
  const action = useMutation(applyUserAction);

  const run = async (user: Profile, kind: Parameters<typeof applyUserAction>[1], message: string) => {
    if (await action.run(user.id, kind)) {
      toast.success(message, 'Action journalisée dans audit_log.');
      state.reload();
    }
  };

  if (state.initialLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Utilisateurs" subtitle="Chargement de la base…" />
        <SkeletonCards count={4} />
        <SkeletonTable rows={10} columns={7} />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Utilisateurs" />
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      </div>
    );
  }

  const { page: result, summary } = state.data;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Utilisateurs"
        subtitle={`${summary.total.toLocaleString('fr-FR')} comptes réellement accessibles, page par page.`}
        actions={<SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Nom, téléphone, email, code parrain…" className="w-full sm:w-80" />}
      />

      {action.error && <ErrorState message={action.error.message} code={action.error.code} compact />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Comptes au total" value={summary.total.toLocaleString('fr-FR')} />
        <KpiCard label="Premium" value={summary.premium.toLocaleString('fr-FR')} tone="success" />
        <KpiCard label="Betreuer" value={summary.betreuer.toLocaleString('fr-FR')} tone="accent" />
        <KpiCard
          label="Inactifs +30 j"
          value={summary.inactive30.toLocaleString('fr-FR')}
          hint="Risque de churn"
          tone="warning"
        />
      </div>

      <FilterChips options={FILTERS} value={filter} onChange={(v) => { setFilter(v); setPage(1); }} ariaLabel="Filtrer les utilisateurs" />

      <RefreshingOverlay active={state.loading && !state.initialLoading}>
        <TableShell
          footer={result.total > 0 ? (
            <Pagination page={result} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} itemLabel="comptes" />
          ) : undefined}
        >
          {result.total === 0 ? (
            <EmptyState title="Aucun utilisateur ne correspond" description="Ajuste le filtre ou la recherche." />
          ) : (
            <table className="w-full min-w-[1080px] text-left">
              <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                <tr>
                  <Th>Utilisateur</Th>
                  <Th>Téléphone</Th>
                  <Th>Email</Th>
                  <Th>Rôle</Th>
                  <Th>Niveau</Th>
                  <Th>Formule</Th>
                  <Th>Inscrit via</Th>
                  <Th>Dernière activité</Th>
                  <Th>Statut</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9DC]">
                {result.rows.map((u) => (
                  <Tr key={u.id}>
                    <Td className="font-bold text-[#241F18] whitespace-nowrap">
                      {u.fullName}
                      <span className="block text-[10.5px] font-normal text-[#8A8173]">
                        Inscrit le {shortDate(u.createdAt)}
                      </span>
                    </Td>
                    <Td className="font-mono text-[#8A8173] whitespace-nowrap">{u.phone || '—'}</Td>
                    <Td className="text-[#8A8173] truncate max-w-[200px]">{u.email}</Td>
                    <Td><StatusBadge tone={u.role === 'betreuer' ? 'accent' : u.role === 'commercial' ? 'warning' : 'neutral'}>{human(u.role)}</StatusBadge></Td>
                    <Td className="font-bold text-[#241F18]">{u.level}</Td>
                    <Td className="font-semibold text-[#1F6B47]">{human(u.subscription)}</Td>
                    <Td className="font-mono text-[#8A8173] whitespace-nowrap">{u.registeredVia ?? '—'}</Td>
                    <Td className="text-[#8A8173] whitespace-nowrap">{relativeDay(u.lastActiveAt)}</Td>
                    <Td>
                      <StatusBadge tone={u.status === 'actif' ? 'success' : u.status === 'suspendu' ? 'danger' : 'warning'}>
                        {human(u.status)}
                      </StatusBadge>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton
                          label={`Appeler ${u.fullName}`}
                          tone="accent"
                          disabled={!u.phone}
                          onClick={() => {
                            run(u, 'call', `Appel vers ${u.fullName} déclenché.`);
                            window.location.href = `tel:${u.phone}`;
                          }}
                        >
                          <Phone size={15} />
                        </IconButton>
                        <IconButton
                          label={`Réinitialiser l'OTP de ${u.fullName}`}
                          disabled={action.pending}
                          onClick={() => run(u, 'reset_otp', `OTP réinitialisé pour ${u.fullName}.`)}
                        >
                          <KeyRound size={15} />
                        </IconButton>
                        <IconButton
                          label={u.status === 'suspendu' ? `Réactiver ${u.fullName}` : `Suspendre ${u.fullName}`}
                          tone={u.status === 'suspendu' ? 'success' : 'neutral'}
                          disabled={action.pending || u.status === 'anonymise'}
                          onClick={() =>
                            run(
                              u,
                              u.status === 'suspendu' ? 'reactivate' : 'suspend',
                              `${u.fullName} — compte ${u.status === 'suspendu' ? 'réactivé' : 'suspendu'}.`,
                            )
                          }
                        >
                          {u.status === 'suspendu' ? <Play size={15} /> : <Ban size={15} />}
                        </IconButton>
                        <IconButton
                          label={`Anonymiser ${u.fullName}`}
                          tone="danger"
                          disabled={action.pending || u.status === 'anonymise'}
                          onClick={() => setToAnonymize(u)}
                        >
                          <UserX size={15} />
                        </IconButton>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </TableShell>
      </RefreshingOverlay>

      <Modal
        open={Boolean(toAnonymize)}
        onClose={() => setToAnonymize(null)}
        title="Anonymiser ce compte ?"
        description="Droit à l'effacement — action irréversible."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setToAnonymize(null)}>Annuler</Button>
            <Button
              variant="danger"
              size="md"
              isLoading={action.pending}
              loadingLabel="Anonymisation…"
              onClick={async () => {
                if (!toAnonymize) return;
                await run(toAnonymize, 'anonymize', `${toAnonymize.fullName} a été anonymisé.`);
                setToAnonymize(null);
              }}
            >
              Anonymiser définitivement
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-[#3A3226] leading-relaxed">
          Le nom, l'email, le numéro de téléphone et la ville de{' '}
          <strong className="text-[#241F18]">{toAnonymize?.fullName}</strong> seront effacés définitivement.
        </p>
        <p className="text-[12px] text-[#8A8173] leading-relaxed mt-2">
          La ligne est conservée sans donnée personnelle pour que la comptabilité et les commissions déjà versées
          restent vérifiables. L'opération est tracée dans <code className="font-mono">audit_log</code>.
        </p>
      </Modal>
    </div>
  );
};
