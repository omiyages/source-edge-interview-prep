import type { CompanyPageData } from '@/types/company';

const DATA: CompanyPageData = {
  slug: 'japan-ai',
  name: 'Japan AI',
  tagline: "Building Japan's Enterprise AI Future",
  description:
    'Japan AI is a strategic AI subsidiary of Geniee Inc., providing end-to-end enterprise AI transformation through consulting, a proprietary SaaS platform, and custom AI development — helping Japanese companies adopt AI at scale.',
  heroImage: '/japanai.jpg',
  logoLetter: 'J',
  logoBg: 'bg-[#4F46E5]',
  logoText: 'text-white',

  funding: 'Geniee subsidiary (TSE: 6562)',
  size: '218 employees',
  location: 'Shinjuku, Tokyo',
  founded: '2023',

  mission:
    'Japan AI was founded on April 14, 2023 as a wholly-owned subsidiary of Geniee Inc. — a Tokyo Stock Exchange-listed digital marketing leader. Its mission is to create a sustainable future society through AI, bridging the wisdom of Japan\'s enterprise heritage with modern AI capabilities. The company serves ~200 enterprise clients across scales, helping them move from AI experimentation to full-scale production deployment through three integrated service lines: consulting, platform, and custom development.',

  values: [
    {
      icon: 'Target',
      title: 'Enterprise-First AI',
      description:
        'Focused exclusively on enterprise AI transformation — not consumer products. Every feature, service, and tool is designed around the real-world needs of Japanese companies at scale.',
    },
    {
      icon: 'Shield',
      title: 'Trusted by Japan Inc.',
      description:
        'Built on Geniee\'s established enterprise relationships and TSE-listed credibility. Japan AI combines the agility of a startup with the trust and reach of a listed parent company.',
    },
    {
      icon: 'Rocket',
      title: 'Speed to Production',
      description:
        'From AI consulting to custom deployments, Japan AI compresses the path from POC to production — meeting the urgency of enterprise digital transformation timelines.',
    },
  ],

  servicesHeading: 'Services & Products',
  services: [
    {
      icon: 'Lightbulb',
      title: 'AI Consulting',
      description:
        'Hands-on consulting to build AI capability inside client organisations — staff training, use-case discovery, vendor evaluation, and structured implementation roadmaps.',
      highlights: [
        'AI literacy training for business teams',
        'Use-case assessment and prioritisation',
        'Vendor-neutral implementation guidance',
      ],
    },
    {
      icon: 'Cpu',
      title: 'JAPAN AI Platform',
      description:
        'A proprietary SaaS platform covering the full enterprise AI workflow — RAG-powered knowledge bases, AI agents, sales automation, and marketing content generation. Supports 100+ built-in prompts and multi-LLM routing across ChatGPT, Claude, and Gemini.',
      highlights: [
        '82.7% RAG accuracy with agentic retrieval',
        'No-code AI Agent builder',
        'Meeting transcription: 99% accuracy, 80 languages',
        'SALES and MARKETING specialised modules',
      ],
    },
    {
      icon: 'Code',
      title: 'AI Development',
      description:
        'Custom AI solution development for enterprises with unique requirements — from proof-of-concept builds to production-grade applications, including legal compliance tooling and domain-specific agents.',
      highlights: [
        'Custom RAG and agent development',
        'POC to production delivery',
        'Legal and compliance AI tooling',
      ],
    },
  ],

  techStack: {
    'Languages': ['Python', 'TypeScript'],
    'Frameworks': ['React', 'Next.js', 'FastAPI'],
    'AI / LLMs': ['Claude', 'GPT-4o', 'Gemini', 'LangChain'],
    'Infrastructure': ['GCP', 'Kubernetes', 'Docker', 'GitHub Actions'],
  },

  whyJoin: [
    {
      icon: 'TrendingUp',
      title: 'Fastest-Growing AI Company in Japan',
      description:
        'Founded in 2023, already at 218 employees. Grand prize winner at AI Products Award 2025 (Spring) in the AI Agent category.',
    },
    {
      icon: 'Globe',
      title: 'Geniee Backing',
      description:
        'Operate with startup agility while benefiting from Geniee\'s TSE listing, ~200 enterprise client relationships, and established brand trust.',
    },
    {
      icon: 'Code',
      title: 'Modern AI-Native Stack',
      description:
        'Python, TypeScript, React, Next.js, GCP, Kubernetes — and you use the company\'s own AI products daily. Claude, Gemini, and ChatGPT integrations are first-class.',
    },
    {
      icon: 'Award',
      title: 'Award-Winning Products',
      description:
        'IT Review rating of 4.5/5 stars. Grand prize at AI Products Award 2025 Spring in the AI Agent category. 1 in 5 AI-adoption leaders are aware of the brand.',
    },
    {
      icon: 'Heart',
      title: 'Strong Benefits',
      description:
        '¥30,000/month housing stipend, ¥60,000 annual book budget, ¥5,000/month wellness allowance, and an internal job-change programme for career mobility.',
    },
    {
      icon: 'Zap',
      title: 'High Impact from Day One',
      description:
        'Small, fast-moving teams with direct access to enterprise clients. Engineers and consultants see their work deployed to real Japanese companies within weeks.',
    },
  ],

  companyFilterName: 'Geniee',
};

export default DATA;
