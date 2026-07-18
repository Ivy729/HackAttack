import { useState, useEffect, useRef } from "react";
import {
  TrendingUp, TrendingDown, Lightbulb, Info, Filter,
  CheckCircle, XCircle, Download, FileText, ClipboardList,
  DollarSign, Target, AlertTriangle,
  ArrowRight, Briefcase, Activity,
} from "lucide-react";
import {
  AreaChart, Area, BarChart as RBarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import {
  tooltipStyle, Tip,
  ROI_ADOPTION_TREND, ROI_DEPT_PRODUCTIVITY, ROI_TIME_SAVED, ROI_USAGE_FREQ,
  COST_BY_DEPT, COST_BY_TOOL, COST_BY_VENDOR, COST_MONTHLY, COST_FORECAST, COST_RECOMMENDATIONS,
  ADVISOR_RECS, EXEC_HEALTH, type AdvisorCategory,
} from "./shared";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function AnimatedCounter({ value, duration = 900, decimals = 0, prefix = "", suffix = "" }: {
  value: number; duration?: number; decimals?: number; prefix?: string; suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    start.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start.current === null) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString();
  return <span className="tabular-nums">{prefix}{formatted}{suffix}</span>;
}

function Toast({ msg, type }: { msg: string; type: "success" | "error" | "info" }) {
  const bg = type === "success" ? "#14532d" : type === "error" ? "#7f1d1d" : "#1e3a5f";
  const border = type === "success" ? "#166534" : type === "error" ? "#991b1b" : "#1e40af";
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl border text-xs font-medium text-white"
      style={{ animation: "fadeUp 0.2s ease", background: bg, borderColor: border }}>
      {type === "success" ? <CheckCircle size={13} /> : type === "error" ? <XCircle size={13} /> : <Info size={13} />}
      {msg}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const show = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };
  return { toast, show };
}

function FilterBar({ dept, setDept, range, setRange, tool, setTool, role, setRole, onReset }: {
  dept: string; setDept: (v: string) => void;
  range: string; setRange: (v: string) => void;
  tool: string; setTool: (v: string) => void;
  role: string; setRole: (v: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
      <Filter size={12} className="text-gray-400" />
      <select value={dept} onChange={e => setDept(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-gray-600 bg-white focus:outline-none">
        <option value="all">All departments</option>
        {["Engineering","Marketing","Sales","Finance","Legal","HR"].map(d => <option key={d} value={d.toLowerCase()}>{d}</option>)}
      </select>
      <select value={range} onChange={e => setRange(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-gray-600 bg-white focus:outline-none">
        <option value="30d">Last 30 days</option>
        <option value="90d">Last 90 days</option>
        <option value="6m">Last 6 months</option>
        <option value="12m">Last 12 months</option>
      </select>
      <select value={tool} onChange={e => setTool(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-gray-600 bg-white focus:outline-none">
        <option value="all">All AI tools</option>
        <option value="copilot">Copilot</option>
        <option value="chatgpt">ChatGPT</option>
        <option value="claude">Claude</option>
        <option value="gemini">Gemini</option>
      </select>
      <select value={role} onChange={e => setRole(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-gray-600 bg-white focus:outline-none">
        <option value="all">All roles</option>
        <option value="developer">Developer</option>
        <option value="analyst">Analyst</option>
        <option value="standard">Standard</option>
        <option value="power">Power User</option>
      </select>
      <button onClick={onReset} className="text-gray-400 hover:text-gray-600 underline">Reset</button>
    </div>
  );
}

function ChartInsight({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 p-2.5 rounded border border-gray-100 bg-gray-50 text-xs leading-relaxed">
      <Lightbulb size={11} className="text-gray-500 flex-shrink-0 mt-0.5" />
      <p className="text-gray-700"><span className="font-semibold text-gray-800">Insight · </span>{text}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children, actions }: {
  title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub, trend, accent, prefix, suffix, decimals }: {
  label: string; value: number; sub: string; trend?: number | null; accent: string;
  prefix?: string; suffix?: string; decimals?: number;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded hover:border-gray-300 hover:shadow-sm p-4 transition-all">
      <p className={`text-2xl font-bold leading-none mb-2 ${accent}`}>
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      <p className="text-xs font-semibold text-gray-700">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      {trend != null && (
        <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
          {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {Math.abs(trend)}% vs last period
        </p>
      )}
    </div>
  );
}

function MiniGauge({ score, label, size = 88 }: { score: number; label: string; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const cx = size / 2;
  const clr = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f3f4f6" strokeWidth={size * 0.09} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={clr} strokeWidth={size * 0.09}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: "stroke-dashoffset 1.2s ease" }} />
        <text x={cx} y={cx + 4} textAnchor="middle" fontSize={size * 0.22} fontWeight="700" fill={clr} fontFamily="Inter,sans-serif">{score}</text>
      </svg>
      <p className="text-xs text-gray-500 mt-1 text-center">{label}</p>
    </div>
  );
}

const selectCls = "text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 bg-white focus:outline-none";

// ─── Feature 1: AI ROI Dashboard ──────────────────────────────────────────────

export function AIROIDashboard() {
  const [dept, setDept] = useState("all");
  const [range, setRange] = useState("6m");
  const [tool, setTool] = useState("all");
  const [role, setRole] = useState("all");
  const { toast, show } = useToast();

  const deptData = dept === "all"
    ? ROI_DEPT_PRODUCTIVITY
    : ROI_DEPT_PRODUCTIVITY.filter(d => d.dept.toLowerCase() === dept);

  const adoptionData = range === "30d" || range === "90d"
    ? ROI_ADOPTION_TREND.slice(-3)
    : ROI_ADOPTION_TREND;

  const usageData = tool === "all"
    ? ROI_USAGE_FREQ
    : ROI_USAGE_FREQ.filter(t => t.tool.toLowerCase() === tool);

  const topDept = [...ROI_DEPT_PRODUCTIVITY].sort((a, b) => b.gain - a.gain)[0];

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">AI ROI Dashboard</h2>
          <p className="text-xs text-gray-400 mt-0.5">Measurable business impact of AI adoption across the organization</p>
        </div>
        <button onClick={() => show("ROI report exported as PDF", "success")}
          className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded px-3 py-1.5 text-xs font-medium transition-colors">
          <Download size={12} /> Export report
        </button>
      </div>

      <FilterBar dept={dept} setDept={setDept} range={range} setRange={setRange} tool={tool} setTool={setTool} role={role} setRole={setRole}
        onReset={() => { setDept("all"); setRange("6m"); setTool("all"); setRole("all"); }} />

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-4">
        <KpiCard label="Hours Saved" value={1920} sub="this month" trend={18} accent="text-blue-700" />
        <KpiCard label="Est. Cost Savings" value={384000} sub="RM · monthly" trend={22} accent="text-green-700" prefix="RM" />
        <KpiCard label="Productivity Gain" value={34} sub="org-wide average" trend={6} accent="text-slate-700" suffix="%" />
        <KpiCard label="AI Adoption Rate" value={78} sub="active employees" trend={7} accent="text-blue-700" suffix="%" />
        <KpiCard label="Avg Time Saved" value={24} sub="minutes / request" trend={5} accent="text-teal-700" suffix=" min" />
        <KpiCard label="Tasks with AI" value={4450} sub="completed this month" trend={14} accent="text-gray-800" />
        <KpiCard label="Monthly AI ROI" value={4.1} sub="return multiple" trend={12} accent="text-green-700" suffix="×" decimals={1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="AI Adoption Trend" subtitle="Active users over time" actions={
          <select value={range} onChange={e => setRange(e.target.value)} className={selectCls}>
            <option value="90d">90 days</option>
            <option value="6m">6 months</option>
            <option value="12m">12 months</option>
          </select>
        }>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={adoptionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="adoption" name="Adoption %" stroke="#1d4ed8" strokeWidth={1.5} fill="#1d4ed8" fillOpacity={0.08} />
            </AreaChart>
          </ResponsiveContainer>
          <ChartInsight text="Adoption climbed from 42% to 78% in six months — Engineering and Marketing lead growth, with Sales accelerating after Copilot rollout." />
        </ChartCard>

        <ChartCard title="Productivity by Department" subtitle="% improvement vs baseline" actions={
          <select value={dept} onChange={e => setDept(e.target.value)} className={selectCls}>
            <option value="all">All departments</option>
            {ROI_DEPT_PRODUCTIVITY.map(d => <option key={d.dept} value={d.dept.toLowerCase()}>{d.dept}</option>)}
          </select>
        }>
          <ResponsiveContainer width="100%" height={200}>
            <RBarChart data={deptData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="%" />
              <YAxis dataKey="dept" type="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={72} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="gain" name="Productivity %" fill="#475569" radius={[0, 2, 2, 0]} />
            </RBarChart>
          </ResponsiveContainer>
          <ChartInsight text={`${topDept.dept} achieved the highest productivity gains this month by reducing software documentation time by ${topDept.gain}%, saving approximately ${topDept.hours} working hours.`} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard title="Time Saved Over Time" subtitle="Hours per week">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={ROI_TIME_SAVED}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="hours" name="Hours" stroke="#0e7490" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <ChartInsight text="Weekly hours saved rose 59% from W1 to W8, correlating with Copilot seat expansion in Engineering." />
        </ChartCard>

        <ChartCard title="Top-Performing Departments" subtitle="Hours saved this month">
          <ResponsiveContainer width="100%" height={180}>
            <RBarChart data={[...ROI_DEPT_PRODUCTIVITY].sort((a, b) => b.hours - a.hours).slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="dept" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="hours" name="Hours" fill="#1d4ed8" radius={[2, 2, 0, 0]} />
            </RBarChart>
          </ResponsiveContainer>
          <ChartInsight text="Engineering and Marketing account for 64% of total hours saved — prioritize enablement playbooks for Finance and HR next." />
        </ChartCard>

        <ChartCard title="AI Usage Frequency" subtitle="Requests by tool" actions={
          <select value={tool} onChange={e => setTool(e.target.value)} className={selectCls}>
            <option value="all">All tools</option>
            {ROI_USAGE_FREQ.map(t => <option key={t.tool} value={t.tool.toLowerCase()}>{t.tool}</option>)}
          </select>
        }>
          <ResponsiveContainer width="100%" height={180}>
            <RBarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="tool" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="requests" name="Requests" fill="#475569" radius={[2, 2, 0, 0]} />
            </RBarChart>
          </ResponsiveContainer>
          <ChartInsight text="Copilot leads usage volume; Claude shows highest productivity per request in Legal and Finance workflows." />
        </ChartCard>
      </div>

      <ChartCard title="Monthly ROI Growth" subtitle="Return multiple on AI investment">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={adoptionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="×" />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="roi" name="ROI ×" stroke="#15803d" strokeWidth={1.5} fill="#15803d" fillOpacity={0.08} />
          </AreaChart>
        </ResponsiveContainer>
        <ChartInsight text="Monthly ROI grew from 1.4× to 4.1× — every RM1 invested in AI tooling now returns RM4.10 in productivity value." />
      </ChartCard>

      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Business Value Summary</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: DollarSign, label: "Annual Savings", value: "RM4.6M", tip: "Projected from current monthly savings run-rate", trend: "+22%", color: "text-green-700" },
            { icon: Activity, label: "Employee Efficiency", value: "+34%", tip: "Average productivity improvement across active AI users", trend: "+6pts", color: "text-slate-700" },
            { icon: Activity, label: "Operational Impact", value: "4,450", tip: "Tasks completed with AI assistance this month", trend: "+14%", color: "text-blue-700" },
            { icon: Target, label: "Return on AI Investment", value: "4.1×", tip: "Productivity value ÷ licensing & enablement cost", trend: "+0.7×", color: "text-teal-700" },
          ].map(c => (
            <Tip key={c.label} text={c.tip}>
              <div className="bg-white border border-gray-200 rounded p-4 hover:shadow-sm transition-all cursor-help">
                <div className="flex items-center gap-2 mb-2">
                  <c.icon size={13} className="text-gray-500" />
                  <p className="text-xs font-semibold text-gray-500">{c.label}</p>
                </div>
                <p className={`text-2xl font-bold tabular-nums ${c.color}`}>{c.value}</p>
                <p className="text-xs text-green-600 font-medium mt-1.5">{c.trend} vs prior period</p>
              </div>
            </Tip>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature 2: Cost & License Optimization ───────────────────────────────────

export function CostLicenseDashboard() {
  const [dept, setDept] = useState("all");
  const [range, setRange] = useState("6m");
  const [tool, setTool] = useState("all");
  const [role, setRole] = useState("all");
  const { toast, show } = useToast();

  const spendByDept = dept === "all" ? COST_BY_DEPT : COST_BY_DEPT.filter(d => d.dept.toLowerCase() === dept);
  const licenseData = tool === "all" ? COST_BY_TOOL : COST_BY_TOOL.filter(t => t.tool.toLowerCase() === tool);
  const monthly = range === "90d" ? COST_MONTHLY.slice(-3) : COST_MONTHLY;

  const totalLicenses = COST_BY_TOOL.reduce((s, t) => s + t.licenses, 0);
  const activeLicenses = COST_BY_TOOL.reduce((s, t) => s + t.active, 0);
  const unusedLicenses = COST_BY_TOOL.reduce((s, t) => s + t.unused, 0);
  const utilRate = Math.round((activeLicenses / totalLicenses) * 100);
  const optScore = 71;

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">AI Cost & License Optimization</h2>
          <p className="text-xs text-gray-400 mt-0.5">Monitor subscription costs and optimize software licensing</p>
        </div>
        <button onClick={() => show("Cost optimization report exported", "success")}
          className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded px-3 py-1.5 text-xs font-medium transition-colors">
          <Download size={12} /> Export report
        </button>
      </div>

      <FilterBar dept={dept} setDept={setDept} range={range} setRange={setRange} tool={tool} setTool={setTool} role={role} setRole={setRole}
        onReset={() => { setDept("all"); setRange("6m"); setTool("all"); setRole("all"); }} />

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-4">
        <KpiCard label="Monthly AI Spending" value={95900} sub="RM · current month" trend={8} accent="text-blue-700" prefix="RM" />
        <KpiCard label="Annual AI Spending" value={1150800} sub="RM · run-rate" trend={11} accent="text-gray-800" prefix="RM" />
        <KpiCard label="Active Licenses" value={activeLicenses} sub={`of ${totalLicenses} total`} trend={4} accent="text-green-700" />
        <KpiCard label="Inactive Licenses" value={unusedLicenses} sub="zero usage 45d+" trend={-12} accent="text-red-700" />
        <KpiCard label="License Utilization" value={utilRate} sub="active / total seats" trend={3} accent="text-slate-700" suffix="%" />
        <KpiCard label="Potential Savings" value={15400} sub="RM / month identified" trend={null} accent="text-amber-700" prefix="RM" />
        <KpiCard label="Avg Cost Per User" value={129} sub="RM / active seat" trend={-5} accent="text-teal-700" prefix="RM" />
        <KpiCard label="Budget Status" value={92} sub="of Q3 budget used" trend={null} accent="text-amber-700" suffix="%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded p-5 flex flex-col items-center justify-center gap-2">
          <MiniGauge score={optScore} label="Cost Optimization Score" size={100} />
          <p className="text-xs text-gray-400 text-center">Moderate — reclaim unused seats to reach 85+</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div className="h-1.5 rounded-full bg-amber-500 transition-all" style={{ width: `${optScore}%` }} />
          </div>
          <p className="text-xs font-semibold text-green-700 mt-1">Est. yearly savings: RM184,800</p>
        </div>
        <div className="lg:col-span-2 grid grid-cols-3 gap-3">
          {COST_FORECAST.map(f => (
            <div key={f.period} className="bg-white border border-gray-200 rounded p-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">{f.label}</p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">RM{(f.projected / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-400 mt-1">Projected spend</p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: f.period === "3 mo" ? "35%" : f.period === "6 mo" ? "55%" : "85%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Spending by Department" subtitle="RM this month">
          <ResponsiveContainer width="100%" height={200}>
            <RBarChart data={spendByDept} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="dept" type="category" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={72} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `RM${v.toLocaleString()}`} />
              <Bar dataKey="spend" name="Spend (RM)" fill="#1d4ed8" radius={[0, 2, 2, 0]} />
            </RBarChart>
          </ResponsiveContainer>
          <ChartInsight text="Engineering represents 45% of AI spend — aligned with the highest ROI, but Claude underutilization is concentrated there." />
        </ChartCard>

        <ChartCard title="Spending by AI Tool" subtitle="RM this month">
          <ResponsiveContainer width="100%" height={200}>
            <RBarChart data={licenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="tool" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `RM${v.toLocaleString()}`} />
              <Bar dataKey="spend" name="Spend (RM)" fill="#475569" radius={[2, 2, 0, 0]} />
            </RBarChart>
          </ResponsiveContainer>
          <ChartInsight text="Claude has the second-highest spend but lowest utilization (52%) — primary optimization target this quarter." />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Spending by Vendor" subtitle="RM this month">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={COST_BY_VENDOR} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={2} dataKey="spend" nameKey="vendor">
                {["#1d4ed8", "#475569", "#0f766e", "#15803d"].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `RM${v.toLocaleString()}`} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <ChartInsight text="Microsoft and Anthropic together represent 62% of vendor spend — negotiate volume commitments before Q4 renewals." />
        </ChartCard>

        <ChartCard title="Monthly Spend Trend" subtitle="RM over time">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `RM${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="spend" name="Spend" stroke="#b45309" strokeWidth={1.5} fill="#b45309" fillOpacity={0.08} />
            </AreaChart>
          </ResponsiveContainer>
          <ChartInsight text="Spend rose 40% since Feb as seats expanded — growth is ROI-positive, but unused licenses now drag efficiency." />
        </ChartCard>
      </div>

      <ChartCard title="License Utilization" subtitle="Active · Underutilized · Unused seats">
        <ResponsiveContainer width="100%" height={220}>
          <RBarChart data={licenseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="tool" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="active" name="Active" stackId="a" fill="#15803d" />
            <Bar dataKey="under" name="Underutilized" stackId="a" fill="#d97706" />
            <Bar dataKey="unused" name="Unused" stackId="a" fill="#b91c1c" radius={[2, 2, 0, 0]} />
          </RBarChart>
        </ResponsiveContainer>
        <ChartInsight text="95 Claude seats are unused or underutilized — reducing from 200 to 140 licenses saves RM9,600/month with negligible productivity impact." />
      </ChartCard>

      <div className="mt-4 bg-white border border-gray-200 rounded p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={13} className="text-gray-500" />
          <p className="text-sm font-semibold text-gray-900">AI Cost Recommendations</p>
          <span className="ml-auto text-xs text-gray-400">Auto-generated · Jul 18</span>
        </div>
        <div className="space-y-2">
          {COST_RECOMMENDATIONS.map(r => (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors">
              <AlertTriangle size={12} className={`flex-shrink-0 mt-0.5 ${r.priority === "high" ? "text-amber-600" : "text-blue-600"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-gray-900">{r.title}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.priority === "high" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"}`}>
                    {r.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{r.detail}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-xs font-bold text-green-700 tabular-nums">{r.impact}</p>
                <button onClick={() => show(`Applied: ${r.title}`, "success")}
                  className="mt-1 text-xs text-blue-600 hover:underline">Apply</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature 3: Executive AI Advisor ──────────────────────────────────────────

const CATEGORY_STYLE: Record<AdvisorCategory, { bg: string; text: string; ring: string }> = {
  "Cost Optimization":        { bg: "bg-amber-50",  text: "text-amber-700",  ring: "ring-amber-200"  },
  "Risk Reduction":           { bg: "bg-red-50",    text: "text-red-700",    ring: "ring-red-200"    },
  "Productivity Improvement": { bg: "bg-slate-50", text: "text-slate-700", ring: "ring-slate-200" },
  "Compliance Enhancement":   { bg: "bg-blue-50",   text: "text-blue-700",   ring: "ring-blue-200"   },
  "AI Adoption":              { bg: "bg-green-50",  text: "text-green-700",  ring: "ring-green-200"  },
};

const PRIORITY_CLS: Record<string, string> = {
  critical: "bg-red-50 text-red-700 ring-1 ring-red-200",
  high:     "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  medium:   "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  low:      "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
};

export function ExecutiveAIAdvisor() {
  const [category, setCategory] = useState<string>("all");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const { toast, show } = useToast();

  const recs = ADVISOR_RECS
    .filter(r => !dismissed.includes(r.id))
    .filter(r => category === "all" || r.category === category);

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Executive AI Advisor</h2>
          <p className="text-xs text-gray-400 mt-0.5">AI-powered decision support — strategic recommendations from live governance data</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => show("Improvement plan created and assigned", "success")}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-1.5 text-xs font-medium transition-colors">
            <ClipboardList size={12} /> Create Improvement Plan
          </button>
          <button onClick={() => show("Executive briefing PDF exported", "success")}
            className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded px-3 py-1.5 text-xs font-medium transition-colors">
            <FileText size={12} /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4 flex items-start gap-3">
        <Lightbulb size={15} className="text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">Daily Executive Summary</p>
            <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">Auto-generated · Jul 18, 2026</span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">{EXEC_HEALTH.summary}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
        <Filter size={12} className="text-gray-400" />
        <select value={category} onChange={e => setCategory(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-gray-600 bg-white focus:outline-none">
          <option value="all">All categories</option>
          {(Object.keys(CATEGORY_STYLE) as AdvisorCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-gray-400 ml-1">{recs.length} recommendations</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        {(Object.keys(CATEGORY_STYLE) as AdvisorCategory[]).map(c => {
          const count = ADVISOR_RECS.filter(r => r.category === c && !dismissed.includes(r.id)).length;
          const s = CATEGORY_STYLE[c];
          return (
            <button key={c} onClick={() => setCategory(category === c ? "all" : c)}
              className={`text-left border rounded p-3 transition-all ${category === c ? `${s.bg} ring-1 ${s.ring}` : "bg-white border-gray-200 hover:border-gray-300"}`}>
              <p className={`text-lg font-bold tabular-nums ${s.text}`}>{count}</p>
              <p className="text-xs text-gray-600 font-medium mt-0.5 leading-tight">{c}</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {recs.length === 0 && (
          <div className="bg-white border border-gray-200 rounded p-8 text-center text-xs text-gray-400">
            No recommendations in this category
          </div>
        )}
        {recs.map(r => {
          const cat = CATEGORY_STYLE[r.category];
          return (
            <div key={r.id} className="bg-white border border-gray-200 rounded p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ring-1 ${cat.bg} ${cat.text} ${cat.ring}`}>{r.category}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_CLS[r.priority]}`}>{r.priority}</span>
                  <span className="text-xs text-gray-400">Confidence {r.confidence}%</span>
                </div>
                <p className="text-xs font-bold text-green-700 tabular-nums">{r.savings}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-2">{r.title}</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3 text-xs">
                <div className="bg-gray-50 border border-gray-100 rounded p-2.5">
                  <p className="text-gray-400 font-medium mb-1">Business problem</p>
                  <p className="text-gray-700 leading-relaxed">{r.problem}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded p-2.5">
                  <p className="text-gray-400 font-medium mb-1">Supporting evidence</p>
                  <p className="text-gray-700 leading-relaxed">{r.evidence}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded p-2.5">
                  <p className="text-gray-400 font-medium mb-1">Estimated impact</p>
                  <p className="text-gray-700 leading-relaxed">{r.impact}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${r.confidence}%` }} />
                </div>
                <span className="text-xs text-gray-500 tabular-nums">{r.confidence}%</span>
              </div>
              <p className="text-xs text-gray-600 mb-3"><span className="font-semibold text-gray-800">Recommended action: </span>{r.action}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setDismissed(d => [...d, r.id]); show("Recommendation approved", "success"); }}
                  className="text-xs px-3 py-1.5 rounded font-medium bg-blue-700 hover:bg-blue-600 text-white transition-colors">
                  Approve Recommendation
                </button>
                <button onClick={() => show(`Assigned to department owner`, "info")}
                  className="text-xs px-3 py-1.5 rounded font-medium bg-white border border-gray-200 hover:border-gray-300 text-gray-700 transition-colors">
                  Assign to Department
                </button>
                <button onClick={() => show("Report generated for this recommendation", "success")}
                  className="text-xs px-3 py-1.5 rounded font-medium bg-white border border-gray-200 hover:border-gray-300 text-gray-700 transition-colors">
                  Generate Report
                </button>
                <button onClick={() => show("PDF exported", "success")}
                  className="text-xs px-3 py-1.5 rounded font-medium bg-white border border-gray-200 hover:border-gray-300 text-gray-700 transition-colors">
                  Export PDF
                </button>
                <button onClick={() => show("Improvement plan draft created", "success")}
                  className="text-xs px-3 py-1.5 rounded font-medium bg-white border border-gray-200 hover:border-gray-300 text-gray-700 transition-colors">
                  Create Improvement Plan
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dashboard Executive Intelligence section ─────────────────────────────────

export function ExecutiveIntelligenceBanner({ onNav }: {
  onNav: (s: "exec-roi" | "exec-cost" | "exec-advisor") => void;
}) {
  const factors = [
    { label: "AI ROI", value: `${EXEC_HEALTH.roi}×`, tip: "Monthly productivity return on AI investment" },
    { label: "Compliance", value: `${EXEC_HEALTH.compliance}%`, tip: "Org-wide policy compliance rate" },
    { label: "Adoption", value: `${EXEC_HEALTH.adoption}%`, tip: "Employees actively using approved AI tools" },
    { label: "Cost Efficiency", value: `${EXEC_HEALTH.costEfficiency}%`, tip: "License utilization and spend efficiency" },
    { label: "Risk Level", value: `${EXEC_HEALTH.risk}`, tip: "High-risk events requiring attention (lower is better)" },
    { label: "Gov. Maturity", value: `${EXEC_HEALTH.maturity}%`, tip: "Policy coverage, workflow automation, and audit readiness" },
  ];

  return (
    <div className="space-y-4 mb-4">
      <div className="bg-white border border-gray-200 rounded p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <Briefcase size={14} className="text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Executive Intelligence</p>
              <p className="text-xs text-gray-400">AI Business Health · updated daily</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => onNav("exec-roi")} className="text-xs px-3 py-1.5 rounded font-medium bg-blue-700 hover:bg-blue-600 text-white transition-colors flex items-center gap-1">
              AI ROI <ArrowRight size={11} />
            </button>
            <button onClick={() => onNav("exec-cost")} className="text-xs px-3 py-1.5 rounded font-medium bg-white border border-gray-200 hover:border-gray-300 text-gray-700 transition-colors">
              Cost & Licenses
            </button>
            <button onClick={() => onNav("exec-advisor")} className="text-xs px-3 py-1.5 rounded font-medium bg-white border border-gray-200 hover:border-gray-300 text-gray-700 transition-colors">
              AI Advisor
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="flex flex-col items-center justify-center gap-1 border border-gray-100 rounded p-4 bg-gray-50">
            <MiniGauge score={EXEC_HEALTH.score} label="AI Business Health" size={100} />
            <p className="text-xs text-green-600 font-medium">↑ 4pts from last week</p>
          </div>
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {factors.map(f => (
                <Tip key={f.label} text={f.tip}>
                  <div className="bg-white border border-gray-100 rounded p-2.5 cursor-help hover:border-gray-200 transition-colors">
                    <p className="text-sm font-bold text-gray-900 tabular-nums">{f.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{f.label}</p>
                  </div>
                </Tip>
              ))}
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded border border-gray-100 bg-white text-xs leading-relaxed">
              <Lightbulb size={11} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-800 mb-0.5">Executive Summary</p>
                <p className="text-gray-600">{EXEC_HEALTH.summary}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
