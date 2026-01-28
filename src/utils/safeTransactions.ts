import {
  AllTransactionsListResponse,
  EthereumTxWithTransfersResponse,
  SafeInfoResponse,
  SafeModuleTransactionWithTransfersResponse,
  SafeMultisigTransactionWithTransfersResponse,
  SafeDelegateListResponse,
} from '@safe-global/api-kit';
import { SafeMultisigTransactionResponse } from '@safe-global/types-kit';
import { Address, decodeFunctionData, formatEther, formatUnits } from 'viem';
import { erc20Abi, erc4626Abi, erc721Abi } from 'viem';
import { truncateEthereumAddress } from './blockchain';
import { web3 } from '@hoprnet/hopr-sdk';
import { wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS } from '../../config';
import { createNewConfigTx } from '../pages/staking-hub/onboarding/step6/0configureModule';
import { safe } from 'wagmi/connectors';
import {
  HOPR_ANNOUNCEMENT_SMART_CONTRACT_ADDRESS,
} from '../../config';

/**
 * Pending transactions
 */

/** Human readable explanation of what the transaction is going to do */
export const getRequestOfPendingTransaction = (
  transaction: SafeMultisigTransactionResponse,
  safeInfo?: {
    safeAddress: string | null;
    moduleAddress: string | null;
  } | null,
  delegates?: SafeDelegateListResponse | null
) => {
  if (transaction.data) {
    const safeAddress = transaction.safe;
    const dataDecoded = transaction?.dataDecoded as any;

    // *** Check for wrapper transactions
    if (
      dataDecoded &&
      dataDecoded?.method === 'transferAndCall' &&
      dataDecoded?.parameters[0]?.value === wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS &&
      dataDecoded?.parameters[2]?.value === '0x'
    ) {
      // this is a wrapper transaction
      return 'Wrap to wxHOPR';
    }

    if (
      dataDecoded &&
      dataDecoded?.method === 'transfer' &&
      dataDecoded?.parameters[0]?.value === wxHOPR_WRAPPER_SMART_CONTRACT_ADDRESS
    ) {
      // this is a wrapper transaction
      return 'Unwrap to xHOPR';
    }

    // *** Check for set Implementer transactions
    if (
      dataDecoded &&
      dataDecoded?.method === 'setInterfaceImplementer' &&
      dataDecoded?.parameters[0]?.value === safeAddress &&
      dataDecoded?.parameters[1]?.value === '0xb281fc8c12954d22544db45de3159a39272895b169a852b314f9cc762e44c53b' &&
      dataDecoded?.parameters[2]?.value === '0xe530E2f9DECF24D7d42F011F54f1e9F8001E7619'
    ) {
      // this is a wrapper transaction
      return 'Add Safe to ERC1820 Registry';
    }

    try {
      if(!safeInfo?.moduleAddress) throw new Error("No module address");

      const delegateAddreses = delegates?.results.map((delegate) => delegate.delegate);

      for (const delegateAddress of delegateAddreses || []) {
        if(!delegateAddress) continue;

        const newConfigTx = createNewConfigTx(
          safeInfo?.moduleAddress?.slice(2).toLowerCase(),
          delegateAddress.slice(2).toLowerCase(),
          HOPR_ANNOUNCEMENT_SMART_CONTRACT_ADDRESS.slice(2).toLowerCase()
        );

        if (
          transaction &&
          transaction.data === newConfigTx
        ) {
          return `Node onboarding: Configure module for the ${delegateAddress} node `;
        }
      }
    } catch (e) {
      console.log('To a config tx', e);
    }

    try {
      const decodedData = decodeFunctionData({
        data: transaction.data as Address,
        // could be any sc so not sure on the abi
        abi: [...erc20Abi, ...erc4626Abi, ...erc721Abi, ...web3.hoprSafeABI, ...web3.wrapperABI],
      });
      return decodedData.functionName;
    } catch (e) {
      // if the function is not from an abi stated above
      // the data may not decode
      return 'Could not decode';
    }
  } else if (BigInt(transaction.value)) {
    return 'Sent';
  }
  if (transaction.safe === transaction.to && !BigInt(transaction.value)) {
    // this should be a rejection tx if there is no value
    // and no call data and the destination is the same address
    return 'Rejection';
  } else {
    // unknown request
    ('-');
  }
};

export const getSourceOfPendingTransaction = (transaction: SafeMultisigTransactionResponse) => {
  // if there are no signatures this is from a delegate
  if (!transaction.confirmations?.length) {
    return '-';
  }

  return truncateEthereumAddress(transaction.confirmations.at(0)?.owner ?? '');
};

export const getUserActionForPendingTransaction = (
  transaction: SafeMultisigTransactionResponse,
  ownerAddress: string
): 'EXECUTE' | 'SIGN' | null => {
  if (!ownerAddress) return null;
  const transactionHasEnoughSignatures = (transaction.confirmations?.length ?? 0) >= transaction.confirmationsRequired;

  if (transactionHasEnoughSignatures) {
    return 'EXECUTE';
  }

  // console.log('getUserActionForPendingTransaction', transaction)

  const ownerHasSignedTransaction = transaction?.confirmations?.find(
    (confirmation) => confirmation.owner === ownerAddress
  );

  if (ownerHasSignedTransaction) {
    // transaction does not have enough signatures and owner has already signed
    // can only wait for more signatures
    return null;
  }

  const oneSignaturePending = transaction.confirmationsRequired - (transaction.confirmations?.length ?? 0) === 1;

  if (oneSignaturePending) {
    return 'EXECUTE';
  }

  // more than 1 signature is pending and owner has not signed
  return 'SIGN';
};

export const getUserCanSkipProposal = (safeInfo: SafeInfoResponse | null) => {
  if (!safeInfo) {
    return false;
  }

  if (safeInfo.threshold === 1) {
    return true;
  }

  return false;
};

/**
 * Ethereum transactions
 */

const getValueFromHistoryEthereumTransaction = (transaction: EthereumTxWithTransfersResponse) => {
  if (!transaction.transfers.at(0)?.tokenAddress) {
    // native transfer
    return formatEther(BigInt(transaction.transfers.at(0)?.value ?? 0));
  }

  const units = transaction.transfers.at(0)?.tokenInfo?.decimals ?? 18;
  const value = formatUnits(BigInt(transaction.transfers.at(0)?.value ?? 0), units);
  return value;
};

const getCurrencyFromHistoryEthereumTransaction = (transaction: EthereumTxWithTransfersResponse) => {
  if (!transaction.transfers.at(0)?.tokenAddress) {
    // native transfer
    return 'xDai';
  }
  const currency = transaction.transfers.at(0)?.tokenInfo?.symbol;
  return currency;
};

const getSourceFromHistoryEthereumTransaction = (transaction: EthereumTxWithTransfersResponse) => {
  const source = transaction.from;
  return source;
};

/**
 * Module transactions
 */

const getValueFromHistoryModuleTransaction = (transaction: SafeModuleTransactionWithTransfersResponse) => {
  const units = transaction.transfers.at(0)?.tokenInfo?.decimals ?? 18;
  const value = formatUnits(BigInt(transaction.transfers.at(0)?.value ?? 0), units);
  return value;
};

const getCurrencyFromHistoryModuleTransaction = (transaction: SafeModuleTransactionWithTransfersResponse) => {
  if (!transaction.transfers.at(0)?.tokenAddress) {
    return '';
  }
  const currency = transaction.transfers.at(0)?.tokenInfo?.symbol;
  return currency;
};

/**
 * Multisig transactions
 */

const getValueFromHistoryMultisigTransaction = (transaction: SafeMultisigTransactionWithTransfersResponse) => {
  const value = formatEther(BigInt(transaction.transfers.at(0)?.value ?? 0));
  return value;
};

const getCurrencyFromHistoryMultisigTransaction = (transaction: SafeMultisigTransactionWithTransfersResponse) => {
  if (!transaction.transfers.at(0)?.tokenAddress) {
    return 'xDai';
  }

  const currency = transaction.transfers.at(0)?.tokenInfo?.symbol;
  return currency;
};

const getSourceFromHistoryMultisigTransaction = (transaction: SafeMultisigTransactionWithTransfersResponse) => {
  const source = transaction.confirmations?.at(0)?.owner;
  return source;
};

const getRequestFromHistoryMultisigTransaction = (transaction: SafeMultisigTransactionResponse) => {
  if (transaction.data) {
    try {
      const decodedData = decodeFunctionData({
        data: transaction.data as Address,
        // could be any sc so not sure on the abi
        abi: [...erc20Abi, ...erc4626Abi, ...erc721Abi, ...web3.hoprSafeABI, ...web3.wrapperABI],
      });
      return decodedData.functionName;
    } catch (e) {
      // if the function is not from an abi stated above
      // the data may not decode
      return 'Could not decode';
    }
  } else if (BigInt(transaction.value)) {
    return 'Sent';
  } else {
    // if a multisig transaction has no data or value it is probably a rejection
    return 'Rejection';
  }
};

/**
 * History transactions (MULTISIG/MODULE/ETHEREUM)
 */

export const getSourceFromHistoryTransaction = (transaction: AllTransactionsListResponse['results']['0']) => {
  if (transaction.txType === 'ETHEREUM_TRANSACTION') {
    return getSourceFromHistoryEthereumTransaction(transaction);
  } else if (transaction.txType === 'MULTISIG_TRANSACTION') {
    return getSourceFromHistoryMultisigTransaction(transaction);
  } else if (transaction.txType === 'MODULE_TRANSACTION') {
    return '-';
  }
};

export const getCurrencyFromHistoryTransaction = (transaction: AllTransactionsListResponse['results']['0']) => {
  if (transaction.txType === 'ETHEREUM_TRANSACTION') {
    return getCurrencyFromHistoryEthereumTransaction(transaction);
  } else if (transaction.txType === 'MULTISIG_TRANSACTION') {
    return getCurrencyFromHistoryMultisigTransaction(transaction);
  } else if (transaction.txType === 'MODULE_TRANSACTION') {
    return getCurrencyFromHistoryModuleTransaction(transaction);
  }
};

export const getValueFromHistoryTransaction = (transaction: AllTransactionsListResponse['results']['0']) => {
  if (transaction.txType === 'ETHEREUM_TRANSACTION') {
    return getValueFromHistoryEthereumTransaction(transaction);
  } else if (transaction.txType === 'MULTISIG_TRANSACTION') {
    return getValueFromHistoryMultisigTransaction(transaction);
  } else if (transaction.txType === 'MODULE_TRANSACTION') {
    return getValueFromHistoryModuleTransaction(transaction);
  }
};

export const getRequestFromHistoryTransaction = (transaction: AllTransactionsListResponse['results']['0']) => {
  if (transaction.txType === 'ETHEREUM_TRANSACTION') {
    return 'Received';
  } else if (transaction.txType === 'MULTISIG_TRANSACTION') {
    return getRequestFromHistoryMultisigTransaction(transaction);
  } else if (transaction.txType === 'MODULE_TRANSACTION') {
    return transaction.module;
  }
};
