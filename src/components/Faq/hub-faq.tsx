type FaqElement = {
  id: number;
  title: string;
  content: string | JSX.Element;
};

type FaqData = Record<string, FaqElement[]>;

const hubFaq: FaqData = {
  '/staking/gno-airdrop': [
    {
      id: 1,
      title: 'How this was calculated',
      content: (
        <span>
          We:
          <ul>
            <li>Took a snapshot on 28 June 2024, 8AM UTC</li>
            <li>Calculated the wxHOPR tokens in your Safe and channels at that time</li>
            <li>Divided it by the node minimum of 30,000 (or 10,000 if you're staking a Network Registry NFT)</li>
            <li>Rounded down to the nearest whole number</li>
          </ul>
          We also checked how many of your HOPR nodes were running at 50% uptime for the previous two weeks<br />
          Whichever number was smallest is your airdrop amount.
        </span>
      ),
    },
    {
      id: 2,
      title: 'How to generate validator and deposit keys',
      content: (
        <span>
          You can find the tutorial {` `}
        <a
          target="_blank"
          rel="noreferrer"
          href="https://docs.gnosischain.com/node/manual/validator/generate-keys/"
          style={{
            textDecoration: 'underline'
          }}
        >
          how to generate deposits files here on the gnosis docs. Remember to provide withdrawal address while creating the validators. It will be a lot easier while creation than adding them later.
        </a>
        </span>
      ),
    },
    {
      id: 3,
      title: 'How to claim',
      content:
        `You have until November 15th to submit your validator(s) file. If you miss this deadline, you will have to wait until future distributions, which are first come, first served.`,
    },
    {
      id: 4,
      title: 'How many validators do I need to provide?',
      content:
        `Only new validators are eligible for these rewards. You should create the same number of new validators as GNO you are due to receive. Each validator can only receive 1 GNO, and if a validator already has GNO, it will not be able to recieve more. If you will provide more validators in the deposit file than you are eligible for, we take into account only the entries at the beginning of the deposit file and disregard the rest of the validators inside it.`
    },
    {
      id: 5,
      title: 'Validator generation - troubleshooting for Mac OS?',
      content: (
        <span>
          Tutorial on how safely open apps on your Mac:{' '}
          <a
            href="https://support.apple.com/en-us/102445"
            target="_blank"
            rel="noreferrer"
          >
            https://support.apple.com/en-us/102445
          </a>
        </span>
      ),
    },
  ],
};

export default hubFaq;
