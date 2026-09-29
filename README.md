# Mon Projet Mbeng

SaaS de préparation linguistique, d'accompagnement administratif et d'intégration
professionnelle pour les projets camerounais vers l'Allemagne.

L'application réunit **trois portails strictement cloisonnés** et un **site public**.

---

## Démarrer

```bash
npm install
npm run dev       # http://localhost:3000
```

Autres commandes :

| Commande         | Rôle                                                        |
| ---------------- | ----------------------------------------------------------- |
| `npm run build`  | Typecheck strict + bundle de production dans `dist/`         |
| `npm run test`   | Suite de tests (logique métier, contrôle d'accès, rendu)     |
| `npm run verify` | `tsc` + tests — à lancer avant tout commit                   |
| `npm run preview`| Sert le build de production                                  |

---

## Les 4 espaces

| Espace                 | Adresse                       | Entrée obligatoire                   |
| ---------------------- | ----------------------------- | ------------------------------------ |
| Site public (desktop)  | `/`                           | aucune                               |
| Portail Utilisateur    | `/app`                        | `/app/bienvenue` → connexion / OTP   |
| Espace Commercial      | `/commercial`                 | `/commercial/connexion`              |
| Administration         | `/admin`                      | `/admin/connexion` + 2FA             |

Sur **mobile**, `/` redirige directement vers `/app` ; sur **écran large**, `/`
sert la page marketing.

### Comptes de démonstration (développement uniquement)

| Portail     | Identifiant                  | Mot de passe |
| ----------- | ---------------------------- | ------------ |
| Utilisateur | `+237 699 45 61 28`          | `mbeng2026`  |
| Commercial  | `+237 690 12 77 34`          | `agent2026`  |
| Admin       | `admin@monprojetmbeng.com`   | `admin2026`  |

L'administration demande ensuite un **code 2FA**, affiché à l'écran en
développement. Ces identifiants sont gardés par `DEV_TOOLS_ENABLED` : un
`npm run build` les élimine du bundle (vérifiable par `grep` sur `dist/`).

---

## Architecture

```
src/
  lib/
    business/        Règles métier PURES et testées (barèmes, seuils, comptabilité)
      constants.ts   SOURCE UNIQUE des barèmes — jamais recopiée ailleurs
    data/            Modèle de données + store (équivalent local de PostgreSQL)
    api/             Couche « serveur » : session + rôle vérifiés à chaque appel
    auth/            Sessions cloisonnées par portail
    validation/      Schémas Zod, à chaque frontière d'entrée
    router.tsx       Routage par chemin (History API)
  components/
    web/             Site public (LandingWeb)
    user/            Portail Utilisateur
    commercial/      Espace Commercial
    admin/           Administration
    shared/          Composants transverses (sélecteur de pays, pagination, états…)
```

### Règles structurantes

1. **État par défaut : non connecté.** Aucun composant de données n'est monté
   avant qu'une session du bon portail soit confirmée. Il n'existe aucun
   sélecteur de portail public.
2. **Le contrôle d'accès vit dans `lib/api`**, pas dans les composants : chaque
   fonction commence par `requireSession(scope)` / `requireAdminSection(...)` et
   renvoie 401/403 plutôt que des données.
3. **Un barème n'existe qu'à un seul endroit** (`lib/business/constants.ts`).
4. **Tout total financier est calculé par une fonction testée** qui vérifie sa
   propre cohérence (`brut − reversé − charges = net`) et lève une erreur plutôt
   que d'afficher des chiffres faux.
5. **Toute liste est réellement paginée** : le total annoncé correspond toujours
   aux lignes accessibles.
6. **Toute action sensible écrit dans `audit_log`**, dans la même opération.
7. **Tout outil de test est gardé par `DEV_TOOLS_ENABLED`**, constante remplacée
   par `false` au build : le code disparaît du bundle de production.

---

## Tests

```
src/lib/business/__tests__/agent-earnings.test.ts   cagnottes, seuils, semaine comptable
src/lib/business/__tests__/accounting.test.ts       invariant comptable, churn, euros
src/lib/validation/__tests__/phone.test.ts          saisie et normalisation des numéros
src/lib/api/__tests__/access-control.test.ts        non-régression de la faille d'accès
src/lib/api/__tests__/payout-loop.test.ts           boucle de virement de bout en bout
src/lib/api/__tests__/cms-publish.test.ts           brouillon → aperçu → confirmation → en ligne
src/__tests__/portals.render.test.tsx               les 3 portails s'ouvrent sur une connexion
src/__tests__/login.flow.test.tsx                   connexion réelle des 3 portails
src/__tests__/cms.render.test.tsx                   l'espace CMS et son assistant de publication
```

---

## Espace Contenu (CMS)

Le CMS n'est pas un formulaire : c'est un poste de travail en trois volets.

| Volet | Rôle |
| ----- | ---- |
| **Navigateur** | La structure réelle de l'application mobile, section par section, avec ce qui est publié et ce qui attend |
| **Contenu** | Ce que contient la section, **dans l'ordre vu par l'élève** : édition, réordonnancement, dépublication, suppression |
| **Aperçu** | L'écran mobile correspondant, rendu avec les composants de l'application |

Publier suit toujours le même chemin, imposé par le backend :

```
Contenu (fichier compris)  →  Aperçu mobile  →  2 confirmations cochées  →  En ligne
        brouillon                relecture           publishContent()        visible
```

Deux règles structurantes :

1. **Une ressource porte son support.** `CONTENT_TYPE_DEFS` décrit, pour chaque
   type, le fichier attendu, les extensions acceptées et les champs
   obligatoires. Un podcast sans audio ou un examen blanc sans sujet est refusé
   à la création **et** à la publication.
2. **L'aperçu ne peut pas mentir.** Il utilise `ResourceCard`, le composant qui
   rend aussi les listes de l'application élève. Un seul code de rendu, deux
   appelants.

Ajouter une section à l'application revient à ajouter une entrée dans
`lib/data/mobile-sections.ts` : elle apparaît aussitôt dans le navigateur, dans
l'aperçu et dans la validation.

---

## Bascule vers le backend Supabase

La cible décrite par le Manuel technique backend est Next.js + Supabase. Le
découpage actuel a été fait pour que la bascule ne touche **aucun écran** :

| Aujourd'hui                     | Demain                                              |
| ------------------------------- | --------------------------------------------------- |
| `lib/data/store.ts`             | tables PostgreSQL + migrations `supabase/migrations` |
| `requireSession` / `requireAdminSection` | `supabase.auth` + policies RLS             |
| `paginate()`                    | `.range()` côté requête                              |
| `lib/api/otp.ts`                | Edge Function `send-otp` (WhatsApp, SMS en secours)  |
| `withIdempotency()`             | colonne `idempotency_key` + contrainte d'unicité     |
| `writeAudit()`                  | insertion dans `audit_log`                           |

`lib/business/*` et tous les composants sont réutilisés tels quels.
Les variables d'environnement attendues sont listées dans `.env.example`.
