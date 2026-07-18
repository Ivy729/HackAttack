import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, GitPullRequest, BarChart2, FileText,
  Settings, Users, ChevronLeft, Bell, Search,
  CheckCircle, XCircle, AlertTriangle, Shield,
  TrendingUp, TrendingDown, Activity, BookOpen, ArrowRight,
  Plus, MoreHorizontal, ChevronDown, ChevronRight, X,
  Clock, Filter, LogOut, Lightbulb, Target,
  AlertOctagon, Zap, Eye, MessageSquare, Lock, Send,
  Info, ShieldCheck, DollarSign, Briefcase,
} from "lucide-react";
import {
  AreaChart, Area, BarChart as RBarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import {
  tooltipStyle, StatusDot, Toggle, Tip,
  USAGE_DATA_14, DEPT_DATA, COMPLIANCE_PIE, RISK_TREND, DEPT_RISK,
  INITIAL_INCIDENTS, INCIDENT_POOL, AUDIT_LOGS, KANBAN, POLICIES_DATA, USERS,
  type AuthUser,
} from "./shared";
import {
  AIROIDashboard, CostLicenseDashboard, ExecutiveAIAdvisor, ExecutiveIntelligenceBanner,
} from "./ExecutiveIntelligence";

type AdminSection =
  | "dashboard" | "workflow" | "analytics" | "audit" | "policies" | "users" | "settings"
  | "exec-roi" | "exec-cost" | "exec-advisor";

const NAV: { id: AdminSection; label: string; icon: any }[] = [
  { id: "dashboard",     label: "Dashboard",       icon: LayoutDashboard },
  { id: "exec-roi",      label: "AI ROI",          icon: TrendingUp      },
  { id: "exec-cost",     label: "Cost Optimize",   icon: DollarSign      },
  { id: "exec-advisor",  label: "AI Advisor",      icon: Briefcase       },
  { id: "workflow",      label: "Approvals",       icon: GitPullRequest  },
  { id: "analytics",     label: "Risk Analytics",  icon: BarChart2       },
  { id: "audit",         label: "Audit Logs",      icon: FileText        },
  { id: "policies",      label: "Policies",        icon: BookOpen        },
  { id: "users",         label: "User Management", icon: Users           },
  { id: "settings",      label: "Settings",        icon: Settings        },
];
const TITLES: Record<AdminSection, string> = {
  dashboard: "Dashboard",
  "exec-roi": "AI ROI",
  "exec-cost": "Cost Optimize",
  "exec-advisor": "AI Advisor",
  workflow: "Approvals", analytics: "Risk Analytics",
  audit: "Audit Logs", policies: "Policies", users: "User Management", settings: "Settings",
};

// ─── Shared visual atoms ──────────────────────────────────────────────────────

function HealthGauge({ score, size = 108 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const cx = size / 2;
  const clr = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  const lbl = score >= 80 ? "Excellent" : score >= 60 ? "Moderate" : "At Risk";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f3f4f6" strokeWidth={size * 0.09} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={clr} strokeWidth={size * 0.09}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      <text x={cx} y={cx - 3} textAnchor="middle" fontSize={size * 0.22} fontWeight="700" fill={clr} fontFamily="Inter,sans-serif">{score}</text>
      <text x={cx} y={cx + size * 0.14} textAnchor="middle" fontSize={size * 0.09} fill="#6b7280" fontFamily="Inter,sans-serif">{lbl}</text>
    </svg>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function HealthBanner() {
  const metrics = [
    { label: "Governance Score", value: "87", unit: "/100", color: "text-emerald-400", tip: "Composite score: compliance rate, incident count, policy coverage, and tool approval ratio." },
    { label: "Compliance Rate",  value: "87%",unit: "",     color: "text-emerald-400", tip: "Requests fully compliant with all active governance policies." },
    { label: "Active Requests",  value: "1,247",unit:"",    color: "text-white",       tip: "Total requests processed through the gateway in the last 30 days." },
    { label: "Blocked Today",    value: "47", unit: "",     color: "text-red-400",     tip: "Requests blocked by governance policies in the last 24 hours." },
    { label: "Pending Review",   value: "3",  unit: "",     color: "text-amber-400",   tip: "Tool access requests awaiting security team sign-off." },
    { label: "Shadow Tools",     value: "12", unit: "",     color: "text-slate-400",   tip: "Unregistered tools detected accessing company resources this month." },
  ];
  return (
    <div className="bg-[#0f1923] border border-gray-700/50 rounded px-5 py-3 mb-4 flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Shield size={14} className="text-blue-400" />
        <span className="text-gray-300 text-xs font-medium tracking-wide uppercase">SentinelAI</span>
        <span className="text-gray-600 mx-1">·</span>
        <span className="text-xs text-green-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          Gateway Online
        </span>
      </div>
      <div className="h-4 w-px bg-gray-700 hidden sm:block" />
      <div className="flex items-center gap-5 flex-wrap flex-1">
        {metrics.map(m => (
          <Tip key={m.label} text={m.tip}>
            <div className="flex items-baseline gap-1 cursor-help">
              <span className={`text-sm font-bold tabular-nums ${m.color}`}>{m.value}</span>
              {m.unit && <span className="text-xs text-gray-500">{m.unit}</span>}
              <span className="text-gray-500 text-xs ml-1">{m.label}</span>
            </div>
          </Tip>
        ))}
      </div>
    </div>
  );
}

function QuickActions({ onNav }: { onNav: (s: AdminSection) => void }) {
  const actions = [
    { label: "AI ROI",            action: () => onNav("exec-roi"),     primary: false },
    { label: "Cost Optimize",     action: () => onNav("exec-cost"),    primary: false },
    { label: "AI Advisor",        action: () => onNav("exec-advisor"), primary: false },
    { label: "Review Incidents",  action: () => onNav("analytics"),    primary: false },
    { label: "Audit Logs",        action: () => onNav("audit"),        primary: false },
    { label: "User Management",   action: () => onNav("users"),        primary: true  },
  ];
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <span className="text-xs text-gray-400 mr-1">Quick actions:</span>
      {actions.map(a => (
        <button key={a.label} onClick={a.action}
          className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
            a.primary
              ? "bg-blue-700 hover:bg-blue-600 text-white"
              : "bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900"
          }`}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

const AI_INSIGHTS_DATA = [
  { icon: TrendingUp,   type: "positive" as const, text: "Engineering compliance improved +12% this week following the new DLP policy rollout." },
  { icon: AlertOctagon, type: "warning"  as const, text: "3 Finance team members have repeated high-risk prompts — compliance training recommended." },
  { icon: Target,       type: "info"     as const, text: "Unauthorized tool usage fell 23% after policy enforcement. 12 unregistered tools still detected." },
  { icon: ShieldCheck,  type: "positive" as const, text: "Auto-redaction prevented 47 potential data breaches in the past 7 days." },
];

function AIInsightPanel() {
  const colorMap = {
    positive: { bg: "bg-gray-50 border-gray-100",  icon: "text-green-600"  },
    warning:  { bg: "bg-amber-50 border-amber-100", icon: "text-amber-600"  },
    info:     { bg: "bg-gray-50 border-gray-100",   icon: "text-blue-600"   },
  };
  return (
    <div className="bg-white border border-gray-200 rounded p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={13} className="text-gray-500" />
        <p className="text-sm font-semibold text-gray-900">Insights</p>
        <span className="ml-auto text-xs text-gray-400">Updated just now</span>
      </div>
      <div className="space-y-2 flex-1">
        {AI_INSIGHTS_DATA.map((ins, i) => {
          const Icon = ins.icon;
          const c = colorMap[ins.type];
          return (
            <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded border text-xs leading-relaxed ${c.bg}`}>
              <Icon size={11} className={`flex-shrink-0 mt-0.5 ${c.icon}`} />
              <p className="text-gray-700">{ins.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeptRiskHeatmap() {
  return (
    <div className="bg-white border border-gray-200 rounded p-4">
      <p className="text-sm font-semibold text-gray-900 mb-3">Department Risk Heatmap</p>
      <div className="grid grid-cols-3 gap-2">
        {DEPT_RISK.map(d => {
          const c = d.score >= 7
            ? { bg: "bg-red-50 border-red-200",    text: "text-red-700",    bar: "bg-red-500"    }
            : d.score >= 5
            ? { bg: "bg-amber-50 border-amber-200",text: "text-amber-700",  bar: "bg-amber-500"  }
            : d.score >= 3
            ? { bg: "bg-yellow-50 border-yellow-200",text: "text-yellow-700", bar: "bg-yellow-400" }
            : { bg: "bg-green-50 border-green-200",text: "text-green-700",  bar: "bg-green-500"  };
          const tipText = `${d.dept}: Risk ${d.score}/10. ${d.score >= 7 ? "High — immediate attention." : d.score >= 5 ? "Moderate — monitor closely." : "Low — within range."}`;
          return (
            <Tip key={d.dept} text={tipText}>
              <div className={`border rounded p-3 text-center cursor-help hover:scale-105 transition-transform ${c.bg}`}>
                <p className="text-xs font-semibold text-gray-700 mb-1.5 truncate">{d.dept}</p>
                <div className="w-full bg-white/60 rounded-full h-1.5 mb-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${c.bar}`} style={{ width: `${d.score * 10}%` }} />
                </div>
                <p className={`text-xl font-bold tabular-nums ${c.text}`}>{d.score}</p>
                <p className="text-xs text-gray-400">/10</p>
              </div>
            </Tip>
          );
        })}
      </div>
    </div>
  );
}

let incidentPoolIdx = 0;
let incidentIdCounter = 100;

function LiveFeed() {
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [newId, setNewId] = useState<number | null>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      const template = INCIDENT_POOL[incidentPoolIdx % INCIDENT_POOL.length];
      incidentPoolIdx++;
      const next = { id: ++incidentIdCounter, ts: "just now", ...template };
      setIncidents(prev => [next, ...prev.slice(0, 4)]);
      setNewId(next.id);
      setTimeout(() => setNewId(null), 2000);
    }, 7000);
    return () => clearInterval(timer);
  }, []);
  const sevColor: Record<string,string> = { critical: "bg-red-500", high: "bg-orange-400", medium: "bg-amber-400" };
  const sevLabel: Record<string,string> = { critical: "CRIT", high: "HIGH", medium: "MED" };
  return (
    <div className="bg-white border border-gray-200 rounded flex flex-col" style={{ minHeight: 320 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Security Alerts</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
        <button className="text-xs text-blue-600 hover:underline">All alerts</button>
      </div>
      <div className="divide-y divide-gray-50 flex-1">
        {incidents.map(a => (
          <div key={a.id} className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-700 ${a.id === newId ? "bg-blue-50" : "hover:bg-gray-50"}`}>
            <span className={`w-1 h-6 rounded-full flex-shrink-0 ${sevColor[a.severity] ?? "bg-gray-300"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{a.event}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate font-mono">{a.user} · {a.tool} · {a.ts}</p>
            </div>
            <span className={`text-xs font-bold flex-shrink-0 ${a.severity === "critical" ? "text-red-600" : a.severity === "high" ? "text-orange-500" : "text-amber-600"}`}>
              {sevLabel[a.severity]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ onNav }: { onNav: (s: AdminSection) => void }) {
  const [dateRange, setDateRange] = useState("14d");
  const [deptFilter, setDeptFilter] = useState("all");
  const [toolFilter, setToolFilter] = useState("all");

  const rawUsage = dateRange === "7d" ? USAGE_DATA_14.slice(-7) : USAGE_DATA_14;
  const usageData = rawUsage.map(d => ({
    date:    d.date,
    copilot: toolFilter === "all" || toolFilter === "copilot" ? d.copilot : null,
    chatgpt: toolFilter === "all" || toolFilter === "chatgpt" ? d.chatgpt : null,
    claude:  toolFilter === "all" || toolFilter === "claude"  ? d.claude  : null,
  }));
  const deptData = deptFilter === "all" ? DEPT_DATA : DEPT_DATA.filter(d => d.dept.toLowerCase() === deptFilter);

  const kpis = [
    { label: "Approved Tools",   value: "4",     sub: "of 6 registered",       trend: null, nav: "audit"     as AdminSection, accent: "text-blue-700"   },
    { label: "Blocked Prompts",  value: "1,247", sub: "last 30 days",           trend: -12,  nav: "audit"     as AdminSection, accent: "text-red-700"    },
    { label: "Compliance",       value: "87%",   sub: "↑ 6pts from last month", trend: 6,    nav: "analytics" as AdminSection, accent: "text-green-700"  },
    { label: "High-Risk Events", value: "34",    sub: "need attention",         trend: 8,    nav: "analytics" as AdminSection, accent: "text-amber-700"  },
    { label: "Shadow AI",        value: "12",    sub: "unregistered tools",     trend: -25,  nav: "analytics" as AdminSection, accent: "text-slate-700"   },
  ];

  return (
    <div className="space-y-4">
      <HealthBanner />
      <ExecutiveIntelligenceBanner onNav={onNav} />
      <QuickActions onNav={onNav} />

      {/* Governance score card + KPI grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded p-5 flex flex-col items-center justify-center text-center gap-2">
          <HealthGauge score={87} size={112} />
          <div>
            <p className="text-xs font-semibold text-gray-700">Governance Health</p>
            <p className="text-xs text-gray-400 mt-0.5">↑ 6pts from last month</p>
          </div>
          <div className="flex gap-4 text-xs text-gray-500 border-t border-gray-100 pt-2 w-full justify-center mt-1">
            <div className="text-center"><p className="font-bold text-gray-900 text-sm">87%</p><p>Compliant</p></div>
            <div className="text-center"><p className="font-bold text-gray-900 text-sm">12</p><p>Shadow AI</p></div>
            <div className="text-center"><p className="font-bold text-gray-900 text-sm">34</p><p>Incidents</p></div>
          </div>
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-3">
          {kpis.map(k => (
            <Tip key={k.label} text={`Open ${TITLES[k.nav]}`}>
              <button onClick={() => onNav(k.nav)} className="text-left w-full bg-white border border-gray-200 rounded hover:border-gray-300 hover:shadow-sm p-4 transition-all">
                <p className={`text-3xl font-bold tabular-nums leading-none mb-2 ${k.accent}`}>{k.value}</p>
                <p className="text-xs font-semibold text-gray-700">{k.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
                {k.trend !== null && (
                  <p className={`text-xs mt-2 font-medium ${k.trend > 0 ? "text-green-600" : "text-red-500"}`}>
                    {k.trend > 0 ? "▲" : "▼"} {Math.abs(k.trend)}% vs last period
                  </p>
                )}
              </button>
            </Tip>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">Request Volume</p>
              <p className="text-xs text-gray-400">Daily requests by tool</p>
            </div>
            <div className="flex gap-2">
              <select value={toolFilter} onChange={e => setToolFilter(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white focus:outline-none">
                <option value="all">All tools</option>
                <option value="copilot">Copilot</option>
                <option value="chatgpt">ChatGPT</option>
                <option value="claude">Claude</option>
              </select>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white focus:outline-none">
                <option value="7d">7 days</option>
                <option value="14d">14 days</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="copilot" name="Copilot" stroke="#1d4ed8" strokeWidth={1.5} fill="#1d4ed8" fillOpacity={0.06} connectNulls={false} />
              <Area type="monotone" dataKey="chatgpt" name="ChatGPT" stroke="#475569" strokeWidth={1.5} fill="#475569" fillOpacity={0.06} connectNulls={false} />
              <Area type="monotone" dataKey="claude"  name="Claude"  stroke="#0f766e" strokeWidth={1.5} fill="#0f766e" fillOpacity={0.06} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-gray-200 rounded p-5">
          <p className="text-sm font-semibold text-gray-900 mb-0.5">Compliance Breakdown</p>
          <p className="text-xs text-gray-400 mb-4">All departments</p>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={COMPLIANCE_PIE} cx="50%" cy="50%" innerRadius={44} outerRadius={62} paddingAngle={2} dataKey="value">
                {COMPLIANCE_PIE.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {COMPLIANCE_PIE.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-xs text-gray-500">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-800 tabular-nums">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DeptRiskHeatmap />
        </div>
        <AIInsightPanel />
      </div>

      {/* Dept chart + Live feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Department Activity</p>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white focus:outline-none">
              <option value="all">All departments</option>
              {DEPT_DATA.map(d => <option key={d.dept} value={d.dept.toLowerCase()}>{d.dept}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RBarChart data={deptData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="dept" type="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={68} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="requests" name="Dept Requests" fill="#1d4ed8" radius={[0, 2, 2, 0]} />
              <Bar dataKey="blocked"  name="Dept Blocked"  fill="#fca5a5" radius={[0, 2, 2, 0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
        <LiveFeed />
      </div>
    </div>
  );
}

// ─── Approval Workflow ────────────────────────────────────────────────────────

type KanbanCard = (typeof KANBAN.pending)[0];

const CARD_AI_RECS: Record<string, {
  confidence: number; rec: string; reason: string;
  originalPrompt: string; redactedPrompt: string;
  violations: number; auditRef: string;
}> = {
  "APR-041": {
    confidence: 72,
    rec: "Approve with monitoring",
    reason: "Competitive intelligence tools carry medium data exfiltration risk. Recommend enabling usage logging and scheduling a quarterly security review.",
    originalPrompt: "Analyze Q3 competitor pricing. Reference: CompetitorPricing_CONFIDENTIAL_2026.xlsx — revenue $34.2M, margin 18.4%. Compare against Acme's internal targets.",
    redactedPrompt: "Analyze Q3 competitor pricing. Reference: [REDACTED_DOC] — revenue [FINANCIAL_DATA], margin [FINANCIAL_DATA]. Compare against Acme's internal targets.",
    violations: 1, auditRef: "AUD-3341",
  },
  "APR-042": {
    confidence: 61,
    rec: "Request business justification",
    reason: "Gemini Advanced lacks enterprise DPA for Finance and Legal. Data residency confirmation required before approval can proceed.",
    originalPrompt: "Review product roadmap and identify market gaps. Reference: ProductRoadmap_2027_INTERNAL.pptx — confidential strategy deck from CEO offsite.",
    redactedPrompt: "Review product roadmap and identify market gaps. Reference: [REDACTED_DOC] — confidential strategy deck from [REDACTED_PERSON] offsite.",
    violations: 0, auditRef: "AUD-3342",
  },
  "APR-043": {
    confidence: 94,
    rec: "Approve",
    reason: "GitHub Copilot X has passed all security reviews. Engineering use case is well-scoped with minimal PII exposure risk and a strong audit trail.",
    originalPrompt: "Improve TypeScript code completion for internal dev tooling. No customer data or PII involved in the developer workflow at any stage.",
    redactedPrompt: "Improve TypeScript code completion for internal dev tooling. No customer data or PII involved in the developer workflow at any stage.",
    violations: 0, auditRef: "AUD-3343",
  },
};

const DEFAULT_REC = {
  confidence: 70, rec: "Review required",
  reason: "Insufficient data for automated risk assessment. Manual security review recommended.",
  originalPrompt: "Prompt not captured.", redactedPrompt: "Prompt not captured.",
  violations: 0, auditRef: "AUD-0000",
};

function RequestDetailPanel({ card, onClose, onApprove, onReject }: {
  card: KanbanCard; onClose: () => void;
  onApprove: () => void; onReject: (reason: string) => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [showRedacted, setShowRedacted] = useState(true);
  const rec = CARD_AI_RECS[card.id] ?? DEFAULT_REC;

  const confColor = rec.confidence >= 80 ? "text-green-700 bg-green-50 ring-green-200"
    : rec.confidence >= 60 ? "text-amber-700 bg-amber-50 ring-amber-200"
    : "text-red-700 bg-red-50 ring-red-200";

  const timeline = [
    { label: "Request submitted",     time: `${card.date}, 09:14`, done: true  },
    { label: "Auto-risk assessment",  time: `${card.date}, 09:14`, done: true  },
    { label: "Assigned to reviewers", time: `${card.date}, 09:15`, done: true  },
    { label: "Security review",       time: "In progress",         done: false },
    { label: "Decision",              time: "Pending",             done: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-full max-w-md bg-white border-l border-gray-200 shadow-2xl overflow-y-auto flex flex-col"
        style={{ animation: "slideIn 0.2s ease" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 font-mono">{card.id}</p>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ring-1 ${card.risk === "high" ? "text-red-700 bg-red-50 ring-red-200" : card.risk === "medium" ? "text-amber-700 bg-amber-50 ring-amber-200" : "text-green-700 bg-green-50 ring-green-200"}`}>
                {card.risk} risk
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{card.tool} · {card.dept}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500"><X size={15} /></button>
        </div>

        <div className="p-5 space-y-5 text-xs flex-1">

          {/* Requester info */}
          <div className="grid grid-cols-2 gap-2">
            {[["Requester", card.requester], ["Department", card.dept], ["Submitted", card.date], ["Est. review", card.estHours > 0 ? `~${card.estHours}h` : "Done"]].map(([k,v]) => (
              <div key={k} className="bg-gray-50 border border-gray-100 rounded p-2.5">
                <p className="text-gray-400 mb-0.5">{k}</p>
                <p className="font-medium text-gray-900">{v}</p>
              </div>
            ))}
          </div>

          {/* Business justification */}
          <div>
            <p className="font-semibold text-gray-700 mb-1.5 uppercase tracking-wide text-xs">Business Justification</p>
            <div className="bg-gray-50 border border-gray-100 rounded p-3 text-gray-700 leading-relaxed">{card.reason}</div>
          </div>

          {/* Recommendation */}
          <div className="border border-gray-200 bg-gray-50 rounded p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb size={11} className="text-gray-500" />
                <p className="font-semibold text-gray-800 text-xs">Recommendation</p>
              </div>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ring-1 ${confColor}`}>
                {rec.confidence}% confidence
              </span>
            </div>
            <p className="font-semibold text-gray-900 mb-1">{rec.rec}</p>
            <p className="text-gray-600 leading-relaxed">{rec.reason}</p>
            {rec.violations > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-amber-700">
                <AlertTriangle size={10} />
                <span>{rec.violations} prior violation{rec.violations > 1 ? "s" : ""} on record — ref {rec.auditRef}</span>
              </div>
            )}
          </div>

          {/* Prompt comparison */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-700 uppercase tracking-wide text-xs">Prompt Preview</p>
              <div className="flex rounded overflow-hidden border border-gray-200">
                <button onClick={() => setShowRedacted(false)}
                  className={`px-2 py-1 text-xs transition-colors ${!showRedacted ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  Original
                </button>
                <button onClick={() => setShowRedacted(true)}
                  className={`px-2 py-1 text-xs transition-colors ${showRedacted ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                  Redacted
                </button>
              </div>
            </div>
            <div className={`rounded p-3 font-mono leading-relaxed text-xs ${showRedacted ? "bg-gray-900 text-gray-300" : "bg-red-950 text-red-200"}`}>
              {showRedacted ? rec.redactedPrompt : rec.originalPrompt}
            </div>
            {!showRedacted && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={10} />Viewing original unredacted prompt — handle with care
              </p>
            )}
          </div>

          {/* Approval timeline */}
          <div>
            <p className="font-semibold text-gray-700 mb-3 uppercase tracking-wide text-xs">Approval Timeline</p>
            <div className="space-y-0 relative">
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

          {/* Reviewer comments */}
          {card.comments > 0 && (
            <div>
              <p className="font-semibold text-gray-700 mb-2 uppercase tracking-wide text-xs">Reviewer Notes</p>
              <div className="bg-gray-50 border border-gray-100 rounded p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0 mt-0.5" style={{ fontSize: 8 }}>AK</div>
                  <div>
                    <p className="font-medium text-gray-900">Reviewed vendor DPA — data residency is compliant.</p>
                    <p className="text-gray-400 mt-0.5">2 hr ago</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit ref */}
          <div className="flex items-center gap-2 text-gray-400 border-t border-gray-100 pt-3">
            <FileText size={10} />
            <span>Audit reference: <span className="font-mono text-blue-600">{rec.auditRef}</span></span>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-2">
          {!rejecting ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { onApprove(); onClose(); }}
                  className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded py-2 text-xs font-semibold transition-colors">
                  <CheckCircle size={11} /> Approve
                </button>
                <button onClick={() => setRejecting(true)}
                  className="flex items-center justify-center gap-1.5 bg-red-50 border border-red-200 text-red-800 hover:bg-red-100 rounded py-2 text-xs font-semibold transition-colors">
                  <XCircle size={11} /> Reject
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded py-2 text-xs font-medium transition-colors">
                  <MessageSquare size={10} /> Request Changes
                </button>
                <button className="flex items-center justify-center gap-1.5 border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded py-2 text-xs font-medium transition-colors">
                  <AlertTriangle size={10} /> Escalate
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection…" rows={2}
                className="w-full text-xs border border-red-200 rounded px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-red-400 bg-red-50/40" />
              <div className="flex gap-2">
                <button onClick={() => { onReject(rejectReason); onClose(); }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded py-2 text-xs font-semibold transition-colors">
                  Confirm Reject
                </button>
                <button onClick={() => { setRejecting(false); setRejectReason(""); }}
                  className="px-4 border border-gray-200 text-gray-600 rounded py-2 text-xs hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApprovalCard({ card, onApprove, onReject, onSelect }: {
  card: KanbanCard;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onSelect?: () => void;
}) {
  const [rejecting,    setRejecting]    = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const rec = CARD_AI_RECS[card.id] ?? DEFAULT_REC;
  const confColor = rec.confidence >= 80 ? "text-green-700" : rec.confidence >= 60 ? "text-amber-700" : "text-red-700";

  return (
    <div className="bg-white border border-gray-100 rounded p-3.5 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-gray-400">{card.id}</span>
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ring-1 ${card.risk === "high" ? "text-red-700 bg-red-50 ring-red-200" : card.risk === "medium" ? "text-amber-700 bg-amber-50 ring-amber-200" : "text-green-700 bg-green-50 ring-green-200"}`}>
          {card.risk}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-900 mb-1">{card.tool}</p>
      <p className="text-xs text-gray-500 mb-2">{card.reason}</p>

      {/* AI recommendation inline */}
      {onApprove && (
        <div className="flex items-center gap-1.5 text-xs mb-3 py-1.5 px-2 bg-gray-50 rounded border border-gray-200">
          <Lightbulb size={9} className="text-gray-500 flex-shrink-0" />
          <span className="text-gray-800 font-medium">{rec.rec}</span>
          <span className={`ml-auto font-bold ${confColor}`}>{rec.confidence}%</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>{card.requester} · {card.dept}</span>
        <span>{card.date}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex -space-x-1">
          {card.reviewers.map(r => (
            <div key={r} className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border border-white" style={{ fontSize: 8 }}>{r}</div>
          ))}
        </div>
        {card.estHours > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />~{card.estHours}h</span>}
        {onSelect && (
          <button onClick={onSelect} className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-0.5">
            <Eye size={10} /> Details
          </button>
        )}
      </div>

      {onApprove && onReject && (
        <>
          {!rejecting ? (
            <div className="flex gap-1.5 mt-2">
              <button onClick={onApprove}
                className="flex-1 flex items-center justify-center gap-1 text-xs bg-green-50 border border-green-200 text-green-800 rounded py-1.5 hover:bg-green-100 active:bg-green-200 transition-colors font-semibold">
                <CheckCircle size={11} />Approve
              </button>
              <button onClick={() => setRejecting(true)}
                className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-50 border border-red-200 text-red-800 rounded py-1.5 hover:bg-red-100 active:bg-red-200 transition-colors font-semibold">
                <XCircle size={11} />Reject
              </button>
            </div>
          ) : (
            <div className="mt-2 space-y-1.5">
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)…"
                rows={2}
                className="w-full text-xs border border-red-200 rounded px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-red-400 bg-red-50/40"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => { onReject(rejectReason); setRejecting(false); setRejectReason(""); }}
                  className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded py-1.5 font-semibold transition-colors">
                  Confirm Reject
                </button>
                <button
                  onClick={() => { setRejecting(false); setRejectReason(""); }}
                  className="px-3 text-xs border border-gray-200 text-gray-600 rounded py-1.5 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ApprovalToast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl border text-xs font-medium"
      style={{
        animation: "fadeUp 0.2s ease",
        background: type === "success" ? "#14532d" : "#7f1d1d",
        borderColor: type === "success" ? "#166534" : "#991b1b",
        color: "#fff",
      }}>
      {type === "success" ? <CheckCircle size={13} /> : <XCircle size={13} />}
      {msg}
    </div>
  );
}

function ApprovalWorkflow({ onPendingChange }: { onPendingChange?: (n: number) => void }) {
  const [kanban, setKanban] = useState({
    pending:  [...KANBAN.pending],
    approved: [...KANBAN.approved],
    blocked:  [...KANBAN.blocked],
  });
  const [toast, setToast]         = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [selected, setSelected]   = useState<KanbanCard | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const approve = (id: string) => {
    const card        = kanban.pending.find(c => c.id === id);
    if (!card) return;
    const nextPending  = kanban.pending.filter(c => c.id !== id);
    const nextApproved = [card, ...kanban.approved];
    setKanban(prev => ({ ...prev, pending: nextPending, approved: nextApproved }));
    onPendingChange?.(nextPending.length);
    showToast("Request approved — employee has been notified.", "success");
  };

  const reject = (id: string, reason: string) => {
    const card        = kanban.pending.find(c => c.id === id);
    if (!card) return;
    const nextPending  = kanban.pending.filter(c => c.id !== id);
    const nextBlocked  = [card, ...kanban.blocked];
    setKanban(prev => ({ ...prev, pending: nextPending, blocked: nextBlocked }));
    onPendingChange?.(nextPending.length);
    showToast(reason ? `Rejected: "${reason.slice(0, 50)}"` : "Request rejected — employee has been notified.", "error");
  };

  const cols = [
    { key: "pending"  as const, label: "Pending Review", headerCls: "text-amber-700" },
    { key: "approved" as const, label: "Approved",       headerCls: "text-green-700" },
    { key: "blocked"  as const, label: "Blocked",        headerCls: "text-red-700"   },
  ];

  return (
    <>
      {toast && <ApprovalToast msg={toast.msg} type={toast.type} />}
      {selected && (
        <RequestDetailPanel
          card={selected}
          onClose={() => setSelected(null)}
          onApprove={() => { approve(selected.id); setSelected(null); }}
          onReject={(reason) => { reject(selected.id, reason); setSelected(null); }}
        />
      )}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Approval Workflow</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tool access requests from all employees · click any card for full details</p>
          </div>
          <button className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-1.5 text-xs font-medium transition-colors">
            <Plus size={12} /> New request
          </button>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Pending", val: kanban.pending.length,  color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
            { label: "Approved", val: kanban.approved.length, color: "text-green-700", bg: "bg-green-50 border-green-200" },
            { label: "Blocked",  val: kanban.blocked.length,  color: "text-red-700",   bg: "bg-red-50 border-red-200"    },
          ].map(s => (
            <div key={s.label} className={`border rounded p-3 text-center ${s.bg}`}>
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {cols.map(col => (
            <div key={col.key} className="bg-gray-50 border border-gray-200 rounded overflow-hidden">
              <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">{col.label}</span>
                  {col.key === "pending" && kanban[col.key].length > 0 && (
                    <span className="text-xs font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none">{kanban[col.key].length}</span>
                  )}
                </div>
                <span className="text-xs text-gray-400 font-mono">{kanban[col.key].length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-48">
                {kanban[col.key].length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-gray-300">No items</div>
                )}
                {kanban[col.key].map(card => (
                  <ApprovalCard
                    key={card.id}
                    card={card}
                    onApprove={col.key === "pending" ? () => approve(card.id) : undefined}
                    onReject={col.key === "pending" ? (reason) => reject(card.id, reason) : undefined}
                    onSelect={col.key === "pending" ? () => setSelected(card) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Risk Analytics ───────────────────────────────────────────────────────────

const SHADOW_AI_TOOLS = [
  { name: "ChatGPT (personal)",   users: 34, dept: "Marketing",   risk: "high",   detected: "Jul 14" },
  { name: "Google Bard",          users: 18, dept: "Sales",       risk: "medium", detected: "Jul 12" },
  { name: "Bing Copilot",         users: 12, dept: "HR",          risk: "medium", detected: "Jul 10" },
  { name: "Jasper AI",            users:  7, dept: "Marketing",   risk: "low",    detected: "Jul 8"  },
  { name: "Gamma (AI slides)",    users:  5, dept: "Engineering", risk: "low",    detected: "Jul 6"  },
];

const PREDICTIVE_DATA = [
  { week: "W9",  predicted: 22, actual: null },
  { week: "W10", predicted: 18, actual: null },
  { week: "W11", predicted: 25, actual: null },
];

function RiskAnalytics() {
  const [riskLevel, setRiskLevel] = useState("all");
  const [dept, setDept]           = useState("all");
  const [weeks, setWeeks]         = useState(8);
  const trendData = RISK_TREND.slice(-weeks);
  const deptRisk  = dept === "all" ? DEPT_RISK : DEPT_RISK.filter(d => d.dept.toLowerCase() === dept);

  const filteredTrend = riskLevel === "high"
    ? trendData.map(d => ({ ...d, medium: 0, low: 0 }))
    : riskLevel === "medium"
    ? trendData.map(d => ({ ...d, low: 0 }))
    : trendData;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Risk Analytics</h2>
        <p className="text-xs text-gray-400 mt-0.5">Incident trends, risk distribution, and department comparison</p>
      </div>

      {/* Risk Summary Card */}
      <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4 flex items-start gap-3">
        <Lightbulb size={15} className="text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-900">Risk Summary</p>
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Auto-generated · Jul 16</span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">
            High-severity incidents rose <strong>42% week-on-week</strong> driven primarily by HR and Legal departments.
            Two Finance employees appear in repeat-offender patterns. Shadow tool activity declined 23% since policy enforcement.
            Predictive model forecasts a moderate-risk week ahead — recommend proactive DLP training for HR and Legal.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs">
        <Filter size={12} className="text-gray-400" />
        {[
          { val: riskLevel, set: setRiskLevel, opts: [["all","All risk levels"],["high","High only"],["medium","Medium+"]] },
          { val: dept,      set: setDept,      opts: [["all","All departments"],["engineering","Engineering"],["legal","Legal"],["finance","Finance"],["hr","HR"]] },
          { val: String(weeks), set: (v: string) => setWeeks(Number(v)), opts: [["4","4 weeks"],["6","6 weeks"],["8","8 weeks"]] },
        ].map((f, i) => (
          <select key={i} value={f.val} onChange={e => f.set(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-gray-600 bg-white focus:outline-none">
            {f.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <button onClick={() => { setRiskLevel("all"); setDept("all"); setWeeks(8); }} className="text-gray-400 hover:text-gray-600 underline">Reset</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Incidents by Severity</p>
          <ResponsiveContainer width="100%" height={210}>
            <RBarChart data={filteredTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="high"   name="High"   stackId="a" fill="#b91c1c" />
              <Bar dataKey="medium" name="Medium" stackId="a" fill="#d97706" />
              <Bar dataKey="low"    name="Low"    stackId="a" fill="#15803d" radius={[2,2,0,0]} />
            </RBarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-gray-200 rounded p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Blocked Requests Trend</p>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={USAGE_DATA_14.slice(-Math.min(weeks, 14))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="blocked" name="Blocked Requests" stroke="#b91c1c" strokeWidth={2} dot={{ r: 3, fill: "#b91c1c", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded p-5">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm font-semibold text-gray-900">Risk Score by Department</p>
          </div>
          <div className="space-y-3">
            {deptRisk.map(d => (
              <div key={d.dept} className="flex items-center gap-4 hover:bg-gray-50 rounded px-2 py-1 transition-colors">
                <span className="w-24 text-xs font-medium text-gray-600">{d.dept}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${d.score >= 6 ? "bg-red-500" : d.score >= 4 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${d.score * 10}%` }} />
                </div>
                <span className={`w-8 text-xs font-bold tabular-nums text-right ${d.score >= 6 ? "text-red-700" : d.score >= 4 ? "text-amber-700" : "text-green-700"}`}>{d.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Predictive Analytics */}
        <div className="bg-white border border-gray-200 rounded p-5">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-gray-900">Predictive Outlook</p>
            <span className="text-xs text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">Forecast</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Estimated incident count for next 3 weeks</p>
          <div className="space-y-3">
            {PREDICTIVE_DATA.map((p, i) => (
              <div key={p.week} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-8">{p.week}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-slate-400 opacity-70" style={{ width: `${(p.predicted / 35) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-700 tabular-nums w-6 text-right">{p.predicted}</span>
                <span className="text-xs text-gray-400">est.</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Based on current trend and policy changes, high-risk incidents are expected to remain stable. Shadow tool activity projected to decrease a further 15%.
          </p>
        </div>
      </div>

      {/* Shadow Tool Monitoring */}
      <div className="bg-white border border-gray-200 rounded p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Shadow Tool Detection</p>
            <p className="text-xs text-gray-400 mt-0.5">Unregistered tools detected on the network this month</p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">12 tools · 76 users</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                {["Tool","Users","Dept","Risk","First Detected","Action"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHADOW_AI_TOOLS.map((t, i) => (
                <tr key={t.name} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                  <td className="px-3 py-2.5 font-medium text-gray-900">{t.name}</td>
                  <td className="px-3 py-2.5 font-bold text-gray-700 tabular-nums">{t.users}</td>
                  <td className="px-3 py-2.5 text-gray-500">{t.dept}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-medium ${t.risk === "high" ? "text-red-600" : t.risk === "medium" ? "text-amber-600" : "text-green-600"}`}>{t.risk}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 font-mono">{t.detected}</td>
                  <td className="px-3 py-2.5">
                    <button className={`text-xs px-2 py-1 rounded font-medium ${t.risk === "high" ? "bg-red-50 text-red-700 border border-red-200" : "bg-gray-50 text-gray-600 border border-gray-200"} hover:opacity-80 transition-opacity`}>
                      {t.risk === "high" ? "Block" : "Review"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

function AuditDrawer({ log, onClose }: { log: typeof AUDIT_LOGS[0]; onClose: () => void }) {
  const [tab, setTab] = useState<"overview"|"timeline">("overview");
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="fixed inset-0 bg-black/20" />
      <div className="relative w-full max-w-lg bg-white border-l border-gray-200 shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3.5 z-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900 font-mono">{log.id}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{log.ts}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-500"><X size={15} /></button>
          </div>
          <div className="flex gap-1">
            {(["overview","timeline"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 text-xs rounded capitalize transition-colors ${tab === t ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5 space-y-5 text-xs">
          {tab === "overview" ? (
            <>
              <div className={`flex items-center gap-3 p-3 rounded border ${log.status === "blocked" ? "bg-red-50 border-red-200" : log.status === "approved" ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${log.status === "blocked" ? "text-red-800" : log.status === "approved" ? "text-green-800" : "text-amber-800"}`}>{log.status.toUpperCase()}</p>
                  <p className="text-gray-500 mt-0.5">Risk score: <span className={`font-bold ${log.riskScore >= 7 ? "text-red-700" : log.riskScore >= 4 ? "text-amber-700" : "text-green-700"}`}>{log.riskScore}/10</span></p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[["User", log.user],["Department", log.dept],["Tool", log.tool],["Action", log.action]].map(([k,v]) => (
                  <div key={k} className="bg-gray-50 border border-gray-100 rounded p-2.5">
                    <p className="text-gray-400 mb-0.5">{k}</p>
                    <p className="font-medium text-gray-900">{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Full Prompt</p>
                <div className="bg-gray-900 rounded p-3 font-mono text-xs text-gray-300 leading-relaxed">{log.prompt}</div>
              </div>
              <div className="border border-gray-200 bg-gray-50 rounded p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Lightbulb size={10} className="text-gray-500" />
                  <p className="font-semibold text-gray-700">Classification</p>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {log.risk === "high"
                    ? "Contains PII patterns (SSN/employee ID). Auto-redaction triggered. Incident logged to SIEM."
                    : log.risk === "medium"
                    ? "Moderate sensitivity detected. Request processed with enhanced logging. No immediate action required."
                    : "No sensitive data patterns detected. Standard request — cleared for processing."}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded p-3">
                <p className="text-gray-400 mb-0.5">Audit Reference</p>
                <p className="font-mono text-blue-700 font-medium">AUD-{log.id.replace("REQ-", "")}</p>
              </div>
            </>
          ) : (
            <div>
              <p className="font-semibold text-gray-700 mb-3 uppercase tracking-wide">Event Timeline</p>
              <div className="space-y-0 relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                {[
                  ["Request received",              log.ts,                   "text-gray-600", true  ],
                  ["User authenticated (MFA ✓)",    "+0.1s",                  "text-gray-600", true  ],
                  ["Tool registry lookup complete",  "+0.3s",                  "text-gray-600", true  ],
                  ["DLP scan complete",              "+0.9s",                  log.risk === "high" ? "text-red-600" : "text-gray-600", true],
                  ["Policy evaluation complete",     "+1.4s",                  log.risk === "high" ? "text-red-600" : "text-gray-600", true],
                  [`Decision: ${log.status.toUpperCase()}`, "+2.1s",           log.status === "blocked" ? "text-red-700 font-semibold" : "text-green-700 font-semibold", true],
                  ["Audit record written",           "+2.3s",                  "text-gray-400", true  ],
                  ["SIEM export",                    log.risk === "high" ? "+2.5s" : "N/A", log.risk === "high" ? "text-gray-600" : "text-gray-300", log.risk === "high"],
                ].map(([label, time, cls, active], i) => (
                  <div key={i} className="flex items-start gap-3 pl-1 py-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border-2 mt-0.5 z-10 ${active ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`} />
                    <div className="flex-1 flex items-start justify-between gap-2">
                      <p className={String(cls)}>{String(label)}</p>
                      <p className="text-gray-400 font-mono flex-shrink-0">{String(time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditLogs() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [riskF,  setRiskF]  = useState("all");
  const [drawer, setDrawer] = useState<typeof AUDIT_LOGS[0] | null>(null);
  const filtered = AUDIT_LOGS.filter(l => {
    const q = search.toLowerCase();
    return (
      (!q || [l.user,l.tool,l.dept,l.id,l.prompt,l.action].some(v => v.toLowerCase().includes(q))) &&
      (filter === "all" || l.status === filter) &&
      (riskF  === "all" || l.risk   === riskF)
    );
  });
  return (
    <>
      {drawer && <AuditDrawer log={drawer} onClose={() => setDrawer(null)} />}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Audit Logs</h2>
            <p className="text-xs text-gray-400 mt-0.5">Immutable record of all gateway events · click any row for detail</p>
          </div>
          <select className="text-xs border border-gray-200 rounded px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none">
            <option>Export CSV</option><option>Export JSON</option><option>Export PDF</option>
          </select>
        </div>
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center gap-2 flex-wrap bg-gray-50">
            <div className="relative flex-1 min-w-48">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, tool, dept, request ID…"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {[
              { val: filter, set: setFilter, opts: [["all","All status"],["approved","Approved"],["blocked","Blocked"],["review","In review"]] },
              { val: riskF,  set: setRiskF,  opts: [["all","All risk"],["high","High"],["medium","Medium"],["low","Low"]] },
            ].map((f, i) => (
              <select key={i} value={f.val} onChange={e => f.set(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-600 bg-white focus:outline-none">
                {f.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {["Request","Timestamp","User","Dept","Tool","Action","Risk Score","Status"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap bg-gray-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, idx) => (
                  <tr key={log.id} onClick={() => setDrawer(log)}
                    className={`border-b border-gray-50 cursor-pointer hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                    <td className="px-4 py-2.5 font-mono text-blue-700 font-medium">{log.id}</td>
                    <td className="px-4 py-2.5 text-gray-400 font-mono whitespace-nowrap">{log.ts}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{log.user}</td>
                    <td className="px-4 py-2.5 text-gray-500">{log.dept}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-700">{log.tool}</td>
                    <td className="px-4 py-2.5 text-gray-500">{log.action}</td>
                    <td className="px-4 py-2.5 font-bold tabular-nums">
                      <span className={log.riskScore >= 7 ? "text-red-600" : log.riskScore >= 4 ? "text-amber-600" : "text-green-600"}>{log.riskScore}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={log.status} />
                        <span className="text-gray-600 capitalize">{log.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No results.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">{filtered.length} of {AUDIT_LOGS.length} entries</p>
            <div className="flex gap-1.5">
              <button className="text-xs border border-gray-200 rounded px-2.5 py-1 text-gray-600 hover:bg-white transition-colors">← Prev</button>
              <button className="text-xs border border-gray-200 rounded px-2.5 py-1 text-gray-600 hover:bg-white transition-colors">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Policies ─────────────────────────────────────────────────────────────────

const PRIORITY_CLS: Record<string,string> = {
  critical: "text-red-700 bg-red-50 ring-red-200",
  high:     "text-orange-700 bg-orange-50 ring-orange-200",
  medium:   "text-amber-700 bg-amber-50 ring-amber-200",
  low:      "text-gray-600 bg-gray-100 ring-gray-200",
};

function SimulationResult({ policy, onClose }: { policy: typeof POLICIES_DATA[0]; onClose: () => void }) {
  const requestsAffected = Math.floor(policy.hits * 1.15);
  const blocked = Math.floor(requestsAffected * 0.72);
  const warned  = Math.floor(requestsAffected * 0.18);
  const allowed = requestsAffected - blocked - warned;
  return (
    <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded" style={{ animation: "fadeUp 0.15s ease" }}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={12} className="text-slate-600" />
        <p className="text-sm font-semibold text-slate-900">Simulation Preview</p>
        <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600"><X size={12} /></button>
      </div>
      <p className="text-xs text-slate-600 mb-3">If this policy were applied to last 30 days of traffic:</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[["Would block", blocked, "text-red-700 bg-red-50 border-red-200"],
          ["Would warn",  warned,  "text-amber-700 bg-amber-50 border-amber-200"],
          ["Allowed",     allowed, "text-green-700 bg-green-50 border-green-200"]
        ].map(([l,v,c]) => (
          <div key={String(l)} className={`border rounded p-2.5 text-center ${String(c)}`}>
            <p className="text-lg font-bold tabular-nums">{v}</p>
            <p className="text-xs mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-600 leading-relaxed mb-3">
        Estimated {requestsAffected} requests would be affected. {Math.round((blocked/requestsAffected)*100)}% block rate — similar to current "{policy.name}" policy performance.
      </p>
      <div className="flex gap-2">
        <button className="flex-1 text-xs bg-blue-700 hover:bg-blue-600 text-white rounded py-1.5 font-semibold transition-colors">Publish policy</button>
        <button onClick={onClose} className="text-xs border border-slate-300 text-slate-700 rounded px-3 py-1.5 hover:bg-slate-100 transition-colors">Dismiss</button>
      </div>
    </div>
  );
}

function Policies() {
  const [policies, setPolicies]     = useState(POLICIES_DATA);
  const [simulating, setSimulating] = useState<number | null>(null);
  const toggle = (id: number) => setPolicies(ps => ps.map(p => p.id === id ? { ...p, status: p.status === "active" ? "inactive" : "active" } : p));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Governance Policies</h2>
          <p className="text-xs text-gray-400 mt-0.5">IF–THEN rules evaluated on every request · simulate before publishing</p>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-1.5 text-xs font-medium transition-colors">
          <Plus size={12} /> New policy
        </button>
      </div>
      <div className="space-y-2.5">
        {policies.map(p => (
          <div key={p.id} className={`bg-white border rounded transition-all ${p.status === "active" ? "border-gray-200" : "border-gray-100 opacity-50"}`}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ring-1 ${PRIORITY_CLS[p.priority]}`}>{p.priority}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.hits > 0 ? `${p.hits.toLocaleString()} triggers` : "No triggers"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSimulating(simulating === p.id ? null : p.id)}
                    className="flex items-center gap-1 text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 transition-colors font-medium">
                    <Zap size={9} /> Simulate
                  </button>
                  <span className="text-xs text-gray-400">{p.status}</span>
                  <Toggle value={p.status === "active"} onChange={() => toggle(p.id)} />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 text-xs">
                <div className="border border-blue-100 bg-blue-50/50 rounded p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="font-bold text-white bg-blue-600 px-1 py-0.5 rounded text-xs">IF</span>
                    <span className="text-blue-700 text-xs">any condition matches</span>
                  </div>
                  <ul className="space-y-1 text-gray-700">
                    {p.conditions.map(c => <li key={c} className="flex items-start gap-1.5"><span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />{c}</li>)}
                  </ul>
                </div>
                <div className="border border-amber-100 bg-amber-50/50 rounded p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="font-bold text-white bg-amber-500 px-1 py-0.5 rounded text-xs">THEN</span>
                    <span className="text-amber-700 text-xs">execute actions</span>
                  </div>
                  <ul className="space-y-1 text-gray-700">
                    {p.actions.map(a => <li key={a} className="flex items-start gap-1.5"><ArrowRight size={9} className="mt-1 text-amber-500 flex-shrink-0" />{a}</li>)}
                  </ul>
                </div>
              </div>
              {simulating === p.id && <SimulationResult policy={p} onClose={() => setSimulating(null)} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── User Management ──────────────────────────────────────────────────────────

const TRAINING_STATUS: Record<number, { label: string; cls: string; completed: number; total: number }> = {
  1: { label: "Overdue",   cls: "text-red-700 bg-red-50 ring-red-200",     completed: 1, total: 3 },
  2: { label: "Completed", cls: "text-green-700 bg-green-50 ring-green-200", completed: 3, total: 3 },
  3: { label: "In Progress", cls: "text-amber-700 bg-amber-50 ring-amber-200", completed: 2, total: 3 },
  4: { label: "Completed", cls: "text-green-700 bg-green-50 ring-green-200", completed: 3, total: 3 },
  5: { label: "Overdue",   cls: "text-red-700 bg-red-50 ring-red-200",     completed: 0, total: 3 },
  6: { label: "Completed", cls: "text-green-700 bg-green-50 ring-green-200", completed: 3, total: 3 },
};

const USER_VIOLATIONS: Record<number, number> = { 1: 4, 2: 0, 3: 1, 4: 0, 5: 6, 6: 0 };

function UserManagement() {
  const [search, setSearch] = useState("");
  const shown = USERS.filter(u => !search || [u.name,u.email,u.dept].some(v => v.toLowerCase().includes(search.toLowerCase())));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">User Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">Access permissions, compliance scores, and training status</p>
        </div>
        <button className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-1.5 text-xs font-medium transition-colors">
          <Plus size={12} /> Add user
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[["248","Total Users","text-gray-900"],["84%","Avg Compliance","text-green-700"],["12","High Risk","text-red-700"],["7","Pending Review","text-amber-700"]].map(([v,l,c]) => (
          <div key={l} className="bg-white border border-gray-200 rounded p-4">
            <p className={`text-2xl font-bold tabular-nums ${c}`}>{v}</p>
            <p className="text-xs text-gray-400 mt-1">{l}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="relative max-w-xs">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                {["User","Dept","Role","Tools","Compliance","Violations","Training","Risk",""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((u, idx) => {
                const training = TRAINING_STATUS[u.id];
                const violations = USER_VIOLATIONS[u.id] ?? 0;
                return (
                  <tr key={u.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 10 }}>
                          {u.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 whitespace-nowrap">{u.name}</p>
                          <p className="text-gray-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.dept}</td>
                    <td className="px-4 py-3 text-gray-500">{u.role}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.tools.map(t => <span key={t} className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded ring-1 ring-blue-100">{t}</span>)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-gray-100 rounded-full h-1 overflow-hidden">
                          <div className={`h-1 rounded-full ${u.compliance >= 85 ? "bg-green-500" : u.compliance >= 65 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${u.compliance}%` }} />
                        </div>
                        <span className="font-semibold text-gray-800 tabular-nums">{u.compliance}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold tabular-nums ${violations >= 4 ? "text-red-600" : violations >= 1 ? "text-amber-600" : "text-gray-400"}`}>
                        {violations > 0 ? violations : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {training && (
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ring-1 ${training.cls}`}>
                          {training.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${u.risk === "high" ? "text-red-600" : u.risk === "medium" ? "text-amber-600" : "text-green-600"}`}>{u.risk}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-gray-300 hover:text-gray-600 transition-colors"><MoreHorizontal size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsPage() {
  const [vals, setVals] = useState({ notifs: true, autoBlock: true, shadowAI: true, dlp: true, export: false });
  const toggle = (k: keyof typeof vals) => setVals(v => ({ ...v, [k]: !v[k] }));
  const items: { key: keyof typeof vals; label: string; desc: string }[] = [
    { key: "notifs",    label: "Security Notifications", desc: "Real-time alerts for high-risk incidents via email and Slack" },
    { key: "autoBlock", label: "Auto-Block High Risk",   desc: "Automatically block requests with composite risk score above 8.0" },
    { key: "shadowAI",  label: "Shadow Tool Detection",   desc: "Monitor and block unregistered tool usage on the network" },
    { key: "dlp",       label: "Deep DLP Scanning",      desc: "Full data-loss prevention scan on all prompt content" },
    { key: "export",    label: "Scheduled Audit Export", desc: "Auto-export compliance reports weekly to designated email address" },
  ];
  return (
    <div className="max-w-lg space-y-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Settings</h2>
        <p className="text-xs text-gray-400 mt-0.5">Platform configuration and preferences</p>
      </div>
      <div className="bg-white border border-gray-200 rounded divide-y divide-gray-100">
        {items.map(s => (
          <div key={s.key} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors">
            <div>
              <p className="text-sm font-medium text-gray-800">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
            </div>
            <div className="flex items-center gap-2.5 ml-6 flex-shrink-0">
              <span className="text-xs text-gray-400">{vals[s.key] ? "on" : "off"}</span>
              <Toggle value={vals[s.key]} onChange={() => toggle(s.key)} />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded p-4">
        <div className="flex gap-3">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">SIEM not connected</p>
            <p className="text-xs text-amber-700 mt-1">Connect Splunk or Microsoft Sentinel to enable real-time log forwarding and alerting.</p>
            <button className="text-xs text-amber-700 font-semibold mt-1.5 hover:underline">Configure integration →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Center ──────────────────────────────────────────────────────

function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(INITIAL_INCIDENTS);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = (id: string | number) => setAlerts(prev => prev.filter(a => a.id !== id));
  const markAllRead = () => setAlerts([]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} className="relative p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors">
        <Bell size={15} />
        {alerts.length > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded border border-gray-200 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Alerts</p>
            {alerts.length > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
            )}
          </div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="px-3 py-6 text-xs text-gray-400 text-center">No new alerts</p>
            ) : alerts.map(a => (
              <div key={a.id} className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.severity === "critical" ? "bg-red-500" : a.severity === "high" ? "bg-orange-400" : "bg-amber-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 leading-tight">{a.event}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.tool} · {a.ts}</p>
                </div>
                <button
                  onClick={() => markRead(a.id)}
                  title="Mark as Read"
                  className="flex-shrink-0 mt-0.5 px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-medium transition-colors"
                >
                  Mark as Read
                </button>
              </div>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-gray-100 text-center">
            <button className="text-xs text-blue-600 hover:underline">View all incidents</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Shell ──────────────────────────────────────────────────────────────

function AdminSidebar({ active, onNav, user, onLogout, collapsed, onToggle, pendingCount }: {
  active: AdminSection; onNav: (s: AdminSection) => void;
  user: AuthUser; onLogout: () => void;
  collapsed: boolean; onToggle: () => void;
  pendingCount: number;
}) {
  return (
    <aside className={`flex flex-col h-full bg-[#0f1923] flex-shrink-0 transition-all duration-250 ${collapsed ? "w-[52px]" : "w-[208px]"}`}>
      <div className={`flex items-center h-12 border-b border-white/[0.06] ${collapsed ? "justify-center py-3" : "gap-2.5 px-4 py-3"}`}>
        <Shield size={14} className="text-blue-400 flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-white text-sm font-semibold tracking-tight">SentinelAI</span>
            <span className="ml-1.5 text-xs text-blue-400/80">Admin</span>
          </div>
        )}
      </div>
      <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const isActive = active === item.id;
          const badge    = item.id === "workflow" && pendingCount > 0 ? String(pendingCount) : undefined;
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
            <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 9 }}>{user.initials}</div>
            <div className="min-w-0">
              <p className="text-gray-200 text-xs font-medium truncate">{user.name}</p>
              <p className="text-gray-500 text-xs">Security Admin</p>
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

function AdminHeader({ section, user }: { section: AdminSection; user: AuthUser }) {
  return (
    <header className="h-12 bg-white border-b border-gray-200 px-5 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span className="hover:text-blue-600 cursor-pointer transition-colors">SentinelAI</span>
        <ChevronRight size={11} />
        <span className="text-gray-700 font-semibold">{TITLES[section]}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search…" className="pl-8 pr-3 py-1 text-xs border border-gray-200 rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40" />
        </div>
        <NotificationCenter />
        <Tip text="Admin account">
          <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-600 transition-colors" style={{ fontSize: 9 }}>{user.initials}</div>
        </Tip>
      </div>
    </header>
  );
}

// ─── AdminApp Root ────────────────────────────────────────────────────────────

export function AdminApp({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [section,      setSection]      = useState<AdminSection>("dashboard");
  const [collapsed,    setCollapsed]    = useState(false);
  const [pendingCount, setPendingCount] = useState(KANBAN.pending.length);

  const views: Record<AdminSection, React.ReactNode> = {
    dashboard:      <Dashboard onNav={setSection} />,
    "exec-roi":     <AIROIDashboard />,
    "exec-cost":    <CostLicenseDashboard />,
    "exec-advisor": <ExecutiveAIAdvisor />,
    workflow:       <ApprovalWorkflow onPendingChange={setPendingCount} />,
    analytics:      <RiskAnalytics />,
    audit:          <AuditLogs />,
    policies:       <Policies />,
    users:          <UserManagement />,
    settings:       <SettingsPage />,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#f2f3f5" }}>
      <AdminSidebar active={section} onNav={setSection} user={user} onLogout={onLogout} collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} pendingCount={pendingCount} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminHeader section={section} user={user} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          <div key={section} style={{ animation: "fadeUp 0.18s ease both" }}>
            {views[section]}
          </div>
        </main>
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideIn { from { opacity:0; transform:translateX(24px) } to { opacity:1; transform:translateX(0) } }
      `}</style>
    </div>
  );
}
