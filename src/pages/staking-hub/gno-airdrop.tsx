import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { erc20ABI, useContractRead, useWalletClient } from 'wagmi';
import { parseUnits } from 'viem';
import { xHOPR_TOKEN_SMART_CONTRACT_ADDRESS, wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS, wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS, WEB_API } from '../../../config'
import { GNOeligible } from '../../utils/gno-airdrop';

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
  const safeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);

  const eligible = safeAddress && Object.keys(GNOeligible).includes(safeAddress?.toLowerCase());

  const handleClick = async (account: `0x${string}` | null, message: string) => {
    if(!walletClient || !account) return;
    const signature = await walletClient.signMessage({
      account,
      message,
    })
    console.log(signature);
    const rez = await fetch(`${WEB_API}/hub/gno-airdrop`, {
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
          src: '/assets/gnosis-gno-gno-logo.svg',
          alt: 'Funds to safe image',
          height: 30,
        }}
        buttons={
          eligible && <Button
            className="swap-button"
            onClick={()=> {handleClick(address, message)}}
          >
            Sign and send
          </Button>
        }
      >
        <strong>Requirements and calculation:</strong><br/>
        <span style={{
          fontSize: '13px'
        }}>
        Snapshot time: 28 June 2024, 8AM UTC<br /><br />
        To count how many GNO you get airdropped, we divide the wxHOPR sum of tokens in the safe and channels at the time of snaphot by 30k (10k if you staked Netowork Registry NFT) and:<br />
        - if the quotient of the result is higher or equal than {`<number_of_nodes>`}, then you will get {`<number_of_nodes>`} GNO,<br />
        - if the quotient will be smaller than {`<number_of_nodes>`}, then you will get the {`<quotient>`} GNO.<br /><br />

        The {`<number_of_nodes>`} is a sum of all your nodes wich were online at least 50% in the 2 weeks before the snaphot date and have at least 1 outgoing channel funded at the snapchot time.<br /><br />

        Do not worry if you did not qualify this time, just make sure that for the next one you have your nodes online and well!<br /><br /><br />


        </span>
        {safeAddress && !eligible && <span style={{

        }}><strong>Your safe is not eligible.</strong></span>}


        {safeAddress && eligible && <>


        <strong>Your safe is eligible for {safeAddress && GNOeligible[safeAddress?.toLowerCase() as `0x${string}`]} GNO.</strong>
        <br /><br />
        <StyledTextField
          label="Safe Address"
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
        </>}
      </StepContainer>
      <NetworkOverlay />
    </Section>
  );
}

export default WrapperPage;
