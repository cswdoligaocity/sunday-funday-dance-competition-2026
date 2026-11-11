
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/sundayfundaydancecompetition/',
  build: {
    outDir: 'dist/sundayfundaydancecompetition',
    emptyOutDir: true
  }
});
