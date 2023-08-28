import { useRef, useState } from 'react';
import { DialogTitle, DialogActions, InputAdornment } from '@mui/material';
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import STextField from '../../../future-hopr-lib-components/TextField';
import { useAppDispatch, useAppSelector } from '../../../store';
import { actionsAsync } from '../../../store/slices/node/actionsAsync';
import { utils } from 'ethers';
import { sendNotification } from '../../../hooks/useWatcher/notifications';

//Mui
import CloseIcon from '@mui/icons-material/Close';

// HOPR Components
import Button from '../../../future-hopr-lib-components/Button';
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import AddChannelsIcon from '../../../future-hopr-lib-components/Icons/AddChannels';

type OpenMultipleChannelsModalProps = {};

export const OpenMultipleChannelsModal = () => {
  const dispatch = useAppDispatch();
  const loginData = useAppSelector((selector) => selector.auth.loginData);
  const [openChannelModal, set_openMultipleChannelsModal] = useState(false);
  const [amount, set_amount] = useState('');
  const [peerIds, set_peerIds] = useState<string[]>([]);

  const handleRefresh = () => {
    if (loginData.apiEndpoint && loginData.apiToken) {
      dispatch(
        actionsAsync.getChannelsThunk({
          apiEndpoint: loginData.apiEndpoint,
          apiToken: loginData.apiToken,
        }),
      );
    }
  };

  const handleCloseModal = () => {
    set_openMultipleChannelsModal(false);
    set_amount('');
    set_peerIds([]);
  };

  const handleOpenChannel = async (weiValue: string, peerId: string) => {
    await dispatch(
      actionsAsync.openChannelThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken!,
        amount: weiValue,
        peerId: peerId,
        timeout: 60e3,
      }),
    )
      .unwrap()
      .then(() => {
        const msg = `Channel to ${peerId} is opened`;
        sendNotification({
          notificationPayload: {
            source: 'node',
            name: msg,
            url: null,
            timeout: null,
          },
          toastPayload: { message: msg },
          dispatch,
        });
      })
      .catch((e) => {
        let errMsg = `Channel to ${peerId} failed to be opened.`;
        if (e.status) errMsg = errMsg + `\n${e.status}`;
        sendNotification({
          notificationPayload: {
            source: 'node',
            name: errMsg,
            url: null,
            timeout: null,
          },
          toastPayload: { message: errMsg },
          dispatch,
        });
      });
  };

  const handleAction = async () => {
    const parsedOutgoing = parseFloat(amount ?? '0') >= 0 ? amount ?? '0' : '0';
    const weiValue = utils.parseEther(parsedOutgoing).toString();
    if (peerIds && loginData.apiEndpoint && loginData.apiToken) {
      for (let i = 0; i < peerIds.length; i++) {
        handleOpenChannel(weiValue, peerIds[i]);
        await new Promise((r) => setTimeout(r, 50));
      }
    }
    handleCloseModal();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles the file upload event.
   * @param event The file upload event.
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const contents = e.target?.result;
      if (typeof contents === 'string') {
        const parsedData = parseCSV(contents);
        if (parsedData.length > 0) {
          set_peerIds(parsedData);
          set_openMultipleChannelsModal(true);
        } else {
          const msg = 'Failed parsing .csv to open multiple channels.';
          sendNotification({
            notificationPayload: {
              source: 'node',
              name: msg,
              url: null,
              timeout: null,
            },
            toastPayload: { message: msg },
            dispatch,
          });
        }
      }
    };

    if (file) {
      reader.readAsText(file);
    }
  };

  const parseCSV = (csvContent: string) => {
    const lines = csvContent.split('\n');
    const parsedData: string[] = [];
    let startAtLine = 1;

    // gets all keys, csv holds the headers on the first line
    const header = lines[0].split(',');
    const expectedObjectKeys = header.map((key) => key.trim());

    // find the index of the "peerId" header
    let peerIdIndex = expectedObjectKeys.findIndex((key) => key === 'peerId' || key === 'peerid' || key === 'peer');

    if (peerIdIndex === -1) {
      peerIdIndex = expectedObjectKeys.findIndex((key) => key.length === 53 && key.substr(0, 6) === '16Uiu2');
      startAtLine = 0;
    }

    // loop through each line, get the peerId value and add it to parsedData
    for (let i = startAtLine; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length > 1 && peerIdIndex !== -1) {
        const peerId = values[peerIdIndex]?.trim();
        if (peerId) {
          parsedData.push(peerId);
        }
      }
    }

    // Reset the file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    return parsedData;
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <IconButton
        iconComponent={<AddChannelsIcon />}
        tooltipText={'Open multiple outgoing channels by csv'}
        onClick={handleImportClick}
      />
      <input
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileUpload}
        placeholder="import"
      />
      <SDialog
        open={openChannelModal}
        onClose={handleCloseModal}
        disableScrollLock={true}
      >
        <TopBar>
          <DialogTitle>{'Open Multiple Channels'}</DialogTitle>
          <SIconButton
            aria-label="close modal"
            onClick={handleCloseModal}
          >
            <CloseIcon />
          </SIconButton>
        </TopBar>
        <SDialogContent>
          <STextField
            label="Peer Ids"
            type="string"
            placeholder="16Uiu2HA...,16Uiu2HA...,16Uiu2HA...,16Uiu2HA..."
            value={peerIds.join(',\n')}
            multiline
            rows={8}
            disabled={true}
            sx={{}}
          />
          <STextField
            label="Amount"
            type="string"
            placeholder="Amount"
            value={amount}
            onChange={(e) => set_amount(e.target.value)}
            InputProps={{ endAdornment: <InputAdornment position="end">mHOPR</InputAdornment> }}
            sx={{ mt: '6px' }}
          />
        </SDialogContent>
        <DialogActions>
          <Button
            onClick={handleAction}
            disabled={!amount || parseFloat(amount) <= 0 || !peerIds}
            style={{
              marginRight: '16px',
              marginBottom: '6px',
              marginTop: '-18px',
            }}
          >
            Open Channels
          </Button>
        </DialogActions>
      </SDialog>
    </>
  );
};