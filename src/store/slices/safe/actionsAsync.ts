import { ActionReducerMapBuilder, createAsyncThunk, isPlain } from '@reduxjs/toolkit';
import SafeApiKit, {
  AddSafeDelegateProps,
  AllTransactionsListResponse,
  AllTransactionsOptions,
  DeleteSafeDelegateProps,
  GetSafeDelegateProps,
  OwnerResponse,
  SafeDelegateListResponse,
  SafeDelegateResponse,
  SafeInfoResponse,
  SafeMultisigTransactionListResponse,
  SignatureResponse,
  TokenInfoListResponse,
  TokenInfoResponse,
} from '@safe-global/api-kit';
import Safe, {
  PredictedSafeProps,
  SafeAccountConfig,
  Eip1193Provider,
} from '@safe-global/protocol-kit';
import {
  OperationType,
  SafeMultisigTransactionResponse,
  SafeTransaction,
  SafeTransactionData,
  SafeTransactionDataPartial,
} from '@safe-global/types-kit';
import {
  Address,
  WalletClient,
  encodePacked,
  keccak256,
  publicActions,
  toBytes,
  toHex,
  getAddress,
  SendTransactionParameters,
} from 'viem';
import { waitForTransactionReceipt } from 'viem/actions'
import { gnosis } from 'viem/chains';
import { RootState } from '../..';
import {
  HOPR_ANNOUNCEMENT_SMART_CONTRACT_ADDRESS,
  HOPR_CHANNELS_SMART_CONTRACT_ADDRESS,
  HOPR_NODE_MANAGEMENT_MODULE,
  HOPR_NODE_STAKE_FACTORY,
  SAFE_SERVICE_URL,
  WEBAPI_URL,
} from '../../../../config';
import { web3 } from '@hoprnet/hopr-sdk';
import {
  getCurrencyFromHistoryTransaction,
  getRequestFromHistoryTransaction,
  getRequestOfPendingTransaction,
  getSourceFromHistoryTransaction,
  getSourceOfPendingTransaction,
  getValueFromHistoryTransaction,
} from '../../../utils/safeTransactions';
import { stakingHubActions } from '../stakingHub';
import { initialState } from './initialState';
import { UseEthersSigner } from '../../../hooks';
import { CustomTransport } from 'viem'
import { useConnectorClient, UseConnectorClientReturnType, UseWalletClientReturnType } from 'wagmi'

const createSafeApiService = async () => {
  const chainId: bigint = 100n;
  const apiKit = new SafeApiKit({
    chainId,
    txServiceUrl: SAFE_SERVICE_URL
  })
  return apiKit;
};

const createSafeSDK = async (signer: WalletClient, safeAddress: string) => {
  const safeAccount = await Safe.init({
    provider: signer as Eip1193Provider,
    safeAddress: safeAddress,
  });

  return safeAccount;
};

const createVanillaSafeWithConfigThunk = createAsyncThunk<
  string | undefined,
  {
    signer: WalletClient;
    config: SafeAccountConfig;
  },
  { state: RootState }
>(
  'safe/createVanillaSafeWithConfig',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const saltNonce = Date.now().toString();
      const safeVersion = '1.4.1';
      const predictedSafe: PredictedSafeProps = {
        safeAccountConfig: payload.config,
        safeDeploymentConfig: {
          saltNonce,
          safeVersion
        }
      }

      const [signerAddress] = await payload.signer.getAddresses();

      let protocolKit = await Safe.init({
        provider: payload.signer as Eip1193Provider,
        signer: signerAddress,
        predictedSafe
      })

      const safeAddress = await protocolKit.getAddress();
      const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction();
      const client = await protocolKit.getSafeProvider().getExternalSigner();

      if (!client) {
        throw new Error('No external signer available from Safe provider');
      }

      const txHash = await client.sendTransaction({
        to: deploymentTransaction.to as `0x${string}`,
        value: BigInt(deploymentTransaction.value),
        data: deploymentTransaction.data as `0x${string}`,
        // TODO: Fix types
        //@ts-expect-error viem types, did acording to the docs...
        chain: gnosis,
      })

      const txReceipt = await waitForTransactionReceipt(payload.signer, { hash: txHash })

      return safeAddress;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.selectedSafe.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const getSafesByOwnerThunk = createAsyncThunk<
  OwnerResponse | undefined,
  { signer: WalletClient },
  { state: RootState }
>(
  'safe/getSafesByOwner',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeApi = await createSafeApiService();
      const [signerAddress] = await payload.signer.getAddresses();
      const safeAddresses = await safeApi.getSafesByOwner(signerAddress);

      return safeAddresses;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.safesByOwner.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const createAddOwnerToSafeTransactionDataThunk = createAsyncThunk<
  SafeTransactionData | undefined,
  {
    signer: WalletClient;
    safeAddress: string;
    ownerAddress: string;
    threshold?: number;
  },
  { state: RootState }
>('safe/addOwnerToSafe', async (payload, { rejectWithValue }) => {
  try {
    const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
    const addOwnerTx = await safeSDK.createAddOwnerTx({
      ownerAddress: payload.ownerAddress,
      threshold: payload.threshold,
    });
    return addOwnerTx.data;
  } catch (e) {
    if (e instanceof Error) {
      return rejectWithValue(e.message);
    }

    // value is serializable
    if (isPlain(e)) {
      return rejectWithValue(e);
    }

    // error is not serializable
    return rejectWithValue(JSON.stringify(e));
  }
});

const createRemoveOwnerFromSafeTransactionDataThunk = createAsyncThunk<
  SafeTransactionData | undefined,
  {
    signer: WalletClient;
    safeAddress: string;
    ownerAddress: string;
    threshold?: number;
  },
  { state: RootState }
>(
  'safe/removeOwnerFromSafe',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      const removeOwnerTx = await safeSDK.createRemoveOwnerTx({
        ownerAddress: payload.ownerAddress,
        threshold: payload.threshold,
      });
      return removeOwnerTx.data;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.info.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const createSetThresholdToSafeTransactionDataThunk = createAsyncThunk<
  SafeTransactionData | undefined,
  {
    signer: WalletClient;
    safeAddress: string;
    newThreshold: number;
  },
  { state: RootState }
>(
  'safe/updateSafeThreshold',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      const safeApi = await createSafeApiService();
      // gets next nonce considering pending txs
      const nextSafeNonce = await safeApi.getNextNonce(payload.safeAddress);
      const changeThresholdTx = await safeSDK.createChangeThresholdTx(payload.newThreshold, { nonce: Number(nextSafeNonce) });
      return changeThresholdTx.data;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.info.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const getSafeInfoThunk = createAsyncThunk<
  SafeInfoResponse,
  {
    signer: WalletClient;
    safeAddress: string;
  },
  { state: RootState }
>(
  'safe/getSafeInfo',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeApi = await createSafeApiService();
      const info = await safeApi.getSafeInfo(getAddress(payload.safeAddress));
      return info;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.info.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const createSafeTransactionThunk = createAsyncThunk<
  string | undefined,
  {
    signer: WalletClient;
    safeAddress: string;
    safeTransactionData: SafeTransactionDataPartial;
  },
  { state: RootState }
>(
  'safe/createTransaction',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      const safeApi = await createSafeApiService();
      // gets next nonce considering pending txs
      const nextSafeNonce = await safeApi.getNextNonce(payload.safeAddress);
      // create safe transaction
      console.log('safeTransactionData', payload.safeTransactionData);
      const safeTransaction = await safeSDK.createTransaction({
        transactions: [
          payload.safeTransactionData,
        ],
        options: {
          nonce: Number(nextSafeNonce)
        },
      });
      const safeTxHash = await safeSDK.getTransactionHash(safeTransaction);
      const signature = await safeSDK.signTypedData(safeTransaction);
      const [senderAddress] = await payload.signer.getAddresses();
      console.log('Proposing transaction: ', {
        safeAddress: payload.safeAddress,
        safeTransactionData: safeTransaction.data,
        safeTxHash,
        senderAddress,
        senderSignature: signature.data,
      });
      // propose safe transaction
      try {
        await safeApi.proposeTransaction({
          safeAddress: payload.safeAddress,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress,
          senderSignature: signature.data,
        });
      } catch (e) {
        // safeApi doesn't return error message from the HTTP request
        // Check what went wrong

        const body = {
          ...safeTransaction.data,
          contractTransactionHash: safeTxHash,
          sender: senderAddress,
          signature: signature.data,
        };

        const checkRez = await fetch(`${SAFE_SERVICE_URL}/api/v1/safes/${payload.safeAddress}/multisig-transactions/`, {
          headers: {
            accept: 'application/json',
            'accept-language': 'en-US,en;q=0.9,pl;q=0.8',
            'content-type': 'application/json',
          },
          body: JSON.stringify(body),
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
        });
        const checkRezJson = await checkRez.json();
        if (checkRezJson) {
          throw {
            error: e,
            message: checkRezJson,
          };
        } else {
          throw e;
        }
      }

      // re fetch all txs
      dispatch(
        getPendingSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        })
      );
      return safeTxHash;
    } catch (e) {
      console.log('e', e);
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.createTransaction.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

/**
 * Creates a contract interaction from your safe
 * @returns safe transaction hash
 */
const createSafeContractTransactionThunk = createAsyncThunk<
  string | undefined,
  {
    signer: WalletClient;
    safeAddress: string;
    smartContractAddress: string;
    data: string;
    operation?: OperationType;
  },
  { state: RootState }
>(
  'safe/createContractTransaction',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const { smartContractAddress, data, signer, safeAddress } = payload;

      const safeTransactionData: SafeTransactionDataPartial = {
        to: smartContractAddress,
        data,
        operation: payload.operation ?? OperationType.Call,
        value: '0',
      };
      console.log('safeTransactionData', safeTransactionData);
      const safeTxHash = await dispatch(
        createSafeTransactionThunk({
          signer,
          safeAddress: safeAddress,
          safeTransactionData,
        })
      ).unwrap();

      return safeTxHash;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.createTransaction.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const createSafeRejectionTransactionThunk = createAsyncThunk<
  boolean | undefined,
  { signer: WalletClient; safeAddress: string; nonce: number },
  { state: RootState }
>(
  'safe/rejectTransactionProposal',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      const safeApi = await createSafeApiService();
      // create safe rejection transaction
      const rejectTransaction = await safeSDK.createRejectionTransaction(payload.nonce);
      const safeTxHash = await safeSDK.getTransactionHash(rejectTransaction);
      const signature = await safeSDK.signTypedData(rejectTransaction);
      const [senderAddress] = await payload.signer.getAddresses();
      // propose safe transaction
      await safeApi.proposeTransaction({
        safeAddress: payload.safeAddress,
        safeTransactionData: rejectTransaction.data,
        safeTxHash,
        senderAddress,
        senderSignature: signature.data,
      });
      // re fetch all txs
      dispatch(
        getPendingSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        })
      );
      return true;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.rejectTransaction.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const confirmTransactionThunk = createAsyncThunk<
  SignatureResponse | undefined,
  { signer: WalletClient; safeAddress: string; safeTransactionHash: string },
  { state: RootState }
>(
  'safe/confirmTransactionProposal',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      const safeApi = await createSafeApiService();
      const signature = await safeSDK.signHash(payload.safeTransactionHash);
      const confirmTransaction = await safeApi.confirmTransaction(payload.safeTransactionHash, signature.data);
      // re fetch all txs
      dispatch(
        getPendingSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        })
      );
      return confirmTransaction;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.confirmTransaction.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

/**
 * Executes an already approved transaction
 */
const executePendingTransactionThunk = createAsyncThunk<
  boolean | undefined,
  {
    signer: WalletClient;
    safeAddress: string;
    safeTransaction: SafeMultisigTransactionResponse | SafeTransaction;
  },
  { state: RootState }
>(
  'safe/executeTransactionProposal',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      console.log('payload.signer', payload.signer);
      await safeSDK.executeTransaction(payload.safeTransaction);
      // re fetch all txs
      setTimeout(() => {
        dispatch(
          getPendingSafeTransactionsThunk({
            safeAddress: payload.safeAddress,
            signer: payload.signer,
          })
        );
        dispatch(
          getAllSafeTransactionsThunk({
            safeAddress: payload.safeAddress,
            signer: payload.signer,
          })
        );
      }, 1_000);
      return true;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.executeTransaction.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

/**
 * Creates a safe transaction and executes, skips proposing.
 * This only works if the safe has threshold of 1
 */
const createAndExecuteSafeTransactionThunk = createAsyncThunk<
  string,
  {
    signer: WalletClient;
    safeAddress: string;
    safeTransactionData: SafeTransactionDataPartial;
  },
  {
    state: RootState;
  }
>(
  'safe/createAndExecuteTransaction',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeSDK = await createSafeSDK(payload.signer, payload.safeAddress);
      // create safe transaction
      const safeTransaction = await safeSDK.createTransaction({
        transactions: [payload.safeTransactionData]
      });
      console.log({ safeTransaction });
      const isValidTx = await safeSDK.isValidTransaction(safeTransaction);
      if (!isValidTx) {
        throw Error('Transaction is not valid');
      }
      // execute safe transaction
      const safeTxResponse = await safeSDK.executeTransaction(safeTransaction);

      // wait for transaction to be confirmed
      console.log(`Waiting for transaction ${safeTxResponse.hash} to be confirmed...`);
      const client = payload.signer.extend(publicActions);
      const receipt = await client.waitForTransactionReceipt({ hash: safeTxResponse.hash as `0x${string}` });
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      // re fetch all txs
      dispatch(
        getAllSafeTransactionsThunk({
          safeAddress: payload.safeAddress,
          signer: payload.signer,
        })
      );

      return safeTxResponse.hash;
    } catch (e) {
      console.log({ e });
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.executeTransaction.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const createAndExecuteSafeContractTransactionThunk = createAsyncThunk<
  string,
  {
    signer: WalletClient;
    safeAddress: string;
    smartContractAddress: string;
    operation?: OperationType;
    data: string;
  },
  { state: RootState }
>('safe/createAndExecuteContractTransaction', async (payload, { rejectWithValue, dispatch }) => {
  try {
    const { smartContractAddress, data, signer, safeAddress } = payload;

    const safeTransactionData: SafeTransactionDataPartial = {
      to: smartContractAddress,
      data,
      operation: payload.operation ?? OperationType.Call,
      value: '0',
    };

    const safeTxResult = await dispatch(
      createAndExecuteSafeTransactionThunk({
        signer,
        safeAddress: safeAddress,
        safeTransactionData,
      })
    ).unwrap();

    return safeTxResult;
  } catch (e) {
    if (e instanceof Error) {
      return rejectWithValue(e.message);
    }

    // value is serializable
    if (isPlain(e)) {
      return rejectWithValue(e);
    }

    // error is not serializable
    return rejectWithValue(JSON.stringify(e));
  }
});

const getAllSafeTransactionsThunk = createAsyncThunk<
  AllTransactionsListResponse | undefined,
  {
    signer: WalletClient;
    safeAddress: string;
    options?: AllTransactionsOptions;
  },
  { state: RootState }
>(
  'safe/getAllSafeTransactions',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeApi = await createSafeApiService();
      const transactions = await safeApi.getAllTransactions(payload.safeAddress, {
        ...payload.options,
      });
      return transactions;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.allTransactions.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const getPendingSafeTransactionsThunk = createAsyncThunk<
  SafeMultisigTransactionListResponse,
  {
    signer: WalletClient;
    safeAddress: string;
  },
  { state: RootState }
>(
  'safe/getPendingSafeTransactions',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeApi = await createSafeApiService();
      const transactions = await safeApi.getPendingTransactions(payload.safeAddress);
      return transactions;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.pendingTransactions.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const addSafeDelegateThunk = createAsyncThunk<
  SafeDelegateResponse | undefined,
  AddSafeDelegateProps,
  { state: RootState }
>(
  'safe/addDelegate',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeApi = await createSafeApiService();
      const response = await safeApi.addSafeDelegate(payload);

      // update delegate list
      dispatch(
        getSafeDelegatesThunk({
          safeAddress: payload.safeAddress,
        })
      );

      return response;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.addDelegate.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

type DeleteSafeDelegateProps2 = DeleteSafeDelegateProps & {
  safeAddress: `0x${string}`;
};

const removeSafeDelegateThunk = createAsyncThunk<
  void | undefined,
  DeleteSafeDelegateProps2,
  { state: RootState }
>(
  'safe/removeDelegate',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeApi = await createSafeApiService();
      const response = await safeApi.removeSafeDelegate(payload);

      // update delegate list
      dispatch(
        getSafeDelegatesThunk({
          safeAddress: payload.safeAddress,
        })
      );

      return response;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.removeDelegate.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const getSafeDelegatesThunk = createAsyncThunk<
  SafeDelegateListResponse | undefined,
  GetSafeDelegateProps,
  { state: RootState }
>(
  'safe/getDelegates',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeApi = await createSafeApiService();
      const response = await safeApi.getSafeDelegates(payload);
      return response;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.delegates.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const getToken = createAsyncThunk<
  TokenInfoResponse | undefined,
  {
    tokenAddress: string;
    signer: WalletClient;
  },
  { state: RootState }
>(
  'safe/getToken',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeApi = await createSafeApiService();
      const token = await safeApi.getToken(payload.tokenAddress);
      return token;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.token.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const getTokenList = createAsyncThunk<
  TokenInfoListResponse | undefined,
  {
    signer: WalletClient;
  },
  { state: RootState }
>(
  'safe/getTokenList',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const safeApi = await createSafeApiService();
      const tokenList = await safeApi.getTokenList();
      return tokenList;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.tokenList.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

// SC staking functions

/**
 * Next version of create safe with HOPR_NODE_STAKE_FACTORY .clone
 * */
const createSafeWithConfigThunk = createAsyncThunk<
  | {
      transactionHash: string;
      moduleProxy: string;
      safeAddress: string;
    }
  | undefined,
  {
    walletClient: WalletClient;
    config: SafeAccountConfig;
    doNotSwitch?: boolean;
  },
  { state: RootState }
>(
  'safe/createSafeWithConfig',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const superWalletClient = payload.walletClient.extend(publicActions);

      if (!superWalletClient.account) return;

      // The saltNonce is used to calculate a deterministic address for the new Safe contract.
      // This way, even if the same Safe configuration is used multiple times,
      // each deployment will result in a new, unique Safe contract.
      const saltNonce = keccak256(
        encodePacked(['bytes20', 'string'], [superWalletClient.account.address, Date.now().toString()])
      );

      // Sets ALLOW_ALL on all Channel and Token operations by default.
      const defaultTarget = toBytes(HOPR_CHANNELS_SMART_CONTRACT_ADDRESS + '010103030303030303030303');

      const { result, request } = await superWalletClient.simulateContract({
        account: payload.walletClient.account,
        address: HOPR_NODE_STAKE_FACTORY,
        abi: web3.hoprNodeStakeFactoryABI,
        functionName: 'clone',
        args: [
          HOPR_NODE_MANAGEMENT_MODULE,
          payload.config.owners,
          saltNonce,
          toHex(new Uint8Array(defaultTarget), { size: 32 }),
        ],
      });

      // TODO: Add error handling if failed (notificaiton)

      if (!result) return;

      const transactionHash = await superWalletClient.writeContract(request);

      await superWalletClient.waitForTransactionReceipt({ hash: transactionHash });

      const [moduleProxy, safeAddress] = result as [Address, Address];

      if (!payload.doNotSwitch) {
        dispatch(
          stakingHubActions.addSafeAndUseItForOnboarding({
            safeAddress,
            moduleAddress: moduleProxy,
          })
        );
      } else {
        dispatch(
          stakingHubActions.addSafe({
            safeAddress,
            moduleAddress: moduleProxy,
          })
        );
      }

      return {
        transactionHash,
        moduleProxy,
        safeAddress,
      };
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  },
  {
    condition: (_payload, { getState }) => {
      const isFetching = getState().safe.selectedSafe.isFetching;
      if (isFetching) {
        return false;
      }
    },
  }
);

const getCommunityNftsOwnedBySafeThunk = createAsyncThunk(
  'web3/getCommunityNftsOwnedBySafe',
  async (account: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${WEBAPI_URL}/hub/getCommunityNftsByOwner`, {
        method: 'POST',
        body: JSON.stringify({ account: account }),
      });
      const responseJson: {
        boosts: { id: string }[] | null;
      } = await response.json();

      return responseJson;
    } catch (e) {
      if (e instanceof Error) {
        return rejectWithValue(e.message);
      }

      // value is serializable
      if (isPlain(e)) {
        return rejectWithValue(e);
      }

      // error is not serializable
      return rejectWithValue(JSON.stringify(e));
    }
  }
);

const getGnoAidropThunk = createAsyncThunk('web3/getGnoAidropThunk', async (safe: string, { rejectWithValue }) => {
  try {
    const response = await fetch(`${WEBAPI_URL}/hub/gno-airdrop-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        safe,
      }),
    });
    const json = await response.json();

    return json;
  } catch (e) {
    return false;
  }
});

export const createAsyncReducer = (builder: ActionReducerMapBuilder<typeof initialState>) => {
  // CreateSafeWithConfig
  builder.addCase(createSafeWithConfigThunk.pending, (state, action) => {
    state.creatingNewSafePending = true;
  });
  builder.addCase(createSafeWithConfigThunk.fulfilled, (state, action) => {
    if (action.payload && !action.meta.arg.doNotSwitch) {
      // reset other safe states
      state.allTransactions.data = null;
      state.communityNftIds.data = [];
      state.delegates.data = null;
      state.pendingTransactions.data = null;
      state.info.data = null;
      state.selectedSafe.data.safeAddress = getAddress(action.payload.safeAddress);
    }
    state.selectedSafe.isFetching = false;
    state.creatingNewSafePending = false;
  });
  builder.addCase(createSafeWithConfigThunk.rejected, (state) => {
    state.selectedSafe.isFetching = false;
    state.creatingNewSafePending = false;
  });
  // CreateVanillaSafeWithConfig
  builder.addCase(createVanillaSafeWithConfigThunk.pending, (state) => {
    state.selectedSafe.isFetching = true;
  });
  builder.addCase(createVanillaSafeWithConfigThunk.fulfilled, (state, action) => {
    if (action.payload) {
      state.selectedSafe.data.safeAddress = getAddress(action.payload);
    }
    state.selectedSafe.isFetching = false;
  });
  builder.addCase(createVanillaSafeWithConfigThunk.rejected, (state) => {
    state.selectedSafe.isFetching = false;
  });
  // GetSafesByOwner
  builder.addCase(getSafesByOwnerThunk.pending, (state) => {
    state.safesByOwner.isFetching = true;
  });
  builder.addCase(getSafesByOwnerThunk.fulfilled, (state, action) => {
    if (action.payload) {
      state.safesByOwner.data = action.payload.safes;
    }
    state.safesByOwner.isFetching = false;
  });
  builder.addCase(getSafesByOwnerThunk.rejected, (state) => {
    state.safesByOwner.isFetching = false;
  });
  // GetSafeInfo
  builder.addCase(getSafeInfoThunk.pending, (state) => {
    state.info.isFetching = true;
  });
  builder.addCase(getSafeInfoThunk.fulfilled, (state, action) => {
    if (action.payload) {
      state.info.data = action.payload;
      state.info.safeIndexed = true;
    }
    state.info.isFetching = false;
  });
  builder.addCase(getSafeInfoThunk.rejected, (state, info) => {
    state.info.safeIndexed = false;
    state.info.isFetching = false;
  });
  // CreateSafeTransaction
  builder.addCase(createSafeTransactionThunk.pending, (state) => {
    state.createTransaction.isFetching = true;
  });
  builder.addCase(createSafeTransactionThunk.fulfilled, (state) => {
    state.createTransaction.isFetching = false;
  });
  builder.addCase(createSafeTransactionThunk.rejected, (state) => {
    state.createTransaction.isFetching = false;
  });
  // CreateSafeContractTransaction
  builder.addCase(createSafeContractTransactionThunk.pending, (state) => {
    state.createTransaction.isFetching = true;
  });
  builder.addCase(createSafeContractTransactionThunk.fulfilled, (state) => {
    state.createTransaction.isFetching = false;
  });
  builder.addCase(createSafeContractTransactionThunk.rejected, (state) => {
    state.createTransaction.isFetching = false;
  });
  // CreateSafeRejectionTransaction
  builder.addCase(createSafeRejectionTransactionThunk.pending, (state) => {
    state.rejectTransaction.isFetching = true;
  });
  builder.addCase(createSafeRejectionTransactionThunk.fulfilled, (state) => {
    state.rejectTransaction.isFetching = false;
  });
  builder.addCase(createSafeRejectionTransactionThunk.rejected, (state) => {
    state.createTransaction.isFetching = false;
  });
  // ConfirmTransaction
  builder.addCase(confirmTransactionThunk.pending, (state) => {
    state.confirmTransaction.isFetching = true;
  });
  builder.addCase(confirmTransactionThunk.fulfilled, (state) => {
    state.confirmTransaction.isFetching = false;
  });
  builder.addCase(confirmTransactionThunk.rejected, (state) => {
    state.confirmTransaction.isFetching = false;
  });
  // ExecuteTransaction
  builder.addCase(executePendingTransactionThunk.pending, (state) => {
    state.executeTransaction.isFetching = true;
  });
  builder.addCase(executePendingTransactionThunk.fulfilled, (state) => {
    state.executeTransaction.isFetching = false;
  });
  builder.addCase(executePendingTransactionThunk.rejected, (state) => {
    state.executeTransaction.isFetching = false;
  });
  // GetAllSafeTransactions
  builder.addCase(getAllSafeTransactionsThunk.pending, (state) => {
    state.allTransactions.isFetching = true;
  });
  builder.addCase(getAllSafeTransactionsThunk.fulfilled, (state, action) => {
    if (action.payload) {
      state.allTransactions.data = {
        ...action.payload,
        results: action.payload.results.map((result) => ({
          ...result,
          source: getSourceFromHistoryTransaction(result) ?? '',
          request: getRequestFromHistoryTransaction(result) ?? '',
          currency: getCurrencyFromHistoryTransaction(result) ?? '',
          value: getValueFromHistoryTransaction(result) ?? '',
        })),
      };
    }
    state.allTransactions.isFetching = false;
  });
  builder.addCase(getAllSafeTransactionsThunk.rejected, (state) => {
    state.allTransactions.isFetching = false;
  });
  // GetPendingSafeTransaction
  builder.addCase(getPendingSafeTransactionsThunk.pending, (state) => {
    state.pendingTransactions.isFetching = true;
  });
  builder.addCase(getPendingSafeTransactionsThunk.fulfilled, (state, action) => {
    if (action.payload) {
      // add business logic: source, request
      state.pendingTransactions.data = {
        ...action.payload,
        results: action.payload.results.map((result) => ({
          ...result,
          source: getSourceOfPendingTransaction(result) ?? '',
          request: getRequestOfPendingTransaction(
            result,
            state.selectedSafe.data,
            state.delegates.data,
          )
          ?? '',
        })),
      };
    }
    state.pendingTransactions.isFetching = false;
  });
  builder.addCase(getPendingSafeTransactionsThunk.rejected, (state) => {
    state.pendingTransactions.isFetching = false;
  });
  // AddSafeDelegate
  builder.addCase(addSafeDelegateThunk.pending, (state) => {
    state.addDelegate.isFetching = true;
  });
  builder.addCase(addSafeDelegateThunk.fulfilled, (state) => {
    state.addDelegate.isFetching = false;
  });
  builder.addCase(addSafeDelegateThunk.rejected, (state) => {
    state.addDelegate.isFetching = false;
  });
  // RemoveSafeDelegate
  builder.addCase(removeSafeDelegateThunk.pending, (state) => {
    state.removeDelegate.isFetching = true;
  });
  builder.addCase(removeSafeDelegateThunk.fulfilled, (state) => {
    state.removeDelegate.isFetching = false;
  });
  builder.addCase(removeSafeDelegateThunk.rejected, (state) => {
    state.addDelegate.isFetching = false;
  });
  // GetSafeDelegates
  builder.addCase(getSafeDelegatesThunk.pending, (state) => {
    state.delegates.isFetching = true;
  });
  builder.addCase(getSafeDelegatesThunk.fulfilled, (state, action) => {
    if (action.payload) {
      state.delegates.data = action.payload;
    }
    state.delegates.isFetching = false;
  });
  builder.addCase(getSafeDelegatesThunk.rejected, (state) => {
    state.delegates.isFetching = false;
  });
  // GetTokenList
  builder.addCase(getTokenList.pending, (state) => {
    state.tokenList.isFetching = true;
  });
  builder.addCase(getTokenList.fulfilled, (state, action) => {
    if (action.payload) {
      state.tokenList.data = action.payload;
    }
    state.tokenList.isFetching = false;
  });
  builder.addCase(getTokenList.rejected, (state) => {
    state.tokenList.isFetching = false;
  });
  // GetToken
  builder.addCase(getToken.pending, (state) => {
    state.token.isFetching = true;
  });
  builder.addCase(getToken.fulfilled, (state) => {
    state.token.isFetching = false;
  });
  builder.addCase(getToken.rejected, (state) => {
    state.token.isFetching = false;
  });
  builder.addCase(getCommunityNftsOwnedBySafeThunk.pending, (state) => {
    state.communityNftIds.isFetching = true;
  });
  builder.addCase(getCommunityNftsOwnedBySafeThunk.fulfilled, (state, action) => {
    if (action.payload) {
      if (action.payload.boosts && action.payload.boosts.length > 0 && action.payload.boosts[0].id) {
        state.communityNftIds.data = action.payload?.boosts;
        state.communityNftIds.isFetching = false;
      }
    }
  });
  builder.addCase(getGnoAidropThunk.pending, (state) => {
    state.gnoAirdrop.isFetching = true;
  });
  builder.addCase(getGnoAidropThunk.fulfilled, (state, action) => {
    state.gnoAirdrop.status = action.payload.status;
    state.gnoAirdrop.paid = action.payload.paid;
    state.gnoAirdrop.isFetching = false;
  });
  builder.addCase(getGnoAidropThunk.rejected, (state) => {
    state.gnoAirdrop.status = null;
    state.gnoAirdrop.paid = null;
    state.gnoAirdrop.isFetching = false;
  });
  builder.addCase(createAndExecuteSafeTransactionThunk.pending, (state) => {
    state.executeTransaction.isFetching = true;
  }
  );
  builder.addCase(createAndExecuteSafeTransactionThunk.fulfilled, (state) => {
    state.executeTransaction.isFetching = false;
  });
  builder.addCase(createAndExecuteSafeTransactionThunk.rejected, (state) => {
    state.executeTransaction.isFetching = false;
  });
  builder.addCase(createSetThresholdToSafeTransactionDataThunk.pending, (state) => {
    state.info.isFetching = true;
  });
  builder.addCase(createRemoveOwnerFromSafeTransactionDataThunk.pending, (state) => {
    state.info.isFetching = true;
  });
};

export const actionsAsync = {
  createSafeWithConfigThunk,
  getSafesByOwnerThunk,
  createAddOwnerToSafeTransactionDataThunk,
  createRemoveOwnerFromSafeTransactionDataThunk,
  getAllSafeTransactionsThunk,
  confirmTransactionThunk,
  createSafeRejectionTransactionThunk,
  createSafeTransactionThunk,
  getSafeInfoThunk,
  executePendingTransactionThunk,
  getPendingSafeTransactionsThunk,
  addSafeDelegateThunk,
  removeSafeDelegateThunk,
  getSafeDelegatesThunk,
  getToken,
  getTokenList,
  createSetThresholdToSafeTransactionDataThunk,
  createSafeContractTransactionThunk,
  createAndExecuteSafeTransactionThunk,
  createAndExecuteSafeContractTransactionThunk,
  createVanillaSafeWithConfigThunk,
  getCommunityNftsOwnedBySafeThunk,
  getGnoAidropThunk,
};
