import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useAppDispatch, useAppSelector } from '../../../store';
import { DialogTitle } from '@mui/material';
import Button from '../../../future-hopr-lib-components/Button';
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';

import { useWriteContract, useSimulateContract, useWalletClient } from 'wagmi';
import { ERC1820_REGISTRY } from '../../../../config';
import { ERC1820RegistryAbi } from '../../../utils/abis/ERC1820RegistryAbi';
import { safeActions, safeActionsAsync } from '../../../store/slices/safe';
import { Address, encodeFunctionData, encodePacked, getAddress } from 'viem';
import { type UseSimulateContractParameters } from 'wagmi';
import { encode } from 'punycode';
import SafeTransactionButton from '../../../components/SafeTransactionButton';
import { useNavigate } from 'react-router-dom';

const Content = styled(SDialogContent)`
  gap: 1rem;
  div {
    display: flex;
    justify-content: center;
    gap: 16px;
    button {
      margin-top: 16px;
      padding-inline: 2rem;
    }
  }
  button.closeModalButton {
    z-index: 11;
  }
`;

const STopBar = styled(TopBar)`
  z-index: 11;
`;

const ModalOverlay = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 10;
  text-align: center;
  font-size: 22px;
  align-content: center;
  svg[data-testid='CheckCircleRoundedIcon'] {
    color: darkgreen;
  }
  svg[data-testid='CancelRoundedIcon'] {
    color: red;
  }
`;

type AddAddressToERC1820RegistryModalProps = {
  closeModal: Function;
  refetchHandler: Function;
  handlerData: `0x${string}` | undefined;
  fundsSource: 'wallet' | 'safe';
  address?: `0x${string}` | null;
};

const AddAddressToERC1820RegistryModal = ({
  closeModal,
  refetchHandler,
  handlerData,
  fundsSource,
}: AddAddressToERC1820RegistryModalProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [txStarted, set_txStarted] = useState<boolean>(false);
  const [success, set_success] = useState<boolean | null>(null);
  const [error, set_error] = useState<string | null>(null);
  const { data: signer } = useWalletClient();
  const walletAddress = useAppSelector((store) => store.web3.account);
  const safeAddress = useAppSelector((state) => state.safe.selectedSafe.data.safeAddress || '0x0000000000000000000000000000000000000000');

  useEffect(() => {
    if (!walletAddress) return;
    console.log('Address provided:', walletAddress);
    refetchSetter();
  }, [walletAddress]);

  const {
    data,
    refetch: refetchSetter,
    error: simulateError,
  } = useSimulateContract({
    address: ERC1820_REGISTRY,
    abi: ERC1820RegistryAbi,
    functionName: 'setInterfaceImplementer',
    args: [
      walletAddress,
      '0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b',
      '0xe530e2f9decf24d7d42f011f54f1e9f8001e7619',
    ],
  });

  const TXdata = encodeFunctionData({
    abi: ERC1820RegistryAbi,
    functionName: 'setInterfaceImplementer',
    args: [
      safeAddress,
      '0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b',
      '0xe530e2f9decf24d7d42f011f54f1e9f8001e7619',
    ],
  });

  // Perform contract writes and retrieve data.
  const { data: hash, isPending, isSuccess, isError, writeContract, failureReason } = useWriteContract();

  useEffect(() => {
    if (isError) {
      set_txStarted(false);
      if (failureReason && 'details' in failureReason && failureReason.details) {
        set_error(failureReason.details);
      }
    }
  }, [isError, failureReason]);

  useEffect(() => {
    if (txStarted && handlerData !== `0x0000000000000000000000000000000000000000`) {
      set_success(true);
    }
  }, [txStarted, handlerData]);

  const handleClick = () => {
    set_txStarted(true);
    writeContract?.(data!.request);
  };

  const createAndExecuteTx = async (signOnly = false) => {
    set_error(null);
    set_txStarted(true);
    if (signer && safeAddress) {
      const payload = {
        data: TXdata,
        signer,
        safeAddress,
        smartContractAddress: ERC1820_REGISTRY,
      };
      return dispatch(
        signOnly
          ? safeActionsAsync.createSafeContractTransactionThunk(payload)
          : safeActionsAsync.createAndExecuteSafeContractTransactionThunk(payload)
      )
        .unwrap()
        .catch((error) => {
          console.log('Transaction error:', error);
          set_txStarted(false);
        })
        .then(async (transactionResponse: any) => {
          console.log('Transaction response:', transactionResponse);
          if (signOnly) {
            set_txStarted(true);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for a second
            navigate('/staking/dashboard#transactions');
          }
        })
        .finally(() => {
          console.log('Transaction finally called');
        });
    }
  };

  const handleCloseModal = () => {
    closeModal();
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (handlerData !== `0x0000000000000000000000000000000000000000`) {
      set_success(true);
      clearInterval(intervalId);
    } else {
      intervalId = setInterval(() => {
        refetchHandler();
      }, 5_500);
    }
    return () => clearInterval(intervalId);
  }, [handlerData]);

  useEffect(() => {
    refetchHandler();
  }, [isSuccess, isError]);

  return (
    <SDialog
      open={true}
      disableScrollLock={true}
    >
      {(success || error) && (
        <ModalOverlay>
          {success && (
            <>
              Success
              <br />
              <br />
              <CheckCircleRoundedIcon />
            </>
          )}
          {error && (
            <>
              ERROR
              <br />
              {error}
              <br />
              <br />
              <CancelRoundedIcon />
            </>
          )}
        </ModalOverlay>
      )}
      <STopBar>
        <DialogTitle>ADD YOUR ADDRESS TO ERC1820 REGISTRY</DialogTitle>
        <SIconButton
          className="closeModalButton"
          aria-label="close modal"
          onClick={() => {
            handleCloseModal();
          }}
        >
          <CloseIcon />
        </SIconButton>
      </STopBar>
      <Content>
        <p>
          A one time, additional transaction must be done prior to the wrapping.
          <br />
          Without it, the wrapping of xHOPR to wxHOPR in this account will fail due to the lack of a callback handler.
          You need to set interface implementer in the{' '}
          <a
            href="https://gnosisscan.io/address/0x1820a4b7618bde71dce8cdc73aab6c95905fad24#code"
            target="_blank"
            style={{ textDecoration: 'underline' }}
          >
            ERC1820 Registry
          </a>{' '}
          to be able to continue with this transition.
        </p>
        <div>
          <Button
            onClick={() => {
              handleCloseModal();
            }}
            outlined
          >
            NOT NOW
          </Button>
          {fundsSource === 'safe' ? (
            <SafeTransactionButton
              executeOptions={{
                onClick: createAndExecuteTx,
                pending: txStarted,
                buttonText: 'SET INTERFACE IMPLEMENTER',
              }}
              signOptions={{
                onClick: () => {
                  createAndExecuteTx(true);
                },
                pending: txStarted,
                buttonText: 'SIGN INTERFACE IMPLEMENTER',
              }}
            />
          ) : (
            <Button
              onClick={() => {
                handleClick();
              }}
              pending={txStarted}
            >
              SET INTERFACE IMPLEMENTER
            </Button>
          )}
        </div>
      </Content>
    </SDialog>
  );
};

export default AddAddressToERC1820RegistryModal;
