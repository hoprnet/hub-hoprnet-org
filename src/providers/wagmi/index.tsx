import { useEffect } from 'react';
import Updater from './updater';

// Store
import { useAppDispatch } from '../../store';
import { web3Actions } from '../../store/slices/web3';

// wagmi
import { gnosis, localhost } from '@wagmi/core/chains';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';

//wagmi connectors
import { createWalletClient, custom, publicActions } from 'viem';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { injected } from 'wagmi/connectors'
import { walletConnect } from 'wagmi/connectors'
import { VITE_WALLET_CONNECT_PROJECT_ID } from '../../../config';
import { http } from 'wagmi'

// No way to tell what the ethereum request can be so has to be any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EthereumProvider = { request(...args: any): Promise<any> };
type WindowWithEthereum = { ethereum: EthereumProvider };

const {
  chains,
  publicClient,
} = configureChains(
  [gnosis],
  [publicProvider()],
  {
    pollingInterval: 30_000,
    stallTimeout: 5_000,
    rank: true,
  },
);

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
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({
      projectId: VITE_WALLET_CONNECT_PROJECT_ID ,
    }),
    // add localhost only to injected connector
    // because wallet connect fails with it
    injected(),
  ],

  publicClient: (chain) => {
    // this means even if connected through wallet connect
    // the requests will go through the wallet client
    if (walletIsInBrowser) {
      // enforce this type because
      // it is checked before
      return browserClient!;
    }

    // no ethereum found in window
    return publicClient(chain);
  },
});

export default function WagmiProvider(props: React.PropsWithChildren) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(web3Actions.setWalletPresent(walletIsInBrowser));
  }, [walletIsInBrowser]);

  return (
    <WagmiConfig config={config}>
      {props.children}
      <Updater />
    </WagmiConfig>
  );
}
