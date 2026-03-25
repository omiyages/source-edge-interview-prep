export const HERO_STATS = [
  { label: 'Founded', value: '2021' },
  { label: 'Stage', value: 'Subsidiary' },
  { label: 'HQ', value: 'Tokyo, Japan' },
  { label: 'Industry', value: 'Auto Software' },
] as const;

export const PILLARS = [
  {
    icon: 'Car',
    title: 'Building the Future of Mobility',
    description:
      "Toyota's innovation arm transforming mobility for a safer, more connected, and sustainable future — developing advanced technologies beyond traditional vehicles.",
  },
  {
    icon: 'Code',
    title: 'Software-First Vehicle Development',
    description:
      'Pioneering a "software-first" approach to cars — creating platforms that enable continuous updates to vehicle performance, safety, and user experience.',
  },
  {
    icon: 'Building2',
    title: 'The Woven City Vision',
    description:
      'A prototype city at Mt. Fuji designed as a living laboratory. Phase 1 launched in September 2025, testing autonomous vehicles, robotics, and clean energy in real conditions.',
  },
] as const;

export const DIVISIONS = [
  {
    icon: 'Shield',
    iconColor: '#60A5FA',
    iconBg: 'rgba(37,99,235,0.15)',
    title: 'ADAS',
    description:
      'Developing advanced driver-assistance systems that enhance safety on the road — intelligent features that support drivers, prevent accidents, and progress Toyota toward fully automated mobility.',
    highlights: ['Autonomous emergency braking', 'Lane departure warning', 'Adaptive cruise control'],
  },
  {
    icon: 'Globe',
    iconColor: '#22D3EE',
    iconBg: 'rgba(6,182,212,0.15)',
    title: 'Arene',
    description:
      "Building Toyota's next-generation vehicle software platform and OS. Arene enables developers to create, test, and deploy software seamlessly across vehicles — faster innovation, continuous improvement.",
    highlights: ['Vehicle OS and software platform', 'Scalable development environment', 'Over-the-air updates'],
  },
  {
    icon: 'Building2',
    iconColor: '#4ADE80',
    iconBg: 'rgba(22,163,74,0.15)',
    title: 'Woven City',
    description:
      'A living laboratory at the base of Mt. Fuji. Residents moved in September 2025 as part of Phase 1 — testing autonomous vehicles, robotics, and renewable energy systems in real-world conditions.',
    highlights: ['Autonomous and connected mobility testing', 'Smart infrastructure integration', 'Sustainable community design'],
  },
  {
    icon: 'TrendingUp',
    iconColor: '#FB923C',
    iconBg: 'rgba(234,88,12,0.15)',
    title: 'Enterprise Technology',
    description:
      'The backbone of all Woven engineering projects — a cloud-based platform helping engineers build AI/ML applications and software for the automotive industry.',
    highlights: ['Cloud platform for the automotive industry', 'Enterprise AI / AI-ML applications', 'Engineering infrastructure and networking'],
  },
  {
    icon: 'Lightbulb',
    iconColor: 'accent',
    iconBg: 'accent-dim',
    title: 'Dojo',
    description:
      'An EdTech platform providing employee training across languages, programming, soft skills, and professional development. Used by Toyota Group companies and external partners.',
    highlights: ['EdTech platform for enterprises', 'B2B employee training', 'Language and technical skill development'],
  },
] as const;

export const INTERVIEW_STEPS = [
  { num: 1, title: 'HR Call', description: '30-minute CV screening call with the HR team' },
  {
    num: 2,
    title: 'Technical Interview',
    description: 'Live coding session or technical deep-dive. Some roles have a take-home challenge instead.',
  },
  {
    num: 3,
    title: 'Cross-Functional',
    description: 'Behavioral-based discussion on stakeholder management, leadership, communication, and collaboration.',
  },
  {
    num: 4,
    title: 'Manager Interview',
    description: 'Final interview with senior management on culture fit, role scope, and any outstanding concerns.',
  },
] as const;

export const CULTURE_REASONS = [
  { icon: 'Award', title: 'Purpose-Driven Talent', description: 'The best and brightest mobility industry pioneers' },
  { icon: 'Car', title: 'Toyota Backing', description: 'Greater opportunities for scale and global distribution' },
  { icon: 'Zap', title: 'Agility', description: 'Own governance and board of directors to remain startup-agile' },
  { icon: 'Heart', title: 'Unique Culture', description: 'Silicon Valley innovation paired with Japanese craftsmanship' },
  { icon: 'Globe', title: 'Global Software Start-Up', description: 'The full stack needed for software-first mobility worldwide' },
] as const;
