import { useEffect } from 'react';
import { parseEther } from 'viem';
import { useEthersSigner } from '..';
import { useAppDispatch, useAppSelector } from '../../store';
import { appActions } from '../../store/slices/app';
import { observePendingSafeTransactions } from './safeTransactions';
import { observeSafeInfo } from './safeInfo';

export const useWatcher = ({ intervalDuration = 60_000 }: { intervalDuration?: number }) => {
  const dispatch = useAppDispatch();
  const { apiEndpoint, apiToken } = useAppSelector((store) => store.auth.loginData);
  const connected = useAppSelector((store) => store.auth.status.connected);

  const signer = useEthersSigner();
  // flags to activate notifications
  const activePendingSafeTransaction = useAppSelector(
    (store) => store.app.configuration.notifications.pendingSafeTransaction
  );
  // redux previous states, this can be updated from anywhere in the app
  const prevPendingSafeTransaction = useAppSelector((store) => store.app.previousStates.prevPendingSafeTransaction);

  // ==================================================================================
  // safe watchers
  const safeIndexed = useAppSelector((store) => store.safe.info.safeIndexed);
  const selectedSafeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);

  useEffect(() => {
    const watchPendingSafeTransactionsInterval = setInterval(() => {
      observePendingSafeTransactions({
        dispatch,
        previousState: prevPendingSafeTransaction,
        selectedSafeAddress,
        active: activePendingSafeTransaction,
        signer: signer,
        updatePreviousData: (newSafeTransactions) => {
          dispatch(appActions.setPrevPendingSafeTransaction(newSafeTransactions));
        },
      });
    }, intervalDuration);

    const watchSafeInfoInterval = setInterval(() => {
      observeSafeInfo({
        dispatch,
        selectedSafeAddress,
        safeIndexed,
        active: true,
        signer,
      });
    }, intervalDuration);

    return () => {
      clearInterval(watchPendingSafeTransactionsInterval);
      clearInterval(watchSafeInfoInterval);
    };
  }, [selectedSafeAddress, signer, prevPendingSafeTransaction, safeIndexed]);
};
