/**
 * Assistant d'ajout d'une ressource — le flux demandé, de bout en bout.
 *
 *   1. CONTENU      — titre, sous-titre, texte, niveau, type, DURÉE et surtout
 *                     le FICHIER réel. Le brouillon est enregistré à la fin de
 *                     cette étape : il n'est encore visible par personne.
 *   2. APERÇU       — l'écran mobile exact, avec le nouvel élément injecté en
 *                     tête et mis en évidence.
 *   3. CONFIRMATION — deux cases à cocher obligatoires, puis publication.
 *
 * La contrainte n'est pas seulement visuelle : `publishContent` refuse la mise
 * en ligne si les confirmations ne sont pas transmises.
 */
import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Rocket, ShieldCheck } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Modal } from '../../../shared/Modal';
import { ErrorState } from '../../../shared/states';
import { Select } from '../AdminContent';
import { FileUploadField } from './FileUploadField';
import { MobilePreview } from './MobilePreview';
import { useMutation } from '../../../../lib/hooks';
import { createDraft, publishContent } from '../../../../lib/api/content';
import {
  CONTENT_TYPE_DEFS, findMobileSection, type MobileSectionDef,
} from '../../../../lib/data/mobile-sections';
import type { ContentLevel, ContentResource, ContentType, UploadedFile } from '../../../../lib/data/types';
import { useToast } from '../../../shared/Toast';
import { fieldErrors } from '../../../../lib/validation';
import { contentResourceSchema } from '../../../../lib/validation';

const LEVELS: ContentLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

interface AddResourceWizardProps {
  open: boolean;
  section: MobileSectionDef;
  onClose: () => void;
  onPublished: () => void;
}

type Step = 'contenu' | 'apercu' | 'confirmation';

export const AddResourceWizard: React.FC<AddResourceWizardProps> = ({
  open, section, onClose, onPublished,
}) => {
  const toast = useToast();
  const [step, setStep] = useState<Step>('contenu');
  const [draft, setDraft] = useState<ContentResource | null>(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<ContentType>(section.allowedTypes[0]);
  const [level, setLevel] = useState<ContentLevel>('B1');
  const [durationMin, setDurationMin] = useState('');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [previewChecked, setPreviewChecked] = useState(false);
  const [contentChecked, setContentChecked] = useState(false);

  const save = useMutation(createDraft);
  const publish = useMutation(publishContent);

  const typeDef = CONTENT_TYPE_DEFS[type];

  const payload = useMemo(
    () => ({
      title, subtitle, body, section: section.id, level, type,
      file, cover: null,
      durationMin: durationMin ? Number(durationMin) : null,
      premiumOnly,
    }),
    [title, subtitle, body, section.id, level, type, file, durationMin, premiumOnly],
  );

  const reset = () => {
    setStep('contenu');
    setDraft(null);
    setTitle(''); setSubtitle(''); setBody('');
    setType(section.allowedTypes[0]); setLevel('B1');
    setDurationMin(''); setPremiumOnly(false); setFile(null);
    setErrors({});
    setPreviewChecked(false); setContentChecked(false);
    save.clearError(); publish.clearError();
  };

  const close = () => { reset(); onClose(); };

  /** Étape 1 → 2 : validation puis enregistrement du brouillon. */
  const goToPreview = async () => {
    const local = fieldErrors(contentResourceSchema, payload);
    setErrors(local);
    if (Object.keys(local).length > 0) return;

    const created = await save.run(payload);
    if (created) {
      setDraft(created);
      setStep('apercu');
    }
  };

  /** Étape 3 : publication effective dans l'application mobile. */
  const confirmPublish = async () => {
    if (!draft) return;
    const published = await publish.run({
      resourceId: draft.id,
      previewChecked,
      contentChecked,
    });
    if (published) {
      toast.success(
        `« ${published.title} » est en ligne.`,
        `Visible dès maintenant par les élèves dans ${section.breadcrumb}.`,
      );
      reset();
      onPublished();
    }
  };

  const steps: { id: Step; label: string }[] = [
    { id: 'contenu', label: 'Contenu' },
    { id: 'apercu', label: 'Aperçu' },
    { id: 'confirmation', label: 'Confirmation' },
  ];
  const currentIndex = steps.findIndex((s) => s.id === step);

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={`Ajouter dans « ${section.label} »`}
      description={section.breadcrumb}
      footer={
        step === 'contenu' ? (
          <>
            <Button variant="ghost" size="md" onClick={close}>Annuler</Button>
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight size={15} />}
              isLoading={save.pending}
              loadingLabel="Enregistrement du brouillon…"
              onClick={goToPreview}
            >
              Voir l'aperçu
            </Button>
          </>
        ) : step === 'apercu' ? (
          <>
            <Button variant="ghost" size="md" leftIcon={<ArrowLeft size={15} />} onClick={() => setStep('contenu')}>
              Modifier le contenu
            </Button>
            <Button variant="primary" size="md" rightIcon={<ArrowRight size={15} />} onClick={() => setStep('confirmation')}>
              L'aperçu est correct
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="md" leftIcon={<ArrowLeft size={15} />} onClick={() => setStep('apercu')}>
              Revoir l'aperçu
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Rocket size={15} />}
              disabled={!previewChecked || !contentChecked}
              isLoading={publish.pending}
              loadingLabel="Publication…"
              onClick={confirmPublish}
            >
              Publier dans l'application
            </Button>
          </>
        )
      }
    >
      {/* Fil d'étapes */}
      <ol className="flex items-center gap-2 mb-5" aria-label="Étapes de publication">
        {steps.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                  active ? 'bg-[#241F18] text-white'
                  : done ? 'bg-[#DDF0E6] text-[#1F6B47]'
                  : 'bg-[#F5F1EA] text-[#8A8173]'
                }`}
              >
                {done ? <Check size={12} /> : <span>{i + 1}</span>}
                {s.label}
              </span>
              {i < steps.length - 1 && <span className="flex-1 h-px bg-[#E4DCCB]" />}
            </li>
          );
        })}
      </ol>

      {(save.error || publish.error) && (
        <div className="mb-4">
          <ErrorState
            message={(publish.error ?? save.error)!.message}
            code={(publish.error ?? save.error)!.code}
            compact
          />
        </div>
      )}

      {/* ---------------------------------------------------- 1. CONTENU */}
      {step === 'contenu' && (
        <div className="flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9DC] text-[11.5px] text-[#3A3226] leading-relaxed">
            {typeDef.hint}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Type de contenu"
              value={type}
              onChange={(v) => { setType(v as ContentType); setErrors({}); }}
              options={section.allowedTypes.map((t) => ({ value: t, label: CONTENT_TYPE_DEFS[t].label }))}
            />
            {section.usesLevel && (
              <Select
                label="Niveau"
                value={level}
                onChange={(v) => setLevel(v as ContentLevel)}
                options={LEVELS.map((l) => ({ value: l, label: l }))}
              />
            )}
            {typeDef.usesDuration && (
              <Input
                label="Durée (minutes)"
                type="number"
                min={1}
                placeholder="Ex. 12"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                error={errors.durationMin}
              />
            )}
          </div>

          <Input
            label="Titre affiché dans l'application"
            placeholder={type === 'mot' ? 'Ex. die Erfahrung' : 'Ex. Alltag: Beim Arzt'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            autoFocus
          />

          <Input
            label="Sous-titre"
            placeholder={type === 'mot' ? "Ex. l'expérience (vécue) — nom féminin" : 'Ex. Consultation chez le médecin — dialogue lent'}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            error={errors.subtitle}
            helperText="Une ligne, affichée sous le titre dans la liste."
          />

          <div className="flex flex-col gap-1.5 text-left">
            <label htmlFor="resource-body" className="text-xs font-semibold text-[#8A8173]">
              {type === 'mot' ? 'Exemple et traduction' : 'Description lue par les élèves'}
              {typeDef.bodyRequired && <span className="text-[#C0512F]"> *</span>}
            </label>
            <textarea
              id="resource-body"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                type === 'mot'
                  ? 'Sie hat viel Erfahrung im Verkauf. — Elle a beaucoup d’expérience dans la vente.'
                  : 'Explique ce que l’élève va y trouver, et ce qu’il saura faire après.'
              }
              className={`w-full rounded-xl px-3.5 py-3 text-[13.5px] font-medium bg-white outline-none transition-all resize-y ${
                errors.body
                  ? 'border-[1.5px] border-[#B3261E] shadow-focus-error text-[#241F18]'
                  : 'border border-[#E4DCCB] text-[#241F18] hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent'
              }`}
            />
            {errors.body && <p className="text-[11.5px] text-[#B3261E] font-medium">{errors.body}</p>}
          </div>

          {/* LE champ qui manquait */}
          <FileUploadField
            label={typeDef.fileLabel}
            accept={typeDef.accept}
            required={typeDef.fileRequired}
            value={file}
            onChange={(f) => { setFile(f); setErrors((p) => ({ ...p, file: '' })); }}
            error={errors.file}
          />

          {section.supportsPremium && (
            <label className="flex items-start justify-between gap-4 p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9DC] cursor-pointer hover:border-[#E4DCCB] transition-colors">
              <span>
                <span className="block text-xs font-bold text-[#241F18]">Réserver aux abonnés Premium</span>
                <span className="block text-[11px] text-[#8A8173] mt-0.5">
                  Les comptes gratuits verront le contenu, avec un cadenas et une invitation à s'abonner.
                </span>
              </span>
              <input
                type="checkbox"
                checked={premiumOnly}
                onChange={(e) => setPremiumOnly(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#C0512F] shrink-0 cursor-pointer"
              />
            </label>
          )}
        </div>
      )}

      {/* ----------------------------------------------------- 2. APERÇU */}
      {step === 'apercu' && draft && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
          <div className="flex flex-col gap-3 order-2 md:order-1">
            <h4 className="font-serif font-bold text-base text-[#241F18]">Voici ce que verront les élèves</h4>
            <p className="text-[12.5px] text-[#8A8173] leading-relaxed">
              Le bloc encadré en terracotta est ton nouveau contenu, placé à sa vraie position dans{' '}
              <strong className="text-[#241F18]">{section.breadcrumb}</strong>. Le reste est ce qui est déjà en ligne.
            </p>

            <dl className="flex flex-col gap-2 text-xs mt-1">
              <Row label="Titre" value={draft.title} />
              <Row label="Sous-titre" value={draft.subtitle || '—'} />
              <Row label="Type" value={CONTENT_TYPE_DEFS[draft.type].label} />
              {section.usesLevel && <Row label="Niveau" value={draft.level} />}
              {draft.durationMin && <Row label="Durée" value={`${draft.durationMin} min`} />}
              <Row label="Support" value={draft.file ? draft.file.name : 'Aucun fichier joint'} />
              <Row label="Accès" value={draft.premiumOnly ? 'Abonnés Premium' : 'Tous les élèves'} />
              <Row label="Statut actuel" value="Brouillon — invisible par les élèves" />
            </dl>
          </div>

          <div className="order-1 md:order-2">
            <MobilePreview sectionId={section.id} draft={draft} compact />
          </div>
        </div>
      )}

      {/* ----------------------------------------------- 3. CONFIRMATION */}
      {step === 'confirmation' && draft && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[#241F18] text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] block">
              Dernière étape
            </span>
            <h4 className="font-serif font-bold text-lg mt-1">Publier « {draft.title} » ?</h4>
            <p className="text-[12px] text-[#C7BDA8] mt-1.5 leading-relaxed">
              Une fois publié, ce contenu apparaît immédiatement dans l'application mobile, dans{' '}
              {section.breadcrumb}, pour {draft.premiumOnly ? 'les abonnés Premium' : 'tous les élèves'}.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <ConfirmCheck
              checked={previewChecked}
              onChange={setPreviewChecked}
              label="J'ai vérifié l'aperçu dans l'application mobile"
              detail="Le titre, le sous-titre et la position sont corrects."
            />
            <ConfirmCheck
              checked={contentChecked}
              onChange={setContentChecked}
              label={draft.file ? 'Le fichier joint est le bon' : 'Le texte publié est complet et relu'}
              detail={
                draft.file
                  ? `${draft.file.name} — c'est bien le support que les élèves vont ouvrir.`
                  : 'Aucun fichier joint : le contenu repose entièrement sur le texte saisi.'
              }
            />
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9DC] flex items-start gap-2.5">
            <ShieldCheck size={15} className="text-[#2F9E6E] shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-[#3A3226] leading-relaxed">
              Sans ces deux confirmations, la publication est refusée côté serveur : la ressource resterait en
              brouillon. L'opération est journalisée dans <code className="font-mono">audit_log</code>.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg bg-[#FAF7F2]">
    <dt className="text-[#8A8173] shrink-0">{label}</dt>
    <dd className="font-semibold text-[#241F18] text-right break-words">{value}</dd>
  </div>
);

const ConfirmCheck: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  detail: string;
}> = ({ checked, onChange, label, detail }) => (
  <label
    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
      checked
        ? 'bg-[#DDF0E6] border-[#B9E2CC]'
        : 'bg-white border-[#E4DCCB] hover:border-[#C7BDA8]'
    }`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 w-4 h-4 accent-[#2F9E6E] shrink-0 cursor-pointer"
    />
    <span className="min-w-0">
      <span className={`block text-xs font-bold ${checked ? 'text-[#1F6B47]' : 'text-[#241F18]'}`}>{label}</span>
      <span className={`block text-[11px] mt-0.5 leading-relaxed ${checked ? 'text-[#1F6B47]/80' : 'text-[#8A8173]'}`}>
        {detail}
      </span>
    </span>
  </label>
);
