import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Shield, Database, ChevronLeft, Bell,
  CheckCircle, Plus, ChevronRight, X, Clock,
  LogOut, Settings, GitPullRequest, Search, AlertCircle,
  Lightbulb, ShieldCheck, TrendingUp, TrendingDown,
  Info, Activity, ArrowRight, ChevronDown,
} from "lucide-react";
import {
  Tip, Toggle, StatusDot,
  AI_TOOLS, AUDIT_LOGS, KANBAN,
  type AuthUser,
} from "./shared";
import { PromptGuardian } from "./PromptGuardian";

type UserSection = "home" | "gateway" | "catalog" | "requests" | "settings";

const USER_NAV: { id: UserSection; label: string; icon: any }[] = [
  { id: "home",     label: "My Dashboard", icon: LayoutDashboard },
  { id: "gateway",  label: "Gateway",       icon: Shield          },
  { id: "catalog",  label: "Tool Catalog", icon: Database        },
  { id: "requests", label: "My Requests",  icon: GitPullRequest  },
  { id: "settings", label: "Settings",     icon: Settings        },
];

const TITLES: Record<UserSection, string> = {
  home: "My Dashboard", gateway: "Gateway",
  catalog: "Tool Catalog", requests: "My Requests", settings: "Settings",
};

// ─── Shared visual atoms ──────────────────────────────────────────────────────

function ComplianceGauge({ score, size = 96 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const cx = size / 2;
  const clr = score >= 85 ? "#16a34a" : score >= 65 ? "#d97706" : "#dc2626";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f3f4f6" strokeWidth={size * 0.09} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={clr} strokeWidth={size * 0.09}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      <text x={cx} y={cx - 2} textAnchor="middle" fontSize={size * 0.22} fontWeight="700" fill={clr} fontFamily="Inter,sans-serif">{score}</text>
      <text x={cx} y={cx + size * 0.15} textAnchor="middle" fontSize={size * 0.1} fill="#9ca3af" fontFamily="Inter,sans-serif">score</text>
    </svg>
  );
}

// ─── Tool Catalog ─────────────────────────────────────────────────────────────

const DATA_CLASSIFICATIONS: Record<string, string[]> = {
  chatgpt:    ["Public data", "Internal docs", "No PII"],
  claude:     ["Public data", "Internal docs", "Legal docs", "No financial data"],
  copilot:    ["Public data", "Internal docs", "Code", "All depts"],
  gemini:     ["Public data only", "Under review"],
  midjourney: ["No company data"],
  perplexity: ["Public data", "Research only"],
};

const POPULARITY: Record<string, number> = {
  chatgpt: 82, claude: 57, copilot: 98, gemini: 21, midjourney: 0, perplexity: 12,
};

function ToolCatalog({ onNav }: { onNav: (s: UserSection) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const shown = AI_TOOLS.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.name.toLowerCase().includes(q) || t.vendor.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || t.status === statusFilter;
    return matchQ && matchS;
  });

  const statusLabel: Record<string, string> = { approved: "Available", review: "Under Review", blocked: "Not Available" };
  const statusCls:   Record<string, string> = {
    approved: "text-green-700 bg-green-50 ring-green-200",
    review:   "text-amber-700 bg-amber-50 ring-amber-200",
    blocked:  "text-gray-500 bg-gray-100 ring-gray-200",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Tool Catalog</h2>
          <p className="text-xs text-gray-400 mt-0.5">Browse approved AI tools, security certifications, and request access</p>
        </div>
        <button onClick={() => onNav("requests")} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-1.5 text-xs font-medium transition-colors">
          <Plus size={12} /> Request access
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-40 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter tools…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-600 bg-white focus:outline-none">
          <option value="all">All status</option>
          <option value="approved">Available</option>
          <option value="review">Under Review</option>
          <option value="blocked">Not Available</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {shown.map(tool => {
          const trustColor = tool.trustScore >= 85 ? "text-green-700" : tool.trustScore >= 65 ? "text-amber-700" : "text-red-700";
          const trustBar   = tool.trustScore >= 85 ? "bg-green-500" : tool.trustScore >= 65 ? "bg-amber-500" : "bg-red-500";
          const popularity = POPULARITY[tool.id] ?? 0;
          const classifications = DATA_CLASSIFICATIONS[tool.id] ?? [];
          return (
            <div key={tool.id} className={`bg-white border rounded transition-all flex flex-col ${tool.status === "blocked" ? "border-gray-100 opacity-60" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}>
              <div className="p-4 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Shield size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{tool.name}</p>
                      <p className="text-xs text-gray-400">{tool.vendor}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ring-1 flex-shrink-0 ${statusCls[tool.status]}`}>
                    {statusLabel[tool.status]}
                  </span>
                </div>

                {/* Trust score */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Trust score</span>
                    <span className={`font-bold tabular-nums ${trustColor}`}>{tool.trustScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${trustBar}`} style={{ width: `${tool.trustScore}%` }} />
                  </div>
                </div>

                {/* Security cert + risk */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="bg-gray-50 border border-gray-100 rounded p-2">
                    <p className="text-gray-400 mb-0.5">Certification</p>
                    <div className="flex items-center gap-1">
                      {tool.cert !== "None" && tool.cert !== "Pending"
                        ? <ShieldCheck size={10} className="text-green-600 flex-shrink-0" />
                        : <Info size={10} className="text-amber-500 flex-shrink-0" />}
                      <p className="font-semibold text-gray-800 truncate">{tool.cert}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded p-2">
                    <p className="text-gray-400 mb-0.5">Risk level</p>
                    <p className={`font-semibold ${tool.risk === "low" ? "text-green-700" : tool.risk === "medium" ? "text-amber-700" : "text-red-700"}`}>
                      {tool.risk.charAt(0).toUpperCase() + tool.risk.slice(1)}
                    </p>
                  </div>
                </div>

                {/* Popularity */}
                {tool.status !== "blocked" && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Popularity at Acme</span>
                      <span className="font-medium text-gray-600 tabular-nums">{popularity}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                      <div className="h-1 bg-blue-400 rounded-full" style={{ width: `${popularity}%` }} />
                    </div>
                  </div>
                )}

                {/* Data classifications */}
                {classifications.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1.5">Allowed data</p>
                    <div className="flex flex-wrap gap-1">
                      {classifications.map(c => (
                        <span key={c} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">{c}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved depts + last review */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span className="truncate mr-2">For: {tool.depts.join(", ")}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                  <Clock size={9} />
                  <span>Security review: {tool.lastReview}</span>
                </div>

                {/* Trend */}
                {tool.trend !== 0 && (
                  <div className={`flex items-center gap-1 text-xs mb-3 font-medium ${tool.trend > 0 ? "text-green-600" : "text-red-500"}`}>
                    {tool.trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    <span>{tool.trend > 0 ? "+" : ""}{tool.trend}% adoption this month</span>
                  </div>
                )}
              </div>

              {/* Action button */}
              <div className="px-4 pb-4">
                {tool.status === "approved" ? (
                  <button onClick={() => onNav("gateway")}
                    className="w-full flex items-center justify-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded py-2 text-xs font-medium transition-colors">
                    <Shield size={11} /> Use via Gateway
                  </button>
                ) : tool.status === "review" ? (
                  <button onClick={() => onNav("requests")}
                    className="w-full flex items-center justify-center gap-1.5 border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded py-2 text-xs font-medium transition-colors">
                    <Clock size={11} /> Request early access
                  </button>
                ) : (
                  <button disabled className="w-full border border-gray-200 text-gray-400 bg-gray-50 rounded py-2 text-xs font-medium cursor-not-allowed">
                    Not available
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── User Dashboard ───────────────────────────────────────────────────────────

const USER_AI_INSIGHTS = [
  { icon: ShieldCheck, type: "positive" as const, text: "Your prompts are 100% PII-free this week. Great compliance hygiene!" },
  { icon: Lightbulb, type: "info"    as const, text: "GitHub Copilot X approval is in review. Expected decision by Jul 18." },
  { icon: TrendingUp, type: "positive" as const, text: "You've used your tools 12% more efficiently compared to last month." },
];

function UserDashboard({ user, onNav }: { user: AuthUser; onNav: (s: UserSection) => void }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const myActivity = AUDIT_LOGS.filter(l => l.user === "james.wu").slice(0, 4);
  const myTools    = AI_TOOLS.filter(t => t.status === "approved");
  const myRequests = [...KANBAN.pending, ...KANBAN.approved, ...KANBAN.blocked].filter(r => r.requester === "James Wu");

  const safePrompts   = myActivity.filter(l => l.status === "approved").length;
  const totalPrompts  = myActivity.length;
  const safePromptPct = totalPrompts > 0 ? Math.round((safePrompts / totalPrompts) * 100) : 100;

  const stats = [
    { label: "Requests today",   value: "8",   sub: "+2 from yesterday",  color: "text-blue-700",  nav: "gateway"  as UserSection },
    { label: "Approved tools",   value: String(myTools.length), sub: "Ready to use", color: "text-gray-800", nav: "catalog" as UserSection },
    { label: "Pending requests", value: String(myRequests.filter(r => KANBAN.pending.some(p => p.id === r.id)).length), sub: "Awaiting review", color: "text-amber-700", nav: "requests" as UserSection },
    { label: "Safe prompt rate", value: `${safePromptPct}%`, sub: "No violations today", color: "text-green-700", nav: "gateway" as UserSection },
  ];

  const insightColorMap = {
    positive: { bg: "bg-green-50 border-green-100",  icon: "text-green-600"  },
    info:     { bg: "bg-blue-50 border-blue-100",    icon: "text-blue-600"   },
    warning:  { bg: "bg-amber-50 border-amber-100",  icon: "text-amber-600"  },
  };

  return (
    <div className="space-y-4">
      {/* Greeting banner */}
      <div className="bg-[#0f1923] rounded px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold text-base">{greeting}, {user.name.split(" ")[0]}.</p>
          <p className="text-gray-400 text-xs mt-1">Your AI access is active · {myTools.length} tools approved · Gateway online</p>
        </div>
        <button onClick={() => onNav("gateway")}
          className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-2 text-xs font-medium transition-colors flex-shrink-0">
          <Shield size={12} /> Submit AI request
        </button>
      </div>

      {/* Compliance gauge + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded p-4 flex flex-col items-center justify-center text-center">
          <ComplianceGauge score={94} size={96} />
          <p className="text-xs font-semibold text-gray-700 mt-2">Compliance Score</p>
          <p className="text-xs text-gray-400 mt-0.5">Excellent standing</p>
          <div className="mt-3 w-full flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-2.5">
            <span className="text-green-600 font-medium">↑ 2pts this week</span>
            <button onClick={() => onNav("requests")} className="text-blue-600 hover:underline">Details</button>
          </div>
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <button key={s.label} onClick={() => onNav(s.nav)} className="text-left bg-white border border-gray-200 rounded p-4 hover:border-gray-300 hover:shadow-sm transition-all">
              <p className={`text-3xl font-bold tabular-nums leading-none mb-2 ${s.color}`}>{s.value}</p>
              <p className="text-xs font-semibold text-gray-700">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Insights + Tools + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Insights */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={13} className="text-gray-500" />
            <p className="text-sm font-semibold text-gray-900">Insights</p>
          </div>
          <div className="space-y-2">
            {USER_AI_INSIGHTS.map((ins, i) => {
              const Icon = ins.icon;
              const c = insightColorMap[ins.type];
              return (
                <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded border text-xs leading-relaxed ${c.bg}`}>
                  <Icon size={11} className={`flex-shrink-0 mt-0.5 ${c.icon}`} />
                  <p className="text-gray-700">{ins.text}</p>
                </div>
              );
            })}
          </div>

          {/* Safe prompt rate bar */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500 font-medium">Safe Prompt Rate</span>
              <span className="font-bold text-green-700 tabular-nums">{safePromptPct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${safePromptPct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{safePrompts} of {totalPrompts} recent prompts approved</p>
          </div>
        </div>

        {/* Your tools */}
        <div className="bg-white border border-gray-200 rounded p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">Your Tools</p>
          <div className="space-y-2">
            {myTools.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <Shield size={12} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">{t.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-400">{t.vendor}</span>
                    {t.trustScore >= 85 && <ShieldCheck size={9} className="text-green-500" />}
                  </div>
                </div>
                <button onClick={() => onNav("gateway")} className="text-xs text-blue-600 font-medium hover:underline flex-shrink-0">Use</button>
              </div>
            ))}
          </div>
          <button onClick={() => onNav("catalog")} className="mt-3 w-full text-xs text-center text-blue-600 hover:underline py-1">
            Browse all tools →
          </button>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-gray-200 rounded p-4 flex flex-col">
          <p className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</p>
          <div className="space-y-2 flex-1">
            {[
              { label: "Submit AI request",   nav: "gateway"  as UserSection, desc: "Run a prompt through the secure gateway", primary: true  },
              { label: "Browse tool catalog", nav: "catalog"  as UserSection, desc: "Explore and request new AI tools",         primary: false },
              { label: "View my requests",    nav: "requests" as UserSection, desc: "Track approval status of your submissions", primary: false },
              { label: "Account settings",    nav: "settings" as UserSection, desc: "Update preferences and notifications",     primary: false },
            ].map(a => (
              <button key={a.label} onClick={() => onNav(a.nav)}
                className={`w-full text-left px-3 py-2.5 rounded border text-xs transition-colors ${
                  a.primary
                    ? "bg-blue-700 hover:bg-blue-600 text-white border-transparent"
                    : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
                }`}>
                <p className={`font-medium ${a.primary ? "text-white" : "text-gray-900"}`}>{a.label}</p>
                <p className={`mt-0.5 ${a.primary ? "text-blue-200" : "text-gray-400"}`}>{a.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">Recent Activity</p>
          </div>
          <button onClick={() => onNav("requests")} className="text-xs text-blue-600 hover:underline">Full history</button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50">
              {["Request ID","Tool","Action","Risk Score","Status","Time"].map(h => (
                <th key={h} className="px-4 py-2 text-left font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {myActivity.map((log, idx) => (
              <tr key={log.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                <td className="px-4 py-2.5 font-mono text-blue-700 font-medium">{log.id}</td>
                <td className="px-4 py-2.5 text-gray-700">{log.tool}</td>
                <td className="px-4 py-2.5 text-gray-500">{log.action}</td>
                <td className="px-4 py-2.5">
                  <span className={`font-bold tabular-nums ${log.riskScore >= 7 ? "text-red-600" : log.riskScore >= 4 ? "text-amber-600" : "text-green-600"}`}>{log.riskScore}</span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <StatusDot status={log.status} />
                    <span className="capitalize text-gray-600">{log.status}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-gray-400 font-mono whitespace-nowrap">{log.ts.split(" ")[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── My Requests ──────────────────────────────────────────────────────────────

const REQUEST_EXTRAS: Record<string, {
  aiRec: string; recConfidence: number;
  reviewerComment: string; reviewer: string; commentTime: string;
  auditRef: string;
}> = {
  "APR-043": {
    aiRec: "Approve — low risk, well-scoped engineering use case with no PII exposure.",
    recConfidence: 94,
    reviewerComment: "Reviewed vendor security documentation. Code completion use case is well-defined.",
    reviewer: "JS", commentTime: "Jul 15, 10:22",
    auditRef: "AUD-3343",
  },
  "APR-039": {
    aiRec: "Approved — Claude for Work meets all compliance requirements for Engineering workflows.",
    recConfidence: 91,
    reviewerComment: "DPA reviewed. Data residency confirmed EU-compliant. Approved for Engineering.",
    reviewer: "AK", commentTime: "Jul 13, 14:05",
    auditRef: "AUD-3339",
  },
};

const REQUEST_TIMELINE: Record<string, { label: string; time: string; done: boolean }[]> = {
  "APR-043": [
    { label: "Request submitted",     time: "Jul 15, 09:00", done: true  },
    { label: "Auto-risk assessment",  time: "Jul 15, 09:01", done: true  },
    { label: "Assigned to reviewers", time: "Jul 15, 09:05", done: true  },
    { label: "Security review",       time: "In progress",   done: false },
    { label: "Decision",              time: "Pending",       done: false },
  ],
  "APR-039": [
    { label: "Request submitted",     time: "Jul 12, 11:00", done: true  },
    { label: "Auto-risk assessment",  time: "Jul 12, 11:00", done: true  },
    { label: "Assigned to reviewers", time: "Jul 12, 11:10", done: true  },
    { label: "Security review",       time: "Jul 13, 14:00", done: true  },
    { label: "Approved",              time: "Jul 13, 14:05", done: true  },
  ],
};

function MyRequests() {
  const allRequests = [
    ...KANBAN.pending .filter(r => r.requester === "James Wu").map(r => ({ ...r, status: "pending"  as const })),
    ...KANBAN.approved.filter(r => r.requester === "James Wu").map(r => ({ ...r, status: "approved" as const })),
    ...KANBAN.blocked .filter(r => r.requester === "James Wu").map(r => ({ ...r, status: "blocked"  as const })),
  ];

  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ tool: "", reason: "" });
  const [submitted, setSubmitted]     = useState(false);
  const [expanded, setExpanded]       = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(v => ({ ...v, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tool || !form.reason) return;
    setSubmitted(true);
    setTimeout(() => { setShowForm(false); setSubmitted(false); setForm({ tool: "", reason: "" }); }, 2000);
  };

  const statusCls: Record<string,string> = {
    pending:  "text-amber-700  bg-amber-50  ring-amber-200",
    approved: "text-green-700  bg-green-50  ring-green-200",
    blocked:  "text-red-700    bg-red-50    ring-red-200",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">My Requests</h2>
          <p className="text-xs text-gray-400 mt-0.5">Tool access requests · click any card to expand details</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-1.5 text-xs font-medium transition-colors">
          <Plus size={12} /> New request
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Request tool access</p>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={14} /></button>
          </div>
          {submitted ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
              <CheckCircle size={16} className="text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">Request submitted</p>
                <p className="text-xs text-green-700 mt-0.5">Your security team will review it shortly.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tool</label>
                <select value={form.tool} onChange={set("tool")}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a tool…</option>
                  {AI_TOOLS.filter(t => t.status !== "approved").map(t => (
                    <option key={t.id} value={t.id}>{t.name} — {t.vendor}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Business justification</label>
                <textarea value={form.reason} onChange={set("reason")} rows={3}
                  placeholder="Describe how you'll use this tool and why it's needed for your work…"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-700 hover:bg-blue-600 text-white rounded px-4 py-2 text-xs font-semibold transition-colors">Submit</button>
                <button type="button" onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 rounded px-4 py-2 text-xs font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {allRequests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded p-10 text-center">
          <p className="text-sm font-medium text-gray-500">No requests yet</p>
          <p className="text-xs text-gray-400 mt-1">Submit a request to gain access to additional AI tools.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-blue-600 hover:underline">Make your first request →</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {allRequests.map(r => {
            const isExpanded  = expanded === r.id;
            const extras      = REQUEST_EXTRAS[r.id];
            const timeline    = REQUEST_TIMELINE[r.id];
            const confColor   = extras?.recConfidence >= 80 ? "text-green-700" : extras?.recConfidence >= 60 ? "text-amber-700" : "text-red-700";

            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded overflow-hidden">
                {/* Card header — always visible */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                  className="w-full text-left p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-gray-400">{r.id}</span>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ring-1 ${statusCls[r.status]}`}>
                          {r.status}
                        </span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ring-1 ${r.risk === "high" ? "text-red-700 bg-red-50 ring-red-200" : r.risk === "medium" ? "text-amber-700 bg-amber-50 ring-amber-200" : "text-green-700 bg-green-50 ring-green-200"}`}>
                          {r.risk} risk
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{r.tool}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span className="text-xs text-gray-400">{r.date}</span>
                      <ChevronDown size={13} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {r.reviewers.map(rv => (
                        <div key={rv} className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-white border border-white" style={{ fontSize: 8 }}>{rv}</div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 ml-1">Reviewers assigned</span>
                    {r.comments > 0 && <span className="text-xs text-gray-400 ml-auto">{r.comments} comment{r.comments > 1 ? "s" : ""}</span>}
                    {r.status === "blocked" && (
                      <span className="text-xs text-red-500 ml-auto flex items-center gap-1"><AlertCircle size={10} />Contact security for details</span>
                    )}
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4 text-xs" style={{ animation: "fadeUp 0.15s ease" }}>

                    {/* Recommendation */}
                    {extras && (
                      <div className="border border-gray-200 bg-gray-50 rounded p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Lightbulb size={10} className="text-gray-500" />
                            <p className="font-semibold text-gray-700">Recommendation</p>
                          </div>
                          <span className={`font-bold ${confColor}`}>{extras.recConfidence}% confidence</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{extras.aiRec}</p>
                      </div>
                    )}

                    {/* Approval timeline */}
                    {timeline && (
                      <div>
                        <p className="font-semibold text-gray-600 mb-2 uppercase tracking-wide text-xs">Approval Timeline</p>
                        <div className="relative">
                          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                          {timeline.map((step, i) => (
                            <div key={i} className="flex items-start gap-3 pl-1 py-1.5">
                              <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border-2 mt-0.5 z-10 ${step.done ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`} />
                              <div className="flex-1 flex items-center justify-between">
                                <p className={step.done ? "text-gray-900 font-medium" : "text-gray-400"}>{step.label}</p>
                                <p className={`font-mono ${step.done ? "text-gray-500" : "text-gray-300"}`}>{step.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviewer comment */}
                    {extras && (
                      <div>
                        <p className="font-semibold text-gray-600 mb-2 uppercase tracking-wide text-xs">Reviewer Notes</p>
                        <div className="bg-white border border-gray-100 rounded p-3 flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5" style={{ fontSize: 8 }}>{extras.reviewer}</div>
                          <div>
                            <p className="font-medium text-gray-900 leading-relaxed">{extras.reviewerComment}</p>
                            <p className="text-gray-400 mt-0.5">{extras.commentTime}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Audit ref + risk score */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      {extras && (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Info size={10} />
                          <span>Audit ref: <span className="font-mono text-blue-600">{extras.auditRef}</span></span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-gray-400 ml-auto">
                        <span>Risk: </span>
                        <span className={`font-bold ${r.risk === "high" ? "text-red-600" : r.risk === "medium" ? "text-amber-600" : "text-green-600"}`}>{r.risk}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── User Settings ────────────────────────────────────────────────────────────

function UserSettingsPage({ user }: { user: AuthUser }) {
  const [notifs, setNotifs]   = useState(true);
  const [digest, setDigest]   = useState(false);
  const [blocked, setBlocked] = useState(true);

  return (
    <div className="w-full space-y-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Settings</h2>
        <p className="text-xs text-gray-400 mt-0.5">Profile and notification preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Profile</p>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {user.initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
              <p className="text-xs text-gray-400">{user.dept} · Standard User</p>
            </div>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
            {[["Full name", user.name],["Email", user.email],["Department", user.dept],["Role","Standard User"]].map(([l,v]) => (
              <div key={l} className="bg-gray-50 border border-gray-100 rounded p-2.5">
                <p className="text-xs text-gray-400 mb-0.5">{l}</p>
                <p className="text-xs font-medium text-gray-800">{v}</p>
              </div>
            ))}
          </div>
          <button className="mt-3 text-xs text-blue-600 hover:underline">Request profile update →</button>
        </div>

        <div className="bg-white border border-gray-200 rounded p-5 flex flex-col">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Compliance</p>
          <div className="flex flex-col items-center text-center gap-3 flex-1 justify-center">
            <ComplianceGauge score={94} size={96} />
            <div>
              <p className="text-lg font-bold text-green-700 tabular-nums">94%</p>
              <p className="text-xs text-gray-600 font-medium">Your compliance score</p>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed max-w-[220px]">Excellent — keep your prompts free of sensitive data to maintain your score.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white border border-gray-200 rounded divide-y divide-gray-100">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notifications</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {[
              { key: "notifs",  label: "Request status updates", desc: "Email when your requests are approved or rejected",  val: notifs,  set: () => setNotifs(v => !v)  },
              { key: "blocked", label: "Blocked prompt alerts",  desc: "Notify me when one of my prompts is blocked",        val: blocked, set: () => setBlocked(v => !v) },
              { key: "digest",  label: "Weekly activity digest", desc: "Summary of your AI usage and compliance score",      val: digest,  set: () => setDigest(v => !v)  },
            ].map(s => (
              <div key={s.key} className="flex items-center justify-between px-4 py-3.5 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-xs text-gray-400">{s.val ? "on" : "off"}</span>
                  <Toggle value={s.val} onChange={s.set} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── User Shell ───────────────────────────────────────────────────────────────

function UserSidebar({ active, onNav, user, onLogout, collapsed, onToggle }: {
  active: UserSection; onNav: (s: UserSection) => void;
  user: AuthUser; onLogout: () => void;
  collapsed: boolean; onToggle: () => void;
}) {
  const pendingCount = KANBAN.pending.filter(r => r.requester === "James Wu").length;

  return (
    <aside className={`flex flex-col h-full bg-[#0f1923] flex-shrink-0 transition-all duration-250 ${collapsed ? "w-[52px]" : "w-[208px]"}`}>
      <div className={`flex items-center h-12 border-b border-white/[0.06] ${collapsed ? "justify-center py-3" : "gap-2.5 px-4 py-3"}`}>
        <Shield size={14} className="text-blue-400 flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-white text-sm font-semibold tracking-tight">SentinelAI</span>
          </div>
        )}
      </div>
      <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
        {USER_NAV.map(item => {
          const isActive = active === item.id;
          const badge = item.id === "requests" && pendingCount > 0 ? String(pendingCount) : undefined;
          return (
            <button key={item.id} onClick={() => onNav(item.id)} title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-2.5 py-2 rounded text-left transition-colors text-[13px] ${
                isActive
                  ? "bg-white/10 text-white font-medium border-l-2 border-blue-400"
                  : "text-gray-400 hover:bg-white/[0.06] hover:text-gray-200 border-l-2 border-transparent"
              } ${collapsed ? "justify-center px-0 border-l-0" : "px-2.5"}`}
              style={isActive && !collapsed ? { paddingLeft: "calc(0.625rem - 2px)" } : undefined}>
              <item.icon size={14} className="flex-shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && badge && (
                <span className="bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold flex-shrink-0" style={{ fontSize: 9 }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-white/[0.06] p-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 9 }}>{user.initials}</div>
            <div className="min-w-0">
              <p className="text-gray-200 text-xs font-medium truncate">{user.name}</p>
              <p className="text-gray-500 text-xs">{user.dept}</p>
            </div>
          </div>
        )}
        <button onClick={onLogout} className={`w-full flex items-center py-2 rounded text-gray-500 hover:bg-white/[0.06] hover:text-gray-300 transition-colors ${collapsed ? "justify-center" : "px-2 gap-2"}`}>
          <LogOut size={13} />
          {!collapsed && <span className="text-xs">Sign out</span>}
        </button>
        <button onClick={onToggle} className={`w-full flex items-center py-2 rounded text-gray-500 hover:bg-white/[0.06] hover:text-gray-300 transition-colors mt-0.5 ${collapsed ? "justify-center" : "px-2 gap-2"}`}>
          <ChevronLeft size={13} className={`transition-transform duration-250 ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function UserHeader({ section, user }: { section: UserSection; user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([
    { id: 1, text: "APR-043 is pending security review", time: "1 hr ago", dot: "bg-amber-400" },
    { id: 2, text: "APR-039 approved: Claude for Work",  time: "Jul 13",   dot: "bg-green-500" },
    { id: 3, text: "Prompt blocked — PII detected",       time: "Jul 12",   dot: "bg-red-500"   },
  ]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = (id: number) => setNotifs(prev => prev.filter(n => n.id !== id));
  const markAllRead = () => setNotifs([]);

  return (
    <header className="h-12 bg-white border-b border-gray-200 px-5 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span>SentinelAI</span>
        <ChevronRight size={11} />
        <span className="text-gray-700 font-semibold">{TITLES[section]}</span>
      </div>
      <div className="flex items-center gap-2" ref={ref}>
        <button onClick={() => setOpen(v => !v)} className="relative p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors">
          <Bell size={15} />
          {notifs.length > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
          )}
        </button>
        {open && (
          <div className="absolute right-5 top-12 w-80 bg-white rounded border border-gray-200 shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              {notifs.length > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {notifs.length === 0 ? (
                <p className="px-3 py-6 text-xs text-gray-400 text-center">No new notifications</p>
              ) : notifs.map(n => (
                <div key={n.id} className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors group">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${n.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 leading-tight">{n.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                  </div>
                  <button
                    onClick={() => markRead(n.id)}
                    title="Mark as Read"
                    className="flex-shrink-0 mt-0.5 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-medium transition-colors"
                  >
                    Mark as Read
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <Tip text={`${user.name} · ${user.dept}`}>
          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-gray-500 transition-colors" style={{ fontSize: 9 }}>{user.initials}</div>
        </Tip>
      </div>
    </header>
  );
}

// ─── UserApp Root ─────────────────────────────────────────────────────────────

export function UserApp({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [section,   setSection]   = useState<UserSection>("home");
  const [collapsed, setCollapsed] = useState(false);

  const views: Record<UserSection, React.ReactNode> = {
    home:     <UserDashboard user={user} onNav={setSection} />,
    gateway:  <PromptGuardian />,
    catalog:  <ToolCatalog onNav={setSection} />,
    requests: <MyRequests />,
    settings: <UserSettingsPage user={user} />,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#f2f3f5" }}>
      <UserSidebar active={section} onNav={setSection} user={user} onLogout={onLogout} collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <UserHeader section={section} user={user} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          <div key={section} style={{ animation: "fadeUp 0.18s ease both" }}>
            {views[section]}
          </div>
        </main>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
