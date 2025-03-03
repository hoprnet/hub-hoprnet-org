import { useEffect } from 'react';
import Updater from './updater';

// Store
import { useAppDispatch } from '../../store';
import { web3Actions } from '../../store/slices/web3';

// wagmi
import { gnosis, localhost } from 'wagmi/chains';
import {
   WagmiProvider,
   createConfig,
   fallback,
   unstable_connector,
  } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

//wagmi connectors
import { createWalletClient, custom, publicActions } from 'viem';
import { injected } from 'wagmi/connectors'
import { walletConnect } from 'wagmi/connectors'
import { VITE_WALLET_CONNECT_PROJECT_ID } from '../../../config';
import { http } from 'wagmi'

// No way to tell what the ethereum request can be so has to be any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EthereumProvider = { request(...args: any): Promise<any> };
type WindowWithEthereum = { ethereum: EthereumProvider };

const walletIsInBrowser =
  typeof window !== 'undefined' && typeof (window as unknown as WindowWithEthereum).ethereum !== 'undefined';

export const browserClient = walletIsInBrowser
  ? createWalletClient({
    chain: gnosis,
    transport: custom((window as unknown as WindowWithEthereum).ethereum),
  }).extend(publicActions)
  : null;

const config = createConfig({
  //  autoConnect: true, // TODO: TEST OUT AFTER autoConnect was removed from v1 https://wagmi.sh/react/guides/migrate-from-v1-to-v2#removed-suspense-property
  chains: [gnosis],
  connectors: [injected()],
  transports: {
    [gnosis.id]:// fallback([
      unstable_connector(injected),
   //   http('https://rpc.gnosischain.com/')
   //? ])
  },
});

const queryClient = new QueryClient();

export default function WagmiProviderContainer(props: React.PropsWithChildren) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(web3Actions.setWalletPresent(walletIsInBrowser));
  }, [walletIsInBrowser]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {props.children}
        <Updater />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
