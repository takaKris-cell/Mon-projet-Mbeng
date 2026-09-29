import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    // Les tests de logique métier tournent en Node ; seuls les tests de rendu
    // demandent un DOM, via la directive `@vitest-environment jsdom`.
    environment: 'node',
    pool: 'threads',
    testTimeout: 20_000,
    hookTimeout: 30_000,
    teardownTimeout: 30_000,
  },
});
