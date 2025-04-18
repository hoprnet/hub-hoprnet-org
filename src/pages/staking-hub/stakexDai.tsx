import { useEffect, useState } from 'react';
import { Address, formatEther, parseEther, parseUnits } from 'viem';
import {
  useBalance,
  useSendTransaction,
  useBlockNumber,
  useEstimateGas
} from 'wagmi';
import { wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS, MINIMUM_XDAI_TO_FUND, MINIMUM_WXHOPR_TO_FUND } from '../../../config'

//Store
import { useAppSelector, useAppDispatch } from '../../store';
import { stakingHubActions } from '../../store/slices/stakingHub';

// HOPR Components
import {
  Lowercase,
  MaxButton,
  StyledCoinLabel,
  StyledDescription,
  StyledForm,
  StyledGrayButton,
  StyledInputGroup,
  StyledInstructions,
  StyledTextField,
  Text
} from './onboarding/styled';
import { StepContainer, ConfirmButton } from './onboarding/components';
import styled from '@emotion/styled';
import Section from '../../future-hopr-lib-components/Section';
import { FeedbackTransaction } from '../../components/FeedbackTransaction';

const StakexDai = () => {
  const dispatch = useAppDispatch();
  const selectedSafeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);
  const walletBalance = useAppSelector((store) => store.web3.balance);
  const [xdaiValue, set_xdaiValue] = useState('');
  const [transactionHash, set_transactionHash] = useState<Address>();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const {
    refetch: refetchXDaiSafeBalance,
    data: xDaiSafeBalance,
  } = useBalance({
    address: selectedSafeAddress as `0x${string}`,
    query: {
      enabled: !!selectedSafeAddress,
    }
  });

  const { data: xDAI_to_safe_config } = useEstimateGas({
    to: selectedSafeAddress as `0x${string}` ?? undefined,
    value: parseEther(xdaiValue),
  });

  const setMax_xDAI = () => {
    if (walletBalance.xDai.value) {
      set_xdaiValue(formatEther(BigInt(walletBalance.xDai.value) - parseUnits(`${0.002}`, 18)));
    }
  };

  const {
    isSuccess: is_xDAI_to_safe_success,
    isPending: is_xDAI_to_safe_loading,
    sendTransaction: send_xDAI_to_safe,
  } = useSendTransaction();

  useEffect(() => {
    if (is_xDAI_to_safe_success) {
      set_xdaiValue('');
    }
  }, [is_xDAI_to_safe_loading]);

  useEffect(() => {
    refetchXDaiSafeBalance()
  }, [blockNumber])

  const handleFundxDai = () => {
    send_xDAI_to_safe?.(
      {
        gas: xDAI_to_safe_config,
        to: selectedSafeAddress as `0x${string}`,
        value: parseEther(xdaiValue)
      },
      {
        onSuccess: (result) => {
          set_transactionHash(result);
          refetchXDaiSafeBalance();
        },
      }
    );
  };

  return (
    <Section
      center
      fullHeightMin
      lightBlue
    >
      <StepContainer
        image={{
          src: '/assets/funds-to-safe.svg',
          alt: 'Funds to safe image',
          height: 134,
        }}
        title="MOVE xDai TO SAFE"
        description="You're about to fund a safe with xDAI."
        buttons={
          <ConfirmButton
            onClick={handleFundxDai}
            disabled={!xdaiValue || xdaiValue === '' || xdaiValue === '0'}
            pending={is_xDAI_to_safe_loading}
          >
            FUND
          </ConfirmButton>
        }
      >
        <StyledForm>
          <StyledInstructions>
            <Text>
              Move <Lowercase>x</Lowercase>DAI into safe
            </Text>
          </StyledInstructions>
          <StyledInputGroup>
            <StyledTextField
              type="number"
              variant="outlined"
              placeholder="-"
              size="small"
              value={xdaiValue}
              onChange={(e) => set_xdaiValue(e.target.value)}
              InputProps={{
                inputProps: {
                  style: { textAlign: 'right' },
                  min: 0,
                  pattern: '[0-9]*',
                }
              }}
            />
            <StyledCoinLabel>
              xDAI
            </StyledCoinLabel>
            <StyledGrayButton onClick={setMax_xDAI}>Max</StyledGrayButton>
          </StyledInputGroup>
        </StyledForm>
        <FeedbackTransaction
          confirmations={1}
          isWalletLoading={is_xDAI_to_safe_loading}
          transactionHash={transactionHash}
          feedbackTexts={{ loading: 'Please wait while we confirm the transaction...' }}
        />
      </StepContainer>
    </Section>
  );
};

export default StakexDai;
