import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' gera caminhos relativos: o build funciona em qualquer subpasta
// (GitHub Pages, servidor local ou abrindo a pasta dist em outro host).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
