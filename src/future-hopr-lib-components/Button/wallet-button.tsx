import React from 'react';
import styled from '@emotion/styled';
import MuiButton from '@mui/material/Button';
import Typography from '../Typography';
import { Connector } from 'wagmi'

const SButton = styled(MuiButton)`
  width: 100%;
  background-color: rgb(241, 241, 241);
  img {
    height: 48px;
  }
  .Typography--PlainText {
    margin-bottom: 0;
    margin-left: 16px;
  }
`;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.PropsWithChildren & {
    wallet?: string;
    walletName?: string;
    className?: string;
    src?: string;
    connector: Connector
  };

export default function Button(props: ButtonProps) {
  function src() {
    switch (props.wallet) {
    case 'metaMask':
      return '/assets/wallets/MetaMask-Emblem.svg';
    case 'walletConnect':
      return '/assets/wallets/WalletConnect-Login.png';
    case 'injected':
      return '';
    case 'viewMode':
      return '/assets/wallets/Eye_open_font_awesome.svg';
    default:
      return '';
    }
  }

  return (
    <SButton
      className={props.className}
      onClick={props.onClick}
    >
      <img src={props.src ? props.src : src()} />
      {props.wallet === 'viewMode' && <Typography>View mode</Typography>}
      {props.wallet === 'injected' && <Typography>BROWSER WALLET</Typography>}
    </SButton>
  );
}
