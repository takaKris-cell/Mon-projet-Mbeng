/**
 * @vitest-environment jsdom
 *
 * Test de rendu de bout en bout des 3 portails + du site public.
 * Il vérifie la correction de PRIORITÉ 0 au niveau de l'interface :
 * à froid, sur chaque espace de routes, c'est bien un écran de CONNEXION qui
 * s'affiche — jamais un tableau de bord, jamais de sélecteur de portail.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import App from '../App';

function visit(path: string) {
  window.history.replaceState({}, '', path);
}

beforeEach(() => {
  window.sessionStorage.clear();
  // jsdom ne fournit pas matchMedia : requis par useIsMobile.
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

describe('site public', () => {
  it('affiche la page marketing sur écran large', () => {
    visit('/');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain("Apprends l'allemand");
    expect(screen.getByText('Comment ça marche', { selector: 'h2' })).toBeTruthy();
    expect(screen.getByText('FAQ', { selector: 'h2' })).toBeTruthy();
    expect(screen.getByText('Tarifs', { selector: 'h2' })).toBeTruthy();
  });

  it("n'expose aucun lien public vers l'Espace Commercial ou l'Administration", () => {
    visit('/');
    const { container } = render(<App />);
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href') ?? '');
    expect(hrefs.some((h) => h.startsWith('/admin'))).toBe(false);
    expect(hrefs.some((h) => h.startsWith('/commercial'))).toBe(false);
    expect(container.textContent).not.toContain('?portal=');
  });
});

describe('état par défaut de chaque portail', () => {
  it("le Portail Utilisateur s'ouvre sur l'écran Bienvenue, pas sur l'accueil connecté", () => {
    visit('/app');
    render(<App />);
    expect(screen.getByRole('button', { name: /Continuer/i })).toBeTruthy();
    expect(screen.queryByText(/ACCÈS RAPIDE/i)).toBeNull();
  });

  it("l'Espace Commercial s'ouvre sur son écran de connexion, pas sur le tableau de bord", () => {
    visit('/commercial/tableau-de-bord');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Espace Commercial' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeTruthy();
    expect(screen.queryByText(/Demander le virement/i)).toBeNull();
    expect(screen.queryByText(/Mes clients/i)).toBeNull();
  });

  it("l'Administration s'ouvre sur son écran de connexion en deux étapes", () => {
    visit('/admin/comptabilite');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Super-Administration' })).toBeTruthy();
    expect(screen.getByText(/Étape 1 sur 2/i)).toBeTruthy();
    expect(screen.queryByText(/Reversement réseau total/i)).toBeNull();
  });

  it('une adresse inconnue affiche une page « introuvable », pas un portail', () => {
    visit('/nimporte-quoi');
    render(<App />);
    expect(screen.getByRole('heading', { name: /Page introuvable/i })).toBeTruthy();
  });
});

describe('portails réellement fonctionnels une fois la session obtenue', () => {
  /** Session écrite directement : c'est le seul endroit où cela est légitime. */
  const openSession = (scope: 'commercial' | 'admin', userId: string, fullName: string, role: string) => {
    window.sessionStorage.setItem(`mbeng.session.${scope}`, JSON.stringify({
      token: 'test', scope, userId, fullName, role,
      twoFactorVerified: true, issuedAt: Date.now(), expiresAt: Date.now() + 3600_000,
    }));
  };

  it('le tableau de bord commercial affiche les deux cagnottes et leur seuil', async () => {
    openSession('commercial', 'usr_jean', 'Jean Mveng', 'commercial');
    visit('/commercial/tableau-de-bord');
    render(<App />);

    expect(await screen.findByText('Gains de la semaine', {}, { timeout: 8000 })).toBeTruthy();
    expect(screen.getByText('Conversions Premium différées')).toBeTruthy();
    expect(screen.getAllByText(/Demander le virement|Seuil non atteint/).length).toBeGreaterThan(0);
  });

  it("la comptabilité admin affiche des totaux cohérents entre eux", async () => {
    openSession('admin', 'usr_admin', 'Super Administrateur', 'super_admin');
    visit('/admin/comptabilite');
    render(<App />);

    expect(await screen.findByText('Chaîne de calcul', {}, { timeout: 8000 })).toBeTruthy();
    expect(screen.getByText(/Contrôle de cohérence validé/)).toBeTruthy();

    // `toLocaleString('fr-FR')` sépare les milliers par une espace fine
    // insécable : on normalise avant de comparer.
    const text = (document.body.textContent ?? '').replace(/[\s  ]+/g, ' ');

    // Le cumul correct est affiché…
    expect(text).toContain('1 852 000');
    expect(text).toContain('8 148 000');
    expect(text).toContain('5 748 000');
    // …et les trois valeurs incohérentes relevées par l'audit ont disparu.
    expect(text).not.toContain('2 140 000');
    expect(text).not.toContain('612 000 FCFA');
    expect(text).not.toContain('26 700');
  });
});

describe('sélecteur de pays partagé', () => {
  it("est présent sur l'écran Bienvenue du portail élève", () => {
    visit('/app');
    render(<App />);
    expect(screen.getByLabelText('Ton pays')).toBeTruthy();
  });

  it("est présent sur l'écran de connexion de l'Espace Commercial", () => {
    visit('/commercial/connexion');
    render(<App />);
    expect(screen.getByLabelText(/Numéro de téléphone professionnel/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /\+237/ })).toBeTruthy();
  });
});
