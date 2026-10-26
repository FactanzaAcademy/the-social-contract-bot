import { defineConfig } from 'vitest/config';

// Solo i test del progetto. preserveSymlinks serve se node_modules è un link simbolico
// (com'era nella vecchia copia su iCloud): evita di caricare vitest due volte.
export default defineConfig({ resolve: { preserveSymlinks: true }, test: { include: ['test/**/*.test.js'] } });
