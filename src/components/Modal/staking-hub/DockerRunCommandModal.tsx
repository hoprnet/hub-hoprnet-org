import { useState } from 'react';
import styled from '@emotion/styled';
import { DialogTitle } from '@mui/material';
import { SDialog, SDialogContent, SIconButton, TopBar } from '../../../future-hopr-lib-components/Modal/styled';
import { useAppSelector } from '../../../store';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';

// HOPR Components
import IconButton from '../../../future-hopr-lib-components/Button/IconButton';
import Button from '../../../future-hopr-lib-components/Button';
import { Button as MuiButton, Radio } from '@mui/material';
import { CodeContainer } from '../../../pages/staking-hub/onboarding/step3/1setupYourNode';

type DockerRunCommandModalProps = {
  normalButton?: boolean;
  disabled?: boolean;
};

type NodeType = 'dockerRun' | 'dockerCompose' | 'binary' | 'dappnode' | null;

export const DockerRunCommandModal = (props: DockerRunCommandModalProps) => {
  const [openModal, set_openModal] = useState(false);
  const [nodeType, set_nodeType] = useState<NodeType>(null);

  const handleOpenModal = () => {
    set_openModal(true);
  };

  const handleCloseModal = () => {
    set_openModal(false);
    setTimeout(() => {
      set_nodeType(null);
    }, 200);
  };

  return (
    <>
      {props.normalButton ? (
        <Button
          onClick={handleOpenModal}
          disabled={props.disabled}
        >
          Show install options
        </Button>
      ) : (
        <IconButton
          iconComponent={<CodeIcon />}
          tooltipText={
            <span>
              SHOW
              <br />
              docker run command
            </span>
          }
          onClick={handleOpenModal}
          disabled={props.disabled}
        />
      )}

      <SDialog
        open={openModal}
        onClose={handleCloseModal}
        disableScrollLock={true}
      >
        <TopBar>
          <DialogTitle>
            {
              !nodeType && 'SELECT NODE TYPE'
            }
            {
              nodeType === 'dockerRun' && 'Docker'
            }
            {
              nodeType === 'dockerCompose' && 'Docker Compose'
            }
            {
              nodeType === 'binary' && 'Binary file'
            }
            {
              nodeType === 'dappnode' && 'DAppNode'
            }
          </DialogTitle>
          <SIconButton
            aria-label="close modal"
            onClick={handleCloseModal}
          >
            <CloseIcon />
          </SIconButton>
        </TopBar>
        {
          !nodeType && <SelectNodeType set_nodeType={set_nodeType} />
        }
        {
          nodeType === 'dockerRun' && <DockerRun />
        }
        {
          nodeType === 'dockerCompose' && <DockerCompose />
        }
        {
          nodeType === 'binary' && <Binary />
        }
        {
          nodeType === 'dappnode' && <DAppNode />
        }
        {
          !!nodeType &&
          <span
            style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}
          >
            <Button
              onClick={() => set_nodeType(null)}
            >
              Back
            </Button>
          </span>
        }
      </SDialog>
    </>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  margin-bottom: 16px;
`

const NodeTypesContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
`

function SelectNodeType(props: { set_nodeType: (type: NodeType) => void }) {
  const [selectedType, set_selectedType] = useState<NodeType>(null);
  return (
    <Container>
      <NodeTypesContainer>
        <NodeType
          onClick={() => set_selectedType('dockerRun')}
          title="Docker Run"
          image="/assets/NodeTypeIconDockerRun.svg"
          selected={selectedType === 'dockerRun'}
        />
        <NodeType
          onClick={() => set_selectedType('dockerCompose')}
          title="Docker Compose"
          image="/assets/NodeTypeIconDockerCompose.svg"
          selected={selectedType === 'dockerCompose'}
        />
        <NodeType
          onClick={() => set_selectedType('binary')}
          title="Binary"
          image="/assets/NodeTypeIconBinary.svg"
          selected={selectedType === 'binary'}
        />
        <NodeType
          onClick={() => set_selectedType('dappnode')}
          title="DAppNode"
          image="/assets/NodeTypeIconDAppNode.svg"
          selected={selectedType === 'dappnode'}
        />
      </NodeTypesContainer>
      <Button
        onClick={() => props.set_nodeType(selectedType)}
        disabled={!selectedType}
      >
        Show install instructions
      </Button>
    </Container>
  )
}

const StyledButton = styled(MuiButton)`
  width: 250px;
  height: 190px;
  background-color: #EDF2F7;
  display: flex;
  flex-direction: column;
  border-radius: 30px;
  color: #414141;
  font-size: 18px;
  &.selected {
    border: 2px solid #000050;
  }
  img {
    margin-bottom: 8px;
  }
  .MuiRadio-root {
    color: #000050;
  }
`

function NodeType(props: {
  image?: string;
  title: string;
  selected?: boolean;
  onClick: () => void;
}){
  return (
    <StyledButton
      onClick={props.onClick}
      className={props.selected ? 'selected' : ''}
    >
      {props.image && <img src={props.image} alt={props.title} />}
      {props.title}
      <Radio
        checked={props.selected}
      />
    </StyledButton>
  )
}

function DockerRun() {
  const safeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);
  const moduleAddress = useAppSelector((store) => store.safe.selectedSafe.data.moduleAddress);
  return (
    <SDialogContent>
      <span style={{ fontSize: '15px' }}>
        <span style={{ fontWeight: 500 }}>YOUR_NODE_FOLDER:</span> Fill in a folder name that you will be using to
        store node identity and database.
        <br /> That name has to be different per node.
        <br />
        <br />
        <span style={{ fontWeight: 500 }}>YOUR_SECURITY_TOKEN:</span> Fill in a password that you will be using when
        connecting to your node
        <br />
        <br />
        <span style={{ fontWeight: 500 }}>YOUR_PUBLIC_IP:</span> Fill in the public IP of the machine on which the
        node will be reachable
        <br />
        <br />
        <span style={{ fontWeight: 500 }}>CUSTOM_RPC_PROVIDER:</span> Fill in the custom RPC provider, please follow{' '}
        <a
          href="https://docs.hoprnet.org/node/custom-rpc-provider#overview"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#007bff', textDecoration: 'underline' }}
        >
          the guideline in our docs
        </a>
        <br />
        <br />
        <span style={{ fontWeight: 500 }}>configurationFilePath:</span> Copy the pre-configured file to your node
        folder. For more information, follow{' '}
        <a
          href="https://docs.hoprnet.org/node/manage-node-strategies#create-and-apply-configuration-file-to-your-node"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#007bff', textDecoration: 'underline' }}
        >
          the instructions in our docs
        </a>
      </span>
      <br />
      <CodeContainer
        moduleAddress={moduleAddress}
        safeAddress={safeAddress}
      />
    </SDialogContent>
  )
}

function DockerCompose() {
  return (
    <SDialogContent>
      <div style={{ fontSize: '15px' }}>
        Running HOPRd using Docker compose:
        <ol>
          <li>Download compose folder</li>
          <li>Edit hoprd.cfg.yaml</li>
          <li>Edit .env file</li>
        </ol>
        <a
          href="https://docs-hoprnet-org-git-experiment-ui-tweak-300-hoprnet.vercel.app/node/node-docker-compose"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#007bff', textDecoration: 'underline' }}
        >
          Checkout the instructions in our docs
        </a>
      </div>
    </SDialogContent>
  )
}

function Binary() {
  return (
    <SDialogContent>
      <div style={{ fontSize: '15px' }}>
        Running HOPRd using a binary file:
        <ol>
          <li>Download binary file based on the arch and OS.</li>
          <li>Download & Edit config file</li>
        </ol>
        <a
          href="https://docs-hoprnet-org-git-experiment-ui-tweak-300-hoprnet.vercel.app/node/node-binary"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#007bff', textDecoration: 'underline' }}
        >
          Checkout the full instructions in our docs
        </a>
      </div>
    </SDialogContent>
  )
}

function DAppNode() {
  return (
    <SDialogContent>
      <div style={{ fontSize: '15px' }}>
        Running HOPRd using a DAppNode:
        <ol>
          <li>Connect to your DAppNode</li>
          <li>Install HOPR package using the DAppStore setup wizard on your DAppNode</li>
        </ol>
        <a
          href="https://docs-hoprnet-org-git-experiment-ui-tweak-300-hoprnet.vercel.app/node/node-dappnode"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#007bff', textDecoration: 'underline' }}
        >
          Checkout the full instructions in our docs
        </a>
      </div>
    </SDialogContent>
  )
};