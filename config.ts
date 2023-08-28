export const environment:('dev' | 'node' | 'web3') = 'dev';

// Smart Contracts
export const HOPR_CHANNELS_SMART_CONTRACT_ADDRESS = '0xfabee463f31e39ec8952bbfb4490c41103bf573e';
export const mHOPR_TOKEN_SMART_CONTRACT_ADDRESS = '0x66225dE86Cac02b32f34992eb3410F59DE416698';
export const xHOPR_TOKEN_SMART_CONTRACT_ADDRESS = '0xD057604A14982FE8D88c5fC25Aac3267eA142a08';
export const wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS = '0xD4fdec44DB9D44B8f2b6d529620f9C0C7066A2c1';
export const wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS = '0x097707143e01318734535676cfe2e5cF8b656ae8';
export const GNOSIS_CHAIN_HOPR_BOOST_NFT = "0x43d13d7b83607f14335cf2cb75e87da369d056c7";

// App 
export const HOPR_TOKEN_USED = 'mHOPR';
export const HOPR_TOKEN_USED_CONTRACT_ADDRESS = mHOPR_TOKEN_SMART_CONTRACT_ADDRESS;


// Safe Contracts
export const SAFE_SERVICE_URL = 'https://safe-transaction.stage.hoprtech.net';
export const HOPR_NODE_STAKE_FACTORY = '0x6E078019EEE40B249fa3A876E7a6b089B77cFf9b';
export const HOPR_NODE_MANAGEMENT_MODULE = '0x683D3859DFb5a8c0F00703F9466f4CC09A6431d2';
export const HOPR_NODE_SAFE_REGISTRY = '0x715978DC28c44410A187C7D3d5a308c7d7b1096d';

//Subgraphs
export const STAKE_SUBGRAPH = 'https://api.studio.thegraph.com/query/40439/hopr-stake-all-seasons/v0.0.10';
export const STAKING_V2_SUBGRAPH = 'https://api.studio.thegraph.com/query/40438/subgraph-dufour/version/latest';
//export const STAKING_V2_SUBGRAPH = 'https://api.studio.thegraph.com/proxy/40438/test-dufour/version/latest';

// Wallet Connect
export const VITE_WALLET_CONNECT_PROJECT_ID = "efdce6b5c6b10913211ff1b40bc4d54d"