import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useWalletClient } from 'wagmi';

//HOPR Components
import Button from '../../../../future-hopr-lib-components/Button';
import { StepContainer, ConfirmButton } from '../components';

//Store
import { useAppSelector, useAppDispatch } from '../../../../store';
import { stakingHubActions } from '../../../../store/slices/stakingHub';
import { web3ActionsAsync } from '../../../../store/slices/web3';
import { safeActionsAsync } from '../../../../store/slices/safe';

// Mui
import Radio from '@mui/material/Radio';
import MuiButton from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

const OptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 16px;
  align-items: center;
`;

const Option = styled(MuiButton)`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 8px;
  max-width: 530px;
  width: 100%;
  min-height: 180px;
  background-color: #edf2f7;
  color: #a8a8a8;
  text-align: left;
  border-radius: 30px;
  border: 2px solid #edf2f7;
  text-transform: none;
  &.chosen {
    color: #414141;
    border: 2px solid #000050;
  }
`;

const OptionText = styled.div`
  display: flex;
  flex-direction: row;
  max-width: 300px;
  min-height: 170px;
  align-items: center;
  .big {
    font-size: 20px;
    font-weight: 600;
  }
`;

const SRadio = styled(Radio)`
  &.Mui-checked {
    color: #000050;
  }
`;

const TransferNft = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  img {
    width: 116px;
    height: 116px;
  }
  button {
    width: 254px;
    text-transform: uppercase;
  }
`;

let interval: any;

export default function optionalNftTtransfer() {
  const dispatch = useAppDispatch();
  const [option, set_option] = useState<0 | 1 | null>(null);
  const communityNftIdInWallet = useAppSelector((store) => store.web3.communityNftId);
  const communityNftInWallet = !!communityNftIdInWallet;
  const communityNftIdsInSafe = useAppSelector((store) => store.safe.communityNftIds.data);
  const communityNftInSafe = communityNftIdsInSafe.length > 0;
  const safeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);
  const walletAddress = useAppSelector((store) => store.web3.account);
  const { data: walletClient } = useWalletClient();
  const [startedNftTransfer, set_startedNftTransfer] = useState<boolean>(false);
  const [sendingNFT, set_sendingNFT] = useState<boolean>(false);

  useEffect(() => {
    if (startedNftTransfer && !communityNftInSafe && safeAddress) {
      interval = setInterval(()=>{dispatch(safeActionsAsync.getCommunityNftsOwnedBySafeThunk(safeAddress));}, 10_000);
    } else if (startedNftTransfer && communityNftInSafe ) {
      clearInterval(interval);
      set_startedNftTransfer(false);
    }
    return () => {
      clearInterval(interval);
    };
  }, [safeAddress, communityNftInSafe, startedNftTransfer]);

  function whichNFTimage() {
    if (communityNftInSafe) return '/assets/nft-in-safe.png';
    if (communityNftInWallet) return '/assets/nft-detected-in-wallet.png';
    return '/assets/nft-NOT-detected-in-wallet.png';
  }

  function tooltipText(){
    if(option === 0 && !communityNftInSafe) return "You need to transfer Community NFT to the Safe in order to use that option";
    if(option === null) return "You need to choose an option";
    return null
  }

  return (
    <StepContainer
      title="NFT TRANSFER (OPTIONAL)"
      description={<>Transfer your NR (Network Registry) NFT to join the network with only 10,000 wxHOPR. If you do not have one Please select the 30k option and continue. Read more about NR NFTs{' '}
        <a
          href="https://docs.hoprnet.org/node/frequently-asked-questions#waitlist-related-faq"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#007bff', textDecoration: 'underline'}}
        >
          here
        </a>.
      </>}
      buttons={
        <Tooltip
          title={tooltipText()}
        >
          <span style={{ textAlign: 'center' }}>
            <ConfirmButton
              onClick={() => {
                dispatch(stakingHubActions.setOnboardingStep(4));
              }}
              disabled={option === null || (option === 0 && !communityNftInSafe)}
              style={{width: '250px'}}
            >
              CONTINUE
            </ConfirmButton>
          </span>
        </Tooltip>
      }
    >
      <OptionContainer>
        <Option
          className={`${option === 0 ? 'chosen' : ''}`}
          onClick={() => {
            set_option(0);
          }}
          style={communityNftInSafe === false ? {pointerEvents: 'none'} : {}}
        >
          <OptionText>
            <div className="left">
              <SRadio checked={option === 0} />
            </div>
            <div className="right">
              <span className="big">Minimum 10,000 wxHOPR</span>
              <br />
              <span className="smaller">WITH transferred NR NFT in your Safe</span>
            </div>
          </OptionText>
          <TransferNft>
            <img src={whichNFTimage()} />
            {
              !communityNftInSafe &&
              <Button
                onClick={async (event) => {
                  event.stopPropagation();
                  if (!walletClient) return;
                  if (walletAddress && safeAddress && communityNftInWallet) {
                    set_startedNftTransfer(true);
                    set_sendingNFT(true);
                    await dispatch(
                      web3ActionsAsync.sendNftToSafeThunk({
                        walletAddress,
                        safeAddress,
                        walletClient,
                        communityNftId: communityNftIdInWallet,
                      }),
                    ).unwrap().finally(
                      ()=>{
                        set_sendingNFT(false)
                      }
                    );
                  }
                }}
                disabled={!communityNftInWallet || communityNftInSafe}
                pending={sendingNFT}
                style={{pointerEvents: 'all'}}
              >
                Transfer NFT to Safe
              </Button>
            }
          </TransferNft>
        </Option>
        <Option
          className={`${option === 1 ? 'chosen' : ''}`}
          onClick={() => {
            set_option(1);
          }}
        >
          <OptionText>
            <div className="left">
              <SRadio checked={option === 1} />
            </div>
            <div className="right">
              <span className="big">Minimum 30,000 wxHOPR</span>
            </div>
          </OptionText>
        </Option>
      </OptionContainer>
    </StepContainer>
  );
}
