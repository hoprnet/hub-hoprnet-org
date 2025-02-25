export const environment:('dev' | 'node' | 'web3') = 'web3'; //'node';

// Smart Contracts
export const mHOPR_TOKEN_SMART_CONTRACT_ADDRESS = '0x66225dE86Cac02b32f34992eb3410F59DE416698';
export const xHOPR_TOKEN_SMART_CONTRACT_ADDRESS = '0xD057604A14982FE8D88c5fC25Aac3267eA142a08';
export const wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS = '0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1';
export const wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS = '0x097707143e01318734535676cfe2e5cF8b656ae8';
export const GNOSIS_CHAIN_HOPR_BOOST_NFT = '0x43d13d7b83607f14335cf2cb75e87da369d056c7';
export const MULTISEND_CONTRACT_GNOSIS = '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526';

// App
export const HOPR_TOKEN_USED = 'wxHOPR';
export const HOPR_TOKEN_USED_CONTRACT_ADDRESS = wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS;

// Safe Contracts
export const SAFE_SERVICE_URL = import.meta.env.VITE_SAFE_SERVICE_URL;
export const HOPR_NODE_STAKE_FACTORY = import.meta.env.VITE_HOPR_NODE_STAKE_FACTORY;
export const HOPR_NODE_MANAGEMENT_MODULE = import.meta.env.VITE_HOPR_NODE_MANAGEMENT_MODULE;
export const HOPR_NODE_SAFE_REGISTRY = import.meta.env.VITE_HOPR_NODE_SAFE_REGISTRY;
export const HOPR_NETWORK_REGISTRY = import.meta.env.VITE_HOPR_NETWORK_REGISTRY;
export const HOPR_CHANNELS_SMART_CONTRACT_ADDRESS = import.meta.env.VITE_HOPR_CHANNELS_SMART_CONTRACT_ADDRESS;
export const HOPR_ANNOUNCEMENT_SMART_CONTRACT_ADDRESS = import.meta.env.VITE_HOPR_ANNOUNCEMENT_SMART_CONTRACT_ADDRESS;

//API
export const WEB_API = 'https://webapi.hoprnet.org/api';

//Subgraphs
export const STAKE_SUBGRAPH = 'https://webapi.hoprnet.org/api/hub/subgraph-allSeasons';
export const STAKING_V2_SUBGRAPH = 'https://webapi.hoprnet.org/api/hub/subgraph-dufour';

// Wallet Connect
export const VITE_WALLET_CONNECT_PROJECT_ID = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;

// Minimum to be funded
export const MINIMUM_WXHOPR_TO_FUND = 30_000;
export const MINIMUM_WXHOPR_TO_FUND_NFT = 10_000;
export const MINIMUM_XDAI_TO_FUND = 2;
export const MINIMUM_XDAI_TO_FUND_NODE = 1;
export const DEFAULT_ALLOWANCE = 1000;
