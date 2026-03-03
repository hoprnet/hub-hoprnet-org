import { createSlice } from '@reduxjs/toolkit';
import { initialState } from './initialState';
import { actionsAsync, createAsyncReducer } from './actionsAsync';

const stakingHubSlice = createSlice({
  name: 'stakingHub',
  initialState,
  reducers: {
    resetState: () => initialState,
    resetStateWithoutMagicLinkForOnboarding: (state) => {
      const nodeAddressProvidedByMagicLink = state.onboarding.nodeAddressProvidedByMagicLink;
      const initialStateCopy = JSON.parse(JSON.stringify(initialState));
      if (nodeAddressProvidedByMagicLink)
        state.onboarding.nodeAddressProvidedByMagicLink = nodeAddressProvidedByMagicLink;
      return initialStateCopy;
    },
    resetStateWithoutSafeList: (state) => {
      const safes = JSON.parse(JSON.stringify(state.safes.data));
      const initialStateCopy = JSON.parse(JSON.stringify(initialState));
      initialStateCopy.safes.data = safes;
      return initialStateCopy;
    },
    resetOnboardingState: (state) => {
      state.onboarding = {
        step: 0,
        nodeAddress: null,
        nodeAddressProvidedByMagicLink: null,
        safeAddress: null,
        moduleAddress: null,
        userIsInOnboarding: false,
        nodeXDaiBalance: null,
        modalToSartOnboardingDismissed: false,
        nodeBalance: {
          xDai: {
            value: null,
            formatted: null,
          },
        },
        status: 'NOT_FETCHED',
        isFetching: false,
      };
    },
    dismissModalToSartOnboarding: (state) => {
      state.onboarding.modalToSartOnboardingDismissed = true;
    },
    onboardingIsFetching: (state, action) => {
      state.onboarding.isFetching = action.payload;
    },
    addSafe: (state, action) => {
      state.safes.data = [...state.safes.data, action.payload];
    },
    addSafeAndUseItForOnboarding: (state, action) => {
      state.safes.data = [...state.safes.data, action.payload];
      state.onboarding.safeAddress = action.payload.safeAddress;
      state.onboarding.moduleAddress = action.payload.moduleAddress;
    },
    useSafeForOnboarding: (state, action) => {
      state.onboarding.safeAddress = action.payload.safeAddress;
      state.onboarding.moduleAddress = action.payload.moduleAddress;
      if (action.payload.nodeXDaiBalance) state.onboarding.nodeXDaiBalance = action.payload.nodeXDaiBalance;
    },
    setNodeAddressProvidedByMagicLink: (state, action) => {
      state.onboarding.nodeAddressProvidedByMagicLink = action.payload;
    },
    setOnboardingNodeAddress: (state, action) => {
      state.onboarding.nodeAddress = action.payload;
    },
    setOnboardingStep: (state, action) => {
      state.onboarding.step = action.payload;
      if (action.payload === 16) {
        state.onboarding.status = 'COMPLETED';
      } else if (action.payload > 1) {
        state.onboarding.status = 'IN_PROGRESS';
      }
    },
    setNodeLinkedToSafeBalance_xDai: (state, action) => {
      state.onboarding.nodeBalance.xDai.value = action.payload ? action.payload.value : null;
      state.onboarding.nodeBalance.xDai.formatted = action.payload ? action.payload.formatted : null;
    },
    setConfigUpdated: (state) => {
      state.config.needsUpdate.data = false;
      state.config.needsUpdate.strategy = null;
    },
    setNextOnboarding: (
      state,
      action: {
        payload: {
          nodeAddress: string;
          key: 'includedInModule' | 'registeredNodesInNetworkRegistry';
          value: boolean;
        };
      }
    ) => {
      if (typeof action?.payload?.nodeAddress === 'string' && typeof action?.payload?.value === 'boolean') {
        const nodeAddress = action.payload.nodeAddress.toLocaleLowerCase();
        if (state.nodes.data[nodeAddress]) {
          state.nodes.data[nodeAddress][action.payload.key] = action.payload.value;
        }
      }
    },
    updateThreshold: (state, action) => {
      state.safeInfo.data.threshold = `${action.payload}`;
      const safeAddress = state.safeInfo.data.id;
      if (safeAddress) {
        try {
          localStorage.setItem(`${safeAddress.toLowerCase()}_threshold_updated`, JSON.stringify({
            threshold: action.payload,
            updated: Date.now(),
          }));
        } catch (error) {
          console.error('Error saving threshold update to localStorage:', error);
        }
      }
    },
    updateAllowance: (state, action) => {
      state.safeInfo.data.allowance.wxHoprAllowance = `${action.payload}`;
      const safeAddress = state.safeInfo.data.id;
      if (safeAddress) {
        try {
          localStorage.setItem(`${safeAddress.toLowerCase()}_allowance_updated`, JSON.stringify({
            allowance: `${action.payload}`,
            updated: Date.now(),
          }));
        } catch (error) {
          console.error('Error saving allowance update to localStorage:', error);
        }
      }
    },
    addOwnerToSafe: (state, action) => {
      const exists = state.safeInfo.data.owners.some(
        (elem) => elem.owner.id?.toLowerCase() === `${action.payload}`.toLowerCase()
      );
      const newOwners = exists
        ? state.safeInfo.data.owners
        : [...state.safeInfo.data.owners, { owner: { id: action.payload } }];
      state.safeInfo.data.owners = newOwners;
      const safeAddress = state.safeInfo.data.id;
      if (safeAddress) {
        try {
          localStorage.setItem(`${safeAddress.toLowerCase()}_owners_updated`, JSON.stringify({
            owners: newOwners,
            updated: Date.now(),
          }));
        } catch (error) {
          console.error('Error saving owners update to localStorage:', error);
        }
      }
    },
    removeOwnerFromSafe: (state, action) => {
      const newOwners = state.safeInfo.data.owners.filter((elem) => elem.owner.id?.toLowerCase() !== action.payload.toLowerCase());
      state.safeInfo.data.owners = newOwners;
      const safeAddress = state.safeInfo.data.id;
      if (safeAddress) {
        try {
          localStorage.setItem(`${safeAddress.toLowerCase()}_owners_updated`, JSON.stringify({
            owners: newOwners,
            updated: Date.now(),
          }));
        } catch (error) {
          console.error('Error saving owners update to localStorage:', error);
        }
      }
    }
  },
  extraReducers: (builder) => {
    createAsyncReducer(builder);
  },
});

export const stakingHubActions = stakingHubSlice.actions;
export const stakingHubActionsAsync = actionsAsync;
export default stakingHubSlice.reducer;
