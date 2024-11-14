import { useEffect, useState, useRef } from 'react';
import styled from '@emotion/styled';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { erc20ABI, useContractRead, useWalletClient } from 'wagmi';
import { parseUnits } from 'viem';
import { WEB_API } from '../../../config'
import { GNOeligible } from '../../utils/gno-airdrop';
import { truncateEthereumAddress } from '../../utils/blockchain';

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
//@ts-ignore
import confetti from 'canvas-confetti';

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
  const paidOut = useAppSelector((store) => store.safe.gnoAirdrop.paid);

  const alreadySubmittedFetching = useAppSelector((store) => store.safe.gnoAirdrop.isFetching);

  const eligible = safeAddress && Object.keys(GNOeligible).includes(safeAddress?.toLowerCase());


  const doConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.5 }
    };

    function fire(particleRatio: number, opts: object) {
      confetti(Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio)
      }));
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }
  alreadySubmitted && doConfetti();

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
        try {
          const json = JSON.parse(contents);
          const length = json.length;
          if (length >= 49) {
            alert('Error: deposit file too long')
          } else {
            let correctNetwork = true;
            // @ts-ignore
            json.forEach(validator => {
              if (correctNetwork && validator.network_name === "gnosis") {
                correctNetwork = true;
              } else {
                correctNetwork = false;
              }
            })

            if (correctNetwork) {
              set_message(contents);
              set_fileName(fileName);
            } else {
              alert('You did not upload Gnosis chain deposit file. Please generate correct validator files.')
            }

          }
        } catch (e) {
          console.log('Error2')
          alert('Error loading file')
        }
      } else {
        console.log('Error3')
        alert('Error loading file')
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
          src: '/assets/GNO_Airdrop.svg',
          alt: 'GNO Aridrop',
          height: 100,
        }}
        buttons={
          eligible && !alreadySubmitted && !alreadySubmittedFetching &&
          // false && // to turn off the gno announcement
          <Button
            className="swap-button"
            onClick={() => { handleClick(address, message) }}
            disabled={fileName.length === 0}
          >
            Sign and send
          </Button>
        }
      >

        <span>
          To strengthen the link between the Gnosis and HOPR infrastructure ecosystems, 500 GNO was be made available to HOPR nodes runners. Node runners will receive their GNO by submitting their validators. More information you can find at {` `}
          <a
            href="https://forum.gnosis.io/t/gip-98-should-gnosisdao-invest-in-hopr-to-kickstart-development-of-gnosisvpn/8348"
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: 'underline'
            }}
          >GIP-98 on Gnosis the official forum</a>.
        </span><br /><br />

        {
          // false && // to turn off the gno announcement
          !alreadySubmittedFetching && safeAddress && eligible &&
          <p
            style={{
              fontSize: '20px',
              textAlign: 'center',
              fontWeight: 700,
              marginBlockStart: 0,
              marginBlockEnd: '20px',
            }}
          >Your <span style={{ overflowWrap: 'anywhere' }}>{truncateEthereumAddress(safeAddress as string)}</span> safe is eligible for {' '}
            <span
              style={{
                fontSize: '40px',
                color: 'darkblue'
              }}
            >{GNO2GET}</span> GNO.
          </p>
        }


        {
          GNO2GET > 0 && !paidOut &&
          // false && // to turn off the gno announcement
          <>
            <strong>How to claim</strong><br />
            <span
            // style={{
            //   fontSize: '13px'
            // }}
            >
              To claim, we'll need you to sign the deposit file for your <strong>{GNO2GET}</strong> new Gnosis validator{
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
              You had until<strong>{` `}November 15th{` `}</strong>to submit your validator(s) file. If you miss this deadline, you will have to wait until future distributions, which are first come, first served.
              <br /><br />
            </span>
          </>
        }

        {/* <div
          style={{
            width: '100%',
            textAlign: 'center'
          }}
        ><span style={{ color: 'darkgreen', fontSize: '20px' }}><br /><strong>We’re excited to announce the 2nd batch of $GNO distribution 💰<br /><br />New HOPR nodes that maintain 90%+ uptime from Oct 1st - 30th at 12:00 AM CET will be eligible to claim!</strong></span></div> */}

        <div
          // style={{
          //   display: 'none'
          // }}  // to turn off the gno announcement
        >


          {!web3Connected && <span style={{}}><br /><strong>Connect wallet and safe to check if you are eligible.</strong></span>}

          {web3Connected && !safeAddress && <span style={{}}><br /><strong>Connect safe to check if you are eligible.</strong></span>}
          {alreadySubmittedFetching && <span style={{}}><br /><strong>Loading...</strong></span>}
          {willNotGetGNO && <span style={{}}><br /><strong>Your safe is not eligible.</strong></span>}
          {!alreadySubmittedFetching && alreadySubmitted && !paidOut && <span style={{ color: 'darkgreen' }}><br /><strong>Congratulations, you submitted your deposit file.<br />Distribution will begin the week of November 18th.</strong></span>}
          {!alreadySubmittedFetching && paidOut && <div
            style={{
              width: '100%',
              textAlign: 'center'
            }}
          ><span style={{ color: 'darkgreen', fontSize: '20px' }}><br /><strong>Congratulations, airdrop was transferred to your validator.</strong></span></div>}


          {!alreadySubmittedFetching && safeAddress && eligible && !alreadySubmitted &&
            <>
              <br />
              Uploading deposit file is disabled due to passed deadline {fileName && `(uploaded file '${fileName}')`}
              <IconButton
                iconComponent={<FileUploadIcon />}
                tooltipText={
                  <span>
                    UPLOADING
                    <br />
                    validator file is disabled {/* disabled*/}
                  </span>
                }
                onClick={handleImportClick}
                disabled //disable after the deadline
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

        </div>





      </StepContainer>
    </Section>
  );
}

export default WrapperPage;
