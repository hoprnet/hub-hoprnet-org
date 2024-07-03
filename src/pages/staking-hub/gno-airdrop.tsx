import { useEffect, useState, useRef } from 'react';
import styled from '@emotion/styled';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { erc20ABI, useContractRead, useWalletClient } from 'wagmi';
import { parseUnits } from 'viem';
import { WEB_API } from '../../../config'
import { GNOeligible } from '../../utils/gno-airdrop';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';
import { safeActions } from '../../store/slices/safe';

// HOPR Components
import Button from '../../future-hopr-lib-components/Button';
import Section from '../../future-hopr-lib-components/Section';
import NetworkOverlay from '../../components/Overlays/NetworkOverlay';
import IconButton from '../../future-hopr-lib-components/Button/IconButton';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { StepContainer } from './onboarding/components';

function WrapperPage() {
  const dispatch = useAppDispatch();
  const [message, set_message] = useState('');
  const [fileName, set_fileName] = useState('');
  const [error, set_error] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const address = useAppSelector((store) => store.web3.account) as `0x${string}` | null;
  const { data: walletClient } = useWalletClient();
  const web3Connected = useAppSelector((store) => store.web3.status.connected);
  const safeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);
  const alreadySubmitted = useAppSelector((store) => store.safe.gnoAirdrop.status);
  const alreadySubmittedFetching = useAppSelector((store) => store.safe.gnoAirdrop.isFetching);

  const eligible = safeAddress && Object.keys(GNOeligible).includes(safeAddress?.toLowerCase());

  const handleClick = async (account: `0x${string}` | null, depositFile: string) => {
    if (!walletClient || !account) return;
    dispatch(safeActions.setgnoAirdropIsFetching(true));
    // const signature = await walletClient.signMessage({
    //   account,
    //   message,
    // })
    try {

      const deposits = JSON.parse(depositFile);

      let GNOairfropType = [
        { name: 'domain', type: 'string' },
        { name: 'file', type: 'string' },
      ]

      let message: any = {
        domain: window.location.host,
      };

      for (let i = 0; i < deposits.length; i++) {
        GNOairfropType.push({ name: `Account ${i + 1}: pubkey`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i + 1}: withdrawal_credentials`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i + 1}: amount`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i + 1}: signature`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i + 1}: deposit_message_root`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i + 1}: deposit_data_root`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i + 1}: fork_version`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i + 1}: network_name`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i + 1}: deposit_cli_version`, type: 'string' });

        message[`Account ${i + 1}: pubkey`] = deposits[0].pubkey;
        message[`Account ${i + 1}: withdrawal_credentials`] = deposits[0].withdrawal_credentials;
        message[`Account ${i + 1}: amount`] = deposits[0].amount;
        message[`Account ${i + 1}: signature`] = deposits[0].signature;
        message[`Account ${i + 1}: deposit_message_root`] = deposits[0].deposit_message_root;
        message[`Account ${i + 1}: deposit_data_root`] = deposits[0].deposit_data_root;
        message[`Account ${i + 1}: fork_version`] = deposits[0].fork_version;
        message[`Account ${i + 1}: network_name`] = deposits[0].network_name;
        message[`Account ${i + 1}: deposit_cli_version`] = deposits[0].deposit_cli_version;
      }


      message.file = depositFile;

      const payload = {
        types: {
          'GNO-airdrop': GNOairfropType,
        },
        primaryType: 'GNO-airdrop',
        message,
      }

      // @ts-ignore
      const signature = await walletClient.signTypedData(payload)

      const rez = await fetch(`${WEB_API}/hub/gno-airdrop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signer: account,
          safe: safeAddress,
          payload,
          signature
        }),
      });
      const json = await rez.json();

      if (json.status) {
        set_message('');
        set_fileName('');
        dispatch(safeActions.setgnoAirdropStatus(true));
      }
    } finally {
      dispatch(safeActions.setgnoAirdropIsFetching(false));
    }
  };

  /**
  * Handles the file upload event.
  * @param event The file upload event.
  */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const fileName = event.target.files?.[0].name as string;
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const contents = e.target?.result;
      if (typeof contents === 'string') {
        set_message(contents);
        set_fileName(fileName)
      } else {
        set_error('Error loading file')
      }
    };

    if (file) {
      reader.readAsText(file);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };


  const GNO2GET = safeAddress && GNOeligible[safeAddress?.toLowerCase() as `0x${string}`] || 0;

  const willNotGetGNO = !alreadySubmittedFetching && safeAddress && !eligible;

  return (
    <Section
      center
      fullHeightMin
      lightBlue
    >
      <StepContainer
        title="GNO Airdrop"
        image={{
          src: '/assets/gnosis-gno-gno-logo.svg',
          alt: 'GNO Aridrop',
          height: 30,
        }}
      >
        <div
          style={{
            height: '150px'
          }}
        >
          {!web3Connected && <span style={{}}><br /><strong>Connect wallet and safe to check if you are eligible.</strong></span>}

          {web3Connected && !safeAddress && <span style={{}}><br /><strong>Connect safe to check if you are eligible.</strong></span>}
          {alreadySubmittedFetching && <span style={{}}><br /><strong>Loading...</strong></span>}
          {willNotGetGNO && <span style={{}}><br /><strong>Your safe is not eligible.</strong></span>}
          {!alreadySubmittedFetching && alreadySubmitted && <span style={{ color: 'darkgreen' }}><br /><strong>You submitted deposit file.</strong></span>}
          {!alreadySubmittedFetching && safeAddress && eligible && !alreadySubmitted &&
            <>
              <strong >Your <span style={{ overflowWrap: 'anywhere' }}>{safeAddress}</span> safe is eligible for {' '}
                <span
                  style={{
                    fontSize: '26px',
                    color: 'darkblue'
                  }}
                >{GNO2GET}</span> GNO.</strong>
              <br /><br />
              Upload deposit file {fileName && `(uploaded file '${fileName}')`}
              <IconButton
                iconComponent={<FileUploadIcon />}
                tooltipText={
                  <span>
                    UPLOAD
                    <br />
                    validator file
                  </span>
                }
                onClick={handleImportClick}
              />
              <br />
              <input
                type="file"
                accept=".txt,.json"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileUpload}
                placeholder="import"
              />
            </>}


          {
            eligible && !alreadySubmitted && !alreadySubmittedFetching && <Button
              className="swap-button"
              onClick={() => { handleClick(address, message) }}
              disabled={fileName.length === 0}
            >
              Sign and send
            </Button>
          }
        </div>
        <strong>How this was calculated</strong><br />
        <span style={{
          fontSize: '13px'
        }}>
          We:
          <ul>
            <li>Took a snapshot on 28 June 2024, 8AM UTC</li>
            <li>Calculated the wxHOPR tokens in your Safe and channels at that time</li>
            <li>Divided it by the node minimum of 30,000 (or 10,000 if you're staking a Network Registry NFT)</li>
            <li>Rounded down to the nearest whole number</li>
          </ul>
          We also checked how many of your HOPR nodes were running at 50% uptime for the previous two weeks<br />
          Whichever number was smallest is your airdrop amount.<br /><br />
        </span>

        {
          GNO2GET > 0 &&
          <>
            <strong>How to claim</strong><br />
            <span style={{
              fontSize: '13px'
            }}>
              To claim, we'll need you to sign the deposit file for your {GNO2GET} new Gnosis validator{
                GNO2GET > 1 ? `s` : ``
              } (
              <a
                target="_blank"
                rel="noreferrer"
                href="https://docs.gnosischain.com/node/manual/validator/generate-keys/"
                style={{
                  textDecoration: 'underline'
                }}
              >
                tutorial: how to generate deposits files
              </a>
              ).<br /><br />
              You'll have until the end of July 2024 to do this. GNO will be distributed directly to validators in August 2024.
              <br /><br />
            </span>
          </>
        }


      </StepContainer>
    </Section>
  );
}

export default WrapperPage;
