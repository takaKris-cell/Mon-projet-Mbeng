/**
 * @vitest-environment jsdom
 *
 * Connexion réelle des 3 portails, pilotée depuis l'interface.
 *
 * Régression corrigée ici : dans `PhoneField`, le sélecteur de pays gardait
 * `w-full` en variante compacte. Posé dans une rangée flex à côté du champ
 * numéro, il réclamait toute la largeur et écrasait la saisie : le champ
 * existait mais devenait inutilisable. Ces tests vérifient désormais que le
 * champ est bien saisissable ET que la connexion aboutit, sur les 3 portails.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';

function visit(path: string) {
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

describe('le champ numéro reste utilisable à côté du sélecteur de pays', () => {
  it("n'impose pas une largeur pleine au sélecteur en variante compacte", () => {
    visit('/commercial/connexion');
    const { container } = render(<App />);

    const input = screen.getByLabelText(/Numéro de téléphone professionnel/i);
    const row = input.parentElement!;
    const selectorWrapper = row.firstElementChild as HTMLElement;

    // Le sélecteur ne doit pas réclamer 100 % de la rangée…
    expect(selectorWrapper.className).not.toMatch(/(^|\s)w-full(\s|$)/);
    expect(selectorWrapper.className).toContain('shrink-0');
    // …et le champ doit rester l'élément extensible de la rangée.
    expect(input.className).toContain('flex-1');
    expect(container).toBeTruthy();
  });

  it('accepte la saisie du numéro', () => {
    visit('/commercial/connexion');
    render(<App />);

    const input = screen.getByLabelText(/Numéro de téléphone professionnel/i) as HTMLInputElement;
    expect(input.disabled).toBe(false);
    fireEvent.change(input, { target: { value: '690 12 77 34' } });
    expect(input.value).toBe('690 12 77 34');
  });
});

describe('connexion de bout en bout', () => {
  it("l'agent commercial se connecte et atteint son tableau de bord", async () => {
    visit('/commercial/connexion');
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Numéro de téléphone professionnel/i), {
      target: { value: '690 12 77 34' },
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'agent2026' } });
    fireEvent.click(screen.getByRole('button', { name: /^Se connecter$/ }));

    expect(await screen.findByText('Gains de la semaine', {}, { timeout: 10_000 })).toBeTruthy();
    expect(window.sessionStorage.getItem('mbeng.session.commercial')).toBeTruthy();
    // La connexion commerciale n'ouvre aucun autre portail.
    expect(window.sessionStorage.getItem('mbeng.session.admin')).toBeNull();
    expect(window.sessionStorage.getItem('mbeng.session.user')).toBeNull();
  });

  it("l'élève se connecte depuis l'écran Bienvenue", async () => {
    visit('/app/connexion');
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Numéro de téléphone/i), {
      target: { value: '699 45 61 28' },
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'mbeng2026' } });
    fireEvent.click(screen.getByRole('button', { name: /^Se connecter$/ }));

    expect(await screen.findByText(/ACCÈS RAPIDE/i, {}, { timeout: 10_000 })).toBeTruthy();
    expect(window.sessionStorage.getItem('mbeng.session.user')).toBeTruthy();
  });

  it("l'administrateur doit franchir les deux étapes, 2FA comprise", async () => {
    visit('/admin/connexion');
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Email administrateur/i), {
      target: { value: 'admin@monprojetmbeng.com' },
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'admin2026' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuer/ }));

    // Étape 1 franchie : aucun jeton n'est encore émis.
    expect(await screen.findByText(/Étape 2 sur 2/i, {}, { timeout: 10_000 })).toBeTruthy();
    expect(window.sessionStorage.getItem('mbeng.session.admin')).toBeNull();

    // Le code est affiché en développement : on le lit et on le saisit.
    const code = (await screen.findByText(/^\d{6}$/)).textContent!;
    const firstBox = screen.getByLabelText('Chiffre 1');
    fireEvent.change(firstBox, { target: { value: code } });

    await waitFor(
      () => expect(window.sessionStorage.getItem('mbeng.session.admin')).toBeTruthy(),
      { timeout: 10_000 },
    );
    // « Vue d'ensemble » est à la fois l'onglet de la barre latérale et le
    // titre de la page : on cible le titre.
    expect(
      await screen.findByRole('heading', { name: "Vue d'ensemble" }, { timeout: 10_000 }),
    ).toBeTruthy();
  });

  it('refuse un mot de passe incorrect', async () => {
    visit('/commercial/connexion');
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Numéro de téléphone professionnel/i), {
      target: { value: '690 12 77 34' },
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'mauvais' } });
    fireEvent.click(screen.getByRole('button', { name: /^Se connecter$/ }));

    expect(await screen.findByText(/incorrect/i, {}, { timeout: 10_000 })).toBeTruthy();
    expect(window.sessionStorage.getItem('mbeng.session.commercial')).toBeNull();
  });

  it('refuse un numéro au format invalide sans appeler le serveur', async () => {
    visit('/commercial/connexion');
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Numéro de téléphone professionnel/i), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'agent2026' } });
    fireEvent.click(screen.getByRole('button', { name: /^Se connecter$/ }));

    expect(await screen.findByText(/Numéro Cameroun invalide/i, {}, { timeout: 5_000 })).toBeTruthy();
  });
});
