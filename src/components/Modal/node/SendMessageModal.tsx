import { useState, useEffect } from 'react';
import styled from '@emotion/styled';

// HOPR Components
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import Button from '../../../future-hopr-lib-components/Button';

// Mui
import {
  DialogTitle,
  DialogActions,
  CircularProgress,
  TextField,
  SelectChangeEvent,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';

import { SendMessagePayloadType } from '@hoprnet/hopr-sdk';
import CloseIcon from '@mui/icons-material/Close';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';

// Store
import { useAppDispatch, useAppSelector } from '../../../store';
import { actionsAsync } from '../../../store/slices/node/actionsAsync';

const PathOrHops = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  width: 100%;

  .numerOfHopsSelected {
    justify-content: center;
  }

  .noNumberOfHopsSelected {
    justify-content: flex-start;
  }

  .numerOfHops {
    flex: 1;
  }

  .noNumberOfHops {
    flex: 0.5;
  }
`;

const StatusContainer = styled.div`
  position: absolute;
  height: calc(100% - 32px);
  width: calc(100% - 32px);
  height: 100%;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  z-index: 100;
`;

type SendMessageModalProps = {
  peerId?: string;
  disabled?: boolean;
  tooltip?: JSX.Element | string;
};

export const SendMessageModal = (props: SendMessageModalProps) => {
  const dispatch = useAppDispatch();
  const [path, set_path] = useState<string>('');
  const [loader, set_loader] = useState<boolean>(false);
  const [error, set_error] = useState<string | null>(null);
  const [numberOfHops, set_numberOfHops] = useState<number>(0);
  const [sendMode, set_sendMode] = useState<'path' | 'automaticPath' | 'numberOfHops' | 'directMessage'>(
    'directMessage'
  );
  const [message, set_message] = useState<string>('');
  const [openModal, set_openModal] = useState<boolean>(false);
  const loginData = useAppSelector((store) => store.auth.loginData);
  const aliases = useAppSelector((store) => store.node.aliases.data);
  const peers = useAppSelector((store) => store.node.peers.data?.connected);
  const addresses = useAppSelector((store) => store.node.addresses.data);
  const peersAndOwnNode =
    peers && addresses.hopr && addresses.native ? [...peers.map((peer) => peer.peerId), addresses.hopr] : [];
  const [selectedReceiver, set_selectedReceiver] = useState<string | null>(props.peerId ? props.peerId : null);

  const maxLength = 500;
  const remainingChars = maxLength - message.length;

  const setPropPeerId = () => {
    if (props.peerId) set_selectedReceiver(props.peerId);
  };
  useEffect(setPropPeerId, [props.peerId]);

  useEffect(() => {
    switch (sendMode) {
      case 'automaticPath':
        set_numberOfHops(1);
        break;
      case 'path':
        set_numberOfHops(0);
        break;
      case 'numberOfHops':
        set_path('');
        break;
      default: //anything that is not a custom route
        set_numberOfHops(0);
        set_path('');
    }
  }, [sendMode]);

  const handleSendMessage = () => {
    if (!loginData.apiEndpoint || !selectedReceiver) return;
    set_error(null);
    set_loader(true);
    //const validatedReceiver = validatePeerId(selectedReceiver);

    const messagePayload: SendMessagePayloadType = {
      apiToken: loginData.apiToken ? loginData.apiToken : '',
      apiEndpoint: loginData.apiEndpoint,
      body: message,
      peerId: selectedReceiver,
      tag: 1,
    };
    if (sendMode === 'automaticPath') {
      messagePayload.hops = 1;
    }
    if (sendMode === 'directMessage') {
      messagePayload.path = [];
    }
    if (sendMode === 'numberOfHops') {
      if (numberOfHops === 0) {
        messagePayload.path = [];
      } else {
        messagePayload.hops = numberOfHops;
      }
    }
    if (sendMode == 'path') {
      const pathElements: string[] = [];
      const lines = path.split('\n');
      for (const line of lines) {
        const elements = line
          .split(',')
          .map((element) => element.trim())
          .filter((element) => element !== '');
        pathElements.push(...elements);
      }

      const validatedPath = pathElements.map((element) => validatePeerId(element));
      messagePayload.path = validatedPath;
    }

    dispatch(actionsAsync.sendMessageThunk(messagePayload))
      .unwrap()
      .then((res) => {
        console.log('@message: ', res?.challenge);
        handleCloseModal();
      })
      .catch((e) => {
        console.log('@message err:', e);
        set_error(e.error);
      })
      .finally(() => {
        set_loader(false);
      });
  };

  const handleSendModeChange = (event: SelectChangeEvent) => {
    set_sendMode(event.target.value as 'path' | 'numberOfHops' | 'automaticPath' | 'directMessage');
  };

  const handlePath = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_sendMode('path');
    set_path(event.target.value);
  };

  const handleNumberOfHops = (event: React.ChangeEvent<HTMLInputElement>) => {
    set_numberOfHops(
      parseInt(event.target.value) || parseInt(event.target.value) === 0 ? parseInt(event.target.value) : 0
    );
  };

  const handleOpenModal = () => {
    set_openModal(true);
  };

  const handleCloseModal = () => {
    set_sendMode('directMessage');
    set_numberOfHops(0);
    set_message('');
    set_selectedReceiver(props.peerId ? props.peerId : null);
    set_path('');
    set_openModal(false);
    set_error(null);
  };

  const handlePathKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault(); // Prevent space key from inserting a space
      const input = e.target as HTMLInputElement;
      // These are always a number... never null
      const start = input.selectionStart!;
      const end = input.selectionEnd!;
      set_path((prevPath) => prevPath.substring(0, start) + '\n' + prevPath.substring(end));
      setTimeout(() => {
        input.setSelectionRange(start + 1, start + 1);
      }, 0);
    } else if (e.key === ',') {
      e.preventDefault(); // Prevent space key from inserting a space
      const input = e.target as HTMLInputElement;
      const start = input.selectionStart!;
      const end = input.selectionEnd!;
      set_path((prevPath) => prevPath.substring(0, start) + ',\n' + prevPath.substring(end));
      setTimeout(() => {
        input.setSelectionRange(start + 2, start + 2);
      }, 0);
    }
  };

  const isAlias = (alias: string) => {
    if (aliases) {
      return !!aliases[alias];
    } else return false;
  };

  const validatePeerId = (receiver: string) => {
    if (aliases && isAlias(receiver)) {
      return aliases[receiver];
    }
    return receiver;
  };

  const hasAlias = (peerId: string) => {
    if (aliases) {
      return Object.values(aliases).includes(peerId);
    }
  };

  const findAlias = (peerId: string) => {
    if (aliases) {
      for (const alias in aliases) {
        if (aliases[alias] === peerId) {
          return alias;
        }
      }
    }
    return null;
  };

  return (
    <>
      <IconButton
        iconComponent={<ForwardToInboxIcon />}
        tooltipText={
          props.tooltip ? (
            props.tooltip
          ) : (
            <span>
              SEND
              <br />
              message
            </span>
          )
        }
        onClick={handleOpenModal}
        disabled={props.disabled}
      />

      <SDialog
        open={openModal}
        onClose={handleCloseModal}
        disableScrollLock={true}
        maxWidth={'800px'}
      >
        <TopBar>
          <DialogTitle>Send Message</DialogTitle>
          <SIconButton
            aria-label="close modal"
            onClick={handleCloseModal}
          >
            <CloseIcon />
          </SIconButton>
        </TopBar>
        <SDialogContent>
          <Autocomplete
            value={selectedReceiver}
            onChange={(event, newValue) => {
              set_selectedReceiver(newValue);
            }}
            options={peersAndOwnNode}
            getOptionLabel={(peerId) => (hasAlias(peerId) ? `${findAlias(peerId)} (${peerId})` : peerId)}
            autoSelect
            renderInput={(params) => (
              <TextField
                {...params}
                label="Receiver (PeerId or Alias)"
                placeholder="Select Receiver"
                fullWidth
              />
            )}
          />

          <TextField
            label="Message"
            placeholder="Hello Node..."
            multiline
            rows={4}
            value={message}
            onChange={(e) => set_message(e.target.value)}
            inputProps={{ maxLength: maxLength }}
            helperText={`${remainingChars} characters remaining`}
            required
            fullWidth
          />
          <span style={{ margin: '0px 0px -2px' }}>Send mode:</span>
          <PathOrHops className={sendMode === 'numberOfHops' ? 'numerOfHopsSelected' : 'noNumberOfHopsSelected'}>
            <Select
              value={sendMode}
              onChange={handleSendModeChange}
              className={sendMode === 'numberOfHops' ? 'numerOfHops' : 'noNumberOfHops'}
            >
              <MenuItem value="directMessage">Direct Message</MenuItem>
              <MenuItem value="automaticPath">Automatic Path</MenuItem>
              <MenuItem value="numberOfHops">Number of Hops</MenuItem>
              <MenuItem value="path">Path (PeerIds or Aliases)</MenuItem>
            </Select>
            {sendMode === 'numberOfHops' && (
              <TextField
                type="number"
                label="Number of Hops"
                placeholder="1"
                value={numberOfHops}
                onChange={handleNumberOfHops}
                inputProps={{
                  min: 0,
                  max: 10,
                  step: 1,
                }}
                style={{ flex: 1 }}
                fullWidth
              />
            )}
          </PathOrHops>
          {sendMode === 'path' && (
            <TextField
              label="Path (PeerIds or Aliases)"
              placeholder={'12D3Ko...Z3rz5F,\n12D3Ko...wxd4zv,\nAlan,\n12D3Ko...zF8c7u'}
              value={path}
              onChange={handlePath}
              onKeyDown={handlePathKeyDown}
              multiline
              rows={4}
              fullWidth
            />
          )}
        </SDialogContent>
        <DialogActions>
          <Button
            onClick={handleSendMessage}
            pending={loader}
            disabled={
              selectedReceiver === null ||
              (sendMode !== 'directMessage' && sendMode !== 'automaticPath' && numberOfHops < 0 && path === '') ||
              message.length === 0
            }
            style={{
              width: '100%',
              marginTop: '8px',
              marginBottom: '8px',
            }}
          >
            Send
          </Button>
        </DialogActions>
        {error && (
          <StatusContainer>
            <TopBar>
              <DialogTitle>ERROR</DialogTitle>
              <SIconButton
                aria-label="hide error"
                onClick={() => {
                  set_error(null);
                }}
              >
                <CloseIcon />
              </SIconButton>
            </TopBar>
            <SDialogContent>{error}</SDialogContent>
          </StatusContainer>
        )}
      </SDialog>
    </>
  );
};
