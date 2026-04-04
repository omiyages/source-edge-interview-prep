interface TechPattern {
  label: string;
  pattern: RegExp;
}

const ANY_LANGUAGE_RE =
  /any\s+(?:programming|coding)\s+language|language[\s-]*agnostic/i;

const TECH_PATTERNS: TechPattern[] = [
  // Languages
  { label: "Python", pattern: /\bpython\b/i },
  { label: "Java", pattern: /\bjava\b(?!\s*script)/i },
  { label: "Scala", pattern: /\bscala\b/i },
  { label: "Go", pattern: /\bgolang\b|\bgo\s+(?:lang|programming|language|modules?|routines?)\b/i },
  { label: "Rust", pattern: /\brust\b/i },
  { label: "C++", pattern: /\bc\+\+\b/i },
  { label: "C#", pattern: /\bc#\b/i },
  { label: "JavaScript", pattern: /\bjavascript\b|\bjs\b/i },
  { label: "TypeScript", pattern: /\btypescript\b|\bts\b/i },
  { label: "Ruby", pattern: /\bruby\b/i },
  { label: "PHP", pattern: /\bphp\b/i },
  { label: "Kotlin", pattern: /\bkotlin\b/i },
  { label: "Swift", pattern: /\bswift\b/i },
  { label: "Perl", pattern: /\bperl\b/i },
  { label: "Elixir", pattern: /\belixir\b/i },
  { label: "Haskell", pattern: /\bhaskell\b/i },
  { label: "Clojure", pattern: /\bclojure\b/i },
  { label: "Dart", pattern: /\bdart\b/i },
  { label: "Objective-C", pattern: /\bobjective[\s-]?c\b/i },
  { label: "Lua", pattern: /\blua\b/i },
  { label: "SQL", pattern: /\bsql\b/i },
  { label: "Shell", pattern: /\bbash\b|\bshell\s+script/i },

  // Frameworks & runtimes
  { label: "React", pattern: /\breact(?:\.?js)?\b/i },
  { label: "Angular", pattern: /\bangular\b/i },
  { label: "Vue", pattern: /\bvue(?:\.?js)?\b/i },
  { label: "Next.js", pattern: /\bnext\.?js\b/i },
  { label: "Node.js", pattern: /\bnode\.?js\b/i },
  { label: "Rails", pattern: /\brails\b|\bruby\s+on\s+rails\b/i },
  { label: "Spring", pattern: /\bspring\s*(?:boot|framework|mvc)?\b/i },
  { label: "Django", pattern: /\bdjango\b/i },
  { label: "Flask", pattern: /\bflask\b/i },
  { label: "FastAPI", pattern: /\bfastapi\b/i },
  { label: ".NET", pattern: /\b\.?net\s*(?:core|framework)?\b(?!work)/i },
  { label: "NestJS", pattern: /\bnest\.?js\b/i },
  { label: "Express", pattern: /\bexpress\.?js\b|\bexpress\b/i },
  { label: "Flutter", pattern: /\bflutter\b/i },
  { label: "GraphQL", pattern: /\bgraphql\b/i },
  { label: "gRPC", pattern: /\bgrpc\b/i },

  // Infrastructure & DevOps
  { label: "Kubernetes", pattern: /\bkubernetes\b|\bk8s\b/i },
  { label: "Docker", pattern: /\bdocker\b/i },
  { label: "Terraform", pattern: /\bterraform\b/i },
  { label: "AWS", pattern: /\baws\b/i },
  { label: "GCP", pattern: /\bgcp\b|\bgoogle\s+cloud\b/i },
  { label: "Azure", pattern: /\bazure\b/i },
  { label: "Ansible", pattern: /\bansible\b/i },
  { label: "Jenkins", pattern: /\bjenkins\b/i },
  { label: "Kafka", pattern: /\bkafka\b/i },
  { label: "Redis", pattern: /\bredis\b/i },
  { label: "PostgreSQL", pattern: /\bpostgres(?:ql)?\b/i },
  { label: "MySQL", pattern: /\bmysql\b/i },
  { label: "MongoDB", pattern: /\bmongo(?:db)?\b/i },
  { label: "Elasticsearch", pattern: /\belasticsearch\b|\belastic\s+search\b/i },
  { label: "Spark", pattern: /\bspark\b|\bpyspark\b/i },
  { label: "Hadoop", pattern: /\bhadoop\b/i },
  { label: "Airflow", pattern: /\bairflow\b/i },
  { label: "RabbitMQ", pattern: /\brabbitmq\b/i },
  { label: "Nginx", pattern: /\bnginx\b/i },
  { label: "Linux", pattern: /\blinux\b/i },
  { label: "ArgoCD", pattern: /\bargo\s*cd\b/i },
  { label: "Prometheus", pattern: /\bprometheus\b/i },
  { label: "Grafana", pattern: /\bgrafana\b/i },
  { label: "Datadog", pattern: /\bdatadog\b/i },

  // ML / AI
  { label: "TensorFlow", pattern: /\btensorflow\b/i },
  { label: "PyTorch", pattern: /\bpytorch\b/i },
  { label: "scikit-learn", pattern: /\bscikit[\s-]?learn\b|\bsklearn\b/i },
  { label: "ROS", pattern: /\bros\b|\bros2\b/i },
];

export function extractTechStack(
  description: string | null,
  title: string
): string {
  const text = [title, description ?? ""].join(" ");

  if (ANY_LANGUAGE_RE.test(text)) return "Any";

  const found = new Set<string>();
  for (const { label, pattern } of TECH_PATTERNS) {
    if (pattern.test(text)) {
      found.add(label);
    }
  }

  if (found.has("Ruby") && found.has("Rails")) {
    found.delete("Ruby");
  }

  if (found.size === 0) return "N/A";

  return [...found].join(", ");
}
