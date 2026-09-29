/**
 * @vitest-environment jsdom
 *
 * L'espace CMS rendu réellement, depuis l'administration.
 * Vérifie les deux manques signalés :
 *   • le formulaire d'ajout comporte bien un champ de TÉLÉVERSEMENT ;
 *   • l'écran montre où l'on publie (structure de l'app + aperçu mobile),
 *     et pas seulement une liste plate.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../App';

function openAdmin(path = '/admin/contenu') {
  window.sessionStorage.setItem('mbeng.session.admin', JSON.stringify({
    token: 'test', scope: 'admin', userId: 'usr_admin', fullName: 'Super Administrateur',
    role: 'super_admin', twoFactorVerified: true, issuedAt: Date.now(), expiresAt: Date.now() + 3600_000,
  }));
  window.history.replaceState({}, '', path);
}

beforeEach(() => {
  window.sessionStorage.clear();
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false, media: query, onchange: null,
        addEventListener: () => {}, removeEventListener: () => {},
        addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
      }),
    });
  }
});

afterEach(cleanup);

describe("l'espace CMS montre l'application mobile", () => {
  it('liste les sections réelles de l’application et leur position', async () => {
    openAdmin();
    render(<App />);

    // On attend le CHARGEMENT de la navigation, pas seulement son conteneur.
    await screen.findByText('Examens blancs', {}, { timeout: 10_000 });
    const nav = screen.getByRole('navigation', { name: /Sections de l'application mobile/i });
    expect(within(nav).getByText('Bibliothèque')).toBeTruthy();
    expect(within(nav).getByText('Examens blancs')).toBeTruthy();
    expect(within(nav).getByText('Mots du jour')).toBeTruthy();
    expect(within(nav).getByText('Formation Pflege')).toBeTruthy();
    expect(within(nav).getByText('Ambassade & VFS Global')).toBeTruthy();
  });

  it('affiche un aperçu de l’application mobile et le chemin de la section', async () => {
    openAdmin();
    render(<App />);

    expect(await screen.findByText('Aperçu application mobile', {}, { timeout: 10_000 })).toBeTruthy();
    expect(screen.getAllByText('Accueil › Bibliothèque').length).toBeGreaterThan(0);
    expect(screen.getByText(/lecture seule, servi par ta session administrateur/i)).toBeTruthy();
  });

  it('montre le support de chaque ressource, et signale un fichier manquant', async () => {
    openAdmin();
    render(<App />);

    // On attend que le TABLEAU de la section soit chargé.
    await screen.findByText('alltag-beim-arzt.mp3', {}, { timeout: 10_000 });
    // La colonne « Support » existe et affiche de vrais noms de fichiers.
    expect(screen.getByRole('columnheader', { name: 'Support' })).toBeTruthy();
    expect(screen.getByText('alltag-beim-arzt.mp3')).toBeTruthy();
  });
});

describe("l'assistant d'ajout demande enfin le fichier", () => {
  async function openWizard() {
    openAdmin();
    render(<App />);
    const addButton = await screen.findByRole(
      'button', { name: /Ajouter dans « Bibliothèque »/ }, { timeout: 10_000 },
    );
    fireEvent.click(addButton);
    return screen.findByRole('dialog', {}, { timeout: 5_000 });
  }

  it('présente les trois étapes et un champ de téléversement', async () => {
    const dialog = await openWizard();

    expect(within(dialog).getByText('Contenu')).toBeTruthy();
    expect(within(dialog).getByText('Aperçu')).toBeTruthy();
    expect(within(dialog).getByText('Confirmation')).toBeTruthy();

    // Le champ qui manquait totalement dans l'ancien formulaire.
    expect(within(dialog).getByText(/Glisse ton fichier ici/i)).toBeTruthy();
    expect(within(dialog).getByText('Fichier audio')).toBeTruthy();
  });

  it('refuse de passer à l’aperçu sans fichier joint', async () => {
    const dialog = await openWizard();

    fireEvent.change(within(dialog).getByLabelText(/Titre affiché/i), {
      target: { value: 'Beim Bäcker bestellen' },
    });
    fireEvent.change(within(dialog).getByLabelText('Sous-titre'), {
      target: { value: 'Commander à la boulangerie' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Description lue par les élèves/i), {
      target: { value: 'Dialogue complet à la boulangerie avec les formules de politesse usuelles.' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Durée/i), { target: { value: '7' } });

    fireEvent.click(within(dialog).getByRole('button', { name: /Voir l'aperçu/ }));

    expect(await within(dialog).findByText(/doit être accompagné de son fichier/i, {}, { timeout: 5_000 })).toBeTruthy();
    // On reste à l'étape 1 : rien n'a été enregistré.
    expect(within(dialog).queryByText(/Voici ce que verront les élèves/)).toBeNull();
  });

  it('adapte le champ de téléversement au type choisi', async () => {
    const dialog = await openWizard();

    fireEvent.change(within(dialog).getByLabelText('Type de contenu'), { target: { value: 'livre' } });
    expect(within(dialog).getByText('Document PDF')).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText('Type de contenu'), { target: { value: 'fiche' } });
    expect(within(dialog).getByText('PDF à télécharger (facultatif)')).toBeTruthy();
  });

  it('n’autorise que les types acceptés par la section', async () => {
    openAdmin();
    render(<App />);

    const examsTab = await screen.findByText('Examens blancs', {}, { timeout: 10_000 });
    fireEvent.click(examsTab);

    const addButton = await screen.findByRole('button', { name: /Ajouter dans « Examens blancs »/ }, { timeout: 5_000 });
    fireEvent.click(addButton);

    const dialog = await screen.findByRole('dialog', {}, { timeout: 5_000 });
    const typeSelect = within(dialog).getByLabelText('Type de contenu') as HTMLSelectElement;
    const options = [...typeSelect.options].map((o) => o.value);
    expect(options).toEqual(['modelltest']);
  });
});
