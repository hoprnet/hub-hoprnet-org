import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import {
  useReadContract,
  useWriteContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useConnection,
} from 'wagmi';
import { parseUnits, parseEther, toHex, parseTransaction, encodeFunctionData } from 'viem';
import {
  xHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
  wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
  wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS,
  MULTISEND_CONTRACT_GNOSIS,
  ERC1820_REGISTRY,
} from '../../../config';
import { safeActions, safeActionsAsync } from '../../store/slices/safe';
import { useAppDispatch, useAppSelector } from '../../store';
import { useWalletClient } from 'wagmi';

// Abis
import { MultiSendAbi } from '../../utils/abis/MultiSendAbi';
import { SafeProxyAbi } from '../../utils/abis/SafeProxyAbi';
import { ERC1820RegistryAbi } from '../../utils/abis/ERC1820RegistryAbi';
import { hoprSafeABI } from '@hoprnet/hopr-sdk/dist/ethereum/stakingV2/hoprSafeABI';

// HOPR Components
import Button from '../../future-hopr-lib-components/Button';
import Section from '../../future-hopr-lib-components/Section';
import NetworkOverlay from '../../components/Overlays/NetworkOverlay';
import { StepContainer } from './onboarding/components';
import AddAddressToERC1820RegistryModal from '../../components/Modal/staking-hub/AddAddressToERC1820RegistryModal';
import SafeTransactionButton from '../../components/SafeTransactionButton';

// Mui
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LaunchIcon from '@mui/icons-material/Launch';
import { web3 } from '@hoprnet/hopr-sdk';
import { IconButton, Paper, TextField, InputAdornment, Button as MuiButton } from '@mui/material';
// import {
//   Select,
//   MenuItem,
// } from '@mui/material';
import Select from '../../future-hopr-lib-components/Select';
import { safe } from 'wagmi/connectors';

const StyledPaper = styled(Paper)`
  padding: 2rem;
  text-align: center;
`;

const WrapperContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;

  & .swap-button {
    align-self: center;
    text-transform: uppercase;
  }
`;

const StyledTextField = styled(TextField)`
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  &:disabled {
    pointer-events: none;
  }
`;

const StyledIconButton = styled(IconButton)`
  align-self: center;
  position: absolute;
  background: linear-gradient(rgba(0, 0, 178, 1), rgba(0, 0, 80, 1));
  top: 28px;
  z-index: 2;

  svg {
    color: #fff;
    transition: transform 0.4s ease;
  }

  &.swapDirection {
    svg {
      transform: rotate(180deg);
    }
  }

  &:disabled {
    background: #e0e0e0;
    & svg {
      color: #a6a6a6;
    }
  }
`;

export const MaxButton = styled(MuiButton)`
  background-color: #ffffa0;
  border-radius: 2px;
  border: none;
  color: #444;
  font-weight: 600;
  padding: 0.2rem 1rem;

  &:disabled {
    background-color: #e0e0e0;
    color: #a6a6a6;
  }
`;

const GnosisLink = styled.a`
  display: inline-flex;
  gap: 2px;
  text-decoration: underline;

  & svg {
    align-self: flex-end;
    height: 16px;
    width: 16px;
  }
`;

type NumberLiteral = `${number}`;

type TransactionLinkProps = {
  isSuccess: boolean;
  hash: `0x${string}` | undefined;
};

function TransactionLink({ isSuccess, hash }: TransactionLinkProps) {
  if (!isSuccess) return null;

  return (
    <span>
      Check out your{' '}
      <GnosisLink
        href={`https://gnosisscan.io/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        transaction
        <LaunchIcon />
      </GnosisLink>
    </span>
  );
}

function WrapperPage() {
  const dispatch = useAppDispatch();
  const { data: signer } = useWalletClient();
  const [fundsSource, set_fundsSource] = useState<'wallet' | 'safe'>('safe');
  const [xhoprValue, set_xhoprValue] = useState('');
  const [wxhoprValue, set_wxhoprValue] = useState('');
  const [showTxInfo, set_showTxInfo] = useState(false);
  const [safeTxOverwrite, set_safeTxOverwrite] = useState<{
    wxHOPRBefore: string | null;
    xHOPRBefore: string | null;
    success: boolean;
  }>({
    wxHOPRBefore: null,
    xHOPRBefore: null,
    success: false,
  });
  const [notEnoughBalance, set_notEnoughBalance] = useState(false);
  const [AddAddressToERC1820RegistryModalOpen, set_AddAddressToERC1820RegistryModalOpen] = useState<boolean>(false);
  const [swapDirection, set_swapDirection] = useState<'xHOPR_to_wxHOPR' | 'wxHOPR_to_xHOPR'>('xHOPR_to_wxHOPR');
  const walletAddress = useAppSelector((store) => store.web3.account);
  const safeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);
  const safesByOwner = useAppSelector((store) => store.safe.safesByOwner.data);
  const [selectedAddress, set_selectedAddress] = useState<string | null>(safeAddress);
  const walletBalance = useAppSelector((store) => store.web3.balance);
  const safeBalance = useAppSelector((store) => store.safe.balance.data);
  const walletIcon = useAppSelector((store) => store.web3.walletIcon);
  const [loading, set_loading] = useState(false);

  useEffect(() => {
    if (fundsSource === 'wallet') {
      set_selectedAddress(walletAddress);
    } else {
      set_selectedAddress(safeAddress);
    }
  }, [fundsSource, walletAddress, safeAddress]);

  // When the user has no safes, we set the selected address to the wallet address
  useEffect(() => {
    if (safesByOwner.length === 0 && safeAddress === null) {
      set_selectedAddress(walletAddress);
      set_fundsSource('wallet');
    }
  }, [safesByOwner, safeAddress]);

  useEffect(() => {
    refetch1();
    refetch2();
    refetchHandler();
  }, [selectedAddress]);

  useEffect(() => {
    set_showTxInfo(false);
  }, [xhoprValue, wxhoprValue]);

  // Enough balance for the TX check
  useEffect(() => {
    if (fundsSource === 'safe') {
      if (!safeBalance.xHopr.value || !safeBalance.wxHopr.value) return;
    } else {
      if (!walletBalance.xHopr.value || !walletBalance.wxHopr.value) return;
    }

    const xhoprEther = parseEther(xhoprValue);
    const wxhoprEther = parseEther(wxhoprValue);
    const xhoprWalletEther = BigInt(
      fundsSource === 'safe' ? (safeBalance.xHopr.value as string) : (walletBalance.xHopr.value as string)
    );
    const wxhoprWalletEther = BigInt(
      fundsSource === 'safe' ? (safeBalance.wxHopr.value as string) : (walletBalance.wxHopr.value as string)
    );

    if (swapDirection === 'xHOPR_to_wxHOPR' && xhoprEther > xhoprWalletEther) set_notEnoughBalance(true);
    else if (swapDirection === 'xHOPR_to_wxHOPR') set_notEnoughBalance(false);
    else if (swapDirection === 'wxHOPR_to_xHOPR' && wxhoprEther > wxhoprWalletEther) set_notEnoughBalance(true);
    else if (swapDirection === 'wxHOPR_to_xHOPR') set_notEnoughBalance(false);
  }, [
    fundsSource,
    swapDirection,
    xhoprValue,
    wxhoprValue,
    walletBalance.xHopr.value,
    walletBalance.xHopr.value,
    safeBalance.wxHopr.value,
    safeBalance.xHopr.value,
  ]);

  const swapButtonDisabled =
    (swapDirection === 'xHOPR_to_wxHOPR' && parseEther(xhoprValue) <= BigInt(0)) ||
    (swapDirection === 'wxHOPR_to_xHOPR' && parseEther(wxhoprValue) <= BigInt(0));

  const { data: handlerData, refetch: refetchHandler } = useReadContract({
    address: ERC1820_REGISTRY,
    abi: [
      {
        constant: true,
        inputs: [
          { name: '_addr', type: 'address' },
          { name: '_interfaceHash', type: 'bytes32' },
        ],
        name: 'getInterfaceImplementer',
        outputs: [{ name: '', type: 'address' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'getInterfaceImplementer',
    args: [selectedAddress as `0x${string}`, '0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b'],
  });

  const handlerIsSet = handlerData !== `0x0000000000000000000000000000000000000000`;

  // Prepare contract write configurations
  // TX: wxHOPR -> xHOPR
  const { data: wxHOPR_to_xHOPR_config, refetch: refetch2 } = useSimulateContract({
    address: wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
    abi: web3.wrapperABI,
    functionName: 'transfer',
    args: [wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS, parseUnits(wxhoprValue as NumberLiteral, 18)],
  });

  // TX: xHOPR -> wxHOPR if handlerData set
  const {
    data: xHOPR_to_wxHOPR_config,
    refetch: refetch1,
    failureReason,
  } = useSimulateContract({
    address: xHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
    abi: web3.wrapperABI,
    functionName: 'transferAndCall',
    args: [wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS, parseUnits(xhoprValue as NumberLiteral, 18), '0x'],
  });

  useEffect(() => {
    if (handlerIsSet) refetch1();
  }, [handlerIsSet]);

  /**  TODO: make it work at some point, probably signature issue
  // xHOPR -> wxHOPR multicall if handlerData not set

  const addressWithout0x = selectedAddress?.replace('0x', '').toLocaleLowerCase() || '';
  const setInterfaceImplementer = `29965a1d000000000000000000000000${addressWithout0x}b281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b000000000000000000000000e530e2f9decf24d7d42f011f54f1e9f8001e7619`;

  const wrapHex = toHex(parseUnits(xhoprValue as NumberLiteral, 18)).replace('0x', '');
  const wrapHexWithZeros = '00000000000000000000000000000000000000000000000000000000000000000'.substring(0, 64 - wrapHex.length) + wrapHex;
  const wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESSWithout0x = wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS?.replace('0x', '').toLocaleLowerCase() || '';
  const xHOPR_to_wxHOPR = `4000aea0000000000000000000000000${wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESSWithout0x}${wrapHexWithZeros}00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000`;
  const multiSendTx: `0x${string}` = `0x8d80ff0a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000192001820a4b7618bde71dce8cdc73aab6c95905fad2400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000064${setInterfaceImplementer}00d057604a14982fe8d88c5fc25aac3267ea142a0800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084${xHOPR_to_wxHOPR}`;
  const { data: xHOPR_to_wxHOPR_config_multicall, refetch: refetch4, failureReason } = useSimulateContract({
    address: selectedAddress as `0x${string}`,
    abi: SafeProxyAbi,
    functionName: 'execTransaction',
    args: [
      "0x9641d764fc13c8B624c04430C7356C1C7C8102e2",
      "0x00",
      "0x8d80ff0a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000192001820a4b7618bde71dce8cdc73aab6c95905fad240000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006429965a1d00000000000000000000000044a5ece3f052c4e54ba3f05980899df0e6bb3798b281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b000000000000000000000000e530e2f9decf24d7d42f011f54f1e9f8001e761900d057604a14982fe8d88c5fc25aac3267ea142a08000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000844000aea0000000000000000000000000097707143e01318734535676cfe2e5cf8b656ae80000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",  // multiSendTx
      1,
      "0x00",
      "0x00",
      "0x00",
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      //TODO: signature FIX (?)
      "0x00000000000000000000000035a3e15a2e2c297686a4fac5999647312fddfa3f000000000000000000000000000000000000000000000000000000000000000001"
    ],
  });

  console.log('xHOPR_to_wxHOPR_config_multicall', xHOPR_to_wxHOPR_config_multicall, failureReason)
  */

  // Perform contract writes and retrieve data.
  const {
    data: xHOPR_to_wxHOPR_data,
    isPending: is_xHOPR_to_wxHOPR_loading,
    isSuccess: is_xHOPR_to_wxHOPR_success,
    isError: is_xHOPR_to_wxHOPR_error,
    writeContract: write_xHOPR_to_wxHOPR,
  } = useWriteContract();

  const {
    data: xHOPR_to_wxHOPR_data_multicall,
    isPending: is_xHOPR_to_wxHOPR_loading_multicall,
    isSuccess: is_xHOPR_to_wxHOPR_success_multicall,
    isError: is_xHOPR_to_wxHOPR_error_multicall,
    writeContract: write_xHOPR_to_wxHOPR_multicall,
  } = useWriteContract();

  const {
    data: wxHOPR_to_xHOPR_data,
    isPending: is_wxHOPR_to_xHOPR_loading,
    isSuccess: is_wxHOPR_to_xHOPR_success,
    isError: is_wxHOPR_to_xHOPR_error,
    writeContract: write_wxHOPR_to_xHOPR,
  } = useWriteContract();

  let hash = xHOPR_to_wxHOPR_data || wxHOPR_to_xHOPR_data || xHOPR_to_wxHOPR_data_multicall;
  const walletLoading =
    is_xHOPR_to_wxHOPR_loading || is_wxHOPR_to_xHOPR_loading || is_xHOPR_to_wxHOPR_loading_multicall;
  const txPending = is_xHOPR_to_wxHOPR_success || is_wxHOPR_to_xHOPR_success || is_xHOPR_to_wxHOPR_success_multicall;
  const txWillBeError = is_xHOPR_to_wxHOPR_error || is_wxHOPR_to_xHOPR_error || is_xHOPR_to_wxHOPR_error_multicall;

  const { data, isError, isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  // In case Safe free TX is used and we never get a TX under the received hash
  const { connector } = useConnection();
  useEffect(() => {
    if (
      connector?.id === 'walletConnect' &&
      hash &&
      isLoading &&
      walletBalance.xHopr.value !== safeTxOverwrite.xHOPRBefore &&
      walletBalance.wxHopr.value !== safeTxOverwrite.wxHOPRBefore &&
      safeTxOverwrite.success === false
    ) {
      console.log('in');
      set_safeTxOverwrite({
        xHOPRBefore: null,
        wxHOPRBefore: null,
        success: true,
      });
    }
    console.log('out');
  }, [connector, hash, safeTxOverwrite, walletBalance, isLoading]);

  useEffect(() => {
    if (txPending || isSuccess) {
      set_showTxInfo(true);
    }
  }, [txPending, isSuccess]);

  const handleSwap = () => {
    if (swapDirection === 'xHOPR_to_wxHOPR') {
      set_swapDirection('wxHOPR_to_xHOPR');
    } else {
      set_swapDirection('xHOPR_to_wxHOPR');
    }
  };

  const handleClick = () => {
    // In case Safe free TX is used and we never get a TX under the received hash
    if (connector?.id === 'walletConnect') {
      set_safeTxOverwrite({
        xHOPRBefore: walletBalance.xHopr.value,
        wxHOPRBefore: walletBalance.wxHopr.value,
        success: false,
      });
    }

    // The real handle
    set_showTxInfo(false);
    if (swapDirection === 'xHOPR_to_wxHOPR') {
      if (handlerIsSet) write_xHOPR_to_wxHOPR_multicall?.(xHOPR_to_wxHOPR_config!.request);
      else set_AddAddressToERC1820RegistryModalOpen(true);
    } else {
      write_wxHOPR_to_xHOPR?.(wxHOPR_to_xHOPR_config!.request);
    }
  };

  // ** Safe wrapper logic **************** */

  const executeSafeSwap = async (signOnly = false) => {
    if (!signer || !selectedAddress || !wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS) return;
    set_loading(true);
    try {
      if (swapDirection === 'xHOPR_to_wxHOPR') {
        if (!handlerIsSet) {
          set_AddAddressToERC1820RegistryModalOpen(true);
          set_loading(false);
          return;
        }
        const TXdata = encodeFunctionData({
          abi: web3.wrapperABI,
          functionName: 'transferAndCall',
          args: [wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS, parseUnits(xhoprValue as NumberLiteral, 18), '0x'],
        });
        const payload = {
          data: TXdata,
          signer,
          safeAddress: selectedAddress as `0x${string}`,
          smartContractAddress: xHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
        };
        await dispatch(
          signOnly
            ? safeActionsAsync.createSafeContractTransactionThunk(payload)
            : safeActionsAsync.createAndExecuteSafeContractTransactionThunk(payload)
        ).unwrap();
      } else {
        const TXdata = encodeFunctionData({
          abi: web3.wrapperABI,
          functionName: 'transfer',
          args: [wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS, parseUnits(wxhoprValue as NumberLiteral, 18)],
        });
        const payload = {
          data: TXdata,
          signer,
          safeAddress: selectedAddress as `0x${string}`,
          smartContractAddress: wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
        };
        await dispatch(
          signOnly
            ? safeActionsAsync.createSafeContractTransactionThunk(payload)
            : safeActionsAsync.createAndExecuteSafeContractTransactionThunk(payload)
        ).unwrap();
      }
      updateBalances();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for the state to update
    } finally {
      set_loading(false);
    }
  };

  /* ************************************** */

  const updateBalances = () => {
    if (
      fundsSource === 'wallet' &&
      selectedAddress &&
      walletBalance.xHopr.formatted &&
      walletBalance.wxHopr.formatted
    ) {
      set_xhoprValue(walletBalance.xHopr.formatted);
      set_wxhoprValue(walletBalance.wxHopr.formatted);
    } else if (
      fundsSource === 'safe' &&
      selectedAddress &&
      safeBalance.xHopr.formatted &&
      safeBalance.wxHopr.formatted
    ) {
      set_xhoprValue(safeBalance.xHopr.formatted);
      set_wxhoprValue(safeBalance.wxHopr.formatted);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      updateBalances();
    }
  }, [
    fundsSource,
    walletBalance.xHopr.formatted,
    walletBalance.wxHopr.formatted,
    safeBalance.xHopr.formatted,
    safeBalance.wxHopr.formatted,
  ]);

  useEffect(() => {
    if (selectedAddress) {
      updateBalances();
    } else {
      set_xhoprValue('');
      set_wxhoprValue('');
    }
  }, [
    selectedAddress,
    walletBalance.xHopr.formatted,
    walletBalance.wxHopr.formatted,
    safeBalance.xHopr.formatted,
    safeBalance.wxHopr.formatted,
  ]);

  // Set the maximum value for xHOPR on input field.
  const setMax_xHOPR = () => {
    if (fundsSource === 'wallet' && walletBalance.xHopr.formatted) {
      set_xhoprValue(walletBalance.xHopr.formatted);
    } else if (fundsSource === 'safe' && safeBalance.xHopr.formatted) {
      set_xhoprValue(safeBalance.xHopr.formatted);
    }
  };

  const setMax_wxHOPR = () => {
    if (fundsSource === 'wallet' && walletBalance.wxHopr.formatted) {
      set_wxhoprValue(walletBalance.wxHopr.formatted);
    } else if (fundsSource === 'safe' && safeBalance.wxHopr.formatted) {
      set_wxhoprValue(safeBalance.wxHopr.formatted);
    }
  };

  const chooseTheSwapDirection = () => {
    if (fundsSource === 'wallet' && walletBalance.wxHopr.value && walletBalance.xHopr.value) {
      if (BigInt(walletBalance.wxHopr.value) < BigInt(walletBalance.xHopr.value)) {
        set_swapDirection('xHOPR_to_wxHOPR');
      } else if (BigInt(walletBalance.wxHopr.value) > BigInt(walletBalance.xHopr.value)) {
        set_swapDirection('wxHOPR_to_xHOPR');
      }
    } else if (fundsSource === 'safe' && safeBalance.wxHopr.value && safeBalance.xHopr.value) {
      if (BigInt(safeBalance.wxHopr.value) < BigInt(safeBalance.xHopr.value)) {
        set_swapDirection('xHOPR_to_wxHOPR');
      } else if (BigInt(safeBalance.wxHopr.value) > BigInt(safeBalance.xHopr.value)) {
        set_swapDirection('wxHOPR_to_xHOPR');
      }
    }
  };

  useEffect(() => {
    chooseTheSwapDirection();
  }, [fundsSource]);

  const swapDisabled =
    (swapDirection === 'xHOPR_to_wxHOPR' && !write_xHOPR_to_wxHOPR) ||
    (swapDirection === 'wxHOPR_to_xHOPR' && !write_wxHOPR_to_xHOPR) ||
    notEnoughBalance ||
    swapButtonDisabled;

  return (
    <Section
      center
      fullHeightMin
      lightBlue
    >
      <StepContainer
        title="Wrapper"
        description={
          <p>
            Utility to wrap (xHOPR &#8594; wxHOPR) and unwrap (wxHOPR &#8594; xHOPR) xHOPR tokens.
            <br />
            <Select
              value={fundsSource}
              onChange={(event) => {
                set_fundsSource(event.target.value as 'wallet' | 'safe');
              }}
              label={'Funds source'}
              labelId="funds-source-select-label"
              style={{ width: '300px', textAlign: 'left' }}
              size="small"
              values={[
                {
                  name: 'Your connected wallet',
                  value: 'wallet',
                  icon: (
                    <img
                      src={walletIcon || ''}
                      alt="Wallet Icon"
                    />
                  ),
                },
                {
                  name: 'Your safe',
                  value: 'safe',
                  disabled: safesByOwner.length === 0 || !safeAddress,
                  icon: (
                    <img
                      src="/assets/safe-icon.svg"
                      alt="Safe Icon"
                    />
                  ),
                },
              ]}
            />
          </p>
        }
        image={{
          src: '/assets/wrapper-wallet-wallet.png',
          alt: 'Funds to safe image',
          height: 134,
        }}
        buttons={
          fundsSource === 'safe' ? (
            <SafeTransactionButton
              executeOptions={{
                onClick: executeSafeSwap,
                disabled: swapDisabled,
                pending: loading,
                buttonText: 'SWAP',
              }}
              signOptions={{
                onClick: () => executeSafeSwap(true),
                disabled: swapDisabled,
                pending: loading,
                buttonText: 'SIGN SWAP',
              }}
            />
          ) : (
            <Button
              className="swap-button"
              disabled={swapDisabled}
              onClick={handleClick}
              pending={(walletLoading || isLoading) && !safeTxOverwrite.success}
            >
              SWAP
            </Button>
          )
        }
      >
        <br />
        <br />
        <br />
        <WrapperContainer>
          <StyledTextField
            label="wxHOPR"
            placeholder="Your wxHOPR here..."
            type="number"
            size="small"
            value={wxhoprValue}
            onChange={(e) => set_wxhoprValue(e.target.value)}
            onPointerDown={() => {
              if (selectedAddress) {
                set_swapDirection('wxHOPR_to_xHOPR');
                setMax_xHOPR();
              }
            }}
            disabled={!selectedAddress || swapDirection === 'xHOPR_to_wxHOPR' || isLoading}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <MaxButton
                    disabled={swapDirection === 'xHOPR_to_wxHOPR'}
                    onClick={setMax_wxHOPR}
                  >
                    Max
                  </MaxButton>
                </InputAdornment>
              ),
              inputProps: {
                min: 0,
                max: walletBalance.wxHopr.formatted,
              },
            }}
          />
          <StyledIconButton
            className={`${swapDirection === 'xHOPR_to_wxHOPR' ? 'swapDirection' : ''}`}
            onClick={handleSwap}
            disabled={loading}
          >
            <ArrowDownwardIcon />
          </StyledIconButton>
          <StyledTextField
            label="xHOPR"
            placeholder="Your xHOPR here..."
            type="number"
            size="small"
            value={xhoprValue}
            onChange={(e) => set_xhoprValue(e.target.value)}
            onPointerDown={() => {
              if (selectedAddress) {
                set_swapDirection('xHOPR_to_wxHOPR');
                setMax_wxHOPR();
              }
            }}
            disabled={!selectedAddress || swapDirection === 'wxHOPR_to_xHOPR' || isLoading}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <MaxButton
                    disabled={swapDirection === 'wxHOPR_to_xHOPR'}
                    onClick={setMax_xHOPR}
                  >
                    Max
                  </MaxButton>
                </InputAdornment>
              ),
              inputProps: { min: 0 },
            }}
          />

          {walletLoading && <span>Check your Wallet...</span>}
          {notEnoughBalance && <span style={{ color: 'red' }}>Not enough balance</span>}
          {selectedAddress && (
            <>
              <TransactionLink
                isSuccess={showTxInfo}
                hash={hash}
              />
            </>
          )}
          {AddAddressToERC1820RegistryModalOpen && (
            <AddAddressToERC1820RegistryModal
              closeModal={() => {
                set_AddAddressToERC1820RegistryModalOpen(false);
              }}
              handlerData={handlerData}
              refetchHandler={refetchHandler}
              fundsSource={fundsSource}
              address={selectedAddress as `0x${string}` | null}
            />
          )}
        </WrapperContainer>
      </StepContainer>
      <NetworkOverlay />
    </Section>
  );
}

export default WrapperPage;
