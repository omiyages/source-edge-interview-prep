import type { CompanyPageData } from '@/types/company';

const DATA: CompanyPageData = {
  slug: 'woven',
  name: 'Woven by Toyota',
  tagline: 'Building the Future of Mobility',
  description:
    "Toyota's mobility technology subsidiary developing the software behind Toyota's vehicle operating systems, automated driving, and smart city initiatives like Woven City.",
  heroImage: '/Woven City.jpg',
  logoLetter: 'W',
  logoBg: 'bg-[#EF3054]',
  logoText: 'text-white',

  funding: 'Owned by Toyota',
  size: '1,000+ employees',
  location: 'Tokyo, Japan',
  founded: '2021',

  mission:
    "Woven by Toyota is Toyota's mobility technology subsidiary, responsible for developing and integrating the software behind Toyota's vehicle operating systems, automated driving, advanced safety technologies, and smart city initiatives. Built as a Silicon Valley-style startup with the backing and distribution power of the world's largest automaker, Woven bridges Japan's automotive heritage with a software-first future.",

  values: [
    {
      icon: 'Car',
      title: 'Software-First Vehicle Development',
      description:
        'Pioneering a software-first approach to cars — creating platforms that enable continuous updates to vehicle performance, safety, and user experience over the air.',
    },
    {
      icon: 'Building2',
      title: 'The Woven City Vision',
      description:
        'A prototype city at Mt. Fuji designed as a living laboratory. Phase 1 launched in September 2025, testing autonomous vehicles, robotics, and clean energy in real conditions.',
    },
    {
      icon: 'Globe',
      title: 'Global Scale with Toyota Backing',
      description:
        'Unmatched access to global vehicle fleets, manufacturing partners, and distribution networks — accelerating software deployment at automotive scale.',
    },
  ],

  servicesHeading: 'Divisions',
  services: [
    {
      icon: 'Shield',
      title: 'ADAS',
      description:
        'Advanced driver-assistance systems that enhance road safety — intelligent features that support drivers, prevent accidents, and progress Toyota toward fully automated mobility.',
      highlights: ['Autonomous emergency braking', 'Lane departure warning', 'Adaptive cruise control'],
    },
    {
      icon: 'Globe',
      title: 'Arene',
      description:
        "Toyota's next-generation vehicle software platform and OS. Arene enables developers to create, test, and deploy software across vehicles — faster innovation, continuous improvement.",
      highlights: ['Vehicle OS and software platform', 'Scalable development environment', 'Over-the-air updates'],
    },
    {
      icon: 'Building2',
      title: 'Woven City',
      description:
        'A living laboratory at the base of Mt. Fuji. Residents moved in September 2025 as part of Phase 1 — testing autonomous vehicles, robotics, and renewable energy in real-world conditions.',
      highlights: ['Autonomous mobility testing', 'Smart infrastructure integration', 'Sustainable community design'],
    },
    {
      icon: 'TrendingUp',
      title: 'Enterprise Technology',
      description:
        'A cloud-based platform helping engineers build AI/ML applications and software for the automotive industry — the backbone of all Woven engineering projects.',
      highlights: ['Cloud platform for automotive', 'Enterprise AI / ML applications', 'Engineering infrastructure'],
    },
    {
      icon: 'Lightbulb',
      title: 'Dojo',
      description:
        'An EdTech platform providing employee training across languages, programming, soft skills, and professional development. Used by Toyota Group companies and external partners.',
      highlights: ['EdTech platform for enterprises', 'B2B employee training', 'Language and technical skills'],
    },
  ],

  techStack: {
    'Languages': ['C++', 'Python', 'Rust', 'Go', 'TypeScript'],
    'Frameworks': ['ROS 2', 'Bazel', 'React', 'Node.js'],
    'Infrastructure': ['AWS', 'Kubernetes', 'Docker', 'Terraform'],
    'Data & ML': ['PyTorch', 'TensorFlow', 'Apache Kafka', 'PostgreSQL'],
  },

  whyJoin: [
    {
      icon: 'Award',
      title: 'Purpose-Driven Talent',
      description: 'Work alongside the best mobility industry pioneers on problems that matter at a global scale.',
    },
    {
      icon: 'Car',
      title: 'Toyota Backing',
      description: 'Greater opportunities for scale and global distribution — Toyota distributes 10M+ vehicles per year.',
    },
    {
      icon: 'Zap',
      title: 'Startup Agility',
      description: 'Own governance and board of directors to remain startup-agile despite being part of a global corporation.',
    },
    {
      icon: 'Heart',
      title: 'Unique Culture',
      description: 'Silicon Valley innovation paired with Japanese craftsmanship — English-first, international environment.',
    },
    {
      icon: 'Globe',
      title: 'Global Software Start-Up',
      description: 'The full stack needed for software-first mobility worldwide — from OS to smart city infrastructure.',
    },
    {
      icon: 'Code',
      title: 'Deep Technical Work',
      description: 'Real systems engineering — vehicle OS, autonomous driving stacks, and real-world AI deployment challenges.',
    },
  ],

};

export default DATA;
