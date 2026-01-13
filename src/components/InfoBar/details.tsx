import { useAppSelector } from '../../store';
import styled from '@emotion/styled';
import Tooltip from '@mui/material/Tooltip';
import numbro from 'numbro';

interface Props {
  style?: object;
}

const Web3Container = styled.div`
  background-color: #cadeff;
  border-radius: 1rem;
  display: flex;
  gap: 8px;
  width: calc(190px + 2 * 8px);
  padding: 8px;
  font-size: 12px;
  /* margin-right: 8px; */
  box-shadow: 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14),
    0px 1px 3px 0px rgba(0, 0, 0, 0.12);
`;

const IconContainer = styled.div`
  height: 1rem;
  width: 1rem;
`;

const TitleColumn = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 38px;
  width: 100%;
  max-width: 78px;
  &.node {
    max-width: 112px;
  }
`;

const IconAndText = styled.div`
  align-items: center;
  display: flex;
  gap: 0.5rem;
`;

const Icon = styled.img`
  display: block;
  height: 1rem;
  width: 1rem;
`;

const Text = styled.p`
  font-weight: 600;
  &.noWrap {
    white-space: nowrap;
  }
`;

const DataColumn = styled.div<{ show?: boolean }>`
  visibility: ${(props) => (props.show === false ? 'hidden' : 'visible')};
  display: flex;
  flex-direction: column;
  width: 56px;
`;

const DataTitle = styled.p`
  text-transform: uppercase;
  font-weight: 600;
  margin-right: 5px;
  margin-bottom: 4px;
  margin-top: 20px;
`;

const Data = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #ddeaff;
  text-align: right;
  padding: 0 8px;
  width: calc(56px - 2 * 8px);
  border-radius: 1rem 1rem 1rem 1rem;
  flex-grow: 1;
  &.nodeOnly {
    width: 66px;
    margin-top: 40px;
  }
  p.double {
    line-height: 2.5;
  }
  p {
    text-overflow: ellipsis;
    overflow: hidden;
  }

  a {
    color: #007bff; /* Set the desired color for links */
    text-decoration: underline;
  }
`;

export const ColorStatus = styled.span`
  &.status-Green {
    color: #218520;
    font-weight: 700;
  }
  &.status-Orange {
    color: #ff8f00;
    font-weight: 700;
  }
  &.status-Red {
    color: #ff0000;
    font-weight: 700;
  }
`;

function shrinkNumber(value?: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return '-';
  }
  let originalValue;
  if (typeof value === 'string') {
    originalValue = parseFloat(value);
    if (value.includes('.')) {
      const parts = value.split('.');
      value = parts[0] + '.' + parts[1].slice(0, 6);
    }
    value = parseFloat(value);
  } else {
    originalValue = value;
  }
  if (originalValue === 0) {
    return '0';
  }
  let shrank = numbro(value).format({
    roundingFunction: Math.floor,
    trimMantissa: true,
    optionalMantissa: true,
    thousandSeparated: true,
    totalLength: 3,
  });
  if (shrank === '0' && originalValue > 0) {
    shrank = '~' + shrank;
  }
  return shrank;
}

export default function Details(props: Props) {
  const selectedSafeAddress = useAppSelector((store) => store.safe.selectedSafe.data.safeAddress);
  const web3Connected = useAppSelector((store) => store.web3.status.connected);
  const walletBalance = useAppSelector((store) => store.web3.balance);
  const safeBalance = useAppSelector((store) => store.safe.balance.data);

  const web3Drawer = (
    <Web3Container style={props.style}>
      <TitleColumn className="web3">
        <IconAndText>
          <IconContainer>
            <Icon
              src="/assets/wxHoprIcon.svg"
              alt="wxHOPR Icon"
            />
          </IconContainer>
          <Text>wxHOPR</Text>
        </IconAndText>
        <IconAndText>
          <IconContainer>
            <Icon
              src="/assets/xHoprIcon.svg"
              alt="xHOPR Icon"
            />
          </IconContainer>
          <Text>xHOPR</Text>
        </IconAndText>
        <IconAndText>
          <IconContainer>
            <Icon
              src="/assets/xDaiIcon.svg"
              alt="xDai Icon"
            />
          </IconContainer>
          <Text>xDAI</Text>
        </IconAndText>
      </TitleColumn>
      <DataColumn show={!!selectedSafeAddress}>
        {selectedSafeAddress && (
          <>
            <DataTitle>Safe</DataTitle>
            <Data>
              <Tooltip
                title={
                  safeBalance.wxHopr.formatted && safeBalance.wxHopr.formatted !== '0'
                    ? safeBalance.wxHopr.formatted
                    : null
                }
              >
                <p>{shrinkNumber(safeBalance.wxHopr.formatted)}</p>
              </Tooltip>
              <Tooltip
                title={
                  safeBalance.xHopr.formatted && safeBalance.xHopr.formatted !== '0'
                    ? safeBalance.xHopr.formatted
                    : null
                }
              >
                <p>{shrinkNumber(safeBalance.xHopr.formatted)}</p>
              </Tooltip>
              <Tooltip
                title={
                  safeBalance.xDai.formatted && safeBalance.xDai.formatted !== '0' ? safeBalance.xDai.formatted : null
                }
              >
                <p>{shrinkNumber(safeBalance.xDai.formatted)}</p>
              </Tooltip>
            </Data>
          </>
        )}
      </DataColumn>
      <DataColumn>
        <DataTitle>Wallet</DataTitle>
        <Data>
          <Tooltip
            title={
              walletBalance.wxHopr.formatted && walletBalance.wxHopr.formatted !== '0'
                ? walletBalance.wxHopr.formatted
                : null
            }
          >
            <p>{shrinkNumber(walletBalance.wxHopr.formatted)}</p>
          </Tooltip>
          <Tooltip
            title={
              walletBalance.xHopr.formatted && walletBalance.xHopr.formatted !== '0'
                ? walletBalance.xHopr.formatted
                : null
            }
          >
            <p>{shrinkNumber(walletBalance.xHopr.formatted)}</p>
          </Tooltip>
          <Tooltip
            title={
              walletBalance.xDai.formatted && walletBalance.xDai.formatted !== '0' ? walletBalance.xDai.formatted : null
            }
          >
            <p>{shrinkNumber(walletBalance.xDai.formatted)}</p>
          </Tooltip>
        </Data>
      </DataColumn>
    </Web3Container>
  );


  return (
    <>
      {web3Connected && web3Drawer}
    </>
  );
}
