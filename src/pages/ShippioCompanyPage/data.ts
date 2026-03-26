import type { CompanyPageData } from '@/types/company';

const DATA: CompanyPageData = {
  slug: 'shippio',
  name: 'Shippio',
  tagline: "Japan's First Digital Freight Forwarder",
  description:
    "Shippio is building an international logistics platform to drive digital transformation in global trade. Its cloud-based platform enables automatic cargo tracking, document management, invoice processing, and AI-powered customs clearance — replacing analog, paper-heavy workflows across Japan's $500B+ import/export industry.",
  heroImage: '/shippio.jpg',
  logoLetter: 'S',
  logoBg: 'bg-[#000665]',
  logoText: 'text-white',

  funding: '¥7B (Series C)',
  size: '~67 employees',
  location: 'Tokyo, Japan',
  founded: '2016',

  mission:
    "Shippio is Japan's first digital freight forwarder, on a mission to modernize the country's $500B+ import/export industry. Founded in 2016 and headquartered in Tokyo's Minato-ku district, the company has built a cloud-based logistics platform that replaces fragmented, paper-heavy trade workflows with a unified digital experience — connecting shippers, forwarders, customs brokers, and carriers on a single interface. With ¥7B raised through Series C and a goal to handle 30% of Japan's inbound/outbound cargo by 2030, Shippio is one of Japan's most ambitious logistics startups.",

  values: [
    {
      icon: 'Globe',
      title: 'Platform-First Logistics',
      description:
        'A single cloud platform that unifies cargo tracking, document management, inter-party communication, and customs clearance — eliminating fragmented, legacy workflows.',
    },
    {
      icon: 'Cpu',
      title: 'AI-Powered Operations',
      description:
        'Shippio Clear uses AI-OCR to automate customs declarations. The AI Advanced Lab applies generative AI to document parsing, anomaly detection, and predictive routing.',
    },
    {
      icon: 'Target',
      title: "30% of Japan's Cargo by 2030",
      description:
        "An ambitious but credible goal: handle 5.4M TEU per year — 30% of Japan's total inbound/outbound cargo — by 2030. Series C funding and strong YoY growth put this on track.",
    },
  ],

  servicesHeading: 'Products',
  services: [
    {
      icon: 'Package',
      title: 'Shippio Platform',
      description:
        'Cloud-based international logistics platform enabling automatic cargo tracking, inter-party communication, trade document management, invoice processing, and customs clearance.',
      highlights: ['Real-time cargo tracking', 'Document management & OCR', 'Multi-party communication hub'],
    },
    {
      icon: 'Cpu',
      title: 'Shippio Clear',
      description:
        'AI-OCR powered customs cloud that automates customs declaration processing, drastically reducing manual document handling and clearance times.',
      highlights: ['AI-powered OCR for customs docs', 'Automated declaration filing', 'Error reduction & compliance'],
    },
    {
      icon: 'Rocket',
      title: 'AI Advanced Lab',
      description:
        'Internal R&D initiative applying generative AI to logistics operations — from document parsing and anomaly detection to predictive routing and cost optimization.',
      highlights: ['Generative AI for logistics', 'Predictive cost optimization', 'Anomaly detection'],
    },
  ],

  techStack: {
    'Languages': ['Ruby', 'Go', 'TypeScript', 'JavaScript'],
    'Frameworks': ['Ruby on Rails', 'React', 'Apollo Federation'],
    'Infrastructure': ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    'Data': ['PostgreSQL', 'Redis', 'Elasticsearch'],
  },

  whyJoin: [
    {
      icon: 'TrendingUp',
      title: '+200% Revenue Growth YoY',
      description:
        'Series C momentum with strong product-market fit — join a startup at the inflection point of rapid commercial growth.',
    },
    {
      icon: 'Code',
      title: 'Modern Tech Stack',
      description:
        'Ruby on Rails, Golang, React, TypeScript, Apollo Federation, AWS — a mature stack with real engineering challenges at scale.',
    },
    {
      icon: 'Globe',
      title: 'International Presence',
      description:
        'Offices in Tokyo, Osaka, Shenzhen, and Ho Chi Minh City — building cross-border trade infrastructure across Asia.',
    },
    {
      icon: 'Target',
      title: 'Mission-Driven Work',
      description:
        'Modernizing a $500B industry that still runs on faxes and paper. Your code directly accelerates global trade.',
    },
    {
      icon: 'Zap',
      title: 'High Autonomy',
      description:
        'Small team (~67 people) with a flat structure. Engineers work closely with product and operations on decisions that matter.',
    },
    {
      icon: 'Award',
      title: 'Strong Investor Backing',
      description:
        'Backed by DNX Ventures, Coral Capital, Z Venture Capital, Sony Innovation Fund, NTT Docomo Ventures, and others.',
    },
  ],

};

export default DATA;
