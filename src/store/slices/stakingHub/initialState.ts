type InitialState = {
  safes: {
    data: {
      safeAddress: string;
      moduleAddress: string;
    }[];
    isFetching: boolean;
  };
  onboarding: {
    step: number;
    notFinished: boolean;
    nodeAddress: string | null;
    nodeBalance: {
      xDai: {
        value: string | null;
        formatted: string | null;
      };
    };
    safeAddress: string | null;
    notStarted: boolean | null;
    modalToSartOnboardingDismissed: boolean;
    moduleAddress: string | null;
    userIsInOnboarding: boolean;
    nodeXDaiBalance: string | null;
    nodeAddressProvidedByMagicLink: string | null;
    isFetching: boolean;
  };
  safeInfo: {
    data: SubgraphParsedOutput;
    isFetching: boolean;
  };
  totalStaked: {
    data: TotalStaked | null;
    isFetching: boolean;
  };
  config: {
    needsUpdate: {
      data: boolean;
      strategy: string | null;
      isFetching: boolean;
    };
  };
  nodes: {
    data: { [key: string]: NodePayload };
    isFetching: boolean;
  };
};

export type NodePayload = {
  availability1y?: number | null;
  availability6m?: number;
  availability7d?: number;
  availability24h?: number;
  availability30d?: number;
  firstseen?: number;
  lastseen?: number;
  latency?: number;
  peeraddress: string;
  nodeAddress: string;
  peerid?: string;
  version?: string;
  isFetchingBalance?: boolean;
  balance?: string;
  balanceFormatted?: string;
  registeredNodesInNetworkRegistry?: boolean;
  registeredNodesInSafeRegistry?: boolean;
  includedInModule?: boolean;
};

type Owner = {
  owner: {
    id: string | null;
  };
};

export type SubgraphParsedOutput = {
  balance: {
    mHoprBalance: string | null;
    wxHoprBalance: string | null;
    xHoprBalance: string | null;
  };
  threshold: string | null;
  owners: Owner[];
  isCreatedByNodeStakeFactory: boolean | null;
  targetedModules: [
    {
      id: string | null;
    }
  ];
  allowance: {
    xHoprAllowance: string | null;
    wxHoprAllowance: string | null;
    mHoprAllowance: string | null;
    grantedToChannelsContract: string | null;
  };
  addedModules: [
    {
      module: {
        id: string | null;
      };
    }
  ];
  isEligibleOnNetworkRegistry: boolean | null;
  registeredNodesInSafeRegistry: {
    node: {
      id: string | null;
    };
  }[];
  registeredNodesInSafeRegistryParsed: string[];
  registeredNodesInNetworkRegistry: {
    node: {
      id: string | null;
    };
  }[];
  registeredNodesInNetworkRegistryParsed: string[];
  module: {
    id: string | null;
    implementation: string | null;
    includedNodes:
      | [
          {
            node: {
              id: string | null;
            };
          }
        ]
      | [];
    multiSend: string | null;
    target: {
      id: string | null;
    };
  };
  overall_staking_v2_balances: {
    mHoprBalance: string | null;
    wxHoprBalance: string | null;
    xHoprBalance: string | null;
  };
};

export const initialState: InitialState = {
  safes: {
    data: [],
    isFetching: false,
  },
  onboarding: {
    step: 0,
    nodeAddress: null,
    safeAddress: null,
    moduleAddress: null,
    notFinished: false,
    userIsInOnboarding: false,
    nodeXDaiBalance: null,
    isFetching: true,
    notStarted: null,
    modalToSartOnboardingDismissed: false,
    nodeAddressProvidedByMagicLink: null,
    nodeBalance: {
      xDai: {
        value: null,
        formatted: null,
      },
    },
  },
  safeInfo: {
    data: {
      balance: {
        mHoprBalance: null,
        wxHoprBalance: null,
        xHoprBalance: null,
      },
      threshold: null,
      owners: [{ owner: { id: null } }],
      isCreatedByNodeStakeFactory: null,
      targetedModules: [{ id: null }],
      allowance: {
        xHoprAllowance: null,
        wxHoprAllowance: null,
        mHoprAllowance: null,
        grantedToChannelsContract: null,
      },
      addedModules: [{ module: { id: null } }],
      isEligibleOnNetworkRegistry: null,
      registeredNodesInSafeRegistry: [],
      registeredNodesInSafeRegistryParsed: [],
      registeredNodesInNetworkRegistry: [{ node: { id: null } }],
      registeredNodesInNetworkRegistryParsed: [],
      module: {
        id: null,
        implementation: null,
        includedNodes: [{ node: { id: null } }],
        multiSend: null,
        target: { id: null },
      },
      overall_staking_v2_balances: {
        mHoprBalance: null,
        wxHoprBalance: null,
        xHoprBalance: null,
      },
    },
    isFetching: false,
  },
  totalStaked: {
    data: null,
    isFetching: false,
  },
  config: {
    needsUpdate: {
      data: false,
      strategy: null,
      isFetching: false,
    },
  },
  nodes: {
    data: {},
    isFetching: false,
  },
};


export type TotalStaked = {
  mHoprBalance: string;
  wxHoprBalance: string;
  xHoprBalance: string;
};