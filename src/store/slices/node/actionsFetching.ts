import { ActionReducerMapBuilder, createAction } from '@reduxjs/toolkit';
import { initialState } from './initialState';

// Helper action to update the isFetching state
const setAliasesFetching = createAction<boolean>('node/setAliasesFetching');
const setInfoFetching = createAction<boolean>('node/setInfoFetching');
const setMetricsFetching = createAction<boolean>('node/setMetricsFetching');
const setAddressesFetching = createAction<boolean>('node/setAddressesFetching');
const setBalancesFetching = createAction<boolean>('node/setBalancesFetching');
const setChannelsFetching = createAction<boolean>('node/setChannelsFetching');
const setPeersFetching = createAction<boolean>('node/setPeersFetching');
const setPeerInfoFetching = createAction<boolean>('node/setPeerInfoFetching');
const setEntryNodesFetching = createAction<boolean>('node/setEntryNodesFetching');
const setSettingsFetching = createAction<boolean>('node/setSettingsFetching');
const setTicketStatisticsFetching = createAction<boolean>('node/setTicketStatisticsFetching');
const setTicketsFetching = createAction<boolean>('node/setTicketsFetching');
const setTokensFetching = createAction<boolean>('node/setTokensFetching');
const setVersionFetching = createAction<boolean>('node/setVersionFetching');
const setTransactionsFetching = createAction<boolean>('node/setTransactionsFetching');
const setRedeemTicketsFetching = createAction<boolean>('node/setRedeemTicketsFetching');

export const nodeActionsFetching = {
  setAliasesFetching,
  setInfoFetching,
  setMetricsFetching,
  setAddressesFetching,
  setBalancesFetching,
  setChannelsFetching,
  setPeerInfoFetching,
  setPeersFetching,
  setEntryNodesFetching,
  setSettingsFetching,
  setTicketStatisticsFetching,
  setTicketsFetching,
  setTokensFetching,
  setVersionFetching,
  setTransactionsFetching,
  setRedeemTicketsFetching,
};

export const createFetchingReducer = (builder: ActionReducerMapBuilder<typeof initialState>) => {
  // Action to update the isFetching state
  builder.addCase(setAliasesFetching, (state, action) => {
    state.aliases.isFetching = action.payload;
  }),
    builder.addCase(setInfoFetching, (state, action) => {
      state.info.isFetching = action.payload;
    }),
    builder.addCase(setMetricsFetching, (state, action) => {
      state.metrics.isFetching = action.payload;
    }),
    builder.addCase(setAddressesFetching, (state, action) => {
      state.addresses.isFetching = action.payload;
    }),
    builder.addCase(setBalancesFetching, (state, action) => {
      state.balances.isFetching = action.payload;
    }),
    builder.addCase(setChannelsFetching, (state, action) => {
      state.channels.isFetching = action.payload;
    }),
    builder.addCase(setPeersFetching, (state, action) => {
      state.peers.isFetching = action.payload;
    }),
    builder.addCase(setPeerInfoFetching, (state, action) => {
      state.peerInfo.isFetching = action.payload;
    }),
    builder.addCase(setEntryNodesFetching, (state, action) => {
      state.entryNodes.isFetching = action.payload;
    }),
    builder.addCase(setTicketStatisticsFetching, (state, action) => {
      state.statistics.isFetching = action.payload;
    }),
    builder.addCase(setTokensFetching, (state, action) => {
      state.tokens.isFetching = action.payload;
    }),
    builder.addCase(setVersionFetching, (state, action) => {
      state.version.isFetching = action.payload;
    }),
    builder.addCase(setTransactionsFetching, (state, action) => {
      state.transactions.isFetching = action.payload;
    }),
    builder.addCase(setRedeemTicketsFetching, (state, action) => {
      state.redeemTickets.isFetching = action.payload;
    });
};
