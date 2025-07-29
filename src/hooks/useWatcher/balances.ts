import { GetBalancesResponseType } from '@hoprnet/hopr-sdk';
import { useAppDispatch } from '../../store';
import { observeData } from './observeData';
import { nodeActionsAsync } from '../../store/slices/node';
import { sendNotification } from './notifications';
import { formatEther } from 'viem';

/**
 * Checks if the new balance is greater than the previous balance.
 *
 * @param prevBalance The previous balance as a string.
 * @param newBalance The new balance as a string.
 * @returns A boolean indicating whether the new balance is greater than the previous balance.
 */
export const balanceHasIncreased = (prevBalance: string, newBalance: string) =>
  BigInt(prevBalance) < BigInt(newBalance);

/**
 * Handles balance notifications.
 *
 * @param newNodeBalances The new node balances of type GetBalancesResponseType.
 * @param prevNodeBalances The previous node balances of type GetBalancesResponseType, or null.
 * @param sendNewNativeBalanceNotification A function that handles new native balance notifications.
 * @param sendNewHoprBalanceNotification A function that handles new HOPR balance notifications.
 */
export const handleBalanceNotification = ({
  newNodeBalances,
  prevNodeBalances,
  minimumNodeBalances,
  sendNewNativeBalanceNotification,
  sendNativeBalanceTooLowNotification,
  sendNewNativeSafeBalanceNotification,
  sendNewHoprSafeBalanceNotification,
}: {
  prevNodeBalances: GetBalancesResponseType | null;
  newNodeBalances: GetBalancesResponseType;
  minimumNodeBalances: GetBalancesResponseType;
  sendNewNativeBalanceNotification: (nativeBalanceDifference: bigint) => void;
  sendNativeBalanceTooLowNotification: (newNativeBalance: bigint) => void;
  sendNewNativeSafeBalanceNotification: (nativeSafeBalanceDifference: bigint) => void;
  sendNewHoprSafeBalanceNotification: (hoprSafeBalanceDifference: bigint) => void;
}) => {
  if (BigInt(newNodeBalances.native) < BigInt(minimumNodeBalances.native)) {
    return sendNativeBalanceTooLowNotification(BigInt(newNodeBalances.native));
  }

  if (!prevNodeBalances) return;
  const nativeBalanceIsLarger = balanceHasIncreased(prevNodeBalances.native, newNodeBalances.native);
  if (nativeBalanceIsLarger) {
    const nativeBalanceDifference = BigInt(newNodeBalances.native) - BigInt(prevNodeBalances.native);
    sendNewNativeBalanceNotification(nativeBalanceDifference);
  }
  const nativeSafeBalanceIsLarger = balanceHasIncreased(prevNodeBalances.safeNative, newNodeBalances.safeNative);
  if (nativeSafeBalanceIsLarger) {
    const nativeSafeBalanceDifference = BigInt(newNodeBalances.safeNative) - BigInt(prevNodeBalances.safeNative);
    sendNewNativeSafeBalanceNotification(nativeSafeBalanceDifference);
  }

  const hoprSafeBalanceIsLarger = balanceHasIncreased(prevNodeBalances.safeHopr, newNodeBalances.safeHopr);
  if (hoprSafeBalanceIsLarger) {
    const hoprSafeBalanceDifference = BigInt(newNodeBalances.safeHopr) - BigInt(prevNodeBalances.safeHopr);
    sendNewHoprSafeBalanceNotification(hoprSafeBalanceDifference);
  }
};

/**
 * Observes node balances and handles notifications when changes are detected.
 *
 * @param previousState The previous state of type GetBalancesResponseType, or null.
 * @param apiToken The API token as a string, or null.
 * @param apiEndpoint The API endpoint as a string, or null.
 * @param updatePreviousData A function that updates the previous data with the current data.
 * @param dispatch The dispatch function returned by the useAppDispatch hook.
 */
export const observeNodeBalances = ({
  previousState,
  apiEndpoint,
  apiToken,
  active,
  minimumNodeBalances,
  updatePreviousData,
  dispatch,
}: {
  previousState: GetBalancesResponseType | null;
  apiToken: string | null;
  apiEndpoint: string | null;
  active: boolean;
  minimumNodeBalances: GetBalancesResponseType;
  updatePreviousData: (currentData: GetBalancesResponseType) => void;
  dispatch: ReturnType<typeof useAppDispatch>;
}) =>
  observeData<GetBalancesResponseType | null>({
    active: active && !!apiEndpoint,
    previousData: previousState,
    fetcher: async () => {
      if (!apiEndpoint) return;

      return await dispatch(
        nodeActionsAsync.getBalancesThunk({
          apiEndpoint,
          apiToken: apiToken ? apiToken : '',
        })
      ).unwrap();
    },
    isDataDifferent: (newNodeBalances) => JSON.stringify(previousState) !== JSON.stringify(newNodeBalances),
    notificationHandler: (newNodeBalances) => {
      handleBalanceNotification({
        newNodeBalances,
        prevNodeBalances: previousState,
        minimumNodeBalances,
        sendNewNativeBalanceNotification: (nativeBalanceDifference) => {
          sendNotification({
            notificationPayload: {
              source: 'node',
              name: 'Node received xDai',
              url: null,
              timeout: null,
            },
            toastPayload: { message: `Node received ${formatEther(nativeBalanceDifference)} xDai` },
            dispatch,
          });
        },
        sendNativeBalanceTooLowNotification: (newNativeBalance) => {
          sendNotification({
            notificationPayload: {
              source: 'node',
              name: 'Your xDai level is low, HOPRd node might stop working soon. Top up xDai',
              url: null,
              timeout: null,
            },
            toastPayload: {
              message: `Node xDai level is low, node has ${formatEther(
                BigInt(newNativeBalance)
              )} and should have ${formatEther(BigInt(minimumNodeBalances.native))}`,
            },
            dispatch,
          });
        },
        sendNewHoprSafeBalanceNotification: (hoprSafeBalanceDifference) => {
          sendNotification({
            notificationPayload: {
              source: 'safe',
              name: 'Safe received wxHopr',
              url: null,
              timeout: null,
            },
            toastPayload: { message: `Safe received ${formatEther(hoprSafeBalanceDifference)} wxHopr` },
            dispatch,
          });
        },
        sendNewNativeSafeBalanceNotification: (nativeSafeBalanceDifference) => {
          sendNotification({
            notificationPayload: {
              source: 'safe',
              name: 'Safe received xDai',
              url: null,
              timeout: null,
            },
            toastPayload: { message: `Safe received ${formatEther(nativeSafeBalanceDifference)} xDai` },
            dispatch,
          });
        },
      });
    },
    updatePreviousData,
  });
