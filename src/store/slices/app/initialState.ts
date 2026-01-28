import type { SafeMultisigTransactionResponse } from '@safe-global/types-kit';
import { loadStateFromLocalStorage } from '../../../utils/localStorage';

type InitialState = {
  notifications: {
    id: string;
    name: string;
    source: string;
    seen: boolean;
    interacted: boolean;
    timeout: number;
    url: string | null;
  }[];
  configuration: {
    notifications: {
      channels: boolean;
      nodeInfo: boolean;
      nodeBalances: boolean;
      message: boolean;
      pendingSafeTransaction: boolean;
    };
  };
  previousStates: {
    prevPendingSafeTransaction: SafeMultisigTransactionResponse | null;
  };
};

export const initialState: InitialState = {
  notifications: [],
  configuration: {
    notifications: (loadStateFromLocalStorage(
      'app/configuration/notifications'
    ) as InitialState['configuration']['notifications']) ?? {
      channels: true,
      message: true,
      nodeBalances: true,
      nodeInfo: true,
      pendingSafeTransaction: true,
    },
  },
  // previous states used to compare for notifications
  previousStates: {
    prevPendingSafeTransaction: null,
  },
};
