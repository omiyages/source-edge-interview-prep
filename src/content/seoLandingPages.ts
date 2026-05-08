export type SeoLandingPage = {
  slug: string;
  path: string;
  title: string;
  metaTitle: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  targetRoles: string[];
  whyItMatters: string[];
  nextSteps: Array<{ label: string; href: string }>;
};

export const seoLandingPages: SeoLandingPage[] = [
  {
    slug: "software-engineer-jobs-tokyo",
    path: "/guides/software-engineer-jobs-tokyo",
    title: "Software Engineer Jobs in Tokyo",
    metaTitle: "Software Engineer Jobs in Tokyo for English-Speaking Candidates",
    description:
      "Explore software engineer jobs in Tokyo, interview prep resources, and Japan-focused hiring insights for English-speaking and bilingual developers.",
    heroTitle: "Software Engineer Jobs in Tokyo for Global Talent",
    heroDescription:
      "Use Omiyages to find software engineering roles in Tokyo, understand Japanese language expectations, and prepare for interviews with real company-specific questions.",
    targetRoles: ["Backend engineer", "Frontend engineer", "Full-stack engineer", "Platform engineer", "Developer experience"],
    whyItMatters: [
      "Tokyo engineering roles often vary widely on Japanese-language requirements, interview style, and take-home expectations.",
      "English-speaking and bilingual candidates need a clear way to compare companies, roles, and interview formats before applying.",
      "Omiyages brings together jobs, company context, interview questions, and prep tracks in one workflow.",
    ],
    nextSteps: [
      { label: "Browse Tokyo software jobs", href: "/jobs" },
      { label: "Practice interview questions", href: "/questions" },
      { label: "Read company profiles", href: "/company" },
    ],
  },
  {
    slug: "machine-learning-jobs-japan",
    path: "/guides/machine-learning-jobs-japan",
    title: "Machine Learning Jobs in Japan",
    metaTitle: "Machine Learning Jobs in Japan for English-Speaking and Bilingual Candidates",
    description:
      "Find machine learning and AI jobs in Japan, compare employer expectations, and prepare for technical interviews with Japan-focused resources.",
    heroTitle: "Machine Learning Jobs in Japan Without Guesswork",
    heroDescription:
      "From applied ML teams to enterprise AI startups, Omiyages helps candidates prepare for machine learning jobs in Japan with role discovery, company research, and interview practice.",
    targetRoles: ["Machine learning engineer", "Applied scientist", "MLOps engineer", "AI product engineer", "Data / AI platform roles"],
    whyItMatters: [
      "ML hiring in Japan blends global expectations with local communication, product, and stakeholder constraints.",
      "Candidates need clarity on tech stack, domain, language requirements, and how interviews balance coding, systems, and business context.",
      "Omiyages helps you move from browsing AI companies to targeted preparation for the exact role you want.",
    ],
    nextSteps: [
      { label: "Explore AI-oriented jobs", href: "/jobs" },
      { label: "Study interview tracks", href: "/tracks" },
      { label: "See Japan AI company page", href: "/company/japan-ai" },
    ],
  },
  {
    slug: "product-manager-jobs-tokyo",
    path: "/guides/product-manager-jobs-tokyo",
    title: "Product Manager Jobs in Tokyo",
    metaTitle: "Product Manager Jobs in Tokyo for English-Speaking and Bilingual Candidates",
    description:
      "Prepare for product manager jobs in Tokyo with interview questions, company research, and role insights tailored to English-speaking and bilingual candidates.",
    heroTitle: "Product Manager Jobs in Tokyo, Explained Clearly",
    heroDescription:
      "Understand product hiring in Tokyo, compare company expectations, and prepare for PM interviews with structured questions, tracks, and role research.",
    targetRoles: ["Product manager", "Technical product manager", "Platform PM", "AI product manager", "Growth / B2B SaaS PM"],
    whyItMatters: [
      "PM roles in Tokyo often emphasize stakeholder management, customer empathy, and communication across English and Japanese contexts.",
      "Candidates need better signals on domain fit, product maturity, and how interview loops differ from US or European PM hiring.",
      "Omiyages helps candidates connect job discovery with focused PM prep instead of treating them as separate tasks.",
    ],
    nextSteps: [
      { label: "Browse PM-friendly roles", href: "/jobs" },
      { label: "Review interview questions", href: "/questions" },
      { label: "Use the relocation guide", href: "/relo" },
    ],
  },
  {
    slug: "english-speaking-jobs-japan",
    path: "/guides/english-speaking-jobs-japan",
    title: "English-Speaking Jobs in Japan",
    metaTitle: "English-Speaking and Bilingual Tech Jobs in Japan",
    description:
      "Discover English-speaking and bilingual tech jobs in Japan, compare language expectations, and prepare for interviews with Omiyages.",
    heroTitle: "English-Speaking Tech Jobs in Japan for Candidates Who Want Clarity",
    heroDescription:
      "Omiyages helps global job seekers find English-friendly and bilingual roles in Japan, understand hiring expectations, and prepare for interviews with confidence.",
    targetRoles: ["Software engineering", "Machine learning / AI", "Product management", "Platform / DevOps", "Technical go-to-market roles"],
    whyItMatters: [
      "The hardest part of job searching in Japan is often understanding which companies are genuinely accessible to English-speaking candidates.",
      "Candidates need context on language expectations, work style, and whether a company is globally oriented or Japanese-first.",
      "Omiyages combines interview prep with role and company discovery so you can make better application decisions.",
    ],
    nextSteps: [
      { label: "Compare companies hiring in Japan", href: "/company" },
      { label: "See open tech roles", href: "/jobs" },
      { label: "Read interview resources", href: "/resources" },
    ],
  },
  {
    slug: "visa-sponsorship-tech-jobs-japan",
    path: "/guides/visa-sponsorship-tech-jobs-japan",
    title: "Visa Sponsorship Tech Jobs in Japan",
    metaTitle: "Visa Sponsorship Tech Jobs in Japan for Software Engineers, ML, and Product Candidates",
    description:
      "Learn how to target visa sponsorship tech jobs in Japan, evaluate employer readiness, and prepare for interviews with Omiyages.",
    heroTitle: "Visa Sponsorship Tech Jobs in Japan Without Guesswork",
    heroDescription:
      "Use Omiyages to find Japan tech companies, understand hiring expectations, and prepare for interviews when you need employer-backed visa support.",
    targetRoles: ["Software engineer", "Machine learning engineer", "Product manager", "Platform / DevOps engineer", "Technical specialist roles"],
    whyItMatters: [
      "Candidates who need sponsorship must qualify both the role and the employer's willingness to support immigration processes in Japan.",
      "The right application strategy depends on company maturity, language expectations, and whether the team already hires international talent.",
      "Omiyages helps you connect role research, company context, and interview preparation in one workflow.",
    ],
    nextSteps: [
      { label: "Browse open jobs in Japan", href: "/jobs" },
      { label: "Research Japan tech companies", href: "/company" },
      { label: "Read the relocation guide", href: "/relo" },
    ],
  },
  {
    slug: "remote-software-jobs-japan",
    path: "/guides/remote-software-jobs-japan",
    title: "Remote Software Jobs in Japan",
    metaTitle: "Remote Software Jobs in Japan for English-Speaking and Bilingual Engineers",
    description:
      "Explore remote software jobs in Japan, compare hybrid versus fully remote expectations, and prepare for interviews with Omiyages.",
    heroTitle: "Remote Software Jobs in Japan for Candidates Who Need Clear Signals",
    heroDescription:
      "Understand how Japanese companies describe remote work, compare expectations across teams, and prepare for interviews with role and company context.",
    targetRoles: ["Backend engineer", "Frontend engineer", "Full-stack engineer", "Platform engineer", "Developer productivity roles"],
    whyItMatters: [
      "Remote-friendly job descriptions in Japan often mean very different things in practice, from optional office presence to highly flexible distributed teams.",
      "Candidates need better visibility into communication norms, language expectations, and how remote work affects interview processes.",
      "Omiyages helps you compare remote-friendly roles and prepare for the interviews that follow.",
    ],
    nextSteps: [
      { label: "Filter open jobs by work style", href: "/jobs" },
      { label: "Practice interview questions", href: "/questions" },
      { label: "Review interview prep tracks", href: "/tracks" },
    ],
  },
  {
    slug: "bilingual-product-manager-jobs-tokyo",
    path: "/guides/bilingual-product-manager-jobs-tokyo",
    title: "Bilingual Product Manager Jobs in Tokyo",
    metaTitle: "Bilingual Product Manager Jobs in Tokyo for English and Japanese Speakers",
    description:
      "Understand bilingual product manager jobs in Tokyo, compare language expectations, and prepare for PM interviews with Omiyages.",
    heroTitle: "Bilingual Product Manager Jobs in Tokyo With Better Context",
    heroDescription:
      "From stakeholder-heavy platform PM roles to growth and AI product positions, Omiyages helps bilingual PM candidates find fit and prepare well.",
    targetRoles: ["Product manager", "Technical product manager", "AI product manager", "Platform PM", "Growth PM"],
    whyItMatters: [
      "Bilingual PM roles in Tokyo often hinge on stakeholder management, user research, and cross-functional alignment across English and Japanese teams.",
      "Candidates need stronger signals on how much Japanese is required in meetings, documentation, and customer interactions.",
      "Omiyages connects PM job discovery to company research and targeted interview preparation.",
    ],
    nextSteps: [
      { label: "Explore PM roles in Japan", href: "/jobs" },
      { label: "Review PM interview questions", href: "/questions" },
      { label: "Compare product-focused companies", href: "/company" },
    ],
  },
  {
    slug: "machine-learning-engineer-salary-japan",
    path: "/guides/machine-learning-engineer-salary-japan",
    title: "Machine Learning Engineer Salary in Japan",
    metaTitle: "Machine Learning Engineer Salary in Japan: What Candidates Should Expect",
    description:
      "Understand machine learning engineer salary expectations in Japan and connect compensation research with jobs, companies, and interview prep.",
    heroTitle: "Machine Learning Engineer Salary in Japan, Framed for Real Job Decisions",
    heroDescription:
      "Use Omiyages to pair salary expectations with company context, interview preparation, and relocation planning for AI and machine learning roles in Japan.",
    targetRoles: ["Machine learning engineer", "Applied scientist", "MLOps engineer", "AI platform engineer", "Data / AI product roles"],
    whyItMatters: [
      "Compensation expectations for ML roles in Japan vary widely by company stage, domain, product maturity, and language requirements.",
      "Candidates need to connect salary research to actual hiring processes, interview depth, and long-term role fit.",
      "Omiyages helps you move from compensation curiosity to informed job applications and stronger interviews.",
    ],
    nextSteps: [
      { label: "Browse AI and ML jobs", href: "/jobs" },
      { label: "Use the Tokyo salary calculator", href: "/relo" },
      { label: "Study interview tracks", href: "/tracks" },
    ],
  },
  {
    slug: "interview-process-japanese-tech-companies",
    path: "/guides/interview-process-japanese-tech-companies",
    title: "Interview Process at Japanese Tech Companies",
    metaTitle: "Interview Process at Japanese Tech Companies for Global Candidates",
    description:
      "Learn what to expect from interview processes at Japanese tech companies and prepare with Omiyages across jobs, companies, and question practice.",
    heroTitle: "Interview Processes at Japanese Tech Companies, Explained Clearly",
    heroDescription:
      "Understand how hiring loops differ across software engineering, machine learning, and product roles in Japan, then prepare with real questions and company context.",
    targetRoles: ["Software engineering", "Machine learning / AI", "Product management", "Platform / DevOps", "Design-adjacent technical roles"],
    whyItMatters: [
      "Japanese tech companies often blend global interview formats with local communication expectations, manager screens, and culture-fit conversations.",
      "Candidates need a realistic picture of coding rounds, system design, stakeholder interviews, and how Japanese-language expectations show up in process.",
      "Omiyages helps you prepare for the full loop, not just one interview round in isolation.",
    ],
    nextSteps: [
      { label: "Practice interview questions", href: "/questions" },
      { label: "Review preparation tracks", href: "/tracks" },
      { label: "See open tech jobs", href: "/jobs" },
    ],
  },
];

export const seoLandingPageMap = Object.fromEntries(
  seoLandingPages.map((page) => [page.slug, page])
) as Record<string, SeoLandingPage>;
