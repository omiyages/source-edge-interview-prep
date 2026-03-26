
export interface CompanyValue {
  icon: string;
  title: string;
  description: string;
}

export interface CompanyService {
  icon?: string;
  title: string;
  description: string;
  highlights?: readonly string[];
}

export interface CompanyPageData {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage?: string;
  logoLetter?: string;
  logoBg?: string;  // tailwind bg-* class, e.g. 'bg-[#EF3054]'
  logoText?: string; // tailwind text-* class, e.g. 'text-white'

  // Section 2: Key Info
  funding: string;
  size: string;
  location: string;
  founded: string;

  // Section 3: Mission & Values
  mission: string;
  values: CompanyValue[];

  // Section 4: Services / Products / Divisions
  servicesHeading?: string;
  services: CompanyService[];

  // Section 5: Tech Stack
  techStack?: Record<string, readonly string[]>;

  // Section 6: Why Join
  whyJoin: CompanyValue[];

  /** Override the company name used for Supabase filters (roles + courses).
   *  Defaults to `name` when omitted. Useful when the DB stores a different
   *  capitalisation or variant (e.g. "Woven by Toyota" vs display "Woven"). */
  companyFilterName?: string;
}
