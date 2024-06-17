import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { erc20ABI, useContractRead, useWalletClient } from 'wagmi';
import { parseUnits } from 'viem';
import { xHOPR_TOKEN_SMART_CONTRACT_ADDRESS, wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS, wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS, WEB_API } from '../../../config'

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


function WrapperPage() {
  const [message, set_message] = useState('Hello world');
  const address = useAppSelector((store) => store.web3.account) as `0x${string}` | null;
  const { data: walletClient } = useWalletClient();

  const handleClick = async (account: `0x${string}` | null, message: string) => {
    if(!walletClient || !account) return;
    const signature = await walletClient.signMessage({
      account,
      message,
    })
    console.log(signature);
    const rez = await fetch(`${WEB_API}/api/gno-airdrop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account,
        message,
        signature
      }),
    })
  }


  return (
    <Section
      center
      fullHeightMin
      lightBlue
    >
      <StepContainer
        title="GNO Airdrop"
        //description={<p>Utility to wrap (xHOPR &#8594; wxHOPR) and unwrap (wxHOPR &#8594; xHOPR) xHOPR tokens.<br/><br/>Funds source: Your wallet</p>}
        image={{
          src: '/assets/wrapper-wallet-wallet.png',
          alt: 'Funds to safe image',
          height: 134,
        }}
        buttons={
          <Button
            className="swap-button"
            onClick={()=> {handleClick(address, message)}}
          >
            Sign
          </Button>
        }
      >
        <br />
        <br />
        <StyledTextField
          label="Address"
          value={address}
          disabled
          fullWidth
        />
        <br />
        <br />
        <StyledTextField
          label="Message"
          type="number"
          value={message}
          onChange={(e) => set_message(e.target.value)}
          fullWidth
          multiline
        />
      </StepContainer>
      <NetworkOverlay />
    </Section>
  );
}

export default WrapperPage;
