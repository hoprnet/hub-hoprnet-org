import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import MuiButton from '@mui/material/Button';
import Typography from '../Typography';
import { Connector } from 'wagmi';

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
    walletIcon?: string;
    className?: string;
    src?: string;
    connector: Connector;
  };

export default function Button(props: ButtonProps) {
  const [walletIcon, set_walletIcon] = useState(props.src);

  useEffect(() => {
    switch (props.wallet) {
      case 'com.brave.wallet':
        set_walletIcon('/assets/wallets/Brave-wallet.png');
        break;
      case 'walletConnect':
        set_walletIcon('/assets/wallets/WalletConnect-Login.png');
        break;
      case 'viewMode':
        set_walletIcon('/assets/wallets/Eye_open_font_awesome.svg');
        break;
    }
  }, [props.wallet]);

  const walletsWithFullIcons = ['walletConnect'];

  return (
    <SButton
      className={props.className}
      onClick={props.onClick}
    >
      <img src={walletIcon} />
      {/* {props.wallet === 'viewMode' && <Typography>View mode</Typography>} */}
      {props.wallet && !walletsWithFullIcons.includes(props.wallet) && <Typography>{props.walletName}</Typography>}
    </SButton>
  );
}
