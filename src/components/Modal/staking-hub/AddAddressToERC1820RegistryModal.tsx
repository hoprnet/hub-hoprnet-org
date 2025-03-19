import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useAppDispatch, useAppSelector } from '../../../store';
import { DialogTitle } from '@mui/material';
import Button from '../../../future-hopr-lib-components/Button';
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';

import {
  useReadContract,
  useWriteContract,
  useSimulateContract,
  useWaitForTransactionReceipt
} from 'wagmi';
import {
  ERC1820_REGISTRY
} from '../../../../config';
import { ERC1820RegistryAbi } from '../../../utils/abis/ERC1820RegistryAbi';

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
  button.closeModalButton{
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
  svg[data-testid="CheckCircleRoundedIcon"]{
    color: darkgreen;
  }
  svg[data-testid="CancelRoundedIcon"]{
    color: red;
  }
`

type AddAddressToERC1820RegistryModalProps = {
  closeModal: Function,
  refetchHandler: Function
};

const AddAddressToERC1820RegistryModal = ({
  closeModal,
  refetchHandler
}: AddAddressToERC1820RegistryModalProps) => {
  const [txStarted, set_txStarted] = useState<boolean>(false);
  const [success, set_success] = useState<boolean | null>(null);
  const [error, set_error] = useState<string | null>(null);
  const address = useAppSelector((store) => store.web3.account);

  useEffect(() => {
    if(!address) return;
    refetch3();
    startRefetchResult();
  }, [address]);

  // TX: handlerData
  const { data, refetch: refetch3 } = useSimulateContract({
    address: ERC1820_REGISTRY,
    abi: ERC1820RegistryAbi,
    functionName: 'setInterfaceImplementer',
    args: [
      address,
      '0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b',
      '0xe530e2f9decf24d7d42f011f54f1e9f8001e7619'
    ],
  });

  // Perform contract writes and retrieve data.
  const {
    data: hash,
    isPending,
    isSuccess,
    isError,
    writeContract,
    failureReason
  } = useWriteContract();

  const { data: hash2, isError: isError2, isLoading:isLoading2, isSuccess:isSuccess2 } = useWaitForTransactionReceipt({ hash });

  useEffect(()=>{
    if(isError) {
      set_txStarted(false);
      if(failureReason && 'details' in failureReason && failureReason.details) {
        set_error(failureReason.details);
      }
    }
  }, [isError, failureReason]);

  const { data: handlerData, refetch: refetchResult, isPending: refetchPending } = useReadContract({
    address: ERC1820_REGISTRY,
    abi: [
      { "constant": true, "inputs": [{ "name": "_addr", "type": "address" }, { "name": "_interfaceHash", "type": "bytes32" }], "name": "getInterfaceImplementer", "outputs": [{ "name": "", "type": "address" }], "payable": false, "stateMutability": "view", "type": "function" }
    ],
    functionName: 'getInterfaceImplementer',
    args: [
      address as `0x${string}`,
      '0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b'
    ],
  });

  useEffect(() => {
    if(txStarted && handlerData !== `0x0000000000000000000000000000000000000000`){
      set_success(true);
    }
  }, [txStarted, handlerData]);

  const handleClick = () => {
    set_txStarted(true);
    writeContract?.(data!.request);
  };

  const handleCloseModal = () => {
    closeModal();
  };

  const startRefetchResult = async () => {
    while(true) {
      await new Promise(r => setTimeout(r, 5_500));
      refetchResult();
      if(handlerData !== `0x0000000000000000000000000000000000000000`){
        set_success(true);
        break;
      }
    }
  };

  useEffect(() => {
    refetchHandler();
  }, [isSuccess, isError]);

  return (
    <SDialog
      open={true}
      disableScrollLock={true}
    >
      {
        (success || error) &&
        <ModalOverlay>
          {
            success && <>
              Success<br /><br />
              <CheckCircleRoundedIcon />
            </>
          }
          {
            error && <>
              ERROR<br />
              {error}<br /><br />
              <CancelRoundedIcon />
            </>
          }
        </ModalOverlay>
      }
      <STopBar>
        <DialogTitle>ADD YOUR ADDRESS TO ERC1820 REGISTRY</DialogTitle>
        <SIconButton
          className='closeModalButton'
          aria-label="close modal"
          onClick={() => { handleCloseModal() }}
        >
          <CloseIcon />
        </SIconButton>
      </STopBar>
      <Content>
        <p>A one time, additional transaction must be done prior to the wrapping.<br />When a Safe wraps xHOPR to wxHOPR, it will fail due to lack of a callback handler. You need to set interface implementer in the{' '}
          <a
            href="https://gnosisscan.io/address/0x1820a4b7618bde71dce8cdc73aab6c95905fad24#code"
            target="_blank"
            style={{ textDecoration: 'underline' }}
          >
            ERC1820 Registry
          </a>{' '} to be able to continue with this transition.</p>
        <div>
          <Button
            onClick={() => { handleCloseModal() }}
            outlined
          >
            NOT NOW
          </Button>
          <Button
            onClick={() => {
              handleClick();
            }}
            pending={txStarted}
          >
            SET INTERFACE IMPLEMENTER
          </Button>
        </div>
      </Content>
    </SDialog>
  );
};

export default AddAddressToERC1820RegistryModal;
