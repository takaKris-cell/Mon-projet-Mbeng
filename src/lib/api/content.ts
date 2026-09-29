/**
 * API du contenu pédagogique (CMS) et de l'aperçu mobile.
 *
 * Le flux imposé est : brouillon → APERÇU → confirmations cochées → publication.
 * Rien ne part en production sans passer par là : `publishContent` refuse la
 * mise en ligne si les confirmations ne sont pas validées, et chaque étape
 * écrit dans `audit_log`.
 *
 * L'aperçu de l'application mobile est servi par des fonctions gardées par
 * `requireAdminSection('cms')` : l'administrateur circule dans l'application
 * élève avec SA propre session, sans qu'aucune session élève ne soit créée.
 */
import { AppError, type ActionResult, fail, ok } from '../errors';
import { db, writeAudit } from '../data/store';
import type { ContentResource, ContentSection, Paginated, UploadedFile } from '../data/types';
import { CONTENT_TYPE_DEFS, MAX_UPLOAD_BYTES, MOBILE_SECTIONS, findMobileSection } from '../data/mobile-sections';
import { matchesSearch, paginate, read, requireAdminSection, write, type QueryParams } from './client';
import { contentResourceSchema, parseOrThrow, publishContentSchema } from '../validation';

/* --------------------------------------------------------- téléversement */

/**
 * Transforme un `File` du navigateur en enregistrement stockable.
 * Côté Supabase, cette fonction deviendra un `storage.upload()` — la signature
 * et le type de retour ne changent pas.
 */
export function readUpload(file: File): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new AppError(
        'UPLOAD_TOO_LARGE',
        `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum : ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo.`,
      ));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new AppError('UPLOAD_FAILED', 'Lecture du fichier impossible.'));
    reader.onload = () =>
      resolve({
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        dataUrl: String(reader.result ?? ''),
        uploadedAt: new Date().toISOString(),
      });
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------- lecture côté CMS */

export interface SectionSummary {
  id: ContentSection;
  label: string;
  description: string;
  breadcrumb: string;
  published: number;
  drafts: number;
  lastUpdatedAt: string | null;
}

export async function listSectionSummaries(): Promise<ActionResult<SectionSummary[]>> {
  try {
    requireAdminSection('cms');
    return await read(() =>
      ok(
        MOBILE_SECTIONS.map((section) => {
          const rows = db.contentResources.filter((c) => c.section === section.id);
          const last = rows.map((r) => r.updatedAt).sort().pop() ?? null;
          return {
            id: section.id,
            label: section.label,
            description: section.description,
            breadcrumb: section.breadcrumb,
            published: rows.filter((r) => r.status === 'publie').length,
            drafts: rows.filter((r) => r.status === 'brouillon').length,
            lastUpdatedAt: last,
          };
        }),
      ),
    );
  } catch (e) {
    return fail(e);
  }
}

export interface SectionContent {
  section: ReturnType<typeof findMobileSection>;
  page: Paginated<ContentResource>;
  /** Tout le contenu PUBLIÉ de la section, tel que l'élève le voit. */
  live: ContentResource[];
  counts: { published: number; drafts: number; premium: number };
}

export async function getSectionContent(
  sectionId: string,
  params: QueryParams & { filter?: 'tous' | 'publie' | 'brouillon' } = {},
): Promise<ActionResult<SectionContent>> {
  try {
    requireAdminSection('cms');
    return await read(() => {
      const section = findMobileSection(sectionId);
      const all = db.contentResources
        .filter((c) => c.section === section.id)
        .sort((a, b) => a.position - b.position);

      const filtered = all
        .filter((c) => (params.filter && params.filter !== 'tous' ? c.status === params.filter : true))
        .filter((c) => matchesSearch([c.title, c.subtitle, c.body, c.type], params.search));

      return ok({
        section,
        page: paginate(filtered, { ...params, pageSize: params.pageSize ?? 12 }),
        live: all.filter((c) => c.status === 'publie'),
        counts: {
          published: all.filter((c) => c.status === 'publie').length,
          drafts: all.filter((c) => c.status === 'brouillon').length,
          premium: all.filter((c) => c.premiumOnly).length,
        },
      });
    });
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------- écriture côté CMS */

function nextPosition(section: ContentSection): number {
  const rows = db.contentResources.filter((c) => c.section === section);
  return rows.reduce((max, r) => Math.max(max, r.position), 0) + 1;
}

function logContent(action: string, row: ContentResource, extra: Record<string, unknown> = {}) {
  const session = requireAdminSection('cms');
  writeAudit({
    actorId: session.userId,
    actorName: session.fullName,
    portal: 'admin',
    action,
    targetTable: 'content_modules',
    targetId: row.id,
    metadata: { title: row.title, section: row.section, type: row.type, ...extra },
  });
}

/**
 * Étape 1 — création d'un BROUILLON.
 * Rien n'est visible par les élèves à ce stade : le contenu doit d'abord être
 * relu dans l'aperçu, puis explicitement publié.
 */
export async function createDraft(input: unknown): Promise<ActionResult<ContentResource>> {
  try {
    const session = requireAdminSection('cms', 'ecriture');
    const data = parseOrThrow(contentResourceSchema, input);
    return await write(() => {
      const now = new Date().toISOString();
      const row: ContentResource = {
        id: `cnt_${Date.now().toString(36)}`,
        title: data.title,
        subtitle: data.subtitle ?? '',
        body: data.body ?? '',
        section: data.section,
        level: data.level,
        type: data.type,
        file: data.file ?? null,
        cover: data.cover ?? null,
        durationMin: data.durationMin ?? null,
        premiumOnly: data.premiumOnly ?? false,
        status: 'brouillon',
        position: nextPosition(data.section),
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
        author: session.fullName,
      };
      db.contentResources.unshift(row);
      logContent('content.draft_created', row, { hasFile: Boolean(row.file) });
      return ok(row);
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * Étape 3 — publication, après aperçu et confirmations.
 * La garde n'est pas décorative : sans les deux cases cochées, la ressource
 * reste en brouillon et n'atteint jamais l'application mobile.
 */
export async function publishContent(input: {
  resourceId: string;
  previewChecked: boolean;
  contentChecked: boolean;
}): Promise<ActionResult<ContentResource>> {
  try {
    requireAdminSection('cms', 'ecriture');
    const data = parseOrThrow(publishContentSchema, input, 'PUBLISH_NOT_CONFIRMED');
    return await write(() => {
      const row = db.contentResources.find((c) => c.id === data.resourceId);
      if (!row) throw new AppError('CONTENT_NOT_FOUND', 'Ressource introuvable.', 404);

      const def = CONTENT_TYPE_DEFS[row.type];
      if (def.fileRequired && !row.file) {
        throw new AppError(
          'CONTENT_FILE_MISSING',
          `Impossible de publier : ce ${def.label.toLowerCase()} n'a pas de fichier joint.`,
        );
      }

      const now = new Date().toISOString();
      row.status = 'publie';
      row.publishedAt = now;
      row.updatedAt = now;
      logContent('content.published', row, { confirmedPreview: true });
      return ok(row);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function updateContentResource(
  id: string,
  patch: Partial<ContentResource>,
): Promise<ActionResult<ContentResource>> {
  try {
    requireAdminSection('cms', 'ecriture');
    return await write(() => {
      const row = db.contentResources.find((c) => c.id === id);
      if (!row) throw new AppError('CONTENT_NOT_FOUND', 'Ressource introuvable.', 404);
      Object.assign(row, patch, { updatedAt: new Date().toISOString() });
      logContent(
        patch.status === 'brouillon' ? 'content.unpublished' : 'content.updated',
        row,
      );
      return ok(row);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function deleteContentResource(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    requireAdminSection('cms', 'ecriture');
    return await write(() => {
      const index = db.contentResources.findIndex((c) => c.id === id);
      if (index < 0) throw new AppError('CONTENT_NOT_FOUND', 'Ressource introuvable.', 404);
      const [removed] = db.contentResources.splice(index, 1);
      logContent('content.deleted', removed);
      return ok({ id });
    });
  } catch (e) {
    return fail(e);
  }
}

/** Réordonne une ressource dans sa section : l'ordre est celui vu par l'élève. */
export async function moveContentResource(id: string, direction: 'up' | 'down'): Promise<ActionResult<ContentResource[]>> {
  try {
    requireAdminSection('cms', 'ecriture');
    return await write(() => {
      const row = db.contentResources.find((c) => c.id === id);
      if (!row) throw new AppError('CONTENT_NOT_FOUND', 'Ressource introuvable.', 404);

      const siblings = db.contentResources
        .filter((c) => c.section === row.section)
        .sort((a, b) => a.position - b.position);
      const index = siblings.findIndex((c) => c.id === id);
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= siblings.length) return ok(siblings);

      const swapped = siblings[target];
      const position = row.position;
      row.position = swapped.position;
      swapped.position = position;
      row.updatedAt = new Date().toISOString();
      logContent('content.reordered', row, { direction });

      return ok([...siblings].sort((a, b) => a.position - b.position));
    });
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------- aperçu de l'application */

export interface MobilePreviewData {
  section: ReturnType<typeof findMobileSection>;
  /** Contenu publié, dans l'ordre exact de l'application mobile. */
  items: ContentResource[];
  /** Brouillon en cours de relecture, injecté en tête et signalé. */
  draft: ContentResource | null;
}

/**
 * Sert l'écran mobile demandé à un administrateur.
 * Aucune session élève n'est créée : c'est la session ADMIN qui autorise la
 * lecture, et l'aperçu est strictement en lecture seule.
 */
export async function getMobilePreview(
  sectionId: string,
  draftId?: string,
): Promise<ActionResult<MobilePreviewData>> {
  try {
    requireAdminSection('cms');
    return await read(() => {
      const section = findMobileSection(sectionId);
      const items = db.contentResources
        .filter((c) => c.section === section.id && c.status === 'publie')
        .sort((a, b) => a.position - b.position);
      const draft = draftId ? db.contentResources.find((c) => c.id === draftId) ?? null : null;
      return ok({ section, items, draft });
    });
  } catch (e) {
    return fail(e);
  }
}
