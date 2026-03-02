function textFromSelectors(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const value = element?.textContent?.trim();
    if (value) return value;
  }
  return "";
}

function parseJsonSafe(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickFirstString(values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function cleanInlineText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isLikelyGenericSiteText(value) {
  const v = cleanInlineText(value).toLowerCase();
  if (!v) return true;
  const blocked = ["ジョブミル", "jobmiru", "求人", "jobs", "採用"];
  return blocked.includes(v);
}

function getLabelValue(labels) {
  const normalizedLabels = labels.map((l) => l.toLowerCase());
  const all = Array.from(document.querySelectorAll("th, dt, td, dd, div, span, p, strong, b"));

  for (const node of all) {
    const labelText = cleanInlineText(node.textContent || "").toLowerCase();
    if (!labelText) continue;
    if (!normalizedLabels.some((label) => labelText === label || labelText.startsWith(`${label}:`) || labelText.startsWith(`${label}：`))) {
      continue;
    }

    const siblingCandidates = [
      node.nextElementSibling,
      node.parentElement?.nextElementSibling,
      node.closest("tr")?.querySelector("td:last-child"),
      node.closest("dl")?.querySelector("dd"),
    ];
    for (const candidate of siblingCandidates) {
      const text = cleanInlineText(candidate?.textContent || "");
      if (text && text.toLowerCase() !== labelText) return text;
    }

    const parentText = cleanInlineText(node.parentElement?.textContent || "");
    if (parentText && parentText.toLowerCase() !== labelText) {
      const stripped = parentText
        .replace(new RegExp(`^${labelText}\\s*[:：]?\\s*`, "i"), "")
        .trim();
      if (stripped) return stripped;
    }
  }

  return "";
}

function findJobPostingDataInJson(node) {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJobPostingDataInJson(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node !== "object") return null;

  const typeValue = String(node["@type"] || "").toLowerCase();
  if (typeValue.includes("jobposting")) return node;

  for (const key of Object.keys(node)) {
    const found = findJobPostingDataInJson(node[key]);
    if (found) return found;
  }
  return null;
}

function extractFromJsonLd() {
  const scripts = Array.from(document.querySelectorAll("script[type='application/ld+json']"));
  for (const script of scripts) {
    const parsed = parseJsonSafe(script.textContent || "");
    const jobPosting = findJobPostingDataInJson(parsed);
    if (!jobPosting) continue;

    const locationObj = jobPosting.jobLocation?.address || {};
    const location = pickFirstString([
      locationObj.addressLocality,
      locationObj.addressRegion,
      locationObj.addressCountry,
      locationObj.streetAddress,
      jobPosting.jobLocation?.name,
    ]);

    return {
      job_title: pickFirstString([jobPosting.title, jobPosting.name]),
      company: pickFirstString([
        jobPosting.hiringOrganization?.name,
        jobPosting.employerOverview?.name,
      ]),
      location,
      job_description: pickFirstString([
        jobPosting.description,
        jobPosting.responsibilities,
      ]),
      requirements: pickFirstString([
        jobPosting.qualifications,
        jobPosting.experienceRequirements,
        jobPosting.skills,
      ]),
      benefits: pickFirstString([jobPosting.jobBenefits]),
    };
  }
  return null;
}

function guessLocationFromBodyText() {
  const text = document.body?.innerText || "";
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 400);

  const locationRegex =
    /(tokyo|osaka|nagoya|yokohama|kyoto|fukuoka|japan|日本|東京都|神奈川|大阪|名古屋|福岡|京都)/i;

  for (const line of lines) {
    if (line.length > 90) continue;
    if (locationRegex.test(line)) return line;
  }

  return "";
}

function titleFromDocument() {
  const title = (document.title || "").trim();
  if (!title) return "";
  return title
    .replace(/\s*[|｜\-–—]\s*.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function textBySectionHeading(possibleHeadings) {
  const headingSelectors = "h1, h2, h3, h4, [role='heading']";
  const headings = Array.from(document.querySelectorAll(headingSelectors));

  for (const heading of headings) {
    const headingText = (heading.textContent || "").trim().toLowerCase();
    const isMatch = possibleHeadings.some((key) => headingText.includes(key));
    if (!isMatch) continue;

    let cursor = heading.nextElementSibling;
    const chunks = [];
    let steps = 0;
    while (cursor && steps < 6) {
      const t = (cursor.textContent || "").trim();
      if (t) chunks.push(t);
      cursor = cursor.nextElementSibling;
      steps += 1;
    }

    const merged = chunks.join("\n\n").trim();
    if (merged) return merged;
  }

  return "";
}

function normalizeWorkingStyle(raw) {
  const s = (raw || "").toLowerCase();
  if (s.includes("hybrid")) return "Hybrid";
  if (s.includes("remote")) return "Remote";
  if (s.includes("onsite") || s.includes("on-site") || s.includes("office")) return "Onsite";
  return "Onsite";
}

function inferCompany() {
  const fromMeta = document
    .querySelector("meta[property='og:site_name']")
    ?.getAttribute("content")
    ?.trim();
  if (fromMeta) return fromMeta;

  return "Woven by Toyota";
}

function extractRole() {
  const jsonLd = extractFromJsonLd();

  const labelJobTitle = getLabelValue(["職種", "募集職種", "ポジション", "job title", "title"]);
  const labelCompany = getLabelValue(["会社名", "company"]);
  const labelLocation = getLabelValue(["勤務地", "location"]);
  const labelWorkingStyle = getLabelValue(["勤務形態", "働き方", "work style", "working style"]);
  const labelDivision = getLabelValue(["部署", "部門", "division"]);

  const extractedTitle = textFromSelectors([
    "main h2",
    "article h2",
    "h2",
    "[data-testid='job-title']",
    ".job-title",
    "main h1",
    "article h1",
    "h1",
  ]);
  const jobTitle = !isLikelyGenericSiteText(extractedTitle)
    ? extractedTitle
    : (labelJobTitle || jsonLd?.job_title || titleFromDocument());

  const company = textFromSelectors([
    "[data-testid='company-name']",
    ".company-name",
    "[class*='company-name']",
  ]) || labelCompany || jsonLd?.company || inferCompany();

  const location = textFromSelectors([
    "[data-testid='job-location']",
    ".location",
    "[class*='job-location']",
  ]) || labelLocation || jsonLd?.location || guessLocationFromBodyText() || "Unknown (Please Edit)";

  const workingStyleRaw = textFromSelectors([
    "[data-testid='working-style']",
    ".working-style",
    "[class*='work-style']",
  ]) || labelWorkingStyle;

  const division = textFromSelectors([
    "[data-testid='division']",
    ".division",
    "[class*='division']",
  ]) || labelDivision;

  const jobDescription = textBySectionHeading(["job description", "仕事内容", "description"]);
  const requirements = textBySectionHeading(["requirements", "必須", "qualifications"]);
  const niceToHaves = textBySectionHeading(["nice to have", "歓迎", "preferred"]);
  const benefits = textBySectionHeading(["benefits", "福利厚生", "what we offer"]);

  const payload = {
    job_title: jobTitle,
    company,
    location,
    working_style: normalizeWorkingStyle(workingStyleRaw),
    division,
    job_description: jobDescription || jsonLd?.job_description || "",
    requirements: requirements || jsonLd?.requirements || "",
    nice_to_haves: niceToHaves,
    benefits: benefits || jsonLd?.benefits || "",
    source_url: window.location.href,
  };

  if (!payload.job_title) {
    throw new Error("Could not detect job title. Please open the role detail page and try again.");
  }

  return payload;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PING_ROLE_IMPORTER") {
    sendResponse({ ok: true });
    return;
  }

  if (message?.type !== "EXTRACT_ROLE") return;

  try {
    const payload = extractRole();
    sendResponse({ ok: true, payload });
  } catch (error) {
    sendResponse({ ok: false, error: String(error) });
  }
});
