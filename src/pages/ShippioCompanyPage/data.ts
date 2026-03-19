export const SHIPPIO = {
  name: 'Shippio, Inc.',
  tagline: "Japan's first digital freight forwarder",
  description:
    'Shippio is building an international logistics platform to drive digital transformation in global trade. Its cloud-based Shippio Platform enables automatic cargo tracking, inter-party communication, trade document management, invoice processing, and customs clearance — replacing analog, paper-heavy workflows across Japan\'s $500B+ import/export industry.',
  founded: 2016,
  hq: 'Tokyo, Japan (Minato-ku, Shibaura)',
  stage: 'Series C',
  totalFunding: '¥7B',
  totalFundingUsd: '~$46M USD',
  employees: '~67',
  employeeTarget: '300 by 2028',
  revenue2024: '~$1.8M USD',
  revenueGrowth: '+200% YoY',
  goal: 'Handle 30% of Japan\'s inbound/outbound cargo (5.4M TEU/year) by 2030',

  stats: [
    { label: 'Founded', value: '2016' },
    { label: 'Stage', value: 'Series C' },
    { label: 'Raised', value: '¥7B' },
    { label: 'Employees', value: '~67' },
  ],

  about: [
    'Shippio is Japan\'s first digital freight forwarder, on a mission to modernize the country\'s $500B+ import/export industry. Founded in 2016 and headquartered in Tokyo\'s Minato-ku district, the company has built a cloud-based logistics platform that replaces fragmented, paper-heavy trade workflows with a unified digital experience.',
    'The Shippio Platform enables automatic cargo tracking, inter-party communication, trade document management, invoice processing, and customs clearance — connecting shippers, forwarders, customs brokers, and carriers on a single interface. The company recently launched Shippio Clear, an AI-OCR customs cloud, and established an AI Advanced Lab for generative AI operations.',
    'With backing from DNX Ventures, Coral Capital, and Global Brain among others, Shippio has raised approximately ¥7 billion (~$46M USD) through its Series C round. The company\'s goal: handle 30% of Japan\'s inbound/outbound cargo — 5.4 million TEU per year — by 2030.',
  ],

  products: [
    {
      name: 'Shippio Platform',
      description:
        'Cloud-based international logistics platform enabling automatic cargo tracking, inter-party communication, trade document management, invoice processing, and customs clearance.',
    },
    {
      name: 'Shippio Clear',
      description:
        'AI-OCR powered customs cloud that automates customs declaration processing, drastically reducing manual document handling and clearance times.',
    },
    {
      name: 'AI Advanced Lab',
      description:
        'Internal R&D initiative applying generative AI to logistics operations — from document parsing and anomaly detection to predictive routing and cost optimization.',
    },
  ],

  fundingRounds: [
    { year: '2017', round: 'Seed', amount: '¥50M', lead: 'Coral Capital' },
    { year: '2018', round: 'Series A', amount: '¥500M', lead: 'Global Brain' },
    { year: '2021', round: 'Series B', amount: '¥2.2B', lead: 'DNX Ventures' },
    { year: '2025', round: 'Series C', amount: '¥3.24B', lead: 'DNX Ventures' },
  ],

  techStack: {
    Languages: ['Ruby', 'Golang', 'JavaScript', 'TypeScript'],
    Frameworks: ['Ruby on Rails', 'React', 'Apollo Federation'],
    Infrastructure: ['AWS', 'Firebase'],
    Databases: ['Amazon Aurora (PostgreSQL)', 'Redis'],
    Tooling: [
      'GitHub',
      'Docker',
      'CircleCI',
      'Datadog',
      'LaunchDarkly',
      'Redash',
      'Figma',
      'Notion',
    ],
  },

  offices: [
    { city: 'Tokyo', region: 'Japan (HQ)', detail: 'Minato-ku, Shibaura' },
    { city: 'Osaka', region: 'Japan', detail: '' },
    { city: 'Shenzhen', region: 'China', detail: '' },
    { city: 'Ho Chi Minh City', region: 'Vietnam', detail: '' },
  ],

  investors: [
    'DNX Ventures',
    'Coral Capital',
    'Global Brain',
    'Z Venture Capital',
    'Sony Innovation Fund',
    'MOL PLUS',
    'NTT Docomo Ventures',
    'Suzuyo',
    'YMFG Capital',
    'Aozora Corporate Investment',
  ],

  notable: [
    'Acquired Kyowa Kaiun (July 2022)',
    'Member of Japan International Freight Forwarders Association (JIFFA)',
    'Connects Japan to China, Southeast Asia, North America, and Europe',
  ],
} as const;
