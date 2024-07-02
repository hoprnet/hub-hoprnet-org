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
    try{

      const deposits = JSON.parse(depositFile);

      let GNOairfropType = [
        { name: 'domain', type: 'string' },
        { name: 'file', type: 'string' },
      ]

      let message: any= {
        domain: window.location.host,
      };

      for (let i = 0; i < deposits.length; i++) {
        GNOairfropType.push({ name: `Account ${i+1}: pubkey`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i+1}: withdrawal_credentials`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i+1}: amount`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i+1}: signature`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i+1}: deposit_message_root`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i+1}: deposit_data_root`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i+1}: fork_version`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i+1}: network_name`, type: 'string' });
        GNOairfropType.push({ name: `Account ${i+1}: deposit_cli_version`, type: 'string' });

        message[`Account ${i+1}: pubkey`] = deposits[0].pubkey;
        message[`Account ${i+1}: withdrawal_credentials`] = deposits[0].withdrawal_credentials;
        message[`Account ${i+1}: amount`] = deposits[0].amount;
        message[`Account ${i+1}: signature`] = deposits[0].signature;
        message[`Account ${i+1}: deposit_message_root`] = deposits[0].deposit_message_root;
        message[`Account ${i+1}: deposit_data_root`] = deposits[0].deposit_data_root;
        message[`Account ${i+1}: fork_version`] = deposits[0].fork_version;
        message[`Account ${i+1}: network_name`] = deposits[0].network_name;
        message[`Account ${i+1}: deposit_cli_version`] = deposits[0].deposit_cli_version;
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

      if(json.status){
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
        buttons={
          eligible && !alreadySubmitted && <Button
            className="swap-button"
            onClick={() => { handleClick(address, message) }}
            disabled={fileName.length === 0}
          >
            Sign and send
          </Button>
        }
      >
        <strong>Requirements and calculation:</strong><br />
        <span style={{
          fontSize: '13px'
        }}>
          Snapshot time: 28 June 2024, 8AM UTC<br /><br />
          To count how many GNO you get airdropped, we divide the wxHOPR sum of tokens in the safe and channels at the time of snapshot by 30k (10k if you staked Netowork Registry NFT) and:<br />
          - if the quotient of the result is higher or equal than {`<number_of_nodes>`}, then you will get {`<number_of_nodes>`} GNO,<br />
          - if the quotient will be smaller than {`<number_of_nodes>`}, then you will get the {`<quotient>`} GNO.<br /><br />

          The {`<number_of_nodes>`} is a sum of all your nodes wich were online at least 50% in the 2 weeks before the snapshot date and have at least 1 outgoing channel funded at the snapshot time.<br /><br />

          You will be able to upload the deposits file (
          <a
            target="_blank"
            rel="noreferrer"
            href="https://docs.gnosischain.com/node/manual/validator/generate-keys/"
            style={{
              textDecoration: 'underline'
            }}
          >
              tutorial: How to generate deposits files
          </a>
          ) till the end of July 2024. GNO will be distributed directly to those valiators before end of August 2024. Do not worry if you did not qualify this time, just make sure that for the next one you have your nodes online and well!<br /><br /><br />


        </span>

        {alreadySubmittedFetching && <span style={{}}><br/><strong>Loading...</strong></span>}
        {!alreadySubmittedFetching && safeAddress && !eligible && <span style={{}}><br/><strong>Your safe is not eligible.</strong></span>}
        {!alreadySubmittedFetching && alreadySubmitted && <span style={{color: 'darkgreen'}}><br/><strong>You submitted deposit file.</strong></span>}

        {!alreadySubmittedFetching && safeAddress && eligible && !alreadySubmitted &&
          <>
            <strong >Your <span style={{overflowWrap: 'anywhere'}}>{safeAddress}</span> safe is eligible for {safeAddress && GNOeligible[safeAddress?.toLowerCase() as `0x${string}`]} GNO.</strong>
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

      </StepContainer>
      <NetworkOverlay />
    </Section>
  );
}

export default WrapperPage;
