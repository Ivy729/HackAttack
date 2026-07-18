import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw,
  Upload, ChevronDown, ChevronRight, Info, Lightbulb,
  CheckSquare, FileSearch, ScanLine, Key, ShieldCheck,
  Activity, FileWarning, ArrowRight, Edit, Clock, Lock,
} from "lucide-react";
import { AI_TOOLS } from "./shared";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "idle" | "analyzing" | "analyzed" | "safe";
type SensitiveType = "email" | "phone" | "nric" | "employee_id" | "api_key" | "password" | "financial" | "medical" | "project";
type Classification = "Public" | "Internal" | "Confidential" | "Restricted";
type Severity = "low" | "medium" | "high" | "critical";

interface SensitiveMatch {
  type: SensitiveType;
  label: string;
  value: string;
  start: number;
  end: number;
  classification: Classification;
  severity: Severity;
  policy: string;
  reason: string;
  redactWith: string;
  color: { bg: string; border: string; text: string };
}

interface PolicyViolation {
  policy: string;
  severity: Severity;
  reason: string;
  impact: string;
}

interface AnalysisResult {
  riskScore: number;
  safeScore: number;
  decision: "approved" | "warning" | "blocked";
  matches: SensitiveMatch[];
  violations: PolicyViolation[];
  redactedPrompt: string;
  reasoning: string;
}

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const STAGES = [
  { id: "auth",     label: "User Authentication",      icon: Key,         msgs: ["Verifying SSO session…","Checking MFA status…","Session confirmed"],                              ms: 800  },
  { id: "tool",     label: "AI Tool Verification",     icon: ShieldCheck, msgs: ["Looking up tool registry…","Verifying enterprise agreement…","Tool approved"],                    ms: 700  },
  { id: "classify", label: "Prompt Classification",    icon: FileSearch,  msgs: ["Classifying prompt intent…","Identifying data categories…","Data analysis — flagged"],            ms: 900  },
  { id: "scan",     label: "Sensitive Data Detection", icon: ScanLine,    msgs: ["Scanning 47 DLP patterns…","Detecting PII entities…","Analyzing financial markers…"],             ms: 1400 },
  { id: "policy",   label: "Policy Validation",        icon: FileWarning, msgs: ["Evaluating 12 active policies…","Checking PDPA compliance…","Violations identified"],             ms: 1000 },
  { id: "risk",     label: "Risk Scoring",             icon: Activity,    msgs: ["Computing risk vectors…","Weighing severity factors…","Score calculated"],                        ms: 800  },
  { id: "recom",    label: "Recommendation",           icon: Lightbulb,   msgs: ["Generating safe alternatives…","Preparing redacted version…","Recommendations ready"],            ms: 1200 },
  { id: "decision", label: "Final Decision",           icon: CheckSquare, msgs: ["Applying governance rules…","Writing audit trail…","Decision rendered"],                          ms: 500  },
];

type StageStatus = "pending" | "running" | "success" | "warning" | "blocked";

// ─── Detection patterns ───────────────────────────────────────────────────────

const PATTERNS: {
  type: SensitiveType; label: string; regex: RegExp;
  classification: Classification; severity: Severity;
  policy: string; reason: string; redactWith: string;
  color: { bg: string; border: string; text: string };
}[] = [
  {
    type: "nric", label: "NRIC / National ID",
    regex: /[STFG]\d{7}[A-Z]/g,
    classification: "Restricted", severity: "critical",
    policy: "PII Protection Policy · PDPA Restricted Data",
    reason: "National ID numbers are Restricted under PDPA. Any unauthorised disclosure is a notifiable breach with fines up to SGD $1M.",
    redactWith: "[NRIC]",
    color: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
  },
  {
    type: "api_key", label: "API Key / Secret",
    regex: /sk-[a-zA-Z0-9\-_]{8,}/g,
    classification: "Restricted", severity: "critical",
    policy: "Secrets Management Policy",
    reason: "API keys grant programmatic access to systems. Exposing them to external AI creates an immediate security incident.",
    redactWith: "[API KEY]",
    color: { bg: "#fef2f2", border: "#dc2626", text: "#7f1d1d" },
  },
  {
    type: "password", label: "Password / Credential",
    regex: /(?:password|passwd|pwd|pass)[:=\s]+\S{4,}/gi,
    classification: "Restricted", severity: "critical",
    policy: "Secrets Management Policy",
    reason: "Plaintext passwords represent a critical security vulnerability. Credentials must never appear in AI prompts.",
    redactWith: "[PASSWORD]",
    color: { bg: "#fef2f2", border: "#dc2626", text: "#7f1d1d" },
  },
  {
    type: "medical", label: "Medical Information",
    regex: /(?:diagnosed with|patient (?:has|with)|on \w+(?:\s+\d+mg)?|prescribed|Type \d diabetes|metformin|insulin)\s*[\w\s,]*/gi,
    classification: "Restricted", severity: "critical",
    policy: "Healthcare Data Protection Policy",
    reason: "Medical information is Restricted under PDPA special category data rules. Processing requires explicit consent and a lawful basis.",
    redactWith: "[MEDICAL RECORD]",
    color: { bg: "#fdf4ff", border: "#c026d3", text: "#701a75" },
  },
  {
    type: "email", label: "Email Address",
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    classification: "Confidential", severity: "high",
    policy: "PII Protection Policy",
    reason: "Email addresses are personal identifiable information (PII) protected under PDPA and GDPR. Sharing with external AI systems requires explicit consent.",
    redactWith: "[EMAIL]",
    color: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  },
  {
    type: "phone", label: "Phone Number",
    regex: /(?:\+65[\s\-]?)?\d{4}[\s\-]?\d{4}/g,
    classification: "Confidential", severity: "high",
    policy: "PII Protection Policy",
    reason: "Phone numbers are personal contact information classified as Confidential under your company's data governance policy.",
    redactWith: "[PHONE]",
    color: { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6" },
  },
  {
    type: "financial", label: "Financial Data",
    regex: /\$[\d,]+(?:\.\d+)?(?:\s*[MBK])?/g,
    classification: "Confidential", severity: "high",
    policy: "Financial Data Shield",
    reason: "Revenue and financial figures are Confidential and subject to insider trading regulations. Unpublished financial data must not leave secure systems.",
    redactWith: "[FINANCIAL DATA]",
    color: { bg: "#fff7ed", border: "#f97316", text: "#7c2d12" },
  },
  {
    type: "employee_id", label: "Employee ID",
    regex: /EMP[-\s]?\d{3,6}/gi,
    classification: "Internal", severity: "medium",
    policy: "HR Data Classification Policy",
    reason: "Employee identifiers link to personal records in HR systems and must remain within approved internal platforms.",
    redactWith: "[EMPLOYEE ID]",
    color: { bg: "#e0f2fe", border: "#0ea5e9", text: "#0c4a6e" },
  },
  {
    type: "project", label: "Confidential Project",
    regex: /Project\s+[A-Z][a-z]+/g,
    classification: "Confidential", severity: "medium",
    policy: "Information Classification Policy",
    reason: "Internal project codenames may reveal strategic business plans. Classified as Confidential — requires approval to share externally.",
    redactWith: "[PROJECT NAME]",
    color: { bg: "#f0f9ff", border: "#0284c7", text: "#075985" },
  },
];

const SAMPLE_PROMPT = `Please analyze our Q3 customer data for the board report.

Customer: Sarah Johnson (sarah.j@clientcorp.com)
Phone: +65 9123 4567
NRIC: S8765432B
Employee handling: EMP-2847

Database password: Acme@DB#2024
API Key: sk-ant-api03-xK9mN2pQ7rF5

Project Phoenix Q3 revenue: $4.2M (CONFIDENTIAL)
Medical note: Patient diagnosed with Type 2 diabetes, on metformin 500mg`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectSensitiveData(text: string): SensitiveMatch[] {
  const matches: SensitiveMatch[] = [];
  for (const p of PATTERNS) {
    p.regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = p.regex.exec(text)) !== null) {
      const start = m.index;
      const end = m.index + m[0].length;
      if (!matches.some(e => start < e.end && end > e.start)) {
        matches.push({ type: p.type, label: p.label, value: m[0].trim(), start, end, classification: p.classification, severity: p.severity, policy: p.policy, reason: p.reason, redactWith: p.redactWith, color: p.color });
      }
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

function buildRedacted(text: string, matches: SensitiveMatch[]): string {
  let result = text;
  [...matches].sort((a, b) => b.start - a.start).forEach(m => {
    result = result.slice(0, m.start) + m.redactWith + result.slice(m.end);
  });
  return result;
}

function calcRisk(matches: SensitiveMatch[]): number {
  if (matches.length === 0) return Math.floor(Math.random() * 18) + 4;
  const base = matches.reduce((acc, m) => acc + ({ critical: 22, high: 13, medium: 7, low: 3 }[m.severity]), 0);
  return Math.min(98, base + 12);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskGauge({ score, animateFrom }: { score: number; animateFrom?: number }) {
  const [displayed, setDisplayed] = useState(animateFrom ?? score);
  useEffect(() => {
    if (animateFrom === undefined) { setDisplayed(score); return; }
    const diff = score - animateFrom; const dur = 1600; const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(animateFrom + diff * e));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  const r = 52; const circ = 2 * Math.PI * r;
  const offset = circ - (displayed / 100) * circ;
  const clr = displayed >= 75 ? "#dc2626" : displayed >= 50 ? "#f97316" : displayed >= 25 ? "#f59e0b" : "#16a34a";
  const lbl = displayed >= 75 ? "Critical" : displayed >= 50 ? "High" : displayed >= 25 ? "Medium" : "Low";
  return (
    <svg width="130" height="130" viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="#f3f4f6" strokeWidth="9" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={clr} strokeWidth="9"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 65 65)" style={{ transition: "stroke-dashoffset 0.08s linear, stroke 0.3s ease" }} />
      <text x="65" y="59" textAnchor="middle" fontSize="27" fontWeight="700" fill={clr} fontFamily="Inter,sans-serif">{displayed}</text>
      <text x="65" y="75" textAnchor="middle" fontSize="11" fontWeight="600" fill={clr} fontFamily="Inter,sans-serif">{lbl}</text>
      <text x="65" y="89" textAnchor="middle" fontSize="10" fill="#9ca3af" fontFamily="Inter,sans-serif">Risk Score</text>
    </svg>
  );
}

function SeverityBadge({ s }: { s: Severity }) {
  const cls = { critical: "bg-red-100 text-red-700 ring-red-200", high: "bg-orange-100 text-orange-700 ring-orange-200", medium: "bg-amber-100 text-amber-700 ring-amber-200", low: "bg-green-100 text-green-700 ring-green-200" }[s];
  return <span className={`text-xs font-bold px-1.5 py-0.5 rounded ring-1 uppercase ${cls}`}>{s}</span>;
}

function ClassBadge({ c }: { c: Classification }) {
  const cls = { "Restricted": "bg-red-600 text-white", "Confidential": "bg-orange-500 text-white", "Internal": "bg-blue-500 text-white", "Public": "bg-green-600 text-white" }[c];
  return <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${cls}`}>{c}</span>;
}

function StageRow({ stage, status, message }: { stage: typeof STAGES[0]; status: StageStatus; message: string }) {
  const dot = { pending: "border-2 border-gray-200", running: "border-2 border-blue-500 border-t-transparent animate-spin", success: "", warning: "", blocked: "" }[status];
  const row = {
    pending: "border-gray-100 bg-gray-50/40",
    running: "border-blue-200 bg-blue-50",
    success: "border-green-100 bg-green-50/50",
    warning: "border-amber-100 bg-amber-50/50",
    blocked: "border-red-100 bg-red-50/50",
  }[status];
  const textCls = { pending: "text-gray-400", running: "text-blue-700", success: "text-gray-700", warning: "text-amber-700", blocked: "text-red-700" }[status];
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded border transition-all duration-300 ${row}`}>
      <div className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
        {status === "pending"  && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200" />}
        {status === "running"  && <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />}
        {status === "success"  && <CheckCircle size={14} className="text-green-500" />}
        {status === "warning"  && <AlertTriangle size={14} className="text-amber-500" />}
        {status === "blocked"  && <XCircle size={14} className="text-red-500" />}
      </div>
      <span className={`text-xs font-medium flex-1 ${textCls}`}>{stage.label}</span>
      {status === "running" && message && <span className="text-xs text-blue-500 font-mono truncate max-w-36">{message}</span>}
      {status === "success"  && <span className="text-xs text-green-600 font-mono truncate max-w-36">{stage.msgs[stage.msgs.length - 1]}</span>}
      {status === "warning"  && <span className="text-xs text-amber-600 font-semibold">Flagged</span>}
      {status === "blocked"  && <span className="text-xs text-red-600 font-semibold">Blocked</span>}
    </div>
  );
}

function HighlightTooltip({ match, rect }: { match: SensitiveMatch; rect: DOMRect }) {
  return (
    <div className="fixed z-50 pointer-events-none"
      style={{ top: rect.top - 12, left: rect.left + rect.width / 2, transform: "translate(-50%,-100%)" }}>
      <div className="bg-gray-900 text-white rounded-lg p-3 shadow-2xl text-xs max-w-xs leading-relaxed">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-bold text-white text-xs" style={{ background: match.color.border, padding: "2px 6px", borderRadius: 3 }}>{match.label}</span>
          <ClassBadge c={match.classification} />
          <SeverityBadge s={match.severity} />
        </div>
        <p className="text-gray-300 leading-relaxed mb-2">{match.reason}</p>
        <div className="space-y-1 text-gray-400">
          <p><span className="text-gray-300 font-semibold">Policy:</span> {match.policy}</p>
          <p><span className="text-gray-300 font-semibold">Replace with:</span> <code className="bg-gray-700 text-gray-200 px-1 rounded">{match.redactWith}</code></p>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

function renderHighlighted(
  text: string,
  matches: SensitiveMatch[],
  onHover: (m: SensitiveMatch | null, r?: DOMRect) => void,
) {
  if (!matches.length) return <>{text}</>;
  const nodes: React.ReactNode[] = [];
  let cur = 0;
  matches.forEach((m, i) => {
    if (cur < m.start) nodes.push(<span key={`t${i}`}>{text.slice(cur, m.start)}</span>);
    nodes.push(
      <mark key={`m${i}`}
        style={{ background: m.color.bg, borderBottom: `2px solid ${m.color.border}`, color: m.color.text, borderRadius: 2, padding: "1px 0", cursor: "help" }}
        onMouseEnter={e => onHover(m, (e.currentTarget as HTMLElement).getBoundingClientRect())}
        onMouseLeave={() => onHover(null)}>
        {text.slice(m.start, m.end)}
      </mark>
    );
    cur = m.end;
  });
  if (cur < text.length) nodes.push(<span key="tend">{text.slice(cur)}</span>);
  return <>{nodes}</>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-gray-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-2xl border border-white/10"
      style={{ animation: "fadeUp 0.25s ease" }}>
      <CheckCircle size={13} className="text-green-400" />
      {message}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PromptGuardian() {
  const [tool,      setTool]      = useState("chatgpt");
  const [prompt,    setPrompt]    = useState("");
  const [phase,     setPhase]     = useState<Phase>("idle");
  const [statuses,  setStatuses]  = useState<StageStatus[]>(Array(8).fill("pending"));
  const [msgs,      setMsgs]      = useState<string[]>(Array(8).fill(""));
  const [result,    setResult]    = useState<AnalysisResult | null>(null);
  const [hovered,   setHovered]   = useState<{ match: SensitiveMatch; rect: DOMRect } | null>(null);
  const [expanded,  setExpanded]  = useState<number | null>(null);
  const [dragOver,  setDragOver]  = useState(false);
  const [toast,     setToast]     = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3200); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const analyze = useCallback(() => {
    if (!prompt.trim() || phase === "analyzing") return;
    clearTimers();
    setPhase("analyzing");
    setResult(null);
    const st: StageStatus[] = Array(8).fill("pending");
    const ms: string[] = Array(8).fill("");
    setStatuses([...st]); setMsgs([...ms]);

    let elapsed = 0;
    STAGES.forEach((stage, si) => {
      const t0 = elapsed;
      timers.current.push(setTimeout(() => {
        st[si] = "running"; setStatuses([...st]);
        stage.msgs.forEach((msg, mi) => {
          timers.current.push(setTimeout(() => { ms[si] = msg; setMsgs([...ms]); }, mi * Math.floor(stage.ms / stage.msgs.length)));
        });
      }, t0));
      elapsed += stage.ms;
      const finalStatus: StageStatus = (si === 2 || si === 3 || si === 4) ? "warning" : si === 7 ? "blocked" : "success";
      timers.current.push(setTimeout(() => { st[si] = finalStatus; setStatuses([...st]); }, elapsed - 60));
    });

    timers.current.push(setTimeout(() => {
      const matches = detectSensitiveData(prompt);
      const redactedPrompt = buildRedacted(prompt, matches);
      const riskScore = calcRisk(matches);
      const safeScore = Math.max(6, Math.round(riskScore * 0.2));
      const seen = new Set<string>();
      const violations: PolicyViolation[] = [];
      matches.forEach(m => {
        if (!seen.has(m.policy)) {
          seen.add(m.policy);
          violations.push({ policy: m.policy, severity: m.severity, reason: `${m.label} detected in prompt — ${m.reason.slice(0, 90)}…`, impact: m.severity === "critical" ? "Immediate security incident risk · notifiable breach" : m.severity === "high" ? "PDPA/GDPR compliance violation" : "Internal data governance breach" });
        }
      });
      const reasoning = matches.length === 0
        ? "No sensitive data detected. Prompt appears compliant with current governance policies."
        : `${matches.length} sensitive item${matches.length > 1 ? "s" : ""} across ${seen.size} policy violation${seen.size > 1 ? "s" : ""} detected. ${matches.filter(m => m.severity === "critical").length > 0 ? `Critical: ${matches.filter(m => m.severity === "critical").map(m => m.label).join(", ")}.` : ""} Safe redacted version auto-generated.`;
      setResult({ riskScore, safeScore, decision: riskScore >= 55 ? "blocked" : riskScore >= 28 ? "warning" : "approved", matches, violations, redactedPrompt, reasoning });
      setPhase("analyzed");
    }, elapsed + 200));
  }, [prompt, phase]);

  const applySafe = () => {
    if (!result) return;
    setPrompt(result.redactedPrompt);
    setPhase("safe");
    showToast("Safe version applied. All sensitive data has been redacted.");
  };

  const reset = () => {
    clearTimers();
    setPhase("idle"); setResult(null);
    setStatuses(Array(8).fill("pending")); setMsgs(Array(8).fill(""));
    setExpanded(null);
  };

  const approvedTools = AI_TOOLS.filter(t => t.status === "approved");
  const doneCount = statuses.filter(s => s !== "pending" && s !== "running").length;
  const hasRestricted = result?.matches.some(m => m.classification === "Restricted") ?? false;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {toast && <Toast message={toast} />}

      {/* Page header */}
      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-6 h-6 rounded bg-blue-700 flex items-center justify-center flex-shrink-0">
            <Shield size={12} className="text-white" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">AI Prompt Guardian</h2>
          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded font-semibold">BETA</span>
        </div>
        <p className="text-xs text-gray-400 ml-[34px]">
          Intelligent governance analysis — detects sensitive data, checks policies, and guides you toward compliant AI usage.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div className="flex flex-col gap-3">

          {/* Tool selector */}
          <div className="bg-white border border-gray-200 rounded p-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Tool</label>
            <div className="relative">
              <select value={tool} onChange={e => setTool(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8">
                {approvedTools.map(t => <option key={t.id} value={t.id}>{t.name} — {t.vendor}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex items-center gap-4 mt-2.5 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Gateway active</span>
              <span>SOC 2 Type II</span>
              <span>DLP enabled</span>
              <span>Audit logging on</span>
            </div>
          </div>

          {/* Prompt editor */}
          <div className="bg-white border border-gray-200 rounded overflow-hidden flex-1">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prompt Editor</span>
              <div className="flex items-center gap-3">
                {prompt && <span className="text-xs text-gray-400">{prompt.length} chars</span>}
                <button onClick={() => { setPrompt(SAMPLE_PROMPT); reset(); }} className="text-xs text-blue-600 hover:underline">Load sample →</button>
              </div>
            </div>

            <div className="relative" style={{ minHeight: 280 }}>
              {(phase === "analyzed" || phase === "safe") && result ? (
                <div className="px-4 py-3 leading-relaxed"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", minHeight: 280, fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, color: "#1f2937" }}>
                  {renderHighlighted(
                    phase === "safe" ? result.redactedPrompt : prompt,
                    phase === "safe" ? [] : result.matches,
                    (m, r) => m ? setHovered({ match: m, rect: r! }) : setHovered(null),
                  )}
                </div>
              ) : (
                <textarea
                  value={prompt}
                  onChange={e => { setPrompt(e.target.value); if (phase !== "idle") reset(); }}
                  disabled={phase === "analyzing"}
                  placeholder={"Describe what you need help with…\n\nTip: The Guardian will automatically detect sensitive data and guide you toward a compliant version."}
                  className="w-full px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed leading-relaxed"
                  style={{ minHeight: 280, fontFamily: "JetBrains Mono, monospace", fontSize: 12.5 }}
                />
              )}

              {phase === "analyzing" && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-full px-4 py-2 shadow-sm">
                    <RefreshCw size={12} className="text-blue-500 animate-spin" />
                    <span className="text-xs text-blue-700 font-medium">Scanning prompt…</span>
                  </div>
                </div>
              )}
            </div>

            {phase === "analyzed" && result && result.matches.length > 0 && (
              <div className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
                <AlertTriangle size={12} className="text-amber-600 flex-shrink-0" />
                <span className="text-xs text-amber-700"><span className="font-semibold">{result.matches.length} sensitive items</span> highlighted — hover each one to see details</span>
              </div>
            )}
            {phase === "safe" && (
              <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2">
                <CheckCircle size={12} className="text-green-600 flex-shrink-0" />
                <span className="text-xs text-green-700 font-semibold">Safe version applied — all sensitive data redacted</span>
              </div>
            )}
          </div>

          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); showToast("Document uploaded — will be scanned before submission."); }}
            className={`border-2 border-dashed rounded p-3.5 flex items-center gap-3 transition-colors cursor-pointer ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-gray-50/60"}`}>
            <Upload size={15} className={dragOver ? "text-blue-500" : "text-gray-400"} />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-600">Drag & drop documents to scan</p>
              <p className="text-xs text-gray-400">PDF, DOCX, XLSX · all content scanned by DLP before submission</p>
            </div>
            <button className="text-xs text-blue-600 hover:underline whitespace-nowrap">Browse</button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {phase === "safe" ? (
              <>
                <button onClick={() => { showToast("Request submitted securely via governance gateway."); setTimeout(reset, 1500); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 text-white rounded py-2.5 text-sm font-semibold transition-colors">
                  <CheckCircle size={13} />Submit Request
                </button>
                <button onClick={reset} className="px-4 border border-gray-200 text-gray-600 rounded text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              </>
            ) : phase === "analyzing" ? (
              <button disabled className="flex-1 flex items-center justify-center gap-2 bg-blue-300 text-white rounded py-2.5 text-sm font-semibold cursor-not-allowed">
                <RefreshCw size={13} className="animate-spin" />Analyzing…
              </button>
            ) : (
              <>
                <button onClick={analyze} disabled={prompt.trim().length < 8}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:bg-blue-200 disabled:cursor-not-allowed text-white rounded py-2.5 text-sm font-semibold transition-colors">
                  <Shield size={13} />{phase === "analyzed" ? "Re-analyze" : "Analyze Request"}
                </button>
                {(prompt || phase === "analyzed") && (
                  <button onClick={() => { setPrompt(""); reset(); }} className="px-4 border border-gray-200 text-gray-600 rounded text-sm hover:bg-gray-50 transition-colors">Reset</button>
                )}
              </>
            )}
          </div>

          {/* Highlight legend */}
          {phase === "analyzed" && result && result.matches.length > 0 && (
            <div className="bg-white border border-gray-200 rounded p-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Detection Legend</p>
              <div className="flex flex-wrap gap-1.5">
                {[...new Map(result.matches.map(m => [m.type, m])).values()].map(m => (
                  <span key={m.type} className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                    style={{ background: m.color.bg, border: `1px solid ${m.color.border}`, color: m.color.text }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color.border, display: "inline-block", flexShrink: 0 }} />
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════ RIGHT PANEL ══════════════ */}
        <div className="flex flex-col gap-3">

          {/* Idle placeholder */}
          {phase === "idle" && (
            <div className="bg-white border border-gray-200 rounded p-8 flex flex-col items-center justify-center text-center flex-1" style={{ minHeight: 420 }}>
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                <Shield size={26} className="text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1.5">AI Governance Analysis</p>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[220px] mb-6">
                Enter your prompt and click Analyze Request. The Guardian will scan, score, and guide you.
              </p>
              <div className="space-y-2.5 text-left w-full max-w-[200px]">
                {[["Sensitive data detection","47 DLP patterns"],["Policy compliance check","12 active policies"],["Risk scoring & reasoning","0–100 score"],["Auto-redaction & safe fix","instant"]].map(([f, d]) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle size={12} className="text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{f}</p>
                      <p className="text-xs text-gray-400">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline */}
          {phase === "analyzing" && (
            <div className="bg-white border border-gray-200 rounded overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Governance Pipeline</span>
                <span className="text-xs text-gray-400 font-mono">{doneCount}/{STAGES.length} stages</span>
              </div>
              <div className="p-3 space-y-1.5">
                {STAGES.map((s, i) => <StageRow key={s.id} stage={s} status={statuses[i]} message={msgs[i]} />)}
              </div>
              <div className="px-3 pb-3">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-1 bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${(doneCount / STAGES.length) * 100}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {(phase === "analyzed" || phase === "safe") && result && (
            <>
              {/* Risk score + decision header */}
              <div className={`bg-white border border-gray-200 rounded overflow-hidden border-l-4 ${result.decision === "blocked" ? "border-l-red-500" : result.decision === "warning" ? "border-l-amber-500" : "border-l-green-500"}`}>
                <div className={`px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 ${result.decision === "blocked" ? "bg-red-50" : result.decision === "warning" ? "bg-amber-50" : "bg-green-50"}`}>
                  {result.decision === "blocked" ? <XCircle size={13} className="text-red-600" /> : result.decision === "warning" ? <AlertTriangle size={13} className="text-amber-600" /> : <CheckCircle size={13} className="text-green-600" />}
                  <span className={`text-xs font-semibold ${result.decision === "blocked" ? "text-red-800" : result.decision === "warning" ? "text-amber-800" : "text-green-800"}`}>
                    {phase === "safe" ? "Prompt Compliant — Ready to Submit" : result.decision === "blocked" ? "Request Blocked — Action Required" : result.decision === "warning" ? "Warning — Review Required" : "Request Approved"}
                  </span>
                  <span className="ml-auto text-xs text-gray-400 font-mono">REQ-{String(Date.now()).slice(-4)}</span>
                </div>

                <div className="p-4 flex items-center gap-5">
                  <RiskGauge
                    score={phase === "safe" ? result.safeScore : result.riskScore}
                    animateFrom={phase === "safe" ? result.riskScore : undefined}
                  />
                  <div className="flex-1 space-y-2.5">
                    <p className="text-xs text-gray-600 leading-relaxed">{phase === "safe" ? `Sensitive data removed. Risk reduced from ${result.riskScore} → ${result.safeScore}. Prompt is now compliant.` : result.reasoning}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {phase !== "safe" ? [
                        result.matches.filter(m => m.severity === "critical").length > 0 && { l: `${result.matches.filter(m => m.severity === "critical").length} Critical`, c: "bg-red-100 text-red-700 ring-red-200" },
                        result.matches.filter(m => m.severity === "high").length > 0 && { l: `${result.matches.filter(m => m.severity === "high").length} High`, c: "bg-orange-100 text-orange-700 ring-orange-200" },
                        result.violations.length > 0 && { l: `${result.violations.length} Violations`, c: "bg-amber-100 text-amber-700 ring-amber-200" },
                      ].filter(Boolean).map((b: any) => (
                        <span key={b.l} className={`text-xs font-bold px-1.5 py-0.5 rounded ring-1 ${b.c}`}>{b.l}</span>
                      )) : (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded ring-1 bg-green-100 text-green-700 ring-green-200">Compliant</span>
                      )}
                    </div>
                    {phase === "safe" && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <ArrowRight size={10} />
                        <span>Risk <span className="line-through text-red-400">{result.riskScore}</span> → <span className="font-bold text-green-600">{result.safeScore}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detected sensitive data */}
              {phase !== "safe" && result.matches.length > 0 && (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Detected Sensitive Data</span>
                    <span className="text-xs font-mono text-gray-400">{result.matches.length} items</span>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
                    {result.matches.map((m, i) => (
                      <div key={i} className="px-4 py-2.5 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: m.color.border }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-xs font-semibold text-gray-800">{m.label}</span>
                            <ClassBadge c={m.classification} />
                            <SeverityBadge s={m.severity} />
                          </div>
                          <p className="text-xs text-gray-400 font-mono truncate">"{m.value.length > 44 ? m.value.slice(0, 44) + "…" : m.value}"</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{m.reason.slice(0, 85)}…</p>
                        </div>
                        <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">{m.redactWith}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policy violations */}
              {phase !== "safe" && result.violations.length > 0 && (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Policy Violations</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {result.violations.map((v, i) => (
                      <div key={i}>
                        <button onClick={() => setExpanded(expanded === i ? null : i)}
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                          <XCircle size={13} className="text-red-500 flex-shrink-0" />
                          <span className="text-xs font-semibold text-gray-800 flex-1 leading-tight">{v.policy}</span>
                          <SeverityBadge s={v.severity} />
                          {expanded === i ? <ChevronDown size={12} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />}
                        </button>
                        {expanded === i && (
                          <div className="px-4 pb-3 pt-1 bg-red-50/40 border-t border-red-50 text-xs space-y-1.5">
                            <p className="text-gray-600"><span className="font-semibold text-gray-800">Violation:</span> {v.reason}</p>
                            <p className="text-gray-600"><span className="font-semibold text-gray-800">Business impact:</span> {v.impact}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendation — Before / After */}
              {phase !== "safe" && result.matches.length > 0 && (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <Lightbulb size={13} className="text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700">Recommendation</span>
                    <span className="ml-auto text-xs text-blue-600 font-semibold">Safe version ready</span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800 leading-relaxed">
                      <Info size={12} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      Sensitive data detected. Replace identifiable information before sending to external AI. A compliant version has been automatically prepared below.
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1"><XCircle size={10} />Original — Blocked</p>
                        <div className="bg-red-50/50 border border-red-100 rounded p-2.5 font-mono text-gray-700 leading-relaxed"
                          style={{ maxHeight: 160, overflowY: "auto", fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {prompt}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1"><CheckCircle size={10} />Safe Version — Compliant</p>
                        <div className="bg-green-50/50 border border-green-100 rounded p-2.5 font-mono text-gray-700 leading-relaxed"
                          style={{ maxHeight: 160, overflowY: "auto", fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {result.redactedPrompt}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-0.5">
                      <ArrowRight size={11} className="text-gray-400" />
                      Risk score will drop from{" "}
                      <span className="font-bold text-red-600">{result.riskScore}</span> → <span className="font-bold text-green-600">{result.safeScore}</span>{" "}
                      after applying the safe version
                    </div>
                  </div>

                  <div className="px-4 pb-4 flex gap-2 flex-wrap border-t border-gray-100 pt-3">
                    <button onClick={applySafe}
                      className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white rounded px-3 py-2 text-xs font-semibold transition-colors">
                      <CheckCircle size={12} />Use Safe Version
                    </button>
                    <button onClick={() => { setPhase("idle"); }}
                      className="flex items-center gap-1.5 border border-gray-200 text-gray-700 rounded px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors">
                      <Edit size={12} />Edit Manually
                    </button>
                    <button onClick={() => showToast("Exception request submitted to Security Admin for review.")}
                      className="flex items-center gap-1.5 border border-amber-200 text-amber-700 rounded px-3 py-2 text-xs font-medium hover:bg-amber-50 transition-colors">
                      <Lock size={12} />Request Exception
                    </button>
                    <button onClick={reset}
                      className="flex items-center gap-1.5 border border-gray-200 text-gray-500 rounded px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors ml-auto">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Approval required */}
              {phase !== "safe" && hasRestricted && (
                <div className="bg-amber-50 border border-amber-200 rounded p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Security Admin Approval Required</p>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        This request contains <span className="font-semibold">Restricted</span> data. Even with full redaction, the use case requires explicit Security Admin sign-off. An approval request will be automatically created on submission.
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-amber-600">
                        <span className="flex items-center gap-1"><Clock size={10} />Est. review: 2–4 hours</span>
                        <span>Assignee: Security Team</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Approved — no issues */}
              {phase !== "safe" && result.matches.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-5 flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">No sensitive data detected</p>
                    <p className="text-xs text-green-700 mt-1 leading-relaxed">Your prompt is compliant with all active governance policies. Click Submit Request to send it through the governance gateway.</p>
                    <button onClick={() => { showToast("Request submitted securely via governance gateway."); setTimeout(reset, 1500); }}
                      className="mt-3 flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white rounded px-3 py-2 text-xs font-semibold transition-colors">
                      <CheckCircle size={12} />Submit Request
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {hovered && <HighlightTooltip match={hovered.match} rect={hovered.rect} />}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
