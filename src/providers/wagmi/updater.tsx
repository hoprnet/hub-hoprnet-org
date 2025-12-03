import { useEffect } from 'react';
import { wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS, xHOPR_TOKEN_SMART_CONTRACT_ADDRESS } from '../../../config';
import { getChainName } from '../../utils/getChainName';
import { erc721Abi } from 'viem';

// wagmi
import { useBalance, useConnection, useBlockNumber, useReadContracts } from 'wagmi';
import { useEthersSigner } from '../../hooks';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';
import { safeActions } from '../../store/slices/safe';
import { appActions } from '../../store/slices/app';
import { web3Actions, web3ActionsAsync } from '../../store/slices/web3';
import { stakingHubActions, stakingHubActionsAsync } from '../../store/slices/stakingHub';

export default function WagmiUpdater() {
  // const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const signer = useEthersSigner();
  const nodeHoprAddress = useAppSelector((store) => store.stakingHub.onboarding.nodeAddress) as `0x${string}`; // Staking Hub
  const addressInStore = useAppSelector((store) => store.web3.account);
  const web3Disconnecting = useAppSelector((store) => store.web3.status.disconnecting);

  // Wallet Account
  const { address, chainId, isConnected, connector } = useConnection();

  // **********************
  // Leaving for on-going testing of wagmi losing connection with wallet
  useEffect(() => {
    console.log('Detected wagmi address change', address);
  }, [address]);

  useEffect(() => {
    console.log('Detected wagmi isConnected change', isConnected);
  }, [isConnected]);

  useEffect(() => {
    console.log('Detected wagmi connector change', connector);
  }, [connector]);

  // If wagmi is not always able to detect address change, add this code:

  useEffect(() => {
    function handleAccountsChanged(accounts: string[]) {
      if (accounts && accounts[0] && typeof accounts[0] === 'string') {
        //set_lastAccountUsed(accounts[0]);
        console.log('Detected accountsChanged event', accounts[0]);
      }
    }

    function addEventListener() {
      window?.ethereum?.on('accountsChanged', handleAccountsChanged);
    }

    function removeEventListener() {
      window?.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    }

    window.addEventListener('load', addEventListener);

    return () => {
      window.addEventListener('beforeunload', removeEventListener);
    };
  }, []);

  // **********************

  // Account change in Wallet
  useEffect(() => {
    if (addressInStore === address) return;
    if (web3Disconnecting) return;

    if (isConnected && address) {
      //reset whole app
      dispatch(appActions.resetState());
      dispatch(web3Actions.resetState());
      dispatch(safeActions.resetState());
      dispatch(stakingHubActions.resetStateWithoutMagicLinkForOnboarding());

      //fill the store
      dispatch(web3Actions.setAccount(address));
      dispatch(web3Actions.setConnected(isConnected));
      // dispatch(web3ActionsAsync.getCommunityNftsOwnedByWallet({ account: address }));
      dispatch(stakingHubActionsAsync.getHubSafesByOwnerThunk(address));
    }
    if (!isConnected) {
      dispatch(web3Actions.setConnected(isConnected));
      dispatch(web3Actions.setAccount(null));
    }
  }, [isConnected, addressInStore, address, web3Disconnecting]);

  useEffect(() => {
    if (!isConnected || !chainId) return;
    dispatch(web3Actions.setChainId(chainId));
    const chainName: string | null = getChainName(chainId);
    chainName && dispatch(web3Actions.setChain(chainName));
  }, [isConnected, address, chainId]);

  // Balances
  const selectedSafeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress) as `0x${string}` ;
  const account = useAppSelector((store) => store.web3.account) as `0x${string}`;

  const { data: xDAI_balance, refetch: refetch_xDAI_balance } = useBalance({
    address: account,
  });

  const { data: tokenBalances, refetch: refetchERC20 } = useReadContracts({
    contracts: [
      {
        address: wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
        abi: erc721Abi,
        functionName: 'balanceOf',
        args: [account],
      },
      {
        address: xHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
        abi: erc721Abi,
        functionName: 'balanceOf',
        args: [account],
      },
      {
        address: wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
        abi: erc721Abi,
        functionName: 'balanceOf',
        args: [selectedSafeAddress ],
      },
      {
        address: xHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
        abi: erc721Abi,
        functionName: 'balanceOf',
        args: [selectedSafeAddress ],
      },
    ],
  });

  const wxHopr_balance = tokenBalances && tokenBalances[0] && (tokenBalances[0]?.result?.toString()) ? (tokenBalances[0]?.result?.toString()) : null;
  const xHopr_balance = tokenBalances && tokenBalances[1] && (tokenBalances[1]?.result?.toString()) ? (tokenBalances[1]?.result?.toString()) : null;
  const safe_wxHopr_balance = tokenBalances && tokenBalances[2] && (tokenBalances[2]?.result?.toString()) ? (tokenBalances[2]?.result?.toString()) : null;
  const safe_xHopr_balance = tokenBalances && tokenBalances[3] && (tokenBalances[3]?.result?.toString()) ? (tokenBalances[3]?.result?.toString()) : null;

  const { data: safe_xDAI_balance, refetch: refetch_safe_xDAI_balance } = useBalance({
    address: selectedSafeAddress,
  });

  const { data: nodeLinkedToSafe_xDai_balance, refetch: refetch_nodeLinkedToSafe_xDai_balance } = useBalance({
    address: nodeHoprAddress,
  });

  const { data: blockNumber } = useBlockNumber({ watch: true });

  useEffect(() => {
    refetchERC20();
    refetch_xDAI_balance();
    refetch_safe_xDAI_balance();
    refetch_nodeLinkedToSafe_xDai_balance();
  }, [blockNumber]);

  useEffect(() => {
    if (xDAI_balance)
      dispatch(
        web3Actions.setWalletBalance_xDai({
          ...xDAI_balance,
          value: xDAI_balance.value.toString(),
        })
      );
  }, [xDAI_balance]);

  useEffect(() => {
    if (wxHopr_balance)
      dispatch(
        web3Actions.setWalletBalance_wxHopr(wxHopr_balance)
      );
  }, [wxHopr_balance]);

  useEffect(() => {
    if (xHopr_balance)
      dispatch(
        web3Actions.setWalletBalance_xHopr(xHopr_balance)
      );
  }, [xHopr_balance]);

  useEffect(() => {
    if (safe_xDAI_balance)
      dispatch(
        safeActions.setSafeBalance_xDai({
          ...safe_xDAI_balance,
          value: safe_xDAI_balance.toString(),
        })
      );
  }, [safe_xDAI_balance]);

  useEffect(() => {
    if (safe_wxHopr_balance)
      dispatch(
        safeActions.setSafeBalance_wxHopr(safe_wxHopr_balance)
      );
  }, [safe_wxHopr_balance]);

  useEffect(() => {
    if (safe_xHopr_balance)
      dispatch(
        safeActions.setSafeBalance_xHopr(safe_xHopr_balance)
      );
  }, [safe_xHopr_balance]);

  useEffect(() => {
    if (nodeLinkedToSafe_xDai_balance)
      dispatch(
        stakingHubActions.setNodeLinkedToSafeBalance_xDai({
          ...nodeLinkedToSafe_xDai_balance,
          value: nodeLinkedToSafe_xDai_balance.value.toString(),
        })
      );
  }, [nodeLinkedToSafe_xDai_balance]);

  return <></>;
}
