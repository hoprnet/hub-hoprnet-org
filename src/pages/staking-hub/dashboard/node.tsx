import styled from '@emotion/styled';
import { ReactNode, useEffect, useState } from 'react';
import { truncateHOPRPeerId } from '../../../utils/helpers';
import { useAppDispatch, useAppSelector } from '../../../store';
import { safeActionsAsync } from '../../../store/slices/safe';
import { useEthersSigner } from '../../../hooks';
import { rounder } from '../../../utils/functions';
import { getAddress } from 'viem';


import { Card, Chip, IconButton as MuiIconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import CopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WalletIcon from '@mui/icons-material/Wallet';
import TooltipMui from '@mui/material/Tooltip';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';

// HOPR components
import Button from '../../../future-hopr-lib-components/Button';
import { Table } from '../../../future-hopr-lib-components/Table/columed-data'
import ProgressBar from '../../../future-hopr-lib-components/Progressbar'
import { formatDate } from '../../../utils/date';
import TablePro from '../../../future-hopr-lib-components/Table/table-pro';
import Tooltip from '../../../future-hopr-lib-components/Tooltip/tooltip-fixed-width';
import { DockerRunCommandModal } from '../../../components/Modal/staking-hub/DockerRunCommandModal';
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import TrainIcon from '../../../future-hopr-lib-components/Icons/TrainIcon';


//web3
import { Address } from 'viem';
import { browserClient } from '../../../providers/wagmi';
import { Dock } from '@mui/icons-material';


const Container = styled.section`
    padding: 1rem;

    h4.title {
      font-weight: 700;
      margin: 0;
    }

    h5.subtitle {
      font-weight: 600;
      margin: 0;
    }

    svg[data-testid="CheckCircleRoundedIcon"]{
      color: darkgreen;
    }

    svg[data-testid="CancelRoundedIcon"]{
      color: red;
    }

    .online {
      color: darkgreen;
      font-weight: 600;
    }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;

  @media screen and (max-width: 1350px) {
    grid-template-columns: repeat(1, 1fr);
    #node-details {
      grid-column: 1;
    }
  }

`;

const StyledGrayCard = styled(Card)`
  background-color: #edf2f7;
  color: #414141;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CardValue = styled.h5`
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0;
`;

const CardCurrency = styled.p`
  font-size: 0.75rem;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
`;

const ValueAndCurrency = styled.div`
  align-items: flex-end;
  display: flex;
  gap: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StyledChip = styled(Chip) <{ color: string }>`
  align-self: flex-start;
  background-color: ${(props) => props.color === 'error' && '#ffcbcb'};
  background-color: ${(props) => props.color === 'success' && '#cbffd0'};
  color: ${(props) => props.color === 'error' && '#c20000'};
  color: ${(props) => props.color === 'success' && '#00c213'};
  font-weight: 700;
`;

const Graphic = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 1fr;
  gap: 1rem;
  @media screen and (max-width: 1350px) {
    grid-template-columns: 100px 1fr;
  }
`;

const NodeGraphic = styled.div`
  box-sizing: border-box;
  background-color: #d3f6ff;
  display: grid;
  min-height: 281px;
  max-width: 200px;
  padding: 1rem;
  place-items: center;

  img {
    display: block;
    height: 100%;
    width: 100%;
    object-fit: contain;
  }

  @media screen and (max-width: 1350px) {
    max-width: 100px;
  }
`;

const SquaredIconButton = styled(MuiIconButton)`
  color: #414141;
  height: 0.75rem;
  padding: 0.75rem;
  width: 0.75rem;
  margin-left: 0.25rem;

  & svg {
    height: 0.75rem;
    width: 0.75rem;
  }
`;

type GrayCardProps = {
  id: string;
  title?: string;
  subtitle?: string;
  value?: string;
  valueTooltip?: string;
  currency?: 'xDAI' | 'xHOPR' | 'wxHOPR' | string;
  chip?: {
    label: string;
    color: 'success' | 'error' | 'primary';
  };
  buttons?: {
    text: string;
    link: string;
    disabled?: boolean;
  }[];
  children?: ReactNode;
};

const GrayCard = ({
  id,
  title,
  subtitle,
  value,
  valueTooltip,
  currency,
  chip,
  buttons,
  children,
}: GrayCardProps) => {
  return (
    <StyledGrayCard id={id}>
      {(title || value) && (
        <CardContent>
          {title && <h4 className='title'>{title}</h4>}
          {subtitle && <h5 className='subtitle'>{subtitle}</h5>}
          {value && (
            valueTooltip ?
              <Tooltip
                title={valueTooltip}
              >
                <ValueAndCurrency>
                  <CardValue>{value}</CardValue>
                  {currency && <CardCurrency>{currency}</CardCurrency>}
                </ValueAndCurrency>
              </Tooltip>
              :
              <ValueAndCurrency>
                <CardValue>{value}</CardValue>
                {currency && <CardCurrency>{currency}</CardCurrency>}
              </ValueAndCurrency>
          )}
        </CardContent>
      )}
      {chip && (
        <StyledChip
          label={chip.label}
          color={chip.color}
        />
      )}
      {buttons && (
        <ButtonGroup>
          {buttons.map((button) => (
            <Button
              key={button.text}
              disabled={button.disabled}
              nofade
            >
              <Link to={button.link}>{button.text}</Link>
            </Button>
          ))}
        </ButtonGroup>
      )}
      {children}
    </StyledGrayCard>
  );
};

const header = [
  {
    key: 'peerId',
    name: 'Node Address',
    search: true,
  },
  {
    key: 'onboarding',
    name: 'Onboarding',
    search: true,
    maxWidth: '160px',
    tooltipHeader: 'Has this node been successfully onboarded. Hover over icons to see specific statuses.',
  },
  {
    key: 'version',
    name: 'Version',
    search: true,
    maxWidth: '160px',
    tooltipHeader: 'Last version seen by the Network Dashboard',
  },
  {
    key: 'lastSeen',
    name: 'Last seen',
    search: true,
    maxWidth: '160px',
    tooltipHeader: 'Last time the node was seen by the Network Dashboard',
  },
  {
    key: 'avability30d',
    name: '30d avail.',
    search: true,
    maxWidth: '160px',
    tooltipHeader: 'The percentage of pings received by this node in the last 30 days seen by the Network Dashboard',
  },
  {
    key: 'balance',
    name: 'Balance',
    search: true,
    maxWidth: '160px',
  },
  {
    key: 'search',
    name: '',
    search: true,
    hidden: true
  },
  {
    key: 'actions',
    name: 'Actions',
    search: false,
    width: '168px',
    maxWidth: '168px',
  },
];

const getOnboardingTooltip = (
  onboardingNotFinished?: boolean,
  inNetworkRegistry?: boolean,
  isDelegate?: boolean,
  includedInModule?: boolean,
  balanceFormatted?: string,
  finishMainOnboardingForThisNode?: boolean,
) => {
  if (finishMainOnboardingForThisNode) {
    return (
      <span>
        Finish ONBOARDING for this node first
      </span>
    )
  } else if (onboardingNotFinished) {
    return (
      <span>
        Please finish the main<br /> ONBOARDING first
      </span>
    )
  } else if (!inNetworkRegistry) {
    return (
      <span>
        Node not registered on the network
      </span>
    )
  }
  else if (includedInModule && isDelegate && balanceFormatted === '0') {
    return (
      <span>
        You need to fund this node
      </span>
    )
  } else if (!includedInModule || !isDelegate) {
    return (
      <span>
        Finish ONBOARDING for this node
      </span>
    )
  } else {
    return (
      <span>
        Onboarding is DONE for this node
      </span>
    )
  }
}

const NodeAdded = () => {
  const navigate = useNavigate();
  const nodeHoprAddress = useAppSelector((store) => store.stakingHub.onboarding.nodeAddress);
  const onboardingNotFinished = useAppSelector((store) => store.stakingHub.onboarding.notFinished);
  const onboardingNodeAddress = useAppSelector((store) => store.stakingHub.onboarding.nodeAddress);
  const nodes = useAppSelector((store) => store.stakingHub.nodes.data);
  const delegates = useAppSelector((store) => store.safe.delegates.data);

  const delegatesArray = delegates?.results?.map(elem => elem.delegate.toLowerCase()) || [];
  const nodesPeerIdArr = Object.keys(nodes);

  const parsedTableData = nodesPeerIdArr.map((node, index) => {
    const nodeValidated = getAddress(node);
    const inNetworkRegistry = nodes[node]?.registeredNodesInNetworkRegistry;
    const inSafeRegistry = nodes[node]?.registeredNodesInSafeRegistry
    const isDelegate = delegatesArray.includes(node);
    const includedInModule = nodes[node]?.includedInModule;
    const lastSeen = nodes[node]?.lastseen;
    const version = nodes[node]?.version;
    const availability30d = nodes[node]?.availability30d;

    const finishMainOnboardingForThisNode = onboardingNotFinished && onboardingNodeAddress?.toLowerCase() === node?.toLowerCase();

    return {
      peerId: <>
        {nodeValidated}
        <SquaredIconButton
          onClick={() => nodeHoprAddress && navigator.clipboard.writeText(node)}
        >
          <CopyIcon />
        </SquaredIconButton>
        <Link to={`https://gnosisscan.io/address/${node}`} target='_blank'>
          <SquaredIconButton>
            <LaunchIcon />
          </SquaredIconButton>
        </Link>
      </>,
      onboarding:
        <>
          <Tooltip
            title={`Has this node been successfully added to the HOPR Network Registry?`}
          >
            {inNetworkRegistry ?

              <CheckCircleRoundedIcon />
              : <CancelRoundedIcon />}
          </Tooltip>
          <Tooltip
            title={`Is this node a delegate? (allowed to propose transactions to the safe owner)`}
          >
            {isDelegate ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}
          </Tooltip>
          <Tooltip
            title={`Is this node included & configured in the Node Management Module?`}
          >
            {includedInModule ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}
          </Tooltip>
          <Tooltip
            title={<span>Has this node been successfully added to the Safe Registry?<br />That will be done by the node after it starts and syncs.</span>}
          >
            {inSafeRegistry ? <CheckCircleRoundedIcon /> : <CancelRoundedIcon />}
          </Tooltip>
        </>,
      inNetworkRegistry: inNetworkRegistry ? 'Yes' : 'No',
      lastSeen:
        <>
          {
            lastSeen ?
              lastSeen > Date.now() - 5 * 60 * 1000 ? (
                <span className="online">Online</span>
              )
              :
              (
                formatDate(lastSeen)
              )
              :
              '-'}
        </>,
      avability30d: <ProgressBar value={availability30d} />,
      version: version || '-',
      id: node,
      balance: <Tooltip
        title={nodes[node]?.balanceFormatted}
      >
        <span>{nodes[node]?.balanceFormatted ? `${rounder(nodes[node]?.balanceFormatted)} xDAI` : '-'}</span>
      </Tooltip>,
      search: node,
      actions: <>
        <IconButton
          iconComponent={<TrainIcon />}
          tooltipText={getOnboardingTooltip(
            onboardingNotFinished,
            inNetworkRegistry,
            isDelegate,
            includedInModule,
            nodes[node]?.balanceFormatted,
            finishMainOnboardingForThisNode,
          )}
          onClick={() => {
            if (finishMainOnboardingForThisNode) { navigate(`/staking/onboarding/`) }
            else { navigate(`/staking/onboarding/nextNode?nodeAddress=${node}`); }
          }}
          disabled={(onboardingNotFinished || (includedInModule && isDelegate && nodes[node]?.balanceFormatted !== '0')) && !finishMainOnboardingForThisNode}
        />
        <IconButton
          iconComponent={<WalletIcon />}
          tooltipText={
            <span>
              FUND node
            </span>
          }
          onClick={() => {
            navigate(`/staking/fund-node?nodeAddress=${node}`);
          }}
        />
      </>
    }
  }).filter(node => node.inNetworkRegistry === 'Yes') || [];

  return (
    <Container>
      <Grid>
        {/* <GrayCard
          id="earned-rewards"
          title="Earned rewards"
          value="-"
          currency="wxHOPR"
        /> */}
        <GrayCard
          id="docker-command"
          title="Docker run command"
          subtitle="The command needed to start a Node on your machine of choice such as PC or VPS"
        >
          <DockerRunCommandModal
            normalButton
          />
        </GrayCard>
        <GrayCard
          id="add-new-node"
          title="Add new Node"
          subtitle="Node will be added to the waitlist and once its is accepted, it will show up below"
        >
          <Button
            title='add'
            href={`https://cryptpad.fr/form/#/2/form/view/7TwSgsF+CnW-aw24uyPlE4Gej3DX-jjeYmyk9-Q-6RQ/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Add new Node
          </Button>
        </GrayCard>
      </Grid>
      <br />
      <TablePro
        data={parsedTableData}
        id={'nodes-in-safe-table'}
        search={true}
        header={header}
      />
    </Container>
  );
};

export default NodeAdded;
