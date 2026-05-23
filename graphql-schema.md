# GraphQL Schema — blokli.jura.hoprnet.link

Endpoint: `https://blokli.jura.hoprnet.link/graphql`

Fetched: 2026-05-20

## Fetch command

```sh
curl -sS --ssl-no-revoke -X POST "https://blokli.jura.hoprnet.link/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"query IntrospectionQuery { __schema { types { name kind fields { name } inputFields { name } enumValues { name } } } }"}'
```

## Root Types

### QueryRoot
- `accounts`, `accountCount`
- `channelStats`, `channels`
- `hoprBalance`, `nativeBalance`, `safeHoprAllowance`
- `ticketRedemptionStats`, `transactionCount`
- `safeBy`, `safes`, `safesBalance`
- `chainInfo`, `compatibility`, `health`, `version`
- `calculateModuleAddress`, `transaction`

### MutationRoot
- `sendTransaction`
- `sendTransactionAsync`
- `sendTransactionSync`

### SubscriptionRoot
- `channelUpdated`
- `openedChannelGraphUpdated`
- `accountUpdated`
- `ticketParametersUpdated`
- `keyBindingFeeUpdated`
- `safeDeployed`
- `transactionUpdated`

## Object Types

### Account
`keyid`, `chainKey`, `packetKey`, `safeAddress`, `multiAddresses`

### AccountsList
`accounts`

### ChainInfo
`blockNumber`, `chainId`, `network`, `ticketPrice`, `keyBindingFee`, `gasPrice`, `maxFeePerGas`, `maxPriorityFeePerGas`, `minTicketWinningProbability`, `channelDst`, `contractAddresses`, `ledgerDst`, `safeRegistryDst`, `channelClosureGracePeriod`, `expectedBlockTime`, `finality`

### Channel
`concreteChannelId`, `source`, `destination`, `balance`, `status`, `epoch`, `ticketIndex`, `closureTime`

### ChannelStats
`count`, `balance`

### ChannelsList
`channels`

### Compatibility
`apiVersion`, `supportedClientVersions`, `features`

### Count
`count`

### HoprBalance
`address`, `balance`

### ModuleAddress
`moduleAddress`

### NativeBalance
`address`, `balance`

### OpenedChannelsGraphEntry
`channel`, `source`, `destination`

### RedeemedStats
`redeemedAmount`, `redemptionCount`

### Safe
`address`, `moduleAddress`, `threshold`, `owners`, `registeredNodes`

### SafeExecution
`success`, `safeTxHash`, `revertReason`

### SafeHoprAllowance
`address`, `allowance`

### SafesBalance
`balance`, `count`

### SafesList
`safes`

### SendTransactionSuccess
`transactionHash`

### TicketParameters
`minTicketWinningProbability`, `ticketPrice`

### Transaction
`id`, `status`, `submittedAt`, `transactionHash`, `safeExecution`

### TransactionCount
`address`, `count`

## Enums

### ChannelStatus
- `OPEN`
- `PENDINGTOCLOSE`
- `CLOSED`

### SafeSelectorInput
- `ADDRESS`
- `OWNER`
- `REGISTERED_NODE`

### TransactionStatus
- `SUBMITTED`
- `CONFIRMED`
- `REVERTED`
- `TIMEOUT`
- `VALIDATION_FAILED`
- `SUBMISSION_FAILED`

## Input Objects

### RedeemedStatsFilter
- `safeAddress`
- `nodeAddress`

### TransactionInput
- `rawTransaction`

## Union Result Types

`AccountsResult`, `CalculateModuleAddressResult`, `ChainInfoResult`, `ChannelStatsResult`, `ChannelsResult`, `CountResult`, `HoprBalanceResult`, `NativeBalanceResult`, `RedeemedStatsResult`, `SafeByResult`, `SafeHoprAllowanceResult`, `SafeResult`, `SafesBalanceResult`, `SafesResult`, `SendTransactionAsyncResult`, `SendTransactionResult`, `SendTransactionSyncResult`, `TransactionCountResult`, `TransactionResult`

## Error Types

- `ContractNotAllowedError` — `code`, `message`, `contractAddress`
- `FunctionNotAllowedError` — `code`, `message`, `contractAddress`, `functionSelector`
- `InvalidAddressError` — `code`, `message`, `address`
- `InvalidTransactionIdError` — `code`, `message`, `transactionId`
- `MissingFilterError` — `code`, `message`
- `QueryFailedError` — `code`, `message`
- `RpcError` — `code`, `message`
- `TimeoutError` — `code`, `message`

## Scalars

`Hex32`, `TokenValueString`, `ContractAddressMap`, `UInt64`, `DateTime`, plus standard `String`, `Int`, `Float`, `Boolean`, `ID`

## Deeper introspection

This snapshot omits field argument types and return type wrappers (`NON_NULL`, `LIST`, `ofType`). For a complete schema, run:

```sh
curl -sS --ssl-no-revoke -X POST "https://blokli.jura.hoprnet.link/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"query { __schema { types { name kind fields { name args { name type { name kind ofType { name kind ofType { name kind } } } } type { name kind ofType { name kind ofType { name kind } } } } inputFields { name type { name kind ofType { name kind } } } enumValues { name } } } }"}'
```
