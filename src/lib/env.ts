/**
 * Manuel backend §11 — « Tout outil de test doit être conditionné par une
 * variable d'environnement qui ne peut jamais être vraie en production, jamais
 * un simple `if` visuel ».
 *
 * `import.meta.env.DEV` est remplacé statiquement par Vite au moment du build :
 * dans un bundle de production la constante vaut `false` et TOUT le code gardé
 * par ces helpers est éliminé à la compilation — il n'est même pas livré.
 */
export const IS_DEV: boolean = import.meta.env.DEV === true;

/** Outils de simulation (états de paiement, bascule de portail, code OTP affiché). */
export const DEV_TOOLS_ENABLED: boolean =
  IS_DEV && import.meta.env.VITE_DISABLE_DEV_TOOLS !== 'true';

/** Latence simulée des appels « serveur », pour que les états de chargement soient réels. */
export const SIMULATED_LATENCY_MS = IS_DEV ? 260 : 320;
