import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import {
  useReadContract,
  useWriteContract,
  useSimulateContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import { parseUnits, parseEther, toHex } from 'viem';
import {
  xHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
  wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
  wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS,
  MULTISEND_CONTRACT_GNOSIS,
  ERC1820_REGISTRY
} from '../../../config'

// Redux
import { useAppSelector } from '../../store';

// HOPR Components
import Button from '../../future-hopr-lib-components/Button';
import Section from '../../future-hopr-lib-components/Section';
import NetworkOverlay from '../../components/Overlays/NetworkOverlay';

import { ConfirmButton, StepContainer } from './onboarding/components';
import {
  Lowercase,
  StyledCoinLabel,
  StyledForm,
  StyledGrayButton,
  StyledInputGroup,
  StyledInstructions,
  Text
} from './onboarding/styled';

// Mui
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import LaunchIcon from '@mui/icons-material/Launch';
import { web3 } from '@hoprnet/hopr-sdk';
import {
  IconButton,
  Paper,
  TextField,
  InputAdornment,
  Button as MuiButton
} from '@mui/material'

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
  top: 48px;
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

const MaxButton = styled(MuiButton)`
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

function TransactionLink({
  isSuccess,
  hash,
}: TransactionLinkProps) {
  if (!isSuccess) return null;

  return (
    <span>
      Check out your {' '}
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
  const [xhoprValue, set_xhoprValue] = useState('');
  const [wxhoprValue, set_wxhoprValue] = useState('');
  const [showTxInfo, set_showTxInfo] = useState(false);
  const [notEnoughBalance, set_notEnoughBalance] = useState(false);
  const [handlerIsSet, set_handlerIsSet] = useState<boolean>();
  const [swapDirection, set_swapDirection] = useState<'xHOPR_to_wxHOPR' | 'wxHOPR_to_xHOPR'>('xHOPR_to_wxHOPR');
  const address = useAppSelector((store) => store.web3.account);
  const walletBalance = useAppSelector((store) => store.web3.balance);

  useEffect(() => {
    refetch1();
    refetch2();
    refetch3();
  }, [address]);

  useEffect(() => {
    set_showTxInfo(false);
  }, [xhoprValue, wxhoprValue]);

  useEffect(() => {
    if(!walletBalance.xHopr.value || !walletBalance.wxHopr.value) return;

    const xhoprEther = parseEther(xhoprValue);
    const wxhoprEther = parseEther(wxhoprValue);
    const xhoprWalletEther = BigInt(walletBalance.xHopr.value);
    const wxhoprWalletEther = BigInt(walletBalance.wxHopr.value);

    if(swapDirection === 'xHOPR_to_wxHOPR' && xhoprEther > xhoprWalletEther) set_notEnoughBalance(true)
    else if (swapDirection === 'xHOPR_to_wxHOPR') set_notEnoughBalance(false)
    else if (swapDirection === 'wxHOPR_to_xHOPR' && wxhoprEther > wxhoprWalletEther) set_notEnoughBalance(true)
    else if (swapDirection === 'wxHOPR_to_xHOPR') set_notEnoughBalance(false)

  }, [swapDirection, xhoprValue, wxhoprValue, walletBalance.xHopr.value, walletBalance.xHopr.value]);

  const { data: handlerData } = useReadContract({
    address: ERC1820_REGISTRY,
    abi: [
      {"constant":true,"inputs":[{"name":"_addr","type":"address"},{"name":"_interfaceHash","type":"bytes32"}],"name":"getInterfaceImplementer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"}
    ],
    functionName: 'getInterfaceImplementer',
    args: [
      address as `0x${string}`,
      '0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b'
    ],
  });

  useEffect(() => {
    if(handlerData === `0x0000000000000000000000000000000000000000`) set_handlerIsSet(true);
  }, [handlerData]);

  // Prepare contract write configurations
  // wxHOPR -> xHOPR
  const { data: wxHOPR_to_xHOPR_config, refetch: refetch2 } = useSimulateContract({
    address: wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
    abi: web3.wrapperABI,
    functionName: 'transfer',
    args: [wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS, parseUnits(wxhoprValue as NumberLiteral, 18)],
  });

  // xHOPR -> wxHOPR if handlerData set
  const { data: xHOPR_to_wxHOPR_config, refetch: refetch1 } = useSimulateContract({
    address: xHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
    abi: web3.wrapperABI,
    functionName: 'transferAndCall',
    args: [address, parseUnits(xhoprValue as NumberLiteral, 18), '0x'],
  });

  // xHOPR -> wxHOPR multicall if handlerData not set
  const addressWithout0x = address?.replace('0x','').toLocaleLowerCase() || '';
  const wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESSWithout0x = wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS?.replace('0x','').toLocaleLowerCase() || '';
  const setInterfaceImplementer = `29965a1d000000000000000000000000${addressWithout0x}b281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b000000000000000000000000e530e2f9decf24d7d42f011f54f1e9f8001e7619`;

  const wrapHex = toHex(parseUnits(xhoprValue as NumberLiteral, 18)).replace('0x','');
  const wrapHexWithZeros = '00000000000000000000000000000000000000000000000000000000000000000'.substring(0,64-wrapHex.length) + wrapHex;
  const xHOPR_to_wxHOPR = `4000aea0000000000000000000000000${wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESSWithout0x}${wrapHexWithZeros}00000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000`;

  const multiSendTx: `0x${string}`= `0x8d80ff0a00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000192001820a4b7618bde71dce8cdc73aab6c95905fad2400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000064${setInterfaceImplementer}00d057604a14982fe8d88c5fc25aac3267ea142a0800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084${xHOPR_to_wxHOPR}`;

  const { data: xHOPR_to_wxHOPR_config_multicall, refetch: refetch3 } = useSimulateContract({
    address: '0x9641d764fc13c8b624c04430c7356c1c7c8102e2',
    abi: [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"bytes","name":"transactions","type":"bytes"}],"name":"multiSend","outputs":[],"stateMutability":"payable","type":"function"}],
    functionName: 'multiSend',
    args: [multiSendTx],
  });

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

  const hash =  xHOPR_to_wxHOPR_data || wxHOPR_to_xHOPR_data || xHOPR_to_wxHOPR_data_multicall;
  const walletLoading = is_xHOPR_to_wxHOPR_loading || is_wxHOPR_to_xHOPR_loading || is_xHOPR_to_wxHOPR_loading_multicall;
  const txPending = is_xHOPR_to_wxHOPR_success || is_wxHOPR_to_xHOPR_success || is_xHOPR_to_wxHOPR_success_multicall;
  const txWillBeError = is_xHOPR_to_wxHOPR_error || is_wxHOPR_to_xHOPR_error || is_xHOPR_to_wxHOPR_error_multicall;

  const { data, isError, isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if(txPending || isSuccess){
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
    set_showTxInfo(false);
    if (swapDirection === 'xHOPR_to_wxHOPR') {
      write_xHOPR_to_wxHOPR_multicall?.(xHOPR_to_wxHOPR_config_multicall!.request);
    } else {
      write_wxHOPR_to_xHOPR?.(wxHOPR_to_xHOPR_config!.request);
    }
  };

  const updateBalances = () => {
    if (address && walletBalance.xHopr.formatted && walletBalance.wxHopr.formatted) {
      set_xhoprValue(walletBalance.xHopr.formatted);
      set_wxhoprValue(walletBalance.wxHopr.formatted);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      updateBalances();
    }
  }, [walletBalance.xHopr.formatted, walletBalance.wxHopr.formatted]);

  useEffect(() => {
    if (address) {
      updateBalances();
      if (walletBalance.xHopr.formatted === '0') {
        set_swapDirection('wxHOPR_to_xHOPR');
      }
    } else {
      set_xhoprValue('');
      set_wxhoprValue('');
    }
  }, [
    address,
    walletBalance.xHopr.formatted,
    walletBalance.wxHopr.formatted,
  ]);

  // Set the maximum value for xHOPR on input field.
  const setMax_xHOPR = () => {
    if (walletBalance.xHopr.formatted) {
      set_xhoprValue(walletBalance.xHopr.formatted);
    }
  };

  const setMax_wxHOPR = () => {
    if (walletBalance.wxHopr.formatted) {
      set_wxhoprValue(walletBalance.wxHopr.formatted);
    }
  };

  return (
    <Section
      center
      fullHeightMin
      lightBlue
    >
      <StepContainer
        title="Wrapper"
        description={<p>Utility to wrap (xHOPR &#8594; wxHOPR) and unwrap (wxHOPR &#8594; xHOPR) xHOPR tokens.<br/><br/>Funds source: Your wallet</p>}
        image={{
          src: '/assets/wrapper-wallet-wallet.png',
          alt: 'Funds to safe image',
          height: 134,
        }}
        buttons={
          <Button
            className="swap-button"
            disabled={
              (swapDirection === 'xHOPR_to_wxHOPR' && !write_xHOPR_to_wxHOPR) ||
              (swapDirection === 'wxHOPR_to_xHOPR' && !write_wxHOPR_to_xHOPR) ||
              notEnoughBalance
            }
            onClick={handleClick}
            pending={walletLoading || isLoading}
          >
          SWAP
        </Button>
        }
      >
        <br/><br/><br/>
        <WrapperContainer>
          <StyledTextField
            label="xHOPR"
            placeholder="Your xHOPR here..."
            type="number"
            value={xhoprValue}
            onChange={(e) => set_xhoprValue(e.target.value)}
            onPointerDown={() => {
              if (address) {
                set_swapDirection('xHOPR_to_wxHOPR');
                setMax_wxHOPR();
              }
            }}
            disabled={!address || swapDirection === 'wxHOPR_to_xHOPR' || isLoading}
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
          <StyledIconButton
            className={`${swapDirection === 'wxHOPR_to_xHOPR' ? 'swapDirection' : ''}`}
            onClick={handleSwap}
          >
            <ArrowDownwardIcon />
          </StyledIconButton>
          <StyledTextField
            label="wxHOPR"
            placeholder="Your wxHOPR here..."
            type="number"
            value={wxhoprValue}
            onChange={(e) => set_wxhoprValue(e.target.value)}
            onPointerDown={() => {
              if (address) {
                set_swapDirection('wxHOPR_to_xHOPR');
                setMax_xHOPR();
              }
            }}
            disabled={!address || swapDirection === 'xHOPR_to_wxHOPR' || isLoading}
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
          {walletLoading && <span>Check your Wallet...</span>}
          {notEnoughBalance && <span style={{color: 'red'}}>Not enough balance in your wallet</span>}
          {address && (
            <>
              <TransactionLink
                isSuccess={showTxInfo}
                hash={hash}
              />
            </>
          )}
        </WrapperContainer>
      </StepContainer>
      <NetworkOverlay />
    </Section>
  );
}

export default WrapperPage;
