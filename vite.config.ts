import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import svgrPlugin from 'vite-plugin-svgr';
import nodePolyfills from 'vite-plugin-node-stdlib-browser'

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    optimizeDeps: { include: ['@mui/material', '@emotion/react', '@emotion/styled'] },
    plugins: [
      // adds browser polyfills of Node.js built-in libraries
      nodePolyfills(),
      // import svg
      svgrPlugin(),
      // linter
      checker({
        overlay: false,
        typescript: true,
      }),
      // emotion setup with react
      react({
        jsxImportSource: '@emotion/react',
        babel: { plugins: ['@emotion/babel-plugin'] },
      }),
    ],
    build: {
      outDir: 'build',
      rollupOptions: { onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        warn(warning)
      } },
    },
  };
});
