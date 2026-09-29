/**
 * Flux de publication du CMS : brouillon → aperçu → confirmation → en ligne.
 *
 * Ces tests verrouillent les deux manques signalés :
 *   • une ressource sans support ne peut plus être créée ni publiée ;
 *   • rien n'atteint l'application mobile sans confirmation explicite.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

const storage = new MemoryStorage();
vi.stubGlobal('window', { sessionStorage: storage, location: { origin: 'http://localhost:3000' } });

const { createSession, writeSession } = await import('../../auth/session');
const {
  createDraft, deleteContentResource, getMobilePreview, getSectionContent,
  moveContentResource, publishContent,
} = await import('../content');
const { listLibrary } = await import('../user');
const { db } = await import('../../data/store');

const adminSession = () => createSession({
  scope: 'admin', userId: 'usr_admin', fullName: 'Super Administrateur',
  role: 'super_admin', twoFactorVerified: true,
});

const AUDIO = {
  name: 'lektion-42.mp3',
  size: 2_400_000,
  mimeType: 'audio/mpeg',
  dataUrl: 'data:audio/mpeg;base64,AAAA',
  uploadedAt: new Date().toISOString(),
};

const BASE = {
  title: 'Beim Bäcker bestellen',
  subtitle: 'Commander à la boulangerie — dialogue lent',
  body: 'Dialogue complet à la boulangerie, avec les formules de politesse et les quantités usuelles.',
  section: 'bibliotheque',
  level: 'A2',
  type: 'podcast',
  durationMin: 7,
  premiumOnly: false,
};

beforeAll(() => writeSession(adminSession()));
beforeEach(() => { if (!storage.getItem('mbeng.session.admin')) writeSession(adminSession()); });

describe('création du brouillon', () => {
  it('refuse un podcast sans fichier audio', async () => {
    const result = await createDraft({ ...BASE, file: null });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/fichier/i);
  });

  it('refuse une description trop courte', async () => {
    const result = await createDraft({ ...BASE, file: AUDIO, body: 'trop court' });
    expect(result.success).toBe(false);
  });

  it('refuse un podcast sans durée', async () => {
    const result = await createDraft({ ...BASE, file: AUDIO, durationMin: null });
    expect(result.success).toBe(false);
  });

  it("refuse un type que la section n'accepte pas", async () => {
    // « examens » n'accepte que les examens blancs, pas les podcasts.
    const result = await createDraft({ ...BASE, file: AUDIO, section: 'examens' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toMatch(/section/i);
  });

  it('accepte une ressource complète et la range en BROUILLON', async () => {
    const result = await createDraft({ ...BASE, file: AUDIO });
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.status).toBe('brouillon');
    expect(result.data.publishedAt).toBeNull();
    expect(result.data.file?.name).toBe(AUDIO.name);
    expect(db.auditLog.some((a) => a.action === 'content.draft_created')).toBe(true);
  });
});

describe('aperçu avant publication', () => {
  it("le brouillon n'apparaît pas dans le contenu vu par les élèves", async () => {
    const created = await createDraft({ ...BASE, file: AUDIO, title: 'Invisible pour l’instant' });
    expect(created.success).toBe(true);
    if (!created.success) return;

    const preview = await getMobilePreview('bibliotheque');
    expect(preview.success).toBe(true);
    if (!preview.success) return;
    expect(preview.data.items.some((i) => i.id === created.data.id)).toBe(false);
  });

  it("l'aperçu le renvoie explicitement quand on le demande pour relecture", async () => {
    const created = await createDraft({ ...BASE, file: AUDIO, title: 'À relire' });
    if (!created.success) throw new Error('brouillon non créé');

    const preview = await getMobilePreview('bibliotheque', created.data.id);
    expect(preview.success).toBe(true);
    if (!preview.success) return;
    expect(preview.data.draft?.id).toBe(created.data.id);
    expect(preview.data.section.layout).toBe('liste');
  });
});

describe('publication', () => {
  it('refuse la publication si les confirmations ne sont pas cochées', async () => {
    const created = await createDraft({ ...BASE, file: AUDIO, title: 'Sans confirmation' });
    if (!created.success) throw new Error('brouillon non créé');

    const noneChecked = await publishContent({
      resourceId: created.data.id, previewChecked: false, contentChecked: false,
    });
    expect(noneChecked.success).toBe(false);

    const halfChecked = await publishContent({
      resourceId: created.data.id, previewChecked: true, contentChecked: false,
    });
    expect(halfChecked.success).toBe(false);

    // La ressource est restée en brouillon.
    expect(db.contentResources.find((c) => c.id === created.data.id)?.status).toBe('brouillon');
  });

  it('publie quand les deux confirmations sont cochées, et rend le contenu visible', async () => {
    const created = await createDraft({ ...BASE, file: AUDIO, title: 'Publié pour de bon' });
    if (!created.success) throw new Error('brouillon non créé');

    const published = await publishContent({
      resourceId: created.data.id, previewChecked: true, contentChecked: true,
    });
    expect(published.success).toBe(true);
    if (!published.success) return;

    expect(published.data.status).toBe('publie');
    expect(published.data.publishedAt).toBeTruthy();
    expect(db.auditLog.some((a) => a.action === 'content.published' && a.targetId === created.data.id)).toBe(true);

    // Visible dans l'aperçu…
    const preview = await getMobilePreview('bibliotheque');
    if (!preview.success) throw new Error('aperçu indisponible');
    expect(preview.data.items.some((i) => i.id === created.data.id)).toBe(true);
  });

  it("le contenu publié arrive réellement dans la bibliothèque de l'élève", async () => {
    const created = await createDraft({ ...BASE, file: AUDIO, title: 'Vu par Awa' });
    if (!created.success) throw new Error('brouillon non créé');
    await publishContent({ resourceId: created.data.id, previewChecked: true, contentChecked: true });

    // On bascule sur une session ÉLÈVE : c'est bien le même contenu.
    writeSession(createSession({
      scope: 'user', userId: 'usr_awa', fullName: 'Awa Nkeng', role: 'eleve', twoFactorVerified: true,
    }));
    const library = await listLibrary({ search: 'Vu par Awa', pageSize: 50 });
    expect(library.success).toBe(true);
    if (!library.success) return;
    expect(library.data.rows.some((r) => r.id === created.data.id)).toBe(true);
  });
});

describe('gestion de l’existant', () => {
  it('réordonne une ressource dans sa section', async () => {
    writeSession(adminSession());
    const before = await getSectionContent('bibliotheque', { pageSize: 50 });
    if (!before.success) throw new Error('section illisible');
    const second = before.data.page.rows[1];

    const moved = await moveContentResource(second.id, 'up');
    expect(moved.success).toBe(true);
    if (!moved.success) return;
    expect(moved.data[0].id).toBe(second.id);
    expect(db.auditLog.some((a) => a.action === 'content.reordered')).toBe(true);
  });

  it('supprime une ressource et la retire de l’application', async () => {
    const created = await createDraft({ ...BASE, file: AUDIO, title: 'À supprimer' });
    if (!created.success) throw new Error('brouillon non créé');

    const removed = await deleteContentResource(created.data.id);
    expect(removed.success).toBe(true);
    expect(db.contentResources.some((c) => c.id === created.data.id)).toBe(false);
  });
});
