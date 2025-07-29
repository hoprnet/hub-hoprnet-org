import { DialogActions, DialogTitle, InputAdornment, TextField } from '@mui/material';
import { ethers } from 'ethers';
import { useState } from 'react';
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import { useAppDispatch, useAppSelector } from '../../../store';
import { actionsAsync } from '../../../store/slices/node/actionsAsync';
import { sendNotification } from '../../../hooks/useWatcher/notifications';
import { HOPR_TOKEN_USED } from '../../../../config';

// HOPR Components
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import FundChannelIcon from '../../../future-hopr-lib-components/Icons/FundChannel';
import Button from '../../../future-hopr-lib-components/Button';

// Mui
import CloseIcon from '@mui/icons-material/Close';

type FundChannelModalModalProps = {
  channelId?: string;
  disabled?: boolean;
};

export const FundChannelModal = ({ ...props }: FundChannelModalModalProps) => {
  const dispatch = useAppDispatch();
  const loginData = useAppSelector((store) => store.auth.loginData);
  const [openChannelModal, set_openChannelModal] = useState(false);
  const [amount, set_amount] = useState('');
  const [channelId, set_channelId] = useState(props.channelId ? props.channelId : '');

  const handleOpenChannelDialog = () => {
    set_openChannelModal(true);
  };

  const handleCloseModal = () => {
    set_openChannelModal(false);
    set_amount('');
    set_channelId(props.channelId ? props.channelId : '');
  };

  const handleAction = async () => {
    const handleFundChannel = async (weiValue: string, channelId: string) => {
      await dispatch(
        actionsAsync.fundChannelThunk({
          apiEndpoint: loginData.apiEndpoint!,
          apiToken: loginData.apiToken ? loginData.apiToken : '',
          amount: weiValue,
          channelId: channelId,
          timeout: 60e3,
        })
      )
        .unwrap()
        .then(() => {
          const msg = `Channel ${channelId} is funded`;
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
        .catch(async (e) => {
          const isCurrentApiEndpointTheSame = await dispatch(
            actionsAsync.isCurrentApiEndpointTheSame(loginData.apiEndpoint!)
          ).unwrap();
          if (!isCurrentApiEndpointTheSame) return;

          let errMsg = `Channel ${channelId} failed to be funded`;
          if (e.status) errMsg = errMsg + `.\n${e.status}`;
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

    handleCloseModal();
    const parsedOutgoing = parseFloat(amount ?? '0') >= 0 ? amount ?? '0' : '0';
    const weiValue = ethers.utils.parseEther(parsedOutgoing).toString();
    await handleFundChannel(weiValue, channelId);
    dispatch(
      actionsAsync.getChannelsThunk({
        apiEndpoint: loginData.apiEndpoint!,
        apiToken: loginData.apiToken ? loginData.apiToken : '',
      })
    );
  };

  return (
    <>
      <IconButton
        iconComponent={<FundChannelIcon />}
        disabled={props.disabled}
        tooltipText={
          <span>
            FUND
            <br />
            outgoing channel
          </span>
        }
        onClick={handleOpenChannelDialog}
      />
      <SDialog
        open={openChannelModal}
        onClose={handleCloseModal}
        disableScrollLock={true}
      >
        <TopBar>
          <DialogTitle>Fund outgoing channel</DialogTitle>
          <SIconButton
            aria-label="close modal"
            onClick={handleCloseModal}
          >
            <CloseIcon />
          </SIconButton>
        </TopBar>
        <SDialogContent>
          <TextField
            label="Channel Id"
            value={channelId}
            placeholder="0x4f5a...1728"
            onChange={(e) => set_channelId(e.target.value)}
            sx={{ mt: '6px' }}
          />
          <TextField
            label="Amount"
            type="string"
            placeholder="Amount"
            value={amount}
            onChange={(e) => set_amount(e.target.value)}
            InputProps={{ endAdornment: <InputAdornment position="end">{HOPR_TOKEN_USED}</InputAdornment> }}
            sx={{ mt: '6px' }}
          />
        </SDialogContent>
        <DialogActions>
          <Button
            onClick={handleAction}
            disabled={!amount || parseFloat(amount) <= 0 || !channelId}
            style={{
              marginRight: '16px',
              marginBottom: '6px',
              marginTop: '-6px',
            }}
          >
            Fund outgoing channel
          </Button>
        </DialogActions>
      </SDialog>
    </>
  );
};
