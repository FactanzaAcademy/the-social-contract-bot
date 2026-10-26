import { defineConfig } from 'vitest/config';

// Solo i test del progetto. Le dipendenze stanno in npm-deps.nosync (fuori da iCloud), raggiunte
// tramite il link simbolico node_modules: preserveSymlinks evita di caricare vitest due volte.
export default defineConfig({ resolve: { preserveSymlinks: true }, test: { include: ['test/**/*.test.js'] } });
