import { useEffect } from 'react';
import { createBrowserRouter, RouteObject, useSearchParams, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { environment } from '../config';
import { useDisconnect } from 'wagmi';
import { parseAndFormatUrl } from './utils/parseAndFormatUrl';
import { trackGoal } from 'fathom-client';

// Store
import { useAppDispatch, useAppSelector } from './store';
import { web3Actions } from './store/slices/web3';
import { appActions } from './store/slices/app';
import { safeActions } from './store/slices/safe';
import { stakingHubActions } from './store/slices/stakingHub';

// Sections
import StakingLandingPage from './pages/staking-hub/landingPage';
import SectionWeb3 from './pages/staking-hub/web3';
import SectionSafe from './pages/staking-hub/safe';
import WrapperPage from './pages/staking-hub/wrapper';
import StakingScreen from './pages/staking-hub/dashboard/staking';
import SafeWithdraw from './pages/staking-hub/safeWithdraw';
import NodeAdded from './pages/staking-hub/dashboard/node';
import SafeActions from './pages/staking-hub/dashboard/transactions';
import NoNodeAdded from './pages/staking-hub/dashboard/noNodeAdded';
import Onboarding from './pages/staking-hub/onboarding';
import OnboardingNextNode from './pages/staking-hub/onboarding/nextNode';
import Dashboard from './pages/staking-hub/dashboard';
import StakewxHOPR from './pages/staking-hub/stakewxHOPR';
import StakexDAI from './pages/staking-hub/stakexDai';
import SetAllowance from './pages/staking-hub/setAllowance';
import FundNode from './pages/staking-hub/fundNode';
import EditOwners from './pages/staking-hub/editOwners';
import GnoAirdrop from './pages/staking-hub/gno-airdrop'

// Layout
import Layout from './future-hopr-lib-components/Layout';
import ConnectWeb3 from './components/ConnectWeb3';
import ConnectSafe from './components/ConnectSafe';
import NotificationBar from './components/NotificationBar';
import InfoBar from './components/InfoBar';

// Icons
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LockIcon from '@mui/icons-material/Lock';
import SavingsIcon from '@mui/icons-material/Savings';
import DevelopIcon from '@mui/icons-material/Code';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import WalletIcon from '@mui/icons-material/Wallet';
import TrainIcon from './future-hopr-lib-components/Icons/TrainIcon';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import TermsOfService from './pages/TermsOfService';
import PrivacyNotice from './pages/PrivacyNotice';
import MetaMaskFox from './future-hopr-lib-components/Icons/MetaMaskFox';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import GnoAridropIcon from './future-hopr-lib-components/Icons/GnoAirdropIcon';

export type ApplicationMapType = {
  groupName: string;
  path: string;
  icon: JSX.Element;
  mobileOnly?: boolean | null;
  items: {
    name?: string;
    path: string;
    overwritePath?: string;
    icon?: JSX.Element;
    element?: JSX.Element;
    inDrawer?: boolean | null;
    loginNeeded?: 'node' | 'web3' | 'safe';
    onClick?: () => void;
    mobileOnly?: boolean | null;
    numberKey?: string;
  }[];
}[];

export const applicationMapStakingHub: ApplicationMapType = [
  {
    groupName: 'STAKING HUB',
    path: 'staking',
    icon: <DevelopIcon />,
    items: [
      {
        name: 'Staking Hub',
        path: 'staking-hub-landing',
        overwritePath: '/',
        icon: <SavingsIcon />,
        element: <StakingLandingPage />,
      },
      {
        name: 'Onboarding',
        path: 'onboarding',
        icon: <TrainIcon />,
        element: <Onboarding />,
        loginNeeded: 'web3',
      },
      {
        name: 'Onboarding',
        path: 'onboarding/nextNode',
        icon: <TrainIcon />,
        element: <OnboardingNextNode />,
        loginNeeded: 'web3',
        inDrawer: false,
      },
      {
        name: 'Dashboard',
        path: 'dashboard',
        icon: <SpaceDashboardIcon />,
        element: <Dashboard />,
        loginNeeded: 'safe',
      },
      {
        name: 'Withdraw',
        path: 'withdraw',
        icon: <WalletIcon />,
        element: <SafeWithdraw />,
        loginNeeded: 'safe',
      },
      {
        name: 'Wrapper',
        path: 'wrapper',
        icon: <PaidIcon />,
        element: <WrapperPage />,
        loginNeeded: 'web3',
      },
      {
        path: 'edit-owners',
        element: <EditOwners />,
        loginNeeded: 'safe',
        inDrawer: false,
      },
      {
        path: 'stake-wxHOPR',
        element: <StakewxHOPR />,
        loginNeeded: 'safe',
        inDrawer: false,
      },
      {
        path: 'stake-xDAI',
        element: <StakexDAI />,
        loginNeeded: 'safe',
        inDrawer: false,
      },
      {
        path: 'set-allowance',
        element: <SetAllowance />,
        loginNeeded: 'safe',
        inDrawer: false,
      },
      {
        path: 'fund-node',
        element: <FundNode />,
        loginNeeded: 'safe',
        inDrawer: false,
      },
      // {
      //   path: 'gno-airdrop',
      //   element: <GnoAirdrop />,
      //   icon: <GnoAridropIcon />,
      //   name: 'GNO Airdrop',

      // },
      {
        path: 'dev',
        element: <SectionSafe />,
        loginNeeded: 'web3',
        inDrawer: false,
      },
    ],
  },
  {
    groupName: 'RESOURCES',
    path: 'networking',
    icon: <DevelopIcon />,
    items: [
      {
        name: 'Docs',
        path: 'https://docs.hoprnet.org/',
        icon: <DescriptionOutlinedIcon />,
        // element: <span/>,
      },
    ],
  },
];

export const applicationMapDevWeb3: ApplicationMapType = [
  {
    groupName: 'Dev Pages',
    path: 'dev-pages',
    icon: <DevelopIcon />,
    items: [
      {
        name: 'Web3 Store',
        path: 'web3',
        icon: <AccountBalanceWalletIcon />,
        element: <SectionWeb3 />,
        loginNeeded: 'web3',
      },
      {
        name: 'Safe Store',
        path: 'safe',
        icon: <LockIcon />,
        element: <SectionSafe />,
        loginNeeded: 'web3',
      },
    ],
  },
];

export const applicationMapDev: ApplicationMapType = [
  {
    groupName: 'DEVELOP / Steps',
    path: 'steps',
    icon: <DevelopIcon />,
    items: [],
  },
];

function createApplicationMap() {
  const temp: ApplicationMapType = [];
  if (environment === 'dev' || environment === 'web3') applicationMapStakingHub.map((elem) => temp.push(elem));
  if (environment === 'dev') applicationMapDevWeb3.map((elem) => temp.push(elem));
  if (environment === 'dev') applicationMapDev.map((elem) => temp.push(elem));
  return temp;
}

export const applicationMap: ApplicationMapType = createApplicationMap();

const LayoutEnhanced = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { disconnect } = useDisconnect();
  const nodeConnected = useAppSelector((store) => store.auth.status.connected);
  const web3Connected = useAppSelector((store) => store.web3.status.connected);
  const safeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);
  const isConnected = useAppSelector((store) => store.web3.status.connected);
  const [searchParams] = useSearchParams();
  const HOPRdNodeAddressForOnboarding = searchParams.get('HOPRdNodeAddressForOnboarding'); //Address given in HOPRd: https://hub.hoprnet.org/staking/onboarding?HOPRdNodeAddressForOnboarding={my_address}

  const numberOfPeers = useAppSelector((store) => store.node.peers.data?.connected.length);
  const numberOfAliases = useAppSelector((store) => store.node.aliases?.data && Object.keys(store.node.aliases?.data).length);
  const numberOfMessagesReceived = useAppSelector((store) => store.node.messages.data.length);
  const numberOfChannelsIn = useAppSelector((store) => store.node.channels.data?.incoming.length);
  const numberOfChannelsOut = useAppSelector((store) => store.node.channels.data?.outgoing.length);

  const numberForDrawer = {
    numberOfPeers,
    numberOfAliases,
    numberOfMessagesReceived,
    numberOfChannelsIn,
    numberOfChannelsOut
  }

  useEffect(() => {
    if (!HOPRdNodeAddressForOnboarding) return;
    dispatch(stakingHubActions.setNodeAddressProvidedByMagicLink(HOPRdNodeAddressForOnboarding));
  }, [HOPRdNodeAddressForOnboarding]);

  const showInfoBar = () => {
    if (
      environment === 'web3' &&
      (location.pathname === '/' || location.pathname === '/privacy-notice' || location.pathname === '/tos')
    )
      return false;
    if (isConnected || nodeConnected) return true;
    return false;
  };

  const handleDisconnectMM = () => {
    disconnect();
    dispatch(appActions.resetState());
    dispatch(web3Actions.resetState());
    dispatch(safeActions.resetState());
    dispatch(stakingHubActions.resetState());
    navigate('/');
  };

  const drawerFunctionItems: ApplicationMapType = [
    {
      groupName: 'CONNECTION',
      path: 'function',
      icon: <DevelopIcon />,
      mobileOnly: true,
      items: [
        {
          name: web3Connected ? 'Disconnect' : 'Connect Wallet',
          path: 'function',
          icon: <MetaMaskFox />,
          onClick: () => {
            if (web3Connected) handleDisconnectMM();
            else dispatch(web3Actions.setModalOpen(true));
          },
          mobileOnly: true,
        },
      ],
    },
  ];

  return (
    <Layout
      drawer
      webapp
      drawerItems={applicationMap}
      drawerFunctionItems={environment === 'web3' ? drawerFunctionItems : undefined}
      drawerNumbers={numberForDrawer}
      drawerLoginState={{
        node: nodeConnected,
        web3: web3Connected,
        safe: !!safeAddress && web3Connected,
      }}
      className={environment}
      drawerType={environment === 'web3' ? 'blue' : undefined}
      itemsNavbarRight={
        <>
          {(environment === 'dev' || environment === 'node') && <NotificationBar />}
          {(environment === 'dev' || environment === 'web3') && web3Connected && safeAddress && <ConnectSafe />}
          {(environment === 'dev' || environment === 'web3') && <ConnectWeb3 inTheAppBar />}
        </>
      }
      drawerRight={showInfoBar() && <InfoBar />}
    />
  );
};

var routes = [
  {
    path: '/',
    element: <LayoutEnhanced />,
    children: [] as RouteObject[],
  },
  {
    path: '*',
    element: (
      <Navigate
        to="/"
        replace
      />
    ),
    children: [] as RouteObject[],
  },
];

applicationMap.map((groups) => {
  groups.items.map((item) => {
    routes[0].children.push({
      path: '/',
      element: <StakingLandingPage />,
    });
    if (item.path && item.element) {
      routes[0].children.push({
        path: item.overwritePath ? item.overwritePath : groups.path + '/' + item.path,
        element: item.element,
      });
    }
  });
});

routes[0].children.push({
  path: '/tos',
  element: <TermsOfService />,
});
routes[0].children.push({
  path: '/privacy-notice',
  element: <PrivacyNotice />,
});

const router = createBrowserRouter(routes);

export default router;
