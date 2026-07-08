import { defineConfig } from 'vitest/config';

/**
 * The server is authored as NodeNext ESM: relative imports carry a `.js`
 * extension even though the files on disk are `.ts` (e.g. `../rooms/store.js`).
 * Vitest/Vite don't rewrite that by default, so this pre-resolver maps a
 * relative `*.js` import to its `*.ts` sibling when one exists.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  plugins: [
    {
      name: 'resolve-ts-from-js',
      enforce: 'pre',
      async resolveId(source, importer) {
        if (importer && source.startsWith('.') && source.endsWith('.js')) {
          const asTs = source.slice(0, -3) + '.ts';
          const resolved = await this.resolve(asTs, importer, { skipSelf: true });
          if (resolved) return resolved;
        }
        return null;
      },
    },
  ],
});
