import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { parseUnits, parseEther } from 'viem';
import { xHOPR_TOKEN_SMART_CONTRACT_ADDRESS, wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS, wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS } from '../../../config'

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
  const [swapDirection, set_swapDirection] = useState<'xHOPR_to_wxHOPR' | 'wxHOPR_to_xHOPR'>('xHOPR_to_wxHOPR');
  const address = useAppSelector((store) => store.web3.account);
  const walletBalance = useAppSelector((store) => store.web3.balance);

  useEffect(() => {
    refecth1();
    refecth2();
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

  // Prepare contract write configurations
  const { config: xHOPR_to_wxHOPR_config, refetch: refecth1 } = usePrepareContractWrite({
    address: xHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
    abi: web3.wrapperABI,
    functionName: 'transferAndCall',
    args: [wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS, parseUnits(xhoprValue as NumberLiteral, 18), '0x'],
  });

  const { config: wxHOPR_to_xHOPR_config, refetch: refecth2 } = usePrepareContractWrite({
    address: wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
    abi: web3.wrapperABI,
    functionName: 'transfer',
    args: [wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS, parseUnits(wxhoprValue as NumberLiteral, 18)],
  });

  // Perform contract writes and retrieve data.
  const {
    data: xHOPR_to_wxHOPR_data,
    isLoading: is_xHOPR_to_wxHOPR_loading,
    isSuccess: is_xHOPR_to_wxHOPR_success,
    isError: is_xHOPR_to_wxHOPR_error,
    write: write_xHOPR_to_wxHOPR,
  } = useContractWrite(xHOPR_to_wxHOPR_config);

  const {
    data: wxHOPR_to_xHOPR_data,
    isLoading: is_wxHOPR_to_xHOPR_loading,
    isSuccess: is_wxHOPR_to_xHOPR_success,
    isError: is_wxHOPR_to_xHOPR_error,
    write: write_wxHOPR_to_xHOPR,
  } = useContractWrite(wxHOPR_to_xHOPR_config);

  const hash =  xHOPR_to_wxHOPR_data?.hash || wxHOPR_to_xHOPR_data?.hash;
  const walletLoading = is_xHOPR_to_wxHOPR_loading || is_wxHOPR_to_xHOPR_loading;
  const txPending = is_xHOPR_to_wxHOPR_success || is_wxHOPR_to_xHOPR_success;
  const txWillBeError = is_xHOPR_to_wxHOPR_error || is_wxHOPR_to_xHOPR_error;

  const { data, isError, isLoading, isSuccess } = useWaitForTransaction({ hash })

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
      write_xHOPR_to_wxHOPR?.();
    } else {
      write_wxHOPR_to_xHOPR?.();
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
