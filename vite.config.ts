import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import svgrPlugin from 'vite-plugin-svgr';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(() => {
  return {
    optimizeDeps: { include: ['@mui/material', '@emotion/react', '@emotion/styled'] },
    plugins: [
      nodePolyfills({
        protocolImports: true,
      }),
      svgrPlugin(),
      checker({
        overlay: false,
        typescript: true,
      }),
      react({
        jsxImportSource: '@emotion/react',
        babel: { plugins: ['@emotion/babel-plugin'] },
      }),
    ],
    build: {
      outDir: 'build',
      rollupOptions: {
        output: {
          manualChunks: {
            'react': ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit', '@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            'web3': ['viem', 'wagmi', '@safe-global/protocol-kit', '@safe-global/api-kit', '@hoprnet/hopr-sdk'],
          },
        },
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return;
          }
          warn(warning);
        },
      },
    },
  };
});
