import { utils } from '@hoprnet/hopr-sdk';
import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { initialState } from '../auth/initialState';
import { nodeActions } from './index';
import readStreamEvent from '../../../utils/readStreamEvent';

const {
  messageReceived,
  initializeMessagesWebsocket,
  closeMessagesWebsocket,
  updateMessagesWebsocketStatus,
  logsReceived,
  initializeLogsWebsocket,
  closeLogsWebsocket,
  updateLogsWebsocketStatus,
} = nodeActions;

const { WebsocketHelper } = utils;

type LocalRootState = {
  auth: typeof initialState;
};

const websocketMiddleware: Middleware<object, LocalRootState> = ({
  dispatch,
  getState,
}) => {
  let messagesWebsocket: typeof WebsocketHelper.prototype | null = null;
  let logsWebsocket: typeof WebsocketHelper.prototype | null = null;

  return (next) => (action: PayloadAction) => {
    if (action.type === initializeMessagesWebsocket.type) {
      // start websocket connection
      const { apiEndpoint, apiToken } = getState().auth.loginData;
      if (apiEndpoint && apiToken) {
        try {
          messagesWebsocket = new WebsocketHelper({
            apiEndpoint,
            apiToken,
            onOpen: () => {
              dispatch(updateMessagesWebsocketStatus(true));
            },
            onClose: () => {
              dispatch(updateMessagesWebsocketStatus(false));
            },
            onMessage: (message) => {
              dispatch(
                messageReceived({
                  body: message,
                  createdAt: Date.now(),
                  seen: false,
                })
              );
            },
          });
        } catch (e) {
          console.log(e);
          dispatch(updateMessagesWebsocketStatus(false));
        }
      }
    } else if (action.type === closeMessagesWebsocket.type) {
      // close messages websocket
      messagesWebsocket?.close();
      dispatch(updateMessagesWebsocketStatus(false));
    } else if (action.type === initializeLogsWebsocket.type) {
      const { apiEndpoint, apiToken } = getState().auth.loginData;
      if (apiEndpoint && apiToken) {
        try {
          logsWebsocket = new WebsocketHelper({
            apiEndpoint,
            apiToken,
            decodeMessage: false,
            path: '/api/v2/node/stream/websocket/',
            onOpen: () => {
              dispatch(updateLogsWebsocketStatus(true));
            },
            onClose: () => {
              dispatch(updateLogsWebsocketStatus(false));
            },
            onMessage: (message) => {
              const log = readStreamEvent(message);
              if (log) {
                dispatch(logsReceived(log));
              }
            },
          });
        } catch (e) {
          console.log(e);
          dispatch(updateLogsWebsocketStatus(false));
        }
      }
    } else if (action.type === closeLogsWebsocket.type) {
      // close logs websocket
      logsWebsocket?.close();
      dispatch(updateLogsWebsocketStatus(false));
    } else {
      return next(action);
    }
  };
};

export { websocketMiddleware };