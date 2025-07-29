// MUI
import {
  Box,
  Collapse,
  Divider,
  IconButton,
  List,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';

// MUI ICONS
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// STORE
import { useAppDispatch, useAppSelector } from '../../../store';
import { safeActionsAsync } from '../../../store/slices/safe';

// COMPONENTS
import Button from '../../../future-hopr-lib-components/Button';

// LIBS
import styled from '@emotion/styled';
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { erc20Abi } from 'viem';

// HOOKS
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { Address, decodeFunctionData, formatEther } from 'viem';
import { useEthersSigner } from '../../../hooks';
import {
  CustomAllTransactionsListResponse,
  CustomEthereumTxWithTransfersResponse,
  CustomSafeModuleTransactionWithTransfersResponse,
  CustomSafeMultisigTransactionListResponse,
  CustomSafeMultisigTransactionResponse,
  CustomSafeMultisigTransactionWithTransfersResponse,
} from '../../../store/slices/safe/initialState';
import { calculateTimeInGMT, formatDateToUserTimezone, formatTimeToUserTimezone } from '../../../utils/date';
import { truncateEthereumAddress } from '../../../utils/blockchain';
import { getUserActionForPendingTransaction } from '../../../utils/safeTransactions';
import { StringLiteral } from 'typescript';

import { sendNotification } from '../../../hooks/useWatcher/notifications';

const StyledContainer = styled(Paper)`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Title = styled.h2`
  font-size: 32px;
  font-weight: 400;
  text-align: center;
  text-transform: uppercase;
  margin: 0;
`;

const StyledBlueButton = styled(Button)`
  align-self: flex-end;
  text-transform: uppercase;
  flex-basis: 0;

  &.positive-action {
    width: 100%;
  }
`;

const StyledButtonGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 0.5rem;

  // allows the execute/sign button to grow
  & span:last-child {
    flex: 1 0 auto; /* grow, don't shrink, and auto basis */
  }
`;

const StyledCollapsibleCell = styled(TableCell)`
  padding-bottom: 0;
  padding-top: 0;
`;

const StyledBox = styled(Box)`
  margin: 1;
  display: flex;
  justify-content: space-evenly;
`;

const StyledTransactionHashWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  & svg {
    align-self: flex-end;
    height: 16px;
    width: 16px;
  }
`;

const StyledTableHead = styled(TableHead)`
  background-color: #aec5db;
  text-transform: uppercase;
`;

const StyledPaper = styled(Paper)`
  border-top-left-radius: 25px;
  border-top-right-radius: 25px;
`;

const GnosisLink = styled.a`
  display: inline-flex;
  gap: 2px;
  text-decoration: underline;

  & svg {
    align-self: flex-end;
    height: 16px;
    width: 16px;
  }
`;

const StyledJSON = styled.div`
  max-width: 16rem;
  overflow-wrap: break-word;
`;

const StyledPendingTableRow = styled(TableRow)`
  &.disabled {
    opacity: 60%;
  }
`;

const StyledHistoryTableRow = styled(TableRow)`
  &.rejected {
    background-color: rgba(255, 99, 71, 0.4);
    min-width: 100vw;
  }
`;

const GNOSIS_BASE_URL = 'https://gnosisscan.io';

const TruncatedEthereumAddressWithTooltip = ({ address }: { address: string }) => {
  return (
    <div>
      <Tooltip title={address}>
        <p>{truncateEthereumAddress(address)}</p>
      </Tooltip>
    </div>
  );
};

const ActionButtons = ({ transaction }: { transaction: SafeMultisigTransactionResponse }) => {
  const signer = useEthersSigner();
  const dispatch = useAppDispatch();
  const address = useAppSelector((store) => store.web3.account);
  const safeNonce = useAppSelector((store) => store.safe.info.data?.nonce);
  const safeThresholdFromSafe = useAppSelector((store) => store.safe.info.data?.threshold);
  const possibleThresholdProblem = safeThresholdFromSafe !== transaction.confirmationsRequired;
  const transactionAfterSafeNonce = safeNonce !== transaction.nonce;
  const [userAction, set_userAction] = useState<'EXECUTE' | 'SIGN' | null>(null);
  const [isLoadingApproving, set_isLoadingApproving] = useState<boolean>(false);
  const [isLoadingExecuting, set_isLoadingExecuting] = useState<boolean>(false);
  const [isLoadingRejecting, set_isLoadingRejecting] = useState<boolean>(false);

  useEffect(() => {
    if (address) {
      set_userAction(getUserActionForPendingTransaction(transaction, address));
    }
  }, [address, transaction]);

  // TODO: remove this isLoading functions when isLoading is moved to redux
  const executeTx = (transaction: SafeMultisigTransactionResponse) => {
    console.log('executeTx transaction', transaction);
    if (signer) {
      set_isLoadingExecuting(true);
      dispatch(
        safeActionsAsync.executePendingTransactionThunk({
          safeAddress: transaction.safe,
          signer,
          safeTransaction: transaction,
        })
      )
        .unwrap()
        .then(() => {
          set_isLoadingExecuting(false);
        })
        .catch((e) => {
          console.error('Error: Multisig transaction not executed', e);
          set_isLoadingExecuting(false);
          sendNotification({
            notificationPayload: {
              source: 'safe',
              name: `Multisig transaction not executed. ${JSON.stringify(e)}`,
              url: null,
              timeout: null,
            },
            toastPayload: { message: `Multisig transaction not executed. ${JSON.stringify(e)}`, type: 'error' },
            dispatch,
          });
        });
    }
  };

  const approveTx = (transaction: SafeMultisigTransactionResponse) => {
    if (signer) {
      set_isLoadingApproving(true);
      dispatch(
        safeActionsAsync.confirmTransactionThunk({
          signer,
          safeAddress: transaction.safe,
          safeTransactionHash: transaction.safeTxHash,
        })
      )
        .unwrap()
        .then(() => {
          set_isLoadingApproving(false);
        })
        .catch(() => {
          set_isLoadingApproving(false);
        });
    }
  };

  const rejectTx = (transaction: SafeMultisigTransactionResponse) => {
    if (signer) {
      set_isLoadingRejecting(true);
      dispatch(
        safeActionsAsync.createSafeRejectionTransactionThunk({
          signer,
          safeAddress: transaction.safe,
          nonce: transaction.nonce,
        })
      )
        .unwrap()
        .then(() => {
          set_isLoadingRejecting(false);
        })
        .catch(() => {
          set_isLoadingRejecting(false);
        });
    }
  };

  // <Tooltip
  //   title={`It apears that your safe threshold is not the same as the number of confirmations required for the transaction. It could be the indexer fault. Please wait about 1h untill the data is indexed.`}
  // >

  if (userAction === 'EXECUTE') {
    return (
      <>
        <StyledButtonGroup>
          <Tooltip
            title={
              possibleThresholdProblem
                ? `WARNING: It apears that your safe threshold is not the same as the number of confirmations required for this transaction. It could be the indexer fault. Please wait about 1h untill the data is indexed.`
                : transactionAfterSafeNonce && `Earlier actions should be handled first`
            }
          >
            <span>
              <StyledBlueButton
                disabled={transactionAfterSafeNonce}
                onClick={() => rejectTx(transaction)}
              >
                REJECT
              </StyledBlueButton>
            </span>
          </Tooltip>
          <Tooltip
            title={
              possibleThresholdProblem
                ? `WARNING: It apears that your safe threshold is not the same as the number of confirmations required for this transaction. It could be the indexer fault. Please wait about 1h untill the data is indexed.`
                : transactionAfterSafeNonce && `Earlier actions should be handled first`
            }
          >
            <span>
              <StyledBlueButton
                className="positive-action"
                disabled={transactionAfterSafeNonce}
                onClick={() => executeTx(transaction)}
                pending={isLoadingExecuting}
              >
                EXECUTE
              </StyledBlueButton>
            </span>
          </Tooltip>
        </StyledButtonGroup>
        {isLoadingExecuting && <p>Executing transaction...</p>}
        {isLoadingRejecting && <p>Rejecting transaction...</p>}
      </>
    );
  } else {
    return (
      <>
        <StyledButtonGroup>
          <Tooltip title={transactionAfterSafeNonce && `Earlier actions should be handled first`}>
            <span>
              <StyledBlueButton
                disabled={transactionAfterSafeNonce}
                onClick={() => rejectTx(transaction)}
              >
                Reject
              </StyledBlueButton>
            </span>
          </Tooltip>
          {/* If there is no user action it is because the user has already signed */}
          <Tooltip title={!userAction && 'You have already approved'}>
            <span>
              <StyledBlueButton
                className="positive-action"
                onClick={() => approveTx(transaction)}
                disabled={!userAction}
              >
                Approve
              </StyledBlueButton>
            </span>
          </Tooltip>
        </StyledButtonGroup>
        {isLoadingApproving && <p>Approving transaction with nonce...</p>}
      </>
    );
  }
};

const PendingTransactionRow = ({ transaction }: { transaction: CustomSafeMultisigTransactionResponse }) => {
  const address = useAppSelector((store) => store.web3.account);
  const safeNonce = useAppSelector((store) => store.safe.info.data?.nonce);
  const signer = useEthersSigner();
  const dispatch = useAppDispatch();
  const [open, set_open] = useState(false);
  const [userAction, set_userAction] = useState<'EXECUTE' | 'SIGN' | null>(null);
  // value can represent token value or json params of data
  const [value, set_value] = useState<string>();
  const [currency, set_currency] = useState<string>('');
  const [dateInUserTimezone, set_dateInUserTimezone] = useState<string>();
  const [dateInGMT, set_dateInGMT] = useState<string>();
  const [transactionStatus, set_transactionStatus] = useState<string>();

  useEffect(() => {
    if (signer && transaction) {
      getValueFromTransaction(transaction, signer).then((value) => {
        console.log('gotValueFromTransaction', value);
        const valueString = value?.toString();
        set_value(valueString);
      });
      set_dateInGMT(calculateTimeInGMT(transaction.submissionDate));
      set_dateInUserTimezone(formatDateToUserTimezone(transaction.submissionDate));
      set_transactionStatus(getTransactionStatus());
    }
  }, [signer, transaction]);

  useEffect(() => {
    if (address) {
      const userActionForPendingTransaction = getUserActionForPendingTransaction(transaction, address);
      console.log('userActionForPendingTransaction', userActionForPendingTransaction);
      set_userAction(userActionForPendingTransaction);
    }
  }, [address, transaction]);

  const getTransactionStatus = () => {
    if (userAction === 'EXECUTE') {
      return 'Awaiting execution';
    }

    if (userAction === 'SIGN') {
      return 'Needs your confirmation ';
    }

    return 'Awaiting confirmation';
  };

  const getCurrencyFromTransaction = async (
    transaction: SafeMultisigTransactionResponse,
    signer: ethers.providers.JsonRpcSigner
  ) => {
    const isNativeTransaction = !transaction.data;
    if (isNativeTransaction) {
      return 'xDai';
    }
    const token = await dispatch(
      safeActionsAsync.getToken({
        signer,
        tokenAddress: transaction.to,
      })
    ).unwrap();

    if (!token || (!token.name && !token.symbol)) {
      // this is not a token contract
      return JSON.stringify(transaction.dataDecoded);
    }

    return token.symbol;
  };

  const getValueFromTransaction = async (
    transaction: SafeMultisigTransactionResponse,
    signer: ethers.providers.JsonRpcSigner
  ) => {
    const isNativeTransaction = !transaction.data;
    console.log('getValueFromTransaction', transaction);

    // Rejection
    if (transaction.safe === transaction.to && !BigInt(transaction.value)) {
      return '';
    }
    const currency = getCurrencyFromTransaction(transaction, signer);
    if (isNativeTransaction) {
      return formatEther(BigInt(transaction.value)) + ' ' + currency;
    }

    // change allowance:
    //cap: approve
    // data: { "method": "approve", "parameters": [ { "name": "spender", "type": "address", "value": "0x693Bac5ce61c720dDC68533991Ceb41199D8F8ae" }, { "name": "value", "type": "uint256", "value": "1000000000000000000000" } ] }

    try {
      if (
        transaction.dataDecoded &&
        typeof transaction.dataDecoded === 'object' &&
        !Array.isArray(transaction.dataDecoded)
      ) {
        // @ts-ignore
        if (transaction?.dataDecoded?.method === 'addOwnerWithThreshold') {
          // @ts-ignore
          return transaction.dataDecoded.parameters[0].value;
        }
        // if (transaction.request === 'Rejection') {
        //   return ;
        // }
      }
    } catch (e) {}
    const token = await dispatch(
      safeActionsAsync.getToken({
        signer,
        tokenAddress: transaction.to,
      })
    ).unwrap();

    if (!token || (!token.name && !token.symbol)) {
      // this is not a token contract
      return JSON.stringify(transaction.dataDecoded);
    }

    try {
      const decodedData = decodeFunctionData({
        data: transaction.data as Address,
        // assuming it is a erc20 token because we want to get the value
        abi: erc20Abi,
      });

      const value = getValueFromERC20Functions(decodedData);

      return value;
    } catch (e) {
      console.log('the data may not decode', e);
      // if the function is not from an abi stated above
      // the data may not decode
      return null;
    }
  };

  const getValueFromERC20Functions = (
    decodedData: ReturnType<typeof decodeFunctionData<typeof erc20Abi>>
  ): string | null => {
    if (decodedData.functionName === 'transfer') {
      return formatEther(decodedData.args[1]);
    }

    if (decodedData.functionName === 'approve') {
      return formatEther(decodedData.args[1]);
    }

    if (decodedData.functionName === 'transferFrom') {
      return formatEther(decodedData.args[2]);
    }

    return null;
  };

  return (
    <>
      <StyledPendingTableRow className={(safeNonce ?? 0) < transaction.nonce ? 'disabled' : ''}>
        <TableCell
          component="th"
          scope="row"
        >
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => set_open(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
          <Tooltip title={dateInGMT}>
            <span>{dateInUserTimezone}</span>
          </Tooltip>
        </TableCell>
        <TableCell align="left">{transaction.source}</TableCell>
        <TableCell align="left">{transaction.request}</TableCell>
        <TableCell align="left">{value}</TableCell>
        <TableCell align="left">
          <ActionButtons transaction={transaction} />
        </TableCell>
      </StyledPendingTableRow>
      <StyledPendingTableRow className={(safeNonce ?? 0) < transaction.nonce ? 'disabled' : ''}>
        <StyledCollapsibleCell colSpan={6}>
          <Collapse
            in={open}
            timeout="auto"
            unmountOnExit
          >
            <StyledBox>
              <List>
                <p>Nonce: {transaction.nonce}</p>
                <p>Created: {dateInUserTimezone}</p>
                <StyledTransactionHashWithIcon>
                  <p>To:</p>
                  <TruncatedEthereumAddressWithTooltip address={transaction.to} />
                  <GnosisLink
                    href={`${GNOSIS_BASE_URL}/address/${transaction.to}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <OpenInNewIcon />
                  </GnosisLink>
                </StyledTransactionHashWithIcon>
                <StyledTransactionHashWithIcon>
                  <p>Safe hash:</p>
                  <TruncatedEthereumAddressWithTooltip address={transaction.safeTxHash} />
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.safeTxHash);
                    }}
                  >
                    {' '}
                    <ContentCopyIcon />
                  </IconButton>
                </StyledTransactionHashWithIcon>
                <StyledJSON>
                  {!!transaction.dataDecoded && <p>data: {JSON.stringify(transaction.dataDecoded, null, 8)}</p>}
                </StyledJSON>
              </List>
              <Divider
                orientation="vertical"
                variant="middle"
                flexItem
              />
              <List>
                <p>status: {transactionStatus}</p>
                <h4>Confirmations {`(${transaction.confirmations?.length}/${transaction.confirmationsRequired})`}</h4>
                {transaction.confirmations?.map((confirmation) => (
                  <StyledTransactionHashWithIcon key={confirmation.owner}>
                    <span>-</span>
                    <TruncatedEthereumAddressWithTooltip address={confirmation.owner} />
                    <GnosisLink
                      href={`${GNOSIS_BASE_URL}/address/${confirmation.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <OpenInNewIcon />
                    </GnosisLink>
                  </StyledTransactionHashWithIcon>
                ))}
              </List>
            </StyledBox>
          </Collapse>
        </StyledCollapsibleCell>
      </StyledPendingTableRow>
    </>
  );
};

function EthereumTransactionRow(props: { transaction: CustomEthereumTxWithTransfersResponse }) {
  const { transaction } = props;
  const [open, set_open] = useState(false);
  const [date, set_date] = useState<string>();
  const [time, set_time] = useState<string>();

  useEffect(() => {
    set_date(formatDateToUserTimezone(transaction.executionDate));
    set_time(formatTimeToUserTimezone(transaction.executionDate));
  }, []);

  return (
    <>
      <StyledHistoryTableRow>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => set_open(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
          {date}
        </TableCell>
        <TableCell align="right">{time}</TableCell>
        <TableCell align="right">
          <TruncatedEthereumAddressWithTooltip address={transaction.source} />
        </TableCell>
        <TableCell align="right">{transaction.request}</TableCell>
        <TableCell align="right">{`${
          transaction.value && transaction.value.length > 18
            ? transaction.value.slice(0, 18).concat('...')
            : transaction.value
        } ${transaction.currency}`}</TableCell>
      </StyledHistoryTableRow>
      <StyledHistoryTableRow>
        <StyledCollapsibleCell colSpan={6}>
          <Collapse
            in={open}
            timeout="auto"
            unmountOnExit
          >
            <StyledBox>
              <List>
                <p>Executed: {transaction.executionDate}</p>
                <StyledTransactionHashWithIcon>
                  <span>From: {truncateEthereumAddress(transaction.from)}</span>
                  <GnosisLink
                    href={`${GNOSIS_BASE_URL}/address/${transaction.from}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <OpenInNewIcon />
                  </GnosisLink>
                </StyledTransactionHashWithIcon>
                <StyledTransactionHashWithIcon>
                  <span>To: {truncateEthereumAddress(transaction.to)}</span>
                  <GnosisLink
                    href={`${GNOSIS_BASE_URL}/address/${transaction.to}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <OpenInNewIcon />
                  </GnosisLink>
                </StyledTransactionHashWithIcon>
                <StyledTransactionHashWithIcon>
                  <span>Transaction hash: {truncateEthereumAddress(transaction.txHash)}</span>
                  <GnosisLink
                    href={`${GNOSIS_BASE_URL}/tx/${transaction.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <OpenInNewIcon />
                  </GnosisLink>
                </StyledTransactionHashWithIcon>
              </List>
            </StyledBox>
          </Collapse>
        </StyledCollapsibleCell>
      </StyledHistoryTableRow>
    </>
  );
}

function MultisigTransactionRow(props: { transaction: CustomSafeMultisigTransactionWithTransfersResponse }) {
  const { transaction } = props;
  const [open, set_open] = useState(false);
  const [date, set_date] = useState<string>();
  const [time, set_time] = useState<string>();

  useEffect(() => {
    set_date(formatDateToUserTimezone(transaction.executionDate ?? transaction.submissionDate));
    set_time(formatTimeToUserTimezone(transaction.executionDate ?? transaction.submissionDate));
  }, []);

  return (
    <>
      <StyledHistoryTableRow className={!transaction.isExecuted ? 'rejected' : ''}>
        <TableCell
          component="th"
          scope="row"
        >
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => set_open(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
          {date}
        </TableCell>
        <TableCell>{time}</TableCell>
        <TableCell align="right">
          <TruncatedEthereumAddressWithTooltip address={transaction.source} />
        </TableCell>
        <TableCell align="right">{transaction.request}</TableCell>
        <TableCell align="right">{`${
          transaction.value && transaction.value.length > 10
            ? transaction.value.slice(0, 10).concat('...')
            : transaction.value
        } ${transaction.currency}`}</TableCell>
      </StyledHistoryTableRow>
      <StyledHistoryTableRow className={!transaction.isExecuted ? 'rejected' : ''}>
        <StyledCollapsibleCell colSpan={6}>
          <Collapse
            in={open}
            timeout="auto"
            unmountOnExit
          >
            <StyledBox>
              <List>
                <p>Created: {transaction.submissionDate}</p>
                <StyledTransactionHashWithIcon>
                  <p>To:</p>
                  <TruncatedEthereumAddressWithTooltip address={transaction.to} />
                  <GnosisLink
                    href={`${GNOSIS_BASE_URL}/address/${transaction.to}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <OpenInNewIcon />
                  </GnosisLink>
                </StyledTransactionHashWithIcon>
                <StyledTransactionHashWithIcon>
                  <p>Safe hash:</p>
                  <TruncatedEthereumAddressWithTooltip address={transaction.safeTxHash} />
                  <IconButton
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.safeTxHash);
                    }}
                  >
                    {' '}
                    <ContentCopyIcon />
                  </IconButton>
                </StyledTransactionHashWithIcon>
                {transaction.isExecuted && (
                  <>
                    <StyledTransactionHashWithIcon>
                      <p>Transaction hash:</p>
                      <TruncatedEthereumAddressWithTooltip address={transaction.transactionHash} />
                      <GnosisLink
                        href={`${GNOSIS_BASE_URL}/tx/${transaction.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenInNewIcon />
                      </GnosisLink>
                    </StyledTransactionHashWithIcon>
                    <p>Executed: {transaction.executionDate}</p>
                  </>
                )}
              </List>
              <Divider
                orientation="vertical"
                variant="middle"
                flexItem
              />
              <List>
                <h4>Confirmations {`(${transaction.confirmations?.length}/${transaction.confirmationsRequired})`}</h4>
                {transaction.confirmations?.map((confirmation) => (
                  <StyledTransactionHashWithIcon key={confirmation.owner}>
                    <span>-</span>
                    <TruncatedEthereumAddressWithTooltip address={confirmation.owner} />
                    <GnosisLink
                      href={`${GNOSIS_BASE_URL}/address/${confirmation.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <OpenInNewIcon />
                    </GnosisLink>
                  </StyledTransactionHashWithIcon>
                ))}
                {transaction.executor && (
                  <>
                    <h4>Executor</h4>
                    <StyledTransactionHashWithIcon>
                      <span>-</span>
                      <TruncatedEthereumAddressWithTooltip address={transaction.executor} />
                      <GnosisLink
                        href={`${GNOSIS_BASE_URL}/address/${transaction.executor}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenInNewIcon />
                      </GnosisLink>
                    </StyledTransactionHashWithIcon>
                  </>
                )}
              </List>
            </StyledBox>
          </Collapse>
        </StyledCollapsibleCell>
      </StyledHistoryTableRow>
    </>
  );
}

function ModuleTransactionRow(props: { transaction: CustomSafeModuleTransactionWithTransfersResponse }) {
  const { transaction } = props;
  const [open, set_open] = useState(false);
  const [date, set_date] = useState<string>();
  const [time, set_time] = useState<string>();

  useEffect(() => {
    set_date(formatDateToUserTimezone(transaction.executionDate));
    set_time(formatTimeToUserTimezone(transaction.executionDate));
  }, []);

  return (
    <>
      <StyledHistoryTableRow>
        <TableCell
          component="th"
          scope="row"
        >
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => set_open(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
          {date}
        </TableCell>
        <TableCell align="right">{time}</TableCell>
        <TableCell align="right">
          <TruncatedEthereumAddressWithTooltip address={transaction.source} />
        </TableCell>
        <TableCell align="right">{transaction.request}</TableCell>
        <TableCell align="right">{`${
          transaction.value && transaction.value.length > 18
            ? transaction.value.slice(0, 18).concat('...')
            : transaction.value
        } ${transaction.currency}`}</TableCell>
      </StyledHistoryTableRow>
    </>
  );
}

function TransactionHistoryRow(props: { transaction: NonNullable<CustomAllTransactionsListResponse>['results'][0] }) {
  const { transaction } = props;

  const getTransactionTypeRow = (transaction: NonNullable<CustomAllTransactionsListResponse>['results'][0]) => {
    if (transaction.txType === 'ETHEREUM_TRANSACTION') {
      return <EthereumTransactionRow transaction={transaction} />;
    } else if (transaction.txType === 'MULTISIG_TRANSACTION') {
      return <MultisigTransactionRow transaction={transaction} />;
    } else if (transaction.txType === 'MODULE_TRANSACTION') {
      return <ModuleTransactionRow transaction={transaction} />;
    } else {
      return <></>;
    }
  };

  return getTransactionTypeRow(transaction);
}

function TransactionHistoryTable() {
  const dispatch = useAppDispatch();
  const safeTransactions = useAppSelector((store) => store.safe.allTransactions.data);
  const selectedSafeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);
  const signer = useEthersSigner();

  const fetchAllSafeTransaction = () => {
    if (signer && selectedSafeAddress) {
      dispatch(
        safeActionsAsync.getAllSafeTransactionsThunk({
          signer,
          safeAddress: selectedSafeAddress,
        })
      );
    }
  };

  useEffect(() => {
    fetchAllSafeTransaction();
  }, [signer, selectedSafeAddress]);

  if (!selectedSafeAddress) {
    return <div>connect to safe</div>;
  }

  return (
    <TableContainer
      component={StyledPaper}
      title="Transaction history"
    >
      <Table aria-label="safe transaction history">
        <StyledTableHead>
          <StyledHistoryTableRow>
            <TableCell>Date</TableCell>
            <TableCell align="right">Time</TableCell>
            <TableCell align="right">Source</TableCell>
            <TableCell align="right">Capability</TableCell>
            <TableCell align="right">Value</TableCell>
          </StyledHistoryTableRow>
        </StyledTableHead>
        <TableBody>
          {safeTransactions?.results.map((transaction, key) => (
            <TransactionHistoryRow
              transaction={transaction}
              key={key}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const PendingTransactionsTable = () => {
  const dispatch = useAppDispatch();
  const pendingTransactions = useAppSelector((store) => store.safe.pendingTransactions.data);
  const selectedSafeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);
  const signer = useEthersSigner();

  useEffect(() => {
    if (signer && selectedSafeAddress) {
      dispatch(
        safeActionsAsync.getPendingSafeTransactionsThunk({
          safeAddress: selectedSafeAddress,
          signer,
        })
      );
    }

    const updateSafeNonceInterval = setInterval(() => {
      if (!signer || !selectedSafeAddress) return;
      // update safe nonce
      dispatch(
        safeActionsAsync.getSafeInfoThunk({
          signer: signer,
          safeAddress: selectedSafeAddress,
        })
      );
    }, 10000);

    return () => {
      clearInterval(updateSafeNonceInterval);
    };
  }, [selectedSafeAddress]);

  const sortByNonce = (pendingTransactions: CustomSafeMultisigTransactionListResponse) => {
    if (!pendingTransactions?.count) return null;
    const sortedCopy: CustomSafeMultisigTransactionListResponse = JSON.parse(JSON.stringify(pendingTransactions));

    // sort from oldest date to newest
    return sortedCopy?.results.sort(
      (prevDay, nextDay) => prevDay.nonce - nextDay.nonce
    ) as CustomSafeMultisigTransactionResponse[];
  };

  return !selectedSafeAddress ? (
    <Title>Connect to safe</Title>
  ) : (
    <TableContainer component={StyledPaper}>
      <Table aria-label="safe pending transactions">
        <StyledTableHead>
          <StyledPendingTableRow>
            <TableCell>Date</TableCell>
            <TableCell align="left">Source</TableCell>
            <TableCell align="left">Capability</TableCell>
            <TableCell align="left">Value</TableCell>
            <TableCell align="left">Action</TableCell>
            <TableCell />
          </StyledPendingTableRow>
        </StyledTableHead>
        <TableBody>
          {pendingTransactions &&
            !!pendingTransactions?.count &&
            sortByNonce(pendingTransactions)?.map((transaction, key) => (
              <PendingTransactionRow
                transaction={transaction}
                key={key}
              />
            ))}
          {pendingTransactions && !pendingTransactions?.count && <div style={{ margin: '16px' }}>No entries</div>}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

function SafeActions() {
  return (
    <StyledContainer>
      <div>
        <Title>pending transactions</Title>
        <p>1. Transactions have to be signed/rejected in the order they appear in the table below.</p>
        <p>2. Once a transaction is signed, anyone can execute it.</p>
      </div>
      <PendingTransactionsTable />
      <Title>history</Title>
      <TransactionHistoryTable />
    </StyledContainer>
  );
}

export default SafeActions;
