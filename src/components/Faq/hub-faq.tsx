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
        `You'll have until the end of July 2024 to upload deposit file. GNO will be distributed directly to validators before the end of August 2024.`,
    },
    {
      id: 4,
      title: 'How many validators do I need to provide?',
      content:
        `If you are eligible for 1+ GNOs, it means that you should create a new deposit file for that number of GNOs that you will receive. 1 GNO per validator will be distributed. Each validator can use only exactly 1 GNO.`
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
