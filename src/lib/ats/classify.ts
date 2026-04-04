export type RoleCategory =
  | "Backend"
  | "Frontend/Fullstack"
  | "Product/Project Management"
  | "Engineering Manager/Managerial"
  | "Data Science"
  | "Embedded"
  | "DevOps/SRE/Infrastructure"
  | "Product Design"
  | "QA/Test"
  | "Mechanical/Mechatronics"
  | "Others";

interface CategoryRule {
  category: RoleCategory;
  titlePatterns: RegExp[];
  departmentPatterns?: RegExp[];
}

const RULES: CategoryRule[] = [
  {
    category: "Engineering Manager/Managerial",
    titlePatterns: [
      /engineering\s*manager/i,
      /\bдиректор\b/i,
      /\bdirector\b/i,
      /\bvp\b/i,
      /vice\s*president/i,
      /\bhead\s+of\b/i,
      /\bchief\b/i,
      /\bcto\b/i,
      /\bcio\b/i,
      /principal\s+manager/i,
      /group\s+manager/i,
      /senior\s+manager/i,
      /general\s+manager/i,
    ],
  },
  {
    category: "Data Science",
    titlePatterns: [
      /data\s*scien/i,
      /data\s*engineer/i,
      /data\s*analyst/i,
      /\bml\s*engineer/i,
      /machine\s*learning/i,
      /\bai\s+engineer/i,
      /\bnlp\b/i,
      /computer\s*vision/i,
      /deep\s*learning/i,
      /applied\s*scien/i,
      /research\s*scien/i,
    ],
    departmentPatterns: [/data\s*science/i, /machine\s*learning/i, /\bai\b/i],
  },
  {
    category: "Embedded",
    titlePatterns: [
      /\bembedded\b/i,
      /\bfirmware\b/i,
      /\brtos\b/i,
      /\bfpga\b/i,
    ],
  },
  {
    category: "DevOps/SRE/Infrastructure",
    titlePatterns: [
      /\bdevops\b/i,
      /\bsre\b/i,
      /site\s*reliab/i,
      /\binfrastructure\b/i,
      /platform\s*engineer/i,
      /cloud\s*engineer/i,
      /cloud\s*architect/i,
      /\bsecurity\s*engineer/i,
      /network\s*engineer/i,
    ],
    departmentPatterns: [/infrastructure/i, /platform/i, /\bsre\b/i],
  },
  {
    category: "QA/Test",
    titlePatterns: [
      /\bqa\b/i,
      /\bquality\s*assurance/i,
      /\btest\s*engineer/i,
      /\bsdet\b/i,
      /\bquality\s*engineer/i,
      /\bquality\s*assessor/i,
      /\btest\s*automation/i,
      /\bqa\s*specialist/i,
      /\bquality\s*management/i,
      /\bsoftware\s*quality/i,
    ],
    departmentPatterns: [/\bqa\b/i, /quality\s*assurance/i],
  },
  {
    category: "Mechanical/Mechatronics",
    titlePatterns: [
      /\bmechanical\s*engineer/i,
      /\bmechatronics/i,
      /\bmechanical\s*design/i,
      /\bstructural\s*design/i,
    ],
  },
  {
    category: "Frontend/Fullstack",
    titlePatterns: [
      /front[\s-]*end/i,
      /\bfrontend\b/i,
      /full[\s-]*stack/i,
      /\bfullstack\b/i,
      /\bui\s+engineer/i,
      /web\s*developer/i,
    ],
  },
  {
    category: "Backend",
    titlePatterns: [
      /back[\s-]*end/i,
      /\bbackend\b/i,
      /server\s*engineer/i,
      /\bapi\s+engineer/i,
      /\bsoftware\s+engineer/i,
      /\bsystems?\s+engineer/i,
      /\bsolutions?\s+engineer/i,
      /\bsolution\s+architect/i,
      /\benterprise\s+architect/i,
      /\bkubernetes\b/i,
      /\brobotics\s+.*engineer/i,
      /\biot\s+engineer/i,
      /\bpki\s+.*engineer/i,
      /\b(?:senior\s+)?(?:customer\s+success|customer)\s+engineer/i,
      /\bhmi\b.*engineer/i,
      /\bprototype\s+engineer/i,
      /\bdialogue\s+engineer/i,
      /\bllm\b/i,
      /\bvlm\b/i,
    ],
  },
  {
    category: "Product/Project Management",
    titlePatterns: [
      /product\s*manager/i,
      /project\s*manager/i,
      /program\s*manager/i,
      /scrum\s*master/i,
      /\btpm\b/i,
      /technical\s*program/i,
      /product\s*owner/i,
    ],
  },
  {
    category: "Product Design",
    titlePatterns: [
      /product\s*design/i,
      /\bux\s*design/i,
      /\bui\s*design/i,
      /\bux\s*research/i,
      /design\s*lead/i,
      /interaction\s*design/i,
      /visual\s*design/i,
    ],
  },
];

export function classifyRole(
  title: string,
  department?: string | null,
  team?: string | null
): RoleCategory {
  for (const rule of RULES) {
    for (const pattern of rule.titlePatterns) {
      if (pattern.test(title)) return rule.category;
    }
  }

  const fallback = [department, team].filter(Boolean).join(" ");
  if (fallback) {
    for (const rule of RULES) {
      if (!rule.departmentPatterns) continue;
      for (const pattern of rule.departmentPatterns) {
        if (pattern.test(fallback)) return rule.category;
      }
    }
  }

  return "Others";
}
