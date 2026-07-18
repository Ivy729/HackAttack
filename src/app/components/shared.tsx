import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  name: string;
  email: string;
  dept: string;
  role: "admin" | "user";
  initials: string;
}

// ─── Chart tooltip style ──────────────────────────────────────────────────────

export const tooltipStyle = {
  fontSize: 12,
  border: "1px solid #d1d5db",
  borderRadius: 4,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  fontFamily: "'Inter', system-ui, sans-serif",
};

// ─── Data ─────────────────────────────────────────────────────────────────────

export const AI_TOOLS = [
  { id: "chatgpt",    name: "ChatGPT Enterprise",  vendor: "OpenAI",        status: "approved", risk: "medium", requests: 12840, cert: "SOC 2 Type II", trustScore: 84, lastReview: "Jun 12, 2026", depts: ["Engineering","Marketing","Sales"],    trend: +18 },
  { id: "claude",     name: "Claude for Work",      vendor: "Anthropic",     status: "approved", risk: "low",    requests:  8920, cert: "SOC 2 Type II", trustScore: 91, lastReview: "Jul 2, 2026",  depts: ["Legal","Finance","Engineering"],    trend: +31 },
  { id: "copilot",    name: "Microsoft Copilot",    vendor: "Microsoft",     status: "approved", risk: "low",    requests: 15230, cert: "ISO 27001",     trustScore: 95, lastReview: "Jul 8, 2026",  depts: ["All Departments"],                 trend: +5  },
  { id: "gemini",     name: "Gemini Advanced",      vendor: "Google",        status: "review",   risk: "medium", requests:  3210, cert: "Pending",       trustScore: 71, lastReview: "May 30, 2026", depts: ["Product","Research"],              trend: +44 },
  { id: "midjourney", name: "Midjourney",           vendor: "Midjourney",    status: "blocked",  risk: "high",   requests:     0, cert: "None",          trustScore: 32, lastReview: "Apr 5, 2026",  depts: ["Design"],                          trend: 0   },
  { id: "perplexity", name: "Perplexity Pro",       vendor: "Perplexity AI", status: "review",   risk: "medium", requests:  1890, cert: "Pending",       trustScore: 67, lastReview: "Jun 28, 2026", depts: ["Research","Marketing"],            trend: +62 },
];

export const USAGE_DATA_14 = [
  { date: "Jul 3",  copilot: 510, chatgpt: 380, claude: 245, blocked:  8 },
  { date: "Jul 4",  copilot: 480, chatgpt: 290, claude: 310, blocked: 23 },
  { date: "Jul 5",  copilot: 530, chatgpt: 420, claude: 280, blocked: 15 },
  { date: "Jul 6",  copilot: 490, chatgpt: 510, claude: 320, blocked:  7 },
  { date: "Jul 7",  copilot: 570, chatgpt: 470, claude: 360, blocked: 19 },
  { date: "Jul 8",  copilot: 610, chatgpt: 550, claude: 410, blocked: 31 },
  { date: "Jul 9",  copilot: 590, chatgpt: 490, claude: 380, blocked: 14 },
  { date: "Jul 10", copilot: 645, chatgpt: 530, claude: 415, blocked: 22 },
  { date: "Jul 11", copilot: 680, chatgpt: 575, claude: 440, blocked: 18 },
  { date: "Jul 12", copilot: 615, chatgpt: 510, claude: 395, blocked: 11 },
  { date: "Jul 13", copilot: 700, chatgpt: 620, claude: 460, blocked: 28 },
  { date: "Jul 14", copilot: 660, chatgpt: 590, claude: 480, blocked: 16 },
  { date: "Jul 15", copilot: 720, chatgpt: 640, claude: 510, blocked: 34 },
  { date: "Jul 16", copilot: 590, chatgpt: 490, claude: 380, blocked: 47 },
];

export const DEPT_DATA = [
  { dept: "Engineering", requests: 8420, blocked: 142 },
  { dept: "Legal",       requests: 3210, blocked: 891 },
  { dept: "Finance",     requests: 2890, blocked: 670 },
  { dept: "Marketing",   requests: 5640, blocked:  89 },
  { dept: "HR",          requests: 1920, blocked: 312 },
  { dept: "Sales",       requests: 4180, blocked:  67 },
];

export const COMPLIANCE_PIE = [
  { name: "Compliant",     value: 78, color: "#15803d" },
  { name: "At Risk",       value: 15, color: "#b45309" },
  { name: "Non-Compliant", value:  7, color: "#b91c1c" },
];

export const RISK_TREND = [
  { week: "W1", high: 14, medium: 45, low: 180 },
  { week: "W2", high: 22, medium: 52, low: 210 },
  { week: "W3", high: 18, medium: 48, low: 195 },
  { week: "W4", high: 31, medium: 61, low: 225 },
  { week: "W5", high: 19, medium: 55, low: 240 },
  { week: "W6", high: 27, medium: 49, low: 215 },
  { week: "W7", high: 24, medium: 58, low: 250 },
  { week: "W8", high: 16, medium: 42, low: 265 },
];

export const DEPT_RISK = [
  { dept: "HR",          score: 7.4 },
  { dept: "Legal",       score: 6.8 },
  { dept: "Finance",     score: 5.9 },
  { dept: "Engineering", score: 3.2 },
  { dept: "Sales",       score: 2.8 },
  { dept: "Marketing",   score: 2.1 },
];

export const INITIAL_INCIDENTS = [
  { id: 1, ts: "just now",   user: "sarah.chen@acme.com", tool: "ChatGPT", event: "SSN pattern detected in prompt",       severity: "critical" },
  { id: 2, ts: "2 min ago",  user: "dev.team@acme.com",   tool: "Claude",  event: "Source code export attempt blocked",   severity: "high"     },
  { id: 3, ts: "8 min ago",  user: "legal@acme.com",      tool: "Copilot", event: "Confidential document upload blocked", severity: "high"     },
  { id: 4, ts: "21 min ago", user: "mark.j@acme.com",     tool: "Gemini",  event: "Unapproved tool access attempt",       severity: "medium"   },
  { id: 5, ts: "1 hr ago",   user: "ops@acme.com",        tool: "ChatGPT", event: "API key exposed in prompt body",       severity: "critical" },
];

export const INCIDENT_POOL = [
  { user: "jenny.liu@acme.com", tool: "Claude",  event: "IBAN number detected in financial query",  severity: "critical" },
  { user: "ops.bot@acme.com",   tool: "Copilot", event: "Bulk PII export attempt via prompt",       severity: "high"     },
  { user: "tom.b@acme.com",     tool: "ChatGPT", event: "Competitor pricing data in prompt",        severity: "medium"   },
  { user: "amy.wang@acme.com",  tool: "Claude",  event: "Medical record reference blocked",         severity: "critical" },
  { user: "dev.ci@acme.com",    tool: "Copilot", event: "Private key pattern in code snippet",      severity: "high"     },
  { user: "hr.admin@acme.com",  tool: "ChatGPT", event: "Employee salary data in HR query",         severity: "high"     },
];

export const AUDIT_LOGS = [
  { id: "REQ-8841", ts: "2026-07-16 14:32:11", user: "sarah.chen",   dept: "Legal",       tool: "Claude",  action: "Prompt submitted",   risk: "high",   status: "blocked",  prompt: "Summarize this employee record: John Smith, SSN 123-45-6789, salary $145,000, performance review Q2 attached.", riskScore: 9.2 },
  { id: "REQ-8840", ts: "2026-07-16 14:29:03", user: "james.wu",     dept: "Engineering", tool: "Copilot", action: "Code generation",    risk: "low",    status: "approved", prompt: "Write a React component for a dashboard card with hover animations and TypeScript props.", riskScore: 1.4 },
  { id: "REQ-8839", ts: "2026-07-16 14:21:44", user: "priya.sharma", dept: "Finance",     tool: "ChatGPT", action: "Data analysis",      risk: "medium", status: "approved", prompt: "Analyze Q2 revenue trends and forecast Q3 based on the attached anonymized dataset.", riskScore: 3.8 },
  { id: "REQ-8838", ts: "2026-07-16 14:15:22", user: "alex.jones",   dept: "Marketing",   tool: "ChatGPT", action: "Content generation", risk: "low",    status: "approved", prompt: "Write a blog post about enterprise cloud security best practices for 2026.", riskScore: 1.1 },
  { id: "REQ-8837", ts: "2026-07-16 14:08:55", user: "tom.baker",    dept: "HR",          tool: "Copilot", action: "Document draft",     risk: "high",   status: "blocked",  prompt: "Draft a performance improvement plan for employee ID E4492, SSN 987-65-4321.", riskScore: 8.7 },
  { id: "REQ-8836", ts: "2026-07-16 13:55:30", user: "james.wu",     dept: "Engineering", tool: "Claude",  action: "Proposal gen",       risk: "low",    status: "approved", prompt: "Generate a sales proposal for Acme Inc focusing on our enterprise tier features.", riskScore: 1.9 },
  { id: "REQ-8835", ts: "2026-07-16 13:42:18", user: "james.wu",     dept: "Engineering", tool: "ChatGPT", action: "Code review",        risk: "medium", status: "approved", prompt: "Review this authentication middleware for security vulnerabilities.", riskScore: 4.2 },
  { id: "REQ-8834", ts: "2026-07-16 13:30:07", user: "nancy.kim",    dept: "Legal",       tool: "Gemini",  action: "Legal research",     risk: "medium", status: "review",   prompt: "Analyze GDPR compliance requirements for our EU product launch in Q4.", riskScore: 5.1 },
];

export const KANBAN = {
  pending: [
    { id: "APR-041", tool: "Perplexity Pro",   requester: "Mike Torres", dept: "Research",    date: "Jul 16", risk: "medium", reason: "Competitive intelligence research workflows", reviewers: ["AK","JS"], estHours: 4,  comments: 2 },
    { id: "APR-042", tool: "Gemini Advanced",  requester: "Emma Wilson", dept: "Product",     date: "Jul 16", risk: "medium", reason: "Product roadmap analysis and strategy",     reviewers: ["AK"],     estHours: 8,  comments: 0 },
    { id: "APR-043", tool: "GitHub Copilot X", requester: "James Wu",    dept: "Engineering", date: "Jul 15", risk: "low",    reason: "Advanced code completion and review",       reviewers: ["JS","LM"], estHours: 2, comments: 5 },
  ],
  approved: [
    { id: "APR-038", tool: "ChatGPT Enterprise", requester: "Marketing", dept: "Marketing", date: "Jul 14", risk: "low", reason: "Content creation pipelines",       reviewers: ["AK"], estHours: 0, comments: 3 },
    { id: "APR-039", tool: "Claude for Work",    requester: "James Wu",  dept: "Engineering", date: "Jul 13", risk: "low", reason: "Document summarization workflows", reviewers: ["AK","JS"], estHours: 0, comments: 1 },
  ],
  blocked: [
    { id: "APR-035", tool: "Midjourney",    requester: "Creative", dept: "Design",     date: "Jul 10", risk: "high", reason: "Image generation — IP/copyright concerns", reviewers: ["AK"], estHours: 0, comments: 4 },
    { id: "APR-037", tool: "Character.AI", requester: "Support",  dept: "Cx Success", date: "Jul 11", risk: "high", reason: "No enterprise DPA or legal agreement",     reviewers: ["AK"], estHours: 0, comments: 2 },
  ],
};

export const POLICIES_DATA = [
  { id: 1, name: "PII Protection",        priority: "critical", status: "active",   hits: 234, conditions: ["Prompt contains SSN pattern","Prompt contains credit card number","Prompt contains passport number"],       actions: ["Block request","Alert security team","Log incident to SIEM"] },
  { id: 2, name: "Source Code Guard",     priority: "high",     status: "active",   hits:  89, conditions: ["Attachment is .py .js .ts .java file","Prompt requests code export to external"],                         actions: ["Require manager approval","Strip file content","Notify CISO"] },
  { id: 3, name: "Financial Data Shield", priority: "high",     status: "active",   hits: 156, conditions: ["User dept is Finance","Prompt contains revenue figures","Tool not approved for Finance dept"],             actions: ["Block request","Log to compliance report"] },
  { id: 4, name: "Shadow AI Detection",   priority: "medium",   status: "active",   hits:  12, conditions: ["AI tool not in registry","Request routed outside SentinelAI gateway"],                                    actions: ["Block endpoint","Alert IT Security","Quarantine session"] },
  { id: 5, name: "Off-Hours Monitoring",  priority: "low",      status: "inactive", hits:   0, conditions: ["Request time is 10pm–6am local","Request volume exceeds 50 in 1 hour"],                                   actions: ["Flag for review","Apply rate limit to user"] },
];

export const USERS = [
  { id: 1, name: "Sarah Chen",   email: "sarah.chen@acme.com",   dept: "Legal",       role: "Power User", tools: ["Claude","Copilot"],          compliance: 62, risk: "high",   last: "2 min ago"  },
  { id: 2, name: "James Wu",     email: "james.wu@acme.com",     dept: "Engineering", role: "Developer",  tools: ["Copilot","ChatGPT","Claude"], compliance: 94, risk: "low",    last: "8 min ago"  },
  { id: 3, name: "Priya Sharma", email: "priya.sharma@acme.com", dept: "Finance",     role: "Analyst",    tools: ["ChatGPT"],                    compliance: 88, risk: "medium", last: "22 min ago" },
  { id: 4, name: "Alex Jones",   email: "alex.jones@acme.com",   dept: "Marketing",   role: "Standard",   tools: ["ChatGPT","Copilot"],          compliance: 96, risk: "low",    last: "1 hr ago"   },
  { id: 5, name: "Tom Baker",    email: "tom.baker@acme.com",    dept: "HR",          role: "Standard",   tools: ["Copilot"],                    compliance: 51, risk: "high",   last: "3 hr ago"   },
  { id: 6, name: "Lisa Park",    email: "lisa.park@acme.com",    dept: "Sales",       role: "Standard",   tools: ["Claude","ChatGPT"],           compliance: 91, risk: "low",    last: "1 hr ago"   },
];

// ─── Executive Intelligence data ──────────────────────────────────────────────

export const ROI_ADOPTION_TREND = [
  { month: "Feb", adoption: 42, hours: 610,  roi: 1.4 },
  { month: "Mar", adoption: 51, hours: 880,  roi: 1.9 },
  { month: "Apr", adoption: 58, hours: 1120, roi: 2.3 },
  { month: "May", adoption: 64, hours: 1380, roi: 2.8 },
  { month: "Jun", adoption: 71, hours: 1640, roi: 3.4 },
  { month: "Jul", adoption: 78, hours: 1920, roi: 4.1 },
];

export const ROI_DEPT_PRODUCTIVITY = [
  { dept: "Engineering", hours: 820, gain: 45, tasks: 1840, avgMin: 28 },
  { dept: "Marketing",   hours: 410, gain: 32, tasks: 960,  avgMin: 22 },
  { dept: "Sales",       hours: 280, gain: 24, tasks: 720,  avgMin: 18 },
  { dept: "Finance",     hours: 190, gain: 18, tasks: 410,  avgMin: 26 },
  { dept: "Legal",       hours: 120, gain: 15, tasks: 280,  avgMin: 31 },
  { dept: "HR",          hours: 100, gain: 12, tasks: 240,  avgMin: 20 },
];

export const ROI_TIME_SAVED = [
  { week: "W1", hours: 280 },
  { week: "W2", hours: 310 },
  { week: "W3", hours: 295 },
  { week: "W4", hours: 340 },
  { week: "W5", hours: 380 },
  { week: "W6", hours: 365 },
  { week: "W7", hours: 410 },
  { week: "W8", hours: 445 },
];

export const ROI_USAGE_FREQ = [
  { tool: "Copilot",  requests: 15230, users: 312 },
  { tool: "ChatGPT",  requests: 12840, users: 268 },
  { tool: "Claude",   requests: 8920,  users: 194 },
  { tool: "Gemini",   requests: 3210,  users: 76  },
];

export const COST_BY_DEPT = [
  { dept: "Engineering", spend: 42800 },
  { dept: "Marketing",   spend: 18600 },
  { dept: "Sales",       spend: 12400 },
  { dept: "Finance",     spend: 9800  },
  { dept: "Legal",       spend: 7200  },
  { dept: "HR",          spend: 5100  },
];

export const COST_BY_TOOL = [
  { tool: "Copilot", spend: 31200, licenses: 340, active: 312, under: 18, unused: 10 },
  { tool: "Claude",  spend: 28800, licenses: 200, active: 105, under: 40, unused: 55 },
  { tool: "ChatGPT", spend: 22400, licenses: 280, active: 248, under: 22, unused: 10 },
  { tool: "Gemini",  spend: 13500, licenses: 120, active: 76,  under: 24, unused: 20 },
];

export const COST_BY_VENDOR = [
  { vendor: "Microsoft", spend: 31200 },
  { vendor: "Anthropic", spend: 28800 },
  { vendor: "OpenAI",    spend: 22400 },
  { vendor: "Google",    spend: 13500 },
];

export const COST_MONTHLY = [
  { month: "Feb", spend: 68400 },
  { month: "Mar", spend: 71200 },
  { month: "Apr", spend: 74500 },
  { month: "May", spend: 76800 },
  { month: "Jun", spend: 82100 },
  { month: "Jul", spend: 95900 },
];

export const COST_FORECAST = [
  { period: "3 mo",  projected: 298000, label: "Next 3 months" },
  { period: "6 mo",  projected: 612000, label: "Next 6 months" },
  { period: "12 mo", projected: 1284000, label: "Next 12 months" },
];

export const COST_RECOMMENDATIONS = [
  {
    id: "cr1",
    title: "Right-size Claude Enterprise licenses",
    detail: "Reduce Claude Enterprise licenses from 200 to 140 to save RM9,600 per month.",
    impact: "RM9,600 / mo",
    priority: "high",
  },
  {
    id: "cr2",
    title: "Route low-complexity Engineering tasks to GPT-4.1 Mini",
    detail: "Engineering can switch low-complexity tasks to GPT-4.1 Mini to reduce AI costs by 32%.",
    impact: "−32% Eng. AI spend",
    priority: "high",
  },
  {
    id: "cr3",
    title: "Consolidate Marketing AI stack",
    detail: "Marketing is using multiple overlapping AI tools; consolidating to Gemini Enterprise could reduce annual licensing costs by RM25,000.",
    impact: "RM25,000 / yr",
    priority: "medium",
  },
  {
    id: "cr4",
    title: "Reclaim unused Gemini seats",
    detail: "20 Gemini Advanced seats have had zero activity in 45 days — reclaim or reassign before renewal.",
    impact: "RM3,200 / mo",
    priority: "medium",
  },
];

export type AdvisorCategory = "Cost Optimization" | "Risk Reduction" | "Productivity Improvement" | "Compliance Enhancement" | "AI Adoption";

export const ADVISOR_RECS: {
  id: string;
  category: AdvisorCategory;
  title: string;
  problem: string;
  evidence: string;
  impact: string;
  confidence: number;
  priority: "critical" | "high" | "medium" | "low";
  savings: string;
  action: string;
}[] = [
  {
    id: "ar1",
    category: "Risk Reduction",
    title: "Secure Coding with AI training for Engineering",
    problem: "Engineering frequently uploads source code to external AI tools.",
    evidence: "89 Source Code Guard hits this month · 34 high-risk events involving code snippets.",
    impact: "Reduce policy violations by an estimated 35%.",
    confidence: 91,
    priority: "critical",
    savings: "35% fewer violations",
    action: "Assign Secure Coding with AI training to Engineering.",
  },
  {
    id: "ar2",
    category: "Productivity Improvement",
    title: "Auto-approve Low-Risk Finance requests",
    problem: "Finance approval requests take an average of 4.3 days.",
    evidence: "62 pending Finance requests · median SLA breach of 1.8 days.",
    impact: "Reduce turnaround time by 65%.",
    confidence: 87,
    priority: "high",
    savings: "65% faster approvals",
    action: "Enable automatic approval for Low-Risk Finance requests.",
  },
  {
    id: "ar3",
    category: "AI Adoption",
    title: "Expand Marketing AI campaigns",
    problem: "Marketing AI adoption grew but capacity remains underutilized.",
    evidence: "Marketing AI adoption increased by 28% while maintaining 97% compliance.",
    impact: "Additional campaign throughput without raising risk.",
    confidence: 84,
    priority: "medium",
    savings: "+28% adoption sustained",
    action: "Pilot AI-assisted campaign workflows for two additional product lines.",
  },
  {
    id: "ar4",
    category: "Cost Optimization",
    title: "Reclaim unused Claude Enterprise seats",
    problem: "95 Claude Enterprise licenses remain unused.",
    evidence: "License utilization 52.5% · 55 unused + 40 underutilized seats.",
    impact: "Potential annual savings of RM115,000.",
    confidence: 96,
    priority: "high",
    savings: "RM115,000 / yr",
    action: "Reduce Claude seats to 140 and reallocate budget to Copilot expansion.",
  },
  {
    id: "ar5",
    category: "Compliance Enhancement",
    title: "Targeted DLP refresh for HR & Legal",
    problem: "HR and Legal drive the majority of high-severity policy hits.",
    evidence: "HR risk 7.4/10 · Legal 6.8/10 · compliance scores below org average.",
    impact: "Lift department compliance by ~12 pts within one quarter.",
    confidence: 88,
    priority: "high",
    savings: "+12 compliance pts",
    action: "Schedule mandatory DLP refresh workshops for HR and Legal.",
  },
];

export const EXEC_HEALTH = {
  score: 82,
  roi: 4.1,
  compliance: 87,
  adoption: 78,
  costEfficiency: 71,
  risk: 34,
  maturity: 76,
  summary:
    "Organization AI performance is strong this week. Adoption reached 78% with a 4.1× monthly ROI, while compliance held at 87%. Cost efficiency lags slightly due to unused Claude seats — reclaiming licenses could unlock ~RM115K in annual savings without reducing productivity.",
};

// ─── Shared atoms ─────────────────────────────────────────────────────────────

export function StatusPill({ label, variant }: { label: string; variant: "success"|"warning"|"danger"|"info"|"muted" }) {
  const cls = {
    success: "bg-green-50  text-green-800  ring-1 ring-green-200",
    warning: "bg-amber-50  text-amber-800  ring-1 ring-amber-200",
    danger:  "bg-red-50    text-red-800    ring-1 ring-red-200",
    info:    "bg-blue-50   text-blue-800   ring-1 ring-blue-200",
    muted:   "bg-gray-100  text-gray-600   ring-1 ring-gray-200",
  }[variant];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  const cls: Record<string,string> = {
    approved: "bg-green-500", active: "bg-green-500",
    blocked:  "bg-red-500",   review: "bg-amber-400",
    inactive: "bg-gray-300",
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${cls[status] ?? "bg-gray-400"}`} />;
}

export function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-300"}`}>
      <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${value ? "translate-x-3.5" : "translate-x-0.5"}`} />
    </button>
  );
}

export function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-xl pointer-events-none leading-relaxed whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}
