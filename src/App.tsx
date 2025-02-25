import { useEffect } from 'react';
import styled from '@emotion/styled';
import { ThemeProvider } from '@mui/material';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import WagmiProvider from './providers/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import router from './router';
import store from './store';
import { ToastContainer } from 'react-toastify';
import theme from './theme';
import * as Fathom from 'fathom-client';
import { environment } from '../config';
import packageJson from '../package.json';

const VersionComponent = styled.div`
  position: fixed;
  bottom: 4px;
  right: 4px;
  font-size: 10px;
`;

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    if (environment === 'node') {
      Fathom.load('MJISRYNH', { url: 'https://cdn-eu.usefathom.com/script.js', spa: 'auto', excludedDomains: ['localhost:5173'] });
    } else if (environment === 'web3') {
      Fathom.load('KBDXKTMO', { url: 'https://cdn-eu.usefathom.com/script.js', spa: 'auto', excludedDomains: ['localhost:5173']  });
    }
  }, []);

  return (
    <Provider store={store}>
      <WagmiProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <ToastContainer
              position="bottom-right"
              limit={10}
            />
            <RouterProvider router={router} />
            <VersionComponent>Version: {packageJson.version}</VersionComponent>
          </ThemeProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </Provider>
  );
}

export default App;
