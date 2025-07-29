import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { useWalletClient } from 'wagmi';

// Store
import { useAppDispatch, useAppSelector } from '../../../store';
import { safeActions, safeActionsAsync } from '../../../store/slices/safe';
import { stakingHubActions, stakingHubActionsAsync } from '../../../store/slices/stakingHub';

// HOPR Components
import NetworkOverlay from '../../../components/Overlays/NetworkOverlay';
import StartOnboarding from '../../../components/Modal/staking-hub/StartOnboarding';

// Mui
import Paper from '@mui/material/Paper/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

// Tabs
import StakingScreen from './staking';
import SafeActions from './transactions';
import SafeDashboard from './safe';
import NoNodeAdded from './noNodeAdded';
import NodeAdded from './node';

import { browserClient } from '../../../providers/wagmi';

export const DASHBOARD = {
  staking: 0,
  node: 1,
  safe: 2,
  transactions: 3,
} as { [key: string]: number };

const getTabIndexFromUrl = () => {
  let currentHash = window.location.hash.replace('#', '');
  if (currentHash == '') currentHash = 'staking';
  switch (currentHash) {
    case 'node':
      return DASHBOARD.node;
    case 'safe':
      return DASHBOARD.safe;
    case 'transactions':
      return DASHBOARD.transactions;
    default:
      window.location.hash = `#${currentHash}`;
      return DASHBOARD.staking;
  }
};

const getTabName = (index: number) => {
  const tmp = Object.keys(DASHBOARD).filter((key) => DASHBOARD[key] === index);
  return tmp[0];
};

const DashboardContainer = styled.div`
  display: flex;
  justify-content: space-between;
  /* align-items: center; */
  gap: 24px;
  min-height: calc(100vh - 124px);
  padding: 32px;

  overflow: hidden;
  background: #edfbff;

  transition: width 0.4s ease-out;
`;

const SPaper = styled(Paper)`
  width: 100%;
  min-height: calc(100vh - 124px - 64px);
  overflow: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  background-color: white;
  .Content {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
`;

const STabs = styled(Tabs)`
  .MuiTabs-flexContainer {
    flex-wrap: wrap;
  }
`;

function Dashboard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [tabIndex, set_tabIndex] = useState(getTabIndexFromUrl());
  const safeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress) as string;
  const moduleAddress = useAppSelector((store) => store.safe.selectedSafe.data.moduleAddress);

  useEffect(() => {
    if (safeAddress && moduleAddress && browserClient) {
      dispatch(
        stakingHubActionsAsync.getSubgraphDataThunk({
          safeAddress,
          moduleAddress,
          browserClient,
        })
      );
    }
  }, []);

  const handleTabChange = (event: React.SyntheticEvent<Element, Event>, newTabIndex: number) => {
    set_tabIndex(newTabIndex);
    handleHash(newTabIndex);
  };

  const handleHash = (newTabIndex: number) => {
    const newHash = getTabName(newTabIndex);
    navigate(`#${newHash}`, { replace: true });
  };

  function a11yProps(index: number) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  return (
    <DashboardContainer className="DashboardContainer">
      <SPaper>
        <STabs
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="basic tabs example"
        >
          <Tab
            label="STAKING"
            {...a11yProps(0)}
          />
          <Tab
            label="NODES"
            {...a11yProps(1)}
          />
          <Tab
            label="SAFE"
            {...a11yProps(2)}
          />
          <Tab
            label="TRANSACTIONS"
            {...a11yProps(3)}
          />
        </STabs>
        <div className="Content">
          {tabIndex === DASHBOARD.staking && <StakingScreen />}
          {tabIndex === DASHBOARD.node && <NodeAdded />}
          {tabIndex === DASHBOARD.safe && <SafeDashboard />}
          {tabIndex === DASHBOARD.transactions && <SafeActions />}
        </div>
      </SPaper>

      <NetworkOverlay />
      <StartOnboarding />
    </DashboardContainer>
  );
}

export default Dashboard;
