import { useEffect, useState, useRef } from 'react';
import styled from '@emotion/styled';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { erc20ABI, useContractRead, useWalletClient } from 'wagmi';
import { parseUnits } from 'viem';
import { WEB_API } from '../../../config'
import { GNOeligible } from '../../utils/gno-airdrop';

// Redux
import { useAppSelector } from '../../store';

// HOPR Components
import Button from '../../future-hopr-lib-components/Button';
import Section from '../../future-hopr-lib-components/Section';
import NetworkOverlay from '../../components/Overlays/NetworkOverlay';
import IconButton from '../../future-hopr-lib-components/Button/IconButton';
import FileUploadIcon from '@mui/icons-material/FileUpload';

import { StepContainer } from './onboarding/components';

function WrapperPage() {
  const [message, set_message] = useState('');
  const [fileName, set_fileName] = useState('');
  const [error, set_error] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const address = useAppSelector((store) => store.web3.account) as `0x${string}` | null;
  const { data: walletClient } = useWalletClient();
  const safeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);

  const eligible = safeAddress && Object.keys(GNOeligible).includes(safeAddress?.toLowerCase());


  const payload = {
    "method": "eth_signTypedData_v4",
    "params": [
      "0x0000000000000000000000000000000000000000",
      {
        "types": {
          "EIP712Domain": [
            {
              "name": "name",
              "type": "string"
            },
            {
              "name": "version",
              "type": "string"
            },
            {
              "name": "chainId",
              "type": "uint256"
            },
            {
              "name": "verifyingContract",
              "type": "address"
            }
          ],
          "Person": [
            {
              "name": "name",
              "type": "string"
            },
            {
              "name": "wallet",
              "type": "address"
            }
          ],
          "Mail": [
            {
              "name": "from",
              "type": "Person"
            },
            {
              "name": "to",
              "type": "Person"
            },
            {
              "name": "contents",
              "type": "string"
            }
          ]
        },
        "primaryType": "Mail",
        "domain": {
          "name": "Ether Mail",
          "version": "1",
          "chainId": 1,
          "verifyingContract": "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
        },
        "message": {
          "from": {
            "name": "Cow",
            "wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
          },
          "to": {
            "name": "Bob",
            "wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
          },
          "contents": "Hello, Bob!"
        }
      }
    ]
  }

  const handleClick = async (account: `0x${string}` | null, message: string) => {
    if (!walletClient || !account) return;

    // const signature = await walletClient.signMessage({
    //   account,
    //   message,
    // })


    // const signature = await walletClient.signMessage({
    //     account,
    //     message: JSON.stringify({
    //       domain: window.location.host,
    //       validatorFile: message
    //     }),
    // })

    const payload = {
      types: {
        'GNO-airdrop': [
          { name: 'domain', type: 'string' },
          { name: 'contents', type: 'string' },
        ],
      },
      primaryType: 'GNO-airdrop',
      message: {
        domain: window.location.host,
        contents: message,
      },
    }

    // @ts-ignore
    const signature = await walletClient.signTypedData(payload)

    console.log(signature);
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
    })
  };

 /**
 * Handles the file upload event.
 * @param event The file upload event.
 */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('event.target', event.target.files)
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
          eligible && <Button
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
          To count how many GNO you get airdropped, we divide the wxHOPR sum of tokens in the safe and channels at the time of snaphot by 30k (10k if you staked Netowork Registry NFT) and:<br />
          - if the quotient of the result is higher or equal than {`<number_of_nodes>`}, then you will get {`<number_of_nodes>`} GNO,<br />
          - if the quotient will be smaller than {`<number_of_nodes>`}, then you will get the {`<quotient>`} GNO.<br /><br />

          The {`<number_of_nodes>`} is a sum of all your nodes wich were online at least 50% in the 2 weeks before the snaphot date and have at least 1 outgoing channel funded at the snapchot time.<br /><br />

          You will be able to upload the file till end of July 2024. GNO will be distributed right before end of August 2024. Do not worry if you did not qualify this time, just make sure that for the next one you have your nodes online and well!<br /><br /><br />


        </span>
        {safeAddress && !eligible && <span style={{

        }}><strong>Your safe is not eligible.</strong></span>}


        {safeAddress && eligible &&
          <>
            <strong>Your {safeAddress} safe is eligible for {safeAddress && GNOeligible[safeAddress?.toLowerCase() as `0x${string}`]} GNO.</strong>
            <br /><br />
            Upload validator file {fileName && `(uploaded file '${fileName}')`}
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
