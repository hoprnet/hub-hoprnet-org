import styled from '@emotion/styled';
import { SafeMultisigTransactionResponse } from '@safe-global/safe-core-sdk-types';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Address, parseUnits, getAddress } from 'viem';
import {
  GNOSIS_CHAIN_HOPR_BOOST_NFT,
  wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
  xHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
} from '../../../config';
import { useEthersSigner } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store';
import { safeActions, safeActionsAsync } from '../../store/slices/safe';
import { createSendNftTransactionData, createSendTokensTransactionData } from '../../utils/blockchain';

// components
import Card from '../../components/Card';
import NetworkOverlay from '../../components/Overlays/NetworkOverlay';
import Section from '../../future-hopr-lib-components/Section';
import { MaxButton } from './wrapper';

// Mui
import { SelectChangeEvent } from '@mui/material/Select';
import {
  TextField,
  InputAdornment
 } from '@mui/material';
import { FeedbackTransaction } from '../../components/FeedbackTransaction';
import SafeTransactionButton from '../../components/SafeTransactionButton';
import Select from '../../future-hopr-lib-components/Select';
import { browserClient } from '../../providers/wagmi';
import { getUserActionForPendingTransaction } from '../../utils/safeTransactions';

const StyledForm = styled.div`
  width: 100%;
  display: flex;
  align-items: baseline;
  gap: 1rem;
  border-bottom: 1px solid #414141;
  justify-content: center;
  padding-bottom: 16px;
`;

const StyledDescription = styled.p`
  color: #414141;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 21px;
  letter-spacing: 0.35px;
`;

const StyledInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: baseline;
  gap: 10px;
  width: 100%;
  max-width: 450px;
`;

const StyledCoinLabel = styled.p`
  color: var(--414141, #414141);
  font-size: 15px;
  font-style: normal;
  font-weight: 400;
  letter-spacing: 0.35px;
`;

const StyledButtonGroup = styled.div`
  margin-top: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
`;

const StyledPendingSafeTransactions = styled.div`
  display: flex;
  flex-direction: column;
`;

const InputWithLabel = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
`;

const SUPPORTED_TOKENS = {
  xdai: {
    value: 'xdai',
    name: 'xDai',
    icon: (
      <img
        src="/assets/xDaiIcon.svg"
        alt="Safe Icon"
      />
    ),
  },
  wxhopr: {
    name: 'wxHOPR',
    value: 'wxhopr',
    smartContract: wxHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
    icon: (
      <img
        src="/assets/wxHoprIcon.svg"
        alt="wxHOPR Icon"
      />
    ),
  },
  xhopr: {
    name: 'xHOPR',
    value: 'xhopr',
    smartContract: xHOPR_TOKEN_SMART_CONTRACT_ADDRESS,
    icon: (
      <img
        src="/assets/xHoprIcon.svg"
        alt="xHOPR Icon"
      />
    ),
  },
  // nft: {
  //   name: 'NFT',
  //   value: 'nft',
  //   smartContract: GNOSIS_CHAIN_HOPR_BOOST_NFT,
  // },
} as const;

function SafeWithdraw() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // hooks
  const [searchParams, setSearchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');
  const pendingTransactions = useAppSelector((store) => store.safe.pendingTransactions.data);
  const selectedSafeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);
  const safeInfo = useAppSelector((store) => store.safe.info.data);
  const address = useAppSelector((store) => store.web3.account);
  const communityNftIds = useAppSelector((store) => store.safe.communityNftIds.data);
  const safeBalances = useAppSelector((store) => store.safe.balance.data);
  const signer = useEthersSigner();
  // local state
  const [userAction, set_userAction] = useState<'EXECUTE' | 'SIGN' | null>(null);
  const [ethValue, set_ethValue] = useState<string>('');
  const [nftId, set_nftId] = useState<string>('');
  const [receiver, set_receiver] = useState<string>('');
  const [isWalletLoading, set_isWalletLoading] = useState<boolean>();
  const [transactionHash, set_transactionHash] = useState<Address>();
  const [error, set_error] = useState<string | null>(null);
  const [token, set_token] = useState<keyof typeof SUPPORTED_TOKENS>(
    tokenParam && tokenParam in SUPPORTED_TOKENS ? (tokenParam as keyof typeof SUPPORTED_TOKENS) : 'xdai'
  );
  const [proposedTxHash, set_proposedTxHash] = useState<string>();
  const [proposedTx, set_proposedTx] = useState<SafeMultisigTransactionResponse>();

  const safeBalance_xDai = safeBalances.xDai.value;
  const safeBalance_wxHOPR = safeBalances.wxHopr.value;
  const safeBalance_xHOPR = safeBalances.xHopr.value;

  useEffect(() => {
    if (proposedTxHash) {
      const foundProposedTx = pendingTransactions?.results.find((tx) => tx.transactionHash === proposedTxHash);
      if (foundProposedTx && address) {
        set_proposedTx(foundProposedTx);
        set_userAction(getUserActionForPendingTransaction(foundProposedTx, address));
      }
    }
  }, [pendingTransactions, proposedTxHash, address]);

  useEffect(() => {
    // if token is set in the URL
    if (tokenParam && tokenParam in SUPPORTED_TOKENS) {
      if (tokenParam === 'wxhopr' && safeBalance_wxHOPR && BigInt(safeBalance_wxHOPR) > BigInt(0)) {
        set_token(tokenParam as keyof typeof SUPPORTED_TOKENS);
      } else if (tokenParam === 'xhopr' && safeBalance_xHOPR && BigInt(safeBalance_xHOPR) > BigInt(0)) {
        set_token(tokenParam as keyof typeof SUPPORTED_TOKENS);
      } else {
        set_token('xdai');
      }
      // if no token is set in the URL
    } else {
      if (safeBalance_xDai && BigInt(safeBalance_xDai) > BigInt(0)) {
        set_token('xdai');
      } else if (safeBalance_wxHOPR && BigInt(safeBalance_wxHOPR) > BigInt(0)) {
        set_token('wxhopr');
      } else if (safeBalance_xHOPR && BigInt(safeBalance_xHOPR) > BigInt(0)) {
        set_token('xhopr');
      } else {
        set_token('xdai');
      }
    }
  }, [tokenParam, safeBalance_xDai, safeBalance_wxHOPR, safeBalance_xHOPR]);

  const signTx = () => {
    set_error(null);
    if (signer && selectedSafeAddress) {
      set_isWalletLoading(true);

      if (token === 'xdai') {
        const parsedValue = Number(ethValue) ? parseUnits(ethValue as `${number}`, 18).toString() : 0;
        return dispatch(
          safeActionsAsync.createSafeTransactionThunk({
            signer,
            safeAddress: selectedSafeAddress,
            safeTransactionData: {
              to: getAddress(receiver),
              value: parsedValue as string,
              data: '0x',
            },
          })
        )
          .unwrap()
          .then((safeTxHash) => {
            set_proposedTxHash(safeTxHash);
            navigate('/staking/dashboard#transactions');
          })
          .catch((e) => {
            if (e.message) set_error(`ERROR: ${JSON.stringify(e.message)}`);
            else set_error(`ERROR: ${JSON.stringify(e)}`);
          })
          .finally(() => {
            set_isWalletLoading(false);
          });
      }

      // if (token === 'nft') {
      //   const smartContractAddress = SUPPORTED_TOKENS[token].smartContract;
      //   return dispatch(
      //     safeActionsAsync.createSafeContractTransactionThunk({
      //       data: createSendNftTransactionData(
      //         getAddress(selectedSafeAddress) as Address,
      //         getAddress(receiver) as Address,
      //         Number(nftId)
      //       ),
      //       signer,
      //       safeAddress: getAddress(selectedSafeAddress),
      //       smartContractAddress,
      //     })
      //   )
      //     .unwrap()
      //     .then((transactionResponse) => {
      //       set_proposedTxHash(transactionResponse);
      //       navigate('/staking/dashboard#transactions');
      //     })
      //     .catch((e) => {
      //       if (e.message) set_error(`ERROR: ${JSON.stringify(e.message)}`);
      //       else set_error(`ERROR: ${JSON.stringify(e)}`);
      //     })
      //     .finally(() => {
      //       set_isWalletLoading(false);
      //     });
      // }
      // else {
      const smartContractAddress = SUPPORTED_TOKENS[token].smartContract;
      const parsedValue = Number(ethValue) ? parseUnits(ethValue as `${number}`, 18).toString() : BigInt(0);
      return dispatch(
        safeActionsAsync.createSafeContractTransactionThunk({
          data: createSendTokensTransactionData(getAddress(receiver) as `0x${string}`, parsedValue as bigint),
          signer,
          safeAddress: getAddress(selectedSafeAddress),
          smartContractAddress,
        })
      )
        .unwrap()
        .then((safeTxHash) => {
          set_proposedTxHash(safeTxHash);
          navigate('/staking/dashboard#transactions');
        })
        .catch((e) => {
          if (e.message) set_error(`ERROR: ${JSON.stringify(e.message)}`);
          else set_error(`ERROR: ${JSON.stringify(e)}`);
        })
        .finally(() => {
          set_isWalletLoading(false);
        });
      //}
    }
  };

  const createAndExecuteTx = async () => {
    set_error(null);
    if (!signer || !selectedSafeAddress) return;
    try {
      set_isWalletLoading(true);
      if (token === 'xdai') {
        const parsedValue = Number(ethValue) ? parseUnits(ethValue as `${number}`, 18).toString() : 0;
        return dispatch(
          safeActionsAsync.createAndExecuteSafeTransactionThunk({
            signer,
            safeAddress: selectedSafeAddress,
            safeTransactionData: {
              to: getAddress(receiver),
              value: parsedValue as string,
              data: '0x',
            },
          })
        )
          .unwrap()
          .then((transactionResponse) => {
            set_transactionHash(transactionResponse as Address);
          })
          .finally(() => {
            set_isWalletLoading(false);
          });
      }
      // if (token === 'nft') {
      //   const smartContractAddress = SUPPORTED_TOKENS[token].smartContract;

      //   await dispatch(
      //     safeActionsAsync.createAndExecuteSafeContractTransactionThunk({
      //       data: createSendNftTransactionData(getAddress(selectedSafeAddress) as Address, getAddress(receiver) as Address, Number(nftId)),
      //       signer,
      //       safeAddress: getAddress(selectedSafeAddress),
      //       smartContractAddress,
      //     }),
      //   )
      //     .unwrap()
      //     .then((transactionResponse) => {
      //       browserClient?.waitForTransactionReceipt({ hash: transactionResponse as Address }).then(() => {
      //         dispatch(safeActions.removeCommunityNftsOwnedBySafe(nftId));
      //       });
      //       set_proposedTxHash(transactionResponse);
      //     })
      //     .finally(() => {
      //       set_isWalletLoading(false);
      //     });
      // }
      // else {
      const smartContractAddress = SUPPORTED_TOKENS[token].smartContract;
      const parsedValue = Number(ethValue) ? parseUnits(ethValue as `${number}`, 18).toString() : BigInt(0);
      return dispatch(
        safeActionsAsync.createAndExecuteSafeContractTransactionThunk({
          data: createSendTokensTransactionData(getAddress(receiver) as `0x${string}`, parsedValue as bigint),
          signer,
          safeAddress: getAddress(selectedSafeAddress),
          smartContractAddress,
        }))
        .unwrap()
        .then((transactionResponse) => {
          set_transactionHash(transactionResponse as Address);
        })
        .finally(() => {
          set_isWalletLoading(false);
        });
      // }
    } catch(e) {
      console.log('Error occurred while creating and executing transaction:', e);
      set_isWalletLoading(false);
      if (typeof e === 'object' && e !== null && 'shortMessage' in e && typeof e.shortMessage === 'string') {
        set_error((e as { shortMessage: string }).shortMessage);
      }
    }
  };

  const getErrorsForSafeTx = ({ customValidator }: { customValidator?: () => { errors: string[] } }) => {
    const errors: string[] = [];

    if (!signer) {
      errors.push('Wallet is required');
    }

    if (!selectedSafeAddress) {
      errors.push('Safe is required');
    }

    if (!receiver) {
      errors.push('Receiver is required');
    }

    // only require xDai value if there
    // is no proposed tx
    if (
      !ethValue &&
      !proposedTx
      //  && token !== 'nft'
    ) {
      errors.push('xDai value is required');
    }

    // if (token === 'nft' && !nftId) {
    //   errors.push('NFT required');
    // }

    if (customValidator) {
      const customErrors = customValidator();
      errors.push(...customErrors.errors);
    }

    return errors;
  };

  const getErrorsForApproveButton = () =>
    getErrorsForSafeTx({
      customValidator: () => {
        return Number(ethValue) ? { errors: [] } : { errors: ['xdai value is required'] };
      },
    });

  const getErrorsForExecuteButton = () =>
    getErrorsForSafeTx({
      customValidator: () => {
        // no user action means the user can not do anything
        return !userAction ? { errors: [] } : { errors: ['transaction requires more approvals'] };
      },
    });

  const handleChangeToken = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as string;
    if (value in SUPPORTED_TOKENS) {
      set_token(value as keyof typeof SUPPORTED_TOKENS);
      setSearchParams(`token=${value}`);
    }
  };

  const handleChangeNftId = (event: SelectChangeEvent<unknown>) => {
    if (error) set_error(null);
    const value = event.target.value as string;
    if (value) {
      set_nftId(value);
    }
  };

  const getTokenAvailable = (token: keyof typeof SUPPORTED_TOKENS): boolean => {
    // if (token === 'nft') {
    //   return !!communityNftIds.length;
    // } else
    if (token === 'xdai') {
      return !!safeBalances.xDai.value && BigInt(safeBalances.xDai.value) > BigInt(0);
    } else if (token === 'wxhopr') {
      return !!safeBalances.wxHopr.value && BigInt(safeBalances.wxHopr.value) > BigInt(0);
    } else if (token === 'xhopr') {
      return !!safeBalances.xHopr.value && BigInt(safeBalances.xHopr.value) > BigInt(0);
    }

    return false;
  };

  const setMaxAmount = () => {
    if (token === 'xdai' && safeBalances.xDai.formatted) {
      set_ethValue(safeBalances.xDai.formatted);
    } else if (token === 'wxhopr' && safeBalances.wxHopr.formatted) {
      set_ethValue(safeBalances.wxHopr.formatted);
    } else if (token === 'xhopr' && safeBalances.xHopr.formatted) {
      set_ethValue(safeBalances.xHopr.formatted);
    }
  }

  return (
    <Section
      lightBlue
      center
      fullHeightMin
    >
      <Card
        image={{
          src: '/assets/funds-safe-withdraw.svg',
          height: 130,
          alt: 'Withdraw Token from Safe',
        }}
        title="Withdraw from Safe"
      >
        <div>
          <StyledForm>
            <StyledInputGroup>
              <InputWithLabel
                style={{
                  width: '100%',
                }}
              >
                <Select
                  size="small"
                  values={Object.values(SUPPORTED_TOKENS).map((t) => ({
                    name: t.name,
                    value: t.value,
                    disabled: !getTokenAvailable(t.value),
                    icon: t.icon,
                  }))}
                  value={token}
                  onChange={handleChangeToken}
                  style={{
                    width: '100%',
                    margin: 0,
                  }}
                  label="Token"
                />
              </InputWithLabel>
              <InputWithLabel
                style={{
                  width: '100%',
                }}
              >
                <TextField
                  variant="outlined"
                  placeholder="-"
                  size="small"
                  value={receiver}
                  onChange={(e) => {
                    if (error) set_error(null);
                    set_receiver(e.target.value);
                  }}
                  label="Receiver"
                  fullWidth
                  autoComplete="off"
                  inputProps={{ autoComplete: 'off' }}
                />
              </InputWithLabel>
              {/* {token === 'nft' ? (
                <InputWithLabel>
                  <Select
                    size="small"
                    values={Object.values(communityNftIds).map((nft) => ({
                      name: nft.id,
                      value: nft.id,
                    }))}
                    value={nftId}
                    onChange={handleChangeNftId}
                    style={{
                      width: '230px',
                      margin: 0,
                    }}
                  />
                  <StyledCoinLabel>NFT ID</StyledCoinLabel>
                </InputWithLabel>
              ) : ( */}
              <InputWithLabel
                style={{
                  width: '100%',
                }}
              >
                <TextField
                  variant="outlined"
                  placeholder="-"
                  size="small"
                  value={ethValue}
                  onChange={(e) => {
                    if (error) set_error(null);
                    set_ethValue(e.target.value);
                  }}
                  inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                  }}
                  label={"Amount"}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {SUPPORTED_TOKENS[token].name}
                        <span style={{ marginLeft: '16px' }}/>
                        <MaxButton onClick={setMaxAmount}>Max</MaxButton>
                      </InputAdornment>
                    ),
                    inputProps: { min: 0 },
                  }}
                  fullWidth
                />
              </InputWithLabel>
              {/* )} */}
            </StyledInputGroup>
          </StyledForm>
          {!!proposedTx && (
            <StyledPendingSafeTransactions>
              <StyledDescription>
                {userAction === 'EXECUTE'
                  ? 'transaction has been approved by required owners, now can be executed'
                  : `transaction is pending ${
                      (proposedTx?.confirmationsRequired ?? 0) - (proposedTx?.confirmations?.length ?? 0)
                    } approvals`}
              </StyledDescription>
            </StyledPendingSafeTransactions>
          )}
          <FeedbackTransaction
            confirmations={1}
            isWalletLoading={isWalletLoading}
            transactionHash={transactionHash}
            feedbackTexts={{ loading: 'Please wait while we confirm the transaction...' }}
            errorMessage={error}
          />
          <StyledButtonGroup>
            <SafeTransactionButton
              signOptions={{
                onClick: signTx,
                disabled: !!getErrorsForApproveButton().length || isWalletLoading,
                pending: isWalletLoading,
                tooltipText: isWalletLoading ? 'Signing transaction' : getErrorsForApproveButton().at(0),
              }}
              executeOptions={{
                onClick: createAndExecuteTx,
                pending: isWalletLoading,
                disabled: !!getErrorsForExecuteButton().length || isWalletLoading,
                tooltipText: isWalletLoading ? 'Executing transaction' : getErrorsForExecuteButton().at(0),
                transactionHash,
              }}
            />
          </StyledButtonGroup>
        </div>
      </Card>
      <NetworkOverlay />
    </Section>
  );
}

export default SafeWithdraw;
