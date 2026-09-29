/**
 * « Paiements » — audit §2.3.3 et §2.3.4.
 *
 * Deux onglets DISTINCTS :
 *  1. « Virements sortants » : la file de demandes qui n'existait nulle part.
 *     4 cartes de synthèse, filtres En attente / Payés / Rejetés, actions
 *     « Marquer payé » (référence de transaction OBLIGATOIRE) et « Rejeter »
 *     (motif OBLIGATOIRE), plus la section séparée « Crédits parrainage
 *     utilisés pour Premium » (rachat par solde, sans mouvement de cash réel).
 *  2. « Encaissements élèves » : le journal des paiements entrants déjà
 *     développé, conservé — mais sur son propre onglet, pas à la place de la
 *     file de virements.
 */
import React, { useState } from 'react';
import { Check, Download, Gift, Inbox, Send, X } from 'lucide-react';
import { Button, IconButton } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../shared/Modal';
import {
  FilterChips, KpiCard, PageHeader, SearchInput, StatusBadge, TableShell, Td, Th, Tr,
} from '../../shared/primitives';
import { Pagination } from '../../shared/Pagination';
import { EmptyState, ErrorState, RefreshingOverlay, SkeletonCards, SkeletonTable } from '../../shared/states';
import { useApi, useDebounced, useMutation } from '../../../lib/hooks';
import {
  exportIncomingPaymentsCsv, listIncomingPayments, listPayoutRequests, listReferralRedemptions,
  markPayoutPaid, rejectPayout, type PayoutFilter,
} from '../../../lib/api/admin';
import { dateTime, fcfa, human, relativeDay } from '../../../lib/format';
import { useToast } from '../../shared/Toast';
import type { PayoutRequest } from '../../../lib/data/types';

type Tab = 'sortants' | 'entrants';

export const AdminPaymentsView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('sortants');

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Paiements"
        subtitle="Les virements SORTANTS (commissions et parrainage) et les encaissements ENTRANTS des élèves sont deux flux distincts, sur deux onglets distincts."
        actions={
          <FilterChips
            options={[
              { value: 'sortants', label: 'Virements sortants' },
              { value: 'entrants', label: 'Encaissements élèves' },
            ]}
            value={tab}
            onChange={setTab}
            ariaLabel="Type de flux"
          />
        }
      />
      {tab === 'sortants' ? <OutgoingPayouts /> : <IncomingPayments />}
    </div>
  );
};

/* ------------------------------------------------ 1. virements sortants */

const PAYOUT_FILTERS: { value: PayoutFilter; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'paid', label: 'Payés' },
  { value: 'rejected', label: 'Rejetés' },
  { value: 'tous', label: 'Tous' },
];

const OutgoingPayouts: React.FC = () => {
  const toast = useToast();
  const [filter, setFilter] = useState<PayoutFilter>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debounced = useDebounced(search);

  const [payDialog, setPayDialog] = useState<PayoutRequest | null>(null);
  const [rejectDialog, setRejectDialog] = useState<PayoutRequest | null>(null);
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');

  const state = useApi(
    () => listPayoutRequests({ filter, search: debounced, page, pageSize }),
    [filter, debounced, page, pageSize],
  );
  const pay = useMutation(markPayoutPaid);
  const decline = useMutation(rejectPayout);

  const confirmPay = async () => {
    if (!payDialog) return;
    const result = await pay.run(payDialog.id, reference);
    if (result) {
      toast.success(
        `Virement de ${fcfa(result.amount)} marqué payé.`,
        `Référence ${result.transactionReference} enregistrée et journalisée.`,
      );
      setPayDialog(null);
      setReference('');
      state.reload();
    }
  };

  const confirmReject = async () => {
    if (!rejectDialog) return;
    const result = await decline.run(rejectDialog.id, reason);
    if (result) {
      toast.info(
        'Demande rejetée.',
        'Le solde du demandeur reste intact : il pourra refaire une demande une fois le problème corrigé.',
      );
      setRejectDialog(null);
      setReason('');
      state.reload();
    }
  };

  if (state.initialLoading) {
    return (
      <>
        <SkeletonCards count={4} />
        <SkeletonTable rows={7} columns={7} />
      </>
    );
  }

  if (state.error || !state.data) {
    return <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />;
  }

  const { page: result, summary } = state.data;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="En attente aujourd'hui"
          value={fcfa(summary.pendingAmount)}
          hint={`${summary.pendingCount} demande${summary.pendingCount > 1 ? 's' : ''} · calcul en temps réel`}
          tone="dark"
        />
        <KpiCard label="Demandes en file" value={summary.pendingCount} tone="warning" />
        <KpiCard label="Payé ce mois-ci" value={fcfa(summary.paidThisMonth)} tone="success" />
        <KpiCard label="Rejets" value={summary.rejectedCount} hint="Motif obligatoire, solde conservé" tone="danger" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips options={PAYOUT_FILTERS} value={filter} onChange={(v) => { setFilter(v); setPage(1); }} ariaLabel="Filtrer les demandes" />
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Demandeur, numéro, référence…" className="w-full sm:w-72" />
      </div>

      {(pay.error || decline.error) && (
        <ErrorState message={(pay.error ?? decline.error)!.message} code={(pay.error ?? decline.error)!.code} compact />
      )}

      <RefreshingOverlay active={state.loading && !state.initialLoading}>
        <TableShell
          footer={result.total > 0 ? (
            <Pagination page={result} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} itemLabel="demandes" />
          ) : undefined}
        >
          {result.total === 0 ? (
            <EmptyState
              icon={<Send size={22} />}
              title="Aucune demande dans cette file"
              description="Les demandes de virement déclenchées par les commerciaux et par le parrainage utilisateur apparaissent ici en temps réel."
            />
          ) : (
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                <tr>
                  <Th>Demandeur</Th>
                  <Th>Type</Th>
                  <Th align="right">Montant</Th>
                  <Th>Moyen de paiement</Th>
                  <Th>Numéro bénéficiaire</Th>
                  <Th>Demandé</Th>
                  <Th>Statut</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9DC]">
                {result.rows.map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-bold text-[#241F18] whitespace-nowrap">{p.requesterName}</Td>
                    <Td>
                      <StatusBadge tone={p.requesterType === 'commercial' ? 'accent' : 'info'}>
                        {p.requesterType === 'commercial' ? 'Commercial' : 'Parrainage'}
                      </StatusBadge>
                    </Td>
                    <Td align="right" className="font-serif font-bold text-[#241F18] whitespace-nowrap">{fcfa(p.amount)}</Td>
                    <Td className="text-[#8A8173] whitespace-nowrap">{human(p.paymentMethod)}</Td>
                    <Td className="font-mono text-[#241F18] whitespace-nowrap">{p.paymentNumber}</Td>
                    <Td className="text-[#8A8173] whitespace-nowrap">{relativeDay(p.requestedAt)}</Td>
                    <Td>
                      <StatusBadge tone={p.status === 'paid' ? 'success' : p.status === 'rejected' ? 'danger' : 'warning'}>
                        {human(p.status)}
                      </StatusBadge>
                      {p.status === 'paid' && p.transactionReference && (
                        <span className="block text-[10px] font-mono text-[#8A8173] mt-0.5">{p.transactionReference}</span>
                      )}
                      {p.status === 'rejected' && p.rejectionReason && (
                        <span className="block text-[10px] text-[#B3261E] mt-0.5 max-w-[220px] leading-snug">
                          {p.rejectionReason}
                        </span>
                      )}
                    </Td>
                    <Td align="right">
                      {p.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            label={`Marquer payé le virement de ${p.requesterName}`}
                            tone="success"
                            onClick={() => { setPayDialog(p); setReference(''); pay.clearError(); }}
                          >
                            <Check size={15} />
                          </IconButton>
                          <IconButton
                            label={`Rejeter la demande de ${p.requesterName}`}
                            tone="danger"
                            onClick={() => { setRejectDialog(p); setReason(''); decline.clearError(); }}
                          >
                            <X size={15} />
                          </IconButton>
                        </div>
                      ) : (
                        <span className="text-[10.5px] text-[#8A8173]">
                          {p.paidAt ? dateTime(p.paidAt) : 'Traitée'}
                        </span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </TableShell>
      </RefreshingOverlay>

      <ReferralRedemptionsSection />

      {/* Marquer payé : référence de transaction obligatoire (Manuel §5.3.1) */}
      <Modal
        open={Boolean(payDialog)}
        onClose={() => setPayDialog(null)}
        title="Marquer ce virement comme payé"
        description="Envoie d'abord l'argent depuis ton téléphone, puis saisis la référence de la transaction."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setPayDialog(null)}>Annuler</Button>
            <Button
              variant="success"
              size="md"
              isLoading={pay.pending}
              loadingLabel="Enregistrement…"
              disabled={reference.trim().length < 4}
              onClick={confirmPay}
            >
              Confirmer le paiement
            </Button>
          </>
        }
      >
        {pay.error && <div className="mb-4"><ErrorState message={pay.error.message} code={pay.error.code} compact /></div>}
        <div className="flex flex-col gap-4">
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9DC] text-xs text-[#3A3226] leading-relaxed">
            <strong className="text-[#241F18]">{payDialog?.requesterName}</strong> — {fcfa(payDialog?.amount ?? 0)} vers{' '}
            {human(payDialog?.paymentMethod)} <span className="font-mono">{payDialog?.paymentNumber}</span>
          </div>
          <Input
            label="Référence de transaction (obligatoire)"
            placeholder="Ex. OM-482913"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            helperText="Le backend refuse le passage au statut « payé » sans référence."
            autoFocus
          />
        </div>
      </Modal>

      {/* Rejeter : motif obligatoire (Manuel §5.3.2) */}
      <Modal
        open={Boolean(rejectDialog)}
        onClose={() => setRejectDialog(null)}
        title="Rejeter cette demande"
        description="Le solde du demandeur reste crédité : il pourra refaire une demande."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setRejectDialog(null)}>Annuler</Button>
            <Button
              variant="danger"
              size="md"
              isLoading={decline.pending}
              loadingLabel="Enregistrement…"
              disabled={reason.trim().length < 10}
              onClick={confirmReject}
            >
              Rejeter la demande
            </Button>
          </>
        }
      >
        {decline.error && <div className="mb-4"><ErrorState message={decline.error.message} code={decline.error.code} compact /></div>}
        <div className="flex flex-col gap-4">
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9DC] text-xs text-[#3A3226]">
            <strong className="text-[#241F18]">{rejectDialog?.requesterName}</strong> — {fcfa(rejectDialog?.amount ?? 0)}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reject-reason" className="text-xs font-semibold text-[#8A8173]">
              Motif du rejet (obligatoire, 10 caractères minimum)
            </label>
            <textarea
              id="reject-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex. Numéro MTN inactif — le titulaire doit réactiver son compte MoMo."
              className="w-full rounded-xl px-3.5 py-3 text-[13.5px] font-medium bg-white border border-[#E4DCCB] text-[#241F18] outline-none transition-all hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent resize-y"
            />
            <p className="text-[11.5px] text-[#8A8173]">
              Le motif est transmis au demandeur et conservé dans <code className="font-mono">audit_log</code>.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* -------------------- crédits parrainage utilisés pour Premium (§5.2) */

const ReferralRedemptionsSection: React.FC = () => {
  const [page, setPage] = useState(1);
  const state = useApi(() => listReferralRedemptions({ page, pageSize: 5 }), [page]);

  if (state.initialLoading) return <SkeletonTable rows={4} columns={4} />;
  if (state.error || !state.data) return null;

  const { page: result, totalCredits, totalCash } = state.data;

  return (
    <div>
      <div className="flex items-start gap-2.5 mb-3">
        <Gift size={17} className="text-[#C0512F] shrink-0 mt-0.5" />
        <div>
          <h3 className="font-serif font-bold text-base text-[#241F18]">Crédits parrainage utilisés pour Premium</h3>
          <p className="text-[11.5px] text-[#8A8173] max-w-2xl leading-relaxed">
            Rachat par solde interne : aucun mouvement de cash réel. Ces montants ne sont comptés ni dans le revenu
            brut de l'entreprise, ni dans la file des virements sortants.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <KpiCard label="Crédits consommés" value={fcfa(totalCredits)} hint="Réduction de solde interne" tone="accent" />
        <KpiCard label="Complément encaissé" value={fcfa(totalCash)} hint="Part réellement payée par l'élève" tone="success" />
      </div>

      <TableShell
        footer={result.total > 0 ? <Pagination page={result} onPageChange={setPage} itemLabel="rachats" /> : undefined}
      >
        {result.total === 0 ? (
          <EmptyState icon={<Gift size={22} />} title="Aucun rachat par crédits pour l'instant" />
        ) : (
          <table className="w-full min-w-[620px] text-left">
            <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
              <tr>
                <Th>Élève</Th>
                <Th>Date</Th>
                <Th>Formule</Th>
                <Th align="right">Crédits utilisés</Th>
                <Th align="right">Complément payé</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9DC]">
              {result.rows.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-bold text-[#241F18]">{r.userName}</Td>
                  <Td className="text-[#8A8173] whitespace-nowrap">{dateTime(r.date)}</Td>
                  <Td className="text-[#8A8173]">{r.plan}</Td>
                  <Td align="right" className="font-semibold text-[#C0512F]">{fcfa(r.creditsUsed)}</Td>
                  <Td align="right" className="font-semibold text-[#1F6B47]">{fcfa(r.cashTopUp)}</Td>
                </Tr>
              ))}
            </tbody>
          </table>
        )}
      </TableShell>
    </div>
  );
};

/* ------------------------------------------- 2. encaissements entrants */

const IncomingPayments: React.FC = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debounced = useDebounced(search);

  const state = useApi(() => listIncomingPayments({ search: debounced, page, pageSize }), [debounced, page, pageSize]);
  const exporter = useMutation(exportIncomingPaymentsCsv);

  const download = async () => {
    const file = await exporter.run();
    if (!file) return;
    const blob = new Blob([file.content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV généré.', file.filename);
  };

  if (state.initialLoading) return <><SkeletonCards count={4} /><SkeletonTable rows={8} columns={7} /></>;
  if (state.error || !state.data) {
    return <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />;
  }

  const { page: result, summary } = state.data;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Encaissé (reçu)" value={fcfa(summary.received)} tone="dark" />
        <KpiCard label="Transactions" value={summary.total} hint="Toutes accessibles par pagination" />
        <KpiCard label="En attente" value={summary.pending} tone="warning" />
        <KpiCard label="Échecs" value={summary.failed} tone="danger" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Élève, référence, produit…" className="w-full sm:w-72" />
        <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} isLoading={exporter.pending} onClick={download}>
          Exporter le grand livre (.CSV)
        </Button>
      </div>

      <RefreshingOverlay active={state.loading && !state.initialLoading}>
        <TableShell
          footer={result.total > 0 ? (
            <Pagination page={result} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} itemLabel="transactions" />
          ) : undefined}
        >
          {result.total === 0 ? (
            <EmptyState icon={<Inbox size={22} />} title="Aucune transaction ne correspond" />
          ) : (
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                <tr>
                  <Th>Référence</Th>
                  <Th>Élève</Th>
                  <Th>Produit</Th>
                  <Th>Moyen</Th>
                  <Th>Date</Th>
                  <Th align="right">Montant</Th>
                  <Th>Statut</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9DC]">
                {result.rows.map((t) => (
                  <Tr key={t.id}>
                    <Td className="font-mono font-bold text-[#241F18] whitespace-nowrap">{t.transactionRef}</Td>
                    <Td className="font-semibold text-[#241F18] whitespace-nowrap">{t.userName}</Td>
                    <Td className="text-[#8A8173]">{t.product}</Td>
                    <Td className="text-[#8A8173] whitespace-nowrap">{human(t.provider)}</Td>
                    <Td className="text-[#8A8173] whitespace-nowrap">{dateTime(t.createdAt)}</Td>
                    <Td align="right" className="font-serif font-bold text-[#241F18] whitespace-nowrap">{fcfa(t.amount)}</Td>
                    <Td>
                      <StatusBadge tone={t.status === 'recu' ? 'success' : t.status === 'en_attente' ? 'warning' : 'danger'}>
                        {human(t.status)}
                      </StatusBadge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </TableShell>
      </RefreshingOverlay>
    </>
  );
};
