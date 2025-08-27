import { useState } from 'react';
import styled from '@emotion/styled';
import { StepContainer, ConfirmButton } from '../components';
import { useEthersSigner } from '../../../../hooks';
import { getAddress } from 'viem';

// Mui
import { TextField } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';

// HOPR Components
import Select from '../../../../future-hopr-lib-components/Select';
import GrayButton from '../../../../future-hopr-lib-components/Button/gray';

// Store
import { useAppSelector, useAppDispatch } from '../../../../store';
import { stakingHubActions } from '../../../../store/slices/stakingHub';
import { safeActionsAsync } from '../../../../store/slices/safe';
import { sendNotification } from '../../../../hooks/useWatcher/notifications';

const StyledGrayButton = styled(GrayButton)`
  border: 1px solid black;
  height: 39px;
`;

export default function AddNode(props?: { onDone?: Function; onBack?: Function; nodeAddress?: string | null }) {
  const dispatch = useAppDispatch();
  const safeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);

  //http://localhost:5173/staking/onboarding?HOPRdNodeAddressForOnboarding=helloMyfield
  const HOPRdNodeAddressForOnboarding = useAppSelector(
    (store) => store.stakingHub.onboarding.nodeAddressProvidedByMagicLink
  );
  const nodesAddedToSafe =
    useAppSelector((store) => store.stakingHub.safeInfo.data.registeredNodesInNetworkRegistryParsed) || [];
  const selectValues = nodesAddedToSafe.map((node) => ({
    name: node,
    value: node,
    icon: (
      <img
        src="/assets/HOPR_Node_Adming.svg"
        alt="Node Icon"
      />
    ),
  }));
  const ownerAddress = useAppSelector((store) => store.stakingHub.safeInfo.data.owners[0].owner.id);
  const account = useAppSelector((store) => store.web3.account);
  const safeIndexed = useAppSelector((store) => store.safe.info.safeIndexed);
  const signer = useEthersSigner();
  const [isLoading, set_isLoading] = useState(false);
  const [address, set_address] = useState(
    HOPRdNodeAddressForOnboarding
      ? HOPRdNodeAddressForOnboarding
      : props?.nodeAddress
      ? props.nodeAddress
      : nodesAddedToSafe.length > 0
      ? nodesAddedToSafe[0]
      : ''
  );
  const nodeInNetworkRegistry =
    nodesAddedToSafe && nodesAddedToSafe.length > 0 && nodesAddedToSafe.includes(address.toLocaleLowerCase());

  const addDelegate = async () => {
    if (signer && safeAddress && account) {
      set_isLoading(true);
      await dispatch(
        safeActionsAsync.addSafeDelegateThunk({
          signer,
          options: {
            safeAddress,
            delegateAddress: getAddress(address),
            delegatorAddress: account,
            label: 'node',
          },
        })
      )
        .unwrap()
        .then(() => {
          if (props?.onDone) {
            props.onDone();
          } else {
            dispatch(stakingHubActions.setOnboardingNodeAddress(address));
            dispatch(stakingHubActions.setOnboardingStep(13));
          }
        })
        .catch((e) => {
          console.log('ERROR when adding a delegate to Safe:', e);
          if (e.includes("does not exist or it's still not indexed")) {
            const errMsg = "Your safe wasn't indexed yet by HOPR Safe Infrastructure. Please try in 1 hour.";
            sendNotification({
              notificationPayload: {
                source: 'safe',
                name: errMsg,
                url: null,
                timeout: null,
              },
              toastPayload: { message: errMsg, type: 'error' },
              dispatch,
            });
          }
        })
        .finally(() => {
          set_isLoading(false);
        });
    }
  };

  const addressIsOwnerAddress = () => {
    return ownerAddress?.toLocaleLowerCase() === address?.toLocaleLowerCase();
  };

  return (
    <StepContainer
      title="ADD NODE AS A DELEGATE"
      description={
        <>
          Please enter and confirm your node address. This will initiate a transaction which you will need to sign. If
          you do not have your node address follow the instructions here for{' '}
          <a
            href="https://docs.hoprnet.org/node/node-dappnode#3-link-your-node-to-your-safe-wallet"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline' }}
          >
            Dappnode
          </a>{' '}
          or{' '}
          <a
            href="https://docs.hoprnet.org/node/node-docker#5-link-your-node-to-your-safe-wallet"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline' }}
          >
            Docker
          </a>
          .
        </>
      }
      image={{
        src: '/assets/node-blue.svg',
        height: 200,
      }}
      buttons={
        <>
          <StyledGrayButton
            onClick={() => {
              if (props?.onBack) {
                props.onBack();
              } else {
                dispatch(stakingHubActions.setOnboardingStep(11));
              }
            }}
          >
            Back
          </StyledGrayButton>
          <Tooltip
            title={
              !safeIndexed
                ? `Your safe wasn\'t indexed yet by HOPR Safe Infrastructure. Please try in 1 hour`
                : address === ''
                ? 'Please enter and confirm your node address'
                : !nodeInNetworkRegistry && 'This node is not on the whitelist'
            }
          >
            <span>
              <ConfirmButton
                onClick={addDelegate}
                disabled={!nodeInNetworkRegistry || addressIsOwnerAddress() || !safeIndexed}
                pending={isLoading}
                style={{ width: '250px' }}
              >
                CONTINUE
              </ConfirmButton>
            </span>
          </Tooltip>
        </>
      }
    >
      <Select
        value={address}
        onChange={(event) => {
          set_address(event.target.value as string);
        }}
        style={{
          width: '100%',
        }}
        label={'Node Address'}
        labelId="Node-Address-select-label"
        values={selectValues}
      />
      <p style={{ textAlign: 'center' }}>Please verify that the selected address is your HOPR node address.</p>
    </StepContainer>
  );
}
