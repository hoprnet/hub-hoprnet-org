import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { environment } from '../../../config';
import { useWatcher } from '../../hooks';
import { loadStateFromLocalStorage, saveStateToLocalStorage } from '../../utils/localStorage';
import { Tooltip } from '@mui/material';

// Store
import { useAppDispatch, useAppSelector } from '../../store';
import { safeActions, safeActionsAsync } from '../../store/slices/safe';
import { stakingHubActions, stakingHubActionsAsync } from '../../store/slices/stakingHub';

import { Button, Menu, MenuItem } from '@mui/material';
import { observePendingSafeTransactions } from '../../hooks/useWatcher/safeTransactions';
import { observeSafeInfo } from '../../hooks/useWatcher/safeInfo';
import { appActions } from '../../store/slices/app';
import { truncateEthereumAddress } from '../../utils/blockchain';

//web3
import { browserClient } from '../../providers/wagmi';
import { useEthersSigner } from '../../hooks';
import { getAddress } from 'viem';

const AppBarContainer = styled(Button)`
  align-items: center;
  border-right: 1px lightgray solid;
  display: none;
  align-items: center;
  height: 59px;
  cursor: pointer;
  justify-content: center;
  width: 250px;
  gap: 10px;
  border-radius: 0;
  &.display {
    display: flex;
  }
  .image-container {
    height: 50px;
    width: 50px;
    img {
      height: 100%;
      width: 100%;
    }
  }
  &.safe-not-connected {
    img {
      filter: opacity(0.5);
    }
  }
`;

const DropdownArrow = styled.img`
  align-self: center;
`;

const DisabledButton = styled.div`
  width: 170px;
  color: #969696;
`;

const SafeAddressContainer = styled.div`
  font-family: 'Source Code Pro';
  width: 170px;
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  color: #414141;
  text-transform: none;
  .typed {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    p {
      margin-block-start: 0;
      margin-block-end: 0;
      margin-inline-start: 0;
      margin-inline-end: 0;
    }
    .subtext {
      color: #808080;
      line-height: 12px;
      font-size: 12px;
    }
    .address {
      color: #414141;
      font-size: 14px;
      pointer-events: all;
    }
  }
`;

function handleSaveSelectedSafeInLocalStorage(safeObject: { safeAddress?: string | null, moduleAddress?: string | null }, owner?: string | null) {
  const safeAddress = safeObject.safeAddress;
  const moduleAddress = safeObject.moduleAddress;
  if (safeAddress && moduleAddress && owner) {
    let json = loadStateFromLocalStorage(`staking-hub-chosen-safe`);
    if (json) {
      // @ts-ignore
      json[owner] = safeObject;
    } else {
      json = { [owner]: safeObject }
    }
    saveStateToLocalStorage(`staking-hub-chosen-safe`, json)
  }
}

export default function ConnectSafe() {
  useWatcher({});
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const signer = useEthersSigner();
  const isConnected = useAppSelector((store) => store.web3.status.connected);
  const ownerAddress = useAppSelector((store) => store.web3.account);
  const safes = useAppSelector((store) => store.stakingHub.safes.data);
  const safeIndexed = useAppSelector((store) => store.safe.info.safeIndexed);
  const selectedSafe = useAppSelector((store) => store.safe.selectedSafe.data);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // State variable to hold the anchor element for the menu
  const prevPendingSafeTransaction = useAppSelector((store) => store.app.previousStates.prevPendingSafeTransaction);
  const activePendingSafeTransaction = useAppSelector(
    (store) => store.app.configuration.notifications.pendingSafeTransaction
  );

  const safeFromUrl = searchParams.get('safe');
  const moduleFromUrl = searchParams.get('module');
  const safeAddress = selectedSafe.safeAddress;

  const menuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Event listener callback to close the menu
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleCloseMenu();
      }
    };

    // Attach the event listener to the document
    document.addEventListener('click', handleOutsideClick);

    // Cleanup the event listener when the component is unmounted
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // If no selected safeAddress, choose 1st one
  useEffect(() => {
    console.log({ safeFromUrl, moduleFromUrl })
    if (safeFromUrl && moduleFromUrl && !safeAddress) {
      console.log('useSelectedSafe from url', safeFromUrl, moduleFromUrl)
      useSelectedSafe({
        safeAddress: getAddress(safeFromUrl),
        moduleAddress: getAddress(moduleFromUrl)
      });
    }
    else if (safes.length > 0 && !safeAddress && signer && ownerAddress) {
      try {
        //@ts-ignore
        let localStorage: { [key: string]: { safeAddress: string, moduleAddress: string } } = loadStateFromLocalStorage(`staking-hub-chosen-safe`);
        if (localStorage && localStorage[ownerAddress] && safes.filter(safe => safe?.safeAddress === localStorage[ownerAddress]?.safeAddress).length > 0) {
          useSelectedSafe(localStorage[ownerAddress]);
          console.log('useSelectedSafe from ls', localStorage[ownerAddress])
        } else {
          useSelectedSafe(safes[0]);
          console.log('useSelectedSafe [0]', safes[0])
        }
      } catch (e) { }
    }
  }, [safes, safeAddress, signer, ownerAddress, safeFromUrl, moduleFromUrl]);

  // If safe got selected, update all and onboarding data
  useEffect(() => {
    if (selectedSafe && browserClient && selectedSafe.safeAddress) {
      dispatch(
        stakingHubActionsAsync.getOnboardingDataThunk({
          browserClient,
          safeAddress: selectedSafe.safeAddress as string,
          moduleAddress: selectedSafe.moduleAddress as string,
        })
      );
    }
  }, [selectedSafe, browserClient]);

  const useSelectedSafe = async (safeObject: { safeAddress?: string | null, moduleAddress?: string | null }) => {
    if (!safeObject.safeAddress || !safeObject.moduleAddress) return;
    console.log('useSelectedSafe in', safeObject, signer)
    const safeAddress = safeObject.safeAddress;
    const moduleAddress = safeObject.moduleAddress;
    if (signer) {
      dispatch(appActions.resetState());
      dispatch(safeActions.resetStateWithoutSelectedSafe());
      dispatch(stakingHubActions.resetStateWithoutSafeList());
      handleSaveSelectedSafeInLocalStorage(safeObject, ownerAddress);
      dispatch(safeActions.setSelectedSafe({
        safeAddress,
        moduleAddress
      }));
      observePendingSafeTransactions({
        dispatch,
        active: activePendingSafeTransaction,
        previousState: prevPendingSafeTransaction,
        selectedSafeAddress: safeAddress,
        signer,
        updatePreviousData: (newData) => {
          dispatch(appActions.setPrevPendingSafeTransaction(newData));
        },
      });
      dispatch(
        safeActionsAsync.getSafesByOwnerThunk({
          signer: signer,
        })
      );
      dispatch(
        safeActionsAsync.getSafeInfoThunk({
          signer: signer,
          safeAddress,
        })
      );
      dispatch(
        safeActionsAsync.getAllSafeTransactionsThunk({
          signer,
          safeAddress,
        })
      );
      dispatch(
        safeActionsAsync.getSafeDelegatesThunk({
          signer,
          options: { safeAddress },
        })
      );
      // dispatch(
      //   safeActionsAsync.getGnoAidropThunk(safeAddress)
      // );
    }
  };


  // New function to handle opening the menu
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // New function to handle closing the menu
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSafeButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isConnected && safes.length > 0) {
      handleOpenMenu(event);
    }
  };

  const multipleSafes = safes.length > 1;

  return (
    <AppBarContainer
      onClick={handleSafeButtonClick}
      ref={menuRef}
      disabled={!isConnected || !multipleSafes}
      className={`safe-connect-btn ${safeAddress ? 'safe-connected' : 'safe-not-connected'} ${ safeAddress ? 'display' : ''}`}
    >
      <div className="image-container">
        <img
          src="/assets/safe-icon.svg"
          alt="Safe Icon"
        />
      </div>
      <SafeAddressContainer>
          <span className="typed">
            <p className="subtext">
              Safe address:
            </p>
            <p className="address">
              <Tooltip
                title={safeAddress}
              >
                <span>{truncateEthereumAddress(safeAddress || '...') || '...'}</span>
              </Tooltip>
            </p>
          </span>
          { multipleSafes && <DropdownArrow src="/assets/dropdown-arrow.svg" />}
      </SafeAddressContainer>
      {
        multipleSafes &&
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          MenuListProps={{
            'aria-labelledby': 'safe-menu-button',
            className: 'safe-menu-list',
          }}
          disableScrollLock={true}
        >
          {safes.map((safe, index) => (
            <MenuItem
              key={`${safe.safeAddress}_${index}`}
              className={`${safe.safeAddress === safeAddress ? 'selected-safe' : ''}`}
              value={safe.safeAddress}
              onClick={() => {
                useSelectedSafe(safe);
              }}
            >
              0x{`${safe.safeAddress.substring(2, 6)}...${safe.safeAddress.substring(
                safe.safeAddress.length - 8,
                safe.safeAddress.length
              )}`.toUpperCase()}
            </MenuItem>
          ))}
        </Menu>
      }
    </AppBarContainer>
  );
}
