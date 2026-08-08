import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The `cubing` package's scramble generation runs in a web worker;
  // it needs ES module workers, not Vite's default IIFE format.
  worker: {
    format: 'es',
  },
});
