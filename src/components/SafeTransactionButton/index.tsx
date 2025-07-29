import { SafeInfoResponse } from '@safe-global/api-kit';
import Button from '../../future-hopr-lib-components/Button';
import { useEffect, useState } from 'react';
import { getUserCanSkipProposal } from '../../utils/safeTransactions';
import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import { Address } from 'viem';
import { useWaitForTransactionReceipt } from 'wagmi';

type SafeButtonProps = {
  // connected safe info that contains threshold
  safeInfo: SafeInfoResponse | null;
  // specific props for sign button
  signOptions: {
    pending?: boolean;
    disabled?: boolean;
    tooltipText?: string;
    buttonText?: string;
    onClick: () => void;
  };
  // specific props for execute button
  executeOptions: {
    pending?: boolean;
    disabled?: boolean;
    tooltipText?: string;
    buttonText?: string;
    transactionHash?: Address;
    onClick: () => void;
  };
};

/**
 * Button to choose to either sign or execute transactions for safe.
 * If the transaction is signed by others it can not be executed by this button
 * Multisig execution should be handled in Transactions page
 */
export default function SafeTransactionButton(props: SafeButtonProps) {
  const [userCanSkipProposal, set_userCanSkipProposal] = useState(false);
  const [indexerDidNotWork, set_indexerDidNotWork] = useState(false);

  useEffect(() => {
    if (props.safeInfo) {
      set_indexerDidNotWork(false);
      set_userCanSkipProposal(getUserCanSkipProposal(props.safeInfo));
    } else {
      set_indexerDidNotWork(true);
    }
  }, [props.safeInfo]);

  let { status } = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: props.executeOptions?.transactionHash,
  });

  const txInProgress = props.executeOptions?.transactionHash && status === 'pending';

  if (userCanSkipProposal) {
    return (
      <Tooltip title={props.executeOptions.tooltipText}>
        <span>
          <Button
            pending={!!props.executeOptions?.pending || txInProgress}
            disabled={!!props.executeOptions?.disabled || txInProgress}
            onClick={props.executeOptions.onClick}
          >
            {props.executeOptions.buttonText ?? 'EXECUTE'}
          </Button>
        </span>
      </Tooltip>
    );
  } else if (indexerDidNotWork) {
    return (
      <Tooltip title={`Your safe wasn\'t indexed yet by HOPR Safe Infrastructure. Please try in 1 hour`}>
        <span>
          <Button disabled={true}>{props.signOptions.buttonText ?? 'SIGN'}</Button>
        </span>
      </Tooltip>
    );
  } else {
    return (
      <Tooltip title={props.signOptions.tooltipText}>
        <span>
          <Button
            pending={!!props.signOptions?.pending}
            disabled={!!props.signOptions?.disabled}
            onClick={props.signOptions.onClick}
          >
            {props.signOptions.buttonText ?? 'SIGN'}
          </Button>
        </span>
      </Tooltip>
    );
  }
}
